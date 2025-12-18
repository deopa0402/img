'use server'

import { serviceSupabase } from '@/lib/supabase'
import { unstable_cache } from 'next/cache'

export type ImageStats = {
  id: number
  image_url: string
  promotion: string
  access_count: number
  unique_ips: number
  last_accessed: string | null
  created_at: string
  updated_at: string | null
}

export type PaginatedResponse<T> = {
  data: T[] | null
  error: string | null
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
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

// ========================================
// ✅ 최적화된 기본 통계 (Materialized View 사용)
// ========================================
export async function getImageStats(
  page: number = 1,
  limit: number = 50,
  searchQuery: string = ''
): Promise<PaginatedResponse<ImageStats>> {
  try {
    const offset = (page - 1) * limit;

    // ✅ 단 1번의 쿼리로 모든 데이터 조회 (N+1 문제 해결)
    let query = serviceSupabase
      .from('image_stats_summary')  // Materialized View 사용
      .select('*', { count: 'exact' });

    // 🔍 검색어가 있으면 프로모션 명으로 필터링
    if (searchQuery.trim()) {
      query = query.ilike('promotion', `%${searchQuery.trim()}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return {
        data: null,
        error: '통계 데이터를 가져오는 중 오류가 발생했습니다.'
      };
    }

    return {
      data: data as ImageStats[],
      error: null,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Action error:', error);
    return {
      data: null,
      error: '서버 오류가 발생했습니다.'
    };
  }
}

// ========================================
// ✅ 캐시된 통계 (60초간 캐시)
// ========================================
export const getCachedImageStats = unstable_cache(
  async (page: number, limit: number) => getImageStats(page, limit),
  ['image-stats'],
  {
    revalidate: 60,  // 60초마다 갱신
    tags: ['stats']
  }
);

// ========================================
// ✅ 최적화된 상세 통계 (RPC 사용)
// ========================================
export async function getImageDetailedStats(
  imageUrl: string
): Promise<{ data: DetailedStats | null; error: string | null }> {
  try {
    // ✅ 1. RPC 함수로 집계 데이터 한 번에 가져오기 (6개 쿼리 → 1개로 축소)
    const { data: aggregated, error: aggError } = await serviceSupabase
      .rpc('get_image_detailed_stats_optimized', {
        p_image_url: imageUrl
      });

    if (aggError) {
      console.error('RPC error:', aggError);
      return {
        data: null,
        error: '상세 통계를 가져오는 중 오류가 발생했습니다.'
      };
    }

    // ✅ 2. 최근 접근 기록만 별도 조회 (가벼움)
    const { data: recentData } = await serviceSupabase
      .from('image_access_history')
      .select('id, image_url, ip_address, user_agent, referrer, accessed_at')
      .eq('image_url', imageUrl)
      .not('ip_address', 'in', '("127.0.0.1","::1","unknown")')
      .not('referrer', 'ilike', '%img-rust-eight.vercel.app%')
      .not('referrer', 'eq', 'direct')
      .order('accessed_at', { ascending: false })
      .limit(10);

    const detailedStats: DetailedStats = {
      uniqueIPs: aggregated?.unique_ips || 0,
      lastAccessed: aggregated?.last_accessed || null,
      topReferrers: aggregated?.top_referrers || [],
      recentAccesses: recentData || [],
      accessByTime: aggregated?.access_by_hour || [],
      dailyAccess: aggregated?.daily_access || []
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

// ========================================
// 🔄 수동 캐시 갱신 (관리자용)
// ========================================
export async function refreshMaterializedView() {
  try {
    const { error } = await serviceSupabase.rpc('refresh_image_stats_summary');

    if (error) throw error;

    return { success: true, message: '통계가 갱신되었습니다.' };
  } catch (error) {
    console.error('Refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '갱신 중 오류가 발생했습니다.'
    };
  }
} 