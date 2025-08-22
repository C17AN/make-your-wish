# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```

---

## Supabase 설정

`.env` 또는 `.env.local` 파일에 환경 변수를 설정하세요.

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

테이블 스키마 예시:

```sql
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  bg_color text,
  is_gradient boolean,
  created_at timestamptz not null default now()
);
```

## Supabase SQL (좋아요 기능)

다음 SQL을 Supabase SQL Editor에서 실행하세요.

```sql
-- 1) wishes 테이블에 likes 칼럼 추가 (기본 0)
alter table public.wishes
  add column if not exists likes integer not null default 0;

-- 2) 좋아요 증가용 RPC 함수 (원자적 증가) - UUID 버전
create or replace function public.increment_wish_likes(p_wish_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.wishes
  set likes = likes + 1
  where id = p_wish_id;
$$;

-- 권한 부여 (anon 키로 호출 가능하도록)
revoke all on function public.increment_wish_likes(uuid) from public;
grant execute on function public.increment_wish_likes(uuid) to anon, authenticated;
```

프런트엔드에서는 `supabase.rpc("increment_wish_likes", { p_wish_id: <uuid string> })`로 호출합니다.
