"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { excluirAluno } from "@/lib/actions/alunos";
import { Trash2, X, AlertTriangle } from "lucide-react";

function BotaoConfirmar({ habilitado }: { habilitado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-danger" disabled={!habilitado || pending} style={{ background: habilitado ? "#A81B27" : undefined, color: habilitado ? "#fff" : undefined }}>
      {pending ? "Excluindo…" : "Excluir permanentemente"}
    </button>
  );
}

export function ExcluirAlunoBotao({ alunoId, nome }: { alunoId: string; nome: string }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [estado, acao] = useFormState(excluirAluno, { ok: true });

  return (
    <>
      <button className="btn btn-danger" onClick={() => setAberto(true)}>
        <Trash2 size={15} /> Excluir aluno permanentemente
      </button>

      {aberto ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={() => setAberto(false)}>
          <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <h2 className="font-display text-xl">Excluir {nome}?</h2>
              <button onClick={() => setAberto(false)}><X size={18} /></button>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg p-3 mb-4" style={{ background: "var(--bad-bg, #FAE7E6)" }}>
              <AlertTriangle size={16} className="mt-0.5 flex-none text-bad" />
              <p className="text-sm text-ink2">
                Isso apaga o aluno, as matrículas, as mensalidades, os pagamentos e as mensagens dele
                <strong> para sempre — não é possível desfazer.</strong> Se este aluno saiu da escola mas já
                teve mensalidade paga, use "Tornar inativo" em vez disso, para manter o histórico financeiro.
              </p>
            </div>

            <form action={acao} className="grid gap-3">
              <input type="hidden" name="aluno_id" value={alunoId} />
              <label className="label">
                Para confirmar, digite o nome completo do aluno: <strong>{nome}</strong>
              </label>
              <input
                className="input"
                name="confirmacao"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                autoComplete="off"
                placeholder={nome}
              />
              {!estado.ok && estado.erro ? <p className="text-sm text-bad">{estado.erro}</p> : null}
              <div className="flex justify-end gap-2 border-t border-line pt-4 mt-1">
                <button type="button" className="btn btn-ghost" onClick={() => setAberto(false)}>Cancelar</button>
                <BotaoConfirmar habilitado={texto.trim() === nome} />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
