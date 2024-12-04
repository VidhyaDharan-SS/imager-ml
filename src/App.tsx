import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ImageUpload } from './components/ImageUpload';
import { ImageGallery } from './components/ImageGallery';
import { ImageEditor } from './components/editor/ImageEditor';
import { useImageStore } from './store/imageStore';
import { TutorialButton } from './components/TutorialButton';
import { useTheme } from './hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

function App() {
  const selectedImage = useImageStore((state) => state.selectedImage);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark'
        ? 'bg-gray-900 text-white' 
        : 'bg-pink-50 text-gray-900'
    }`}>
      <nav className={`${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } shadow-md p-4`}>
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ImagerML
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <button className="px-4 py-2 rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-colors">
              Gallery View
            </button>
            <button className="px-4 py-2 rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-colors">
              ImagerML Editor
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <div className={`${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded-lg shadow-lg p-6 mb-8`}>
          <div className="text-center space-y-4">
            <h2 className="text-lg mb-4">
              ImagerML is an all-in-one platform for image uploading, editing, tagging,
              compressing, streaming filtering, and management with real-time collaboration
              and easy saving.
            </h2>
            <div className="flex justify-center">
              <TutorialButton />
            </div>
          </div>
          <div className="mt-8">
            <ImageUpload />
          </div>
        </div>

        {selectedImage ? <ImageEditor /> : <ImageGallery />}
      </main>

      <ToastContainer 
        position="bottom-right"
        theme={theme}
      />
    </div>
  );
}

export default App;
