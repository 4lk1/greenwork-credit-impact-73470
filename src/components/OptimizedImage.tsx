import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  priority?: boolean;
}

export const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  fallback = '/placeholder.svg',
  priority = false 
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState(priority ? src : fallback);
  const [isLoading, setIsLoading] = useState(!priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) {
      setIsLoading(false);
      return;
    }

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
            };
            img.onerror = () => {
              setImageSrc(fallback);
              setIsLoading(false);
            };
            if (imgRef.current) {
              observer.unobserve(imgRef.current);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, fallback, priority]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn(
        'transition-opacity duration-300',
        isLoading ? 'opacity-0' : 'opacity-100',
        className
      )}
    />
  );
};
