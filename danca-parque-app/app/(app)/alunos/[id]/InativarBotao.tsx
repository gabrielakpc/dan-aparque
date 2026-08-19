"use client";

import { useTransition } from "react";
import { inativarAluno, reativarAluno } from "@/lib/actions/alunos";

export function InativarBotao({ alunoId, status }: { alunoId: string; status: string }) {
  const [pending, startTransition] = useTransition();

  if (status === "ativo") {
    return (
      <button
        className="btn btn-danger"
        disabled={pending}
        onClick={() => {
          if (!confirm("Tornar este aluno inativo? As mensalidades futuras em aberto serão canceladas. O histórico financeiro permanece.")) return;
          startTransition(() => inativarAluno(alunoId));
        }}
      >
        Tornar inativo
      </button>
    );
  }
  return (
    <button className="btn btn-primary" disabled={pending} onClick={() => startTransition(() => reativarAluno(alunoId))}>
      Reativar aluno
    </button>
  );
}
