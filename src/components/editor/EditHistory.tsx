import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RotateCw, Sliders, Pencil, Square, Type, Tag, FileDown, Play } from 'lucide-react';
import { format } from 'date-fns';
import { ImageFile, EditAction } from '../../types';

interface EditHistoryProps {
  image: ImageFile;
  onUndoAction?: (actionId: string) => void;
}

export function EditHistory({ image, onUndoAction }: EditHistoryProps) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'filter':
        return <Sliders className="h-4 w-4" />;
      case 'rotate':
      case 'customRotate':
        return <RotateCw className="h-4 w-4" />;
      case 'annotation':
        return <Pencil className="h-4 w-4" />;
      case 'shape':
        return <Square className="h-4 w-4" />;
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'tag':
        return <Tag className="h-4 w-4" />;
      case 'compress':
        return <FileDown className="h-4 w-4" />;
      case 'stream':
        return <Play className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatParamValue = (value: any) => {
    if (typeof value === 'number') {
      return Math.round(value * 100) / 100;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value;
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'filter':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300';
      case 'rotate':
      case 'customRotate':
        return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300';
      case 'annotation':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300';
      case 'compress':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Clock className="h-5 w-5 mr-2" />
        Edit History
      </h3>

      <AnimatePresence mode="popLayout">
        {image.editHistory.length > 0 ? (
          <div className="space-y-2">
            {image.editHistory.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center justify-between p-3 rounded-lg hover:bg-opacity-80 ${getActionColor(action.type)}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-white bg-opacity-20">
                    {getActionIcon(action.type)}
                  </div>
                  <div>
                    <p className="font-medium">
                      {action.description}
                    </p>
                    {action.params && (
                      <p className="text-sm opacity-75">
                        {Object.entries(action.params)
                          .map(([key, value]) => (
                            `${key}: ${formatParamValue(value)}`
                          ))
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm whitespace-nowrap opacity-75">
                    {format(action.timestamp, 'HH:mm:ss')}
                  </span>
                  {onUndoAction && (
                    <button
                      onClick={() => onUndoAction(action.id)}
                      className="p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                      title="Undo this action"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              No edits yet. Start editing to see your history!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}