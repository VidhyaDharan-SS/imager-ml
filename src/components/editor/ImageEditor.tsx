import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useImageStore } from '../../store/imageStore';
import { EditHistory } from './EditHistory';
import { FilterPanel } from './FilterPanel';
import { AnnotationPanel } from './AnnotationPanel';
import { ImageCompression } from './ImageCompression';
import { ProgressiveStream } from './ProgressiveStream';
import { TagPanel } from './TagPanel';
import { ArrowLeft, Save, Undo, Redo, Layout, Maximize2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { ImageFile } from '../../types';

interface ImageEditorProps {
  image: ImageFile;
  mode?: 'edit' | 'compress' | 'stream';
  onSave?: (updatedImage: Partial<ImageFile>) => void;
  onClose?: () => void;
  isBatchMode?: boolean;
}

export function ImageEditor({ image, mode = 'edit', onSave, onClose, isBatchMode }: ImageEditorProps) {
  const { updateImage } = useImageStore();
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'filters' | 'annotations' | 'compression' | 'stream' | 'tags'>(
    mode === 'compress' ? 'compression' : mode === 'stream' ? 'stream' : 'annotations'
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        preserveObjectStacking: true,
        width: containerRef.current.clientWidth - (showSidebar ? 320 : 0),
        height: containerRef.current.clientHeight,
      });

      fabric.Image.fromURL(image.preview, (img) => {
        const containerWidth = containerRef.current!.clientWidth - (showSidebar ? 320 : 0);
        const containerHeight = containerRef.current!.clientHeight;
        const scale = Math.min(
          containerWidth / img.width!,
          containerHeight / img.height!
        );

        img.scale(scale);
        fabricCanvas.setDimensions({
          width: containerWidth,
          height: containerHeight,
        });

        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas), {
          originX: 'center',
          originY: 'center',
          left: containerWidth / 2,
          top: containerHeight / 2,
        });
      });

      setCanvas(fabricCanvas);

      const handleResize = () => {
        if (containerRef.current) {
          const width = containerRef.current.clientWidth - (showSidebar ? 320 : 0);
          const height = containerRef.current.clientHeight;
          fabricCanvas.setDimensions({ width, height });
          fabricCanvas.renderAll();
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        fabricCanvas.dispose();
      };
    }
  }, [image, showSidebar]);

  const handleSave = async () => {
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
      });

      const updates = {
        preview: dataUrl,
        editHistory: [...image.editHistory, {
          id: Date.now().toString(),
          type: 'save',
          timestamp: Date.now(),
          description: 'Saved canvas state',
        }],
      };

      if (onSave) {
        onSave(updates);
      } else {
        await updateImage(image.id, updates);
      }

      toast.success('Changes saved successfully');
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  const tabs = [
    { id: 'annotations', label: 'Annotations' },
    { id: 'filters', label: 'Filters' },
    { id: 'compression', label: 'Compression' },
    { id: 'stream', label: 'Stream' },
    { id: 'tags', label: 'Tags' },
  ] as const;

  return (
    <div 
      ref={containerRef}
      className={`${isBatchMode ? '' : 'fixed inset-0'} bg-white dark:bg-gray-800 z-50 flex flex-col`}
    >
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold">Editing {image.file.name}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Layout className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Save Changes
            </button>
          </div>
        </div>
        <div className="flex px-4">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 border-b-2 font-medium ${
                activeTab === id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {showSidebar && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
            {activeTab === 'filters' && <FilterPanel canvas={canvas} />}
            {activeTab === 'annotations' && <AnnotationPanel canvas={canvas} />}
            {activeTab === 'compression' && <ImageCompression image={image} />}
            {activeTab === 'stream' && <ProgressiveStream image={image} />}
            {activeTab === 'tags' && <TagPanel image={image} />}
            <EditHistory image={image} />
          </div>
        )}
      </div>
    </div>
  );
}