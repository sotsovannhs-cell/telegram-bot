import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { method, userId, lat, lng } = await req.json();

    // Verify user bounds and institution settings...
    // Insert log into Supabase
    
    // NOTE: This uses the anonymous key. In a real server action, 
    // you would either use the Service Role key to bypass RLS for trusted actions,
    // or pass the user's JWT so RLS handles security.
    
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert({
        user_id: userId || '00000000-0000-0000-0000-000000000000', // Need actual ID
        check_type: 'check_in',
        method,
        location_lat: lat,
        location_lng: lng
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
