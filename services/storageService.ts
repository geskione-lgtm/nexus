
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const StorageService = {
  async uploadImage(base64Data: string, path: string): Promise<string> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    try {
      // Manual base64 to Blob conversion for better reliability than fetch() on data URLs
      const [header, data] = base64Data.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      
      const binary = atob(data);
      const array = [];
      for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }
      const blob = new Blob([new Uint8Array(array)], { type: mime });

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
