import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditarAlunoForm } from "./EditarAlunoForm";
import { ArrowLeft } from "lucide-react";

export default async function EditarAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: aluno } = await supabase.from("alunos").select("*").eq("id", id).single();
  if (!aluno) notFound();

  const [{ data: matricula }, { data: planos }, { data: turmas }, { data: vinculos }] = await Promise.all([
    supabase.from("matriculas").select("*").eq("aluno_id", id).eq("ativa", true).maybeSingle(),
    supabase.from("planos").select("id, nome, valor").eq("ativo", true),
    supabase.from("turmas").select("id, nome").eq("ativo", true),
    supabase.from("aluno_turmas").select("turma_id").eq("aluno_id", id),
  ]);

  return (
    <div>
      <Link href={`/alunos/${id}`} className="btn btn-ghost btn-sm mb-3"><ArrowLeft size={14} /> Voltar</Link>
      <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1">Cadastro</p>
      <h1 className="font-display text-2xl mb-6">Editar {aluno.nome}</h1>
      <EditarAlunoForm
        aluno={aluno}
        matricula={matricula}
        planos={planos || []}
        turmas={turmas || []}
        turmasAtuais={(vinculos || []).map((v) => v.turma_id)}
      />
    </div>
  );
}
