"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { criarLinkPagamento } from "@/lib/infinitepay";
import { fmtPhoneBR } from "@/lib/format";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export type ResultadoCobranca = { ok: boolean; erro?: string; checkoutUrl?: string; cobrancaId?: string };

/**
 * Gera (ou reaproveita) a cobrança InfinitePay de uma mensalidade.
 * REGRA: se já existe uma cobrança viva (criada/pendente) para a
 * mensalidade, ela é reaproveitada — nunca criamos uma segunda.
 */
export async function gerarCobranca(mensalidadeId: string): Promise<ResultadoCobranca> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, erro: "Sessão expirada." };

  const { data: viva } = await supabase
    .from("cobrancas")
    .select("id, checkout_url")
    .eq("mensalidade_id", mensalidadeId)
    .in("status", ["criada", "pendente"])
    .maybeSingle();
  if (viva?.checkout_url) {
    return { ok: true, checkoutUrl: viva.checkout_url, cobrancaId: viva.id };
  }

  const { data: m } = await supabase
    .from("mensalidades")
    .select("id, valor, vencimento, aluno_id, alunos(nome, telefone, escola_id, escolas(infinitepay_handle, modo_teste, checkout_ativo))")
    .eq("id", mensalidadeId)
    .single<any>();
  if (!m) return { ok: false, erro: "Mensalidade não encontrada." };

  const escola = m.alunos?.escolas;
  if (!escola?.checkout_ativo) {
    return { ok: false, erro: "O checkout da InfinitePay ainda não foi ativado em Configurações → Pagamentos." };
  }

  const valorCentavos = Math.round(Number(m.valor) * 100);
  const orderNsu = m.id;
  const descricao = `Mensalidade Dança Parque — venc. ${m.vencimento}`;

  try {
    let checkoutUrl: string;
    let teste = false;

    if (escola.modo_teste) {
      teste = true;
      checkoutUrl = `${SITE_URL}/teste/pagamento/${orderNsu}`;
    } else {
      if (!escola.infinitepay_handle) {
        return { ok: false, erro: "Falta configurar a InfiniteTag em Configurações → Pagamentos." };
      }
      const webhookUrl = `${SITE_URL}/api/webhook/infinitepay?t=${process.env.INFINITEPAY_WEBHOOK_TOKEN}`;
      const resultado = await criarLinkPagamento({
        handle: escola.infinitepay_handle,
        orderNsu,
        valorCentavos,
        descricao,
        webhookUrl,
        redirectUrl: `${SITE_URL}/pagamento-concluido`,
        cliente: { nome: m.alunos?.nome, telefone: fmtPhoneBR(m.alunos?.telefone) },
      });
      checkoutUrl = resultado.url;
    }

    const { data: cobranca, error } = await supabase
      .from("cobrancas")
      .insert({
        mensalidade_id: m.id,
        aluno_id: m.aluno_id,
        order_nsu: orderNsu,
        valor_centavos: valorCentavos,
        checkout_url: checkoutUrl,
        status: "criada",
        teste,
        criada_por: auth.user.id,
      })
      .select("id")
      .single();
    if (error || !cobranca) return { ok: false, erro: "Não foi possível salvar a cobrança gerada." };

    revalidatePath("/cobrancas");
    revalidatePath("/mensagens");
    revalidatePath(`/alunos/${m.aluno_id}`);
    return { ok: true, checkoutUrl, cobrancaId: cobranca.id };
  } catch (e: any) {
    await supabase.from("cobrancas").insert({
      mensalidade_id: m.id, aluno_id: m.aluno_id, order_nsu: `${orderNsu}-erro-${Date.now()}`,
      valor_centavos: valorCentavos, status: "erro", erro_msg: String(e?.message || e),
    });
    return { ok: false, erro: "Não foi possível gerar o pagamento agora. Tente novamente em instantes." };
  }
}

/**
 * Modo de teste: simula a InfinitePay aprovando o pagamento, sem chamar
 * nenhuma API de verdade e sem envolver dinheiro real.
 */
export async function simularPagamentoAprovado(cobrancaId: string) {
  const supabase = await createClient();
  const { data: c } = await supabase.from("cobrancas").select("order_nsu, valor_centavos").eq("id", cobrancaId).single();
  if (!c) return { ok: false, erro: "Cobrança não encontrada." };

  const { data, error } = await supabase.rpc("confirmar_pagamento_cobranca", {
    p_order_nsu: c.order_nsu,
    p_transaction_nsu: `teste-${cobrancaId}`,
    p_valor_centavos: c.valor_centavos,
    p_capture_method: "pix",
    p_receipt_url: null,
  });
  if (error) return { ok: false, erro: "Falha ao simular o pagamento." };

  revalidatePath("/cobrancas");
  revalidatePath("/mensagens");
  revalidatePath("/hoje");
  revalidatePath("/mensalidades");
  return { ok: true, resultado: data };
}
