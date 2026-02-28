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
      const { prompt, image } = req.body;

      if (!process.env.REPLICATE_API_TOKEN) {
        console.error("REPLICATE_API_TOKEN is missing in environment");
        return res.status(500).json({ error: "REPLICATE_API_TOKEN is missing" });
      }

      console.log("Calling Replicate with prompt:", prompt);
      const startTime = Date.now();

      // Using Flux-Dev or similar high-quality model
      // Note: Removed image_prompt as it's not supported by the base flux-dev model
      const output = await replicate.run(
        "black-forest-labs/flux-dev",
        {
          input: {
            prompt: prompt,
            aspect_ratio: "1:1",
            guidance_scale: 3.5,
            num_outputs: 1,
            output_format: "png"
          }
        }
      );

      console.log("Replicate output received in", (Date.now() - startTime) / 1000, "seconds. Type:", typeof output, "IsArray:", Array.isArray(output));
      if (output) {
        console.log("Output keys:", Object.keys(output));
      }
      
      let imageUrl = "";

      const processOutputValue = async (val: any): Promise<string> => {
        if (!val) return "";
        console.log("Processing value of type:", typeof val);
        
        if (typeof val === 'string' && val.startsWith('http')) return val;
        if (typeof val === 'string' && val.startsWith('data:')) return val;
        
        if (val instanceof ReadableStream) {
          console.log("Processing ReadableStream output...");
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

        if (typeof val === 'object') {
          if (val.url && typeof val.url === 'string') return val.url;
          // Replicate FileOutput often has a toString that returns the URL
          if (typeof val.toString === 'function') {
            try {
              const str = val.toString();
              if (str && typeof str === 'string' && str.startsWith('http')) return str;
            } catch (e) {
              console.log("toString() failed on object");
            }
          }
        }
        
        return "";
      };

      if (Array.isArray(output)) {
        console.log("Output is an array of length:", output.length);
        for (const item of output) {
          const url = await processOutputValue(item);
          if (url) {
            imageUrl = url;
            break;
          }
        }
      } else {
        imageUrl = await processOutputValue(output);
      }

      if (!imageUrl) {
        console.error("Failed to extract image URL. Full output structure:", JSON.stringify(output, (key, value) => {
          if (value instanceof ReadableStream) return '[ReadableStream]';
          if (value && value.constructor && value.constructor.name === 'FileOutput') return `[FileOutput: ${value.toString()}]`;
          return value;
        }, 2));
        return res.status(500).json({ error: "AI model failed to return a valid image URL string" });
      }

      console.log("Successfully extracted image URL:", imageUrl.substring(0, 100) + "...");
      res.json({ image: imageUrl });
    } catch (error: any) {
      console.error("Replicate Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

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
