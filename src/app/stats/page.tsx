'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getImageStats, type ImageStats } from '../actions/stats';

export default function StatsPage() {
  const [stats, setStats] = useState<ImageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await getImageStats();
        
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setStats(result.data);
        }
      } catch (err) {
        console.error('통계 데이터 로드 오류:', err);
        setError('통계 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // 이미지 로드 실패 처리
  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(imageUrl);
      return newSet;
    });
  };

  // 파일 이름만 추출하는 함수
  const getImageName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch (e) {
      // URL 파싱 오류시 전체 URL 반환
      return url;
    }
  };

  // 날짜 형식화
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR');
    } catch (e) {
      return dateString;
    }
  };

  // 추적 URL 생성 (Vercel 호스팅용)
  const getExternalTrackingUrl = (url: string) => {
    return `https://img-rust-eight.vercel.app/api/track-image?image_url=${encodeURIComponent(url)}`;
  };

  // 클립보드에 복사
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('URL이 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  // 추적 URL 바로 복사하기
  const copyTrackingUrl = (imageUrl: string) => {
    const trackingUrl = getExternalTrackingUrl(imageUrl);
    copyToClipboard(trackingUrl);
  };

  return (
    <div className="min-h-screen p-8 sm:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">이미지 접근 통계</h1>
          <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            홈으로
          </Link>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2"></div>
            <p>통계 데이터 로드 중...</p>
          </div>
        )}

        {error && (
          <div className="p-4 text-red-600 bg-red-50 rounded-md border border-red-200 mb-4">
            {error}
          </div>
        )}

        {!loading && stats.length === 0 && !error && (
          <div className="p-8 text-center bg-gray-50 rounded-lg">
            <p className="text-gray-600">아직 기록된 이미지 통계가 없습니다.</p>
          </div>
        )}

      

        {stats.length > 0 && (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이미지</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">파일명</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">접근 횟수</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 접근</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.map((stat) => (
                  <tr key={stat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-16 h-16 overflow-hidden">
                        {failedImages.has(stat.image_url) ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                            이미지 없음
                          </div>
                        ) : (
                          <img 
                            src={stat.image_url} 
                            alt="Thumbnail" 
                            className="w-full h-full object-cover" 
                            onError={() => handleImageError(stat.image_url)}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {getImageName(stat.image_url)}
                      </div>
                      <a 
                        href={stat.image_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-blue-500 hover:underline"
                      >
                        열기
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{stat.access_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(stat.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stat.updated_at ? formatDate(stat.updated_at) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyTrackingUrl(stat.image_url)}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          추적 URL 복사
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 