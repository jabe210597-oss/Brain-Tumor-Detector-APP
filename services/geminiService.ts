import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResultData } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("Missing Google Gemini API key.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const localizationSchema = {
    type: Type.OBJECT,
    properties: {
        boundingBox: {
            type: Type.ARRAY,
            description: "A bounding box for the detected tumor as normalized coordinates [x_min, y_min, x_max, y_max], where each value is between 0.0 and 1.0.",
            items: { type: Type.NUMBER }
        },
        mask: {
            type: Type.STRING,
            description: "A base64 encoded PNG image mask of the tumor. The mask should be the same size as the input image with the tumor area highlighted and the rest transparent."
        }
    },
    required: ["boundingBox", "mask"]
}

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        tumorDetected: {
            type: Type.BOOLEAN,
            description: "Whether a tumor or anomaly was detected in the image."
        },
        confidenceScore: {
            type: Type.NUMBER,
            description: "A confidence score from 0.0 to 1.0 for the detection."
        },
        analysis: {
            type: Type.STRING,
            description: "An in-depth analysis of the MRI scan. If a tumor is detected, describe its visual characteristics (size, shape, etc.) and potential implications. If not, confirm that the scan appears normal."
        },
        location: {
            type: Type.STRING,
            description: "If a tumor is detected, describe its location (e.g., 'frontal lobe, left hemisphere'). Otherwise, this should be 'N/A'."
        },
        localization: {
            ...localizationSchema,
            description: "The bounding box and segmentation mask for the tumor. This should only be present if a tumor is detected."
        }
    },
    required: ["tumorDetected", "confidenceScore", "analysis", "location"],
};

export const analyzeMriScan = async (base64Image: string, mimeType: string): Promise<AnalysisResultData> => {
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: `Act as a radiological assistant. Analyze this brain MRI scan for tumors or other anomalies.

If a tumor is detected:
1. Set 'tumorDetected' to true.
2. Provide a confidence score (0.0 to 1.0) for the detection.
3. Describe the probable location (e.g., 'frontal lobe, left hemisphere').
4. Provide an in-depth analysis. This should include observations on the tumor's characteristics as seen in the scan (e.g., size, shape, uniformity) and a general overview of what these characteristics might imply, for informational purposes.
5. You MUST also provide precise localization data: a normalized bounding box and a base64 encoded PNG segmentation mask of the tumor area.

If no tumor is detected:
1. Set 'tumorDetected' to false.
2. Provide a high confidence score (e.g., >0.95) reflecting the certainty of a negative finding.
3. In the analysis field, confirm that the visible brain structures appear normal and no anomalies are detected.
4. Set the location to 'N/A'.`
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, imagePart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisSchema,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as AnalysisResultData;
        return result;
    } catch (error) {
        console.error("Error analyzing MRI scan with Gemini API:", error);
        throw new Error("API request to Gemini failed.");
    }
};