import React from 'react';
import { BrainIcon } from './icons/BrainIcon';
import { HistoryIcon } from './icons/HistoryIcon';

interface HeaderProps {
  onHistoryClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onHistoryClick }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <BrainIcon className="h-8 w-8 text-sky-600 mr-3" />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            AI Brain Tumor Detector
          </h1>
        </div>
        <button 
          onClick={onHistoryClick}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
          aria-label="View analysis history"
        >
          <HistoryIcon className="w-5 h-5" />
          <span>History</span>
        </button>
      </div>
    </header>
  );
};