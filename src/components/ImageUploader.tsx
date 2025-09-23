import React, { useRef } from 'react';

interface ImageUploaderProps {
  id: string;
  label: string;
  previewSrc: string | null;
  onFileChange: (file: File | null) => void;
  icon: React.ReactNode;
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, previewSrc, onFileChange, icon, disabled = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileChange(file);
  };

  const handleContainerClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm text-gray-600 mb-2 text-center">{label}</p>
      <div
        onClick={handleContainerClick}
        className={`relative w-full max-w-sm mx-auto aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden transition-all duration-300 ${!disabled ? 'cursor-pointer hover:border-indigo-500 hover:bg-indigo-50' : 'cursor-not-allowed bg-gray-200'}`}
      >
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
        {previewSrc ? (
          <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-gray-500 p-4">
            <div className="w-16 h-16 mx-auto mb-2 text-gray-400">
              {icon}
            </div>
            <p className="font-medium">Click to upload</p>
            <p className="text-xs">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
