import React, { useState, useEffect } from 'react';

interface ImageModalProps {
  isOpen: boolean;
  imageSrc: string;
  altText: string;
  onClose: () => void;
  images?: string[];
  currentIndex?: number;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  imageSrc,
  altText,
  onClose,
  images = [],
  currentIndex = 0,
}) => {
  const [index, setIndex] = useState(currentIndex);

  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handlePrev = () => {
    if (images.length > 0) {
      setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  const handleNext = () => {
    if (images.length > 0) {
      setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  const displayImage = images.length > 0 ? images[index] : imageSrc;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
        >
          ✕
        </button>

        {/* Main Image */}
        <div className="relative max-w-7xl max-h-full flex items-center justify-center">
          <img
            src={displayImage}
            alt={altText}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />

          {/* Navigation Arrows - Only show if multiple images */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all backdrop-blur-sm text-2xl"
              >
                ‹
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all backdrop-blur-sm text-2xl"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
            Ảnh {index + 1} của {images.length}
          </div>
        )}
        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
            Ảnh {index + 1} của {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
