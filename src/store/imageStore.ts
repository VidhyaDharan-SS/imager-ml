import { create } from 'zustand';
import { ImageFile, EditAction, Tag, BatchOperation, FilterPreset, ExportSettings } from '../types';
import { processImage } from '../utils/imageProcessing';
import { extractMetadata } from '../utils/metadata';
import Fuse from 'fuse.js';

interface ImageStore {
  images: ImageFile[];
  selectedImage: string | null;
  tags: Tag[];
  filterPresets: FilterPreset[];
  batchOperations: BatchOperation[];
  searchQuery: string;
  sortBy: 'name' | 'date' | 'size';
  sortDirection: 'asc' | 'desc';
  addImage: (image: ImageFile) => void;
  removeImage: (id: string) => void;
  updateImage: (id: string, updates: Partial<ImageFile>) => void;
  setSelectedImage: (id: string | null) => void;
  addTag: (tag: Tag) => void;
  updateTag: (value: string, updates: Partial<Tag>) => void;
  removeTag: (value: string) => void;
  addEditAction: (imageId: string, action: EditAction) => void;
  addBatchOperation: (operation: BatchOperation) => Promise<void>;
  addFilterPreset: (preset: FilterPreset) => void;
  applyFilterPreset: (imageId: string, presetId: string) => Promise<void>;
  exportImage: (imageId: string, settings: ExportSettings) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'name' | 'date' | 'size') => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  getFilteredAndSortedImages: () => ImageFile[];
}

export const useImageStore = create<ImageStore>((set, get) => ({
  images: [],
  selectedImage: null,
  tags: [
    { value: 'nature', label: 'Nature', category: 'Nature' },
    { value: 'people', label: 'People', category: 'People' },
    { value: 'objects', label: 'Objects', category: 'Objects' },
  ],
  filterPresets: [
    {
      id: 'vintage',
      name: 'Vintage',
      filters: {
        brightness: 90,
        contrast: 110,
        saturation: 80,
        sepia: 50,
        vignette: 30,
        vintage: 100,
        dramatic: 0,
        vibrant: 0,
        blur: 0,
        sharpen: 0,
        noise: 20,
        preset: 'vintage',
      },
    },
    {
      id: 'dramatic',
      name: 'Dramatic',
      filters: {
        brightness: 90,
        contrast: 150,
        saturation: 120,
        sepia: 0,
        vignette: 50,
        vintage: 0,
        dramatic: 100,
        vibrant: 0,
        blur: 0,
        sharpen: 30,
        noise: 10,
        preset: 'dramatic',
      },
    },
  ],
  batchOperations: [],
  searchQuery: '',
  sortBy: 'name',
  sortDirection: 'asc',

  addImage: async (image) => {
    const metadata = await extractMetadata(image.file);
    set((state) => ({
      images: [...state.images, { 
        ...image, 
        metadata,
        editHistory: [],
        filters: {
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
        }
      }],
    }));
  },

  removeImage: (id) =>
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
      selectedImage: state.selectedImage === id ? null : state.selectedImage,
    })),

  updateImage: (id, updates) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, ...updates } : img
      ),
    })),

  setSelectedImage: (id) => set({ selectedImage: id }),

  addTag: (tag) =>
    set((state) => ({ tags: [...state.tags, tag] })),

  updateTag: (value, updates) =>
    set((state) => ({
      tags: state.tags.map((tag) =>
        tag.value === value ? { ...tag, ...updates } : tag
      ),
    })),

  removeTag: (value) =>
    set((state) => ({
      tags: state.tags.filter((tag) => tag.value !== value),
    })),

  addEditAction: (imageId, action) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === imageId
          ? { ...img, editHistory: [...(img.editHistory || []), action] }
          : img
      ),
    })),

  addBatchOperation: async (operation) => {
    const { images, updateImage, addEditAction } = get();
    const selectedImages = images.filter((img) => operation.imageIds.includes(img.id));

    for (const image of selectedImages) {
      const processedImage = await processImage(image, operation.settings);
      const action: EditAction = {
        id: Date.now().toString(),
        type: operation.type,
        timestamp: Date.now(),
        description: `Batch ${operation.type} operation`,
        params: operation.settings,
      };
      
      updateImage(image.id, processedImage);
      addEditAction(image.id, action);
    }

    set((state) => ({
      batchOperations: [...state.batchOperations, operation],
    }));
  },

  addFilterPreset: (preset) =>
    set((state) => ({
      filterPresets: [...state.filterPresets, preset],
    })),

  applyFilterPreset: async (imageId, presetId) => {
    const { images, filterPresets, updateImage, addEditAction } = get();
    const image = images.find((img) => img.id === imageId);
    const preset = filterPresets.find((p) => p.id === presetId);

    if (image && preset) {
      const processedImage = await processImage(image, {
        filters: preset.filters,
      });

      const action: EditAction = {
        id: Date.now().toString(),
        type: 'preset',
        timestamp: Date.now(),
        description: `Applied ${preset.name} preset`,
        params: preset.filters,
      };

      updateImage(imageId, processedImage);
      addEditAction(imageId, action);
    }
  },

  exportImage: async (imageId, settings) => {
    const { images } = get();
    const image = images.find((img) => img.id === imageId);

    if (image) {
      await processImage(image, { export: settings });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortDirection: (direction) => set({ sortDirection }),

  getFilteredAndSortedImages: () => {
    const { images, searchQuery, sortBy, sortDirection, tags } = get();
    
    let filteredImages = images;
    if (searchQuery) {
      const fuse = new Fuse(images, {
        keys: ['file.name', 'tags'],
        threshold: 0.3,
      });
      filteredImages = fuse.search(searchQuery).map(result => result.item);
    }

    return [...filteredImages].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.file.name.localeCompare(b.file.name);
          break;
        case 'date':
          comparison = a.file.lastModified - b.file.lastModified;
          break;
        case 'size':
          comparison = a.file.size - b.file.size;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  },
}));