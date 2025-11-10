import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { AnalysisResult } from './components/AnalysisResult';
import { Spinner } from './components/Spinner';
import { analyzeMriScan } from './services/geminiService';
import type { AnalysisResultData, HistoryItem } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { HistoryModal } from './components/HistoryModal';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('analysisHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
      setHistory([]);
    }
  }, []);

  const saveToHistory = (result: AnalysisResultData, url: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      result,
      imageUrl: url,
    };
    
    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('analysisHistory', JSON.stringify(updatedHistory));
  };
  
  const loadFromHistory = (item: HistoryItem) => {
    setImageFile(null); // We don't have the original file object
    setImageUrl(item.imageUrl);
    setAnalysisResult(item.result);
    setError(null);
    setIsLoading(false);
    setIsHistoryOpen(false);
  };
  
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('analysisHistory');
    setIsHistoryOpen(false);
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalysis = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload an MRI scan first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const { base64, mimeType } = await fileToBase64(imageFile);
      const result = await analyzeMriScan(base64, mimeType);
      setAnalysisResult(result);
      if (imageUrl) {
        saveToHistory(result, imageUrl);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, imageUrl, history]);
  
  const resetState = () => {
    setImageFile(null);
    setImageUrl(null);
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <Header onHistoryClick={() => setIsHistoryOpen(true)} />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-slate-600 mb-8 max-w-3xl mx-auto">
            Upload an MRI scan of a brain to leverage Google's Gemini model for detecting and localizing tumors. The AI will provide a detailed analysis, confidence score, and potential location of anomalies.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-700 mb-4">1. Upload MRI Scan</h2>
              <ImageUploader onImageUpload={handleImageUpload} imageUrl={imageUrl} />
              
              <button
                onClick={handleAnalysis}
                disabled={!imageFile || isLoading}
                className="w-full mt-4 bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center"
              >
                {isLoading ? 'Analyzing...' : '2. Analyze Scan'}
              </button>

              {(imageFile || imageUrl) && (
                 <button
                  onClick={resetState}
                  className="w-full mt-2 bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors duration-300"
                >
                  Clear Image
                </button>
              )}
            </div>
            
            <div id="analysis-section" className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 min-h-[300px] flex flex-col justify-center items-center">
              <h2 className="text-xl font-semibold text-slate-700 mb-4 w-full">3. View Analysis</h2>
              {isLoading && <Spinner />}
              {error && <div className="text-red-500 text-center">{error}</div>}
              {analysisResult && imageUrl && (
                <AnalysisResult result={analysisResult} imageUrl={imageUrl} />
              )}
              {!isLoading && !analysisResult && !error && (
                <div className="text-center text-slate-500">
                  <p>Analysis results will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {isHistoryOpen && (
        <HistoryModal 
          history={history}
          onClose={() => setIsHistoryOpen(false)}
          onLoad={loadFromHistory}
          onClear={clearHistory}
        />
      )}
      <footer className="text-center p-4 text-sm text-slate-500 mt-8">
          <p>Disclaimer: This tool is for informational purposes only and not a substitute for professional medical advice.</p>
      </footer>
    </div>
  );
};

export default App;