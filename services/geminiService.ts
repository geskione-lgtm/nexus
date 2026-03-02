
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
  // 1. PHASE: Gemini Analyzes the Input
  console.log(`Phase 1: Gemini is analyzing...`);
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  let analysisPrompt = `
    You are a world-class medical imaging expert and portrait artist. 
    ${options?.dualView ? 'CRITICAL INSTRUCTION: You MUST generate a prompt for a SIDE-BY-SIDE DUAL VIEW (SPLIT-SCREEN) showing the SAME baby from TWO angles: one full frontal and one profile. This is mandatory.' : ''}
    
    Analyze the provided ultrasound image AND/OR biometric measurements to create a HIGHLY DETAILED, ARTISTIC DESCRIPTION of how this baby's face would look in real life.
    
    CRITICAL STYLE INSTRUCTIONS:
    - The baby MUST look like a NEWBORN (approximately 1 week old).
    - Eyes MUST be SQUINTY, BARELY OPEN, or COMPLETELY CLOSED. Newborns at this age are very sensitive to light and rarely have wide-open eyes.
    - Eyelids should be slightly PUFFY and swollen, typical of a fresh-born baby.
    - Skin should have natural newborn texture, soft features, and a delicate, fresh-born aesthetic.
    - ABSOLUTELY NO wide-open, alert eyes. The baby should look sleepy and peaceful.
    
    ${options?.motherPhoto ? "I have also provided a photo of the MOTHER. Please incorporate her facial features, skin tone, and characteristics into the baby's description." : ""}
    ${options?.fatherPhoto ? "I have also provided a photo of the FATHER. Please incorporate his facial features, skin tone, and characteristics into the baby's description." : ""}
    
    ${measurements ? `
    Measurements (Anatomical Constraints):
    - Fromen: ${measurements.fromen}mm
    - Burun: ${measurements.burun}mm
    - Göztepe: ${measurements.goztepe}mm
    - BiocÇap: ${measurements.bioccap}mm
    - Çene: ${measurements.cene}mm
    - Ağızçapı: ${measurements.agizcapi}mm
    - Önarka baş: ${measurements.onarka_bas}mm
    - BPD: ${measurements.bpd}mm
    - HC: ${measurements.hc}mm
    - Göz: ${measurements.goz}mm
    ` : ''}
    
    Context:
    - Gender: ${options?.gender || 'unknown'}
    - Expression: ${options?.expression || 'natural'}
    - Style: ${options?.style || 'realistic'}
    
    TASK:
    Write a 3-sentence master prompt for an AI image generator (like Flux). 
    ${options?.dualView ? 'The prompt MUST start with "A professional medical diptych collage consisting of TWO ENTIRELY SEPARATE PHOTOGRAPHS placed side-by-side with a thick white border between them. The left photograph is a close-up frontal portrait of a 1-week-old newborn with squinty, barely open sleepy eyes and puffy eyelids. The right photograph is a sharp 90-degree side profile view of the EXACT SAME newborn with eyes closed or squinting." followed by details.' : 'Focus on facial features, skin texture, lighting, and anatomical accuracy.'}
    Avoid medical jargon. Make it sound like a professional photography description.
    DO NOT mention it\'s an ultrasound. Describe a real baby.
    ${options?.dualView ? 'REMINDER: The final image MUST be a dual-view split screen with a thick white border separating the two distinct photos. DO NOT merge the faces.' : ''}
  `;

  let contents: any;
  
  const parts: any[] = [{ text: analysisPrompt }];

  if (ultrasoundBase64) {
    const imageData = ultrasoundBase64.includes(',') 
      ? ultrasoundBase64.split(',')[1] 
      : ultrasoundBase64;
    
    parts.push({
      inlineData: {
        mimeType: extractMimeType(ultrasoundBase64),
        data: imageData
      }
    });
  }

  if (options?.motherPhoto) {
    const motherData = options.motherPhoto.includes(',') 
      ? options.motherPhoto.split(',')[1] 
      : options.motherPhoto;
    
    parts.push({
      inlineData: {
        mimeType: extractMimeType(options.motherPhoto),
        data: motherData
      }
    });
  }

  if (options?.fatherPhoto) {
    const fatherData = options.fatherPhoto.includes(',') 
      ? options.fatherPhoto.split(',')[1] 
      : options.fatherPhoto;
    
    parts.push({
      inlineData: {
        mimeType: extractMimeType(options.fatherPhoto),
        data: fatherData
      }
    });
  }

  contents = [{ parts }];

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
  
  try {
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
      console.error("Replicate API Error:", error);
      throw new Error(error.error || 'Replicate generation failed');
    }

    const data = await response.json();
    console.log("Phase 3 complete. Image received.");
    return data.image;
  } catch (err: any) {
    console.error("Fetch error in Phase 3:", err);
    if (err.message === 'Failed to fetch') {
      throw new Error('Sunucuya bağlanılamadı (Failed to fetch). Lütfen internet bağlantınızı kontrol edin veya sunucunun çalıştığından emin olun.');
    }
    throw err;
  }
}

