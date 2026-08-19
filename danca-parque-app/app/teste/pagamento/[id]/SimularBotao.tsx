"use client";

import { useState, useTransition } from "react";
import { simularPagamentoAprovado } from "@/lib/actions/cobrancas";

export function SimularBotao({ cobrancaId }: { cobrancaId: string }) {
  const [pending, startTransition] = useTransition();
  const [feito, setFeito] = useState(false);

  if (feito) return <p className="badge badge-ok">Pagamento aprovado! Volte ao sistema e confira.</p>;

  return (
    <button
      className="btn btn-primary w-full"
      disabled={pending}
      onClick={() => startTransition(async () => {
        const r = await simularPagamentoAprovado(cobrancaId);
        if (r.ok) setFeito(true);
      })}
    >
      {pending ? "Simulando…" : "Simular pagamento aprovado"}
    </button>
  );
}
