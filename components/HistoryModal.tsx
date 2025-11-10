import React from 'react';
import type { HistoryItem } from '../types';
import { XIcon } from './icons/XIcon';

interface HistoryModalProps {
  history: HistoryItem[];
  onClose: () => void;
  onLoad: (item: HistoryItem) => void;
  onClear: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, onLoad, onClear }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      aria-labelledby="history-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 id="history-modal-title" className="text-xl font-bold text-slate-800">Analysis History</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200" aria-label="Close history">
            <XIcon className="w-6 h-6 text-slate-600" />
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-1">
          {history.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              <p>No analysis history found.</p>
              <p className="text-sm mt-1">Completed analyses will appear here.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {history.map(item => (
                <li key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={item.imageUrl} alt="MRI Thumbnail" className="w-16 h-16 object-cover rounded-md bg-slate-200" />
                    <div>
                      <p className={`font-semibold ${item.result.tumorDetected ? 'text-red-600' : 'text-green-600'}`}>
                        {item.result.tumorDetected ? 'Tumor Detected' : 'No Tumor Detected'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onLoad(item)}
                    className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 text-sm"
                  >
                    Load Result
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {history.length > 0 && (
          <footer className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex justify-end">
            <button
              onClick={onClear}
              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 text-sm"
            >
              Clear All History
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};