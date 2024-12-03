import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { HexColorPicker } from 'react-colorful';
import {
  Pencil, Square, Circle, Type, ArrowRight,
  RotateCw, FlipHorizontal, FlipVertical, Maximize2, 
  Undo, Redo, Trash2
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
    'draw' | 'rect' | 'circle' | 'text' | 'arrow'
  >('draw');
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [angle, setAngle] = useState(0);
  const [isDrawingArrow, setIsDrawingArrow] = useState(false);
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!canvas) return;

    // Save initial state
    const initialState = JSON.stringify(canvas.toJSON());
    setUndoStack([initialState]);

    canvas.isDrawingMode = tool === 'draw';
    
    if (tool === 'draw') {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = brushSize;
    } else if (tool === 'arrow') {
      canvas.on('mouse:down', handleArrowStart);
      canvas.on('mouse:move', handleArrowMove);
      canvas.on('mouse:up', handleArrowEnd);
    }

    // Save state for undo/redo
    const handleObjectModified = () => {
      const json = JSON.stringify(canvas.toJSON());
      setUndoStack(prev => [...prev, json]);
      setRedoStack([]);

      if (selectedImage) {
        addEditAction(selectedImage, {
          id: Date.now().toString(),
          type: 'annotation',
          timestamp: Date.now(),
          description: `Modified ${tool} annotation`,
          params: { tool, color, brushSize },
        });
      }
    };

    canvas.on('object:added', handleObjectModified);
    canvas.on('object:modified', handleObjectModified);

    return () => {
      canvas.off('object:added', handleObjectModified);
      canvas.off('object:modified', handleObjectModified);
      if (tool === 'arrow') {
        canvas.off('mouse:down', handleArrowStart);
        canvas.off('mouse:move', handleArrowMove);
        canvas.off('mouse:up', handleArrowEnd);
      }
    };
  }, [tool, color, brushSize, canvas, selectedImage, addEditAction]);

  const handleArrowStart = (event: fabric.IEvent) => {
    if (!canvas || !event.pointer) return;
    setIsDrawingArrow(true);
    setArrowStart({ x: event.pointer.x, y: event.pointer.y });
  };

  const handleArrowMove = (event: fabric.IEvent) => {
    if (!canvas || !isDrawingArrow || !arrowStart || !event.pointer) return;

    // Remove previous arrow if exists
    const objects = canvas.getObjects();
    const lastObject = objects[objects.length - 1];
    if (lastObject?.data?.isTemporaryArrow) {
      canvas.remove(lastObject);
    }

    // Calculate arrow points
    const points = [
      arrowStart.x,
      arrowStart.y,
      event.pointer.x,
      event.pointer.y
    ];

    // Create arrow line
    const line = new fabric.Line(points, {
      stroke: color,
      strokeWidth: brushSize,
      selectable: true,
      data: { isTemporaryArrow: true }
    });

    // Calculate arrow head points
    const angle = Math.atan2(points[3] - points[1], points[2] - points[0]);
    const headLength = brushSize * 3;
    const headAngle = Math.PI / 6;

    const head1X = points[2] - headLength * Math.cos(angle - headAngle);
    const head1Y = points[3] - headLength * Math.sin(angle - headAngle);
    const head2X = points[2] - headLength * Math.cos(angle + headAngle);
    const head2Y = points[3] - headLength * Math.sin(angle + headAngle);

    // Create arrow head
    const head = new fabric.Triangle({
      left: points[2],
      top: points[3],
      angle: (angle * 180) / Math.PI + 90,
      width: brushSize * 3,
      height: brushSize * 3,
      fill: color,
      selectable: true,
      data: { isTemporaryArrow: true }
    });

    // Group line and head
    const arrow = new fabric.Group([line, head], {
      selectable: true,
      data: { isTemporaryArrow: true }
    });

    canvas.add(arrow);
    canvas.renderAll();
  };

  const handleArrowEnd = () => {
    if (!canvas || !isDrawingArrow) return;
    setIsDrawingArrow(false);
    setArrowStart(null);

    // Update the last arrow's data
    const objects = canvas.getObjects();
    const lastObject = objects[objects.length - 1];
    if (lastObject?.data?.isTemporaryArrow) {
      lastObject.data.isTemporaryArrow = false;
    }
  };

  const handleUndo = () => {
    if (!canvas || undoStack.length <= 1) return;
    
    const currentState = undoStack[undoStack.length - 1];
    const previousState = undoStack[undoStack.length - 2];
    
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
  };

  const handleRedo = () => {
    if (!canvas || redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    
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

  const handleClearCanvas = () => {
    if (!canvas) return;

    const backgroundImage = canvas.backgroundImage;
    canvas.clear();
    if (backgroundImage) {
      canvas.setBackgroundImage(backgroundImage, canvas.renderAll.bind(canvas));
    }

    const clearedState = JSON.stringify(canvas.toJSON());
    setUndoStack([clearedState]);
    setRedoStack([]);

    if (selectedImage) {
      addEditAction(selectedImage, {
        id: Date.now().toString(),
        type: 'clear',
        timestamp: Date.now(),
        description: 'Cleared canvas',
      });
    }
  };

  const addShape = (type: 'rect' | 'circle') => {
    if (!canvas) return;

    let shape: fabric.Object;
    if (type === 'rect') {
      shape = new fabric.Rect({
        left: canvas.width! / 2 - 50,
        top: canvas.height! / 2 - 50,
        width: 100,
        height: 100,
        fill: 'transparent',
        stroke: color,
        strokeWidth: 2,
      });
    } else {
      shape = new fabric.Circle({
        left: canvas.width! / 2 - 50,
        top: canvas.height! / 2 - 50,
        radius: 50,
        fill: 'transparent',
        stroke: color,
        strokeWidth: 2,
      });
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const addText = () => {
    if (!canvas) return;

    const text = new fabric.IText('Double click to edit', {
      left: canvas.width! / 2 - 50,
      top: canvas.height! / 2 - 10,
      fontFamily: 'Arial',
      fill: color,
      fontSize: 20,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  useHotkeys('ctrl+z', handleUndo, [undoStack]);
  useHotkeys('ctrl+y', handleRedo, [redoStack]);
  useHotkeys('delete', () => {
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.remove(activeObject);
        canvas.renderAll();
      }
    }
  }, [canvas]);

  const tools = [
    { id: 'draw', icon: Pencil, label: 'Draw' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  ] as const;

  const transformTools = [
    { icon: RotateCw, label: 'Rotate', action: () => handleRotate('cw') },
    { icon: FlipHorizontal, label: 'Flip H', action: () => handleFlip('horizontal') },
    { icon: FlipVertical, label: 'Flip V', action: () => handleFlip('vertical') },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
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
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              className="p-2 rounded flex flex-col items-center bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{label}</span>
            </button>
          ))}
        </div>

        {(tool === 'draw') && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span>{brushSize}</span>
                <span>50</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
                    <HexColorPicker color={color} onChange={setColor} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleUndo}
            disabled={undoStack.length <= 1}
            className="flex-1 py-2 px-4 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="flex-1 py-2 px-4 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Redo className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={handleClearCanvas}
            className="flex-1 py-2 px-4 bg-red-100 text-red-600 rounded hover:bg-red-200"
          >
            <Trash2 className="h-4 w-4 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}