export async function generateFetalImage(
  weeks: number,
  measurements: any | null,
  ultrasoundBase64: string | null
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  const prompt = `
    You are a world-class medical illustrator specialized in embryology. 
    Create a highly realistic, cinematic 3D medical render of a fetus at exactly ${weeks} weeks of gestation.
    
    STYLE AND COMPOSITION:
    - The fetus MUST be shown in a natural fetal position with ANATOMICALLY CORRECT PROPORTIONS.
    - BELLY/TORSO: The belly must be realistic and proportional to the gestational age. ABSOLUTELY NO bloated, swollen, or unnaturally large bellies. The torso should be slender and natural.
    - Include a clear, thin, translucent UMBILICAL CORD connected to the navel.
    - Surround the fetus with a very thin, delicate, and highly translucent AMNIOTIC SAC membrane. It should look like a faint bubble, not a thick glowing mass.
    - SKIN TEXTURE: Soft, matte, biological texture. Translucent skin with very subtle visible veins. No plastic or glossy reflections.
    - Lighting: Soft, high-key, diffused studio lighting. Clean and professional.
    - Background: Pure white or a very soft, clean neutral gradient.
    - Quality: High-end medical 3D illustration, photorealistic, clean, and professional (like a premium medical textbook or Flo app).
    
    Anatomical Accuracy for ${weeks} weeks:
    ${measurements ? `- Use these biometric constraints: ${JSON.stringify(measurements)}` : ''}
    - Ensure the development stage (limbs, facial features, size) matches exactly ${weeks} weeks.
    
    TASK:
    Write a 3-sentence master prompt for an AI image generator (like Flux) to create this specific, high-end medical visualization. 
    The prompt should describe the fetus, the umbilical cord, the translucent sac, and the cinematic lighting. 
    DO NOT use medical jargon in the final prompt; describe it as a masterpiece of 3D digital art.
  `;

  const parts: any[] = [{ text: prompt }];
  if (ultrasoundBase64) {
    const imageData = ultrasoundBase64.includes(',') ? ultrasoundBase64.split(',')[1] : ultrasoundBase64;
    parts.push({
      inlineData: {
        mimeType: extractMimeType(ultrasoundBase64),
        data: imageData
      }
    });
  }

  const analysisResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts }]
  });

  const masterPrompt = analysisResponse.text || `A realistic 3D medical illustration of a ${weeks}-week-old fetus in the womb, soft lighting, anatomical detail.`;

  const response = await fetch('/api/generate-baby', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: masterPrompt,
      image: ultrasoundBase64
    })
  });

  if (!response.ok) {
    throw new Error('Fetal generation failed');
  }

  const data = await response.json();
  return data.image;
}
