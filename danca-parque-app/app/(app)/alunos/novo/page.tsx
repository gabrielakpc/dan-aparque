import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";
import { NovoAlunoForm } from "./NovoAlunoForm";

export default async function NovoAlunoPage() {
  const supabase = await createClient();
  const [{ data: planos }, { data: turmas }, { data: usuario }] = await Promise.all([
    supabase.from("planos").select("id, nome, valor").eq("ativo", true),
    supabase.from("turmas").select("id, nome").eq("ativo", true),
    supabase.auth.getUser(),
  ]);
  const { data: perfil } = await supabase.from("usuarios").select("escolas(valor_padrao)").eq("id", usuario.user!.id).single<any>();

  return (
    <div>
      <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1">Cadastro</p>
      <h1 className="font-display text-2xl mb-6">Novo aluno</h1>
      <NovoAlunoForm
        planos={planos || []}
        turmas={turmas || []}
        valorPadrao={perfil?.escolas?.valor_padrao ?? 80}
        hoje={todayISO()}
      />
    </div>
  );
}
