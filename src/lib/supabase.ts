import { createClient } from '@supabase/supabase-js'

// 일반 클라이언트 인스턴스 (브라우저 및 서버에서 사용)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 서비스 롤 클라이언트 인스턴스 (서버 측 전용, RLS 우회)
export const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 이미지 URL 생성 헬퍼 함수
export function getImagePublicUrl(fileName: string): string {
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);
  
  return data.publicUrl;
}

// 추적 URL 생성 함수 (이미지 접근 횟수 추적)
export function getTrackedImageUrl(imageUrl: string): string {
  // 서버 사이드에서는 작동하지 않음
  if (typeof window === 'undefined') return imageUrl;
  
  const origin = window.location.origin;
  const trackingEndpoint = `${origin}/api/track-image`;
  
  // URL 인코딩하여 쿼리 파라미터로 전달
  return `${trackingEndpoint}?image_url=${encodeURIComponent(imageUrl)}`;
} 