import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "motion/react";

function pickTextColor(bg?: string): string | undefined {
  if (!bg) return undefined;
  // parse hex #rgb/#rrggbb
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
  // relative luminance
  const srgb = [r, g, b]
    .map((v) => v / 255)
    .map((v) =>
      v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
  const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return L > 0.5 ? "#111" : "#fff";
}

type CardGridProps = {
  wishes: string[];
  columns: number;
  bgColors?: (string | undefined)[];
  gradients?: (boolean | undefined)[];
  isLoading?: boolean;
  onSelect?: (payload: {
    text: string;
    bgColor?: string;
    isGradient?: boolean;
    itemIndex: number;
  }) => void;
};

export default function CardGrid({
  wishes,
  columns,
  bgColors,
  gradients,
  isLoading,
  onSelect,
}: CardGridProps) {
  const columnBuckets = useMemo(() => {
    const buckets: number[][] = Array.from(
      { length: Math.max(1, columns) },
      () => []
    );
    wishes.forEach((_, index) => {
      buckets[index % Math.max(1, columns)].push(index);
    });
    if (wishes.length === 0) buckets[0].push(-1);
    return buckets;
  }, [wishes, columns]);

  // 각 컬럼별 최초 페이드인 여부 추적
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  type GridStyle = CSSProperties & { "--columns"?: string };
  const gridStyle: GridStyle = useMemo(
    () => ({ "--columns": String(Math.max(1, columns)) }),
    [columns]
  );

  return (
    <div className="grid" style={gridStyle}>
      <AnimatePresence mode="sync" initial={false}>
        {isLoading
          ? Array.from({ length: Math.max(1, columns) }).map((_, colIndex) => (
              <motion.div
                className="grid__col"
                key={`skel-col-${colIndex}`}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="col-scroll">
                  <div style={{ position: "relative" }}>
                    {Array.from({ length: 10 }).map((__, r) => (
                      <div
                        key={`skel-${colIndex}-${r}`}
                        style={{ position: "relative", paddingBottom: 12 }}
                      >
                        <article className="card card--skeleton">
                          <div className="skeleton-lines">
                            <div className="skeleton-line" style={{ width: "80%" }} />
                            <div className="skeleton-line" style={{ width: "60%" }} />
                          </div>
                        </article>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          : columnBuckets.map((colIdxs, colIndex) => {
              const isUp = colIndex % 2 === 0;
              const speed = 18 + Math.random() * 10;
              const isRevealed = revealed[colIndex] === true;
              return (
                <motion.div
                  className="grid__col"
                  key={`col-wrap-${colIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 24,
                    delay: isRevealed ? 0 : colIndex * 0.02,
                  }}
                  onAnimationComplete={() => {
                    if (!isRevealed)
                      setRevealed((prev) => ({ ...prev, [colIndex]: true }));
                  }}
                >
                  <VirtualColumn
                    itemIndexes={colIdxs}
                    allWishes={wishes}
                    allBgColors={bgColors}
                    allGradients={gradients}
                    isUp={isUp}
                    speed={speed}
                    onSelect={onSelect}
                  />
                </motion.div>
              );
            })}
      </AnimatePresence>
    </div>
  );
}

function VirtualColumn({
  itemIndexes,
  allWishes,
  allBgColors,
  allGradients,
  isUp,
  speed,
  onSelect,
}: {
  itemIndexes: number[];
  allWishes: string[];
  allBgColors?: (string | undefined)[];
  allGradients?: (boolean | undefined)[];
  isUp: boolean;
  speed: number;
  onSelect?: (payload: {
    text: string;
    bgColor?: string;
    isGradient?: boolean;
    itemIndex: number;
  }) => void;
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

  // 사용자 스크롤 차단
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };
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
      // 초기 위치를 방향에 맞춰 설정 (max 계산 전에는 1로 세팅)
      try {
        el.scrollTop = 1;
        virtualizer.scrollToOffset(1);
      } catch {
        // noop
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
          // 방향 초기화: 아래로 이동하는 열은 하단 근처에서 시작
          if (!isInitializedRef.current) {
            posRef.current = isUp ? 1 : Math.max(1, max - 1);
            el.scrollTop = posRef.current;
            try {
              virtualizer.scrollToOffset(posRef.current);
            } catch {
              // noop
            }
            isInitializedRef.current = true;
          } else {
            posRef.current = isUp
              ? posRef.current + delta
              : posRef.current - delta;
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

    // 폰트 로딩과 무관하게 즉시 시작하여 열별 지연을 최소화
    start();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        try {
          virtualizer.scrollToOffset(posRef.current);
        } catch {
          // noop
        }
      });
    }

    return () => cancelAnimationFrame(raf);
  }, [isUp, speed, virtualizer]);

  return (
    <div className="grid__col">
      <div className="col-scroll" ref={scrollRef}>
        <div style={{ height: totalSize, position: "relative" }}>
          {itemsToRender.map((vi) => {
            const baseIndex =
              itemIndexes.length > 0
                ? itemIndexes[vi.index % itemIndexes.length]
                : -1;
            const text =
              baseIndex >= 0 ? allWishes[baseIndex] : "첫 소원을 남겨보세요!";
            const color = baseIndex >= 0 ? allBgColors?.[baseIndex] : undefined;
            const grad = baseIndex >= 0 ? allGradients?.[baseIndex] : undefined;
            const style: CSSProperties | undefined = color
              ? grad
                ? {
                    background: `linear-gradient(135deg, ${color} 0%, ${color}33 100%)`,
                  }
                : { background: color }
              : undefined;
            const textColor = pickTextColor(color);
            return (
              <div
                key={vi.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${vi.start}px)`,
                  paddingBottom: 12,
                }}
              >
                <article
                  className="card"
                  style={style}
                  onClick={() =>
                    onSelect?.({
                      text,
                      bgColor: color,
                      isGradient: grad,
                      itemIndex: baseIndex,
                    })
                  }
                >
                  <p className="card__text" style={{ color: textColor }}>
                    {text}
                  </p>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
