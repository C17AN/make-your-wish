import { useEffect, useMemo, useRef } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

type WishPreviewModalProps = {
  isOpen: boolean;
  text: string;
  bgColor?: string;
  isGradient?: boolean;
  onClose: () => void;
};

export default function WishPreviewModal({
  isOpen,
  text,
  bgColor,
  isGradient,
  onClose,
}: WishPreviewModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const w = useMotionValue(1);
  const h = useMotionValue(1);

  // smooth motion
  const sx = useSpring(px, { stiffness: 200, damping: 30, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 200, damping: 30, mass: 0.6 });

  // rotate from pointer position (map to -8..8 deg)
  const rotateX = useTransform(sy, (val) => {
    const height = Math.max(1, h.get());
    const ratio = val / height; // 0..1
    return 8 - ratio * 16; // 8 -> -8
  });
  const rotateY = useTransform(sx, (val) => {
    const width = Math.max(1, w.get());
    const ratio = val / width; // 0..1
    return ratio * 16 - 8; // -8 -> 8
  });
  const cardTransform = useMotionTemplate`perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  useEffect(() => {
    if (!isOpen) return;
    const elLocal = containerRef.current;
    if (!elLocal) return;
    const rect = elLocal.getBoundingClientRect();
    w.set(rect.width);
    h.set(rect.height);
    // center pointer
    px.set(rect.width / 2);
    py.set(rect.height / 2);
    function onResize() {
      const refEl = containerRef.current;
      if (!refEl) return;
      const r = refEl.getBoundingClientRect();
      w.set(r.width);
      h.set(r.height);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isOpen, w, h, px, py]);

  function handlePointerMove(e: React.PointerEvent) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    px.set(x);
    py.set(y);
  }

  function handlePointerLeave() {
    // reset to center
    const width = Math.max(1, w.get());
    const height = Math.max(1, h.get());
    px.set(width / 2);
    py.set(height / 2);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const blocks = useMemo(() => {
    const raw = text || "";
    const parts = raw.split(/\n{2,}|\n|\s{2,}/g).filter(Boolean);
    return parts.length > 0 ? parts : [raw];
  }, [text]);

  const cardStyle = useMemo(() => {
    if (!bgColor) return undefined;
    if (isGradient) {
      return {
        background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}33 100%)`,
      };
    }
    return { background: bgColor };
  }, [bgColor, isGradient]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <motion.div
            className="preview-wrap"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <motion.div
              ref={containerRef}
              className="preview-card"
              style={{ transform: cardTransform, ...cardStyle }}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onPointerDown={(e) =>
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
              }
            >
              <div className="preview-card__inner">
                {blocks.map((b, i) => (
                  <motion.p
                    key={i}
                    className="preview-card__text"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.1 + i * 0.12,
                      duration: 0.28,
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                  >
                    {b}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
