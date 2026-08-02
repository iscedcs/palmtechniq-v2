"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Bypass Lenis on Sanity Studio route
    if (pathname?.startsWith("/studio")) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    // Sync Lenis scroll events with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Add Lenis's requestAnimationFrame to GSAP's ticker for zero-stutter frame syncing
    function updateRaf(time: number) {
      lenis.raf(time * 1000);
    }

    gsap.ticker.add(updateRaf);
    gsap.ticker.lagSmoothing(0);

    // Observe body overflow locking (e.g. Radix UI Modals/Sheets/Drawers)
    const observer = new MutationObserver(() => {
      const isLocked = document.body.style.overflow === "hidden";
      if (isLocked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      observer.disconnect();
      gsap.ticker.remove(updateRaf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pathname]);

  if (pathname?.startsWith("/studio")) {
    return <>{children}</>;
  }

  return <>{children}</>;
}

export default SmoothScrollProvider;
