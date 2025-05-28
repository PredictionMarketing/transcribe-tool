import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { OpenAI } from 'openai';
import { createWriteStream } from 'fs';
import multer from 'multer';
import { spawn } from 'child_process';

// Initialize environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'temp/');
  },
  filename: function (req, file, cb) {
    cb(null, `upload_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Helper function to download file from URL
async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  const fileStream = createWriteStream(outputPath);
  
  return new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on('error', (err) => {
      reject(err);
    });
    fileStream.on('finish', function() {
      resolve();
    });
  });
}

// Helper function to extract audio from video
function extractAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      '-vn',
      '-acodec', 'libmp3lame',
      '-ab', '128k',
      '-ar', '44100',
      outputPath
    ]);

    ffmpeg.stderr.on('data', (data) => {
      console.log(`ffmpeg: ${data}`);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
  });
}

// Route to handle YouTube transcription
app.post('/api/transcribe/youtube', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    // Get video info
    const info = await ytdl.getInfo(url);
    const videoId = info.videoDetails.videoId;
    const videoTitle = info.videoDetails.title;
    
    // Download audio only
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    const audioFormat = audioFormats[0];
    
    const audioPath = path.join(tempDir, `${videoId}.mp3`);
    
    // Download audio
    ytdl(url, { format: audioFormat })
      .pipe(fs.createWriteStream(audioPath))
      .on('finish', async () => {
        try {
          // Transcribe using OpenAI
          const transcription = await transcribeAudio(audioPath);
          
          // Clean up
          fs.unlinkSync(audioPath);
          
          res.json({ 
            title: videoTitle,
            transcription 
          });
        } catch (error) {
          console.error('Transcription error:', error);
          res.status(500).json({ error: 'Failed to transcribe audio' });
        }
      });
  } catch (error) {
    console.error('YouTube processing error:', error);
    res.status(500).json({ error: 'Failed to process YouTube video' });
  }
});

// Route to handle Spotify transcription
app.post('/api/transcribe/spotify', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Note: Spotify API requires authentication and doesn't allow direct audio download
    // This would require a more complex implementation with Spotify API
    
    res.status(501).json({ error: 'Spotify transcription is not yet implemented. This would require Spotify API integration.' });
  } catch (error) {
    console.error('Spotify processing error:', error);
    res.status(500).json({ error: 'Failed to process Spotify track' });
  }
});

// Route to handle SoundCloud transcription
app.post('/api/transcribe/soundcloud', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Note: SoundCloud API requires authentication and doesn't allow direct audio download
    // This would require a more complex implementation with SoundCloud API
    
    res.status(501).json({ error: 'SoundCloud transcription is not yet implemented. This would require SoundCloud API integration.' });
  } catch (error) {
    console.error('SoundCloud processing error:', error);
    res.status(500).json({ error: 'Failed to process SoundCloud audio' });
  }
});

// Route to handle generic URL transcription
app.post('/api/transcribe/url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Generate a unique filename
    const filename = `url_${Date.now()}`;
    const downloadPath = path.join(tempDir, `${filename}.mp3`);
    
    // Download file
    await downloadFile(url, downloadPath);
    
    // Transcribe using OpenAI
    const transcription = await transcribeAudio(downloadPath);
    
    // Clean up
    fs.unlinkSync(downloadPath);
    
    res.json({ transcription });
  } catch (error) {
    console.error('URL processing error:', error);
    res.status(500).json({ error: 'Failed to process audio from URL' });
  }
});

// Route to handle file upload transcription
app.post('/api/transcribe/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    let audioPath = filePath;
    
    // If the file is a video, extract the audio
    if (req.file.mimetype.startsWith('video/')) {
      audioPath = path.join(tempDir, `${path.basename(filePath, path.extname(filePath))}.mp3`);
      await extractAudio(filePath, audioPath);
    }
    
    // Transcribe using OpenAI
    const transcription = await transcribeAudio(audioPath);
    
    // Clean up
    fs.unlinkSync(filePath);
    if (filePath !== audioPath) {
      fs.unlinkSync(audioPath);
    }
    
    res.json({ transcription });
  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({ error: 'Failed to process audio file' });
  }
});

// Function to transcribe audio using OpenAI
async function transcribeAudio(audioPath) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
    });
    
    return transcription.text;
  } catch (error) {
    console.error('OpenAI transcription error:', error);
    throw new Error('Failed to transcribe audio with OpenAI');
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
