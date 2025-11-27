import React, { useState, useRef, useEffect } from 'react';
import { chatWithPersona, transcribeAudio, generateSpeech } from '../services/geminiService';
import { convertBlobToBase64, base64ToUint8Array, decodeAudioData } from '../utils/audioUtils';
import { ChatMessage, ProcessingState } from '../types';
import { IconSend, IconMic, IconVolumeUp } from './icons';

interface FeatureChatProps {
  title: string;
  subtitle: string;
  systemInstruction: string;
  initialMessageUrdu: string;
  initialMessageEnglish: string;
  placeholder: string;
  accentColor: string;
}

export const FeatureChat: React.FC<FeatureChatProps> = ({ 
  title, subtitle, systemInstruction, initialMessageUrdu, initialMessageEnglish, placeholder, accentColor
}) => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<ProcessingState>({ isLoading: false, error: null });
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Colors
  const bgColor = `bg-${accentColor}-600`;
  const getTheme = () => {
      switch(accentColor) {
          case 'green': return { bg: 'bg-green-600', light: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-200', btn: 'hover:bg-green-700' };
          case 'emerald': return { bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', btn: 'hover:bg-emerald-700' };
          case 'blue': return { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', btn: 'hover:bg-blue-700' };
          case 'purple': return { bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-200', btn: 'hover:bg-purple-700' };
          case 'orange': return { bg: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', btn: 'hover:bg-orange-700' };
          case 'teal': return { bg: 'bg-teal-600', light: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200', btn: 'hover:bg-teal-700' };
          case 'rose': return { bg: 'bg-rose-600', light: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', btn: 'hover:bg-rose-700' };
          case 'pink': return { bg: 'bg-pink-600', light: 'bg-pink-50', text: 'text-pink-700', ring: 'ring-pink-200', btn: 'hover:bg-pink-700' };
          default: return { bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200', btn: 'hover:bg-indigo-700' };
      }
  };
  const theme = getTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, status.isLoading]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
    };
  }, []);

  // Audio Playback Logic
  const playAudio = async (text: string) => {
      try {
          // Close previous context if exists to stop overlapping audio
          if (audioCtxRef.current) {
              await audioCtxRef.current.close();
          }
          const audioBase64 = await generateSpeech(text);
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          audioCtxRef.current = audioCtx;
          
          const audioBuffer = await decodeAudioData(base64ToUint8Array(audioBase64), audioCtx, 24000, 1);
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtx.destination);
          source.start();
      } catch (e) {
          console.error("TTS failed", e);
      }
  };

  const handleSend = async (overrideText?: string) => {
    const userText = overrideText || input;
    if (!userText.trim() || status.isLoading) return;

    setStatus({ isLoading: true, error: null });
    setInput('');

    const newMessage: ChatMessage = { role: 'user', text: userText };
    setHistory(prev => [...prev, newMessage]);

    try {
      const responseText = await chatWithPersona(history, userText, systemInstruction);
      setHistory(prev => [...prev, { role: 'model', text: responseText }]);
      playAudio(responseText);
    } catch (err: any) {
      setStatus({ isLoading: false, error: err.message });
    } finally {
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Recording Logic
  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
          mediaRecorder.onstop = async () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              setStatus({ isLoading: true, error: null });
              try {
                  const base64 = await convertBlobToBase64(audioBlob);
                  const text = await transcribeAudio(base64, 'audio/webm');
                  if (text.trim()) {
                      handleSend(text);
                  }
              } catch (e: any) {
                  setStatus({ isLoading: false, error: e.message });
              }
              stream.getTracks().forEach(t => t.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (e) {
          setStatus({ isLoading: false, error: "Microphone access denied" });
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
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
      <div className={`${theme.bg} p-4 text-white flex items-center justify-between`}>
        <div>
          <h2 className="text-xl font-bold font-urdu">{title}</h2>
          <p className="text-xs opacity-90">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-hide">
        {history.length === 0 && (
          <div className="text-center text-gray-400 mt-20 px-4">
            <p className="text-2xl font-urdu mb-4 text-gray-600">{initialMessageUrdu}</p>
            <p className="text-sm">{initialMessageEnglish}</p>
          </div>
        )}
        
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? `${theme.bg} text-white rounded-br-none` 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
            }`}>
              <p className="whitespace-pre-wrap font-urdu leading-loose text-lg">{msg.text}</p>
              {msg.role === 'model' && (
                  <button onClick={() => playAudio(msg.text)} className="mt-2 text-gray-400 hover:text-indigo-600">
                      <IconVolumeUp />
                  </button>
              )}
            </div>
          </div>
        ))}
        {status.isLoading && (
          <div className="flex justify-start">
             <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-2">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {status.error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm border-t border-red-100 text-center">
            {status.error}
        </div>
      )}

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center space-x-3">
          
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`p-4 rounded-full transition-all duration-200 shadow-md ${
                isRecording 
                ? 'bg-red-500 text-white scale-110 ring-4 ring-red-200' 
                : `${theme.light} ${theme.text} hover:bg-gray-100`
            }`}
            title="Hold to Speak"
          >
            <IconMic />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isRecording ? "Listening..." : placeholder}
              className="w-full bg-gray-100 border-0 rounded-full px-6 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-urdu text-lg"
              disabled={isRecording || status.isLoading}
            />
          </div>
          
          <button
            onClick={() => handleSend()}
            disabled={status.isLoading || !input.trim()}
            className={`p-4 ${theme.bg} ${theme.btn} text-white rounded-full disabled:opacity-50 transition-colors shadow-sm`}
          >
            <IconSend />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Hold Mic to speak (Urdu/English) • مائیک دبا کر بولیں</p>
      </div>
    </div>
  );
};