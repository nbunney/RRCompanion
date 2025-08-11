import React from 'react';

interface TagsProps {
  tags: string[];
  warnings: string[];
  status?: string;
  type?: string;
}

const Tags: React.FC<TagsProps> = ({ tags, warnings, status, type }) => {
  return (
    <>
      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Warnings</h3>
          <div className="flex flex-wrap gap-2">
            {warnings
              .filter((warning) => warning && warning.trim() !== '')
              .map((warning, index) => (
                <span
                  key={`warning-${index}-${warning}`}
                  className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                >
                  {warning}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Status and Type - only show if they have values */}
      {(status || type) && (
        <div className="flex space-x-4 text-sm text-gray-600">
          {status && (
            <span>Status: <span className="font-semibold">{status}</span></span>
          )}
          {type && (
            <span>Type: <span className="font-semibold">{type}</span></span>
          )}
        </div>
      )}
    </>
  );
};

export default Tags; 