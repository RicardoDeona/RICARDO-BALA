
import React from 'react';
import { ApiState, Mode } from '../types';
import SparkIcon from './icons/SparkIcon';

interface OutputDisplayProps {
  apiState: ApiState;
  progressMessage?: string;
}

const LoadingIndicator: React.FC<{message?: string}> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
    <SparkIcon className="w-12 h-12 text-purple-400 animate-pulse" />
    <p className="mt-4 text-lg text-gray-300">Generating...</p>
    {message && <p className="mt-2 text-sm text-gray-400">{message}</p>}
  </div>
);

const WelcomeMessage: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <SparkIcon className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-300">Welcome to the AI Studio</h2>
        <p className="mt-2 text-gray-400 max-w-md">
            Generate images, edit photos, create videos, or have a conversation. Your multimodal creative partner is ready.
        </p>
    </div>
);


const OutputDisplay: React.FC<OutputDisplayProps> = ({ apiState, progressMessage }) => {
  const { isLoading, error, data } = apiState;

  if (isLoading) {
    return <LoadingIndicator message={progressMessage} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg">
          <p className="font-semibold">An error occurred:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <WelcomeMessage />;
  }

  const renderContent = () => {
    switch (data.type) {
      case 'text':
        return <div className="prose prose-invert p-6 whitespace-pre-wrap">{data.data as string}</div>;
      case 'image':
        return (
          <div className="p-4 flex justify-center">
            <img src={data.data as string} alt="Generated" className="max-w-full max-h-[70vh] rounded-lg shadow-lg" />
          </div>
        );
      case 'video':
        return (
          <div className="p-4 flex justify-center">
            <video src={data.data as string} controls autoPlay className="max-w-full max-h-[70vh] rounded-lg shadow-lg" />
          </div>
        );
      case 'voice':
        return (
            <div className="p-6 space-y-4">
                {(data.data as string[]).map((line, index) => (
                    <p key={index} className={`p-3 rounded-lg max-w-xl ${line.startsWith('You:') ? 'bg-gray-700 ml-auto' : 'bg-purple-800 mr-auto'}`}>
                        {line}
                    </p>
                ))}
            </div>
        );
      default:
        return null;
    }
  };

  return <div className="h-full overflow-y-auto">{renderContent()}</div>;
};

export default OutputDisplay;
