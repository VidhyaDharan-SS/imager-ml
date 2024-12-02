import { useState, useCallback } from 'react';
import { useImageStore } from '../store/imageStore';
import { ImageFilters, EditAction } from '../types';
import { generateId } from '../utils/helpers';

export function useImageEditor(imageId: string) {
  const { updateImage, addEditAction } = useImageStore();
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  const initCanvas = useCallback((canvasElement: HTMLCanvasElement) => {
    const context = canvasElement.getContext('2d');
    if (context) {
      setCanvas(canvasElement);
      setCtx(context);
    }
  }, []);

  const applyFilters = useCallback((filters: ImageFilters) => {
    if (!ctx || !canvas) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply filters to each pixel
    for (let i = 0; i < data.length; i += 4) {
      // Brightness
      const brightnessMultiplier = filters.brightness / 100;
      data[i] *= brightnessMultiplier;     // Red
      data[i + 1] *= brightnessMultiplier; // Green
      data[i + 2] *= brightnessMultiplier; // Blue

      // Contrast
      const contrast = (filters.contrast - 100) * 2.55;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      data[i] = factor * (data[i] - 128) + 128;
      data[i + 1] = factor * (data[i + 1] - 128) + 128;
      data[i + 2] = factor * (data[i + 2] - 128) + 128;
    }

    ctx.putImageData(imageData, 0, 0);

    const action: EditAction = {
      id: generateId(),
      type: 'filters',
      timestamp: Date.now(),
      description: 'Applied filters',
      params: filters,
    };

    addEditAction(imageId, action);
    updateImage(imageId, { filters });
  }, [ctx, canvas, imageId, updateImage, addEditAction]);

  return {
    canvas,
    ctx,
    initCanvas,
    applyFilters,
  };
}