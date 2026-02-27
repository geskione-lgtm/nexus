
import { GoogleGenAI } from "@google/genai";

export type GenerationMode = 'ultrasound' | 'measurements';

function extractMimeType(dataUrl: string): string {
  const m = dataUrl.match(/^data:(.*?);base64,/);
  return m?.[1] || "image/png";
}

export async function generateBabyFace(
  mode: GenerationMode,
  ultrasoundBase64: string | null,
  measurements: any | null,
  options?: any
): Promise<string> {
  // 1. PHASE: Gemini Analyzes the Input based on Mode
  console.log(`Phase 1: Gemini is analyzing in ${mode} mode...`);
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  let analysisPrompt = "";
  
  if (mode === 'ultrasound' && ultrasoundBase64) {
    analysisPrompt = `
      You are a world-class medical imaging expert and portrait artist. 
      Analyze this ultrasound image to create a HIGHLY DETAILED, ARTISTIC DESCRIPTION of how this baby's face would look in real life.
      
      Focus on the visual features visible in the scan: facial proportions, nose shape, mouth position, and forehead contour.
      
      Context:
      - Gender: ${options?.gender || 'unknown'}
      - Expression: ${options?.expression || 'natural'}
      - Style: ${options?.style || 'realistic'}
      
      TASK:
      Write a 3-sentence master prompt for an AI image generator (like Flux). 
      Focus on facial features, skin texture, lighting, and anatomical accuracy. 
      Avoid medical jargon. Make it sound like a professional photography description.
      DO NOT mention it's an ultrasound. Describe a real baby.
    `;
  } else if (mode === 'measurements' && measurements) {
    analysisPrompt = `
      You are a world-class medical imaging expert and portrait artist. 
      Based on the following biometric measurements, create a HIGHLY DETAILED, ARTISTIC DESCRIPTION of how this baby's face would look in real life.
      
      Measurements (Anatomical Constraints):
      - Fromen (Forehead): ${measurements.fromen_mm}mm
      - Burun (Nose): ${measurements.burun_mm}mm
      - Göztepe (Eye Brow area): ${measurements.goztepe_mm}mm
      - BiocÇap (Biocular Diameter): ${measurements.bioccap_mm}mm
      - Çene (Chin): ${measurements.cene_mm}mm
      - Ağızçapı (Mouth Diameter): ${measurements.agizcapi_mm}mm
      - Önarka baş (OFD): ${measurements.onarka_bas_mm}mm
      - BPD (Biparietal Diameter): ${measurements.bpd_mm}mm
      - HC (Head Circumference): ${measurements.hc_mm}mm
      - Göz (Eye): ${measurements.goz_mm}mm
      
      Context:
      - Gender: ${options?.gender || 'unknown'}
      - Expression: ${options?.expression || 'natural'}
      - Style: ${options?.style || 'realistic'}
      
      TASK:
      Write a 3-sentence master prompt for an AI image generator (like Flux). 
      Focus on facial features, skin texture, lighting, and anatomical accuracy strictly following the measurements. 
      Avoid medical jargon. Make it sound like a professional photography description.
      Describe a real baby.
    `;
  } else {
    throw new Error("Invalid generation mode or missing data");
  }

  let contents: any;
  
  if (mode === 'ultrasound' && ultrasoundBase64) {
    const imageData = ultrasoundBase64.includes(',') 
      ? ultrasoundBase64.split(',')[1] 
      : ultrasoundBase64;
      
    contents = [
      {
        parts: [
          { text: analysisPrompt },
          {
            inlineData: {
              mimeType: extractMimeType(ultrasoundBase64),
              data: imageData
            }
          }
        ]
      }
    ];
  } else {
    contents = [
      {
        parts: [
          { text: analysisPrompt }
        ]
      }
    ];
  }

  let masterPrompt = "A beautiful, realistic newborn baby portrait with soft lighting and natural features.";
  
  try {
    const analysisResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents
    });
    masterPrompt = analysisResponse.text || masterPrompt;
  } catch (err: any) {
    console.error("Gemini analysis failed:", err);
    if (err.message?.toLowerCase().includes("quota exceeded")) {
      console.warn("Gemini quota exceeded. Falling back to default prompt for Replicate.");
      // We continue with the default masterPrompt
    } else {
      throw err;
    }
  }

  console.log("Phase 2: Master Prompt:", masterPrompt);

  // 2. PHASE: Send Master Prompt to Replicate
  console.log("Phase 3: Sending Master Prompt to Replicate (Flux)...");
  
  const response = await fetch('/api/generate-baby', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: masterPrompt,
      image: mode === 'ultrasound' ? ultrasoundBase64 : null
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Replicate generation failed');
  }

  const data = await response.json();
  return data.image;
}
