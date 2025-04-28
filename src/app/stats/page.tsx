'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getImageStats, getImageDetailedStats, type ImageStats, type DetailedStats } from '../actions/stats';

export default function StatsPage() {
  const [stats, setStats] = useState<ImageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

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

  // 상세 통계 로드
  useEffect(() => {
    if (!selectedImageUrl) {
      setDetailedStats(null);
      return;
    }

    const fetchDetailedStats = async () => {
      setLoadingDetails(true);
      setDetailsError(null);
      try {
        const result = await getImageDetailedStats(selectedImageUrl);
        
        if (result.error) {
          setDetailsError(result.error);
        } else if (result.data) {
          setDetailedStats(result.data);
        }
      } catch (err) {
        console.error('상세 통계 로드 오류:', err);
        setDetailsError('상세 통계를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetailedStats();
  }, [selectedImageUrl]);

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
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR');
    } catch (e) {
      return dateString;
    }
  };

  // 유저 에이전트 간소화
  const simplifyUserAgent = (ua: string) => {
    if (ua === 'unknown') return '알 수 없음';
    
    // 브라우저 감지
    let browser = '';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('MSIE') || ua.includes('Trident')) browser = 'Internet Explorer';
    else browser = '기타 브라우저';
    
    // 장치 감지
    let device = '';
    if (ua.includes('Mobile')) device = '모바일';
    else if (ua.includes('Tablet')) device = '태블릿';
    else device = '데스크톱';
    
    return `${browser} (${device})`;
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

  // 리퍼러 간소화
  const simplifyReferrer = (referrer: string) => {
    if (referrer === 'direct') return '직접 접속';
    try {
      const url = new URL(referrer);
      return url.hostname;
    } catch {
      return referrer;
    }
  };

  // 날짜별 접근 통계 관련 함수
  const formatDateLabel = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
    } catch {
      return dateString;
    }
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

        {/* 상세 통계 섹션 */}
        {selectedImageUrl && (
          <div className="mb-10 bg-white text-black rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
              <h2 className="font-bold text-lg">상세 통계: {getImageName(selectedImageUrl)}</h2>
              <button 
                onClick={() => setSelectedImageUrl(null)}
                className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                닫기
              </button>
            </div>
            
            {loadingDetails && (
              <div className="flex items-center justify-center p-12">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2"></div>
                <p>상세 통계 로드 중...</p>
              </div>
            )}
            
            {detailsError && (
              <div className="p-4 text-red-600 bg-red-50 m-4 rounded-md border border-red-200">
                {detailsError}
              </div>
            )}
            
            {detailedStats && !loadingDetails && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* 요약 카드 */}
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">총 접근 횟수</h3>
                    <p className="text-2xl font-bold">
                      {stats.find(s => s.image_url === selectedImageUrl)?.access_count || 0}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">고유 IP 접근 수</h3>
                    <p className="text-2xl font-bold">{detailedStats.uniqueIPs}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">최근 접근 시간</h3>
                    <p className="text-sm font-medium">{formatDate(detailedStats.lastAccessed)}</p>
                  </div>
                </div>
                
                {/* 접근 차트 및 상세 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* 날짜별 접근 통계 */}
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">날짜별 접근 통계 (최근 7일)</h3>
                    {detailedStats.dailyAccess.length === 0 ? (
                      <p className="text-gray-500 text-center py-6">접근 기록이 없습니다.</p>
                    ) : (
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                              <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">접근 횟수</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {detailedStats.dailyAccess
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // 최신 날짜순으로 정렬
                              .map((item) => (
                                <tr key={item.date} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{formatDateLabel(item.date)}요일</div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-right">
                                    <span className="text-sm font-medium text-gray-900">{item.count}회</span>
                                  </td>
                                </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">합계</td>
                              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                {detailedStats.dailyAccess.reduce((sum, item) => sum + item.count, 0)}회
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                  
                  {/* 리퍼러 통계 */}
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">상위 참조 사이트</h3>
                    {detailedStats.topReferrers.length === 0 ? (
                      <p className="text-gray-500 text-center py-6">참조 통계가 없습니다.</p>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {detailedStats.topReferrers.map((item, index) => (
                          <li key={index} className="py-2 flex justify-between">
                            <span className="text-sm">{simplifyReferrer(item.referrer)}</span>
                            <span className="text-sm font-medium">{item.count}회</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                
                {/* 최근 접근 기록 */}
                <div className="bg-white p-4 rounded-md border border-gray-200 mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">최근 접근 기록</h3>
                  {detailedStats.recentAccesses.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">접근 기록이 없습니다.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">접근 시간</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP 주소</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">브라우저</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">참조 사이트</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {detailedStats.recentAccesses.map((access) => (
                            <tr key={access.id}>
                              <td className="px-3 py-2 whitespace-nowrap text-xs">{formatDate(access.accessed_at)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs">{access.ip_address}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs">{simplifyUserAgent(access.user_agent)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs">{simplifyReferrer(access.referrer)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                          onClick={() => setSelectedImageUrl(stat.image_url)}
                          className="px-3 py-1 bg-blue-500  text-xs rounded hover:bg-blue-600"
                        >
                          상세 통계
                        </button>
                        <button
                          onClick={() => copyTrackingUrl(stat.image_url)}
                          className="px-3 py-1 bg-green-500  text-xs rounded hover:bg-green-600"
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