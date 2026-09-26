import { NextRequest } from 'next/server';
import { logout } from '../../../../lib/auth/logout';
export async function POST(request: NextRequest) { return logout(request, true); }
