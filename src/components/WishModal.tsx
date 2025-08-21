import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChromePicker } from "react-color";
import { pickTextColor } from "../lib/utils/colorUtils";

type WishModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (wish: {
    text: string;
    bgColor?: string;
    isGradient?: boolean;
    signatureDataUrl?: string;
  }) => void;
};

export default function WishModal({
  isOpen,
  onClose,
  onSubmit,
}: WishModalProps) {
  const [wishText, setWishText] = useState("");
  const [bgColor, setBgColor] = useState<string>("#6b8bff");
  const [isGradient, setIsGradient] = useState<boolean>(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // color picker anchor
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // signature canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 0);
      requestAnimationFrame(() => resizeCanvas());
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, [isOpen]);

  // 모달 닫히면 피커도 닫기
  useEffect(() => {
    if (!isOpen) setIsPickerOpen(false);
  }, [isOpen]);

  // 컬러 피커 외부 클릭 시 닫기
  useEffect(() => {
    if (!isPickerOpen) return;
    const onPointerDown: EventListener = (e) => {
      const pickerEl = pickerRef.current;
      const target = e.target as Node | null;
      if (pickerEl && target && !pickerEl.contains(target)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [isPickerOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  function resizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(160 * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `160px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#fff";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function getCanvasPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPosRef.current = getCanvasPos(e);
  }
  function onCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const p = getCanvasPos(e);
    const last = lastPosRef.current || p;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPosRef.current = p;
  }
  function onCanvasPointerUp() {
    drawingRef.current = false;
    lastPosRef.current = null;
  }
  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = wishText.trim();
    if (!text) return;
    const signatureDataUrl = canvasRef.current?.toDataURL("image/png");
    onSubmit({ text, bgColor, isGradient, signatureDataUrl });
    setWishText("");
    setBgColor("#6b8bff");
    setIsGradient(false);
    clearSignature();
    onClose();
  }

  const modalBgStyle = isGradient
    ? bgColor
      ? {
          background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}33 100%)`,
        }
      : undefined
    : bgColor
    ? { background: bgColor }
    : undefined;

  const MAX = 50;
  const onChangeText = (val: string) => {
    const clipped = val.slice(0, MAX);
    setWishText(clipped);
  };

  const palette = [
    "#6b8bff",
    "#FF6900",
    "#FCB900",
    "#7BDCB5",
    "#00D084",
  ] as const;

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
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 38,
              mass: 0.8,
            }}
            style={modalBgStyle}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h2
                className="modal__title"
                style={{ margin: 0, color: pickTextColor(bgColor) }}
              >
                소원 남기기
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {palette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`select-color-${c}`}
                    onClick={() => setBgColor(c)}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      border: "1px solid rgba(0,0,0,0.15)",
                      background: c,
                      boxShadow:
                        c === bgColor
                          ? "0 0 0 2px rgba(0,0,0,0.2) inset"
                          : undefined,
                    }}
                  />
                ))}
                <button
                  type="button"
                  aria-label="custom-color"
                  onClick={() => setIsPickerOpen((v) => !v)}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    border: "1px dashed rgba(0,0,0,0.3)",
                    background: "transparent",
                  }}
                />
                {isPickerOpen && (
                  <div
                    ref={pickerRef}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 54,
                      zIndex: 101,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChromePicker
                      color={bgColor}
                      disableAlpha
                      onChange={(c) => setBgColor(c.hex)}
                      onChangeComplete={(c) => setBgColor(c.hex)}
                    />
                  </div>
                )}
              </div>
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, textAlign: "right" }}>
              {wishText.length}/{MAX}
            </div>
            <form onSubmit={handleSubmit} className="modal__form">
              <label className="visually-hidden" htmlFor="wish-textarea">
                소원 내용
              </label>
              <textarea
                id="wish-textarea"
                ref={textareaRef}
                className="textarea"
                placeholder="소원을 적어주세요..."
                rows={5}
                value={wishText}
                onChange={(e) => onChangeText(e.target.value)}
                maxLength={MAX}
              />
              <label
                className="checkbox"
                style={{ color: pickTextColor(bgColor), marginTop: 8 }}
              >
                <input
                  type="checkbox"
                  checked={isGradient}
                  onChange={(e) => setIsGradient(e.target.checked)}
                />
                배경 그라데이션 적용
              </label>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                    marginTop: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      opacity: 0.8,
                      color: pickTextColor(bgColor),
                    }}
                  >
                    간단한 서명 (선택)
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 6,
                    }}
                  >
                    <button
                      type="button"
                      className="button"
                      onClick={clearSignature}
                    >
                      서명 지우기
                    </button>
                  </div>
                </div>
                <div className="signature-box">
                  <canvas
                    ref={canvasRef}
                    className="signature-canvas"
                    onPointerDown={onCanvasPointerDown}
                    onPointerMove={onCanvasPointerMove}
                    onPointerUp={onCanvasPointerUp}
                    onPointerLeave={onCanvasPointerUp}
                  />
                </div>
              </div>

              <div className="modal__actions">
                <button type="button" className="button" onClick={onClose}>
                  취소
                </button>
                <button type="submit" className="button button--primary">
                  남기기
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
