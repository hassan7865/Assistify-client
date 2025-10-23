import React from 'react';

interface UploadingAttachmentProps {
  fileName: string;
  senderName: string;
  timestamp: string;
  senderType: 'visitor' | 'agent';
  isConsecutive?: boolean;
}

const UploadingAttachment: React.FC<UploadingAttachmentProps> = ({
  fileName,
  senderName,
  timestamp,
  senderType,
  isConsecutive = false
}) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  return (
    <div className="flex flex-col">
      {/* Sender name and timestamp - only show if not consecutive */}
      {!isConsecutive && (
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-semibold ${
            senderType === 'agent' ? 'text-gray-900' : 'text-blue-600'
          }`}>
            {senderName}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(timestamp)}
          </span>
        </div>
      )}

      {/* Uploading Progress Block */}
      <div className="bg-white border border-gray-200 rounded-sm p-2 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          {/* File Icon */}
          <div className="w-6 h-6 bg-gray-100 rounded-sm flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-gray-700">
              {fileName.split('.').pop()?.toUpperCase() || 'FILE'}
            </span>
          </div>
          
          {/* File Name */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900 truncate" title={fileName}>
              {fileName}
            </div>
          </div>
        </div>

        {/* Striped Progress Bar */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full relative overflow-hidden uploading-progress-bar"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                #f97316 0px,
                #f97316 8px,
                #ffffff 8px,
                #ffffff 12px
              )`,
              backgroundSize: '20px 20px'
            }}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 uploading-shimmer" />
          </div>
        </div>

        {/* Uploading text */}
        <div className="text-xs text-gray-500 mt-1 text-center">
          Uploading...
        </div>
      </div>

      {/* Double checkmark for agent messages */}
      {senderType === 'agent' && (
        <div className="flex justify-end mt-1">
          <div className="flex">
            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg className="w-3 h-3 text-gray-400 -ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadingAttachment;
