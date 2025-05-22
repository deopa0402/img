import { serviceSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { shortId: string } }
) {
  try {
    const { shortId } = params;

    // 단축 URL 조회
    const { data, error } = await serviceSupabase
      .from('shortened_urls')
      .select('original_url')
      .eq('short_id', shortId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'URL을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 원본 URL로 리다이렉트
    return NextResponse.redirect(new URL(`/api/track-image?image_url=${encodeURIComponent(data.original_url)}`, request.url));
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 