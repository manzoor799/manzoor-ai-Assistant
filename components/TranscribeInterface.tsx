import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../services/geminiService';
import { convertBlobToBase64 } from '../utils/audioUtils';
import { IconMic, IconTranscribe } from './icons';
import { ProcessingState } from '../types';

export const TranscribeInterface: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState<ProcessingState>({ isLoading: false, error: null });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Use webm as it is standard for MediaRecorder
        setStatus({ isLoading: true, error: null });
        
        try {
          const base64 = await convertBlobToBase64(audioBlob);
          // mimeType should match what MediaRecorder produces or what Gemini expects (audio/webm usually works for generateContent input in inlineData)
          // gemini-2.5-flash handles various audio formats.
          const text = await transcribeAudio(base64, 'audio/webm');
          setTranscription(text);
        } catch (err: any) {
          setStatus({ isLoading: false, error: err.message });
        } finally {
          setStatus(prev => ({ ...prev, isLoading: false }));
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus({ isLoading: false, error: null });
      setTranscription('');
    } catch (err) {
      console.error(err);
      setStatus({ isLoading: false, error: "Could not access microphone" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Audio Transcription</h2>
        <p className="text-gray-500">Record audio to transcribe (Gemini 2.5 Flash)</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 scale-110 ring-4 ring-red-200' 
              : 'bg-indigo-600 hover:bg-indigo-700 ring-4 ring-indigo-100'
          }`}
        >
          {isRecording ? (
            <div className="w-8 h-8 bg-white rounded-sm" />
          ) : (
            <IconMic />
          )}
        </button>

        {status.isLoading && (
            <div className="text-indigo-600 animate-pulse font-medium">Transcribing audio...</div>
        )}

        {status.error && (
            <div className="text-red-500 bg-red-50 px-4 py-2 rounded-lg text-sm">{status.error}</div>
        )}

        {transcription && (
          <div className="w-full max-w-2xl bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                <span className="mr-2"><IconTranscribe /></span> Result
            </h3>
            <p className="font-urdu text-lg leading-loose text-gray-800 whitespace-pre-wrap">{transcription}</p>
          </div>
        )}
      </div>
    </div>
  );
};
