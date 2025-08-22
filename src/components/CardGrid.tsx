import { useMemo, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import styles from "./CardGrid.module.css";
import VirtualColumn from "./VirtualColumn";

type CardGridProps = {
  wishes: string[];
  columns: number;
  bgColors?: (string | undefined)[];
  gradients?: (boolean | undefined)[];
  likes?: (number | undefined)[];
  isLoading?: boolean;
  onSelect?: (payload: {
    text: string;
    bgColor?: string;
    isGradient?: boolean;
    itemIndex: number;
  }) => void;
  onLike?: (itemIndex: number) => void;
};

export default function CardGrid({
  wishes,
  columns,
  bgColors,
  gradients,
  likes,
  isLoading,
  onSelect,
  onLike,
}: CardGridProps) {
  const columnBuckets = useMemo(() => {
    const buckets: number[][] = Array.from({ length: Math.max(1, columns) }, () => []);
    wishes.forEach((_, index) => {
      buckets[index % Math.max(1, columns)].push(index);
    });
    if (wishes.length === 0) buckets[0].push(-1);
    return buckets;
  }, [wishes, columns]);

  type GridStyle = CSSProperties & { "--columns"?: string };
  const gridStyle: GridStyle = { "--columns": String(Math.max(1, columns)) };

  // 모달 오픈 등 리렌더 시에도 열 속도가 바뀌지 않도록 결정적으로 고정
  const columnSpeeds = useMemo(() => {
    const count = Math.max(1, columns);
    return Array.from({ length: count }, (_, i) => 20 + (i % 3) * 8);
  }, [columns]);

  return (
    <div className="grid" style={gridStyle}>
      {Array.from({ length: Math.max(1, columns) }).map((_, colIndex) => {
        const colIdxs = columnBuckets[colIndex] || [];
        const isUp = colIndex % 2 === 0;
        const speed = columnSpeeds[colIndex] ?? 24;
        return (
          <div className={clsx("grid__col", styles.colRelative)} key={`col-${colIndex}`}>
            <AnimatePresence mode="sync" initial={false}>
              {isLoading ? (
                <motion.div
                  key="skel"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <div className="col-scroll">
                    <div className={styles.colRelative}>
                      {Array.from({ length: 10 }).map((__, r) => (
                        <div
                          key={`skel-${colIndex}-${r}`}
                          className={clsx(styles.colRelative)}
                          style={{ paddingBottom: 12 }}
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
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <VirtualColumn
                    itemIndexes={colIdxs}
                    allWishes={wishes}
                    allBgColors={bgColors}
                    allGradients={gradients}
                    allLikes={likes}
                    isUp={isUp}
                    speed={speed}
                    onSelect={onSelect}
                    onLike={onLike}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
