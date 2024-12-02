import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, Palette, RotateCw } from 'lucide-react';
import { useImageStore } from '../../store/imageStore';
import { ImageFilters } from '../../types';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

interface FilterPanelProps {
  canvas: fabric.Canvas | null;
}

export function FilterPanel({ canvas }: FilterPanelProps) {
  const { selectedImage, images, updateImage, addEditAction } = useImageStore();
  const image = images.find(img => img.id === selectedImage);
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
    preset: ''
  });

  useEffect(() => {
    if (image?.filters) {
      setFilters(image.filters);
    }
  }, [image]);

  const applyFilters = async (newFilters: ImageFilters) => {
    if (!canvas || !selectedImage) return;

    const backgroundImage = canvas.backgroundImage as fabric.Image;
    if (backgroundImage) {
      backgroundImage.filters = [];

      // Apply basic filters
      if (newFilters.brightness !== 100) {
        backgroundImage.filters.push(new fabric.Image.filters.Brightness({
          brightness: (newFilters.brightness - 100) / 100
        }));
      }

      if (newFilters.contrast !== 100) {
        backgroundImage.filters.push(new fabric.Image.filters.Contrast({
          contrast: newFilters.contrast / 100
        }));
      }

      if (newFilters.saturation !== 100) {
        backgroundImage.filters.push(new fabric.Image.filters.Saturation({
          saturation: newFilters.saturation / 100
        }));
      }

      if (newFilters.blur > 0) {
        backgroundImage.filters.push(new fabric.Image.filters.Blur({
          blur: newFilters.blur / 10
        }));
      }

      if (newFilters.noise > 0) {
        backgroundImage.filters.push(new fabric.Image.filters.Noise({
          noise: newFilters.noise
        }));
      }

      if (newFilters.sharpen > 0) {
        backgroundImage.filters.push(new fabric.Image.filters.Convolute({
          matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0]
        }));
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
    }
  };

  const handleFilterChange = async (name: keyof ImageFilters, value: number) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    await applyFilters(newFilters);

    // Add to edit history
    addEditAction(selectedImage!, {
      id: Date.now().toString(),
      type: 'filter',
      timestamp: Date.now(),
      description: `Adjusted ${name} filter`,
      params: { [name]: value }
    });

    // Update image in store
    updateImage(selectedImage!, { filters: newFilters });
  };

  const resetFilters = async () => {
    if (!canvas || !selectedImage) return;

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
      preset: ''
    };

    setFilters(defaultFilters);
    await applyFilters(defaultFilters);

    addEditAction(selectedImage, {
      id: Date.now().toString(),
      type: 'filter',
      timestamp: Date.now(),
      description: 'Reset all filters'
    });

    updateImage(selectedImage, { filters: defaultFilters });
    toast.success('Filters reset successfully');
  };

  const filterControls = [
    { name: 'brightness', label: 'Brightness', min: 0, max: 200, step: 1 },
    { name: 'contrast', label: 'Contrast', min: 0, max: 200, step: 1 },
    { name: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1 },
    { name: 'blur', label: 'Blur', min: 0, max: 100, step: 1 },
    { name: 'noise', label: 'Noise', min: 0, max: 100, step: 1 },
    { name: 'sharpen', label: 'Sharpen', min: 0, max: 100, step: 1 },
    { name: 'vintage', label: 'Vintage', min: 0, max: 100, step: 1 },
    { name: 'dramatic', label: 'Dramatic', min: 0, max: 100, step: 1 },
    { name: 'vibrant', label: 'Vibrant', min: 0, max: 100, step: 1 },
  ] as const;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Sliders className="h-5 w-5 mr-2" />
            Image Filters
          </h3>
          <button
            onClick={resetFilters}
            className="flex items-center px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <RotateCw className="h-4 w-4 mr-1" />
            Reset Filters
          </button>
        </div>

        <div className="space-y-4">
          {filterControls.map(({ name, label, min, max, step }) => (
            <motion.div
              key={name}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-700 dark:text-gray-300">{label}</label>
                <span className="text-gray-500 dark:text-gray-400">
                  {filters[name as keyof ImageFilters]}
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={filters[name as keyof ImageFilters]}
                  onChange={(e) => handleFilterChange(name as keyof ImageFilters, Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div 
                  className="absolute left-0 top-0 h-2 bg-purple-500 rounded-l-lg pointer-events-none"
                  style={{ 
                    width: `${((filters[name as keyof ImageFilters] - min) / (max - min)) * 100}%` 
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}