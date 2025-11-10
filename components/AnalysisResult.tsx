import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AnalysisResultData } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { Tooltip } from './Tooltip';
import { InfoIcon } from './icons/InfoIcon';

interface AnalysisResultProps {
  result: AnalysisResultData;
  imageUrl: string;
}

type ViewType = 'original' | 'boundingBox' | 'mask';

const ResultCard: React.FC<{ title: string; children: React.ReactNode, className?: string, tooltip?: string }> = ({ title, children, className, tooltip }) => (
    <div className={`bg-slate-50 p-4 rounded-lg border border-slate-200 ${className}`}>
        <h3 className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
          {title}
          {tooltip && <Tooltip text={tooltip}><InfoIcon className="w-4 h-4 text-slate-400" /></Tooltip>}
        </h3>
        <div className="text-slate-800">{children}</div>
    </div>
);

const ViewToggle: React.FC<{ selected: ViewType, onSelect: (view: ViewType) => void }> = ({ selected, onSelect }) => {
    const views: { id: ViewType, label: string }[] = [
        { id: 'original', label: 'Original' },
        { id: 'boundingBox', label: 'Bounding Box' },
        { id: 'mask', label: 'Segmentation Mask' },
    ];

    return (
        <div className="flex w-full bg-slate-200 rounded-lg p-1 mb-2">
            {views.map(view => (
                <button
                    key={view.id}
                    onClick={() => onSelect(view.id)}
                    className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${selected === view.id ? 'bg-white shadow-sm text-sky-600' : 'text-slate-600 hover:bg-slate-300/50'}`}
                >
                    {view.label}
                </button>
            ))}
        </div>
    );
};


export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, imageUrl }) => {
  const [view, setView] = useState<ViewType>('mask');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const confidencePercentage = (result.confidenceScore * 100).toFixed(1);
  const verdictColor = result.tumorDetected ? 'text-red-600' : 'text-green-600';
  const verdictBgColor = result.tumorDetected ? 'bg-red-100' : 'bg-green-100';
  
  const showVisualization = result.tumorDetected && result.localization;

  useEffect(() => {
    if (!showVisualization) setView('original');
    else setView('mask');
  }, [showVisualization]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImage = new Image();
    baseImage.crossOrigin = "anonymous";
    baseImage.src = imageUrl;
    baseImage.onload = () => {
        canvas.width = baseImage.naturalWidth;
        canvas.height = baseImage.naturalHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(baseImage, 0, 0);

        if (view === 'original' || !showVisualization) return;
        
        if (view === 'boundingBox' && result.localization?.boundingBox) {
            const [x_min, y_min, x_max, y_max] = result.localization.boundingBox;
            const x = x_min * canvas.width;
            const y = y_min * canvas.height;
            const width = (x_max - x_min) * canvas.width;
            const height = (y_max - y_min) * canvas.height;
            
            ctx.strokeStyle = 'rgba(239, 68, 68, 1)'; // red-500
            ctx.lineWidth = Math.max(2, canvas.width * 0.005);
            ctx.strokeRect(x, y, width, height);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.fillRect(x, y, width, height);
        }

        if (view === 'mask' && result.localization?.mask) {
            const maskImage = new Image();
            maskImage.src = `data:image/png;base64,${result.localization.mask}`;
            maskImage.onload = () => {
                ctx.save();
                ctx.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = 'source-in';
                ctx.fillStyle = 'rgba(239, 68, 68, 0.6)'; // red-500 with 60% opacity
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            }
        }
    };

  }, [imageUrl, result, view, showVisualization]);

  const handleDownloadPdf = async () => {
    const reportElement = reportRef.current;
    if (!reportElement) return;
    setIsGeneratingPdf(true);
    
    try {
      const canvas = await html2canvas(reportElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      const finalWidth = pdfWidth - 20; // with margin
      const finalHeight = finalWidth / ratio;
      
      let height = finalHeight > pdfHeight - 20 ? pdfHeight - 20 : finalHeight;

      pdf.addImage(imgData, 'PNG', 10, 10, finalWidth, height);
      pdf.save(`ai-brain-tumor-report-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Could not generate PDF report. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <div ref={reportRef} className="p-1 bg-white">
        <div className="relative w-full aspect-square bg-slate-100 rounded-lg border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
        </div>
        
        {showVisualization && <div className="mt-4"><ViewToggle selected={view} onSelect={setView} /></div>}
        
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard title="Verdict">
                  <p className={`font-bold text-lg ${verdictColor} ${verdictBgColor} px-2 py-1 rounded-md inline-block`}>
                      {result.tumorDetected ? 'Tumor Detected' : 'No Tumor Detected'}
                  </p>
              </ResultCard>
              <ResultCard title="Confidence Score" tooltip="The AI's confidence in its verdict, from 0% to 100%.">
                  <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full ${result.tumorDetected ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${confidencePercentage}%` }}></div>
                      </div>
                      <span className={`font-bold ${verdictColor}`}>{confidencePercentage}%</span>
                  </div>
              </ResultCard>
          </div>

          {result.tumorDetected && (
            <ResultCard title="Probable Location">
              <p className="font-medium">{result.location}</p>
            </ResultCard>
          )}

          <ResultCard title="Detailed Analysis">
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{result.analysis}</p>
          </ResultCard>
        </div>
      </div>
      <button
        onClick={handleDownloadPdf}
        disabled={isGeneratingPdf}
        className="w-full mt-4 bg-slate-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-800 disabled:bg-slate-400 flex items-center justify-center gap-2 transition-colors"
      >
        <DownloadIcon className="w-5 h-5" />
        {isGeneratingPdf ? 'Generating PDF...' : 'Download Report'}
      </button>
    </div>
  );
};