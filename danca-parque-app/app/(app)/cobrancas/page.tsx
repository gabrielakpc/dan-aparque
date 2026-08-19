import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtBRL, fmtDateBR } from "@/lib/format";
import { Avatar, EmptyState } from "@/components/ui";
import { ExternalLink, Copy } from "lucide-react";

export const dynamic = "force-dynamic";

const TONS: Record<string, string> = {
  criada: "badge-off", pendente: "badge-warn", paga: "badge-ok",
  expirada: "badge-off", cancelada: "badge-off", erro: "badge-bad",
};
const LABELS: Record<string, string> = {
  criada: "Criada", pendente: "Pendente", paga: "Paga", expirada: "Expirada", cancelada: "Cancelada", erro: "Erro",
};

const FILTROS = ["todas", "criada", "paga", "erro"];

export default async function CobrancasPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f = "todas" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("cobrancas")
    .select("id, valor_centavos, status, checkout_url, teste, criada_em, mensalidades(vencimento), alunos(nome)")
    .order("criada_em", { ascending: false })
    .limit(100);
  if (f !== "todas") query = query.eq("status", f);
  const { data: cobrancas } = await query.returns<any[]>();

  return (
    <div>
      <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1">Pagamentos</p>
      <h1 className="font-display text-2xl mb-5">Cobranças</h1>

      <div className="flex gap-2 mb-5 border-b border-line overflow-x-auto">
        {FILTROS.map((id) => (
          <Link key={id} href={`/cobrancas?f=${id}`}
            className={`pb-2 px-1 mr-4 text-sm font-semibold whitespace-nowrap border-b-2 ${f === id ? "border-wine text-wine" : "border-transparent text-muted"}`}>
            {id === "todas" ? "Todas" : LABELS[id]}
          </Link>
        ))}
      </div>

      {!cobrancas?.length ? (
        <div className="card"><EmptyState title="Nenhuma cobrança gerada" message="Cobranças aparecem aqui assim que forem criadas pela tela do aluno ou de mensalidades." /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="p-3">Aluno</th><th className="p-3">Valor</th><th className="p-3">Vencimento</th>
                <th className="p-3">Status</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {cobrancas.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="p-3 flex items-center gap-2"><Avatar nome={c.alunos?.nome} size={26} /> {c.alunos?.nome}{c.teste ? <span className="text-[10px] text-muted">(teste)</span> : null}</td>
                  <td className="p-3">{fmtBRL(c.valor_centavos / 100)}</td>
                  <td className="p-3 text-muted">{fmtDateBR(c.mensalidades?.vencimento)}</td>
                  <td className="p-3"><span className={`badge ${TONS[c.status]}`}>{LABELS[c.status]}</span></td>
                  <td className="p-3">
                    {c.checkout_url ? (
                      <a href={c.checkout_url} target="_blank" className="btn btn-ghost btn-sm"><ExternalLink size={13} /> Abrir</a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
