import { useEffect, useRef } from 'react';

const useIntersectionObserver = (
  targetRef: React.RefObject<HTMLDivElement | null>,
  callback: () => void,
  options = {
    root: null,
    rootMargin: '10px',
    threshold: 0.1,
  },
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callbackRef.current();
        }
      });
    }, options);

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [targetRef, options.root, options.rootMargin, options.threshold, options]);
};

export default useIntersectionObserver;
