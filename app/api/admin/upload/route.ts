import { saveImage } from '@/lib/images';
import { handler, HttpError, ok, requireUser } from '@/lib/api';

export const POST = handler(async (req: Request) => {
  await requireUser('owner');
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw new HttpError(400, 'No file');
  const maxWidth = form.get('kind') === 'logo' ? 900 : 1200;
  try {
    return ok({ id: await saveImage(file, maxWidth) });
  } catch (e) {
    throw new HttpError(400, e instanceof Error && e.message.includes('15 MB') ? e.message : 'This file is not an image we can read (use JPG, PNG or WebP)');
  }
});
