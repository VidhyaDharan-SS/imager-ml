export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  tags: string[];
  editHistory: EditAction[];
  filters: ImageFilters;
  metadata?: ImageMetadata;
}

export interface EditAction {
  id: string;
  type: string;
  timestamp: number;
  description: string;
  params?: Record<string, any>;
}

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  vintage: number;
  dramatic: number;
  vibrant: number;
  sepia: number;
  blur: number;
  sharpen: number;
  noise: number;
  vignette: number;
  preset: string;
}

export interface Tag {
  value: string;
  label: string;
  category: 'Nature' | 'People' | 'Objects' | 'Other';
  color?: string;
  parent?: string;
  children?: string[];
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  created?: string;
  modified?: string;
  camera?: {
    make?: string;
    model?: string;
    focalLength?: number;
    aperture?: number;
    iso?: number;
    exposureTime?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface BatchOperation {
  type: 'edit' | 'compress' | 'stream';
  imageIds: string[];
  settings?: Record<string, any>;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Partial<ImageFilters>;
  thumbnail?: string;
}

export interface ExportSettings {
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  preserveAspectRatio: boolean;
  includeMetadata: boolean;
}