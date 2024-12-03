import React, { useState } from 'react';
import { RotateCw, RotateCcw, ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { fabric } from 'fabric';
import { useImageStore } from '../../store/imageStore';

interface RotationControlsProps {
  canvas: fabric.Canvas | null;
  imageId: string;
}

export function RotationControls({ canvas, imageId }: RotationControlsProps) {
  const { addEditAction } = useImageStore();
  const [rotationAngle, setRotationAngle] = useState(0);
  const [axis, setAxis] = useState<'center' | 'x' | 'y' | '-x' | '-y'>('center');

  const handleRotate = (direction: 'cw' | 'ccw') => {
    if (!canvas) return;

    const delta = direction === 'cw' ? 90 : -90;
    const newAngle = (rotationAngle + delta) % 360;
    setRotationAngle(newAngle);

    const backgroundImage = canvas.backgroundImage as fabric.Image;
    if (backgroundImage) {
      backgroundImage.rotate(newAngle);
      canvas.renderAll();

      addEditAction(imageId, {
        id: Date.now().toString(),
        type: 'rotate',
        timestamp: Date.now(),
        description: `Rotated image ${direction === 'cw' ? 'clockwise' : 'counterclockwise'}`,
        params: { angle: newAngle, axis },
      });
    }
  };

  const handleCustomRotation = () => {
    if (!canvas) return;

    const backgroundImage = canvas.backgroundImage as fabric.Image;
    if (backgroundImage) {
      let originX: number = backgroundImage.width! / 2;
      let originY: number = backgroundImage.height! / 2;

      switch (axis) {
        case 'x':
          originY = 0;
          break;
        case '-x':
          originY = backgroundImage.height!;
          break;
        case 'y':
          originX = 0;
          break;
        case '-y':
          originX = backgroundImage.width!;
          break;
      }

      backgroundImage.setPositionByOrigin(
        new fabric.Point(originX, originY),
        'center',
        'center'
      );
      backgroundImage.rotate(rotationAngle);
      canvas.renderAll();

      addEditAction(imageId, {
        id: Date.now().toString(),
        type: 'customRotate',
        timestamp: Date.now(),
        description: `Custom rotation by ${rotationAngle}° around ${axis} axis`,
        params: { angle: rotationAngle, axis },
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Custom Rotation</label>
        <div className="flex space-x-2">
          <input
            type="number"
            value={rotationAngle}
            onChange={(e) => setRotationAngle(Number(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
            min="-360"
            max="360"
          />
          <select
            value={axis}
            onChange={(e) => setAxis(e.target.value as any)}
            className="px-2 py-1 border rounded"
          >
            <option value="center">Center</option>
            <option value="x">X Axis</option>
            <option value="-x">-X Axis</option>
            <option value="y">Y Axis</option>
            <option value="-y">-Y Axis</option>
          </select>
          <button
            onClick={handleCustomRotation}
            className="px-4 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div />
        <button
          onClick={() => setAxis('x')}
          className={`p-2 rounded ${axis === 'x' ? 'bg-purple-100' : 'bg-gray-100'}`}
        >
          <ArrowUp className="h-4 w-4 mx-auto" />
        </button>
        <div />
        <button
          onClick={() => setAxis('y')}
          className={`p-2 rounded ${axis === 'y' ? 'bg-purple-100' : 'bg-gray-100'}`}
        >
          <ArrowLeft className="h-4 w-4 mx-auto" />
        </button>
        <button
          onClick={() => setAxis('center')}
          className={`p-2 rounded ${axis === 'center' ? 'bg-purple-100' : 'bg-gray-100'}`}
        >
          <div className="w-4 h-4 bg-current rounded-full mx-auto" />
        </button>
        <button
          onClick={() => setAxis('-y')}
          className={`p-2 rounded ${axis === '-y' ? 'bg-purple-100' : 'bg-gray-100'}`}
        >
          <ArrowRight className="h-4 w-4 mx-auto" />
        </button>
        <div />
        <button
          onClick={() => setAxis('-x')}
          className={`p-2 rounded ${axis === '-x' ? 'bg-purple-100' : 'bg-gray-100'}`}
        >
          <ArrowDown className="h-4 w-4 mx-auto" />
        </button>
        <div />
      </div>
    </div>
  );
}