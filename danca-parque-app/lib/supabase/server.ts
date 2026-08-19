import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente com a sessão do usuário logado. Todas as leituras e escritas
 * passam pelas políticas de RLS do banco — cada pessoa só vê a própria
 * escola, e só o administrador altera configurações. Isso não é apenas
 * uma checagem de tela: está garantido dentro do Postgres.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chamado a partir de um Server Component — o middleware cuida do refresh
          }
        },
      },
    }
  );
}

/**
 * Cliente com a chave secreta (service role). Ignora RLS.
 * Usar SOMENTE em rotas de servidor que não recebem sessão de usuário —
 * no projeto, apenas o webhook da InfinitePay. Nunca importar em código
 * que roda no navegador.
 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}
