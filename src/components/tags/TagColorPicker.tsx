import React from 'react';
import { ChromePicker } from 'react-color';
import { Tag } from '../../types';

interface TagColorPickerProps {
  tag: Tag;
  onColorChange: (color: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function TagColorPicker({ tag, onColorChange, isOpen, onClose }: TagColorPickerProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute z-50 mt-2">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <ChromePicker
        color={tag.color || '#9333ea'}
        onChange={(color) => onColorChange(color.hex)}
      />
    </div>
  );
}