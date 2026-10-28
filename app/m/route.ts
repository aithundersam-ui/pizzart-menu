import { NextResponse } from 'next/server';

// Short, permanent address printed in the QR codes: /m?t=5 -> /?t=5
export function GET(req: Request) {
  const u = new URL(req.url);
  const target = new URL('/', u);
  const t = u.searchParams.get('t');
  if (t) target.searchParams.set('t', t);
  target.searchParams.set('qr', '1');
  return NextResponse.redirect(target, 307);
}
