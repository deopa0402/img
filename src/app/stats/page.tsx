'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getImageStats, getImageDetailedStats, type ImageStats, type DetailedStats } from '../actions/stats';
import { createShortUrlAction, addPromotionToImage } from '@/app/actions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Copy, ExternalLink, BarChart2, Calendar, Users, Clock, RefreshCw } from 'lucide-react';

export default function StatsPage() {
  const [stats, setStats] = useState<ImageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  // const { toast } = useSonner();

  // 프로모션 추가 모달 관련 상태
  const [isAddPromotionModalOpen, setIsAddPromotionModalOpen] = useState(false);
  const [imageForPromotion, setImageForPromotion] = useState<ImageStats | null>(null);
  const [newPromotionValue, setNewPromotionValue] = useState('');
  const [isAddingPromotion, setIsAddingPromotion] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await getImageStats();
        
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          // 최신순으로 정렬 (조회수와 관계없이)
          const sortedStats = result.data.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setStats(sortedStats);
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
  const getExternalTrackingUrl = async (url: string) => {
    try {
      const result = await createShortUrlAction(url);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.short_url;
    } catch (err) {
      console.error('단축 URL 생성 실패:', err);
      return `${process.env.NEXT_PUBLIC_API_URL}/api/track?image_url=${encodeURIComponent(url)}`;
    }
  };

  // 클립보드에 복사
  const copyToClipboard = async (text: string) => {
    try {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, 99999);
      document.execCommand('copy');
      document.body.removeChild(input);
      
      toast.success('URL이 클립보드에 복사되었습니다');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      toast.error('클립보드 복사에 실패했습니다');
    }
  };

  // 추적 URL 바로 복사하기
  const copyTrackingUrl = async (imageUrl: string) => {
    const trackingUrl = await getExternalTrackingUrl(imageUrl);
    if (trackingUrl) {
      copyToClipboard(trackingUrl);
    }
  };

  // 리퍼러 간소화 및 URL 파싱
  const parseReferrer = (referrer: string) => {
    if (referrer === 'direct') return { hostname: '직접 접속', fullUrl: '' };
    try {
      const url = new URL(referrer);
      // & 이전까지만 사용
      const baseUrl = referrer.split('&')[0];
      return {
        hostname: url.hostname,
        baseUrl: baseUrl
      };
    } catch {
      return { hostname: referrer, baseUrl: referrer };
    }
  };

  // 상위 참조 사이트 필터링 및 그룹화
  const groupedReferrers = detailedStats?.topReferrers
    .filter(item => item.referrer !== 'direct')
    .reduce((acc: Record<string, { hostname: string; count: number; urls: Set<string> }>, item) => {
      const { hostname, baseUrl } = parseReferrer(item.referrer);
      if (!acc[baseUrl]) {
        acc[baseUrl] = {
          hostname,
          count: 0,
          urls: new Set<string>()
        };
      }
      acc[baseUrl].count += item.count;
      acc[baseUrl].urls.add(item.referrer);
      return acc;
    }, {} as Record<string, { hostname: string; count: number; urls: Set<string> }>) || {};

  const sortedReferrers = Object.entries(groupedReferrers)
    .map(([baseUrl, data]) => ({
      hostname: data.hostname,
      baseUrl,
      count: data.count,
      urls: Array.from(data.urls)
    }))
    .sort((a, b) => b.count - a.count);

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
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">이미지 접근 통계</h1>
          <Button asChild>
            <Link href="/">홈으로</Link>
          </Button>
        </div>

        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center p-12">
              <Skeleton className="w-6 h-6 rounded-full mr-2" />
              <p className="text-gray-600">통계 데이터 로드 중...</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && stats.length === 0 && !error && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">아직 기록된 이미지 통계가 없습니다.</p>
            </CardContent>
          </Card>
        )}

        {stats.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>프로모션 명</TableHead>
                    <TableHead>이미지</TableHead>
                    <TableHead>파일명</TableHead>
                    <TableHead>접근 횟수</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead>마지막 접근</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {stat.promotion ? (
                            stat.promotion
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setImageForPromotion(stat);
                                setIsAddPromotionModalOpen(true);
                              }}
                            >
                              추가
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-16 h-16 overflow-hidden rounded-md">
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
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {getImageName(stat.image_url)}
                        </div>
                        <Button variant="ghost" size="sm" asChild className="h-6 px-2">
                          <a 
                            href={stat.image_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            열기
                          </a>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-medium">
                          {stat.access_count}회
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{formatDate(stat.created_at)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {stat.updated_at ? formatDate(stat.updated_at) : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedImageUrl(stat.image_url)}
                          >
                            <BarChart2 className="h-4 w-4 mr-1" />
                            상세 통계
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => await copyTrackingUrl(stat.image_url)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            추적 URL
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={isAddPromotionModalOpen} onOpenChange={setIsAddPromotionModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>프로모션 추가</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="promotion" className="text-right">프로모션 명</label>
                <input
                  id="promotion"
                  value={newPromotionValue}
                  onChange={(e) => setNewPromotionValue(e.target.value)}
                  className="col-span-3 border p-2 rounded"
                  disabled={isAddingPromotion}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddPromotionModalOpen(false)} disabled={isAddingPromotion}>취소</Button>
              <Button onClick={async () => {
                if (imageForPromotion && newPromotionValue.trim()) {
                  setIsAddingPromotion(true);
                  const result = await addPromotionToImage(imageForPromotion.image_url, newPromotionValue.trim());
                  if (result.success) {
                    toast.success('프로모션이 성공적으로 추가되었습니다.');
                    setIsAddPromotionModalOpen(false);
                    setNewPromotionValue('');
                    // 데이터 새로고침 (revalidatePath는 서버 액션에서 이미 호출됨)
                    // 클라이언트 상태도 업데이트하거나 전체 데이터를 다시 가져와야 할 수 있음
                    // 여기서는 간단히 모달 닫고 입력값 초기화
                  } else {
                    toast.error(`프로모션 추가 실패: ${result.error}`);
                  }
                  setIsAddingPromotion(false);
                }
              }} disabled={!newPromotionValue.trim() || isAddingPromotion}>
                {isAddingPromotion ? '추가 중...' : '추가'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedImageUrl} onOpenChange={(open) => !open && setSelectedImageUrl(null)}>
          <DialogContent className="p-8">
            <DialogHeader className="pb-8 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-3 text-3xl">
                  <BarChart2 className="h-8 w-8" />
                  상세 통계: {selectedImageUrl ? getImageName(selectedImageUrl).slice(0, 8) : ''}
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (selectedImageUrl) {
                      setLoadingDetails(true);
                      getImageDetailedStats(selectedImageUrl)
                        .then(result => {
                          if (result.data) {
                            setDetailedStats(result.data);
                          }
                        })
                        .finally(() => setLoadingDetails(false));
                    }
                  }}
                  className="h-8 w-8"
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </div>
            </DialogHeader>

            {loadingDetails ? (
              <div className="flex items-center justify-center p-20">
                <div className="flex flex-col items-center gap-6">
                  <Skeleton className="w-20 h-20 rounded-full" />
                  <p className="text-gray-600 text-xl">상세 통계 로드 중...</p>
                </div>
              </div>
            ) : detailsError ? (
              <div className="p-12 text-center">
                <div className="text-red-600 mb-4 text-5xl">⚠️</div>
                <p className="text-red-600 font-medium text-xl">{detailsError}</p>
              </div>
            ) : detailedStats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <Users className="h-6 w-6 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-500">고유 IP 접근 수</h3>
                      </div>
                      <p className="text-4xl font-bold">{detailedStats.uniqueIPs}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <Calendar className="h-6 w-6 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-500">전체 접근</h3>
                      </div>
                      <p className="text-4xl font-bold">
                        {detailedStats.dailyAccess.reduce((sum, item) => sum + item.count, 0)}회
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <Clock className="h-6 w-6 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-500">최근 접근</h3>
                      </div>
                      <p className="text-xl font-medium">{formatDate(detailedStats.lastAccessed)}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl">날짜별 접근 통계</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[500px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-lg">날짜</TableHead>
                              <TableHead className="text-lg text-right">접근 횟수</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detailedStats.dailyAccess
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((item) => (
                                <TableRow key={item.date}>
                                  <TableCell className="text-lg">{formatDateLabel(item.date)}</TableCell>
                                  <TableCell className="text-right">
                                    <Badge variant="secondary" className="text-lg px-4 py-2">
                                      {item.count}회
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
  <CardHeader className="pb-6">
    <CardTitle className="text-xl">참조 사이트</CardTitle>
  </CardHeader>
  <CardContent className="p-0">
    {/* 스크롤 가능 영역: overflow-y-auto로 세로 스크롤 활성화, 높이 400px 유지 */}
    <div className="h-[400px] overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="text-lg">사이트</TableHead>
            <TableHead className="text-lg text-right">접근 횟수</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedReferrers.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-lg font-medium">{item.hostname}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {item.baseUrl}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {item.count}회
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </CardContent>
</Card>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 