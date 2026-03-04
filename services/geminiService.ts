
import { GoogleGenAI } from "@google/genai";

export type GenerationMode = 'ultrasound' | 'measurements';

function extractMimeType(dataUrl: string): string {
  const m = dataUrl.match(/^data:(.*?);base64,/);
  return m?.[1] || "image/png";
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

async function generateWithRetry(params: any, retries = 3, delay = 2000): Promise<any> {
  try {
    return await ai.models.generateContent(params);
  } catch (err: any) {
    const errorMessage = err.message?.toLowerCase() || '';
    const isRetryable = errorMessage.includes('503') || 
                        errorMessage.includes('high demand') || 
                        errorMessage.includes('quota exceeded') ||
                        errorMessage.includes('429') ||
                        errorMessage.includes('unavailable') ||
                        errorMessage.includes('deadline exceeded');
    
    if (isRetryable && retries > 0) {
      console.warn(`Gemini API busy or quota hit, retrying in ${delay}ms... (${retries} attempts left). Error: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateWithRetry(params, retries - 1, delay * 2);
    }
    
    if (errorMessage.includes('quota exceeded') || errorMessage.includes('429')) {
      throw new Error('Gemini API kullanım kotası doldu. Lütfen bir süre sonra tekrar deneyin.');
    }
    
    if (errorMessage.includes('503') || errorMessage.includes('high demand')) {
      throw new Error('Gemini API şu anda çok yoğun. Lütfen birkaç dakika sonra tekrar deneyin.');
    }

    throw err;
  }
}

export async function generateBabyFace(
  mode: GenerationMode,
  ultrasoundBase64: string | null,
  measurements: any | null,
  options?: any,
  landmarks?: Record<string, {x: number, y: number}>,
  guideImage?: string
): Promise<string> {
  // 1. PHASE: Gemini Analyzes the Input
  console.log(`Phase 1: Gemini is analyzing...`);
  
  let analysisPrompt = `
    You are a world-class medical imaging expert and portrait artist. 
    ${options?.dualView ? 'CRITICAL INSTRUCTION: You MUST generate a prompt for a SIDE-BY-SIDE DUAL VIEW (SPLIT-SCREEN) showing the SAME baby from TWO angles: one full frontal and one profile. This is mandatory.' : ''}
    
    Analyze the provided ultrasound image AND/OR biometric measurements to create a HIGHLY DETAILED, ARTISTIC DESCRIPTION of how this baby's face would look in real life.
    
    SPATIAL ALIGNMENT (CRITICAL):
    - Identify the orientation of the fetus in the ultrasound (e.g., Profile, Frontal, 3/4 View).
    - The generated baby MUST have the EXACT SAME orientation as the ultrasound.
    - If the fetus is in profile, the generated baby MUST be in profile.
    - If the fetus is facing left, the generated baby MUST face left.
    - Map the anatomical features (nose, chin, forehead) to the same spatial coordinates as seen in the ultrasound.
    
    ${landmarks ? `
    ANATOMICAL LANDMARKS (EXACT COORDINATES):
    The doctor has marked the following points on the ultrasound (0-100 scale):
    - Vertex (Top of Head): (${landmarks.vertex?.x.toFixed(1)}%, ${landmarks.vertex?.y.toFixed(1)}%)
    - Nasion (Nose Bridge): (${landmarks.nasion?.x.toFixed(1)}%, ${landmarks.nasion?.y.toFixed(1)}%)
    - Subnasale (Under Nose): (${landmarks.subnasale?.x.toFixed(1)}%, ${landmarks.subnasale?.y.toFixed(1)}%)
    - Menton (Chin): (${landmarks.menton?.x.toFixed(1)}%, ${landmarks.menton?.y.toFixed(1)}%)
    
    You MUST ensure the generated baby's features align EXACTLY with these coordinates. For example, if the Nasion is at y=${landmarks.nasion?.y.toFixed(1)}%, the baby's nose bridge MUST be at that vertical level.
    ` : ''}
    
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
    const analysisResponse = await generateWithRetry({
      model: "gemini-3-flash-preview",
      contents: contents
    });
    masterPrompt = analysisResponse.text || masterPrompt;
  } catch (err: any) {
    console.error("Gemini analysis failed:", err);
    const msg = err.message?.toLowerCase() || '';
    if (msg.includes("quota exceeded") || msg.includes("yoğun") || msg.includes("503") || msg.includes("demand")) {
      console.warn("Gemini is busy or quota exceeded. Using fallback prompt to ensure generation continues.");
      
      // Create a decent fallback prompt based on measurements if available
      if (measurements) {
        masterPrompt = `A professional newborn baby portrait, realistic features, newborn aesthetic, closed eyes, soft lighting, based on biometric data: nose ${measurements.burun}mm, chin ${measurements.cene}mm, head ${measurements.hc}mm.`;
      }
      // Continue without throwing
    } else {
      throw err;
    }
  }

  console.log("Phase 2: Master Prompt:", masterPrompt);

  // 2. PHASE: Send Master Prompt to Gemini Image Generation
  console.log("Phase 3: Generating image with Gemini (gemini-2.5-flash-image)...");
  
  try {
    const genParts: any[] = [{ text: masterPrompt }];
    
    // Add ultrasound as context if available
    if (ultrasoundBase64) {
      genParts.push({
        inlineData: {
          mimeType: extractMimeType(ultrasoundBase64),
          data: ultrasoundBase64.includes(',') ? ultrasoundBase64.split(',')[1] : ultrasoundBase64
        }
      });
    }

    // Add guide image (scribble) if available for better anatomical control
    if (guideImage) {
      genParts.push({
        inlineData: {
          mimeType: extractMimeType(guideImage),
          data: guideImage.includes(',') ? guideImage.split(',')[1] : guideImage
        }
      });
    }

    const imageResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ parts: genParts }],
      config: {
        imageConfig: {
          aspectRatio: options?.dualView ? "16:9" : "1:1"
        }
      }
    });

    // Find the image part in the response
    let resultBase64 = "";
    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        resultBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!resultBase64) {
      throw new Error("Gemini image generation failed to return an image.");
    }

    console.log("Phase 3 complete. Image generated by Gemini.");
    return resultBase64;
  } catch (err: any) {
    console.error("Gemini Image Generation Error:", err);
    throw new Error(`Gemini Image Generation failed: ${err.message}`);
  }
}

