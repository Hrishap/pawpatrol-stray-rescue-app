import { supabase } from '@/lib/supabase';

// Uploads a local photo (camera/gallery URI) to the public `photos` storage
// bucket and returns its public URL. Follows Supabase's documented React
// Native approach: fetch the local URI to get a Blob, then upload that.
export async function uploadPhoto(localUri: string, folder: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from('photos').upload(path, blob, {
    contentType: blob.type || `image/${ext}`,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return data.publicUrl;
}
