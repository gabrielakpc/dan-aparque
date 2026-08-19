import { createClient } from "@/lib/supabase/server";
import { fmtBRL, fmtDateBR } from "@/lib/format";
import { SimularBotao } from "./SimularBotao";

/**
 * Esta página só existe para o modo de teste. Ela imita a tela de checkout
 * da InfinitePay o suficiente para você testar o fluxo inteiro sem gerar
 * nenhuma cobrança real. Quando "id" for o id da mensalidade (order_nsu),
 * buscamos a cobrança de teste correspondente.
 */
export default async function PagamentoTestePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: cobranca } = await supabase
    .from("cobrancas")
    .select("id, valor_centavos, status, mensalidades(vencimento), alunos(nome)")
    .eq("order_nsu", id)
    .eq("teste", true)
    .order("criada_em", { ascending: false })
    .maybeSingle<any>();

  if (!cobranca) {
    return <div className="min-h-screen flex items-center justify-center p-6 text-center text-sm text-muted">Cobrança de teste não encontrada.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-paper">
      <div className="card p-6 max-w-sm w-full text-center">
        <p className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1">Simulação — modo de teste</p>
        <h1 className="font-display text-2xl mb-4">Checkout simulado</h1>
        <p className="text-sm text-muted mb-1">{cobranca.alunos?.nome}</p>
        <p className="font-sans font-extrabold text-3xl mb-1">{fmtBRL(cobranca.valor_centavos / 100)}</p>
        <p className="text-xs text-muted mb-6">Referente à mensalidade de {fmtDateBR(cobranca.mensalidades?.vencimento)}</p>
        {cobranca.status === "paga" ? (
          <p className="badge badge-ok">Pagamento já confirmado</p>
        ) : (
          <SimularBotao cobrancaId={cobranca.id} />
        )}
        <p className="text-xs text-muted mt-6">
          Nenhum pagamento real acontece aqui. Esta tela some assim que o modo de teste for desligado em Configurações → Pagamentos.
        </p>
      </div>
    </div>
  );
}
