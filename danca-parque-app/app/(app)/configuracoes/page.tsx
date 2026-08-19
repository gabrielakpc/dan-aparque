import { createClient } from "@/lib/supabase/server";
import { ConfigTabs } from "./ConfigTabs";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: usuario } = await supabase.from("usuarios").select("papel, escolas(*)").eq("id", auth.user!.id).single<any>();

  return (
    <div>
      <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1">Sistema</p>
      <h1 className="font-display text-2xl mb-6">Configurações</h1>
      <ConfigTabs escola={usuario.escolas} admin={usuario.papel === "administrador"} />
    </div>
  );
}
