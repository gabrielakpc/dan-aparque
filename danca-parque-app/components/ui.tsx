import { SITUACAO_MENSALIDADE, type SituacaoMensalidade } from "@/lib/format";

export function Badge({ situacao }: { situacao: SituacaoMensalidade }) {
  const s = SITUACAO_MENSALIDADE[situacao];
  if (!s) return null;
  return <span className={`badge badge-${s.tone}`}>{s.label}</span>;
}

export function StatCard({
  label, value, hint, tone,
}: { label: string; value: string | number; hint?: string; tone?: "ok" | "warn" | "bad" }) {
  const cor = tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-ink";
  return (
    <div className="card p-4">
      <p className="text-[11px] tracking-[0.1em] uppercase text-muted font-semibold mb-2">{label}</p>
      <p className={`font-sans font-extrabold text-3xl leading-none tracking-tight ${cor}`}>{value}</p>
      {hint ? <p className="text-xs text-muted mt-2">{hint}</p> : null}
    </div>
  );
}

export function Avatar({ nome, size = 34 }: { nome?: string | null; size?: number }) {
  const ini = String(nome || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div
      className="flex-none flex items-center justify-center rounded-full bg-blush text-wine font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {ini}
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="text-center py-12 px-6">
      <p className="font-display text-lg font-semibold mb-1">{title}</p>
      <p className="text-sm text-muted max-w-sm mx-auto">{message}</p>
    </div>
  );
}
