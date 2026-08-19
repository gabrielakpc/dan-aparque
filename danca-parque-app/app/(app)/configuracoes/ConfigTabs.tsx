"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  salvarDadosNegocio, salvarCobranca, salvarPagamentos, salvarAutomacoes, salvarMensagens,
} from "@/lib/actions/config";

function Salvar({ texto = "Salvar alterações" }: { texto?: string }) {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary" disabled={pending}>{pending ? "Salvando…" : texto}</button>;
}

const ABAS = [
  { id: "negocio", label: "Negócio" }, { id: "cobranca", label: "Cobrança" },
  { id: "pagamentos", label: "Pagamentos" }, { id: "automacoes", label: "Automações" },
  { id: "mensagens", label: "Mensagens" },
];

export function ConfigTabs({ escola, admin }: { escola: any; admin: boolean }) {
  const [aba, setAba] = useState("negocio");
  const [negocio, aNegocio] = useActionState(salvarDadosNegocio, { ok: true });
  const [cobranca, aCobranca] = useActionState(salvarCobranca, { ok: true });
  const [pagamentos, aPagamentos] = useActionState(salvarPagamentos, { ok: true });
  const [automacoes, aAutomacoes] = useActionState(salvarAutomacoes, { ok: true });
  const [mensagens, aMensagens] = useActionState(salvarMensagens, { ok: true });

  return (
    <div>
      {!admin ? (
        <div className="card p-3.5 mb-5 border-l-[3px] border-l-warn text-sm">
          Você está vendo como gerente. Apenas o administrador altera estas configurações.
        </div>
      ) : null}

      <div className="flex gap-2 mb-6 border-b border-line overflow-x-auto">
        {ABAS.map((a) => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`pb-2 px-1 mr-4 text-sm font-semibold whitespace-nowrap border-b-2 ${aba === a.id ? "border-wine text-wine" : "border-transparent text-muted"}`}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === "negocio" ? (
        <form action={aNegocio} className="card p-5 grid md:grid-cols-2 gap-4 max-w-3xl">
          <div><label className="label">Nome</label><input className="input" name="nome" defaultValue={escola.nome} disabled={!admin} /></div>
          <div><label className="label">Subtítulo</label><input className="input" name="subtitulo" defaultValue={escola.subtitulo} disabled={!admin} /></div>
          <div><label className="label">WhatsApp da escola</label><input className="input" name="whatsapp" defaultValue={escola.whatsapp} disabled={!admin} /></div>
          <div><label className="label">Local</label><input className="input" name="local" defaultValue={escola.local} disabled={!admin} /></div>
          {!negocio.ok && negocio.erro ? <p className="text-sm text-bad md:col-span-2">{negocio.erro}</p> : null}
          {admin ? <div className="md:col-span-2"><Salvar /></div> : null}
        </form>
      ) : null}

      {aba === "cobranca" ? (
        <form action={aCobranca} className="card p-5 grid md:grid-cols-2 gap-4 max-w-3xl">
          <div><label className="label">Valor padrão da mensalidade</label><input className="input" type="number" step="0.01" name="valor_padrao" defaultValue={escola.valor_padrao} disabled={!admin} /></div>
          <div><label className="label">Dias para "vence em breve"</label><input className="input" type="number" name="aviso_dias" defaultValue={escola.aviso_dias} disabled={!admin} /></div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" name="cobrar_na_matricula" defaultChecked={escola.cobrar_na_matricula} disabled={!admin} />
            Cobrar a primeira mensalidade no próprio dia da matrícula
          </label>
          {!cobranca.ok && cobranca.erro ? <p className="text-sm text-bad md:col-span-2">{cobranca.erro}</p> : null}
          {admin ? <div className="md:col-span-2"><Salvar /></div> : null}
        </form>
      ) : null}

      {aba === "pagamentos" ? (
        <form action={aPagamentos} className="card p-5 grid gap-4 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className={`badge ${escola.checkout_ativo ? "badge-ok" : "badge-warn"}`}>
              {escola.checkout_ativo ? "Conectada" : "Não configurada"}
            </span>
            {escola.modo_teste ? <span className="badge badge-off">Modo de teste ligado</span> : null}
          </div>
          <div>
            <label className="label">InfiniteTag</label>
            <input className="input" name="infinitepay_handle" defaultValue={escola.infinitepay_handle || ""} placeholder="seu-usuario" disabled={!admin} />
            <p className="text-xs text-muted mt-1">Seu nome de usuário no app InfinitePay, sem o $ na frente.</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="checkout_ativo" defaultChecked={escola.checkout_ativo} disabled={!admin} /> Ativar cobrança via InfinitePay
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="modo_teste" defaultChecked={escola.modo_teste} disabled={!admin} /> Modo de teste — nenhuma cobrança real é criada
          </label>
          {!pagamentos.ok && pagamentos.erro ? <p className="text-sm text-bad">{pagamentos.erro}</p> : null}
          {admin ? <Salvar /> : null}
        </form>
      ) : null}

      {aba === "automacoes" ? (
        <form action={aAutomacoes} className="card p-5 grid md:grid-cols-2 gap-4 max-w-3xl">
          <div><label className="label">Lembrete — dias antes do vencimento</label><input className="input" type="number" name="dias_lembrete" defaultValue={escola.dias_lembrete} disabled={!admin} /></div>
          <div><label className="label">Primeira cobrança — dias depois</label><input className="input" type="number" name="dias_cobranca_1" defaultValue={escola.dias_cobranca_1} disabled={!admin} /></div>
          <div><label className="label">Segunda cobrança — dias depois</label><input className="input" type="number" name="dias_cobranca_2" defaultValue={escola.dias_cobranca_2} disabled={!admin} /></div>
          <div><label className="label">Horário sugerido</label><input className="input" type="time" name="horario_sugerido" defaultValue={escola.horario_sugerido?.slice(0, 5)} disabled={!admin} /></div>
          {!automacoes.ok && automacoes.erro ? <p className="text-sm text-bad md:col-span-2">{automacoes.erro}</p> : null}
          {admin ? <div className="md:col-span-2"><Salvar /></div> : null}
        </form>
      ) : null}

      {aba === "mensagens" ? (
        <form action={aMensagens} className="card p-5 grid gap-4 max-w-3xl">
          <p className="text-sm text-muted">
            Use <code>{"{{primeiro_nome}}"}</code>, <code>{"{{valor}}"}</code>, <code>{"{{vencimento}}"}</code>,{" "}
            <code>{"{{link_pagamento}}"}</code>, <code>{"{{proximo_vencimento}}"}</code> e <code>{"{{dias_atrasado}}"}</code>.
          </p>
          {[
            ["lembrete", "Lembrete (dias antes)"], ["vencimento", "Vencimento (no dia)"],
            ["atraso_1", "Primeira cobrança de atraso"], ["atraso_2", "Segunda cobrança de atraso"],
            ["confirmacao", "Confirmação de pagamento"], ["renovacao", "Renovação"], ["livre", "Mensagem livre"],
          ].map(([id, label]) => (
            <div key={id}>
              <label className="label">{label}</label>
              <textarea className="input" name={id} rows={4} defaultValue={escola.modelos?.[id] || ""} disabled={!admin} />
            </div>
          ))}
          {!mensagens.ok && mensagens.erro ? <p className="text-sm text-bad">{mensagens.erro}</p> : null}
          {admin ? <Salvar texto="Salvar mensagens" /> : null}
        </form>
      ) : null}
    </div>
  );
}
