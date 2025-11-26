import React, { useState, useRef } from 'react';
import { analyzeImage, generateSpeech } from '../services/geminiService';
import { base64ToUint8Array, decodeAudioData } from '../utils/audioUtils';
import { IconUpload, IconVolumeUp, IconPlant, IconDocument } from './icons';
import { ProcessingState } from '../types';

interface ImageAnalysisProps {
  mode: 'CROPS' | 'DOCS' | 'HEALTH';
}

export const ImageAnalysis: React.FC<ImageAnalysisProps> = ({ mode }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [result, setResult] = useState<string>('');
  const [status, setStatus] = useState<ProcessingState>({ isLoading: false, error: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = {
      CROPS: {
          title: "Smart Crop Doctor",
          subtitle: "فصلوں کا ڈاکٹر (Crop Disease Identifier)",
          prompt: "Identify the crop and any disease or pest in this image. Provide a diagnosis and step-by-step treatment advice in simple Urdu.",
          systemInstruction: "You are an expert agriculturalist. Analyze plant images for diseases/pests. Respond in simple Urdu.",
          icon: <IconPlant />,
          placeholder: "Upload leaf photo / پتے کی تصویر",
          color: "emerald"
      },
      DOCS: {
          title: "Document Reader",
          subtitle: "دستاویز پڑھنے والا (Doc Scanner)",
          prompt: "Read this document. If it is a bill, state the amount and due date. If it is a letter, summarize what it says in simple Urdu.",
          systemInstruction: "You are a helpful assistant that reads official documents and explains them in simple Urdu to low-literacy users.",
          icon: <IconDocument />,
          placeholder: "Upload document / دستاویز کی تصویر",
          color: "blue"
      },
      HEALTH: {
          title: "Medicine Helper",
          subtitle: "دوا کی معلومات (Medicine Guide)",
          prompt: "Read this medicine label or prescription. Explain what the medicine is for and how to use it in simple Urdu.",
          systemInstruction: "You are a helpful medical assistant. Explain medicine usage simply and clearly in Urdu. Add safety disclaimers.",
          icon: <IconDocument />, // reusing doc icon or health icon
          placeholder: "Upload medicine label / دوا کی تصویر",
          color: "red"
      }
  }[mode];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSelectedImage(result.split(',')[1]); // remove data:image/...;base64,
        setMimeType(file.type);
        setResult('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setStatus({ isLoading: true, error: null });

    try {
        const text = await analyzeImage(selectedImage, mimeType, config.prompt, config.systemInstruction);
        setResult(text);
        
        // Auto-play audio
        try {
            const audioBase64 = await generateSpeech(text);
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBuffer = await decodeAudioData(base64ToUint8Array(audioBase64), audioCtx, 24000, 1);
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start();
        } catch (e) { console.error("TTS failed", e); }

    } catch (err: any) {
        setStatus({ isLoading: false, error: err.message });
    } finally {
        setStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-white rounded-lg shadow-sm border border-gray-100 overflow-y-auto">
      <div className={`mb-6 text-${config.color}-700`}>
        <div className="flex items-center space-x-2">
            {config.icon}
            <h2 className="text-2xl font-bold font-urdu">{config.title}</h2>
        </div>
        <p className="text-gray-500 text-sm mt-1">{config.subtitle}</p>
      </div>

      <div className="flex-1 flex flex-col items-center space-y-6">
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`w-full max-w-md aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
             selectedImage ? `border-${config.color}-300 bg-${config.color}-50` : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
            {selectedImage ? (
                <img src={`data:${mimeType};base64,${selectedImage}`} className="h-full w-full object-contain rounded-xl" alt="Preview" />
            ) : (
                <div className="text-center text-gray-400 p-4">
                    <IconUpload />
                    <span className="block mt-2 font-urdu text-lg">{config.placeholder}</span>
                    <span className="text-xs">Tap to take photo</span>
                </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </div>

        <button
            onClick={handleAnalyze}
            disabled={!selectedImage || status.isLoading}
            className={`w-full max-w-md py-4 rounded-xl text-white text-lg font-bold shadow-md transition-colors ${
                status.isLoading ? 'bg-gray-400' : `bg-${config.color}-600 hover:bg-${config.color}-700`
            }`}
        >
            {status.isLoading ? "Analyzing..." : "Analyze (تجزیہ کریں)"}
        </button>

        {status.error && (
            <div className="text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-100">{status.error}</div>
        )}

        {result && (
            <div className="w-full max-w-md bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">Diagnosis / Result</h3>
                    <IconVolumeUp />
                </div>
                <p className="font-urdu text-xl leading-loose text-gray-800 whitespace-pre-wrap">
                    {result}
                </p>
            </div>
        )}

      </div>
    </div>
  );
};