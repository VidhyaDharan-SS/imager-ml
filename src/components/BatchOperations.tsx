import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Save, X } from 'lucide-react';
import { useImageStore } from '../store/imageStore';
import { ImageEditor } from './editor/ImageEditor';
import { ImageFile } from '../types';

interface BatchOperationsProps {
  selectedImages: string[];
  mode: 'edit' | 'compress' | 'stream';
  onClose: () => void;
}

export function BatchOperations({ selectedImages, mode, onClose }: BatchOperationsProps) {
  const { images, updateImage } = useImageStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const selectedImageObjects = images.filter(img => selectedImages.includes(img.id));
  const currentImage = selectedImageObjects[currentIndex];

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, selectedImages.length - 1));
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const handleSave = async (updatedImage: Partial<ImageFile>) => {
    if (currentImage) {
      await updateImage(currentImage.id, updatedImage);
      if (currentIndex < selectedImages.length - 1) {
        handleNext();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
      <div className="relative w-full h-full max-w-7xl mx-auto p-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-center justify-between h-full">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="p-2 bg-white rounded-full shadow-lg disabled:opacity-50 hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="flex-1 mx-4 h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImage?.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="h-full"
              >
                {currentImage && (
                  <ImageEditor
                    image={currentImage}
                    onSave={handleSave}
                    mode={mode}
                    isBatchMode
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === selectedImages.length - 1}
            className="p-2 bg-white rounded-full shadow-lg disabled:opacity-50 hover:bg-gray-100"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2">
          <span className="font-medium">
            Image {currentIndex + 1} of {selectedImages.length}
          </span>
        </div>
      </div>
    </div>
  );
}