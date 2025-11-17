
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import InputArea from './components/InputArea';
import OutputDisplay from './components/OutputDisplay';
import ApiKeySelector from './components/ApiKeySelector';
import { Mode, ApiState, OutputContent } from './types';
import * as geminiService from './services/geminiService';
import { useLiveConversation } from './hooks/useLiveConversation';
import SparkIcon from './components/icons/SparkIcon';
import ImageIcon from './components/icons/ImageIcon';
import ImageEditIcon from './components/icons/ImageEditIcon';
import MovieIcon from './components/icons/MovieIcon';
import AudioIcon from './components/icons/AudioIcon';
import SearchIcon from './components/icons/SearchIcon';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>(Mode.ASSISTANT);
  const [apiState, setApiState] = useState<ApiState>({
    isLoading: false,
    error: null,
    data: null,
  });
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [isVeoReady, setIsVeoReady] = useState(false);

  const { isRecording, transcripts, startConversation, stopConversation } = useLiveConversation();

  useEffect(() => {
    if (mode === Mode.VOICE_CONVO) {
        setApiState({ isLoading: false, error: null, data: { type: 'voice', data: transcripts }});
    }
  }, [transcripts, mode]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setApiState({ isLoading: false, error: null, data: null });
  }

  const handleMicClick = () => {
    if (isRecording) {
        stopConversation();
    } else {
        handleModeChange(Mode.VOICE_CONVO);
        startConversation();
    }
  }

  const isVeoMode = mode === Mode.VIDEO_GEN || mode === Mode.IMAGE_ANIMATE;

  const handleSubmit = useCallback(async (prompt: string, file?: File) => {
    setApiState({ isLoading: true, error: null, data: null });
    setProgressMessage('');
    
    let effectiveMode = mode;
    if (mode === Mode.ASSISTANT) {
        if (file) {
            effectiveMode = prompt.trim() === '' ? Mode.IMAGE_INTERPRET : Mode.IMAGE_EDIT;
        } else if (prompt.toLowerCase().includes('video') || prompt.toLowerCase().includes('animate')) {
            effectiveMode = Mode.VIDEO_GEN;
        } else if (prompt.toLowerCase().includes('image') || prompt.toLowerCase().includes('draw') || prompt.toLowerCase().includes('photo')) {
            effectiveMode = Mode.IMAGE_GEN;
        }
    }

    try {
      let result: OutputContent | null = null;
      const onProgress = (message: string) => setProgressMessage(message);

      switch (effectiveMode) {
        case Mode.ASSISTANT:
          const textResponse = await geminiService.getAssistantResponse(prompt);
          result = { type: 'text', data: textResponse };
          break;
        case Mode.IMAGE_GEN:
          const imageUrl = await geminiService.generateImage(prompt);
          result = { type: 'image', data: imageUrl };
          break;
        case Mode.IMAGE_EDIT:
          if (!file) throw new Error("Please upload an image to edit.");
          const editedImageUrl = await geminiService.editImage(prompt, file);
          result = { type: 'image', data: editedImageUrl };
          break;
        case Mode.IMAGE_INTERPRET:
            if (!file) throw new Error("Please upload an image to interpret.");
            const interpretation = await geminiService.interpretImage(file);
            result = { type: 'text', data: interpretation };
            break;
        case Mode.VIDEO_GEN:
          if (!isVeoReady) throw new Error("Please select an API key for video generation first.");
          const videoUrl = await geminiService.generateVideo(prompt, onProgress);
          result = { type: 'video', data: videoUrl };
          break;
        case Mode.IMAGE_ANIMATE:
          if (!file) throw new Error("Please upload an image to animate.");
          if (!isVeoReady) throw new Error("Please select an API key for video animation first.");
          const animatedVideoUrl = await geminiService.animateImage(file, onProgress);
          result = { type: 'video', data: animatedVideoUrl };
          break;
      }
      setApiState({ isLoading: false, error: null, data: result });
    } catch (err: any) {
      if (isVeoMode && err.message?.includes('Requested entity was not found.')) {
        setIsVeoReady(false);
        setApiState({ isLoading: false, error: "Your API Key seems to be invalid. Please select a valid key and try again.", data: null });
      } else {
        setApiState({ isLoading: false, error: err.message || 'An unknown error occurred.', data: null });
      }
    } finally {
        setProgressMessage('');
    }
  }, [mode, isVeoReady, isVeoMode]);

  const modeOptions = [
    { id: Mode.ASSISTANT, icon: SparkIcon, label: "Assistant" },
    { id: Mode.IMAGE_INTERPRET, icon: SearchIcon, label: "Interpret" },
    { id: Mode.IMAGE_GEN, icon: ImageIcon, label: "Image Gen" },
    { id: Mode.IMAGE_EDIT, icon: ImageEditIcon, label: "Image Edit" },
    { id: Mode.IMAGE_ANIMATE, icon: MovieIcon, label: "Animate" },
    { id: Mode.VIDEO_GEN, icon: MovieIcon, label: "Video Gen" },
    { id: Mode.VOICE_CONVO, icon: AudioIcon, label: "Voice" },
  ];

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-gray-900 text-gray-100">
      <Header />
      <main className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-700 flex justify-center flex-wrap gap-2">
            {modeOptions.map(opt => (
                <button
                    key={opt.id}
                    onClick={() => handleModeChange(opt.id)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${mode === opt.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                >
                    <opt.icon className="w-5 h-5" />
                    {opt.label}
                </button>
            ))}
        </div>
        <div className="flex-1 flex flex-col bg-gray-800 rounded-lg m-4 shadow-2xl min-h-0">
            <div className="flex-1 min-h-0">
                <OutputDisplay apiState={apiState} progressMessage={progressMessage} />
            </div>
            <div className="flex-shrink-0 border-t border-gray-700">
                {isVeoMode && <ApiKeySelector onKeySelected={() => setIsVeoReady(true)} />}
                <InputArea
                    mode={mode}
                    onSubmit={handleSubmit}
                    isLoading={apiState.isLoading}
                    isRecording={isRecording}
                    onMicClick={handleMicClick}
                />
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
