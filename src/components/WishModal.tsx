import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { pickTextColor } from "../lib/utils/colorUtils";

// 의미 있는 텍스트 판별: 초성/모음만으로 이루어진 입력은 거부
function isMeaningfulInput(raw: string): boolean {
  const text = raw.trim();
  if (text.length === 0) return false;
  if (/[A-Za-z0-9]/.test(text)) return true; // 영문/숫자는 허용
  const cleaned = text.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣A-Za-z0-9]/g, "");
  if (cleaned.length === 0) return false;
  const onlyJamo = /^[ㄱ-ㅎㅏ-ㅣ]+$/.test(cleaned);
  if (onlyJamo) return false;
  const syllableMatches = text.match(/[가-힣]/g) || [];
  if (syllableMatches.length >= 1) {
    // 한글 음절이 1개 이상 포함되어 있으면 의미 있는 입력으로 간주
    return true;
  }
  return false;
}

function randomHexColor(): string {
  const n = Math.floor(Math.random() * 0xffffff);
  return `#${n.toString(16).padStart(6, "0")}`;
}

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

export default function WishModal({ isOpen, onClose, onSubmit }: WishModalProps) {
  const [wishText, setWishText] = useState("");
  const [bgColor, setBgColor] = useState<string>(() => randomHexColor());
  const [isGradient, setIsGradient] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // no picker; random color button only

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

  // 모달이 열릴 때 에러 메시지 초기화
  useEffect(() => {
    if (isOpen) {
      setErrorText(null);
      setBgColor(randomHexColor()); // 기본 색상 무작위
    }
  }, [isOpen]);

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
    if (!isMeaningfulInput(text)) {
      setErrorText("의미 있는 단어를 입력해 주세요. (초성만 입력은 불가)");
      textareaRef.current?.focus();
      return;
    }
    const signatureDataUrl = canvasRef.current?.toDataURL("image/png");
    onSubmit({ text, bgColor, isGradient, signatureDataUrl });
    setWishText("");
    setBgColor(randomHexColor());
    setIsGradient(false);
    clearSignature();
    setErrorText(null);
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
    if (errorText) {
      const t = clipped.trim();
      if (isMeaningfulInput(t)) setErrorText(null);
    }
  };

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
              <h2 className="modal__title" style={{ margin: 0, color: pickTextColor(bgColor) }}>
                소원 남기기
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  aria-label="random-color"
                  onClick={() => setBgColor(randomHexColor())}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    border: "1px dashed rgba(0,0,0,0.3)",
                    background: "transparent",
                  }}
                  title="무작위 색상"
                />
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
                aria-invalid={!!errorText}
                aria-describedby={errorText ? "wish-textarea-error" : undefined}
                style={errorText ? { outline: "none", borderColor: "#ff5a5a" } : undefined}
              />
              {errorText ? (
                <div
                  id="wish-textarea-error"
                  style={{ color: "#ff5a5a", fontSize: 12, marginTop: 6 }}
                  role="alert"
                >
                  {errorText}
                </div>
              ) : null}
              <label className="checkbox" style={{ color: pickTextColor(bgColor), marginTop: 8 }}>
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
                    <button type="button" className="button" onClick={clearSignature}>
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
                <button type="button" className="button button--danger" onClick={onClose}>
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
