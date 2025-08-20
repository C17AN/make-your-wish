import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";

type WishModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (wish: {
    text: string;
    bgColor?: string;
    isGradient?: boolean;
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // 약간의 지연 후 포커스 (모달 렌더 후)
      setTimeout(() => textareaRef.current?.focus(), 0);
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = wishText.trim();
    if (!text) return;
    onSubmit({ text, bgColor, isGradient });
    setWishText("");
    setBgColor("#6b8bff");
    setIsGradient(false);
    onClose();
  }

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
          >
            <h2 className="modal__title">소원 남기기</h2>
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
                onChange={(e) => setWishText(e.target.value)}
              />
              <div className="field-row">
                <label htmlFor="wish-color">카드 배경색</label>
                <input
                  id="wish-color"
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={{ width: 48, height: 32, padding: 0, borderRadius: 6 }}
                />
              </div>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={isGradient}
                  onChange={(e) => setIsGradient(e.target.checked)}
                />
                배경 그라데이션 적용
              </label>
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
