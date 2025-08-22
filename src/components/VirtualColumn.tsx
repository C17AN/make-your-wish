import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion } from "motion/react";
import clsx from "clsx";
import styles from "./CardGrid.module.css";
import LikeButton from "./LikeButton";

function pickTextColor(bg?: string): string | undefined {
  if (!bg) return undefined;
  const hex = bg.replace("#", "");
  const n =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex.padEnd(6, "0").slice(0, 6);
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const srgb = [r, g, b]
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return L > 0.5 ? "#111" : "#fff";
}

export default function VirtualColumn({
  itemIndexes,
  allWishes,
  allBgColors,
  allGradients,
  allLikes,
  isUp,
  speed,
  onSelect,
  onLike,
}: {
  itemIndexes: number[];
  allWishes: string[];
  allBgColors?: (string | undefined)[];
  allGradients?: (boolean | undefined)[];
  allLikes?: (number | undefined)[];
  isUp: boolean;
  speed: number;
  onSelect?: (payload: {
    text: string;
    bgColor?: string;
    isGradient?: boolean;
    itemIndex: number;
  }) => void;
  onLike?: (itemIndex: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [totalCount, setTotalCount] = useState(1200);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const recompute = () => {
      const REPEAT_FACTOR = 300;
      const MIN_COUNT = 800;
      const MAX_COUNT = 2400;
      const next = REPEAT_FACTOR * Math.max(1, itemIndexes.length);
      setTotalCount(Math.min(MAX_COUNT, Math.max(MIN_COUNT, next)));
    };
    recompute();
    const RO: typeof ResizeObserver | undefined =
      typeof ResizeObserver !== "undefined" ? ResizeObserver : undefined;
    let ro: ResizeObserver | undefined;
    if (RO && el) {
      ro = new RO(() => recompute());
      ro.observe(el);
    } else {
      window.addEventListener("resize", recompute);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", recompute);
    };
  }, [itemIndexes.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => e.preventDefault();
    const onTouchMove = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  const virtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 130,
    overscan: 6,
  });

  const itemsToRender = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const posRef = useRef(0);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    let prev = performance.now();

    const start = () => {
      try {
        el.scrollTop = 1;
        virtualizer.scrollToOffset(1);
      } catch {
        /* ignore */
      }
      isInitializedRef.current = false;
      posRef.current = el.scrollTop || 1;
      const step = () => {
        const now = performance.now();
        const dt = (now - prev) / 1000;
        prev = now;
        const delta = speed * dt;
        const max = Math.max(0, virtualizer.getTotalSize() - el.clientHeight);
        if (max > 0) {
          if (!isInitializedRef.current) {
            posRef.current = isUp ? 1 : Math.max(1, max - 1);
            el.scrollTop = posRef.current;
            try {
              virtualizer.scrollToOffset(posRef.current);
            } catch {
              /* ignore */
            }
            isInitializedRef.current = true;
          } else {
            posRef.current = isUp ? posRef.current + delta : posRef.current - delta;
            if (isUp) {
              if (posRef.current >= max - 0.5) posRef.current = 1;
            } else {
              if (posRef.current <= 1) posRef.current = Math.max(1, max - 1);
            }
            el.scrollTop = posRef.current;
            virtualizer.scrollToOffset(posRef.current);
          }
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    start();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        try {
          virtualizer.scrollToOffset(posRef.current);
        } catch {
          /* ignore */
        }
      });
    }

    return () => cancelAnimationFrame(raf);
  }, [isUp, speed, virtualizer]);

  return (
    <div className="col-scroll" ref={scrollRef}>
      <div style={{ height: totalSize, position: "relative" }}>
        {itemsToRender.map((vi) => {
          const baseIndex =
            itemIndexes.length > 0 ? itemIndexes[vi.index % itemIndexes.length] : -1;
          const text = baseIndex >= 0 ? allWishes[baseIndex] : "첫 소원을 남겨보세요!";
          const color = baseIndex >= 0 ? allBgColors?.[baseIndex] : undefined;
          const grad = baseIndex >= 0 ? allGradients?.[baseIndex] : undefined;
          const likeCount = baseIndex >= 0 ? allLikes?.[baseIndex] ?? 0 : 0;
          const bgStyle: CSSProperties | undefined = color
            ? grad
              ? ({
                  "--card-bg": `linear-gradient(135deg, ${color} 0%, ${color}33 100%)`,
                } as CSSProperties)
              : ({ "--card-bg": color } as CSSProperties)
            : undefined;
          const textColor = pickTextColor(color);
          return (
            <div
              key={vi.key}
              className={styles.absItem}
              style={{ transform: `translateY(${vi.start}px)` }}
            >
              <div className={styles.cardOuter}>
                <motion.article
                  className={clsx("card", styles.cardEnhanced)}
                  style={bgStyle}
                  onClick={() =>
                    onSelect?.({ text, bgColor: color, isGradient: grad, itemIndex: baseIndex })
                  }
                >
                  <p
                    className={clsx(
                      "card__text",
                      textColor === "#fff" ? styles.cardTextLightShadow : styles.cardTextDarkShadow
                    )}
                    style={{ color: textColor }}
                  >
                    {text}
                  </p>
                  {baseIndex >= 0 ? (
                    <LikeButton
                      color={textColor}
                      count={likeCount}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLike?.(baseIndex);
                      }}
                    />
                  ) : null}
                </motion.article>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
