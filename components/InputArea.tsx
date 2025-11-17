
import React, { useState, useRef, ChangeEvent } from 'react';
import { Mode } from '../types';

interface InputAreaProps {
  mode: Mode;
  onSubmit: (prompt: string, file?: File) => void;
  isLoading: boolean;
  isRecording: boolean;
  onMicClick: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ mode, onSubmit, isLoading, isRecording, onMicClick }) => {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isRecording) return;
    onSubmit(prompt, file);
    if (mode !== Mode.IMAGE_EDIT) {
        setPrompt('');
    }
  };
  
  const isFileUploadRelevant = mode === Mode.IMAGE_EDIT || mode === Mode.IMAGE_ANIMATE || mode === Mode.IMAGE_INTERPRET;

  const getPlaceholderText = () => {
    switch(mode) {
        case Mode.IMAGE_GEN: return "e.g., A cinematic photo of a raccoon wearing a tiny space helmet...";
        case Mode.IMAGE_EDIT: return "e.g., Add a santa hat to the person...";
        case Mode.IMAGE_ANIMATE: return "Upload an image to animate it";
        case Mode.IMAGE_INTERPRET: return "Upload an image to get a description and prompt ideas";
        case Mode.VIDEO_GEN: return "e.g., An epic drone shot of a futuristic city at sunset...";
        case Mode.VOICE_CONVO: return "Click the microphone to start talking...";
        case Mode.ASSISTANT:
        default:
            return "Ask me anything or describe what you want to create...";
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded-t-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative flex-grow">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={getPlaceholderText()}
            className="w-full bg-gray-700 border-2 border-transparent focus:border-purple-500 focus:ring-0 text-gray-200 rounded-lg p-3 pr-28 resize-none transition-colors"
            rows={3}
            disabled={isLoading || isRecording || mode === Mode.VOICE_CONVO || mode === Mode.IMAGE_ANIMATE || mode === Mode.IMAGE_INTERPRET}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={onMicClick}
              className={`p-2 rounded-full transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-600 hover:bg-purple-600 text-gray-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm-1 4a4 4 0 108 0V4a4 4 0 10-8 0v4zM2.75 9.5a.75.75 0 000 1.5h.5a6.5 6.5 0 0013.5 0h.5a.75.75 0 000-1.5h-.5A5.5 5.5 0 014 9.5h-.5a.75.75 0 00-.75-.75z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-2">
            {isFileUploadRelevant && (
                <>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                    disabled={isLoading}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm disabled:opacity-50"
                >
                    {file ? 'Change Image' : 'Upload Image'}
                </button>
                {file && <span className="text-xs text-gray-400 truncate max-w-xs">{file.name}</span>}
                </>
            )}
            </div>

            <button
                type="submit"
                disabled={isLoading || isRecording || (mode === Mode.VOICE_CONVO) || (isFileUploadRelevant && !file)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                Generate
            </button>
        </div>
      </form>
    </div>
  );
};

export default InputArea;
