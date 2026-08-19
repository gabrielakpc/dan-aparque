"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function exigirAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { supabase, ok: false as const };
  const { data: usuario } = await supabase.from("usuarios").select("escola_id, papel").eq("id", auth.user.id).single();
  if (!usuario || usuario.papel !== "administrador") return { supabase, ok: false as const };
  return { supabase, ok: true as const, escolaId: usuario.escola_id };
}

export async function salvarDadosNegocio(_prev: { ok: boolean; erro?: string }, formData: FormData) {
  const ctx = await exigirAdmin();
  if (!ctx.ok) return { ok: false, erro: "Apenas o administrador altera estas configurações." };
  const { error } = await ctx.supabase
    .from("escolas")
    .update({
      nome: String(formData.get("nome") || ""),
      subtitulo: String(formData.get("subtitulo") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      local: String(formData.get("local") || ""),
    })
    .eq("id", ctx.escolaId);
  revalidatePath("/", "layout");
  return error ? { ok: false, erro: "Não foi possível salvar." } : { ok: true };
}

export async function salvarCobranca(_prev: { ok: boolean; erro?: string }, formData: FormData) {
  const ctx = await exigirAdmin();
  if (!ctx.ok) return { ok: false, erro: "Apenas o administrador altera estas configurações." };
  const { error } = await ctx.supabase
    .from("escolas")
    .update({
      valor_padrao: Number(formData.get("valor_padrao") || 80),
      aviso_dias: Number(formData.get("aviso_dias") || 5),
      cobrar_na_matricula: formData.get("cobrar_na_matricula") === "on",
    })
    .eq("id", ctx.escolaId);
  revalidatePath("/", "layout");
  return error ? { ok: false, erro: "Não foi possível salvar." } : { ok: true };
}

export async function salvarPagamentos(_prev: { ok: boolean; erro?: string }, formData: FormData) {
  const ctx = await exigirAdmin();
  if (!ctx.ok) return { ok: false, erro: "Apenas o administrador altera estas configurações." };
  const { error } = await ctx.supabase
    .from("escolas")
    .update({
      infinitepay_handle: String(formData.get("infinitepay_handle") || "").replace(/^\$/, "").trim(),
      checkout_ativo: formData.get("checkout_ativo") === "on",
      modo_teste: formData.get("modo_teste") === "on",
    })
    .eq("id", ctx.escolaId);
  revalidatePath("/", "layout");
  revalidatePath("/cobrancas");
  revalidatePath("/mensagens");
  return error ? { ok: false, erro: "Não foi possível salvar." } : { ok: true };
}

export async function salvarAutomacoes(_prev: { ok: boolean; erro?: string }, formData: FormData) {
  const ctx = await exigirAdmin();
  if (!ctx.ok) return { ok: false, erro: "Apenas o administrador altera estas configurações." };
  const { error } = await ctx.supabase
    .from("escolas")
    .update({
      dias_lembrete: Number(formData.get("dias_lembrete") || 5),
      dias_cobranca_1: Number(formData.get("dias_cobranca_1") || 1),
      dias_cobranca_2: Number(formData.get("dias_cobranca_2") || 3),
      horario_sugerido: String(formData.get("horario_sugerido") || "09:00"),
    })
    .eq("id", ctx.escolaId);
  revalidatePath("/", "layout");
  revalidatePath("/mensagens");
  return error ? { ok: false, erro: "Não foi possível salvar." } : { ok: true };
}

export async function salvarMensagens(_prev: { ok: boolean; erro?: string }, formData: FormData) {
  const ctx = await exigirAdmin();
  if (!ctx.ok) return { ok: false, erro: "Apenas o administrador altera estas configurações." };
  const { data: atual } = await ctx.supabase.from("escolas").select("modelos").eq("id", ctx.escolaId).single();
  const tipos = ["lembrete", "vencimento", "atraso_1", "atraso_2", "confirmacao", "renovacao", "livre"];
  const modelos = { ...(atual?.modelos || {}) };
  tipos.forEach((t) => { modelos[t] = String(formData.get(t) || ""); });
  const { error } = await ctx.supabase.from("escolas").update({ modelos }).eq("id", ctx.escolaId);
  revalidatePath("/", "layout");
  return error ? { ok: false, erro: "Não foi possível salvar." } : { ok: true };
}

export async function salvarPlano(_prev: { ok: boolean; erro?: string }, formData: FormData) {
  const ctx = await exigirAdmin();
  if (!ctx.ok) return { ok: false, erro: "Apenas o administrador altera planos." };
  const id = String(formData.get("id") || "");
  const dados = {
    nome: String(formData.get("nome") || ""),
    valor: Number(formData.get("valor") || 0),
    periodicidade: String(formData.get("periodicidade") || "Mensal"),
    descricao: String(formData.get("descricao") || ""),
    ativo: formData.get("ativo") === "on",
  };
  const { error } = id
    ? await ctx.supabase.from("planos").update(dados).eq("id", id)
    : await ctx.supabase.from("planos").insert({ ...dados, escola_id: ctx.escolaId });
  revalidatePath("/configuracoes");
  return error ? { ok: false, erro: "Não foi possível salvar o plano." } : { ok: true };
}

export async function salvarTurma(_prev: { ok: boolean; erro?: string }, formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, erro: "Sessão expirada." };
  const { data: usuario } = await supabase.from("usuarios").select("escola_id").eq("id", auth.user.id).single();
  if (!usuario) return { ok: false, erro: "Usuário sem escola vinculada." };

  const id = String(formData.get("id") || "");
  const dados = {
    nome: String(formData.get("nome") || ""),
    dia_semana: Number(formData.get("dia_semana") || 0),
    horario: String(formData.get("horario") || "19:00"),
    professor: String(formData.get("professor") || ""),
    local: String(formData.get("local") || ""),
    capacidade: Number(formData.get("capacidade") || 20),
    ativo: formData.get("ativo") === "on",
  };
  const { error } = id
    ? await supabase.from("turmas").update(dados).eq("id", id)
    : await supabase.from("turmas").insert({ ...dados, escola_id: usuario.escola_id });
  revalidatePath("/turmas");
  return error ? { ok: false, erro: "Não foi possível salvar a turma." } : { ok: true };
}

export async function marcarPresenca(turmaId: string, alunoId: string, data: string, presente: boolean) {
  const supabase = await createClient();
  await supabase
    .from("presencas")
    .upsert({ turma_id: turmaId, aluno_id: alunoId, data, presente }, { onConflict: "turma_id,aluno_id,data" });
  revalidatePath("/turmas");
}

export async function salvarExperimental(_prev: { ok: boolean; erro?: string }, formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, erro: "Sessão expirada." };
  const { data: usuario } = await supabase.from("usuarios").select("escola_id").eq("id", auth.user.id).single();
  if (!usuario) return { ok: false, erro: "Usuário sem escola vinculada." };

  const id = String(formData.get("id") || "");
  const dados = {
    nome: String(formData.get("nome") || ""),
    telefone: String(formData.get("telefone") || ""),
    data: String(formData.get("data") || ""),
    turma_id: String(formData.get("turma_id") || "") || null,
    status: String(formData.get("status") || "agendada"),
    obs: String(formData.get("obs") || ""),
  };
  const { error } = id
    ? await supabase.from("aulas_experimentais").update(dados).eq("id", id)
    : await supabase.from("aulas_experimentais").insert({ ...dados, escola_id: usuario.escola_id });
  revalidatePath("/experimentais");
  return error ? { ok: false, erro: "Não foi possível salvar." } : { ok: true };
}
