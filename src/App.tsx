import { useEffect, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import CardGrid from "./components/CardGrid";
import WishModal from "./components/WishModal";
import WishPreviewModal from "./components/WishPreviewModal";
import { supabase, type WishDto } from "./lib/supabaseClient";

function App() {
  const [wishes, setWishes] = useState<string[]>([]);
  const [bgColors, setBgColors] = useState<(string | undefined)[]>([]);
  const [gradients, setGradients] = useState<(boolean | undefined)[]>([]);
  const [signatures, setSignatures] = useState<(string | undefined)[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [columns, setColumns] = useState(4);

  const [preview, setPreview] = useState<{
    text: string;
    bgColor?: string;
    isGradient?: boolean;
    signatureDataUrl?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "dark") return true;
      if (saved === "light") return false;
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return true;
      }
    }
    return false;
  });
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    }
  }, [isDark]);

  // 초기 fetch
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("wishes")
        .select("text, bg_color, is_gradient, signature_data_url, created_at")
        .order("created_at", { ascending: false })
        .limit(120);
      if (!error && data) {
        const list = data as WishDto[];
        const loadedTexts = list.map((d) => d.text);
        const loadedColors = list.map((d) => d.bg_color ?? undefined);
        const loadedGradients = list.map(
          (d) => (d.is_gradient ?? undefined) as boolean | undefined
        );
        const loadedSignatures = list.map(
          (d) => d.signature_data_url ?? undefined
        );
        setWishes((prev) => [...loadedTexts, ...prev]);
        setBgColors((prev) => [...loadedColors, ...prev]);
        setGradients((prev) => [...loadedGradients, ...prev]);
        setSignatures((prev) => [...loadedSignatures, ...prev]);
      }
      setIsLoading(false);
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
    signatureDataUrl?: string;
  }) {
    const { text, bgColor, isGradient, signatureDataUrl } = input;
    setWishes((prev) => [text, ...prev]);
    setBgColors((prev) => [bgColor, ...prev]);
    setGradients((prev) => [isGradient, ...prev]);
    setSignatures((prev) => [signatureDataUrl, ...prev]);
    supabase
      .from("wishes")
      .insert({
        text,
        bg_color: bgColor ?? null,
        is_gradient: isGradient ?? null,
        signature_data_url: signatureDataUrl ?? null,
      })
      .then(() => {});
  }

  return (
    <div className="page">
      <Header
        onClickAdd={() => setIsModalOpen(true)}
        onToggleTheme={() => setIsDark((v) => !v)}
        isDark={isDark}
      />
      <main className="main">
        <CardGrid
          wishes={wishes}
          columns={columns}
          bgColors={bgColors}
          gradients={gradients}
          isLoading={isLoading}
          onSelect={(p) =>
            setPreview({
              text: p.text,
              bgColor: bgColors[p.itemIndex],
              isGradient: gradients[p.itemIndex],
              signatureDataUrl: signatures[p.itemIndex],
            })
          }
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
        signatureDataUrl={preview?.signatureDataUrl}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}

export default App;
