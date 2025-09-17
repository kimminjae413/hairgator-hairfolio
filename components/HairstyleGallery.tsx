import React, { useState, useMemo } from 'react';
import { Hairstyle, Gender, FemaleMajorCategory, MaleMajorCategory } from '../types';
import PlusIcon from './icons/PlusIcon';

interface HairstyleGalleryProps {
  images: Hairstyle[];
  onSelect: (hairstyle: Hairstyle) => void;
  selectedUrl: string | null;
  disabled: boolean;
  onAddImage?: () => void;
}

type GroupedHairstyles = {
  [key in Gender]?: {
    [key in FemaleMajorCategory | MaleMajorCategory | 'Uncategorized']?: Hairstyle[];
  };
};

const HairstyleGallery: React.FC<HairstyleGalleryProps> = ({ images, onSelect, selectedUrl, disabled, onAddImage }) => {
  const [activeTab, setActiveTab] = useState<Gender>('Female');

  const groupedImages = useMemo(() => {
    return images.reduce((acc, image) => {
      const genderKey = image.gender;
      if (!genderKey || (genderKey !== 'Female' && genderKey !== 'Male')) return acc;

      const majorKey = image.majorCategory || 'Uncategorized';

      if (!acc[genderKey]) {
        acc[genderKey] = {};
      }
      if (!acc[genderKey]![majorKey]) {
        acc[genderKey]![majorKey] = [];
      }
      acc[genderKey]![majorKey]!.push(image);
      return acc;
    }, {} as GroupedHairstyles);
  }, [images]);

  const activeGenderStyles = groupedImages[activeTab];
  const activeGenderEntries = activeGenderStyles ? Object.entries(activeGenderStyles) : [];


  const tabStyle = "flex-1 py-2 text-center font-semibold rounded-md transition-colors duration-200 focus:outline-none";
  const activeTabStyle = "bg-indigo-600 text-white shadow";
  const inactiveTabStyle = "bg-gray-200 text-gray-700 hover:bg-gray-300";

  const addStyleButton = (
      <button
        onClick={onAddImage}
        disabled={disabled}
        className={`relative aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 transition-all duration-200 ${
          disabled
            ? 'cursor-not-allowed bg-gray-200'
            : 'cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600'
        }`}
        aria-label="Add new style"
      >
        <div className="w-8 h-8 mb-1">
          <PlusIcon />
        </div>
        <p className="text-xs font-bold text-center">Add Style</p>
      </button>
  );

  return (
    <div className={`${disabled ? 'opacity-50' : ''}`}>
      <div className="flex gap-2 p-1 mb-4 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveTab('Female')}
          className={`${tabStyle} ${activeTab === 'Female' ? activeTabStyle : inactiveTabStyle}`}
          disabled={disabled}
        >
          Female
        </button>
        <button
          onClick={() => setActiveTab('Male')}
          className={`${tabStyle} ${activeTab === 'Male' ? activeTabStyle : inactiveTabStyle}`}
          disabled={disabled}
        >
          Male
        </button>
      </div>

      <div className="relative max-h-[calc(60vh-60px)] md:max-h-[calc(70vh-60px)] overflow-y-auto p-1">
        {activeGenderEntries.length > 0 ? (
          activeGenderEntries.map(([majorCategory, hairstyles], index) => (
            <div key={majorCategory} className="mb-6">
              <h4 className="text-lg font-semibold text-gray-600 mb-3 ml-1">{majorCategory}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 {index === 0 && onAddImage && addStyleButton}
                 {hairstyles.map((image) => (
                  <button
                    key={image.url}
                    onClick={() => onSelect(image)}
                    disabled={disabled}
                    className={`relative aspect-square rounded-md overflow-hidden transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-400 ${
                      selectedUrl === image.url
                        ? 'ring-4 ring-indigo-500'
                        : 'ring-2 ring-transparent'
                    } ${disabled ? 'cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'}`}
                  >
                    <img src={image.url} alt={image.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <p className="absolute bottom-2 left-2 text-white text-xs font-bold">{image.name}</p>
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-10">
            {onAddImage ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {addStyleButton}
               </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>No styles found for the '{activeTab}' category.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HairstyleGallery;
