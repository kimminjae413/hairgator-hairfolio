import React, { useState, useEffect, useRef } from 'react';
import { Gender, FemaleMajorCategory, MaleMajorCategory, MinorCategory } from '../types';
import UploadIcon from './icons/UploadIcon';

interface UploadStyleModalProps {
  onUpload: (data: {
    file: File;
    name: string;
    gender: Gender;
    majorCategory: FemaleMajorCategory | MaleMajorCategory;
    minorCategory: MinorCategory;
  }) => void;
  onClose: () => void;
}

const FEMALE_MAJOR_CATEGORIES: FemaleMajorCategory[] = ['A length', 'B length', 'C length', 'D length', 'E length', 'F length', 'G length', 'H length'];
const MALE_MAJOR_CATEGORIES: MaleMajorCategory[] = ['SIDE FRINGE', 'SIDE PART', 'FRINGE UP', 'PUSHED BACK', 'BUZZ', 'CROP', 'MOHICAN'];
const MINOR_CATEGORIES: MinorCategory[] = ['None', 'Forehead', 'Eyebrow', 'Eye', 'Cheekbone'];

const UploadStyleModal: React.FC<UploadStyleModalProps> = ({ onUpload, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [styleName, setStyleName] = useState('');
  const [gender, setGender] = useState<Gender>('Female');
  const [majorCategory, setMajorCategory] = useState<FemaleMajorCategory | MaleMajorCategory>(FEMALE_MAJOR_CATEGORIES[0]);
  const [minorCategory, setMinorCategory] = useState<MinorCategory>(MINOR_CATEGORIES[0]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // When gender changes, update the major category dropdown and reset its value
    if (gender === 'Female') {
      setMajorCategory(FEMALE_MAJOR_CATEGORIES[0]);
    } else {
      setMajorCategory(MALE_MAJOR_CATEGORIES[0]);
    }
  }, [gender]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      // Prefill style name without extension
      setStyleName(selectedFile.name.split('.').slice(0, -1).join('.') || '');
    }
  };

  const handleUpload = () => {
    if (file && styleName && gender && majorCategory && minorCategory) {
      onUpload({ file, name: styleName, gender, majorCategory, minorCategory });
    }
  };
  
  const isFormValid = file && styleName.trim();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 md:p-8 text-left overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Add New Style</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Style Image</label>
            <div
              onClick={() => inputRef.current?.click()}
              className="relative w-full aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 hover:bg-indigo-50"
            >
              <input ref={inputRef} type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleFileChange} />
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-1 text-gray-400"><UploadIcon/></div>
                  <p className="font-medium">Click to upload</p>
                </div>
              )}
            </div>
          </div>

          <div>
             <label htmlFor="style-name" className="block text-sm font-medium text-gray-700 mb-1">Style Name</label>
             <input
                id="style-name"
                type="text"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                placeholder="e.g., Soft Layered Cut"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
             <div className="flex gap-2 rounded-lg bg-gray-200 p-1">
                 <button onClick={() => setGender('Female')} className={`flex-1 py-2 text-center font-semibold rounded-md transition-colors ${gender === 'Female' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}>Female</button>
                 <button onClick={() => setGender('Male')} className={`flex-1 py-2 text-center font-semibold rounded-md transition-colors ${gender === 'Male' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}>Male</button>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="major-category" className="block text-sm font-medium text-gray-700 mb-1">Major Category</label>
              <select id="major-category" value={majorCategory} onChange={(e) => setMajorCategory(e.target.value as any)} className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {(gender === 'Female' ? FEMALE_MAJOR_CATEGORIES : MALE_MAJOR_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="minor-category" className="block text-sm font-medium text-gray-700 mb-1">Minor Category</label>
              <select id="minor-category" value={minorCategory} onChange={(e) => setMinorCategory(e.target.value as MinorCategory)} className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {MINOR_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row-reverse gap-3 mt-8">
          <button
            onClick={handleUpload}
            disabled={!isFormValid}
            className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            Upload Style
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadStyleModal;
