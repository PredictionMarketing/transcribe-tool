import React, { useState } from 'react';
import { FaYoutube, FaSpotify, FaSoundcloud, FaLink, FaDownload, FaCopy, FaSpinner } from 'react-icons/fa';
import { MdAudioFile } from 'react-icons/md';
import axios from 'axios';

function App() {
  const [url, setUrl] = useState('');
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('youtube');
  const [file, setFile] = useState(null);

  const API_BASE_URL = 'http://localhost:3001/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedFormat === 'file') {
      if (!file) {
        setError('Please select a file');
        return;
      }
      await handleFileTranscription();
    } else {
      if (!url) {
        setError('Please enter a URL');
        return;
      }
      await handleUrlTranscription();
    }
  };

  const handleUrlTranscription = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setTranscription('');

    try {
      let endpoint;
      
      // Determine the appropriate endpoint based on the selected format
      if (selectedFormat === 'youtube') {
        endpoint = `${API_BASE_URL}/transcribe/youtube`;
      } else if (selectedFormat === 'spotify') {
        endpoint = `${API_BASE_URL}/transcribe/spotify`;
      } else if (selectedFormat === 'soundcloud') {
        endpoint = `${API_BASE_URL}/transcribe/soundcloud`;
      } else {
        endpoint = `${API_BASE_URL}/transcribe/url`;
      }

      // Make the API request
      const response = await axios.post(endpoint, { url });
      
      // Set the transcription from the API response
      setTranscription(response.data.transcription);
      setSuccess(`Successfully transcribed ${selectedFormat === 'youtube' ? 'YouTube video' : 
        selectedFormat === 'spotify' ? 'Spotify track' : 
        selectedFormat === 'soundcloud' ? 'SoundCloud audio' : 
        'audio from URL'}`);
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err.response?.data?.error || 'Failed to transcribe audio. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileTranscription = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setTranscription('');

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Make the API request
      const response = await axios.post(`${API_BASE_URL}/transcribe/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Set the transcription from the API response
      setTranscription(response.data.transcription);
      setSuccess('Successfully transcribed audio file');
    } catch (err) {
      console.error('File transcription error:', err);
      setError(err.response?.data?.error || 'Failed to transcribe audio file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcription);
    setSuccess('Transcription copied to clipboard');
    setTimeout(() => setSuccess(''), 3000);
  };

  const downloadTranscription = () => {
    const element = document.createElement('a');
    const file = new Blob([transcription], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'transcription.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setSuccess('Transcription downloaded');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Audio/Video Transcription Tool</h1>
        <p>Transcribe audio from YouTube, Spotify, SoundCloud, and more</p>
      </header>

      <div className="card">
        <div className="format-selector">
          <div 
            className={`format-option ${selectedFormat === 'youtube' ? 'active' : ''}`}
            onClick={() => setSelectedFormat('youtube')}
          >
            <FaYoutube size={24} />
            <div>YouTube</div>
          </div>
          <div 
            className={`format-option ${selectedFormat === 'spotify' ? 'active' : ''}`}
            onClick={() => setSelectedFormat('spotify')}
          >
            <FaSpotify size={24} />
            <div>Spotify</div>
          </div>
          <div 
            className={`format-option ${selectedFormat === 'soundcloud' ? 'active' : ''}`}
            onClick={() => setSelectedFormat('soundcloud')}
          >
            <FaSoundcloud size={24} />
            <div>SoundCloud</div>
          </div>
          <div 
            className={`format-option ${selectedFormat === 'other' ? 'active' : ''}`}
            onClick={() => setSelectedFormat('other')}
          >
            <FaLink size={24} />
            <div>Other URL</div>
          </div>
          <div 
            className={`format-option ${selectedFormat === 'file' ? 'active' : ''}`}
            onClick={() => setSelectedFormat('file')}
          >
            <MdAudioFile size={24} />
            <div>File Upload</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {selectedFormat !== 'file' && (
            <div className="form-group">
              <label htmlFor="url">Enter {selectedFormat === 'youtube' ? 'YouTube' : selectedFormat === 'spotify' ? 'Spotify' : selectedFormat === 'soundcloud' ? 'SoundCloud' : 'audio/video'} URL:</label>
              <input
                type="text"
                id="url"
                className="form-control"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={`Enter ${selectedFormat === 'youtube' ? 'YouTube' : selectedFormat === 'spotify' ? 'Spotify' : selectedFormat === 'soundcloud' ? 'SoundCloud' : 'audio/video'} URL`}
                disabled={loading}
              />
            </div>
          )}

          {selectedFormat === 'file' && (
            <div className="form-group">
              <label htmlFor="file">Upload audio/video file:</label>
              <input
                type="file"
                id="file"
                className="form-control"
                accept="audio/*,video/*"
                disabled={loading}
                onChange={handleFileChange}
              />
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading || (selectedFormat === 'file' && !file)}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner" /> Transcribing...
              </>
            ) : (
              'Transcribe'
            )}
          </button>
        </form>

        {transcription && (
          <div className="transcription-container">
            <div className="transcription-header">
              <h3>Transcription Result</h3>
              <div className="transcription-actions">
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={copyToClipboard}
                >
                  <FaCopy /> Copy
                </button>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={downloadTranscription}
                >
                  <FaDownload /> Download
                </button>
              </div>
            </div>
            <div className="transcription-content">
              {transcription}
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Audio/Video Transcription Tool. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
