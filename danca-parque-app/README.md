# Dança Parque — Matrículas (V1 + V2)

Sistema de gestão de alunos, mensalidades, cobrança automática via InfinitePay
e mensagens de WhatsApp para o Dança Parque.

## O que está aqui

- **V1** — alunos, matrículas, mensalidades, pagamentos manuais, turmas,
  aulas experimentais, calendário e relatórios.
- **V2** — geração de cobrança InfinitePay por mensalidade, confirmação
  automática via webhook, botão de WhatsApp com mensagem pré-preenchida,
  tela "Mensagens de hoje" e histórico de comunicação por aluno.

Todas as regras de negócio (cálculo de vencimento, status financeiro,
renovação automática, "não gerar cobrança duplicada") vivem dentro do banco
de dados — nas funções e gatilhos do arquivo `supabase-danca-parque-completo.sql`
que você já rodou no Supabase. Este projeto é a camada de tela por cima disso.

## Publicando na Vercel

1. Suba esta pasta para um repositório no GitHub (ou arraste a pasta direto
   na Vercel, se preferir esse caminho).
2. Em **New Project** na Vercel, importe o repositório.
3. Em **Settings → Environment Variables**, adicione as quatro variáveis
   abaixo (os valores reais foram enviados separadamente, por segurança —
   não estão neste arquivo nem no restante do código):

   | Nome | O que é |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key do Supabase |
   | `SUPABASE_SECRET_KEY` | Secret key do Supabase (nunca vai para o navegador) |
   | `NEXT_PUBLIC_SITE_URL` | O endereço que a Vercel vai te dar, ex. `https://danca-parque.vercel.app` — **preencha depois do primeiro deploy** |
   | `INFINITEPAY_WEBHOOK_TOKEN` | Token que protege o webhook — gerado uma vez, não precisa trocar |

4. Clique em **Deploy**.
5. Depois que o site estiver no ar, copie o endereço que a Vercel deu,
   volte em Environment Variables, preencha `NEXT_PUBLIC_SITE_URL` com esse
   endereço, e clique em **Redeploy**. Esse passo é o que faz o webhook da
   InfinitePay saber para onde mandar o aviso de pagamento.

## Modo de teste

O sistema nasce com `modo_teste = true` no banco. Nesse modo, o botão
"Gerar pagamento" cria uma cobrança de mentira com uma tela própria
(`/teste/pagamento/[id]`) onde dá para simular a aprovação e conferir que
tudo — mensalidade fechando, próxima sendo criada, WhatsApp de confirmação —
funciona de ponta a ponta, sem envolver dinheiro real.

Para ligar cobranças de verdade: Configurações → Pagamentos → desmarque
"Modo de teste".

## Estrutura

```
app/
  login/                    tela de entrada
  (app)/                    tudo que exige login (sidebar + menu inferior)
    hoje/                   painel principal
    alunos/                 lista, cadastro, perfil
    mensalidades/           todas as mensalidades
    cobrancas/               cobranças InfinitePay geradas
    mensagens/               "Mensagens de hoje" (o motor da V2)
    turmas/ experimentais/ calendario/ relatorios/ configuracoes/
  api/webhook/infinitepay/  webhook de confirmação de pagamento
  teste/pagamento/[id]/     checkout simulado (modo de teste)
lib/
  supabase/                 clientes do Supabase (navegador, servidor, service role)
  actions/                  toda escrita no banco passa por aqui (server actions)
  infinitepay.ts            integração com a API oficial de checkout
  whatsapp.ts                geração de link wa.me e substituição de variáveis
  format.ts                  datas, moeda, telefone em pt-BR
```

## O que ainda depende de você

- Rodar o SQL no Supabase (já feito, se você seguiu o passo a passo).
- Configurar as variáveis de ambiente na Vercel (acima).
- Conferir sua InfiniteTag em Configurações → Pagamentos.
- Testar o fluxo completo em modo de teste antes de desligá-lo.
