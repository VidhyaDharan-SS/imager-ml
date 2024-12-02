import exifr from 'exifr';
import { ImageMetadata } from '../types';

export async function extractMetadata(file: File): Promise<ImageMetadata> {
  try {
    const exif = await exifr.parse(file);
    const basic = {
      width: 0,
      height: 0,
      format: file.type.split('/')[1],
      size: file.size,
      created: file.lastModified ? new Date(file.lastModified).toISOString() : undefined,
    };

    // Create image to get dimensions
    const img = new Image();
    const dimensionsPromise = new Promise<{ width: number; height: number }>((resolve) => {
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        });
      };
    });
    img.src = URL.createObjectURL(file);
    const dimensions = await dimensionsPromise;

    return {
      ...basic,
      ...dimensions,
      camera: exif ? {
        make: exif.Make,
        model: exif.Model,
        focalLength: exif.FocalLength,
        aperture: exif.FNumber,
        iso: exif.ISO,
        exposureTime: exif.ExposureTime,
      } : undefined,
      location: exif?.latitude && exif?.longitude ? {
        latitude: exif.latitude,
        longitude: exif.longitude,
      } : undefined,
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      width: 0,
      height: 0,
      format: file.type.split('/')[1],
      size: file.size,
    };
  }
}

export function formatMetadata(metadata: ImageMetadata): string {
  const parts = [
    `${metadata.width}×${metadata.height}px`,
    `${(metadata.size / 1024 / 1024).toFixed(2)}MB`,
    metadata.format.toUpperCase(),
  ];

  if (metadata.camera) {
    const { make, model, focalLength, aperture, iso } = metadata.camera;
    if (make && model) parts.push(`${make} ${model}`);
    if (focalLength) parts.push(`${focalLength}mm`);
    if (aperture) parts.push(`f/${aperture}`);
    if (iso) parts.push(`ISO ${iso}`);
  }

  return parts.join(' • ');
}