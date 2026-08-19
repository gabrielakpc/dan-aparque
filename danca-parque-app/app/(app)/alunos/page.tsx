import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtBRL, fmtDateBR, fmtPhoneBR } from "@/lib/format";
import { Avatar, Badge, EmptyState } from "@/components/ui";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AlunosPage({ searchParams }: { searchParams: Promise<{ q?: string; f?: string }> }) {
  const { q = "", f = "todos" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("alunos")
    .select("id, nome, telefone, status, matriculas(valor, dia_vencimento)")
    .order("nome");
  if (q) query = query.ilike("nome", `%${q}%`);
  if (f === "ativos") query = query.eq("status", "ativo");
  if (f === "inativos") query = query.eq("status", "inativo");

  const { data: alunos } = await query;

  const ids = (alunos || []).map((a) => a.id);
  const { data: proximas } = await supabase
    .from("v_situacao_mensalidades")
    .select("aluno_id, vencimento, situacao, valor")
    .in("aluno_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
    .neq("situacao", "paga")
    .neq("situacao", "cancelada")
    .order("vencimento", { ascending: true });

  const proximaPorAluno = new Map<string, any>();
  (proximas || []).forEach((p) => { if (!proximaPorAluno.has(p.aluno_id)) proximaPorAluno.set(p.aluno_id, p); });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1">Cadastro</p>
          <h1 className="font-display text-2xl">Alunos</h1>
        </div>
        <Link href="/alunos/novo" className="btn btn-primary"><Plus size={16} /> Novo aluno</Link>
      </div>

      <form className="flex flex-wrap gap-2 mb-4">
        <input className="input flex-1 min-w-[200px]" name="q" defaultValue={q} placeholder="Buscar por nome" />
        <select className="input max-w-[200px]" name="f" defaultValue={f}>
          <option value="todos">Todos</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
        </select>
        <button className="btn btn-ghost">Filtrar</button>
      </form>

      {!alunos?.length ? (
        <div className="card">
          <EmptyState title="Nenhum aluno encontrado" message="Ajuste a busca ou cadastre o primeiro aluno." />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alunos.map((a: any) => {
            const prox = proximaPorAluno.get(a.id);
            return (
              <Link key={a.id} href={`/alunos/${a.id}`} className="card p-3.5 flex items-center gap-3">
                <Avatar nome={a.nome} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{a.nome}</p>
                  <p className="text-xs text-muted truncate">
                    {prox ? `Vence ${fmtDateBR(prox.vencimento)} · ${fmtBRL(prox.valor)}` : fmtPhoneBR(a.telefone)}
                  </p>
                </div>
                {a.status === "inativo" ? <Badge situacao="cancelada" /> : prox ? <Badge situacao={prox.situacao} /> : <Badge situacao="paga" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
