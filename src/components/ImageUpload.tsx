import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { useImageStore } from '../store/imageStore';
import { generateId } from '../utils/helpers';

export function ImageUpload() {
  const addImage = useImageStore((state) => state.addImage);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const processFile = async (file: File) => {
      try {
        const preview = URL.createObjectURL(file);
        const imageFile = {
          id: generateId(),
          file,
          preview,
          tags: [],
          editHistory: [],
          filters: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            vintage: 0,
            dramatic: 0,
            vibrant: 0,
          },
        };
        addImage(imageFile);
        toast.success(`Successfully uploaded ${file.name}`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    };

    for (const file of acceptedFiles) {
      await processFile(file);
    }
  }, [addImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        {isDragActive
          ? 'Drop the images here...'
          : 'Drag & drop images here, or click to select files'}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Supports PNG, JPG, JPEG, GIF, and WebP
      </p>
    </div>
  );
}