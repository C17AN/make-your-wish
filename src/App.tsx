import { useEffect, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import CardGrid from "./components/CardGrid";
import WishModal from "./components/WishModal";
import WishPreviewModal from "./components/WishPreviewModal";
import { supabase, type WishDto } from "./lib/supabaseClient";
import { Toaster, toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

function shuffleList<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function App() {
  const [wishes, setWishes] = useState<string[]>([]);
  const [bgColors, setBgColors] = useState<(string | undefined)[]>([]);
  const [gradients, setGradients] = useState<(boolean | undefined)[]>([]);
  const [signatures, setSignatures] = useState<(string | undefined)[]>([]);
  const [wishIds, setWishIds] = useState<string[]>([]);
  const [likes, setLikes] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [columns, setColumns] = useState(4);
  const inFlightLikesRef = useState<Set<string>>(() => new Set<string>())[0];

  const [preview, setPreview] = useState<{
    text: string;
    bgColor?: string;
    isGradient?: boolean;
    signatureDataUrl?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 테마 고정: 다크(검정 배경)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", "dark");
  }, []);

  // 초기 fetch
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("wishes")
        .select("id, text, bg_color, is_gradient, signature_data_url, created_at, likes")
        .order("created_at", { ascending: false })
        .limit(120);
      if (!error && data) {
        const list = data as WishDto[];
        const shuffled = shuffleList(list);
        const loadedIds = shuffled.map((d) => String(d.id ?? ""));
        const loadedTexts = shuffled.map((d) => d.text);
        const loadedColors = shuffled.map((d) => d.bg_color ?? undefined);
        const loadedGradients = shuffled.map(
          (d) => (d.is_gradient ?? undefined) as boolean | undefined
        );
        const loadedSignatures = shuffled.map((d) => d.signature_data_url ?? undefined);
        const loadedLikes = shuffled.map((d) => (d.likes ?? 0) as number);
        setWishIds((prev) => [...loadedIds, ...prev]);
        setWishes((prev) => [...loadedTexts, ...prev]);
        setBgColors((prev) => [...loadedColors, ...prev]);
        setGradients((prev) => [...loadedGradients, ...prev]);
        setSignatures((prev) => [...loadedSignatures, ...prev]);
        setLikes((prev) => [...loadedLikes, ...prev]);
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

  async function handleAddWish(input: {
    text: string;
    bgColor?: string;
    isGradient?: boolean;
    signatureDataUrl?: string;
  }) {
    const { text, bgColor, isGradient, signatureDataUrl } = input;
    const { data, error } = await supabase
      .from("wishes")
      .insert({
        text,
        bg_color: bgColor ?? null,
        is_gradient: isGradient ?? null,
        signature_data_url: signatureDataUrl ?? null,
        likes: 0,
      })
      .select("id")
      .single();
    if (error || !data?.id) {
      toast.error("소원 등록 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const newId = String(data.id);
    setWishes((prev) => [text, ...prev]);
    setBgColors((prev) => [bgColor, ...prev]);
    setGradients((prev) => [isGradient, ...prev]);
    setSignatures((prev) => [signatureDataUrl, ...prev]);
    setLikes((prev) => [0, ...prev]);
    setWishIds((prev) => [newId, ...prev]);
    toast.success("소원이 등록되었어요!", {
      icon: <CheckCircle2 size={18} color="#16a34a" strokeWidth={2.5} />,
      style: { fontWeight: 600 },
    });
  }

  function getLikedSet(): Set<string> {
    try {
      const raw = localStorage.getItem("likedWishIds");
      if (!raw) return new Set<string>();
      const arr = JSON.parse(raw) as Array<string | number>;
      const asStrings = arr.map((v) => String(v));
      return new Set<string>(asStrings);
    } catch {
      return new Set<string>();
    }
  }
  function saveLikedSet(setData: Set<string>) {
    try {
      localStorage.setItem("likedWishIds", JSON.stringify(Array.from(setData)));
    } catch {
      // noop
    }
  }

  async function handleLike(itemIndex: number) {
    const wishId = wishIds[itemIndex];
    if (!wishId) {
      toast.info("잠시 후 다시 시도해 주세요.");
      return;
    }
    const liked = getLikedSet();
    if (liked.has(wishId)) {
      toast.info("이미 좋아요한 카드예요.");
      return;
    }
    if (inFlightLikesRef.has(wishId)) {
      toast.info("처리 중이에요...");
      return;
    }
    // optimistic update
    setLikes((prev) => {
      const next = [...prev];
      next[itemIndex] = (next[itemIndex] ?? 0) + 1;
      return next;
    });
    inFlightLikesRef.add(wishId);
    // atomic increment via RPC
    const { error } = await supabase.rpc("increment_wish_likes", { p_wish_id: wishId });
    inFlightLikesRef.delete(wishId);
    if (error) {
      // rollback
      setLikes((prev) => {
        const next = [...prev];
        next[itemIndex] = Math.max(0, (next[itemIndex] ?? 1) - 1);
        return next;
      });
      toast.error("좋아요 처리에 실패했어요. 다시 시도해 주세요.");
      return;
    }
    liked.add(wishId);
    saveLikedSet(liked);
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
          likes={likes}
          isLoading={isLoading}
          onSelect={(p) =>
            setPreview({
              text: p.text,
              bgColor: bgColors[p.itemIndex],
              isGradient: gradients[p.itemIndex],
              signatureDataUrl: signatures[p.itemIndex],
            })
          }
          onLike={handleLike}
        />
      </main>
      <Toaster
        expand
        position="top-center"
        toastOptions={{
          style: { background: "#fff", color: "#333" },
        }}
      />
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
