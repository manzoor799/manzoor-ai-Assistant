import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { IconUpload, IconSend } from './icons';
import { ProcessingState } from '../types';

export const ImageEditInterface: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalMimeType, setOriginalMimeType] = useState<string>('image/jpeg');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<ProcessingState>({ isLoading: false, error: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to resize image before sending to API to avoid payload size errors
  const resizeAndConvertImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1024; // Limit to 1024px to prevent "Rpc failed due to xhr error"

          if (width > MAX_SIZE || height > MAX_SIZE) {
            const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas context error"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          // Use JPEG for efficiency unless strictly PNG. Quality 0.85 is a good balance.
          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(outputType, 0.85);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = (err) => reject(err);
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await resizeAndConvertImage(file);
        setOriginalImage(base64);
        setOriginalMimeType(file.type === 'image/png' ? 'image/png' : 'image/jpeg');
        setResultImage(null);
        setResultText(null);
      } catch (err) {
        console.error("Image processing error:", err);
        setStatus({ isLoading: false, error: "Failed to process image. Please try another." });
      }
    }
  };

  const handleEdit = async () => {
    if (!originalImage || !prompt) return;

    setStatus({ isLoading: true, error: null });
    try {
      const { image, text } = await editImage(originalImage, originalMimeType, prompt);
      if (image) setResultImage(image);
      if (text) setResultText(text);
      if (!image && !text) throw new Error("No changes returned from model.");
    } catch (err: any) {
      console.error(err);
      setStatus({ isLoading: false, error: err.message || "An error occurred during generation." });
    } finally {
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-white rounded-lg shadow-sm border border-gray-100 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Magic Editor</h2>
        <p className="text-gray-500 text-sm">Powered by Gemini 2.5 Flash Image ("Nano Banana")</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        {/* Input Side */}
        <div className="flex flex-col space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
              originalImage ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            {originalImage ? (
              <img src={`data:${originalMimeType};base64,${originalImage}`} className="max-h-64 md:max-h-80 object-contain rounded-lg shadow-sm" alt="Original" />
            ) : (
              <div className="text-center text-gray-400">
                <IconUpload />
                <span className="block mt-2 text-sm font-medium">Upload Image to Edit</span>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'Add a retro filter' or 'Make it snowy'"
              className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleEdit}
              disabled={status.isLoading || !originalImage || !prompt}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {status.isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                 <IconSend />
              )}
            </button>
          </div>
          {status.error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{status.error}</p>}
        </div>

        {/* Result Side */}
        <div className="flex flex-col bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Result</h3>
            <div className="flex-1 flex items-center justify-center">
                 {resultImage ? (
                     <div className="space-y-4 w-full">
                         <img src={`data:image/jpeg;base64,${resultImage}`} className="w-full h-auto rounded-lg shadow-md border border-gray-200" alt="Edited" />
                         {resultText && <p className="text-sm text-gray-600 p-3 bg-white rounded-lg border border-gray-100 italic">"{resultText}"</p>}
                     </div>
                 ) : status.isLoading ? (
                     <div className="text-center text-gray-400 animate-pulse">
                         <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
                         <p>Generating magic...</p>
                     </div>
                 ) : (
                     <p className="text-gray-400 text-sm">Edited image will appear here</p>
                 )}
            </div>
        </div>
      </div>
    </div>
  );
};