"use client";

import { useState, useTransition } from "react";
import { CreditCard, MessageCircle, Copy, ExternalLink, Check } from "lucide-react";
import { gerarCobranca } from "@/lib/actions/cobrancas";
import { prepararMensagem, marcarMensagemEnviada } from "@/lib/actions/mensagens";

type Tipo = "lembrete" | "vencimento" | "atraso_1" | "atraso_2" | "confirmacao" | "renovacao" | "livre";

export function AcoesCobrancaWhatsApp({
  alunoId, mensalidadeId, tipo, checkoutUrlInicial, tamanho = "md",
}: {
  alunoId: string;
  mensalidadeId: string | null;
  tipo: Tipo;
  checkoutUrlInicial?: string | null;
  tamanho?: "sm" | "md";
}) {
  const [pending, startTransition] = useTransition();
  const [checkoutUrl, setCheckoutUrl] = useState(checkoutUrlInicial || null);
  const [cobrancaId, setCobrancaId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const cls = tamanho === "sm" ? "btn btn-ghost btn-sm" : "btn btn-ghost";

  const gerar = () => {
    if (!mensalidadeId) return;
    setErro(null);
    startTransition(async () => {
      const r = await gerarCobranca(mensalidadeId);
      if (!r.ok) return setErro(r.erro || "Não foi possível gerar o pagamento agora.");
      setCheckoutUrl(r.checkoutUrl || null);
      setCobrancaId(r.cobrancaId || null);
    });
  };

  const copiar = () => {
    if (!checkoutUrl) return;
    navigator.clipboard?.writeText(checkoutUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviarWhats = () => {
    startTransition(async () => {
      try {
        const r = await prepararMensagem({ alunoId, mensalidadeId, cobrancaId, tipo });
        if (r.jaEnviada) {
          const ok = confirm("Esta mensagem já foi enviada. Enviar novamente?");
          if (!ok) return;
        }
        window.open(r.link, "_blank");
        await marcarMensagemEnviada(r.mensagemId, true);
      } catch {
        setErro("Não foi possível preparar a mensagem.");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!checkoutUrl && mensalidadeId ? (
        <button className={cls} onClick={gerar} disabled={pending}>
          <CreditCard size={14} /> {pending ? "Gerando…" : "Gerar pagamento"}
        </button>
      ) : null}
      {checkoutUrl ? (
        <>
          <a className={cls} href={checkoutUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> Abrir pagamento
          </a>
          <button className={cls} onClick={copiar}>
            {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? "Copiado" : "Copiar link"}
          </button>
        </>
      ) : null}
      <button className={tamanho === "sm" ? "btn btn-primary btn-sm" : "btn btn-primary"} onClick={enviarWhats} disabled={pending}>
        <MessageCircle size={14} /> Enviar WhatsApp
      </button>
      {erro ? <p className="text-xs text-bad w-full">{erro}</p> : null}
    </div>
  );
}
