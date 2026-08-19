"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { salvarTurma } from "@/lib/actions/config";
import { Plus, X } from "lucide-react";

function Botao() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary" disabled={pending}>{pending ? "Salvando…" : "Salvar turma"}</button>;
}

export function NovaTurmaBotao() {
  const [aberto, setAberto] = useState(false);
  const [estado, acao] = useActionState(salvarTurma, { ok: true });
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    if (estado.ok) setAberto(false);
  }, [estado]);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setAberto(true)}><Plus size={16} /> Nova turma</button>
      {aberto ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={() => setAberto(false)}>
          <div className="card w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h2 className="font-display text-xl">Nova turma</h2><button onClick={() => setAberto(false)}><X size={18} /></button></div>
            <form action={acao} className="grid gap-4">
              <div><label className="label">Nome</label><input className="input" name="nome" required placeholder="Samba de gafieira — Iniciante" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Dia da semana</label>
                  <select className="input" name="dia_semana">
                    {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
                <div><label className="label">Horário</label><input className="input" type="time" name="horario" defaultValue="19:00" /></div>
                <div><label className="label">Professor</label><input className="input" name="professor" /></div>
                <div><label className="label">Capacidade</label><input className="input" type="number" name="capacidade" defaultValue={20} /></div>
              </div>
              <div><label className="label">Local</label><input className="input" name="local" /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ativo" defaultChecked /> Turma ativa</label>
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
