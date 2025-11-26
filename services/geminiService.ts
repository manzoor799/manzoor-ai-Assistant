import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// Helper to parse ugly API errors into human readable text
const parseGeminiError = (err: any): string => {
  const msg = err.message || err.toString();
  
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
    return "Usage limit exceeded. Free tier quota reached. Please wait a minute or try again.";
  }
  if (msg.includes('500') || msg.includes('Rpc failed') || msg.includes('xhr error')) {
    return "Network error or image too large. Please try a smaller image.";
  }
  if (msg.includes('SAFETY')) {
    return "The request was blocked due to safety settings.";
  }

  // Try to extract clean message from JSON dump
  try {
    const jsonMatch = msg.match(/\{.*"message":\s*"([^"]+)".*\}/);
    if (jsonMatch && jsonMatch[1]) {
        return jsonMatch[1];
    }
  } catch (e) {}

  return "An error occurred. Please try again.";
};

// 1. Chat with Manzoor (Gemini 3 Pro -> Fallback to 2.5 Flash)
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

  // Try Primary Model (Gemini 3 Pro)
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { systemInstruction },
      history: historyContent
    });
    
    const response: GenerateContentResponse = await chat.sendMessage({ message: msgParam as any });
    return response.text || "";
  } catch (err: any) {
    // If Quota Exceeded or Server Error, Fallback to Gemini 2.5 Flash
    const isQuotaError = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
    const isServerError = err.message?.includes('503') || err.message?.includes('500');

    if (isQuotaError || isServerError) {
      console.warn("Gemini 3 Pro failed, falling back to Gemini 2.5 Flash...");
      try {
        const fallbackChat = ai.chats.create({
          model: 'gemini-2.5-flash', // Fallback model
          config: { systemInstruction },
          history: historyContent
        });
        const response: GenerateContentResponse = await fallbackChat.sendMessage({ message: msgParam as any });
        return response.text || "";
      } catch (fallbackErr: any) {
        throw new Error(parseGeminiError(fallbackErr));
      }
    }

    throw new Error(parseGeminiError(err));
  }
};

// 2. Edit Image (Gemini 2.5 Flash Image -> Fallback to 3.0 Pro Image)
export const editImage = async (imageBase64: string, imageMimeType: string, prompt: string): Promise<{ image?: string, text?: string }> => {
  const ai = getClient();

  const callModel = async (modelName: string) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
          { text: prompt }
        ]
      }
    });
  };

  try {
    let response: GenerateContentResponse;
    
    // Attempt 1: Gemini 2.5 Flash Image ("Nano Banana")
    try {
      response = await callModel('gemini-2.5-flash-image');
    } catch (error: any) {
      const isQuota = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
      const isServer = error.message?.includes('500') || error.message?.includes('503');
      
      if (isQuota || isServer) {
        console.warn("Gemini 2.5 Flash Image quota exceeded, switching to Gemini 3 Pro Image...");
        // Attempt 2: Gemini 3 Pro Image Preview
        response = await callModel('gemini-3-pro-image-preview');
      } else {
        throw error;
      }
    }

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
        throw new Error("The model could not generate an edited image. Please try a different prompt.");
    }

    return { image: resultImage, text: resultText };
  } catch (err) {
    throw new Error(parseGeminiError(err));
  }
};

// 3. Transcribe Audio (Gemini 2.5 Flash)
export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  const ai = getClient();
  try {
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
  } catch (err) {
    throw new Error(parseGeminiError(err));
  }
};

// 4. Text to Speech (Gemini 2.5 Flash TTS)
export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getClient();
  try {
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
  } catch (err) {
    throw new Error(parseGeminiError(err));
  }
};