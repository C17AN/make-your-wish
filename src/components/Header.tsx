type HeaderProps = {
  onClickAdd: () => void;
};

export default function Header({ onClickAdd }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <h1 className="app-title">소원을 말해봐</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button button--primary" onClick={onClickAdd}>
            소원 남기기
          </button>
        </div>
      </div>
    </header>
  );
}
