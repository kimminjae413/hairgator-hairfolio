import React, { useState } from 'react';

interface SettingsModalProps {
  currentUrl: string;
  onSave: (newUrl: string) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentUrl, onSave, onClose }) => {
  const [url, setUrl] = useState(currentUrl);

  const handleSave = () => {
    // Basic validation for url format
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        alert('Please enter a valid URL starting with http:// or https://');
        return;
    }
    onSave(url);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Portfolio Settings</h2>
        <p className="text-gray-600 mb-6">Add your Naver Reservation link to allow clients to book appointments directly.</p>

        <div className="text-left">
          <label htmlFor="reservation-url" className="block text-sm font-medium text-[#03C75A] mb-1">
            Naver Reservation URL
          </label>
          <input
            id="reservation-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://m.booking.naver.com/..."
            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row-reverse gap-3 mt-8">
            <button
                onClick={handleSave}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300"
            >
                Save
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

export default SettingsModal;