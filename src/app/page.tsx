'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { uploadImage, createShortUrlAction } from '@/app/actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowUpToLine, Copy, BarChart2, Image, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileSelected(true);
      setFileName(files[0].name);
      
      // 이미지 미리보기 생성
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        if (event.target?.result) {
          setPreviewUrl(event.target.result as string);
        }
      };
      fileReader.readAsDataURL(files[0]);
    } else {
      setFileSelected(false);
      setFileName(null);
      setPreviewUrl(null);
    }
  };

  const resetForm = () => {
    setFileSelected(false);
    setFileName(null);
    setPreviewUrl(null);
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 단축 URL 생성
  const createShortUrl = async (url: string) => {
    try {
      const result = await createShortUrlAction(url);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.short_url;
    } catch (err) {
      console.error('단축 URL 생성 실패:', err);
      return null;
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!fileSelected) {
      toast.error('이미지를 선택해주세요', {
        icon: <AlertCircle className="size-4 text-red-500" />
      });
      return;
    }
    
    setUploading(true);
    setError(null);

    try {
      const result = await uploadImage(formData);
      
      if (result.error) {
        setError(result.error);
        toast.error(result.error, {
          icon: <AlertCircle className="size-4 text-red-500" />,
          description: '다시 시도해주세요'
        });
        setImageUrl(null);
        setShortUrl(null);
      } else if (result.imageUrl) {
        setImageUrl(result.imageUrl);
        // 단축 URL 생성
        const short = await createShortUrl(result.imageUrl);
        setShortUrl(short);
        toast('이미지가 성공적으로 업로드되었습니다', {
          icon: <CheckCircle2 className="size-4 text-green-500" />,
          description: '이제 이미지를 공유할 수 있습니다'
        });
      }
    } catch (err) {
      console.error('업로드 오류:', err);
      const errorMessage = '이미지 업로드 중 오류가 발생했습니다.';
      setError(errorMessage);
      toast.error(errorMessage, {
        icon: <AlertCircle className="size-4 text-red-500" />
      });
      setImageUrl(null);
      setShortUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string = '링크') => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label}가 클립보드에 복사되었습니다`, {
        icon: <CheckCircle2 className="size-4 text-green-500" />,
        description: `${new Date().toLocaleTimeString()}`
      });
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      toast.error('클립보드 복사에 실패했습니다', {
        icon: <AlertCircle className="size-4 text-red-500" />
      });
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-background">
      <div className="max-w-lg mx-auto space-y-6">
        <Card className="shadow-md border-muted">
          <CardHeader className="pb-4">
        <div className="flex justify-between items-center w-full">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Image className="size-5" />
                이미지 업로더
              </CardTitle>
              <Link href="/stats">
                <Button variant="outline" size="sm" className="gap-1">
                  <BarChart2 className="size-4" />
                  <span className="hidden sm:inline">통계 보기</span>
                </Button>
                
          </Link>

              {/* <Button
      variant="outline"
      onClick={() =>
        toast("딸깍", {
          description: "딸깍 딸깍",
          action: {
            label: "딸깍",
            onClick: () => console.log("딸깍"),
          },
        })
      }
    >
                 딸깍
              </Button> */}
        </div>
            <CardDescription>
              이미지를 드래그하거나 선택하여 쉽게 업로드하세요
            </CardDescription>
          </CardHeader>
        
          <CardContent className="pt-0">
          <form 
            ref={formRef}
              onSubmit={(e) => {
                e.preventDefault();
                setUploading(true);
                const formData = new FormData(e.currentTarget);
                handleSubmit(formData);
              }} 
              className="space-y-6"
          >
              {/* 파일 업로드 영역 */}
              <div 
                onClick={triggerFileInput}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                  transition-colors duration-200 relative overflow-hidden
                  ${previewUrl 
                    ? 'border-primary/50 bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
                  }
                `}
              >
              <input
                  ref={fileInputRef}
                id="file-upload"
                name="file"
                type="file"
                  accept="image/*"
                disabled={uploading}
                onChange={handleFileChange}
                  className="hidden"
                />
                
                {!previewUrl ? (
                  <div className="py-6 space-y-3">
                    <ArrowUpToLine className="mx-auto size-10 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        클릭하여 파일 선택 또는 드래그하여 업로드
                      </p>
                      <p className="text-xs text-muted-foreground">
                        모든 이미지 형식 지원 (최대 5MB)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-video">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-contain rounded"
                    />
                    <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium truncate w-full">
                        {fileName}
              </p>
            </div>
            </div>
          )}
          
                {uploading && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
                    <div className="size-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-muted-foreground">업로드 중...</p>
            </div>
          )}
        </div>
              
              <div className="flex gap-2">
                {fileSelected && !uploading && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={resetForm}
                  >
                    초기화
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={uploading || !fileSelected}
                  className="flex-1 h-10"
                >
                  {uploading ? '처리 중...' : '업로드'}
                </Button>
              </div>
            </form>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        {imageUrl && (
          <Card className="shadow-md border-muted overflow-hidden">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">이미지 공유하기</CardTitle>
                <Badge variant="outline" className="text-xs">업로드 완료</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4 space-y-4">
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label className="flex justify-between">
                    <span>단축 링크</span>
                  </Label>
                  <div className="flex">
                    <div className="flex-1 relative">
                      <Input 
                        value={shortUrl || '단축 URL 생성 중...'} 
                        readOnly 
                        className="rounded-r-none pr-10 font-mono text-xs"
                      />
                    </div>
                    <Button 
                      onClick={() => shortUrl && copyToClipboard(shortUrl, '단축 URL')}
                      className="rounded-l-none px-3"
                      disabled={!shortUrl}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex justify-between">
                    <span>추적 링크</span>
                  </Label>
                  <div className="aspect-video bg-muted/30 flex items-center justify-center rounded-lg overflow-hidden border mb-2">
                    {uploading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <img 
                        src={shortUrl || imageUrl} 
                        alt="Uploaded" 
                        className="max-w-full max-h-full object-contain"
                        onError={() => {
                          setError('이미지를 불러오는 중 오류가 발생했습니다.');
                          toast.error('이미지를 불러오는 중 오류가 발생했습니다.', {
                            icon: <AlertCircle className="size-4 text-red-500" />
                          });
                        }}
                      />
                    )}
                  </div>
                  <div className="flex">
                    <div className="flex-1 relative">
                      <Input 
                        value={shortUrl || '단축 URL 생성 중...'} 
                        readOnly 
                        className="rounded-r-none pr-10 font-mono text-xs"
                      />
                    </div>
                    <Button 
                      onClick={() => shortUrl && copyToClipboard(shortUrl, '추적 URL')}
                      className="rounded-l-none px-3"
                      disabled={!shortUrl}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t bg-muted/20 flex justify-between py-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setImageUrl(null);
                  setPreviewUrl(null);
                  resetForm();
                }}
              >
                새 이미지 업로드
              </Button>
              <Link href="/stats">
                <Button variant="secondary" size="sm">
                  <BarChart2 className="size-4 mr-1" /> 통계 보기
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
