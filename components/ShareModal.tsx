import React, { useState } from 'react';
import CopyIcon from './icons/CopyIcon';

interface ShareModalProps {
  designerName: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ designerName, onClose }) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  const shareUrl = `${window.location.origin}${window.location.pathname}?designer=${encodeURIComponent(designerName)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;

  const handleLinkCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handleQrCopy = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      if (!response.ok) {
        throw new Error('QR code image could not be fetched.');
      }
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setQrCopied(true);
      setTimeout(() => setQrCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy QR code image: ', err);
      alert('Could not copy QR code. This feature may not be supported by your browser.');
    }
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
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Share Your Portfolio</h2>
        <p className="text-gray-600 mb-6">Clients can scan the QR code or use the link to try on your styles.</p>

        <div className="flex flex-col items-center mb-6">
          <img src={qrCodeUrl} alt="Portfolio QR Code" className="rounded-lg shadow-md mb-4" />
          <button
            onClick={handleQrCopy}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-200 transition-colors duration-300"
          >
            <CopyIcon />
            <span className="ml-2">Copy QR Code</span>
          </button>
           {qrCopied && <p className="text-green-600 text-sm mt-2">QR Code copied!</p>}
        </div>
        
        <div className="text-left">
           <label htmlFor="share-url" className="block text-sm font-medium text-gray-700 mb-1">
              Shareable Link
            </label>
            <div className="relative">
                <input
                    id="share-url"
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 pr-12 text-gray-700"
                />
                <button
                    onClick={handleLinkCopy}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                    aria-label="Copy link"
                >
                    <CopyIcon />
                </button>
            </div>
            {linkCopied && <p className="text-green-600 text-sm mt-2">Link copied to clipboard!</p>}
        </div>

        <button
          onClick={onClose}
          className="mt-8 px-6 py-3 w-full bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default ShareModal;
