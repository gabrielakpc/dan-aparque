"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { criarAluno } from "@/lib/actions/alunos";

function Botao() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary" disabled={pending}>{pending ? "Salvando…" : "Cadastrar aluno"}</button>;
}

export function NovoAlunoForm({
  planos, turmas, valorPadrao, hoje,
}: { planos: any[]; turmas: any[]; valorPadrao: number; hoje: string }) {
  const [estado, acao] = useActionState(criarAluno, { ok: true });
  const router = useRouter();
  const [planoId, setPlanoId] = useState("");

  useEffect(() => { if (estado.ok && estado !== undefined) { /* revalida na própria action */ } }, [estado]);

  const plano = planos.find((p) => p.id === planoId);

  return (
    <form action={acao} className="grid gap-4 max-w-2xl">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Nome completo</label>
          <input className="input" name="nome" required minLength={3} autoFocus />
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input className="input" name="telefone" required placeholder="24 99999-8888" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 border-t border-line pt-4">
        <div>
          <label className="label">Plano</label>
          <select className="input" name="plano_id" value={planoId} onChange={(e) => setPlanoId(e.target.value)}>
            <option value="">Sem plano</option>
            {planos.map((p) => <option key={p.id} value={p.id}>{p.nome} — R$ {p.valor}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Valor da mensalidade</label>
          <input className="input" type="number" step="0.01" name="valor" defaultValue={plano?.valor ?? valorPadrao} key={plano?.valor} />
        </div>
        <div>
          <label className="label">Data da matrícula</label>
          <input className="input" type="date" name="data_matricula" defaultValue={hoje} required />
        </div>
        <div>
          <label className="label">Início do ciclo de cobrança</label>
          <input className="input" type="date" name="inicio_ciclo" defaultValue={hoje} />
        </div>
        <div>
          <label className="label">Dia de vencimento</label>
          <input className="input" type="number" min={1} max={31} name="dia_vencimento" defaultValue={new Date().getDate()} required />
        </div>
        <div>
          <label className="label">Turmas</label>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {turmas.map((t) => (
              <label key={t.id} className="text-xs border border-line2 rounded-lg px-2.5 py-1.5 cursor-pointer has-[:checked]:bg-wine has-[:checked]:text-white has-[:checked]:border-wine">
                <input type="checkbox" name="turmas" value={t.id} className="hidden" /> {t.nome}
              </label>
            ))}
          </div>
        </div>
      </div>

      <details className="border-t border-line pt-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink2">Mais informações</summary>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div><label className="label">E-mail</label><input className="input" type="email" name="email" /></div>
          <div><label className="label">Nascimento</label><input className="input" type="date" name="nascimento" /></div>
          <div className="md:col-span-2">
            <label className="label">Como conheceu o Dança Parque?</label>
            <select className="input" name="origem">
              <option value="">Não informado</option>
              {["Indicação de aluno", "Instagram", "Passou em frente", "Amigo/família", "Evento", "Outro"].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2"><label className="label">Observações</label><textarea className="input" name="obs" rows={2} /></div>
          <div className="md:col-span-2"><label className="label">Observações internas</label><textarea className="input" name="obs_interna" rows={2} /></div>
        </div>
      </details>

      {!estado.ok && estado.erro ? <p className="text-sm text-bad">{estado.erro}</p> : null}
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/alunos")}>Cancelar</button>
        <Botao />
      </div>
    </form>
  );
}
