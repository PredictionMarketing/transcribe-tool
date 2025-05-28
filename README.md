# Audio/Video Transcription Tool

A web application that transcribes audio from YouTube, Spotify, SoundCloud, and other sources using OpenAI's Whisper API.

## Features

- Transcribe audio from YouTube videos
- Transcribe audio from Spotify tracks (requires API integration)
- Transcribe audio from SoundCloud (requires API integration)
- Transcribe audio from generic URLs
- Upload and transcribe local audio/video files
- Copy transcription to clipboard
- Download transcription as a text file

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```
4. Start the development server:
   ```
   pnpm run dev
   ```
5. Start the backend server:
   ```
   pnpm run server
   ```

## Requirements

- Node.js
- FFmpeg (for audio extraction from videos)
- OpenAI API key

## Technical Notes

- The frontend is built with React and Vite
- The backend is built with Express
- YouTube audio extraction is handled with ytdl-core
- Transcription is performed using OpenAI's Whisper API
- File uploads are handled with multer
- Audio extraction from video files is handled with FFmpeg

## Limitations

- Spotify and SoundCloud transcription require API integration and are not fully implemented
- The application requires FFmpeg to be installed on the server for video processing
