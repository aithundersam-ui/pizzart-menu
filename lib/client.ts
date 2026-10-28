'use client';

/** Small fetch wrapper for the admin screens: throws an Error with the server's message. */
export async function api<T = any>(method: string, url: string, data?: unknown): Promise<T> {
  const init: RequestInit = { method, headers: {} };
  if (data instanceof FormData) init.body = data;
  else if (data !== undefined) {
    init.body = JSON.stringify(data);
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, init);
  if (res.status === 401 && !url.includes('/api/auth/')) {
    location.href = '/admin/login';
    throw new Error('Session expired');
  }
  const json = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) throw new Error(json?.error ?? `Error ${res.status}`);
  return json as T;
}

/**
 * Shrinks big phone photos in the browser before upload (hosting functions reject bodies over ~6 MB).
 * PNG logos keep their transparency.
 */
async function shrink(file: File, max = 1800): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 3_000_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('resize failed'))), type, 0.88));
  } catch {
    return file; // the server still validates and resizes
  }
}

export async function uploadImage(file: File, kind: 'photo' | 'logo' = 'photo'): Promise<string> {
  const fd = new FormData();
  fd.append('file', await shrink(file), file.name);
  fd.append('kind', kind);
  return (await api<{ id: string }>('POST', '/api/admin/upload', fd)).id;
}
