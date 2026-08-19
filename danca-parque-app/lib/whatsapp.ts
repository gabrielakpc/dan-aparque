import { fmtBRL, fmtDateBR, onlyDigits, diffDays, todayISO } from "./format";

/**
 * Camada de serviço para WhatsApp. Hoje só existe WhatsAppLinkService — o
 * link wa.me pré-preenchido, sem custo e sem risco de bloqueio de conta.
 * O dia que fizer sentido usar a Cloud API oficial, entra um
 * WhatsAppApiService com a mesma assinatura de montarLink/enviar, e as
 * telas não mudam nada.
 */
export function linkWhatsApp(telefone: string, mensagem: string) {
  const numero = onlyDigits(telefone);
  const comDDI = numero.startsWith("55") ? numero : `55${numero}`;
  return `https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem)}`;
}

export type VariaveisMensagem = {
  nome: string;
  valor: number;
  vencimento?: string | null;
  proximoVencimento?: string | null;
  linkPagamento?: string | null;
  turma?: string;
  pix?: string;
};

export function montarMensagem(modelo: string, v: VariaveisMensagem) {
  const hoje = todayISO();
  const atraso = v.vencimento ? Math.max(0, diffDays(v.vencimento, hoje)) : 0;
  return String(modelo || "")
    .replaceAll("{{primeiro_nome}}", (v.nome || "").split(" ")[0])
    .replaceAll("{{nome}}", v.nome || "")
    .replaceAll("{{valor}}", fmtBRL(v.valor))
    .replaceAll("{{vencimento}}", v.vencimento ? fmtDateBR(v.vencimento) : "—")
    .replaceAll("{{proximo_vencimento}}", v.proximoVencimento ? fmtDateBR(v.proximoVencimento) : "—")
    .replaceAll("{{link_pagamento}}", v.linkPagamento || "")
    .replaceAll("{{turma}}", v.turma || "")
    .replaceAll("{{pix}}", v.pix || "")
    .replaceAll("{{dias_atrasado}}", String(atraso));
}
