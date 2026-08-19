"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { salvarExperimental } from "@/lib/actions/config";
import { todayISO } from "@/lib/format";
import { Plus, X } from "lucide-react";

function Botao() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</button>;
}

export function NovaExperimentalBotao({ turmas }: { turmas: { id: string; nome: string }[] }) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao] = useActionState(salvarExperimental, { ok: true });
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    if (estado.ok) setAberto(false);
  }, [estado]);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setAberto(true)}><Plus size={16} /> Agendar experimental</button>
      {aberto ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={() => setAberto(false)}>
          <div className="card w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h2 className="font-display text-xl">Agendar experimental</h2><button onClick={() => setAberto(false)}><X size={18} /></button></div>
            <form action={acao} className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="label">Nome</label><input className="input" name="nome" required /></div>
                <div><label className="label">WhatsApp</label><input className="input" name="telefone" /></div>
                <div><label className="label">Data</label><input className="input" type="date" name="data" defaultValue={todayISO()} required /></div>
                <div>
                  <label className="label">Turma</label>
                  <select className="input" name="turma_id"><option value="">Definir depois</option>{turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select>
                </div>
              </div>
              <div><label className="label">Observações</label><textarea className="input" name="obs" rows={2} /></div>
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
