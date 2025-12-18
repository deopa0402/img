import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { addPromotionToImage } from '@/app/actions';
import { toast } from 'sonner';
import type { ImageStats } from '@/app/actions/stats';

interface AddPromotionModalProps {
  open: boolean;
  image: ImageStats | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPromotionModal({ open, image, onClose, onSuccess }: AddPromotionModalProps) {
  const [promotionValue, setPromotionValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!image || !promotionValue.trim()) return;

    setIsAdding(true);
    const result = await addPromotionToImage(image.image_url, promotionValue.trim());

    if (result.success) {
      toast.success('프로모션이 성공적으로 추가되었습니다.');
      setPromotionValue('');
      onClose();
      onSuccess();
    } else {
      toast.error(`프로모션 추가 실패: ${result.error}`);
    }
    setIsAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>프로모션 추가</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="promotion" className="text-right">프로모션 명</label>
            <input
              id="promotion"
              value={promotionValue}
              onChange={(e) => setPromotionValue(e.target.value)}
              className="col-span-3 border p-2 rounded"
              disabled={isAdding}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isAdding}>취소</Button>
          <Button onClick={handleAdd} disabled={!promotionValue.trim() || isAdding}>
            {isAdding ? '추가 중...' : '추가'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
