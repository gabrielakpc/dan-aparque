import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui";
import { NovaTurmaBotao } from "./NovaTurmaBotao";

export const dynamic = "force-dynamic";
const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function TurmasPage() {
  const supabase = await createClient();
  const { data: turmas } = await supabase.from("turmas").select("*").order("dia_semana");
  const { data: vinculos } = await supabase.from("aluno_turmas").select("turma_id, alunos(nome, status)");

  const contagem = new Map<string, number>();
  (vinculos || []).forEach((v: any) => {
    if (v.alunos?.status === "ativo") contagem.set(v.turma_id, (contagem.get(v.turma_id) || 0) + 1);
  });

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1">Aulas</p>
          <h1 className="font-display text-2xl">Turmas</h1>
        </div>
        <NovaTurmaBotao />
      </div>

      {!turmas?.length ? (
        <div className="card"><EmptyState title="Nenhuma turma cadastrada" message="Cadastre as turmas para vincular alunos." /></div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {turmas.map((t) => (
            <div key={t.id} className="card p-5">
              <p className="font-display text-lg">{t.nome}</p>
              <p className="text-sm text-muted mt-0.5">{DIAS[t.dia_semana]} · {t.horario?.slice(0, 5)} · {t.professor}</p>
              <div className="border-t border-line pt-3 mt-3 flex items-center justify-between">
                <p className="font-sans font-semibold text-sm">{contagem.get(t.id) || 0} / {t.capacidade}</p>
                <span className={`badge ${t.ativo ? "badge-ok" : "badge-off"}`}>{t.ativo ? "Ativa" : "Inativa"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
