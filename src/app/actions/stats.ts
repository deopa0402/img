'use server'

import { serviceSupabase } from '@/lib/supabase'

export type ImageStats = {
  id: number
  image_url: string
  access_count: number
  created_at: string
  updated_at: string | null
}

export type ImageAccessDetail = {
  id: number
  image_url: string
  ip_address: string
  user_agent: string
  referrer: string
  accessed_at: string
}

export type DetailedStats = {
  uniqueIPs: number
  lastAccessed: string | null
  topReferrers: { referrer: string; count: number }[]
  recentAccesses: ImageAccessDetail[]
  accessByTime: { hour: number; count: number }[]
  dailyAccess: { date: string; count: number }[]
}

// 기본 이미지 통계 가져오기
export async function getImageStats(): Promise<{ data: ImageStats[] | null; error: string | null }> {
  try {
    // 서비스 롤을 사용하여 RLS 정책 우회
    const { data, error } = await serviceSupabase
      .from('image_access_logs')
      .select('*')
      .order('access_count', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return { 
        data: null, 
        error: '통계 데이터를 가져오는 중 오류가 발생했습니다.' 
      }
    }

    return { 
      data: data as ImageStats[], 
      error: null 
    }
  } catch (error) {
    console.error('Action error:', error)
    return { 
      data: null, 
      error: '서버 오류가 발생했습니다.' 
    }
  }
}

// 특정 이미지의 상세 통계 가져오기
export async function getImageDetailedStats(imageUrl: string): Promise<{ data: DetailedStats | null; error: string | null }> {
  try {
    // 1. 유니크 IP 개수
    const { data: uniqueIPData, error: uniqueIPError } = await serviceSupabase
      .from('image_access_history')
      .select('ip_address')
      .eq('image_url', imageUrl)
      .not('ip_address', 'eq', 'unknown')
      .then((result) => {
        if (result.error) return { data: null, error: result.error };
        // IP 주소 세트 생성하여 중복 제거
        const uniqueIPs = new Set(result.data.map(item => item.ip_address));
        return { data: uniqueIPs.size, error: null };
      });

    if (uniqueIPError) {
      console.error('Unique IP error:', uniqueIPError);
      return { data: null, error: '상세 통계를 가져오는 중 오류가 발생했습니다.' };
    }

    // 2. 가장 최근 접근 시간
    const { data: lastAccessData, error: lastAccessError } = await serviceSupabase
      .from('image_access_history')
      .select('accessed_at')
      .eq('image_url', imageUrl)
      .order('accessed_at', { ascending: false })
      .limit(1)
      .single();

    // 3. 가장 많이 접근한 리퍼러 상위 5개
    const { data: referrerData, error: referrerError } = await serviceSupabase.rpc(
      'get_top_referrers',
      { image_url_param: imageUrl, limit_param: 5 }
    ).then((result) => {
      if (result.error) {
        // RPC 함수가 없을 경우 수동으로 집계
        return serviceSupabase
          .from('image_access_history')
          .select('referrer')
          .eq('image_url', imageUrl)
          .then((result2) => {
            if (result2.error) return { data: [], error: result2.error };
            
            // 수동으로 리퍼러 집계
            const referrerCounts: Record<string, number> = {};
            result2.data.forEach(item => {
              const ref = item.referrer || 'direct';
              referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
            });
            
            // 상위 5개 리퍼러 추출
            const topReferrers = Object.entries(referrerCounts)
              .map(([referrer, count]) => ({ referrer, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);
              
            return { data: topReferrers, error: null };
          });
      }
      return { data: result.data, error: null };
    });

    // 4. 최근 접근 기록 10개
    const { data: recentData, error: recentError } = await serviceSupabase
      .from('image_access_history')
      .select('id, image_url, ip_address, user_agent, referrer, accessed_at')
      .eq('image_url', imageUrl)
      .order('accessed_at', { ascending: false })
      .limit(10);

    // 5. 시간대별 접근 통계
    const { data: timeData, error: timeError } = await serviceSupabase.rpc(
      'get_access_by_hour',
      { image_url_param: imageUrl }
    ).then((result) => {
      if (result.error) {
        // RPC 함수가 없을 경우 수동으로 집계
        return serviceSupabase
          .from('image_access_history')
          .select('accessed_at')
          .eq('image_url', imageUrl)
          .then((result2) => {
            if (result2.error) return { data: [], error: result2.error };
            
            // 수동으로 시간대별 집계
            const hourCounts: Record<number, number> = {};
            result2.data.forEach(item => {
              const hour = new Date(item.accessed_at).getHours();
              hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            });
            
            // 시간대별 데이터 형식화
            const hourlyData = Array.from({ length: 24 }, (_, i) => ({
              hour: i,
              count: hourCounts[i] || 0
            }));
              
            return { data: hourlyData, error: null };
          });
      }
      return { data: result.data, error: null };
    });

    // 6. 일별 접근 통계 (최근 7일)
    const { data: dailyData, error: dailyError } = await serviceSupabase.rpc(
      'get_daily_access',
      { image_url_param: imageUrl, days_param: 7 }
    ).then((result) => {
      if (result.error) {
        // RPC 함수가 없을 경우 수동으로 집계
        return serviceSupabase
          .from('image_access_history')
          .select('accessed_at')
          .eq('image_url', imageUrl)
          .gte('accessed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .then((result2) => {
            if (result2.error) return { data: [], error: result2.error };
            
            // 수동으로 일별 집계
            const dailyCounts: Record<string, number> = {};
            result2.data.forEach(item => {
              const date = new Date(item.accessed_at).toISOString().split('T')[0];
              dailyCounts[date] = (dailyCounts[date] || 0) + 1;
            });
            
            // 일별 데이터 형식화
            const dailyData = Object.entries(dailyCounts)
              .map(([date, count]) => ({ date, count }))
              .sort((a, b) => a.date.localeCompare(b.date));
              
            return { data: dailyData, error: null };
          });
      }
      return { data: result.data, error: null };
    });

    // 모든 데이터 결합
    const detailedStats: DetailedStats = {
      uniqueIPs: uniqueIPData || 0,
      lastAccessed: lastAccessData?.accessed_at || null,
      topReferrers: referrerData || [],
      recentAccesses: recentData || [],
      accessByTime: timeData || [],
      dailyAccess: dailyData || []
    };

    return { 
      data: detailedStats,
      error: null 
    };
  } catch (error) {
    console.error('Detailed stats error:', error);
    return { 
      data: null, 
      error: '상세 통계를 가져오는 중 오류가 발생했습니다.' 
    };
  }
} 