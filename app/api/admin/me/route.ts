import { handler, ok, requireUser } from '@/lib/api';

export const GET = handler(async () => ok(await requireUser()));
