"use client";

import { useEffect, useRef } from "react";
import { trackSectionView } from "@/lib/analytics";

const viewed = new Set<string>();

export function useTrackSectionView(sectionName: string) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || viewed.has(sectionName)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewed.has(sectionName)) {
          viewed.add(sectionName);
          trackSectionView(sectionName);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionName]);

  return ref;
}
