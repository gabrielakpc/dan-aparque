import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fmtBRL, fmtDateBR, fmtPhoneBR } from "@/lib/format";
import { Avatar, Badge, StatCard, EmptyState } from "@/components/ui";
import { RegistrarPagamento } from "@/components/RegistrarPagamento";
import { AcoesCobrancaWhatsApp } from "@/components/AcoesCobrancaWhatsApp";
import { InativarBotao } from "./InativarBotao";
import { ExcluirAlunoBotao } from "./ExcluirAlunoBotao";
import { ArrowLeft, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  const { data: usuarioAtual } = auth.user
    ? await supabase.from("usuarios").select("papel").eq("id", auth.user.id).single()
    : { data: null };
  const isAdmin = usuarioAtual?.papel === "administrador";

  const { data: aluno } = await supabase.from("alunos").select("*").eq("id", id).single();
  if (!aluno) notFound();

  const { data: matricula } = await supabase
    .from("matriculas")
    .select("id, valor, dia_vencimento, planos(nome)")
    .eq("aluno_id", id)
    .eq("ativa", true)
    .maybeSingle<any>();

  const { data: mensalidades } = await supabase
    .from("v_situacao_mensalidades")
    .select("*")
    .eq("aluno_id", id)
    .order("vencimento", { ascending: false });

  const { data: pagamentos } = await supabase
    .from("pagamentos")
    .select("*")
    .eq("aluno_id", id)
    .order("pago_em", { ascending: false });

  const { data: cobrancas } = await supabase
    .from("cobrancas")
    .select("id, mensalidade_id, checkout_url, status")
    .eq("aluno_id", id)
    .in("status", ["criada", "pendente"]);
  const cobrancaPorMensalidade = new Map((cobrancas || []).map((c) => [c.mensalidade_id, c]));

  const { data: mensagens } = await supabase
    .from("mensagens")
    .select("*")
    .eq("aluno_id", id)
    .order("criada_em", { ascending: false })
    .limit(10);

  const abertas = (mensalidades || []).filter((m: any) => m.situacao !== "paga" && m.situacao !== "cancelada");
  const proxima = abertas[abertas.length - 1]; // mais antiga em aberto
  const totalPago = (pagamentos || []).filter((p) => p.status === "confirmado").reduce((s, p) => s + Number(p.valor), 0);

  return (
    <div>
      <Link href="/alunos" className="btn btn-ghost btn-sm mb-3"><ArrowLeft size={14} /> Alunos</Link>

      <div className="flex flex-wrap items-start gap-4 mb-6">
        <Avatar nome={aluno.nome} size={56} />
        <div className="flex-1 min-w-[220px]">
          <h1 className="font-display text-3xl">{aluno.nome}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted">
            {aluno.status === "inativo" ? <Badge situacao="cancelada" /> : proxima ? <Badge situacao={proxima.situacao} /> : <Badge situacao="paga" />}
            <span>{fmtPhoneBR(aluno.telefone)}</span>
            {aluno.email ? <span>· {aluno.email}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/alunos/${aluno.id}/editar`} className="btn btn-ghost"><Pencil size={15} /> Editar</Link>
          {proxima ? (
            <AcoesCobrancaWhatsApp
              alunoId={aluno.id}
              mensalidadeId={proxima.id}
              tipo={proxima.situacao === "atrasada" ? "atraso_1" : proxima.situacao === "hoje" ? "vencimento" : "lembrete"}
              checkoutUrlInicial={cobrancaPorMensalidade.get(proxima.id)?.checkout_url}
            />
          ) : null}
          <RegistrarPagamento abertas={abertas.map((a: any) => ({ id: a.id, vencimento: a.vencimento, valor: a.valor }))} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Mensalidade" value={fmtBRL(matricula?.valor ?? 0)} hint={matricula?.planos?.nome || "Sem plano"} />
        <StatCard label="Próximo vencimento" value={proxima ? fmtDateBR(proxima.vencimento) : "—"} />
        <StatCard label="Total pago" value={fmtBRL(totalPago)} tone="ok" />
      </div>

      <h2 className="font-display text-xl mb-3">Histórico financeiro</h2>
      <div className="card overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="p-3">Vencimento</th><th className="p-3">Valor</th><th className="p-3">Pagamento</th>
                <th className="p-3">Situação</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(mensalidades || []).map((m: any) => {
                const pg = (pagamentos || []).find((p) => p.mensalidade_id === m.id && p.status === "confirmado");
                return (
                  <tr key={m.id} className="border-t border-line">
                    <td className="p-3 font-medium">{fmtDateBR(m.vencimento)}</td>
                    <td className="p-3">{fmtBRL(m.valor)}</td>
                    <td className="p-3 text-muted">{pg ? `${fmtDateBR(pg.pago_em)} · ${pg.metodo}` : "—"}</td>
                    <td className="p-3"><Badge situacao={m.situacao} /></td>
                    <td className="p-3">
                      {m.situacao !== "paga" && m.situacao !== "cancelada" ? (
                        <AcoesCobrancaWhatsApp
                          alunoId={aluno.id} mensalidadeId={m.id}
                          tipo={m.situacao === "atrasada" ? "atraso_1" : "lembrete"}
                          checkoutUrlInicial={cobrancaPorMensalidade.get(m.id)?.checkout_url}
                          tamanho="sm"
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!mensalidades?.length ? <EmptyState title="Sem mensalidades geradas" message="Confira o ciclo no cadastro." /> : null}
      </div>

      <h2 className="font-display text-xl mb-3">Comunicação</h2>
      <div className="card p-4 mb-8">
        {mensagens?.length ? (
          <div className="flex flex-col divide-y divide-line">
            {mensagens.map((m: any) => (
              <div key={m.id} className="py-2 flex items-center gap-3 text-sm">
                <span className="text-muted w-16">{fmtDateBR(m.criada_em)}</span>
                <span className="font-medium capitalize">{m.tipo.replace("_", " ")}</span>
                <span className="text-muted flex-1">WhatsApp</span>
                <Badge situacao={m.status === "enviada" ? "paga" : "pendente"} />
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted">Nenhuma mensagem registrada ainda.</p>}
      </div>

      <div className="card p-5">
        <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-3">Matrícula</p>
        <div className="flex flex-wrap gap-2">
          <InativarBotao alunoId={aluno.id} status={aluno.status} />
          {isAdmin ? <ExcluirAlunoBotao alunoId={aluno.id} nome={aluno.nome} /> : null}
        </div>
      </div>
    </div>
  );
}
