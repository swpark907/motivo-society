import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/platform/database.types";
import { personaEmail, SANDBOX_PASSWORD } from "@/lib/platform/personas";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type Client = SupabaseClient<Database>;

/** seed.sql의 고정 id. */
export const ID = {
  owner: "00000000-0000-4000-a000-000000000001",
  host: "00000000-0000-4000-a000-000000000002",
  admin: "00000000-0000-4000-a000-000000000003",
  staff: "00000000-0000-4000-a000-000000000004",
  member: "00000000-0000-4000-a000-000000000005",
  guest: "00000000-0000-4000-a000-000000000006",
  club: "00000000-0000-4000-b000-000000000001",
  layerBan: "00000000-0000-4000-b100-000000000005",
  layerLeader: "00000000-0000-4000-b100-000000000004",
  tonight: "00000000-0000-4000-c000-000000000001",
  membersOnly: "00000000-0000-4000-c000-000000000002",
  draft: "00000000-0000-4000-c000-000000000005",
  workshop: "00000000-0000-4000-c000-000000000006",
  followup: "00000000-0000-4000-c000-000000000007",
  challenge: "00000000-0000-4000-c000-000000000014",
} as const;

export function requireEnv() {
  if (!url || !anonKey || !serviceKey) {
    throw new Error(
      ".env.local에 로컬 Supabase 값이 없어요. docs/architecture/platform-sandbox.md 참고",
    );
  }
}

export async function reseed() {
  requireEnv();
  const admin = createClient<Database>(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await admin.rpc("sandbox_reseed");
  if (error) throw error;
}

/** 가짜 사람으로 로그인한 클라이언트. handle은 seed의 이메일 앞부분(filler1 등 포함). */
export async function as(handle: string): Promise<Client> {
  const client = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({
    email: personaEmail(handle),
    password: SANDBOX_PASSWORD,
  });
  if (error) throw new Error(`${handle} 로그인 실패: ${error.message}`);
  return client;
}

export function anon(): Client {
  return createClient<Database>(url, anonKey, { auth: { persistSession: false } });
}

/** rpc 오류 코드(raise exception 'code')만 꺼낸다. */
export function code(error: { message: string } | null): string | null {
  return error ? error.message : null;
}

/** 프로필이 없는 새 사람(매직링크로 처음 들어온 사람과 같은 상태). */
export async function newUser(): Promise<Client> {
  requireEnv();
  const admin = createClient<Database>(url, serviceKey, { auth: { persistSession: false } });
  const email = `dbtest-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const password = "dbtest-pass-2026";
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const client = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  return client;
}
