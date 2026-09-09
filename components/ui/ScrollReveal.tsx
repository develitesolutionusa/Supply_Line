"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

function collectTargets(root: HTMLElement) {
  const seen = new Set<HTMLElement>();

  function add(els: Iterable<Element>) {
    for (const el of els) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.tagName === "SCRIPT" || el.tagName === "ASIDE" || el.hidden) continue;
      seen.add(el);
    }
  }

  const sections = root.querySelectorAll(":scope section");
  if (sections.length) {
    add(sections);
    return [...seen];
  }

  let node = root.firstElementChild;
  while (
    node instanceof HTMLElement &&
    node.children.length === 1 &&
    !node.matches("form, ul, ol, table")
  ) {
    node = node.firstElementChild;
  }

  if (node instanceof HTMLElement && node.children.length > 1) {
    add(node.children);
  } else if (node instanceof HTMLElement) {
    add([node]);
  }

  return [...seen];
}

export function ScrollReveal() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.getElementById("main-content");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const nodes = collectTargets(root);
    nodes.forEach((el, index) => {
      el.classList.add("scroll-reveal");
      el.style.setProperty("--reveal-delay", `${Math.min(index, 6) * 70}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-inview");
          observer.unobserve(entry.target);
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
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
      nodes.forEach((el) => {
        el.classList.remove("scroll-reveal", "is-inview");
        el.style.removeProperty("--reveal-delay");
      });
    };
  }, [pathname]);

  return null;
}
