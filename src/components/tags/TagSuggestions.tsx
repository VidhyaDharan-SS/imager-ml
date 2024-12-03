import React from 'react';
import Select from 'react-select';
import { Tag } from '../../types';

interface TagSuggestionsProps {
  tags: Tag[];
  selectedTags: string[];
  onSelect: (tags: string[]) => void;
}

export function TagSuggestions({ tags, selectedTags, onSelect }: TagSuggestionsProps) {
  const options = tags.map(tag => ({
    value: tag.value,
    label: tag.label,
    color: tag.color,
    category: tag.category,
  }));

  const groupedOptions = options.reduce((acc, option) => {
    const category = option.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(option);
    return acc;
  }, {} as Record<string, typeof options>);

  const groupOptions = Object.entries(groupedOptions).map(([category, options]) => ({
    label: category,
    options,
  }));

  return (
    <Select
      isMulti
      options={groupOptions}
      value={options.filter(option => selectedTags.includes(option.value))}
      onChange={(selected) => onSelect(selected.map(s => s.value))}
      className="w-full"
      classNamePrefix="react-select"
      styles={{
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected ? state.data.color : base.backgroundColor,
          ':hover': {
            backgroundColor: state.data.color,
            opacity: 0.8,
          },
        }),
        multiValue: (base, state) => ({
          ...base,
          backgroundColor: state.data.color,
        }),
      }}
    />
  );
}