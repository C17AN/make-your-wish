import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import CardGrid from "./components/CardGrid";
import WishModal from "./components/WishModal";
import WishPreviewModal from "./components/WishPreviewModal";
import { supabase, type WishDto } from "./lib/supabaseClient";

function App() {
  const initialWishes = useMemo(
    () => [
      "가족 모두 건강하기",
      "취업 성공!",
      "올해는 여행을 많이 가고 싶어요",
      "코딩 실력 레벨업",
      "좋은 사람들과 오래오래",
      "마라톤 완주",
      "마음의 평화",
      "하루 한 가지 좋은 일 하기",
      "새로운 취미 찾기",
      "책 12권 읽기",
      "부지런한 아침형 인간 되기",
      "덕담: 당신의 내일이 더 반짝이길",
      "덕담: 충분히 잘하고 있어요",
      "덕담: 오늘도 수고했어요",
      "소소한 행복 놓치지 않기",
      "맛있는 거 많이 먹기",
    ],
    []
  );

  const [wishes, setWishes] = useState<string[]>(initialWishes);
  const [bgColors, setBgColors] = useState<(string | undefined)[]>(
    initialWishes.map(() => undefined)
  );
  const [gradients, setGradients] = useState<(boolean | undefined)[]>(
    initialWishes.map(() => undefined)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [columns, setColumns] = useState(4);

  const [preview, setPreview] = useState<{
    text: string;
    bgColor?: string;
    isGradient?: boolean;
  } | null>(null);

  // 초기 fetch
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("wishes")
        .select("text, bg_color, is_gradient, created_at")
        .order("created_at", { ascending: false })
        .limit(120);
      if (!error && data) {
        const list = data as WishDto[];
        const loadedTexts = list.map((d) => d.text);
        const loadedColors = list.map((d) => d.bg_color ?? undefined);
        const loadedGradients = list.map(
          (d) => (d.is_gradient ?? undefined) as boolean | undefined
        );
        setWishes((prev) => [...loadedTexts, ...prev]);
        setBgColors((prev) => [...loadedColors, ...prev]);
        setGradients((prev) => [...loadedGradients, ...prev]);
      }
    })();
  }, []);

  useEffect(() => {
    function computeColumns() {
      const width = window.innerWidth;
      if (width < 520) return 2;
      if (width < 900) return 3;
      if (width < 1280) return 4;
      return 5;
    }
    function onResize() {
      setColumns(computeColumns());
    }
    setColumns(computeColumns());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handleAddWish(input: {
    text: string;
    bgColor?: string;
    isGradient?: boolean;
  }) {
    const { text, bgColor, isGradient } = input;
    setWishes((prev) => [text, ...prev]);
    setBgColors((prev) => [bgColor, ...prev]);
    setGradients((prev) => [isGradient, ...prev]);
    // 비동기 저장 (실패해도 UI는 낙관적 업데이트)
    supabase
      .from("wishes")
      .insert({
        text,
        bg_color: bgColor ?? null,
        is_gradient: isGradient ?? null,
      })
      .then(() => {});
  }

  return (
    <div className="page">
      <Header onClickAdd={() => setIsModalOpen(true)} />
      <main className="main">
        <CardGrid
          wishes={wishes}
          columns={columns}
          bgColors={bgColors}
          gradients={gradients}
          onSelect={(p) => setPreview(p)}
        />
      </main>
      <WishModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddWish}
      />
      <WishPreviewModal
        isOpen={!!preview}
        text={preview?.text ?? ""}
        bgColor={preview?.bgColor}
        isGradient={preview?.isGradient}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}

export default App;
