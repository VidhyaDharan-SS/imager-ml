import React, { useState } from 'react';
import { TagSuggestions } from './tags/TagSuggestions';
import { EditableTag } from './tags/EditableTag';
import { useImageStore } from '../store/imageStore';
import { Tag } from '../types';
import { Plus, Tag as TagIcon, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function TagManager() {
  const { tags, addTag, updateTag, removeTag, images, updateImage } = useImageStore();
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Other');
  const [showSuggestions, setShowSuggestions] = useState(false);

  
  const categories = ['Nature', 'People', 'Objects', 'Other'];

  const handleCreateTag = () => {
    if (!newTagInput.trim()) return;

    const newTag: Tag = {
      value: newTagInput.toLowerCase(),
      label: newTagInput,
      category: selectedCategory as Tag['category'],
      color: '#9333ea', // Default color
    };

    addTag(newTag);
    setNewTagInput('');
  };

  const handleTagUpdate = (value: string, updates: Partial<Tag>) => {
    updateTag(value, updates);
  };

  const handleTagDelete = (value: string) => {
    removeTag(value);
    // Remove tag from all images
    images.forEach(img => {
      if (img.tags.includes(value)) {
        updateImage(img.id, {
          tags: img.tags.filter(t => t !== value)
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => {
              setNewTagInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Create new tag..."
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {showSuggestions && (
            <div className="absolute z-50 w-full mt-1">
              <TagSuggestions
                tags={tags}
                selectedTags={[]}
                onSelect={(selected) => {
                  setNewTagInput(selected[0] || '');
                  setShowSuggestions(false);
                }}
              />
            </div>
          )}
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <button
          onClick={handleCreateTag}
          className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Tag
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(category => (
          <div key={category} className="space-y-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <Hash className="h-4 w-4 mr-1" />
              {category}
            </h3>
            <AnimatePresence mode="popLayout">
              {tags
                .filter(tag => tag.category === category)
                .map(tag => (
                  <motion.div
                    key={tag.value}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <EditableTag
                      tag={tag}
                      onUpdate={handleTagUpdate}
                      onDelete={handleTagDelete}
                    />
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
