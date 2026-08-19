"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registrarPagamento } from "@/lib/actions/alunos";
import { fmtDateBR, fmtBRL, todayISO } from "@/lib/format";
import { X } from "lucide-react";

function Botao() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary" disabled={pending}>{pending ? "Registrando…" : "Registrar pagamento"}</button>;
}

export function RegistrarPagamento({ abertas }: { abertas: { id: string; vencimento: string; valor: number }[] }) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao] = useActionState(registrarPagamento, { ok: true });
  const primeiraRenderizacao = useRef(true);
  useEffect(() => {
    if (primeiraRenderizacao.current) { primeiraRenderizacao.current = false; return; }
    if (estado.ok) setAberto(false);
  }, [estado]);
  const [mensalidadeId, setMensalidadeId] = useState(abertas[0]?.id || "");
  const selecionada = abertas.find((c) => c.id === mensalidadeId);

  if (!abertas.length) return null;

  return (
    <>
      <button className="btn btn-primary" onClick={() => setAberto(true)}>Registrar pagamento</button>
      {aberto ? (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/40" onClick={() => setAberto(false)}>
          <div className="card w-full md:max-w-lg max-h-[92vh] overflow-y-auto rounded-b-none md:rounded-b-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <h2 className="font-display text-xl">Registrar pagamento</h2>
              <button onClick={() => setAberto(false)}><X size={18} /></button>
            </div>
            <form action={acao} className="px-5 pb-5 grid gap-4">
              <div>
                <label className="label">Referente a qual mensalidade?</label>
                <select className="input" name="mensalidade_id" value={mensalidadeId} onChange={(e) => setMensalidadeId(e.target.value)}>
                  {abertas.map((c) => <option key={c.id} value={c.id}>Vencimento {fmtDateBR(c.vencimento)} — {fmtBRL(c.valor)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Valor recebido</label><input className="input" type="number" step="0.01" name="valor" defaultValue={selecionada?.valor} key={mensalidadeId} required /></div>
                <div><label className="label">Data do pagamento</label><input className="input" type="date" name="pago_em" defaultValue={todayISO()} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Forma de pagamento</label>
                  <select className="input" name="metodo" defaultValue="PIX">
                    {["PIX", "Dinheiro", "Cartão", "Transferência", "Outro"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div><label className="label">Recibo</label><input className="input" name="recibo" /></div>
              </div>
              <div><label className="label">Observação</label><textarea className="input" name="obs" rows={2} /></div>
              {!estado.ok && estado.erro ? <p className="text-sm text-bad">{estado.erro}</p> : null}
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button type="button" className="btn btn-ghost" onClick={() => setAberto(false)}>Cancelar</button>
                <Botao />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
