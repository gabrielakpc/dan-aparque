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
          <input className="input"
