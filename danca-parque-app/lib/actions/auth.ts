"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoLogin = { ok: boolean; erro?: string };

export async function entrar(_prev: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim();
  const senha = String(formData.get("senha") || "");

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { ok: false, erro: "E-mail ou senha incorretos." };

  redirect("/hoje");
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
