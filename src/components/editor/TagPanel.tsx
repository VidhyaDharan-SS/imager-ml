import React, { useState, useEffect } from 'react';
import { useImageStore } from '../../store/imageStore';
import { Tag, ImageFile } from '../../types';
import { Tags, Plus, X, ChevronRight, ChevronDown, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TagPanelProps {
  image: ImageFile;
}

export function TagPanel({ image }: TagPanelProps) {
  const { tags, addTag, updateImage } = useImageStore();
  const [newTag, setNewTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Tag['category']>('Other');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Nature']));
  const [searchQuery, setSearchQuery] = useState('');
  
  const imageTags = image.tags;

  const categories: Tag['category'][] = ['Nature', 'People', 'Objects', 'Other'];

  const handleAddTag = () => {
    if (!newTag.trim()) return;

    const tag: Tag = {
      value: newTag.toLowerCase(),
      label: newTag,
      category: selectedCategory,
    };

    addTag(tag);
    updateImage(image.id, {
      tags: [...imageTags, tag.value],
    });
    setNewTag('');
  };

  const handleRemoveTag = (tagValue: string) => {
    updateImage(image.id, {
      tags: imageTags.filter(t => t !== tagValue),
    });
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Group tags by category
  const tagsByCategory = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  // Filter tags based on search query
  const filteredTags = tags.filter(tag => 
    tag.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate tag usage statistics
  const tagStats = tags.map(tag => ({
    ...tag,
    count: imageTags.filter(t => t === tag.value).length,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Tags className="h-5 w-5 mr-2" />
          Image Tags
        </h3>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Add new tag..."
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Tag['category'])}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <button
              onClick={handleAddTag}
              className="p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tags..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {imageTags.map(tagValue => {
              const tag = tags.find(t => t.value === tagValue);
              return (
                <motion.div
                  key={tagValue}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg"
                >
                  <Hash className="h-3 w-3 mr-1" />
                  <span className="text-sm">{tag?.label || tagValue}</span>
                  <button
                    onClick={() => handleRemoveTag(tagValue)}
                    className="ml-1 p-1 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 space-y-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Categories</h4>
            {categories.map(category => (
              <div key={category} className="space-y-1">
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  <span>{category}</span>
                  <span className="ml-auto text-sm text-gray-500">
                    {tagsByCategory[category]?.length || 0}
                  </span>
                </button>
                <AnimatePresence>
                  {expandedCategories.has(category) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-6 space-y-1"
                    >
                      {tagsByCategory[category]?.map(tag => (
                        <div
                          key={tag.value}
                          className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <span className="text-sm">{tag.label}</span>
                          <span className="text-xs text-gray-500">
                            {imageTags.filter(t => t === tag.value).length} uses
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Popular Tags</h4>
            <div className="space-y-2">
              {tagStats.slice(0, 5).map(({ label, count, category }) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        category === 'Nature' ? 'bg-green-500' :
                        category === 'People' ? 'bg-blue-500' :
                        category === 'Objects' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}
                    />
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                    {count} {count === 1 ? 'use' : 'uses'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}