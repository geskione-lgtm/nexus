
import { supabase } from './supabaseClient';

export const StorageService = {
  async uploadImage(base64Data: string, path: string): Promise<string> {
    // Convert base64 to Blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();

    const { data, error } = await supabase.storage
      .from('ultrasounds')
      .upload(path, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ultrasounds')
      .getPublicUrl(data.path);

    return publicUrl;
  }
};
