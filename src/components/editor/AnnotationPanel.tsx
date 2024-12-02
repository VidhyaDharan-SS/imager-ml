import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { HexColorPicker } from 'react-colorful';
import {
  Pencil, Square, Circle, Type, Eraser, Crop, RotateCw,
  FlipHorizontal, FlipVertical, Maximize2, Undo, Redo
} from 'lucide-react';
import { useImageStore } from '../../store/imageStore';
import { useHotkeys } from 'react-hotkeys-hook';

interface AnnotationPanelProps {
  canvas: fabric.Canvas | null;
}

export function AnnotationPanel({ canvas }: AnnotationPanelProps) {
  const { selectedImage, addEditAction } = useImageStore();
  const [color, setColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<
    'draw' | 'rect' | 'circle' | 'text' | 'eraser' | 'crop' | 'rotate' | 'resize'
  >('draw');
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (!canvas) return;

    canvas.isDrawingMode = tool === 'draw' || tool === 'eraser';
    
    if (tool === 'draw') {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = brushSize;
    } else if (tool === 'eraser') {
      canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
      canvas.freeDrawingBrush.width = brushSize;
    }

    // Save state for undo/redo
    canvas.on('object:added', () => {
      const json = JSON.stringify(canvas.toJSON());
      setUndoStack(prev => [...prev, json]);
      setRedoStack([]);

      if (selectedImage) {
        addEditAction(selectedImage, {
          id: Date.now().toString(),
          type: 'annotation',
          timestamp: Date.now(),
          description: `Added ${tool} annotation`,
          params: { tool, color, brushSize },
        });
      }
    });

    return () => {
      canvas.off('object:added');
    };
  }, [tool, color, brushSize, canvas, selectedImage, addEditAction]);

  useHotkeys('ctrl+z', () => handleUndo(), [undoStack]);
  useHotkeys('ctrl+y', () => handleRedo(), [redoStack]);
  useHotkeys('delete', () => {
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.remove(activeObject);
        canvas.renderAll();

        if (selectedImage) {
          addEditAction(selectedImage, {
            id: Date.now().toString(),
            type: 'annotation',
            timestamp: Date.now(),
            description: 'Removed annotation',
          });
        }
      }
    }
  }, [canvas, selectedImage]);

  const handleUndo = () => {
    if (!canvas || undoStack.length <= 1) return;
    
    const currentState = undoStack[undoStack.length - 1];
    const previousState = undoStack[undoStack.length - 2];
    
    if (previousState) {
      canvas.loadFromJSON(previousState, () => {
        canvas.renderAll();
        setUndoStack(prev => prev.slice(0, -1));
        setRedoStack(prev => [...prev, currentState]);

        if (selectedImage) {
          addEditAction(selectedImage, {
            id: Date.now().toString(),
            type: 'undo',
            timestamp: Date.now(),
            description: 'Undo action',
          });
        }
      });
    }
  };

  const handleRedo = () => {
    if (!canvas || redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    
    if (nextState) {
      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
        setRedoStack(prev => prev.slice(0, -1));
        setUndoStack(prev => [...prev, nextState]);

        if (selectedImage) {
          addEditAction(selectedImage, {
            id: Date.now().toString(),
            type: 'redo',
            timestamp: Date.now(),
            description: 'Redo action',
          });
        }
      });
    }
  };

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

  const addShape = (type: 'rect' | 'circle') => {
    if (!canvas) return;

    let shape: fabric.Object;
    if (type === 'rect') {
      shape = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: 'transparent',
        stroke: color,
        strokeWidth: 2,
      });
    } else {
      shape = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: 'transparent',
        stroke: color,
        strokeWidth: 2,
      });
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();

    if (selectedImage) {
      addEditAction(selectedImage, {
        id: Date.now().toString(),
        type: 'shape',
        timestamp: Date.now(),
        description: `Added ${type} shape`,
        params: { type, color },
      });
    }
  };

  const addText = () => {
    if (!canvas) return;

    const text = new fabric.IText('Double click to edit', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fill: color,
      fontSize: 20,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();

    if (selectedImage) {
      addEditAction(selectedImage, {
        id: Date.now().toString(),
        type: 'text',
        timestamp: Date.now(),
        description: 'Added text',
        params: { color, fontSize: 20 },
      });
    }
  };

  const tools = [
    { id: 'draw', icon: Pencil, label: 'Draw' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ] as const;

  const transformTools = [
    { icon: RotateCw, label: 'Rotate Right', action: () => handleRotate('cw') },
    { icon: FlipHorizontal, label: 'Flip H', action: () => handleFlip('horizontal') },
    { icon: FlipVertical, label: 'Flip V', action: () => handleFlip('vertical') },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="grid grid-cols-5 gap-2 mb-4">
          {tools.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                setTool(id);
                if (id === 'rect') addShape('rect');
                if (id === 'circle') addShape('circle');
                if (id === 'text') addText();
              }}
              className={`p-2 rounded flex flex-col items-center ${
                tool === id 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {transformTools.map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              className="p-2 rounded flex flex-col items-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{label}</span>
            </button>
          ))}
        </div>

        {(tool === 'draw' || tool === 'eraser') && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Size
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {tool === 'draw' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-full h-10 rounded border"
                    style={{ backgroundColor: color }}
                  />
                  {showColorPicker && (
                    <div className="absolute z-10 mt-2">
                      <HexColorPicker color={color} onChange={setColor} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleUndo}
            disabled={undoStack.length <= 1}
            className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <Undo className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <Redo className="h-4 w-4 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}