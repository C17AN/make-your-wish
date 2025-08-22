# Make Your Wish

![screenshot](./screenshot.gif)

익명으로 소원을 남기고, 컬러/그라데이션/서명으로 카드를 꾸며 전광판처럼 흘려보는 웹 앱입니다. Vite + React + TypeScript 기반으로 Supabase를 백엔드로 사용합니다.

## 주요 기능

- 소원 작성(텍스트 최대 50자) 및 카드 배경 컬러 무작위 지정, 그라데이션 옵션
- 서명 캔버스(선택) 업로드
- 카드 무한 흐름형 컬럼 뷰(가상 스크롤)
- 카드 상세 프리뷰(3D 틸트 인터랙션)
- 카드 좋아요(중복 방지, 낙관적 업데이트, 실패 롤백)
- 토스트 알림(sonner)

## 기술 스택

- React 19, TypeScript, Vite 6
- Supabase (PostgreSQL, RLS, RPC)
- @tanstack/react-virtual, framer-motion (motion/react)
- lucide-react(아이콘), clsx, CSS Modules

## 로컬 실행

```bash
npm i   # 또는 npm i / yarn
npm run dev # 또는 npm run dev / pnpm dev
```

## 환경 변수

루트에 `.env` 또는 `.env.local` 파일을 생성:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 스크립트

- `dev`: 개발 서버 실행
- `build`: 타입 체크 + 프로덕션 빌드
- `preview`: 빌드 미리보기
- `lint`: ESLint 실행

## 데이터베이스

예시 스키마(Supabase SQL Editor):

```sql
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  bg_color text,
  is_gradient boolean,
  signature_data_url text,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);
```

### RLS 정책(권장)

```sql
alter table public.wishes enable row level security;
alter table public.wishes force row level security;

-- 모두 조회 허용
create policy wishes_select_public on public.wishes
for select to anon, authenticated using (true);

-- 작성 허용(원하면 authenticated로 제한)
create policy wishes_insert_public on public.wishes
for insert to anon, authenticated with check (true);
-- update/delete는 정책 미제작 → 기본 차단
```

### 좋아요 증가 RPC (UUID)

```sql
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

revoke all on function public.increment_wish_likes(uuid) from public;
grant execute on function public.increment_wish_likes(uuid) to anon, authenticated;
```

PostgREST 함수 오버로딩 충돌이 나면 기존 정수 버전을 제거하세요:

```sql
drop function if exists public.increment_wish_likes(integer);
```

필요 시 다크/라이트 테마, 컬러 팔레트 프리셋, 서버 사이드 필터/페이지네이션, 이미지 업로드 제한, 신고/차단 정책 등을 추가할 수 있습니다.
