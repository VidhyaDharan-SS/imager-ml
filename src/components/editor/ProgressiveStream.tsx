import React, { useState, useEffect } from 'react';
import { useInterval } from 'react-use';
import { Play, Pause, Settings, RefreshCw, SkipForward, SkipBack, Clock } from 'lucide-react';
import { ImageFile } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressiveStreamProps {
  image: ImageFile;
}

export function ProgressiveStream({ image }: ProgressiveStreamProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [interval, setInterval] = useState(1000);
  const [quality, setQuality] = useState(0);
  const [loadedChunks, setLoadedChunks] = useState<Uint8Array[]>([]);
  const [currentBlob, setCurrentBlob] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [autoRestart, setAutoRestart] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useInterval(
    () => {
      if (quality < 100) {
        setQuality(q => Math.min(q + 10, 100));
      } else if (autoRestart) {
        setQuality(0);
      } else {
        setIsPlaying(false);
      }
    },
    isPlaying ? interval : null
  );

  useEffect(() => {
    const simulateProgressiveLoading = async () => {
      const response = await fetch(image.preview);
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        setLoadedChunks([...chunks]);
      }
    };

    simulateProgressiveLoading();
  }, [image]);

  useEffect(() => {
    if (loadedChunks.length > 0) {
      const blob = new Blob(loadedChunks.slice(0, currentStep + 1), { type: 'image/jpeg' });
      setCurrentBlob(URL.createObjectURL(blob));
    }
  }, [loadedChunks, currentStep]);

  const handlePlayPause = () => {
    if (quality >= 100 && !autoRestart) {
      setQuality(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStep = (direction: 'forward' | 'back') => {
    if (direction === 'forward') {
      setCurrentStep(prev => Math.min(prev + 1, loadedChunks.length - 1));
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <RefreshCw className="h-5 w-5 mr-2" />
          Progressive Streaming
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => handleStep('back')}
                disabled={currentStep === 0}
                className="p-2 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={handlePlayPause}
                className="flex items-center px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </>
                )}
              </button>
              <button
                onClick={() => handleStep('forward')}
                disabled={currentStep === loadedChunks.length - 1}
                className="p-2 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 pt-3 border-t"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">
                      Interval (ms)
                    </label>
                    <input
                      type="number"
                      value={interval}
                      onChange={(e) => setInterval(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded"
                      min="100"
                      max="5000"
                      step="100"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">
                      Auto Restart
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={autoRestart}
                        onChange={(e) => setAutoRestart(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Enable</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Loading Quality</span>
              <span>{quality}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
              <motion.div
                className="h-full bg-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${quality}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={quality}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden"
            >
              <img
                src={currentBlob || image.preview}
                alt="Preview"
                className="w-full h-full object-contain"
                style={{
                  filter: `blur(${(100 - quality) / 10}px)`,
                  transition: 'filter 0.3s ease-out',
                }}
              />
            </motion.div>
          </AnimatePresence>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 inline mr-1" />
            Time remaining: {Math.ceil((100 - quality) * interval / 1000)}s
          </div>
        </div>
      </div>
    </div>
  );
}
