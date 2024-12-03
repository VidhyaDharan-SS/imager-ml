import React, { useState } from 'react';
import { Tag as TagIcon, Edit2, Palette } from 'lucide-react';
import { Tag } from '../../types';
import { TagColorPicker } from './TagColorPicker';

interface EditableTagProps {
  tag: Tag;
  onUpdate: (value: string, updates: Partial<Tag>) => void;
  onDelete: (value: string) => void;
}

export function EditableTag({ tag, onUpdate, onDelete }: EditableTagProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editedLabel, setEditedLabel] = useState(tag.label);

  const handleSubmit = () => {
    if (editedLabel.trim()) {
      onUpdate(tag.value, { label: editedLabel });
      setIsEditing(false);
    }
  };

  const handleColorChange = (color: string) => {
    onUpdate(tag.value, { color });
  };

  return (
    <div className="group relative flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
      <TagIcon
        className="h-4 w-4"
        style={{ color: tag.color }}
      />
      
      {isEditing ? (
        <input
          type="text"
          value={editedLabel}
          onChange={(e) => setEditedLabel(e.target.value)}
          onBlur={handleSubmit}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus
        />
      ) : (
        <span className="flex-1">{tag.label}</span>
      )}

      <div className="hidden group-hover:flex items-center space-x-1">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <Palette className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(tag.value)}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-red-500"
        >
          ×
        </button>
      </div>

      {showColorPicker && (
        <TagColorPicker
          tag={tag}
          onColorChange={handleColorChange}
          isOpen={showColorPicker}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
}