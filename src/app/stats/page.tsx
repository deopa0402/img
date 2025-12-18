'use client';

import { Suspense } from 'react';
import { StatsPageContent } from './StatsPageContent';
import { LoadingCard } from './components/common';

export default function StatsPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <StatsPageContent />
    </Suspense>
  );
}
