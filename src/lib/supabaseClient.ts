import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type WishRow = {
  text: string;
  bgColor?: string;
  isGradient?: boolean;
};

// DTO that matches DB column names if present
export type WishDto = {
  text: string;
  bg_color?: string | null;
  is_gradient?: boolean | null;
  created_at?: string;
};
