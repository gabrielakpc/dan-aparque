import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtBRL, fmtDateBR, todayISO } from "@/lib/format";
import { Avatar, Badge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const supabase = await createClient();
  const hoje = todayISO();
  const daquiA30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const { data: linhas } = await supabase
    .from("v_situacao_mensalidades")
    .select("*")
    .neq("situacao", "cancelada")
    .gte("vencimento", hoje.slice(0, 7) + "-01")
    .lte("vencimento", daquiA30)
    .order("vencimento");

  const porDia = new Map<string, any[]>();
  (linhas || []).forEach((l: any) => {
    const arr = porDia.get(l.vencimento) || [];
    arr.push(l);
    porDia.set(l.vencimento, arr);
  });

  return (
    <div>
      <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1">Agenda financeira</p>
      <h1 className="font-display text-2xl mb-6">Calendário</h1>

      {porDia.size === 0 ? (
        <div className="card"><EmptyState title="Nenhum vencimento no período" message="Os próximos 30 dias aparecem aqui." /></div>
      ) : (
        <div className="flex flex-col gap-3">
          {[...porDia.entries()].map(([dia, itens]) => (
            <div key={dia} className="card p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-2">{fmtDateBR(dia)}</p>
              <div className="flex flex-col divide-y divide-line">
                {itens.map((m: any) => (
                  <Link href={`/alunos/${m.aluno_id}`} key={m.id} className="py-2 flex items-center gap-3">
                    <Avatar nome={m.aluno} size={26} />
                    <span className="flex-1 text-sm font-medium">{m.aluno}</span>
                    <span className="text-sm">{fmtBRL(m.valor)}</span>
                    <Badge situacao={m.situacao} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
