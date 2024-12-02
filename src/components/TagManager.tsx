import React, { useState } from 'react';
import Select from 'react-select';
import { useImageStore } from '../store/imageStore';
import { Tag } from '../types';
import { Plus, Tag as TagIcon } from 'lucide-react';

export function TagManager() {
  const { tags, addTag, images, updateImage } = useImageStore();
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Other');

  const categories = ['Nature', 'People', 'Objects', 'Other'];

  const handleCreateTag = () => {
    if (!newTagInput.trim()) return;

    const newTag: Tag = {
      value: newTagInput.toLowerCase(),
      label: newTagInput,
      category: selectedCategory as Tag['category'],
      children: [],
    };

    addTag(newTag);
    setNewTagInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTag();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Create new tag..."
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
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

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag.value}
            className="flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full"
          >
            <TagIcon className="h-4 w-4 mr-1" />
            <span>{tag.label}</span>
            <span className="ml-2 px-2 py-0.5 bg-purple-200 dark:bg-purple-800 rounded-full text-xs">
              {tag.category}
            </span>
          </div>
        ))}
      </div>

      <Select
        isMulti
        options={tags}
        className="w-full"
        placeholder="Filter by tags..."
        formatGroupLabel={(data) => (
          <div className="flex items-center justify-between">
            <span>{data.label}</span>
            <span className="bg-gray-200 rounded-full px-2 py-1 text-xs">
              {data.options.length}
            </span>
          </div>
        )}
      />
    </div>
  );
}