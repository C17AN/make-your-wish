import { Moon, Sun } from "lucide-react";

type HeaderProps = {
  onClickAdd: () => void;
  onToggleTheme?: () => void;
  isDark?: boolean;
};

export default function Header({
  onClickAdd,
  onToggleTheme,
  isDark = false,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <h1 className="app-title">소원을 말해봐</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="button"
            onClick={onToggleTheme}
            aria-label="toggle-theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="button button--primary" onClick={onClickAdd}>
            소원 남기기
          </button>
        </div>
      </div>
    </header>
  );
}
