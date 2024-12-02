import React from 'react';
import { useImageStore } from '../../store/imageStore';
import { Clock, RotateCw, Sliders, Pencil, Square, Type } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export function EditHistory() {
  const { selectedImage, images } = useImageStore();
  const image = images.find(img => img.id === selectedImage);
  const history = image?.editHistory || [];

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'filter':
        return <Sliders className="h-4 w-4" />;
      case 'rotate':
        return <RotateCw className="h-4 w-4" />;
      case 'annotation':
        return <Pencil className="h-4 w-4" />;
      case 'shape':
        return <Square className="h-4 w-4" />;
      case 'text':
        return <Type className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatParamValue = (value: any) => {
    if (typeof value === 'number') {
      return Math.round(value * 100) / 100;
    }
    return value;
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Clock className="h-5 w-5 mr-2" />
        Edit History
      </h3>

      <AnimatePresence mode="popLayout">
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                    {getActionIcon(action.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {action.description}
                    </p>
                    {action.params && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {Object.entries(action.params)
                          .map(([key, value]) => `${key}: ${formatParamValue(value)}`)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {format(action.timestamp, 'HH:mm:ss')}
                </span>
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