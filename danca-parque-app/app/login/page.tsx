"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { entrar } from "@/lib/actions/auth";

function BotaoEntrar() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary w-full mt-2" disabled={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export default function LoginPage() {
  const [estado, acao] = useActionState(entrar, { ok: true });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-paper">
      <div className="w-full max-w-sm">
        <p className="font-sans text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-2">
          Sistema de gestão
        </p>
        <h1 className="font-display text-4xl mb-1">
          <span className="text-ink font-semibold">Dança</span>{" "}
          <em className="not-italic italic font-medium text-wine">Parque</em>
        </h1>
        <p className="text-sm text-muted mb-8">Alunos, mensalidades e pagamentos em um lugar só.</p>

        <form action={acao} className="card p-5 grid gap-4">
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" name="email" required autoFocus />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" name="senha" required />
          </div>
          {!estado.ok && estado.erro ? <p className="text-sm text-bad">{estado.erro}</p> : null}
          <BotaoEntrar />
        </form>
      </div>
    </div>
  );
}
