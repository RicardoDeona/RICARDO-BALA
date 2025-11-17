import React, { useState, useEffect, useCallback } from 'react';

// FIX: Define the AIStudio interface inside the `declare global` block to avoid module-scope conflicts and ensure a single global definition.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio: AIStudio;
  }
}

interface ApiKeySelectorProps {
    onKeySelected: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const [hasKey, setHasKey] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkKey = useCallback(async () => {
    if (window.aistudio) {
      try {
        const keyExists = await window.aistudio.hasSelectedApiKey();
        if (keyExists) {
            setHasKey(true);
            onKeySelected();
        } else {
            setHasKey(false);
        }
      } catch (e) {
        console.error("Error checking for API key:", e);
        setHasKey(false);
      } finally {
        setIsChecking(false);
      }
    } else {
        setIsChecking(false);
        console.warn("aistudio context not available. Assuming key is set via env.");
        setHasKey(true); // Dev fallback
        onKeySelected();
    }
  }, [onKeySelected]);

  useEffect(() => {
    checkKey();
  }, [checkKey]);
  
  const handleSelectKey = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Assume success to avoid race condition and re-enable UI immediately.
        setHasKey(true);
        onKeySelected();
        // Re-check in the background to confirm
        setTimeout(checkKey, 1000);
    }
  };

  if (hasKey || isChecking) {
    return null; // Don't show anything if key exists or we're checking
  }

  return (
    <div className="bg-blue-900/50 border border-blue-700 text-white p-4 rounded-lg my-4 text-center">
        <h3 className="text-lg font-semibold mb-2">Veo API Key Required</h3>
        <p className="mb-4 text-sm text-blue-200">
            To use video generation features, you must select an API key. This will be used for billing purposes.
        </p>
        <div className="flex justify-center items-center gap-4">
            <button
                onClick={handleSelectKey}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                Select API Key
            </button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-300 hover:underline">
                Learn about billing
            </a>
        </div>
    </div>
  );
};

export default ApiKeySelector;