import { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Import `Blob` type from @google/genai.
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from "@google/genai";
import { encode, decode, decodeAudioData } from '../services/audioUtils';

// FIX: Added createBlob helper function as recommended by the guidelines for efficient audio encoding.
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// A global flag to ensure AudioContext is initialized only once.
let isAudioContextInitialized = false;

export const useLiveConversation = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const audioContextRef = useRef<{
    input: AudioContext;
    output: AudioContext;
  } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const initializeAudio = useCallback(async () => {
    if (!audioContextRef.current && !isAudioContextInitialized) {
        isAudioContextInitialized = true;
        audioContextRef.current = {
            input: new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 }),
            output: new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }),
        };
    }
    if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
  }, []);
  
  const startConversation = useCallback(async () => {
    if (isRecording) return;
    
    setTranscripts([]);
    setIsRecording(true);

    try {
      await initializeAudio();
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: 'You are a friendly and helpful multimodal AI assistant. Be conversational and concise.',
        },
        callbacks: {
          onopen: () => {
            if (!audioContextRef.current || !streamRef.current) return;
            
            sourceRef.current = audioContextRef.current.input.createMediaStreamSource(streamRef.current);
            scriptProcessorRef.current = audioContextRef.current.input.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              // FIX: Use createBlob helper and remove redundant conditional as per guidelines. This is more efficient and correct.
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            sourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current.input.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const outputAudioContext = audioContextRef.current.output;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(source => source.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (message.serverContent?.inputTranscription) {
              currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.turnComplete) {
              const userInput = currentInputTranscriptionRef.current.trim();
              const modelOutput = currentOutputTranscriptionRef.current.trim();
              
              if(userInput) setTranscripts(prev => [...prev, `You: ${userInput}`]);
              if(modelOutput) setTranscripts(prev => [...prev, `AI: ${modelOutput}`]);
              
              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
            }
          },
          onerror: (e) => {
            console.error('Live session error:', e);
            stopConversation();
          },
          onclose: () => {
            console.log('Live session closed');
          },
        },
      });

    } catch (error) {
      console.error('Failed to start conversation:', error);
      setIsRecording(false);
    }
  }, [isRecording, initializeAudio]);

  const stopConversation = useCallback(async () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    
    scriptProcessorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    
    if (sessionPromiseRef.current) {
      const session = await sessionPromiseRef.current;
      session.close();
      sessionPromiseRef.current = null;
    }
    
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
  }, [isRecording]);
  
  useEffect(() => {
     // Cleanup on unmount
    return () => {
        stopConversation();
        streamRef.current?.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
            audioContextRef.current.input.close();
            audioContextRef.current.output.close();
            audioContextRef.current = null;
            isAudioContextInitialized = false;
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isRecording, transcripts, startConversation, stopConversation };
};
