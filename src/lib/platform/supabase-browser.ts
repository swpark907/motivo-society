import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** 브라우저용 클라이언트. 로그인 상태를 읽는 데만 쓴다(쓰기는 서버 액션·DB 함수로). */
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createBrowserClient<Database>(url, anonKey);
}
