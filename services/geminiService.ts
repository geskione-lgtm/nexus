
import { GoogleGenAI } from "@google/genai";

export async function generateBabyFace(ultrasoundBase64: string, highRes: boolean = false, options?: any): Promise<string> {
  // Yüksek çözünürlük için Pro modeli, hızlı üretim için Flash modeli.
  const modelName = highRes ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  // Her çağrıda yeni instance oluşturarak güncel API key'i almasını sağlıyoruz.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const genderPrompt = options?.gender === 'boy' ? 'male baby' : options?.gender === 'girl' ? 'female baby' : 'baby';
  const expressionPrompt = options?.expression === 'smiling' ? 'smiling and happy' : options?.expression === 'sleeping' ? 'peacefully sleeping' : 'natural expression';
  const stylePrompt = options?.style === 'artistic' ? 'artistic portrait photography' : options?.style === '3d-render' ? '3D medical visualization' : 'hyper-realistic photography';

  const prompt = `
    Analyze the ultrasound scan. Generate a ${stylePrompt} of a ${genderPrompt}'s face.
    The baby should have a ${expressionPrompt}.
    Focus on anatomical accuracy based on the scan's bone structure and soft tissue.
    Output: One high-quality baby face, cinematic lighting, neutral medical background.
    ${options?.notes ? `Additional context: ${options.notes}` : ''}
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
        imageConfig
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
    console.error("Gemini Cloud Error:", error);
    // Eğer yetki hatası alınırsa (Entity not found), anahtar seçimini tetiklemek için hata fırlat.
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_EXPIRED");
    }
    throw error;
  }
}
