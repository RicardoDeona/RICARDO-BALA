
import { GoogleGenAI, Modality } from "@google/genai";
import { type GenerateContentParameters } from "@google/genai";

const getApiKey = () => process.env.API_KEY;

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const getAssistantResponse = async (prompt: string) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt
    });
    return response.text;
};

export const generateImage = async (prompt: string) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });
    const base64Image = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64Image}`;
};

export const editImage = async (prompt: string, image: File) => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const imagePart = await fileToGenerativePart(image);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    const part = response.candidates?.[0]?.content.parts[0];
    if (part && part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Could not edit image.");
};

const generateVideoWithPolling = async (params: GenerateContentParameters, onProgress: (message: string) => void) => {
    const progressMessages = [
      "Warming up the digital cameras...",
      "Directing the virtual scene...",
      "Applying special effects...",
      "Rendering the final cut...",
      "Almost there, adding finishing touches...",
    ];
    let messageIndex = 0;

    onProgress(progressMessages[messageIndex]);
    const progressInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % progressMessages.length;
        onProgress(progressMessages[messageIndex]);
    }, 7000);

    // VEO requires creating a new instance for each call to pick up the latest key
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    let operation = await ai.models.generateVideos(params);
    
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
    }
    
    clearInterval(progressInterval);

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed to produce a download link.");
    }

    const response = await fetch(`${downloadLink}&key=${getApiKey()}`);
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateVideo = async (prompt: string, onProgress: (message: string) => void) => {
    return generateVideoWithPolling({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9',
        }
    }, onProgress);
};

export const animateImage = async (image: File, onProgress: (message: string) => void) => {
    const imagePart = await fileToGenerativePart(image);
    return generateVideoWithPolling({
        model: 'veo-3.1-fast-generate-preview',
        prompt: 'Animate this image with subtle, cinematic motion. Focus on bringing the scene to life.',
        image: {
            imageBytes: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType,
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9',
        }
    }, onProgress);
};
