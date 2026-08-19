import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtBRL, fmtDateBR, todayISO } from "@/lib/format";
import { StatCard, Avatar, Badge, EmptyState } from "@/components/ui";
import { AcoesCobrancaWhatsApp } from "@/components/AcoesCobrancaWhatsApp";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HojePage() {
  const supabase = await createClient();
  const hoje = todayISO();

  const { data: usuario } = await supabase.auth.getUser();
  const { data: mensalidades } = await supabase
    .from("v_situacao_mensalidades")
    .select("*")
    .in("situacao", ["atrasada", "hoje", "breve"])
    .order("vencimento", { ascending: true });

  const { data: ativosCount } = await supabase.from("alunos").select("id", { count: "exact", head: true }).eq("status", "ativo");
  const { count: totalAtivos } = ativosCount as any as { count: number };

  const { data: pagamentosMes } = await supabase
    .from("pagamentos")
    .select("valor, pago_em")
    .eq("status", "confirmado")
    .gte("pago_em", `${hoje.slice(0, 7)}-01`);
  const receitaMes = (pagamentosMes || []).reduce((s, p) => s + Number(p.valor), 0);

  const { data: emAberto } = await supabase.from("v_situacao_mensalidades").select("valor, situacao").neq("situacao", "paga").neq("situacao", "cancelada");
  const aReceber = (emAberto || []).reduce((s, m) => s + Number(m.valor), 0);

  const { data: novos } = await supabase
    .from("alunos")
    .select("id, nome, criado_em")
    .eq("status", "ativo")
    .order("criado_em", { ascending: false })
    .limit(5);

  const atrasadas = (mensalidades || []).filter((m: any) => m.situacao === "atrasada");
  const hojeVence = (mensalidades || []).filter((m: any) => m.situacao === "hoje");
  const emBreve = (mensalidades || []).filter((m: any) => m.situacao === "breve");
  const alunosAtrasados = new Set(atrasadas.map((m: any) => m.aluno_id)).size;

  return (
    <div>
      <h1 className="font-sans text-2xl md:text-4xl font-extrabold leading-snug tracking-tight max-w-3xl mb-8">
        Hoje temos {totalAtivos ?? 0} alunos ativos, {hojeVence.length} mensalidades vencem hoje e {alunosAtrasados} alunos estão atrasados.
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-8">
        <StatCard label="Alunos ativos" value={totalAtivos ?? 0} />
        <StatCard label="Vencem hoje" value={hojeVence.length} tone={hojeVence.length ? "warn" : undefined} />
        <StatCard label="Vencendo em breve" value={emBreve.length} />
        <StatCard label="Atrasados" value={alunosAtrasados} tone={alunosAtrasados ? "bad" : undefined} />
        <StatCard label="Receita do mês" value={fmtBRL(receitaMes)} tone="ok" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1">Atenção</p>
          <h2 className="font-display text-2xl mb-4">O que precisa da sua ação</h2>
          <div className="flex flex-col gap-2">
            {[...atrasadas, ...hojeVence, ...emBreve].map((m: any) => (
              <div key={m.id} className={`card p-3 flex items-center gap-3 border-l-[3px] ${
                m.situacao === "atrasada" ? "border-l-bad" : "border-l-warn"
              }`}>
                <Avatar nome={m.aluno} />
                <Link href={`/alunos/${m.aluno_id}`} className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{m.aluno}</p>
                  <p className="text-xs text-muted truncate">
                    {m.situacao === "atrasada" ? `Vencido há ${Math.abs(m.dias)} dias` : m.situacao === "hoje" ? "Vence hoje" : `Vence em ${m.dias} dias`}
                    {" · "}{fmtDateBR(m.vencimento)}
                  </p>
                </Link>
                <span className="font-sans font-semibold text-sm hidden sm:block">{fmtBRL(m.valor)}</span>
                <AcoesCobrancaWhatsApp
                  alunoId={m.aluno_id}
                  mensalidadeId={m.id}
                  tipo={m.situacao === "atrasada" ? "atraso_1" : m.situacao === "hoje" ? "vencimento" : "lembrete"}
                  checkoutUrlInicial={m.checkout_url}
                  tamanho="sm"
                />
              </div>
            ))}
            {atrasadas.length + hojeVence.length + emBreve.length === 0 ? (
              <div className="card"><EmptyState title="Tudo em ordem por aqui" message="Nenhuma mensalidade vencida, vencendo hoje ou nos próximos dias." /></div>
            ) : null}
          </div>
        </div>

        <div>
          <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1">A receber</p>
          <h2 className="font-display text-2xl mb-4">{fmtBRL(aReceber)}</h2>
          <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1 mt-6">Novos alunos</p>
          <h3 className="font-display text-lg mb-3">Entraram há pouco</h3>
          <div className="flex flex-col gap-2">
            {(novos || []).map((a) => (
              <Link key={a.id} href={`/alunos/${a.id}`} className="card p-3 flex items-center gap-3">
                <Avatar nome={a.nome} size={28} />
                <span className="text-sm font-medium truncate">{a.nome}</span>
              </Link>
            ))}
            {!novos?.length ? <p className="text-sm text-muted">Nenhuma matrícula recente.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
