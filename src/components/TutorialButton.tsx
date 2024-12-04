import React from 'react';
import { FileDown } from 'lucide-react';
import { motion } from 'framer-motion';

export function TutorialButton() {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/tutorial.pdf';
    link.download = 'imagerml-tutorial.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.button
      onClick={handleDownload}
      className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 shadow-md"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <FileDown className="h-5 w-5 mr-2" />
      Download Tutorial PDF
    </motion.button>
  );
}
