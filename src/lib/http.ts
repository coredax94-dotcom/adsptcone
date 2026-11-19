import { NextResponse } from 'next/server';

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function validHttpUrl(input: string) {
  try {
    const url = new URL(input);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch { return false; }
}
