import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CopyIcon from './icons/CopyIcon';

interface ShareModalProps {
  designerName: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ designerName, onClose }) => {
  const { t } = useTranslation();
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
        throw new Error(t('share.qrFetchError', 'QR code image could not be fetched.'));
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
      alert(t('share.qrCopyError', 'Could not copy QR code. This feature may not be supported by your browser.'));
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t('share.title', 'Share Your Portfolio')}
          </h2>
          <p className="text-gray-600 text-sm">
            {t('share.subtitle', 'Clients can scan the QR code or use the link to try on your styles.')}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* QR Code Section */}
          <div className="text-center">
            <div className="inline-block p-3 bg-white rounded-lg shadow-md border border-gray-200 mb-4">
              <img 
                src={qrCodeUrl} 
                alt={t('share.qrCodeAlt', 'Portfolio QR Code')}
                className="w-[180px] h-[180px]"
                loading="lazy"
              />
            </div>
            <button
              onClick={handleQrCopy}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-200 transition-colors duration-200 text-sm min-h-[40px]"
            >
              <div className="w-4 h-4 mr-2">
                <CopyIcon />
              </div>
              <span>{t('share.copyQR', 'Copy QR Code')}</span>
            </button>
            {qrCopied && (
              <p className="text-green-600 text-sm mt-2 font-medium">
                {t('share.qrCopied', 'QR Code copied!')}
              </p>
            )}
          </div>

          {/* URL Section */}
          <div>
            <label htmlFor="share-url" className="block text-sm font-medium text-gray-700 mb-2">
              {t('share.shareableLink', 'Shareable Link')}
            </label>
            <div className="relative">
              <input
                id="share-url"
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg py-3 pl-3 pr-12 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleLinkCopy}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-indigo-600 transition-colors duration-200 hover:bg-gray-100 rounded-md"
                aria-label={t('share.copyLinkAria', 'Copy link')}
              >
                <div className="w-4 h-4">
                  <CopyIcon />
                </div>
              </button>
            </div>
            {linkCopied && (
              <p className="text-green-600 text-sm mt-2 font-medium">
                {t('share.linkCopied', 'Link copied to clipboard!')}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 min-h-[48px]"
          >
            {t('share.done', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
