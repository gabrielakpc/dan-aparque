import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtBRL, fmtDateBR } from "@/lib/format";
import { Avatar, Badge, EmptyState } from "@/components/ui";
import { AcoesCobrancaWhatsApp } from "@/components/AcoesCobrancaWhatsApp";

export const dynamic = "force-dynamic";

const FILTROS = [
  { id: "aberto", label: "Em aberto" }, { id: "atrasada", label: "Atrasadas" },
  { id: "paga", label: "Pagas" }, { id: "todas", label: "Todas" },
];

export default async function MensalidadesPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f = "aberto" } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("v_situacao_mensalidades").select("*").order("vencimento", { ascending: true });
  if (f === "aberto") query = query.in("situacao", ["atrasada", "hoje", "breve", "pendente"]);
  if (f === "atrasada") query = query.eq("situacao", "atrasada");
  if (f === "paga") query = query.eq("situacao", "paga");

  const { data: linhas } = await query;

  const { data: cobrancas } = await supabase.from("cobrancas").select("mensalidade_id, checkout_url").in("status", ["criada", "pendente"]);
  const cobrancaPorMensalidade = new Map((cobrancas || []).map((c) => [c.mensalidade_id, c.checkout_url]));

  const total = (linhas || []).reduce((s, l) => s + Number(l.valor), 0);

  return (
    <div>
      <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1">Financeiro</p>
      <h1 className="font-display text-2xl mb-1">Mensalidades</h1>
      <p className="text-sm text-muted mb-5">{linhas?.length || 0} mensalidades · {fmtBRL(total)}</p>

      <div className="flex gap-2 mb-5 border-b border-line overflow-x-auto">
        {FILTROS.map((ft) => (
          <Link key={ft.id} href={`/mensalidades?f=${ft.id}`}
            className={`pb-2 px-1 mr-4 text-sm font-semibold whitespace-nowrap border-b-2 ${f === ft.id ? "border-wine text-wine" : "border-transparent text-muted"}`}>
            {ft.label}
          </Link>
        ))}
      </div>

      {!linhas?.length ? (
        <div className="card"><EmptyState title="Nada por aqui" message="Nenhuma mensalidade corresponde a este filtro." /></div>
      ) : (
        <div className="flex flex-col gap-2">
          {linhas.map((m: any) => (
            <div key={m.id} className="card p-3.5 flex flex-wrap items-center gap-3">
              <Avatar nome={m.aluno} size={30} />
              <Link href={`/alunos/${m.aluno_id}`} className="min-w-[140px]">
                <p className="font-semibold text-sm">{m.aluno}</p>
                <p className="text-xs text-muted">{fmtDateBR(m.vencimento)}</p>
              </Link>
              <span className="font-semibold text-sm">{fmtBRL(m.valor)}</span>
              <Badge situacao={m.situacao} />
              {m.situacao !== "paga" && m.situacao !== "cancelada" ? (
                <div className="ml-auto">
                  <AcoesCobrancaWhatsApp
                    alunoId={m.aluno_id} mensalidadeId={m.id}
                    tipo={m.situacao === "atrasada" ? "atraso_1" : "lembrete"}
                    checkoutUrlInicial={cobrancaPorMensalidade.get(m.id)}
                    tamanho="sm"
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
