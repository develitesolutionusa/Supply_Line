"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SKIP_PREFIXES = ["/checkout", "/cart", "/sign-in", "/sign-up"];

function shouldSkipPath(pathname: string) {
  return SKIP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function collectTargets(root: HTMLElement) {
  return [...root.querySelectorAll(":scope section")].filter((el): el is HTMLElement => {
    if (!(el instanceof HTMLElement) || el.hidden) return false;
    if (el.classList.contains("hero-section")) return false;
    return true;
  });
}

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (shouldSkipPath(pathname)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    let nodes: HTMLElement[] = [];
    let frame = 0;

    function apply() {
      if (cancelled) return;
      const root = document.getElementById("main-content");
      if (!root) return;

      nodes = collectTargets(root);
      nodes.forEach((el, index) => {
        el.classList.add("scroll-reveal");
        el.style.setProperty("--reveal-delay", `${Math.min(index, 6) * 70}ms`);
      });

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-inview");
            observer?.unobserve(entry.target);
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );

      const viewport = window.innerHeight;
      nodes.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < viewport * 0.92 && rect.bottom > 40) {
          el.classList.add("is-inview");
          return;
        }
        observer?.observe(el);
      });
    }

    // Parent effects can run before streamed RSC segments hydrate. Mutating
    // those nodes first makes React see a class/style mismatch.
    const timer = window.setTimeout(() => {
      frame = window.requestAnimationFrame(apply);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      nodes.forEach((el) => {
        el.classList.remove("scroll-reveal", "is-inview");
        el.style.removeProperty("--reveal-delay");
      });
    };
  }, [pathname]);

  return null;
}
