import React, { useState } from 'react';
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Crop, Move } from 'lucide-react';
import { fabric } from 'fabric';
import { useImageStore } from '../../store/imageStore';
import { motion } from 'framer-motion';

interface TransformPanelProps {
  canvas: fabric.Canvas | null;
}

export function TransformPanel({ canvas }: TransformPanelProps) {
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<fabric.Rect | null>(null);
  const [angle, setAngle] = useState(0);
  const { selectedImage, addEditAction } = useImageStore();

  const handleRotate = (direction: 'cw' | 'ccw') => {
    if (!canvas) return;

    const delta = direction === 'cw' ? 90 : -90;
    const newAngle = (angle + delta) % 360;
    setAngle(newAngle);

    const backgroundImage = canvas.backgroundImage as fabric.Image;
    if (backgroundImage) {
      backgroundImage.rotate(newAngle);
      canvas.renderAll();

      if (selectedImage) {
        addEditAction(selectedImage, {
          id: Date.now().toString(),
          type: 'rotate',
          timestamp: Date.now(),
          description: `Rotated image ${direction === 'cw' ? 'clockwise' : 'counterclockwise'}`,
          params: { angle: newAngle },
        });
      }
    }
  };

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    if (!canvas) return;

    const backgroundImage = canvas.backgroundImage as fabric.Image;
    if (backgroundImage) {
      if (direction === 'horizontal') {
        backgroundImage.flipX = !backgroundImage.flipX;
      } else {
        backgroundImage.flipY = !backgroundImage.flipY;
      }
      canvas.renderAll();

      if (selectedImage) {
        addEditAction(selectedImage, {
          id: Date.now().toString(),
          type: 'flip',
          timestamp: Date.now(),
          description: `Flipped image ${direction}`,
          params: { direction },
        });
      }
    }
  };

  const handleCrop = () => {
    if (!canvas || !cropRect) return;

    const rect = cropRect.getBoundingRect();
    const cropped = canvas.toDataURL({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });

    canvas.clear();
    canvas.setDimensions({
      width: rect.width,
      height: rect.height,
    });

    fabric.Image.fromURL(cropped, (img) => {
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    });

    setCropMode(false);
    setCropRect(null);

    if (selectedImage) {
      addEditAction(selectedImage, {
        id: Date.now().toString(),
        type: 'crop',
        timestamp: Date.now(),
        description: 'Cropped image',
        params: {
          width: rect.width,
          height: rect.height,
        },
      });
    }
  };

  const startCrop = () => {
    if (!canvas) return;

    setCropMode(true);
    const rect = new fabric.Rect({
      left: 50,
      top: 50,
      width: canvas.width! - 100,
      height: canvas.height! - 100,
      fill: 'rgba(0,0,0,0.3)',
      stroke: '#fff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    setCropRect(rect);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Move className="h-5 w-5 mr-2" />
          Transform
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => handleRotate('ccw')}
            className="flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Rotate Left
          </button>
          <button
            onClick={() => handleRotate('cw')}
            className="flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <RotateCw className="h-5 w-5 mr-2" />
            Rotate Right
          </button>
          <button
            onClick={() => handleFlip('horizontal')}
            className="flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <FlipHorizontal className="h-5 w-5 mr-2" />
            Flip H
          </button>
          <button
            onClick={() => handleFlip('vertical')}
            className="flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <FlipVertical className="h-5 w-5 mr-2" />
            Flip V
          </button>
        </div>

        <div className="space-y-4">
          {!cropMode ? (
            <button
              onClick={startCrop}
              className="w-full flex items-center justify-center p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              <Crop className="h-5 w-5 mr-2" />
              Start Crop
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag the corners to adjust crop area
              </p>
              <button
                onClick={handleCrop}
                className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Apply Crop
              </button>
              <button
                onClick={() => {
                  if (canvas && cropRect) {
                    canvas.remove(cropRect);
                    setCropRect(null);
                  }
                  setCropMode(false);
                }}
                className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}