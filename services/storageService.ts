
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const StorageService = {
  async uploadImage(imageData: any, path: string): Promise<string> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    if (!imageData) {
      throw new Error('Invalid image data: Data is null or undefined');
    }

    try {
      let blob: Blob;
      let mime: string = 'image/png';

      if (typeof imageData === 'string') {
        if (imageData.startsWith('data:')) {
          // Handle Data URL
          const [header, data] = imageData.split(',');
          const mimeMatch = header.match(/:(.*?);/);
          mime = mimeMatch ? mimeMatch[1] : 'image/png';
          
          const binary = atob(data);
          const array = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
          }
          blob = new Blob([array], { type: mime });
        } else if (imageData.startsWith('http')) {
          // Handle Remote URL via Proxy to avoid CORS issues
          console.log("StorageService: Fetching remote image via proxy:", imageData.substring(0, 50) + "...");
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageData)}`;
          try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
              const errorText = await response.text();
              console.error("Proxy fetch failed:", response.status, errorText);
              throw new Error(`Proxy fetch failed (${response.status}): ${errorText || response.statusText}`);
            }
            blob = await response.blob();
            mime = blob.type || 'image/png';
            console.log("Proxy fetch successful. Mime:", mime);
          } catch (fetchErr: any) {
            console.error("StorageService: Proxy fetch error:", fetchErr);
            if (fetchErr.message === 'Failed to fetch') {
              throw new Error(`Görsel indirilemedi (Sunucu Hatası: Failed to fetch). Lütfen sunucunun çalıştığından emin olun.`);
            }
            throw new Error(`Görsel indirilemedi (Proxy Hatası): ${fetchErr.message}`);
          }
        } else {
          throw new Error('Invalid image string: Must be a data URL or a remote URL');
        }
      } else if (imageData instanceof Blob) {
        // Handle Blob or File object
        blob = imageData;
        mime = blob.type || 'image/png';
      } else if (typeof imageData === 'object' && imageData !== null) {
        // Check if it's an object that looks like a Blob but isn't an instance (e.g. from a different context)
        if (imageData.size && imageData.type) {
          blob = imageData as Blob;
          mime = blob.type;
        } else {
          const dataType = typeof imageData;
          const dataValue = JSON.stringify(imageData).substring(0, 100);
          console.error(`StorageService.uploadImage: Received invalid object. Type: ${dataType}, Value: ${dataValue}`);
          throw new Error(`Invalid image data: Received an object that is not a string, Blob, or File. Value: ${dataValue}`);
        }
      } else {
        throw new Error(`Invalid image data type: ${typeof imageData}`);
      }

      const { data: uploadData, error } = await supabase.storage
        .from('ultrasounds')
        .upload(path, blob, {
          contentType: mime,
          upsert: true
        });

      if (error) {
        console.error('Supabase Storage Upload Error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('ultrasounds')
        .getPublicUrl(uploadData.path);

      return publicUrl;
    } catch (err: any) {
      console.error('StorageService.uploadImage error:', err);
      throw err;
    }
  }
};
