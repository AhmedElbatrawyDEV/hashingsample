import './App.css';

import ChunkFileUploader from "./components/ChunkFileUploader";
import React from 'react';

function App() {
  return (
    <div className="App">
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <ChunkFileUploader />
    </div>
    </div>
  );
}

export default App;
