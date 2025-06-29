import React from 'react';
import { AVATAR_STYLES } from '../../utils/constants';

interface AvatarSelectorProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
}

export default function AvatarSelector({ selectedStyle, onStyleChange }: AvatarSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Your Interviewer</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(AVATAR_STYLES).map(([key, style]) => (
          <button
            key={key}
            onClick={() => onStyleChange(key)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
              selectedStyle === key
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-lg'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">{style.preview}</div>
              <div className="font-medium text-gray-900 dark:text-white">{style.label}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{style.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}