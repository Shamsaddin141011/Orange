import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

const BUCKET = 'avatars';
const MAX_BYTES = 5 * 1024 * 1024;
const OUTPUT_SIZE = 512;
const ALLOWED_TYPES = ['image/png', 'image/webp', 'image/jpeg'];
const EXT_TO_TYPE: Record<string, string> = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

export class AvatarError extends Error {}

/** Best-effort MIME type of a picked asset: explicit mimeType, data-URI prefix, then file extension. */
function detectMimeType(asset: ImagePicker.ImagePickerAsset): string | null {
  if (asset.mimeType) return asset.mimeType.toLowerCase();
  const dataMatch = asset.uri.match(/^data:([^;,]+)/);
  if (dataMatch?.[1]) return dataMatch[1].toLowerCase();
  const name = asset.fileName ?? asset.uri.split('?')[0] ?? '';
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_TYPE[ext] ?? null;
}

/** Byte size of a picked asset; on web the picker only gives us a data URI. */
function detectSize(asset: ImagePicker.ImagePickerAsset): number | null {
  if (asset.fileSize) return asset.fileSize;
  if (asset.uri.startsWith('data:')) {
    const b64 = asset.uri.slice(asset.uri.indexOf(',') + 1);
    return Math.floor((b64.length * 3) / 4);
  }
  return null;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0, bits = 0, out = 0;
  for (let i = 0; i < clean.length; i++) {
    buffer = (buffer << 6) | B64.indexOf(clean.charAt(i));
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[out++] = (buffer >> bits) & 0xff;
    }
  }
  return bytes.subarray(0, out);
}

/**
 * Open the image library, validate the pick (PNG/WebP/JPEG, ≤ 5 MB),
 * center-crop and resize it to 512×512 JPEG. Returns null if the user cancelled.
 */
export async function pickAvatarImage(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];

  const type = detectMimeType(asset);
  if (!type || !ALLOWED_TYPES.includes(type)) {
    throw new AvatarError('Please choose a PNG, WebP or JPEG image.');
  }
  const size = detectSize(asset);
  if (size != null && size > MAX_BYTES) {
    throw new AvatarError('That image is larger than 5 MB. Please choose a smaller one.');
  }

  const actions: ImageManipulator.Action[] = [];
  const { width, height } = asset;
  if (width > 0 && height > 0) {
    const side = Math.min(width, height);
    if (width !== height) {
      actions.push({ crop: { originX: Math.floor((width - side) / 2), originY: Math.floor((height - side) / 2), width: side, height: side } });
    }
    if (side > OUTPUT_SIZE) actions.push({ resize: { width: OUTPUT_SIZE, height: OUTPUT_SIZE } });
  } else {
    actions.push({ resize: { width: OUTPUT_SIZE, height: OUTPUT_SIZE } });
  }

  const out = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!out.base64) throw new AvatarError('Could not process that image.');
  return out.base64;
}

/** Remove every object in the user's avatar folder (optionally keeping one path). */
async function clearAvatarFolder(userId: string, keepPath?: string) {
  const { data } = await supabase.storage.from(BUCKET).list(userId);
  const stale = (data ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keepPath);
  if (stale.length > 0) await supabase.storage.from(BUCKET).remove(stale);
}

/** Upload a processed JPEG (base64) as the user's avatar and save its public URL on their profile. */
export async function uploadAvatar(userId: string, base64: string): Promise<string> {
  // Timestamped file name doubles as cache-busting: a new upload is a new URL.
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, base64ToBytes(base64), { contentType: 'image/jpeg', upsert: true });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { error } = await supabase.from('profiles').upsert({ id: userId, avatar_url: publicUrl }, { onConflict: 'id' });
  if (error) throw error;

  clearAvatarFolder(userId, path).catch(() => {});
  return publicUrl;
}

/** Delete the user's avatar files and clear avatar_url on their profile. */
export async function removeAvatar(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({ id: userId, avatar_url: null }, { onConflict: 'id' });
  if (error) throw error;
  await clearAvatarFolder(userId).catch(() => {});
}
