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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
        >
          ✕
        </button>

        {/* Main Image */}
        <div className="relative aspect-square md:aspect-auto md:h-[70vh] bg-cream flex items-center justify-center overflow-hidden">
          <img
            src={displayImage}
            alt={altText}
            className="w-full h-full object-contain"
          />

          {/* Navigation Arrows - Only show if multiple images */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
              >
                ‹
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Image Counter and Info */}
        {images.length > 1 && (
          <div className="bg-white p-6 border-t border-gold/10 flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">
              Ảnh {index + 1} của {images.length}
            </span>
            <div className="flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === index ? 'bg-primary w-6' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
