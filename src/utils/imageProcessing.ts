import { fabric } from 'fabric';
import { saveAs } from 'file-saver';
import imageCompression from 'browser-image-compression';
import { ImageFile, ImageFilters, ExportSettings } from '../types';

export async function processImage(
  image: ImageFile,
  options: {
    filters?: Partial<ImageFilters>;
    export?: ExportSettings;
    resize?: { width: number; height: number };
  }
) {
  const canvas = new fabric.Canvas(null);
  const fabricImage = await new Promise<fabric.Image>((resolve) => {
    fabric.Image.fromURL(image.preview, (img) => resolve(img));
  });

  canvas.setDimensions({
    width: fabricImage.width!,
    height: fabricImage.height!,
  });

  // Apply filters
  if (options.filters) {
    const filters: fabric.IBaseFilter[] = [];

    if (options.filters.brightness !== undefined) {
      filters.push(new fabric.Image.filters.Brightness({
        brightness: (options.filters.brightness - 100) / 100,
      }));
    }

    if (options.filters.contrast !== undefined) {
      filters.push(new fabric.Image.filters.Contrast({
        contrast: options.filters.contrast / 100,
      }));
    }

    if (options.filters.saturation !== undefined) {
      filters.push(new fabric.Image.filters.Saturation({
        saturation: options.filters.saturation / 100,
      }));
    }

    if (options.filters.sepia) {
      filters.push(new fabric.Image.filters.Sepia());
    }

    if (options.filters.blur) {
      filters.push(new fabric.Image.filters.Blur({
        blur: options.filters.blur / 10,
      }));
    }

    if (options.filters.noise) {
      filters.push(new fabric.Image.filters.Noise({
        noise: options.filters.noise,
      }));
    }

    if (options.filters.vignette) {
      // Custom vignette filter implementation
      filters.push(new fabric.Image.filters.Vignette({
        radius: options.filters.vignette / 100,
      }));
    }

    fabricImage.filters = filters;
    fabricImage.applyFilters();
  }

  // Handle resizing
  if (options.resize) {
    fabricImage.scaleToWidth(options.resize.width);
    fabricImage.scaleToHeight(options.resize.height);
  }

  canvas.add(fabricImage);
  canvas.centerObject(fabricImage);
  canvas.renderAll();

  // Export handling
  if (options.export) {
    const { format, quality, maxWidth, maxHeight, preserveAspectRatio } = options.export;
    let exportCanvas = canvas;

    if (maxWidth || maxHeight) {
      const scaleFactor = preserveAspectRatio
        ? Math.min(
            maxWidth ? maxWidth / canvas.width! : 1,
            maxHeight ? maxHeight / canvas.height! : 1
          )
        : 1;

      exportCanvas = new fabric.Canvas(null);
      exportCanvas.setDimensions({
        width: canvas.width! * scaleFactor,
        height: canvas.height! * scaleFactor,
      });

      const scaled = new fabric.Image(canvas.toDataURL());
      scaled.scale(scaleFactor);
      exportCanvas.add(scaled);
      exportCanvas.renderAll();
    }

    const dataUrl = exportCanvas.toDataURL({
      format,
      quality,
    });

    // Convert data URL to Blob and save
    const blob = await (await fetch(dataUrl)).blob();
    saveAs(blob, `${image.file.name.split('.')[0]}_edited.${format}`);
  }

  // Return updated image data
  return {
    ...image,
    preview: canvas.toDataURL(),
    filters: {
      ...image.filters,
      ...options.filters,
    },
  };
}

export async function compressImage(file: File, options: {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
}) {
  const compressedFile = await imageCompression(file, {
    maxSizeMB: options.maxSizeMB || 1,
    maxWidthOrHeight: options.maxWidthOrHeight || 1920,
    useWebWorker: true,
    initialQuality: options.quality || 0.8,
  });

  return compressedFile;
}