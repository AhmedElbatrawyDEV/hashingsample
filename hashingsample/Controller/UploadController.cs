using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

namespace hashingsample.Controller {
    [EnableCors("AllowAll")]
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase {
        private readonly string _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        private static readonly ConcurrentDictionary<string, bool[]> UploadedChunks = new();
        public UploadController() {
            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
            }
        }
        [HttpPost("upload")]
        public async Task<IActionResult> UploadChunk([FromForm] IFormFile file, [FromForm] string fileName, [FromForm] int chunkNumber, [FromForm] int totalChunks) {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }
            // Initialize the chunk tracking array if it doesn't exist
            if (!UploadedChunks.ContainsKey(fileName))
            {
                UploadedChunks[fileName] = new bool[totalChunks];
            }
            var chunkFilePath = Path.Combine(_uploadPath, $"{fileName}.part{chunkNumber}");
            try
            {
                using (var stream = new FileStream(chunkFilePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
                // Mark the chunk as uploaded
                UploadedChunks[fileName][chunkNumber - 1] = true;
                return Ok(new { message = "Chunk uploaded successfully.", chunkNumber });
            } catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to upload chunk.", error = ex.Message });
            }
        }
        [HttpPost("complete")]
        public IActionResult CompleteUpload([FromForm] string fileName, [FromForm] int totalChunks) {
            var finalFilePath = Path.Combine(_uploadPath, fileName);
            try
            {
                using (var finalStream = new FileStream(finalFilePath, FileMode.Create))
                {
                    for (int i = 1; i <= totalChunks; i++)
                    {
                        var chunkFilePath = Path.Combine(_uploadPath, $"{fileName}.part{i}");
                        if (System.IO.File.Exists(chunkFilePath))
                        {
                            using (var chunkStream = new FileStream(chunkFilePath, FileMode.Open))
                            {
                                chunkStream.CopyTo(finalStream);
                            }
                            System.IO.File.Delete(chunkFilePath);
                        }
                    }
                }
                // Clear the chunk tracking for this file
                UploadedChunks.TryRemove(fileName, out _);
                return Ok(new { message = "File upload completed successfully.", fileName });
            } catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to complete upload.", error = ex.Message });
            }
        }
        [HttpGet("status")]
        public IActionResult GetUploadStatus([FromQuery] string fileName, [FromQuery] int totalChunks) {
            if (!UploadedChunks.ContainsKey(fileName))
            {
                return Ok(new { uploadedChunks = new bool[totalChunks] });
            }
            return Ok(new { uploadedChunks = UploadedChunks[fileName] });
        }
    }
}
