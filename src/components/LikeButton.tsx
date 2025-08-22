import { useState, type CSSProperties, type JSX, type MouseEvent as ReactMouseEvent } from "react";
import { motion, useAnimationControls } from "motion/react";
import styles from "./LikeButton.module.css";

export default function LikeButton({
  color,
  count,
  onClick,
}: {
  color?: string;
  count: number;
  onClick: (e: ReactMouseEvent<HTMLButtonElement>) => void;
}): JSX.Element {
  const controls = useAnimationControls();
  type ConfettiPiece = { id: number; x: number; y: number; color: string; rotate: number };
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  function spawnConfetti() {
    const colors = ["#FFC700", "#FF85C0", "#7BDCB5", "#6B8BFF", "#FFD166"];
    const n = 12;
    const items: ConfettiPiece[] = Array.from({ length: n }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 24 + Math.random() * 32;
      return {
        id: Date.now() + i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        color: colors[i % colors.length],
        rotate: Math.random() * 360,
      };
    });
    setPieces(items);
    window.setTimeout(() => setPieces([]), 700);
  }
  async function handleClick(e: ReactMouseEvent<HTMLButtonElement>) {
    onClick(e);
    controls.start({ scale: [1, 1.25, 1], transition: { duration: 0.35, ease: "easeOut" } });
    spawnConfetti();
  }
  return (
    <button
      type="button"
      aria-label="like"
      onClick={handleClick}
      className={styles.likeButton}
      style={{ color: color, overflow: "visible" }}
    >
      <div aria-hidden className={styles.confettiLayer}>
        {pieces.map((p) => (
          <motion.span
            key={p.id}
            className={styles.confettiPiece}
            style={{ "--piece-color": p.color } as CSSProperties & { "--piece-color"?: string }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.9, rotate: 0 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: 1, rotate: p.rotate }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </div>
      <motion.span aria-hidden initial={{ scale: 1 }} animate={controls}>
        💖
      </motion.span>
      <span>{count}</span>
    </button>
  );
}
