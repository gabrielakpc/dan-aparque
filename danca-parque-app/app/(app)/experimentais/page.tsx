import { createClient } from "@/lib/supabase/server";
import { fmtDateBR, fmtPhoneBR } from "@/lib/format";
import { EmptyState } from "@/components/ui";
import { NovaExperimentalBotao } from "./NovaExperimentalBotao";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  agendada: "badge-off", compareceu: "badge-warn", nao_compareceu: "badge-off",
  converteu: "badge-ok", nao_converteu: "badge-bad",
};
const LABELS: Record<string, string> = {
  agendada: "Agendada", compareceu: "Compareceu", nao_compareceu: "Não compareceu",
  converteu: "Converteu", nao_converteu: "Não converteu",
};

export default async function ExperimentaisPage() {
  const supabase = await createClient();
  const { data: aulas } = await supabase
    .from("aulas_experimentais")
    .select("*, turmas(nome)")
    .order("data", { ascending: false });
  const { data: turmas } = await supabase.from("turmas").select("id, nome").eq("ativo", true);

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1">Captação</p>
          <h1 className="font-display text-2xl">Aulas experimentais</h1>
        </div>
        <NovaExperimentalBotao turmas={turmas || []} />
      </div>

      {!aulas?.length ? (
        <div className="card"><EmptyState title="Nenhuma aula experimental" message="Registre quem vem conhecer a aula." /></div>
      ) : (
        <div className="flex flex-col gap-2">
          {aulas.map((a: any) => (
            <div key={a.id} className="card p-3.5 flex flex-wrap items-center gap-3">
              <div className="min-w-[140px]">
                <p className="font-semibold text-sm">{a.nome}</p>
                <p className="text-xs text-muted">{fmtDateBR(a.data)} · {a.turmas?.nome || "turma a definir"} · {fmtPhoneBR(a.telefone)}</p>
              </div>
              <span className={`badge ${STATUS[a.status]} ml-auto`}>{LABELS[a.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
