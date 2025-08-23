import React from "react";

const SkeletonCard = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-muted rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-muted-foreground/20 rounded w-1/4"></div>
        <div className="h-8 w-8 bg-muted-foreground/20 rounded"></div>
      </div>
      <div className="h-8 bg-muted-foreground/20 rounded w-1/3"></div>
      <div className="h-3 bg-muted-foreground/20 rounded w-2/3"></div>
    </div>
  </div>
);

const SkeletonList = ({ items = 5 }: { items?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <div className="h-8 w-8 bg-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-muted rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="animate-pulse">
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b bg-muted/30 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded w-3/4"></div>
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b last:border-b-0 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className={`h-4 bg-muted rounded ${
                  colIndex === 0 ? 'w-full' : colIndex === cols - 1 ? 'w-1/2' : 'w-3/4'
                }`}
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SkeletonForm = () => (
  <div className="animate-pulse space-y-6">
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-1/4"></div>
        <div className="h-10 bg-muted rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-1/3"></div>
        <div className="h-24 bg-muted rounded"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    </div>
    <div className="flex gap-2 justify-end">
      <div className="h-10 w-20 bg-muted rounded"></div>
      <div className="h-10 w-16 bg-muted rounded"></div>
    </div>
  </div>
);

const SkeletonChart = () => (
  <div className="animate-pulse">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-muted rounded w-1/3"></div>
        <div className="h-8 w-24 bg-muted rounded"></div>
      </div>
      <div className="h-64 bg-muted/30 rounded-lg flex items-end justify-center gap-2 p-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div 
            key={i}
            className="bg-muted rounded-t w-8"
            style={{ 
              height: `${Math.random() * 60 + 20}%`,
              animationDelay: `${i * 0.1}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

const SkeletonProgress = () => (
  <div className="animate-pulse space-y-2">
    <div className="flex items-center justify-between">
      <div className="h-4 bg-muted rounded w-1/4"></div>
      <div className="h-4 bg-muted rounded w-16"></div>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-muted-foreground/40 rounded-full w-3/5"></div>
    </div>
  </div>
);

export {
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonForm,
  SkeletonChart,
  SkeletonProgress
};