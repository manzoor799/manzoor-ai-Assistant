import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// 1. Chat with Manzoor (Gemini 3 Pro)
export const chatWithManzoor = async (history: ChatMessage[], newMessage: string, imageBase64?: string, imageMimeType: string = 'image/jpeg'): Promise<string> => {
  const ai = getClient();
  const systemInstruction = "You are an AI assistant named Manzoor. Your father's name is Abdul Razak. You primarily speak Urdu, but can understand English. Be polite, helpful, and respectful. Use the Urdu script for Urdu responses.";
  
  // We construct the chat history manually for the stateless call or use chats.create
  // For simplicity with history + image capabilities, we'll use a chat session.
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction },
    history: history.map(h => ({
      role: h.role,
      parts: h.image 
        ? [{ inlineData: { mimeType: h.imageMimeType || 'image/jpeg', data: h.image } }, { text: h.text }] 
        : [{ text: h.text }]
    }))
  });

  // sendMessage accepts a string or a Part array.
  const msgParam = imageBase64 
    ? [{ inlineData: { mimeType: imageMimeType, data: imageBase64 } }, { text: newMessage }]
    : newMessage;

  const response: GenerateContentResponse = await chat.sendMessage({ message: msgParam as any });
  return response.text || "";
};

// 2. Edit Image (Gemini 2.5 Flash Image - "Nano Banana")
export const editImage = async (imageBase64: string, imageMimeType: string, prompt: string): Promise<{ image?: string, text?: string }> => {
  const ai = getClient();
  // Using generateContent for image editing as per guidelines for Nano Banana
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
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

  return { image: resultImage, text: resultText };
};

// 3. Transcribe Audio (Gemini 2.5 Flash)
export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  const ai = getClient();
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

// 4. Text to Speech (Gemini 2.5 Flash TTS)
export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Zephyr' } // Using a neutral voice, user prompt asked for Urdu support which this model should handle via text language detection
        }
      }
    }
  });

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) throw new Error("No audio data returned");
  return audioData;
};