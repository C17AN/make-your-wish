import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

type CardGridProps = {
  wishes: string[];
  columns: number;
  bgColors?: (string | undefined)[];
  gradients?: (boolean | undefined)[];
};

export default function CardGrid({
  wishes,
  columns,
  bgColors,
  gradients,
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

  return (
    <div
      className="grid"
      style={{ ["--columns" as any]: String(Math.max(1, columns)) }}
    >
      {columnBuckets.map((colIdxs, colIndex) => {
        const isUp = colIndex % 2 === 0;
        const speed = 20 + (colIndex % 3) * 6; // 20, 26, 32 px/s
        return (
          <VirtualColumn
            key={colIndex}
            itemIndexes={colIdxs}
            allWishes={wishes}
            allBgColors={bgColors}
            allGradients={gradients}
            isUp={isUp}
            speed={speed}
          />
        );
      })}
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
}: {
  itemIndexes: number[];
  allWishes: string[];
  allBgColors?: (string | undefined)[];
  allGradients?: (boolean | undefined)[];
  isUp: boolean;
  speed: number;
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
    const RO = (window as any).ResizeObserver as
      | (new (cb: () => void) => ResizeObserver)
      | undefined;
    let ro: ResizeObserver | undefined;
    if (RO && el) {
      ro = new RO(recompute as any);
      ro.observe(el);
    } else {
      window.addEventListener("resize", recompute);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", recompute);
    };
  }, [itemIndexes.length]);

  const virtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 130,
    overscan: 6,
  });

  const itemsToRender = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const posRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    let prev = performance.now();
    setTimeout(() => {
      try {
        el.scrollTop = 1;
        virtualizer.scrollToOffset(1);
      } catch {}
    }, 50);
    posRef.current = el.scrollTop || 0;
    const step = () => {
      const now = performance.now();
      const dt = (now - prev) / 1000;
      prev = now;
      const delta = speed * dt;
      const max = Math.max(0, virtualizer.getTotalSize() - el.clientHeight);
      if (max > 0) {
        posRef.current = isUp ? posRef.current + delta : posRef.current - delta;
        if (posRef.current >= max - 1) posRef.current = 0;
        if (posRef.current <= 0) posRef.current = max;
        el.scrollTop = posRef.current;
        virtualizer.scrollToOffset(posRef.current);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
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
            const style = color
              ? grad
                ? {
                    background: `linear-gradient(135deg, ${color} 0%, ${color}33 100%)`,
                  }
                : { background: color }
              : undefined;
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
                <article className="card" style={style}>
                  <p className="card__text">{text}</p>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
