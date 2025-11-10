export interface LocalizationData {
  boundingBox: [number, number, number, number]; // [x_min, y_min, x_max, y_max] as ratios
  mask: string; // base64 encoded mask image
}

export interface AnalysisResultData {
  tumorDetected: boolean;
  confidenceScore: number;
  analysis: string;
  location: string;
  localization?: LocalizationData;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  result: AnalysisResultData;
  imageUrl: string;
}