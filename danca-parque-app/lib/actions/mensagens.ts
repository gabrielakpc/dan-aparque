"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { montarMensagem, linkWhatsApp } from "@/lib/whatsapp";

/**
 * Garante que exista um registro de mensagem para aquele tipo + mensalidade
 * (REGRA 21 — nunca duplica) e devolve o texto já pronto e o link do
 * WhatsApp. Se já existe, reaproveita o texto gerado antes.
 */
export async function prepararMensagem(input: {
  alunoId: string;
  mensalidadeId?: string | null;
  cobrancaId?: string | null;
  tipo: "lembrete" | "vencimento" | "atraso_1" | "atraso_2" | "confirmacao" | "renovacao" | "livre";
}) {
  const supabase = await createClient();

  if (input.mensalidadeId) {
    const { data: existente } = await supabase
      .from("mensagens")
      .select("id, texto, status, reenvios")
      .eq("mensalidade_id", input.mensalidadeId)
      .eq("tipo", input.tipo)
      .maybeSingle();
    if (existente) {
      const { data: aluno } = await supabase.from("alunos").select("telefone").eq("id", input.alunoId).single();
      return {
        mensagemId: existente.id,
        texto: existente.texto,
        jaEnviada: existente.status === "enviada",
        link: linkWhatsApp(aluno?.telefone || "", existente.texto),
      };
    }
  }

  const { data: aluno } = await supabase
    .from("alunos")
    .select("nome, telefone, escola_id, escolas(modelos)")
    .eq("id", input.alunoId)
    .single<any>();
  if (!aluno) throw new Error("Aluno não encontrado.");

  let vencimento: string | null = null;
  let valor = 0;
  let linkPagamento: string | null = null;
  if (input.mensalidadeId) {
    const { data: m } = await supabase.from("mensalidades").select("vencimento, valor").eq("id", input.mensalidadeId).single();
    vencimento = m?.vencimento ?? null;
    valor = Number(m?.valor ?? 0);
  }
  if (input.cobrancaId) {
    const { data: c } = await supabase.from("cobrancas").select("checkout_url").eq("id", input.cobrancaId).single();
    linkPagamento = c?.checkout_url ?? null;
  }

  const modelo = aluno.escolas?.modelos?.[input.tipo] || "";
  const texto = montarMensagem(modelo, { nome: aluno.nome, valor, vencimento, linkPagamento });

  const { data: nova, error } = await supabase
    .from("mensagens")
    .insert({
      aluno_id: input.alunoId,
      mensalidade_id: input.mensalidadeId || null,
      cobranca_id: input.cobrancaId || null,
      tipo: input.tipo,
      texto,
    })
    .select("id")
    .single();
  if (error || !nova) throw new Error("Não foi possível preparar a mensagem.");

  return { mensagemId: nova.id, texto, jaEnviada: false, link: linkWhatsApp(aluno.telefone, texto) };
}

export async function marcarMensagemEnviada(mensagemId: string, forcarReenvio = false) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: msg } = await supabase.from("mensagens").select("status, reenvios, aluno_id").eq("id", mensagemId).single();
  if (!msg) return { ok: false };

  await supabase
    .from("mensagens")
    .update({
      status: "enviada",
      enviada_em: new Date().toISOString(),
      enviada_por: auth.user?.id,
      reenvios: msg.status === "enviada" && forcarReenvio ? msg.reenvios + 1 : msg.reenvios,
    })
    .eq("id", mensagemId);

  revalidatePath("/mensagens");
  revalidatePath(`/alunos/${msg.aluno_id}`);
  return { ok: true };
}