export async function generateFetalImage(
  weeks: number,
  measurements: any | null,
  ultrasoundBase64: string | null,
  view: 'front' | 'profile' | 'top' = 'front'
): Promise<string> {
  const viewPrompts = {
    front: "FULL FRONTAL view, facing the camera directly, showing symmetrical facial features.",
    profile: "90-DEGREE SIDE PROFILE view, showing the silhouette of the nose, forehead, and chin clearly.",
    top: "SUPERIOR TOP-DOWN view, showing the oval shape of the cranium and the top of the head."
  };

  const prompt = `
    You are a world-class medical illustrator specialized in craniofacial embryology. 
    Create a highly realistic, cinematic 3D medical render of a fetal HEAD and FACE prototype at exactly ${weeks} weeks of gestation.
    
    CRITICAL MEDICAL CONSTRAINTS (MANDATORY):
    The following measurements are from a clinical ultrasound and MUST be reflected in the 3D model's anatomy:
    - BPD (Biparietal Diameter): ${measurements.bpd || 'Standard'}mm
    - HC (Head Circumference): ${measurements.hc || 'Standard'}mm
    - Fromen (Frontal-Occipital): ${measurements.fromen || 'Standard'}mm
    - Nose Length (Burun): ${measurements.burun || 'Standard'}mm
    - Chin Size (Çene): ${measurements.cene || 'Standard'}mm
    
    SPECIFIC ANATOMICAL SCULPTING:
    - If the Nose (Burun) is small (e.g., < 2mm), the model MUST show a significantly recessed or hypoplastic nose.
    - If the Fromen is large, the head MUST appear elongated in the anterior-posterior axis.
    - If BPD is wide, the head MUST appear broader from the front.
    - The model MUST be a unique medical representation of THESE SPECIFIC numbers, not a generic baby.
    
    VIEW ANGLE:
    You MUST show the head from the ${viewPrompts[view]}
    
    STYLE:
    - High-end 3D medical modeling (AutoCAD/ZBrush style), clean, clinical, and professional. 
    - Pure white background, soft biological matte texture.
    - No body, no background elements. Just the head as a medical specimen.
    
    TASK:
    Write a 3-sentence master prompt for an AI image generator to create this specific 3D head prototype from the ${view.toUpperCase()} angle. 
    Describe the specific anatomical landmarks visible from this angle and the clinical 3D aesthetic.
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

  const analysisResponse = await generateWithRetry({
    model: "gemini-3-flash-preview",
    contents: [{ parts }]
  });

  const masterPrompt = analysisResponse.text || `A realistic 3D medical illustration of a ${weeks}-week-old fetus in the womb, soft lighting, anatomical detail.`;

  console.log("Fetal Master Prompt:", masterPrompt);

  try {
    const genParts: any[] = [{ text: masterPrompt }];
    if (ultrasoundBase64) {
      genParts.push({
        inlineData: {
          mimeType: extractMimeType(ultrasoundBase64),
          data: ultrasoundBase64.includes(',') ? ultrasoundBase64.split(',')[1] : ultrasoundBase64
        }
      });
    }

    const imageResponse = await generateWithRetry({
      model: "gemini-2.5-flash-image",
      contents: [{ parts: genParts }],
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    let resultBase64 = "";
    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        resultBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!resultBase64) throw new Error("Gemini fetal image generation failed.");
    return resultBase64;
  } catch (err: any) {
    console.error("Gemini Fetal Generation Error:", err);
    throw new Error(`Gemini Fetal Generation failed: ${err.message}`);
  }
}

export async function detectLandmarksOnGeneratedImage(imageUrlOrBase64: string): Promise<{
  landmarks: Record<string, {x: number, y: number} | null>;
  confidence: number;
}> {
  console.log("Detecting landmarks on generated image...");
  
  const prompt = `
    Analyze this newborn baby portrait and identify the EXACT coordinates of these 4 anatomical landmarks:
    1. vertex: The very top of the head/forehead.
    2. nasion: The bridge of the nose, between the eyes.
    3. subnasale: The point directly under the nose, above the upper lip.
    4. menton: The lowest point of the chin.

    Return ONLY a JSON object in this format:
    {
      "vertex": {"x": number, "y": number} | null,
      "nasion": {"x": number, "y": number} | null,
      "subnasale": {"x": number, "y": number} | null,
      "menton": {"x": number, "y": number} | null,
      "confidence": number
    }
    
    RULES:
    - Coordinates must be normalized 0-100 relative to the image width and height.
    - If a landmark is NOT clearly visible or identifiable, return null for that landmark.
    - DO NOT estimate or guess positions if they are not visible.
    - confidence must be a number between 0 and 1 representing your certainty.
  `;

  const imageData = imageUrlOrBase64.includes(',') 
    ? imageUrlOrBase64.split(',')[1] 
    : imageUrlOrBase64;

  const contents = [{
    parts: [
      { text: prompt },
      {
        inlineData: {
          mimeType: extractMimeType(imageUrlOrBase64),
          data: imageData
        }
      }
    ]
  }];

  try {
    const response = await generateWithRetry({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: { responseMimeType: "application/json" }
    });

    const result = JSON.parse(response.text || '{}');
    
    // Validation
    const required = ['vertex', 'nasion', 'subnasale', 'menton'];
    const landmarks: Record<string, {x: number, y: number} | null> = {};
    
    for (const key of required) {
      if (result[key] && typeof result[key].x === 'number' && typeof result[key].y === 'number') {
        landmarks[key] = {
          x: clamp(result[key].x, 0, 100),
          y: clamp(result[key].y, 0, 100)
        };
      } else {
        landmarks[key] = null;
      }
    }

    const confidence = typeof result.confidence === 'number' ? clamp(result.confidence, 0, 1) : 0;

    return { landmarks, confidence };
  } catch (err) {
    console.error("Landmark detection failed:", err);
    throw new Error("Landmark detection failed on generated image.");
  }
}
