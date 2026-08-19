import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { conferirPagamento } from "@/lib/infinitepay";

/**
 * Webhook da InfinitePay. A InfinitePay não documenta assinatura de
 * requisição, então a segurança tem duas camadas:
 *
 *  1. Token na própria URL (?t=...), gerado por nós e embutido em cada
 *     cobrança — quem não tiver o token não consegue nem tentar.
 *  2. O corpo do webhook NUNCA é aceito sozinho como prova de pagamento.
 *     Antes de marcar qualquer coisa como paga, confirmamos com a própria
 *     InfinitePay via /payment_check. O webhook só avisa "olha aqui";
 *     quem decide é a conferência.
 *
 * Idempotência: cada transaction_nsu só é processado uma vez (índice único
 * em webhook_eventos). Reenvios da InfinitePay não duplicam pagamento.
 */
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");
  if (!token || token !== process.env.INFINITEPAY_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "token inválido" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "corpo inválido" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: evento, error: erroEvento } = await supabase
    .from("webhook_eventos")
    .insert({
      provedor: "infinitepay",
      order_nsu: payload.order_nsu ?? null,
      transaction_nsu: payload.transaction_nsu ?? null,
      invoice_slug: payload.invoice_slug ?? null,
      payload,
    })
    .select("id")
    .single();

  // conflito no índice único = evento repetido: responde 200 e não faz nada de novo
  if (erroEvento) {
    return NextResponse.json({ ok: true, duplicado: true });
  }

  try {
    const { data: cobranca } = await supabase
      .from("cobrancas")
      .select("id, order_nsu, alunos:aluno_id(escolas:escola_id(infinitepay_handle))")
      .eq("order_nsu", payload.order_nsu)
      .maybeSingle<any>();

    if (!cobranca) {
      await supabase.from("webhook_eventos").update({
        processado: true, processado_em: new Date().toISOString(), resultado: "cobranca_nao_encontrada",
      }).eq("id", evento.id);
      return NextResponse.json({ ok: true });
    }

    const handle = cobranca.alunos?.escolas?.infinitepay_handle;
    const conferencia = await conferirPagamento({
      handle,
      orderNsu: payload.order_nsu,
      transactionNsu: payload.transaction_nsu,
      slug: payload.invoice_slug,
    });

    if (!conferencia.paid) {
      await supabase.from("webhook_eventos").update({
        processado: true, processado_em: new Date().toISOString(), resultado: "nao_confirmado_pela_infinitepay",
      }).eq("id", evento.id);
      // não é erro nosso — só ainda não está pago de verdade
      return NextResponse.json({ ok: true });
    }

    const { data: resultado, error: erroConfirmar } = await supabase.rpc("confirmar_pagamento_cobranca", {
      p_order_nsu: payload.order_nsu,
      p_transaction_nsu: payload.transaction_nsu,
      p_valor_centavos: conferencia.paid_amount ?? payload.paid_amount ?? payload.amount,
      p_capture_method: conferencia.capture_method ?? payload.capture_method ?? null,
      p_receipt_url: payload.receipt_url ?? null,
    });

    await supabase.from("webhook_eventos").update({
      processado: true, processado_em: new Date().toISOString(),
      resultado: erroConfirmar ? "erro" : JSON.stringify(resultado),
      erro: erroConfirmar?.message,
    }).eq("id", evento.id);

    if (erroConfirmar) return NextResponse.json({ error: erroConfirmar.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    await supabase.from("webhook_eventos").update({
      processado: false, erro: String(e?.message || e),
    }).eq("id", evento.id);
    // 400 faz a InfinitePay tentar reenviar depois
    return NextResponse.json({ error: "falha ao processar" }, { status: 400 });
  }
}
