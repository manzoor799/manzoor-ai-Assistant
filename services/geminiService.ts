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
      
      // Check for retryable errors: 429 (Quota), 503 (Service Unavailable), 500 (Server Error)
      const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
      const isServer = msg.includes('503') || msg.includes('500') || msg.includes('Overloaded');

      if ((isQuota || isServer) && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i); // e.g. 5000, 10000, 20000 ms
        console.warn(`Attempt ${i + 1} failed with ${isQuota ? 'quota' : 'server'} error. Retrying in ${delay}ms...`);
        await wait(delay);
        continue;
      }
      
      // If it's not retryable (e.g. Safety, Invalid Argument), throw immediately
      throw err;
    }
  }
  throw lastError;
};

// Helper to parse ugly API errors into human readable text
const parseGeminiError = (err: any): string => {
  const msg = err.message || err.toString();
  
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
    return "Usage limit exceeded. The system is busy, please wait a minute and try again.";
  }
  if (msg.includes('500') || msg.includes('Rpc failed') || msg.includes('xhr error')) {
    return "Network error or image too large. Please try a smaller image.";
  }
  if (msg.includes('SAFETY')) {
    return "The request was blocked due to safety settings.";
  }

  try {
    const jsonMatch = msg.match(/\{.*"message":\s*"([^"]+)".*\}/);
    if (jsonMatch && jsonMatch[1]) {
        return jsonMatch[1];
    }
  } catch (e) {}

  return "An error occurred. Please try again.";
};

// 1. Chat with Manzoor (Gemini 3 Pro -> Retry -> Fallback to 2.5 Flash -> Retry)
export const chatWithManzoor = async (history: ChatMessage[], newMessage: string, imageBase64?: string, imageMimeType: string = 'image/jpeg'): Promise<string> => {
  const ai = getClient();
  const systemInstruction = "You are an AI assistant named Manzoor. Your father's name is Abdul Razak. You primarily speak Urdu, but can understand English. Be polite, helpful, and respectful. Use the Urdu script for Urdu responses.";
  
  const historyContent = history.map(h => ({
    role: h.role,
    parts: h.image 
      ? [{ inlineData: { mimeType: h.imageMimeType || 'image/jpeg', data: h.image } }, { text: h.text }] 
      : [{ text: h.text }]
  }));

  const msgParam = imageBase64 
    ? [{ inlineData: { mimeType: imageMimeType, data: imageBase64 } }, { text: newMessage }]
    : newMessage;

  // Define operation for Gemini 3 Pro
  const callPro = async () => {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { systemInstruction },
      history: historyContent
    });
    const response: GenerateContentResponse = await chat.sendMessage({ message: msgParam as any });
    return response.text || "";
  };

  // Define operation for Gemini 2.5 Flash
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
    // Try Pro with retries
    return await withRetry(callPro, 3, 2000);
  } catch (err: any) {
    console.warn("Gemini 3 Pro failed after retries, switching to Flash...", err);
    try {
      // Fallback to Flash with retries
      return await withRetry(callFlash, 3, 2000);
    } catch (fallbackErr: any) {
      throw new Error(parseGeminiError(fallbackErr));
    }
  }
};

// 2. Edit Image (Gemini 2.5 Flash Image -> Retry -> Fallback to 3.0 Pro Image -> Retry)
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

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          resultImage = part.inlineData.data;
        } else if (part.text) {
          resultText = part.text;
        }
      }
    }

    if (!resultImage && !resultText) {
        throw new Error("The model returned an empty response.");
    }
    return { image: resultImage, text: resultText };
  };

  try {
    // Attempt 1: Gemini 2.5 Flash Image with Retry. Increase retries to 5 and delay to 5s.
    return await withRetry(() => callModel('gemini-2.5-flash-image'), 5, 5000);
  } catch (error: any) {
    console.warn("Gemini 2.5 Flash Image failed after retries, switching to Gemini 3 Pro...", error);
    try {
      // Attempt 2: Gemini 3 Pro Image Preview with Retry. Increase retries to 5 and delay to 5s.
      return await withRetry(() => callModel('gemini-3-pro-image-preview'), 5, 5000);
    } catch (finalError) {
      throw new Error(parseGeminiError(finalError));
    }
  }
};

// 3. Transcribe Audio (Gemini 2.5 Flash -> Retry)
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

// 4. Text to Speech (Gemini 2.5 Flash TTS -> Retry)
export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getClient();
  
  const callTTS = async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' }
          }
        }
      }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("No audio data returned");
    return audioData;
  };

  try {
    return await withRetry(callTTS, 3, 2000);
  } catch (err) {
    throw new Error(parseGeminiError(err));
  }
};