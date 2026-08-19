/**
 * Integração com o Checkout Integrado da InfinitePay.
 * Baseado na documentação oficial: https://www.infinitepay.io/checkout-documentacao
 *
 * A conta é identificada só pela InfiniteTag (handle) — não existe chave de
 * API para esse produto. O segredo do projeto é o token do webhook, gerado
 * por nós, que vai embutido na própria webhook_url de cada cobrança.
 */

const BASE = "https://api.checkout.infinitepay.io";

export type CriarLinkInput = {
  handle: string;
  orderNsu: string;
  valorCentavos: number;
  descricao: string;
  webhookUrl: string;
  redirectUrl?: string;
  cliente?: { nome?: string; telefone?: string };
};

export async function criarLinkPagamento(input: CriarLinkInput) {
  const body = {
    handle: input.handle,
    order_nsu: input.orderNsu,
    webhook_url: input.webhookUrl,
    redirect_url: input.redirectUrl,
    items: [{ quantity: 1, price: input.valorCentavos, description: input.descricao }],
    ...(input.cliente?.nome || input.cliente?.telefone
      ? {
          customer: {
            name: input.cliente?.nome,
            phone_number: input.cliente?.telefone,
          },
        }
      : {}),
  };

  const res = await fetch(`${BASE}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new Error(`InfinitePay recusou a criação do link (${res.status}): ${texto}`);
  }
  const data = (await res.json()) as { url: string };
  if (!data.url) throw new Error("InfinitePay não retornou um link de pagamento.");
  return data;
}

export type PaymentCheckInput = {
  handle: string;
  orderNsu: string;
  transactionNsu?: string;
  slug?: string;
};

/**
 * Confirma diretamente com a InfinitePay se um pedido foi de fato pago.
 * Como o produto não documenta assinatura de webhook, é ESTA chamada —
 * não o corpo do webhook — que decide se marcamos algo como pago.
 */
export async function conferirPagamento(input: PaymentCheckInput) {
  const res = await fetch(`${BASE}/payment_check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: input.handle,
      order_nsu: input.orderNsu,
      transaction_nsu: input.transactionNsu,
      slug: input.slug,
    }),
  });
  if (!res.ok) return { success: false, paid: false } as const;
  return (await res.json()) as {
    success: boolean;
    paid: boolean;
    amount?: number;
    paid_amount?: number;
    installments?: number;
    capture_method?: string;
  };
}
