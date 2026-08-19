import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sair } from "@/lib/actions/auth";
import {
  LayoutGrid, Users, Wallet, CalendarDays, GraduationCap, Sparkles,
  BarChart3, Settings, CreditCard, MessageCircle, LogOut,
} from "lucide-react";

const NAV = [
  { href: "/hoje", label: "Hoje", icon: LayoutGrid },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/mensalidades", label: "Mensalidades", icon: Wallet },
  { href: "/cobrancas", label: "Cobranças", icon: CreditCard },
  { href: "/mensagens", label: "Mensagens de hoje", icon: MessageCircle },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/turmas", label: "Turmas", icon: GraduationCap },
  { href: "/experimentais", label: "Experimentais", icon: Sparkles },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];
const MOBILE = ["/hoje", "/alunos", "/mensagens", "/mensalidades"];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nome, papel, escolas(nome, subtitulo)")
    .eq("id", auth.user.id)
    .single<any>();

  const nomeEscola = usuario?.escolas?.nome || "Dança Parque";

  return (
    <div className="min-h-screen bg-paper">
      <div className="flex">
        <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 p-4 bg-white border-r border-line">
          <div className="px-2 py-3 mb-2">
            <p className="font-display text-xl leading-none">
              <span className="font-semibold">Dança</span>{" "}
              <em className="not-italic italic font-medium text-wine">Parque</em>
            </p>
            <p className="text-xs text-muted mt-1.5">{usuario?.escolas?.subtitulo}</p>
          </div>
          <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="nav-item">
                <n.icon size={17} /> {n.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-line pt-3">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-blush text-wine flex items-center justify-center text-xs font-semibold">
                {(usuario?.nome || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{usuario?.nome}</p>
                <p className="text-xs text-muted">{usuario?.papel === "administrador" ? "Administrador" : "Gerente"}</p>
              </div>
            </div>
            <form action={sair}>
              <button className="nav-item w-full"><LogOut size={16} /> Sair</button>
            </form>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-paper/90 backdrop-blur border-b border-line">
            <p className="font-display text-lg">
              <span className="font-semibold">Dança</span>{" "}
              <em className="not-italic italic font-medium text-wine">Parque</em>
            </p>
            <form action={sair}><button className="btn btn-ghost btn-sm"><LogOut size={14} /></button></form>
          </header>
          <main className="px-4 md:px-8 py-6 pb-24 md:pb-10 max-w-7xl">{children}</main>
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex bg-white border-t border-line">
        {NAV.filter((n) => MOBILE.includes(n.href)).map((n) => (
          <Link key={n.href} href={n.href} className="flex-1 flex flex-col items-center gap-1 py-2.5 text-muted">
            <n.icon size={19} />
            <span className="text-[11px] font-semibold">{n.label.split(" ")[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
