
import { GoogleGenAI } from "@google/genai";

export async function generateBabyFace(ultrasoundBase64: string, highRes: boolean = false, options?: any, measurements?: any): Promise<string> {
  // Yüksek çözünürlük için Pro modeli, hızlı üretim için Flash modeli.
  const modelName = highRes ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  // Her çağrıda yeni instance oluşturarak güncel API key'i almasını sağlıyoruz.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const genderPrompt = options?.gender === 'boy' ? 'male baby' : options?.gender === 'girl' ? 'female baby' : 'baby';
  const expressionPrompt = options?.expression === 'smiling' ? 'smiling and happy' : options?.expression === 'sleeping' ? 'peacefully sleeping' : 'natural expression';
  const stylePrompt = options?.style === 'artistic' ? 'artistic portrait photography' : options?.style === '3d-render' ? '3D medical visualization' : 'hyper-realistic photography';

  let biometricPrompt = '';
  if (measurements) {
    biometricPrompt = `
      Use the following biometric measurements for anatomical precision:
      - Head Height (Tepe-Çene): ${measurements.a_mm}mm
      - Nose Length: ${measurements.b_mm}mm
      - Forehead Height: ${measurements.c_mm}mm
      - Midface/Eye Line: ${measurements.d_mm}mm
      - Lower Face (Lip-Chin): ${measurements.e_mm}mm
      - Mouth Width: ${measurements.f_mm}mm
      - Occipitofrontal Diameter (OFD): ${measurements.g_mm}mm
      - Biparietal Diameter (BPD): ${measurements.h_mm}mm
      - Head Circumference (HC): ${measurements.i_mm}mm
    `;
  }

  const prompt = `
    CRITICAL INSTRUCTION: You are a high-precision medical reconstruction AI. 
    STRICTLY AVOID generic or repetitive baby faces. 
    
    TASK: Analyze the provided ultrasound scan and reconstruct the SPECIFIC individual baby's face.
    
    ANATOMICAL CONSTRAINTS:
    1. Extract unique facial characteristics from the ultrasound (e.g., specific nose bridge curvature, chin prominence, cheek volume).
    2. Use these biometric measurements as ABSOLUTE proportions:
       ${biometricPrompt}
    
    VISUAL STYLE:
    - Style: ${stylePrompt}
    - Expression: ${expressionPrompt}
    - Lighting: Cinematic medical studio lighting.
    - Background: Neutral, professional medical environment.
    
    Every generation must be a UNIQUE, high-fidelity reconstruction of the specific morphology seen in the scan. Do not output "average" features.
    ${options?.notes ? `Additional clinical context: ${options.notes}` : ''}
  `;

  try {
    // imageSize is only available for gemini-3-pro-image-preview.
    const imageConfig: any = {
      aspectRatio: "1:1"
    };
    
    if (highRes) {
      imageConfig.imageSize = "2K";
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              data: ultrasoundBase64.split(',')[1],
              mimeType: 'image/png',
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig,
        seed: Math.floor(Math.random() * 1000000), // Ensure variety in generations
        temperature: 0.9 // Slightly higher temperature for more unique feature interpretation
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("Üretim başarısız: Aday bulunamadı.");

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("Görüntü verisi alınamadı.");
  } catch (error: any) {
    console.error("NeoBreed Cloud Error:", error);
    // Eğer yetki hatası alınırsa (Entity not found), anahtar seçimini tetiklemek için hata fırlat.
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_EXPIRED");
    }
    throw error;
  }
}
