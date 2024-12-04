import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Grid, List, Search, Tag, Play, FileDown, Edit2, Filter, CheckSquare, Trash } from 'lucide-react';
import { useImageStore } from '../store/imageStore';
import { TagManager } from './TagManager';
import { SearchAndSort } from './SearchAndSort';
import { BatchOperations } from './BatchOperations';
import { ImageEditor } from './editor/ImageEditor';
import { format } from 'date-fns';

export function ImageGallery() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { getFilteredAndSortedImages, setSelectedImage, removeImage } = useImageStore();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showBatchOperations, setShowBatchOperations] = useState(false);
  const [showSingleEditor, setShowSingleEditor] = useState(false);
  const [currentEditMode, setCurrentEditMode] = useState<'edit' | 'compress' | 'stream' | null>(null);
  const [selectedSingleImage, setSelectedSingleImage] = useState<string | null>(null);

  const images = getFilteredAndSortedImages();

  const handleImageClick = (id: string, mode: 'edit' | 'compress' | 'stream') => {
    setSelectedSingleImage(id);
    setCurrentEditMode(mode);
    setShowSingleEditor(true);
  };

  const handleImageSelect = (id: string) => {
    setSelectedImages(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchOperation = (mode: 'edit' | 'compress' | 'stream') => {
    setCurrentEditMode(mode);
    setShowBatchOperations(true);
  };

  const handleDeleteSelectedImages = () => {
    selectedImages.forEach(id => removeImage(id));
    setSelectedImages([]); // Clear the selected images after deletion
  };

  const viewControls = [
    { 
      icon: CheckSquare, 
      label: 'Select All',
      action: () => setSelectedImages(images.map(img => img.id))
    },
    { 
      icon: Grid, 
      label: 'Grid View',
      action: () => setViewMode('grid'),
      active: viewMode === 'grid'
    },
    { 
      icon: List, 
      label: 'List View',
      action: () => setViewMode('list'),
      active: viewMode === 'list'
    }
  ];

  const imageActions = [
    { icon: Edit2, label: 'Edit', action: (id: string) => handleImageClick(id, 'edit') },
    { icon: Tag, label: 'Tag', action: (id: string) => handleImageClick(id, 'edit') },
    { icon: Play, label: 'Stream', action: (id: string) => handleImageClick(id, 'stream') },
    { icon: FileDown, label: 'Compress', action: (id: string) => handleImageClick(id, 'compress') }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          {viewControls.map(({ icon: Icon, label, action, active }) => (
            <button
              key={label}
              onClick={action}
              className={`flex items-center p-2 rounded hover:bg-purple-100 dark:hover:bg-purple-900 ${
                active ? 'bg-purple-100 dark:bg-purple-900' : ''
              }`}
              title={label}
            >
              <Icon className="h-5 w-5" />
              <span className="ml-2 text-sm">{label}</span>
            </button>
          ))}
        </div>
        <SearchAndSort />
      </div>

      <TagManager />

      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        initial="hidden"
        animate="show"
        className={`grid gap-4 ${
          viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        }`}
      >
        {images.map((image) => (
          <motion.div
            key={image.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
            className={`relative group ${
              viewMode === 'grid' ? 'aspect-square' : 'h-40'
            }`}
          >
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selectedImages.includes(image.id)}
                onChange={() => handleImageSelect(image.id)}
                className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </div>
            <div className="relative h-full">
              <img
                src={image.preview}
                alt=""
                className={`w-full h-full rounded-lg object-cover ${
                  selectedImages.includes(image.id) ? 'ring-2 ring-purple-500' : ''
                }`}
              />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg">
                <div className="flex justify-around">
                  {imageActions.map(({ icon: Icon, label, action }) => (
                    <button
                      key={label}
                      onClick={(e) => {
                        e.stopPropagation();
                        action(image.id);
                      }}
                      className="flex flex-col items-center p-1 text-white hover:text-purple-300 transition-colors"
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-1">
                  {image.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                  {image.tags.length > 3 && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                      +{image.tags.length - 3}
                    </span>
                  )}
                </div>
                {image.editHistory.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Edited {format(image.editHistory[image.editHistory.length - 1].timestamp, 'MMM d, HH:mm')}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {images.length === 0 && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            No images found. Upload some images to get started!
          </p>
        </div>
      )}

      {selectedImages.length > 0 && (
        <div className="fixed bottom-4 right-4 flex space-x-2">
          <button
            onClick={() => handleBatchOperation('edit')}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Edit All ({selectedImages.length})
          </button>
          <button
            onClick={() => handleBatchOperation('compress')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Compress All ({selectedImages.length})
          </button>
          <button
            onClick={() => handleBatchOperation('stream')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Stream All ({selectedImages.length})
          </button>
          <button 
            onClick={handleDeleteSelectedImages}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Delete All ({selectedImages.length})
          </button>
          <button
            onClick={() => setSelectedImages([])}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Clear Selection
          </button>
        </div>
      )}

      {showBatchOperations && currentEditMode && (
        <BatchOperations
          selectedImages={selectedImages}
          mode={currentEditMode}
          onClose={() => {
            setShowBatchOperations(false);
            setCurrentEditMode(null);
          }}
        />
      )}

      {showSingleEditor && selectedSingleImage && currentEditMode && (
        <ImageEditor
          image={images.find(img => img.id === selectedSingleImage)!}
          mode={currentEditMode}
          onClose={() => {
            setShowSingleEditor(false);
            setSelectedSingleImage(null);
            setCurrentEditMode(null);
          }}
        />
      )}
    </div>
  );
}
