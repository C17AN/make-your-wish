import { useEffect, useMemo, useRef } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { pickTextColor } from "../lib/utils/colorUtils";

type WishPreviewModalProps = {
  isOpen: boolean;
  text: string;
  bgColor?: string;
  isGradient?: boolean;
  onClose: () => void;
  signatureDataUrl?: string;
};

export default function WishPreviewModal({
  isOpen,
  text,
  bgColor,
  isGradient,
  onClose,
  signatureDataUrl,
}: WishPreviewModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const accumXRef = useRef(0);
  const accumYRef = useRef(0);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  // smooth motion
  const sx = useSpring(dragX, { stiffness: 200, damping: 30, mass: 0.6 });
  const sy = useSpring(dragY, { stiffness: 200, damping: 30, mass: 0.6 });

  // rotate from pointer position (map to -8..8 deg)
  const rotateX = useTransform(sy, (val) => {
    const clamped = Math.max(-40, Math.min(40, val));
    return (-clamped / 40) * 8; // drag up -> tilt up
  });
  const rotateY = useTransform(sx, (val) => {
    const clamped = Math.max(-40, Math.min(40, val));
    return (clamped / 40) * 8; // drag right -> tilt right
  });
  const cardTransform = useMotionTemplate`perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  // 드래그 종료/모달 닫힘 시 원위치
  useEffect(() => {
    if (!isOpen) {
      dragX.set(0);
      dragY.set(0);
      isDraggingRef.current = false;
    }
  }, [isOpen, dragX, dragY]);

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDraggingRef.current) return;
    // 드래그 방향/크기에 비례해 회전 (client 좌표 기준 누적)
    const dx = e.clientX - lastXRef.current;
    const dy = e.clientY - lastYRef.current;
    lastXRef.current = e.clientX;
    lastYRef.current = e.clientY;
    accumXRef.current += dx;
    accumYRef.current += dy;
    dragX.set(accumXRef.current);
    dragY.set(accumYRef.current);
  }

  function handlePointerLeave() {
    isDraggingRef.current = false;
    accumXRef.current = 0;
    accumYRef.current = 0;
    dragX.set(0);
    dragY.set(0);
  }
  function handlePointerUp() {
    isDraggingRef.current = false;
    lastXRef.current = 0;
    lastYRef.current = 0;
    accumXRef.current = 0;
    accumYRef.current = 0;
    dragX.set(0);
    dragY.set(0);
  }
  function handlePointerCancel() {
    isDraggingRef.current = false;
    lastXRef.current = 0;
    lastYRef.current = 0;
    accumXRef.current = 0;
    accumYRef.current = 0;
    dragX.set(0);
    dragY.set(0);
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
    const base: React.CSSProperties = {
      transform: cardTransform as unknown as string,
      backdropFilter: `blur(6px)`,
      WebkitBackdropFilter: `blur(6px)`,
      color: pickTextColor(bgColor),
    };
    if (!bgColor) return base;
    if (isGradient) {
      return {
        ...base,
        background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}33 100%)`,
      };
    }
    return { ...base, background: bgColor };
  }, [bgColor, isGradient, cardTransform]);

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
          style={{ position: "fixed", inset: 0 }}
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
              style={cardStyle}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                isDraggingRef.current = true;
                lastXRef.current = e.clientX;
                lastYRef.current = e.clientY;
              }}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
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
                {signatureDataUrl ? (
                  <motion.img
                    src={signatureDataUrl}
                    alt="signature"
                    style={{
                      width: "auto",
                      maxWidth: "60%",
                      height: 56,
                      opacity: 0.9,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.12 + blocks.length * 0.12 }}
                  />
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
