'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { uploadImage } from './actions';
import { getTrackedImageUrl } from '@/lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileSelected(e.target.files !== null && e.target.files.length > 0);
  };

  const handleSubmit = async (formData: FormData) => {
    setUploading(true);
    setError(null);

    try {
      // 서버 액션 호출
      const result = await uploadImage(formData);
      
      if (result.error) {
        setError(result.error);
        setImageUrl(null);
      } else if (result.imageUrl) {
        setImageUrl(result.imageUrl);
      }
    } catch (err) {
      console.error('업로드 오류:', err);
      setError('이미지 업로드 중 오류가 발생했습니다.');
      setImageUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('URL이 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  // 추적 URL 생성 (이미지 접근 추적용)
  const getTrackingUrl = (url: string) => {
    // 직접 URL 생성
    return `/api/track-image?image_url=${encodeURIComponent(url)}`;
    // 또는 헬퍼 함수 사용: getTrackedImageUrl(url);
  };

  // 외부 추적 URL 생성 (Vercel 호스팅용)
  const getExternalTrackingUrl = (url: string) => {
    return `https://img-rust-eight.vercel.app/api/track-image?image_url=${encodeURIComponent(url)}`;
  };

  return (
    <div className="grid items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-3xl font-bold text-center">이미지 업로드</h1>
          <Link href="/stats" className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
            통계 보기
          </Link>
        </div>
        
        <div className="w-full p-6 bg-white text-black rounded-lg shadow-md">
          <form 
            ref={formRef}
            action={handleSubmit}
            className="space-y-4"
          >
            <div className="mb-4">
              <label 
                htmlFor="file-upload" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이미지 선택
              </label>
              <input
                id="file-upload"
                name="file"
                type="file"
                className="w-full p-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
                onChange={handleFileChange}
              />
              <p className="mt-1 text-sm ">
                모든 파일 형식 지원 (최대 5MB)
              </p>
            </div>
            
            <button
              type="submit"
              disabled={uploading || !fileSelected}
              className="w-full py-2 px-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {uploading ? '업로드 중...' : '업로드'}
            </button>
          </form>
          
          {uploading && (
            <div className="flex items-center justify-center gap-2 mt-4 p-4">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-gray-600">서버에서 이미지 처리 중...</p>
            </div>
          )}
          
          {error && (
            <div className="w-full p-3 mt-4 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}
        </div>
        
        {imageUrl && (
          <div className="w-full p-6 bg-white text-black rounded-lg shadow-md mt-4">
            <h2 className="text-xl font-semibold mb-4">업로드 완료</h2>
            
            <div className="mb-4 overflow-hidden rounded-md">
              <img 
                src={getTrackingUrl(imageUrl)} 
                alt="Uploaded" 
                className="w-full h-auto rounded-md shadow"
                onError={() => setError('이미지를 불러오는 중 오류가 발생했습니다.')}
              />
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-medium mb-1">이미지 URL:</p>
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={imageUrl} 
                  readOnly 
                  className="flex-1 p-2 text-sm bg-gray-50 border border-gray-300 rounded-l-md focus:outline-none"
                />
                <button 
                  onClick={() => copyToClipboard(imageUrl)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none"
                >
                  복사
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                이 URL을 사용하여 이미지에 접근할 수 있습니다.
              </p>

              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-1">로컬 추적 URL:</p>
                <div className="flex items-center">
                  <input 
                    type="text" 
                    value={getTrackingUrl(imageUrl)} 
                    readOnly 
                    className="flex-1 p-2 text-sm bg-gray-50 border border-gray-300 rounded-l-md focus:outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(getTrackingUrl(imageUrl))}
                    className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none"
                  >
                    복사
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  로컬 환경에서 이미지 접근 추적에 사용됩니다.
                </p>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Vercel 추적 URL:</p>
                <div className="flex items-center">
                  <input 
                    type="text" 
                    value={getExternalTrackingUrl(imageUrl)} 
                    readOnly 
                    className="flex-1 p-2 text-sm bg-gray-50 border border-gray-300 rounded-l-md focus:outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(getExternalTrackingUrl(imageUrl))}
                    className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none"
                  >
                    복사
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Vercel 배포 환경에서 이미지 접근 추적에 사용됩니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
