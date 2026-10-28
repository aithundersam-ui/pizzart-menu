import { getAdminMenu } from '@/lib/data';
import { handler, ok, requireUser } from '@/lib/api';

export const GET = handler(async () => {
  await requireUser();
  return ok(await getAdminMenu());
});
