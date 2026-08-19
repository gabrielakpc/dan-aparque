import { createClient } from "@/lib/supabase/server";
import { fmtBRL, fmtDateBR } from "@/lib/format";
import { Avatar, EmptyState } from "@/components/ui";
import { AcoesCobrancaWhatsApp } from "@/components/AcoesCobrancaWhatsApp";

export const dynamic = "force-dynamic";

const TITULOS: Record<string, string> = {
  lembrete: "Vencem em breve", vencimento: "Vencem hoje", atraso_1: "Atrasados (1 dia)", atraso_2: "Atrasados",
};

export default async function MensagensDeHojePage() {
  const supabase = await createClient();
  const { data: linhas } = await supabase
    .from("v_mensagens_de_hoje")
    .select("*")
    .order("tipo_sugerido")
    .order("vencimento");

  const grupos: Record<string, any[]> = {};
  (linhas || []).forEach((l: any) => {
    if (!l.tipo_sugerido) return;
    (grupos[l.tipo_sugerido] ||= []).push(l);
  });
  const enviadas = (linhas || []).filter((l: any) => l.status_mensagem === "enviada").length;
  const pendentes = (linhas || []).length - enviadas;

  return (
    <div>
      <p className="text-[11px] tracking-[0.14em] uppercase text-muted font-semibold mb-1">WhatsApp</p>
      <h1 className="font-display text-2xl mb-1">Mensagens de hoje</h1>
      <p className="text-sm text-muted mb-6">{pendentes} para enviar · {enviadas} já enviadas</p>

      {!linhas?.length ? (
        <div className="card"><EmptyState title="Nada para enviar hoje" message="Quando alguém estiver próximo do vencimento ou atrasado, aparece aqui." /></div>
      ) : (
        Object.entries(grupos).map(([tipo, itens]) => (
          <div key={tipo} className="mb-8">
            <h2 className="font-display text-lg mb-3">{TITULOS[tipo] || tipo}</h2>
            <div className="flex flex-col gap-2">
              {itens.map((m: any) => (
                <div key={m.mensalidade_id} className="card p-3.5 flex flex-wrap items-center gap-3">
                  <Avatar nome={m.aluno} size={32} />
                  <div className="min-w-[140px]">
                    <p className="font-semibold text-sm">{m.aluno}</p>
                    <p className="text-xs text-muted">{fmtDateBR(m.vencimento)} · {fmtBRL(m.valor)}</p>
                  </div>
                  {m.status_mensagem === "enviada" ? (
                    <span className="badge badge-ok ml-auto sm:ml-0">Enviado</span>
                  ) : null}
                  <div className="ml-auto">
                    <AcoesCobrancaWhatsApp
                      alunoId={m.aluno_id} mensalidadeId={m.mensalidade_id}
                      tipo={tipo as any}
                      checkoutUrlInicial={m.checkout_url}
                      tamanho="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
