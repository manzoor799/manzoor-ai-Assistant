
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// Utility: Wait for a specified number of milliseconds
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: Retry an async operation with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3, 
  initialDelay: number = 2000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const msg = err.message || err.toString();
      
      // Check for retryable errors
      const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
      const isServer = msg.includes('503') || msg.includes('500') || msg.includes('Overloaded');

      if ((isQuota || isServer) && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
        await wait(delay);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

// Helper to parse ugly API errors
const parseGeminiError = (err: any): string => {
  const msg = err.message || err.toString();
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) return "Usage limit exceeded. Please wait a moment.";
  if (msg.includes('500')) return "Network error. Please try again.";
  return "An error occurred. Please try again.";
};

// 1. Chat with Manzoor
export const chatWithManzoor = async (history: ChatMessage[], newMessage: string, imageBase64?: string, imageMimeType: string = 'image/jpeg'): Promise<string> => {
  return chatWithPersona(
    history, 
    newMessage, 
    "You are Manzoor, an AI assistant. Your father is Abdul Razak. Speak Urdu (Urdu script) primarily. Be helpful and polite.",
    imageBase64,
    imageMimeType
  );
};

// 2. Chat with Persona
export const chatWithPersona = async (history: ChatMessage[], newMessage: string, systemInstruction: string, imageBase64?: string, imageMimeType: string = 'image/jpeg'): Promise<string> => {
  const ai = getClient();
  
  const historyContent = history.map(h => ({
    role: h.role,
    parts: h.image 
      ? [{ inlineData: { mimeType: h.imageMimeType || 'image/jpeg', data: h.image } }, { text: h.text }] 
      : [{ text: h.text }]
  }));

  const msgParam = imageBase64 
    ? [{ inlineData: { mimeType: imageMimeType, data: imageBase64 } }, { text: newMessage }]
    : newMessage;

  const callPro = async () => {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { systemInstruction },
      history: historyContent
    });
    const response: GenerateContentResponse = await chat.sendMessage({ message: msgParam as any });
    return response.text || "";
  };

  const callFlash = async () => {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction },
      history: historyContent
    });
    const response: GenerateContentResponse = await chat.sendMessage({ message: msgParam as any });
    return response.text || "";
  };

  try {
    return await withRetry(callPro, 3, 2000);
  } catch (err) {
    console.warn("Pro failed, switching to Flash...");
    try {
      return await withRetry(callFlash, 3, 2000);
    } catch (fallbackErr) {
      throw new Error(parseGeminiError(fallbackErr));
    }
  }
};

// 3. Analyze Image
export const analyzeImage = async (imageBase64: string, mimeType: string, prompt: string, systemInstruction: string): Promise<string> => {
  const ai = getClient();

  const callVision = async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: { systemInstruction }
    });
    return response.text || "";
  };

  try {
    return await withRetry(callVision, 3, 2000);
  } catch (err) {
    throw new Error(parseGeminiError(err));
  }
};

// 4. Edit Image
export const editImage = async (imageBase64: string, imageMimeType: string, prompt: string): Promise<{ image?: string, text?: string }> => {
  const ai = getClient();

  const callModel = async (modelName: string) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
          { text: prompt }
        ]
      }
    });

    let resultImage: string | undefined;
    let resultText: string | undefined;

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) resultImage = part.inlineData.data;
        else if (part.text) resultText = part.text;
      }
    }

    if (!resultImage && !resultText) throw new Error("Empty response");
    return { image: resultImage, text: resultText };
  };

  try {
    return await withRetry(() => callModel('gemini-2.5-flash-image'), 5, 5000);
  } catch (error) {
    console.warn("Flash Image failed, switching to Pro...");
    try {
      return await withRetry(() => callModel('gemini-3-pro-image-preview'), 5, 5000);
    } catch (finalError) {
      throw new Error(parseGeminiError(finalError));
    }
  }
};

// 5. Transcribe Audio
export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  const ai = getClient();
  const callTranscribe = async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: audioBase64 } },
          { text: "Please transcribe this audio accurately. If it is in Urdu, provide the transcription in Urdu script." }
        ]
      }
    });
    return response.text || "";
  };
  try {
    return await withRetry(callTranscribe, 3, 2000);
  } catch (err) {
    throw new Error(parseGeminiError(err));
  }
};

// 6. Text to Speech
export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getClient();
  const callTTS = async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
        }
      }
    });
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("No audio returned");
    return audioData;
  };
  try {
    return await withRetry(callTTS, 3, 2000);
  } catch (err) {
    throw new Error(parseGeminiError(err));
  }
};
