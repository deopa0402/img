'use server'

import { serviceSupabase } from '@/lib/supabase'

export type ImageStats = {
  id: number
  image_url: string
  access_count: number
  created_at: string
  updated_at: string | null
}

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