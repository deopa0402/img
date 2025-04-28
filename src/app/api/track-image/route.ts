import { serviceSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// 중복 요청 필터링 시간(초)
const DUPLICATE_FILTER_SECONDS = 3;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const image_url = searchParams.get('image_url');

    if (!image_url || !image_url.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Valid image_url is required' },
        { status: 400 }
      );
    }

    // 요청 정보 수집
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || 'direct';
    const timestamp = new Date().toISOString();

    // 최근 DUPLICATE_FILTER_SECONDS초 이내의 동일 요청자 확인
    const earliestValidTime = new Date();
    earliestValidTime.setSeconds(earliestValidTime.getSeconds() - DUPLICATE_FILTER_SECONDS);
    
    const { data: recentAccess, error: recentError } = await serviceSupabase
      .from('image_access_history')
      .select('id')
      .eq('image_url', image_url)
      .eq('ip_address', ip)
      .eq('user_agent', userAgent)
      .eq('referrer', referrer)
      .gte('accessed_at', earliestValidTime.toISOString())
      .order('accessed_at', { ascending: false })
      .limit(1);

    // 중복 요청으로 판단되면 카운트 증가나 기록 저장 없이 이미지만 반환
    const isDuplicate = recentAccess && recentAccess.length > 0;
    
    if (!isDuplicate) {
      // 현재 카운트 조회 - 서비스 롤 사용하여 RLS 우회
      const { data: currentData, error: fetchError } = await serviceSupabase
        .from('image_access_logs')
        .select('access_count')
        .eq('image_url', image_url)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: 결과 없음 오류
        console.error('Fetch error:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch count' },
          { status: 500 }
        );
      }

      // 기존 카운트 또는 기본값 0
      const currentCount = currentData?.access_count || 0;
      
      // 데이터베이스 업데이트 (access_count 증가) - 서비스 롤 사용하여 RLS 우회
      const { error: dbError } = await serviceSupabase
        .from('image_access_logs')
        .upsert(
          {
            image_url,
            access_count: currentCount + 1,
            updated_at: timestamp,
          },
          { onConflict: 'image_url' }
        );

      if (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json(
          { error: 'Failed to update count' },
          { status: 500 }
        );
      }

      // 상세 접근 기록 저장
      try {
        const { error: historyError } = await serviceSupabase
          .from('image_access_history')
          .insert({
            image_url,
            ip_address: ip,
            user_agent: userAgent,
            referrer: referrer,
            accessed_at: timestamp
          });

        if (historyError) {
          console.error('Access history error:', historyError);
          // 접근 기록 저장 실패해도 이미지 제공은 계속 진행
        }
      } catch (historyError) {
        console.error('Error recording access history:', historyError);
        // 접근 기록 저장 실패해도 이미지 제공은 계속 진행
      }
    } else {
      // 디버깅용: 중복 요청 필터링 로그
      console.log(`Filtered duplicate request for ${image_url} from ${ip}`);
    }

    // 이미지 가져오기
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: 500 }
      );
    }

    // 이미지 데이터 가져오기
    const imageData = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('Content-Type') || 'image/jpeg';

    // 이미지 응답 반환
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 