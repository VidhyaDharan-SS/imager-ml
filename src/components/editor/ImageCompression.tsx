import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { useImageStore } from '../../store/imageStore';
import { Download, RefreshCw } from 'lucide-react';
import { saveAs } from 'file-saver';
import { ImageFile } from '../../types';

interface ImageCompressionProps {
  image: ImageFile;
}

export function ImageCompression({ image }: ImageCompressionProps) {
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [isCompressing, setIsCompressing] = useState(false);
  
  const originalSize = image.file.size;

  const handleCompress = async () => {
    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: quality,
        fileType: `image/${format}`,
      };

      const compressedFile = await imageCompression(image.file, options);
      setCompressedSize(compressedFile.size);
      setCompressedUrl(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error('Error compressing image:', error);
    }
    setIsCompressing(false);
  };

  const handleDownload = () => {
    if (compressedUrl) {
      const fileName = `${image.file.name.split('.')[0]}_compressed.${format}`;
      saveAs(compressedUrl, fileName);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compressionRatio = compressedSize
    ? ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Image Compression</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quality ({Math.round(quality * 100)}%)
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'jpeg' | 'png' | 'webp')}
              className="w-full p-2 border rounded"
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>Original Size: {formatSize(originalSize)}</div>
            {compressedSize && (
              <div>Compressed: {formatSize(compressedSize)}</div>
            )}
          </div>

          {compressionRatio && (
            <div className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-2 rounded">
              Reduced by {compressionRatio}%
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={handleCompress}
              disabled={isCompressing}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {isCompressing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Compress
            </button>
            
            {compressedUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            )}
          </div>
        </div>
      </div>

      {compressedUrl && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Original</p>
              <img src={image.preview} alt="Original" className="w-full rounded" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Compressed</p>
              <img src={compressedUrl} alt="Compressed" className="w-full rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}