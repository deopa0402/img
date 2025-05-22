import { serviceSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const { image_url } = await request.json();

    if (!image_url || !image_url.startsWith('https://')) {
      return NextResponse.json(
        { error: '유효한 image_url이 필요합니다' },
        { status: 400 }
      );
    }

    // 7자리 짧은 ID 생성
    const shortId = nanoid(7);

    // 단축 URL 저장
    const { error: dbError } = await serviceSupabase
      .from('shortened_urls')
      .insert({
        short_id: shortId,
        original_url: image_url,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'URL 단축 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    // 단축된 URL 반환
    const shortUrl = `https://img-rust-eight.vercel.app/i/${shortId}`;
    return NextResponse.json({ short_url: shortUrl });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 