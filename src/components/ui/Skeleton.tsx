import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className={`bg-surface border-4 border-black border-dashed ${className}`}
        />
      ))}
    </>
  );
}

export function ContentSkeleton() {
  return (
    <div className="card h-full min-h-[300px]">
      <Skeleton className="w-full h-1/2 mb-4" />
      <Skeleton className="w-3/4 h-8 mb-4 shadow-sm" />
      <Skeleton className="w-1/2 h-4 mb-8" />
      <div className="mt-auto">
        <Skeleton className="w-full h-12" />
      </div>
    </div>
  );
}
