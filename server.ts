import express from "express";
import { createServer as createViteServer } from "vite";
import Replicate from "replicate";
import * as dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  // Replicate Proxy Endpoint
  app.post("/api/generate-baby", async (req, res) => {
    console.log("POST /api/generate-baby - Request received");
    try {
      const { prompt, image, guideImage, landmarks } = req.body;

      if (!process.env.REPLICATE_API_TOKEN) {
        console.error("REPLICATE_API_TOKEN is missing in environment");
        return res.status(500).json({ error: "REPLICATE_API_TOKEN is missing" });
      }

      console.log("Calling Replicate with prompt:", prompt);
      const startTime = Date.now();

      if (guideImage) {
        console.log("Guide image detected, switching to ControlNet Scribble...");
        const primaryScribble = "jagilley/controlnet-scribble:435061a1b5a4c1e26727f030c779659f20cc967fb3652a651b9a2c03bb0728f3";
        const fallbackScribble = "lucataco/controlnet-scribble:435061a1b5a4c1e26727f030c779659f20cc967fb3652a651b9a2c03bb0728f3"; // Just a placeholder, usually they share versions if cloned
        
        const scribbleInput = {
          image: guideImage,
          prompt: prompt + ", high quality, realistic newborn baby face, medical photography",
          num_samples: 1,
          image_resolution: "512",
          ddim_steps: 20,
          scale: 9,
          eta: 0,
          a_prompt: "best quality, extremely detailed",
          n_prompt: "longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality"
        };
        
        let output;
        try {
          output = await replicate.run(primaryScribble as `${string}/${string}:${string}`, { input: scribbleInput });
        } catch (err: any) {
          console.warn("Primary scribble failed, attempting fallback...");
          output = await replicate.run("jagilley/controlnet-scribble:435061a1b5a4c1e26727f030c779659f20cc967fb3652a651b9a2c03bb0728f3" as `${string}/${string}:${string}`, { input: scribbleInput });
        }
        return handleOutput(output, res, startTime);
      }

      // Primary model: fofr/flux-dev-img2img
      const primaryModel = "fofr/flux-dev-img2img:ef90e2908f902641755100088825f77839353995f03704250269041269389279";
      // Fallback model: lucataco/flux-dev-img2img (different version)
      const fallbackModel = "lucataco/flux-dev-img2img:965584857444760037385966779426f03d6d5f7560867a1498616335f992226a";
      
      const fluxInput = {
        image: image,
        prompt: prompt,
        strength: 0.8,
        guidance_scale: 3.5,
        num_inference_steps: 28,
        output_format: "png",
        aspect_ratio: "1:1"
      };

      const runWithRetry = async (model: string, input: any, maxRetries = 2) => {
        for (let i = 0; i <= maxRetries; i++) {
          try {
            return await replicate.run(model as `${string}/${string}:${string}`, { input });
          } catch (err: any) {
            if (err.message?.includes("429") && i < maxRetries) {
              const waitTime = (i + 1) * 5000; // Wait 5s, then 10s
              console.warn(`Rate limited (429). Waiting ${waitTime}ms before retry ${i + 1}...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
            throw err;
          }
        }
      };

      let output;
      try {
        console.log("Attempting generation with primary model...");
        output = await runWithRetry(primaryModel, fluxInput);
      } catch (err: any) {
        console.warn("Primary model failed, attempting fallback...", err.message);
        if (err.message?.includes("422") || err.message?.includes("version") || err.message?.includes("404")) {
          output = await runWithRetry(fallbackModel, fluxInput);
        } else {
          throw err;
        }
      }
      
      return handleOutput(output, res, startTime);
    } catch (error: any) {
      console.error("Replicate Error:", error);
      // If it's a 422, it might be the version. 
      if (error.message?.includes("422") || error.message?.includes("version")) {
         return res.status(422).json({ 
           error: "AI Model version error. Please check if the Replicate model versions are still active.",
           details: error.message 
         });
      }
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  async function handleOutput(output: any, res: any, startTime: number) {
    console.log("Replicate output received in", (Date.now() - startTime) / 1000, "seconds.");
    
    let imageUrl = "";
    const processOutputValue = async (val: any): Promise<string> => {
      if (!val) return "";
      if (typeof val === 'string' && val.startsWith('http')) return val;
      if (typeof val === 'string' && val.startsWith('data:')) return val;
      if (val instanceof ReadableStream) {
        const reader = val.getReader();
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        const blob = new Blob(chunks, { type: 'image/png' });
        const buffer = Buffer.from(await blob.arrayBuffer());
        return `data:image/png;base64,${buffer.toString('base64')}`;
      }
      if (typeof val === 'object' && val.url) return val.url;
      if (typeof val?.toString === 'function') {
        const str = val.toString();
        if (str.startsWith('http')) return str;
      }
      return "";
    };

    if (Array.isArray(output)) {
      imageUrl = await processOutputValue(output[0]);
    } else {
      imageUrl = await processOutputValue(output);
    }

    if (!imageUrl) {
      return res.status(500).json({ error: "AI model failed to return a valid image" });
    }

    res.json({ image: imageUrl });
  }

  // Image Proxy to bypass CORS
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) return res.status(400).json({ error: "URL is required" });

      console.log("Proxying image request for:", imageUrl);
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

      const contentType = response.headers.get("content-type") || "image/png";
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(buffer);
    } catch (error: any) {
      console.error("Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
