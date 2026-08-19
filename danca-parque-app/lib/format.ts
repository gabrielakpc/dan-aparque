export const fmtBRL = (v: number | string) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDateBR = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

export const onlyDigits = (s: string | null | undefined) => String(s || "").replace(/\D/g, "");

export const fmtPhoneBR = (s: string | null | undefined) => {
  const d = onlyDigits(s).replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return s || "";
};

export const todayISO = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export const diffDays = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

export type SituacaoMensalidade = "paga" | "hoje" | "breve" | "pendente" | "atrasada" | "cancelada";

export const SITUACAO_MENSALIDADE: Record<SituacaoMensalidade, { label: string; tone: string }> = {
  paga: { label: "Pago", tone: "ok" },
  hoje: { label: "Vence hoje", tone: "warn" },
  breve: { label: "Vence em breve", tone: "warn" },
  pendente: { label: "Pendente", tone: "off" },
  atrasada: { label: "Atrasado", tone: "bad" },
  cancelada: { label: "Cancelado", tone: "off" },
};
