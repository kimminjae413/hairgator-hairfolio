import React, { useRef } from 'react';
import PlusIcon from './icons/PlusIcon';

interface PortfolioUploadButtonProps {
  onFileChange: (file: File) => void;
  disabled?: boolean;
}

const PortfolioUploadButton: React.FC<PortfolioUploadButtonProps> = ({ onFileChange, disabled = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
    // Reset input value to allow uploading the same file again
    event.target.value = '';
  };

  const handleContainerClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`relative aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed bg-gray-200'
          : 'cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <div className="w-8 h-8 mb-1">
        <PlusIcon />
      </div>
      <p className="text-xs font-bold text-center">Add Style</p>
    </div>
  );
};

export default PortfolioUploadButton;
