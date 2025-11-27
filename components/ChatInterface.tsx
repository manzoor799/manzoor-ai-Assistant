import React, { useState, useRef, useEffect } from 'react';
import { chatWithManzoor, transcribeAudio } from '../services/geminiService';
import { ChatMessage, ProcessingState } from '../types';
import { IconSend, IconImage, IconMic } from './icons';
import { convertBlobToBase64 } from '../utils/audioUtils';

export const ChatInterface: React.FC = () => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingState>({ isLoading: false, error: null });
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, status.isLoading, status.error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || status.isLoading) return;

    const userText = input;
    const currentImage = selectedImage;

    setStatus({ isLoading: true, error: null });
    setInput('');
    setSelectedImage(null);

    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;
    
    if (currentImage) {
      try {
        imageBase64 = await convertBlobToBase64(currentImage);
        imageMimeType = currentImage.type;
      } catch (e) {
        setStatus({ isLoading: false, error: "Failed to process image" });
        return;
      }
    }

    const newMessage: ChatMessage = { 
      role: 'user', 
      text: userText, 
      image: imageBase64,
      imageMimeType: imageMimeType 
    };
    setHistory(prev => [...prev, newMessage]);

    try {
      const responseText = await chatWithManzoor(history, userText, imageBase64, imageMimeType);
      setHistory(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (err: any) {
      setStatus({ isLoading: false, error: err.message });
    } finally {
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setStatus({ isLoading: true, error: null });
        try {
          const base64 = await convertBlobToBase64(audioBlob);
          const text = await transcribeAudio(base64, 'audio/webm');
          setInput(prev => prev + (prev ? ' ' : '') + text);
        } catch (e: any) {
          setStatus({ isLoading: false, error: "Dictation failed: " + e.message });
        } finally {
          setStatus(prev => ({ ...prev, isLoading: false }));
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      setStatus({ isLoading: false, error: "Mic access denied" });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-urdu">منظور (Manzoor)</h2>
          <p className="text-xs opacity-80">AI Assistant (Gemini 3 Pro / 2.5 Flash)</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-hide">
        {history.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-lg font-urdu mb-2">السلام علیکم! میں آپ کی کیا مدد کر سکتا ہوں؟</p>
            <p className="text-sm">Ask me anything in Urdu or English.</p>
          </div>
        )}
        
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
            }`}>
              {msg.image && (
                <img 
                  src={`data:${msg.imageMimeType || 'image/jpeg'};base64,${msg.image}`} 
                  alt="User upload" 
                  className="mb-2 rounded-lg max-h-48 object-cover border border-indigo-400/30"
                />
              )}
              <p className="whitespace-pre-wrap font-urdu leading-relaxed text-base">{msg.text}</p>
            </div>
          </div>
        ))}
        {status.isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-500 rounded-2xl rounded-bl-none p-4 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        {status.error && (
          <div className="mx-auto max-w-lg p-4 mb-4 text-red-800 border border-red-200 rounded-lg bg-red-50" role="alert">
             <span className="text-sm">{status.error}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-end space-x-2">
           <button
            onClick={() => fileInputRef.current?.click()}
            className={`p-3 rounded-full hover:bg-gray-100 transition-colors ${selectedImage ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
            title="Upload Image"
          >
            <IconImage />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
            className="hidden"
            accept="image/*"
          />
          
          <div className="flex-1 relative">
             {selectedImage && (
                <div className="absolute bottom-full left-0 mb-2 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded flex items-center shadow-sm border border-indigo-100">
                  <span className="truncate max-w-[150px]">{selectedImage.name}</span>
                  <button onClick={() => setSelectedImage(null)} className="ml-2 font-bold hover:text-indigo-900">×</button>
                </div>
             )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="w-full bg-gray-100 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none max-h-32 font-urdu pr-10"
              rows={1}
            />
            {/* Mic button inside input area */}
            <button 
                onClick={handleRecording}
                className={`absolute right-2 bottom-2 p-1.5 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <IconMic />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={status.isLoading || (!input.trim() && !selectedImage)}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <IconSend />
          </button>
        </div>
      </div>
    </div>
  );
};