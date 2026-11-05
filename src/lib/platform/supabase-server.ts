import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/** 로컬 시험장 연결 정보. `.env.local`에 `supabase status -o env` 값을 넣는다. */
export function sandboxEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey, serviceKey };
}

/** 사용자 세션으로 DB에 접근한다. RLS와 DB 함수의 권한 검사가 그대로 적용된다. */
export async function createSessionClient() {
  const env = sandboxEnv();
  if (!env) throw new Error("Supabase env missing");
  const cookieStore = await cookies();
  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // 서버 컴포넌트 렌더 중에는 쿠키를 쓸 수 없다. 서버 액션에서 다시 쓴다.
        }
      },
    },
  });
}

/** 서비스 롤. 시험장 초기화에만 쓴다. 사용자 요청 경로에 쓰지 않는다. */
export function createServiceClient() {
  const env = sandboxEnv();
  if (!env?.serviceKey) throw new Error("Supabase service key missing");
  return createClient<Database>(env.url, env.serviceKey, { auth: { persistSession: false } });
}
