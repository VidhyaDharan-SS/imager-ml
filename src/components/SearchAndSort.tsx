import React from 'react';
import Select from 'react-select';
import { Search } from 'lucide-react';
import { useImageStore } from '../store/imageStore';

export function SearchAndSort() {
  const { setSearchQuery, setSortBy, setSortDirection, sortBy, sortDirection } = useImageStore();

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Date' },
    { value: 'size', label: 'Size' },
  ];

  const directionOptions = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ];

  return (
    <div className="flex space-x-4 items-center">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search images..."
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <Select
        options={sortOptions}
        value={sortOptions.find(option => option.value === sortBy)}
        onChange={(option) => option && setSortBy(option.value as 'name' | 'date' | 'size')}
        placeholder="Sort by..."
        className="w-40"
        classNamePrefix="select"
      />
      <Select
        options={directionOptions}
        value={directionOptions.find(option => option.value === sortDirection)}
        onChange={(option) => option && setSortDirection(option.value as 'asc' | 'desc')}
        placeholder="Direction..."
        className="w-40"
        classNamePrefix="select"
      />
    </div>
  );
}