import { AlertCircle, CheckCircle, Pause, Play, StopCircle, Upload } from "lucide-react";
import React, { useState } from "react";
import axios, { CancelTokenSource } from "axios";

const CHUNK_SIZE = 1024 * 1024; // 1MB
const API_BASE = "https://localhost:7087/api/upload";

const ChunkFileUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "paused" | "completed" | "error">("idle");
  const [error, setError] = useState<string>("");
  const [uploadedChunks, setUploadedChunks] = useState<boolean[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [lastUploadedChunk, setLastUploadedChunk] = useState<number>(0);
  const [cancelSource, setCancelSource] = useState<CancelTokenSource | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setStatus("idle"); 
      setProgress(0);
      setError("");
      setUploadedChunks([]);
      setIsPaused(false);
      setLastUploadedChunk(0);
    }
  };

  const fetchUploadStatus = async (fileName: string, totalChunks: number) => {
    try {
      const response = await axios.get(`${API_BASE}/status`, {
        params: { fileName, totalChunks },
      });
      setUploadedChunks(response.data.uploadedChunks);
      const lastChunk = response.data.uploadedChunks.lastIndexOf(true) + 1;
      setLastUploadedChunk(lastChunk);
      return response.data.uploadedChunks;
    } catch (error) {
      console.error("Error fetching upload status:", error);
      return new Array(totalChunks).fill(false);
    }
  };

  const uploadChunk = async (chunk: Blob, fileName: string, chunkNumber: number, totalChunks: number) => {
    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("fileName", fileName);
    formData.append("chunkNumber", chunkNumber.toString());
    formData.append("totalChunks", totalChunks.toString());

    const source = axios.CancelToken.source();
    setCancelSource(source);

    await axios.post(`${API_BASE}/upload`, formData, { cancelToken: source.token });
  };

  const completeUpload = async (fileName: string, totalChunks: number) => {
    const formData = new FormData();
    formData.append("fileName", fileName);
    formData.append("totalChunks", totalChunks.toString());

    await axios.post(`${API_BASE}/complete`, formData);
  };

  const handleUpload = async () => {
    debugger;
    if (!file) return;

    setStatus("uploading");
    setError("");
    setIsPaused(false);

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const existingChunks = await fetchUploadStatus(file.name, totalChunks);

    for (let chunkNumber = lastUploadedChunk + 1; chunkNumber <= totalChunks; chunkNumber++) {
  
      if (existingChunks[chunkNumber - 1]) {
        setProgress((chunkNumber / totalChunks) * 100);
        continue; // Skip already uploaded chunks
      }

      const start = (chunkNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      try {
        console.log(`Uploading chunk ${chunkNumber}...`);
        await uploadChunk(chunk, file.name, chunkNumber, totalChunks);
        setProgress((chunkNumber / totalChunks) * 100);
        setLastUploadedChunk(chunkNumber);
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Upload paused:", error.message);
          return;
        }
        setError("Error uploading chunk");
        setStatus("error");
        return;
      }
    }

    try {
      await completeUpload(file.name, totalChunks);
      setStatus("completed");
    } catch {
      setError("Error completing upload");
      setStatus("error");
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    setStatus("paused");

    if (cancelSource) {
      cancelSource.cancel("Upload paused by user");
      console.log("Upload paused at chunk:", lastUploadedChunk);
    } else {
      console.warn("No active cancel token source found.");
    }
  };

  const handleResume = () => {
    if (isPaused && file && file.size) {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      if (lastUploadedChunk < totalChunks) {
        setIsPaused(false);
        setStatus("uploading");
        console.log("Resuming upload at chunk:", lastUploadedChunk + 1);
        handleUpload();
      }
    }
  };
  
  const handleCancel = () => {
    setIsPaused(true);
    setStatus("idle");
    setProgress(0);
    setUploadedChunks([]);
    setLastUploadedChunk(0);
    if (cancelSource) cancelSource.cancel("Upload canceled by user");
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg shadow-md space-y-4">
      <label className="flex flex-col items-center border border-dashed p-6 rounded-lg cursor-pointer">
        <Upload className="w-8 h-8 text-gray-500" />
        <span className="text-sm text-gray-500">{file ? file.name : "Select a file"}</span>
        <input type="file" className="hidden" onChange={handleFileChange} />
      </label>

      {file && (
        <>
          <div className="w-full bg-gray-200 rounded h-2">
            <div className="bg-blue-500 h-2 rounded" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="flex space-x-2">
            {status === "uploading" && (
              <button
                onClick={handlePause}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Pause className="w-4 h-4 mr-2" /> Pause
              </button>
            )}
            {status === "paused" && (
              <button
                onClick={handleResume}
                className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Play className="w-4 h-4 mr-2" /> Resume
              </button>
            )}
            {status !== "uploading" && (
              <button
                onClick={handleUpload}
                disabled={status === "completed"}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
              >
                {status === "completed" ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {status === "completed" ? "Uploaded" : "Upload"}
              </button>
            )}
            {status !== "idle" && (
              <button
                onClick={handleCancel}
                className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <StopCircle className="w-4 h-4 mr-2" /> Cancel
              </button>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="text-red-600 text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" /> {error}
        </div>
      )}
    </div>
  );
};

export default ChunkFileUploader;
