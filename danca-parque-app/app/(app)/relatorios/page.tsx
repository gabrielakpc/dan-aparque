import { createClient } from "@/lib/supabase/server";
import { fmtBRL, todayISO } from "@/lib/format";
import { StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const supabase = await createClient();
  const hoje = todayISO();
  const inicioMes = `${hoje.slice(0, 7)}-01`;

  const { data: pagamentos } = await supabase.from("pagamentos").select("valor, metodo").eq("status", "confirmado").gte("pago_em", inicioMes);
  const totalRecebido = (pagamentos || []).reduce((s, p) => s + Number(p.valor), 0);

  const { data: abertas } = await supabase.from("v_situacao_mensalidades").select("valor, situacao");
  const aReceber = (abertas || []).filter((m) => m.situacao !== "paga" && m.situacao !== "cancelada").reduce((s, m) => s + Number(m.valor), 0);
  const atrasado = (abertas || []).filter((m) => m.situacao === "atrasada").reduce((s, m) => s + Number(m.valor), 0);

  const { count: totalAlunos } = await supabase.from("alunos").select("id", { count: "exact", head: true });
  const { count: ativos } = await supabase.from("alunos").select("id", { count: "exact", head: true }).eq("status", "ativo");

  const { count: mensagensEnviadas } = await supabase.from("mensagens").select("id", { count: "exact", head: true }).eq("status", "enviada").gte("criada_em", inicioMes);
  const { count: cobrancasPagas } = await supabase.from("cobrancas").select("id", { count: "exact", head: true }).eq("status", "paga").gte("criada_em", inicioMes);

  const porForma = new Map<string, number>();
  (pagamentos || []).forEach((p) => porForma.set(p.metodo, (porForma.get(p.metodo) || 0) + Number(p.valor)));

  return (
    <div>
      <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1">Análise</p>
      <h1 className="font-display text-2xl mb-6">Relatórios do mês</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Recebido no mês" value={fmtBRL(totalRecebido)} tone="ok" />
        <StatCard label="A receber" value={fmtBRL(aReceber)} />
        <StatCard label="Em atraso" value={fmtBRL(atrasado)} tone={atrasado ? "bad" : undefined} />
        <StatCard label="Alunos ativos" value={`${ativos ?? 0} / ${totalAlunos ?? 0}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-3">Por forma de pagamento</p>
          {porForma.size ? [...porForma.entries()].map(([forma, valor]) => (
            <div key={forma} className="flex justify-between py-2 text-sm border-t border-line first:border-0">
              <span className="text-muted">{forma}</span><span className="font-semibold">{fmtBRL(valor)}</span>
            </div>
          )) : <p className="text-sm text-muted">Nenhum pagamento no mês.</p>}
        </div>
        <div className="card p-5">
          <p className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-3">WhatsApp e cobranças</p>
          <div className="flex justify-between py-2 text-sm border-t border-line first:border-0">
            <span className="text-muted">Mensagens enviadas no mês</span><span className="font-semibold">{mensagensEnviadas ?? 0}</span>
          </div>
          <div className="flex justify-between py-2 text-sm border-t border-line">
            <span className="text-muted">Cobranças pagas no mês</span><span className="font-semibold">{cobrancasPagas ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
