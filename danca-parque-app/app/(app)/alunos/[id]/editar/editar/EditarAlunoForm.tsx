"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { editarAluno } from "@/lib/actions/alunos";

function Botao() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary" disabled={pending}>{pending ? "Salvando…" : "Salvar alterações"}</button>;
}

export function EditarAlunoForm({
  aluno, matricula, planos, turmas, turmasAtuais,
}: {
  aluno: any; matricula: any; planos: any[]; turmas: any[]; turmasAtuais: string[];
}) {
  const acaoComId = editarAluno.bind(null, aluno.id);
  const [estado, acao] = useFormState<{ ok: boolean; erro?: string }, FormData>(acaoComId, { ok: true });
  const router = useRouter();
  const [planoId, setPlanoId] = useState(matricula?.plano_id || "");
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<string[]>(turmasAtuais);

  const escolherPlano = (id: string) => {
    setPlanoId(id);
    const p = planos.find((x) => x.id === id);
    if (p) {
      const campo = document.querySelector<HTMLInputElement>('input[name="valor"]');
      if (campo) campo.value = String(p.valor);
    }
  };

  return (
    <form action={acao} className="grid gap-4 max-w-2xl">
      <input type="hidden" name="matricula_id" value={matricula?.id || ""} />

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Nome completo</label>
          <input className="input" name="nome" defaultValue={aluno.nome} required minLength={3} autoFocus />
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input className="input" name="telefone" defaultValue={aluno.telefone} required />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 border-t border-line pt-4">
        <div>
          <label className="label">Plano</label>
          <select className="input" name="plano_id" value={planoId} onChange={(e) => escolherPlano(e.target.value)}>
            <option value="">Sem plano</option>
            {planos.map((p) => <option key={p.id} value={p.id}>{p.nome} — R$ {p.valor}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Valor da mensalidade</label>
          <input className="input" type="number" step="0.01" name="valor" defaultValue={matricula?.valor ?? ""} />
          <p className="text-xs text-muted mt-1">Só afeta mensalidades futuras ainda não pagas.</p>
        </div>
        <div>
          <label className="label">Início do ciclo de cobrança</label>
          <input className="input" type="date" name="inicio_ciclo" defaultValue={matricula?.inicio_ciclo ?? ""} />
        </div>
        <div>
          <label className="label">Dia de vencimento</label>
          <input className="input" type="number" min={1} max={31} name="dia_vencimento" defaultValue={matricula?.dia_vencimento ?? ""} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Turmas</label>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {turmas.map((t) => {
              const on = turmasSelecionadas.includes(t.id);
              return (
                <label key={t.id} className="text-xs border border-line2 rounded-lg px-2.5 py-1.5 cursor-pointer"
                  style={on ? { background: "var(--wine)", color: "#fff", borderColor: "var(--wine)" } : undefined}>
                  <input
                    type="checkbox" name="turmas" value={t.id} className="hidden" defaultChecked={on}
                    onChange={(e) => setTurmasSelecionadas((prev) =>
                      e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id))}
                  />
                  {t.nome}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 border-t border-line pt-4">
        <div><label className="label">E-mail</label><input className="input" type="email" name="email" defaultValue={aluno.email || ""} /></div>
        <div><label className="label">Nascimento</label><input className="input" type="date" name="nascimento" defaultValue={aluno.nascimento || ""} /></div>
        <div className="md:col-span-2">
          <label className="label">Como conheceu o Dança Parque?</label>
          <select className="input" name="origem" defaultValue={aluno.origem || ""}>
            <option value="">Não informado</option>
            {["Indicação de aluno", "Instagram", "Passou em frente", "Amigo/família", "Evento", "Outro"].map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2"><label className="label">Observações</label><textarea className="input" name="obs" rows={2} defaultValue={aluno.obs || ""} /></div>
        <div className="md:col-span-2"><label className="label">Observações internas</label><textarea className="input" name="obs_interna" rows={2} defaultValue={aluno.obs_interna || ""} /></div>
      </div>

      {!estado.ok && estado.erro ? <p className="text-sm text-bad">{estado.erro}</p> : null}
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => router.push(`/alunos/${aluno.id}`)}>Cancelar</button>
        <Botao />
      </div>
    </form>
  );
}
