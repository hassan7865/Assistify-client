import React from 'react';
import { FileText, Download } from 'lucide-react';

interface AttachmentMessageProps {
  attachment: {
    file_name: string;
    url: string;
    mime_type?: string;
    size?: number;
  };
  senderType?: 'visitor' | 'agent';
}

const AttachmentMessage: React.FC<AttachmentMessageProps> = ({
  attachment,
  senderType
}) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Return the file extension as text for now (like "TXT" in the design)
    if (extension) {
      return extension.toUpperCase();
    }
    return 'FILE';
  };

  const handleDownload = () => {
    if (attachment.url) {
      window.open(attachment.url, '_blank');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Attachment Block */}
      <div className="bg-white border border-gray-200 rounded-sm p-2 max-w-xs">
        <div className="flex items-start gap-2">
          {/* File Icon */}
          <div className="w-8 h-8 bg-gray-100 rounded-sm flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-gray-700">
              {getFileIcon(attachment.file_name, attachment.mime_type)}
            </span>
          </div>
          
          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div 
              className="text-xs font-medium text-gray-900 underline cursor-pointer hover:text-blue-600 truncate"
              onClick={handleDownload}
              title={attachment.file_name}
            >
              {attachment.file_name}
            </div>
            {attachment.size && (
              <div className="text-xs text-gray-500 mt-0.5">
                {formatFileSize(attachment.size)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation message - only show for agent attachments */}
      {senderType === 'agent' && (
        <div className="text-xs text-gray-500 italic text-center mt-1">
          "{attachment.file_name}" sent.
        </div>
      )}
    </div>
  );
};

export default AttachmentMessage;
