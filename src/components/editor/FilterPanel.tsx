import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Sliders, Sparkles, Palette } from 'lucide-react';
import { useImageStore } from '../../store/imageStore';
import { ImageFilters } from '../../types';
import tinycolor from 'tinycolor2';

interface FilterPanelProps {
  canvas: fabric.Canvas | null;
}

export function FilterPanel({ canvas }: FilterPanelProps) {
  const { selectedImage, images, updateImage } = useImageStore();
  const image = images.find((img) => img.id === selectedImage);
  const [filters, setFilters] = useState<ImageFilters>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    blur: 0,
    sharpen: 0,
    noise: 0,
    vignette: 0,
    vintage: 0,
    dramatic: 0,
    vibrant: 0,
    preset: '',
  });

  useEffect(() => {
    if (image?.filters) {
      setFilters(image.filters);
    }
  }, [image]);

  const handleFilterChange = async (
    name: keyof ImageFilters,
    value: number
  ) => {
    if (!canvas) return;

    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);

    const backgroundImage = canvas.backgroundImage as fabric.Image;
    if (backgroundImage) {
      backgroundImage.filters = [];

      // Apply filters based on values
      if (newFilters.brightness !== 100) {
        backgroundImage.filters.push(
          new fabric.Image.filters.Brightness({
            brightness: (newFilters.brightness - 100) / 100,
          })
        );
      }

      if (newFilters.contrast !== 100) {
        backgroundImage.filters.push(
          new fabric.Image.filters.Contrast({
            contrast: newFilters.contrast / 100,
          })
        );
      }

      if (newFilters.saturation !== 100) {
        backgroundImage.filters.push(
          new fabric.Image.filters.Saturation({
            saturation: newFilters.saturation / 100,
          })
        );
      }

      if (newFilters.sepia > 0) {
        backgroundImage.filters.push(new fabric.Image.filters.Sepia());
      }

      if (newFilters.blur > 0) {
        backgroundImage.filters.push(
          new fabric.Image.filters.Blur({
            blur: newFilters.blur / 10,
          })
        );
      }

      if (newFilters.noise > 0) {
        backgroundImage.filters.push(
          new fabric.Image.filters.Noise({
            noise: newFilters.noise,
          })
        );
      }

      // Apply preset combinations
      if (newFilters.vintage > 0) {
        const intensity = newFilters.vintage / 100;
        backgroundImage.filters.push(
          new fabric.Image.filters.Sepia(),
          new fabric.Image.filters.Contrast({ contrast: 1.1 }),
          new fabric.Image.filters.Noise({ noise: 25 * intensity })
        );
      }

      if (newFilters.dramatic > 0) {
        const intensity = newFilters.dramatic / 100;
        backgroundImage.filters.push(
          new fabric.Image.filters.Contrast({ contrast: 1 + intensity }),
          new fabric.Image.filters.Brightness({ brightness: -0.1 * intensity })
        );
      }

      if (newFilters.vibrant > 0) {
        const intensity = newFilters.vibrant / 100;
        backgroundImage.filters.push(
          new fabric.Image.filters.Saturation({ saturation: 1 + intensity }),
          new fabric.Image.filters.Contrast({ contrast: 1.1 })
        );
      }

      backgroundImage.applyFilters();
      canvas.renderAll();

      if (selectedImage) {
        await updateImage(selectedImage, { filters: newFilters });
      }
    }
  };

  const filterControls = [
    { name: 'brightness', label: 'Brightness', min: 0, max: 200, step: 1 },
    { name: 'contrast', label: 'Contrast', min: 0, max: 200, step: 1 },
    { name: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1 },
    { name: 'sepia', label: 'Sepia', min: 0, max: 100, step: 1 },
    { name: 'blur', label: 'Blur', min: 0, max: 100, step: 1 },
    { name: 'noise', label: 'Noise', min: 0, max: 100, step: 1 },
    { name: 'vintage', label: 'Vintage', min: 0, max: 100, step: 1 },
    { name: 'dramatic', label: 'Dramatic', min: 0, max: 100, step: 1 },
    { name: 'vibrant', label: 'Vibrant', min: 0, max: 100, step: 1 },
  ] as const;

  const resetFilters = () => {
    const defaultFilters: ImageFilters = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
      blur: 0,
      sharpen: 0,
      noise: 0,
      vignette: 0,
      vintage: 0,
      dramatic: 0,
      vibrant: 0,
      preset: '',
    };
    setFilters(defaultFilters);
    handleFilterChange('brightness', 100); // This will trigger a re-render with default values
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Sliders className="h-5 w-5 mr-2" />
            Image Filters
          </h3>
        </div>

        <div className="space-y-4">
          {filterControls.map(({ name, label, min, max, step }) => (
            <div key={name}>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-700 dark:text-gray-300">
                  {label}
                </label>
                <span className="text-gray-500 dark:text-gray-400">
                  {filters[name]}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={filters[name]}
                onChange={(e) =>
                  handleFilterChange(name, Number(e.target.value))
                }
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFilters}
            className="flex items-center px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
