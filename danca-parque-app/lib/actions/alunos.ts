"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onlyDigits } from "@/lib/format";

export type EstadoAcao = { ok: boolean; erro?: string };

export async function criarAluno(_prev: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("escola_id")
    .eq("id", auth.user.id)
    .single();
  if (!usuario) return { ok: false, erro: "Usuário sem escola vinculada." };

  const nome = String(formData.get("nome") || "").trim();
  const telefone = onlyDigits(String(formData.get("telefone") || ""));
  const enrollDate = String(formData.get("data_matricula") || "");
  const cycleStart = String(formData.get("inicio_ciclo") || enrollDate);
  const dueDay = Number(formData.get("dia_vencimento") || 0);
  const valor = Number(formData.get("valor") || 0);
  const planoId = String(formData.get("plano_id") || "") || null;
  const turmaIds = formData.getAll("turmas").map(String).filter(Boolean);

  if (nome.length < 3) return { ok: false, erro: "Informe o nome completo." };
  if (telefone.length < 10) return { ok: false, erro: "WhatsApp inválido — informe com DDD." };
  if (!enrollDate) return { ok: false, erro: "Informe a data da matrícula." };
  if (!(dueDay >= 1 && dueDay <= 31)) return { ok: false, erro: "Dia de vencimento entre 1 e 31." };
  if (!(valor >= 0)) return { ok: false, erro: "Valor inválido." };

  const { data: existente } = await supabase
    .from("alunos")
    .select("id, nome")
    .eq("escola_id", usuario.escola_id)
    .eq("telefone", telefone)
    .maybeSingle();
  if (existente) return { ok: false, erro: `Já existe um aluno com este WhatsApp: ${existente.nome}.` };

  const { data: aluno, error: erroAluno } = await supabase
    .from("alunos")
    .insert({
      escola_id: usuario.escola_id,
      nome,
      telefone,
      email: String(formData.get("email") || "") || null,
      nascimento: String(formData.get("nascimento") || "") || null,
      origem: String(formData.get("origem") || "") || null,
      obs: String(formData.get("obs") || "") || null,
      obs_interna: String(formData.get("obs_interna") || "") || null,
    })
    .select("id")
    .single();
  if (erroAluno || !aluno) return { ok: false, erro: "Não foi possível salvar o aluno. Tente novamente." };

  const { data: matricula, error: erroMatricula } = await supabase
    .from("matriculas")
    .insert({
      aluno_id: aluno.id,
      plano_id: planoId,
      data_matricula: enrollDate,
      inicio_ciclo: cycleStart,
      dia_vencimento: dueDay,
      valor,
    })
    .select("id")
    .single();
  if (erroMatricula || !matricula) return { ok: false, erro: "Aluno salvo, mas a matrícula falhou. Abra o cadastro e tente de novo." };
  // a trigger matricula_gera_mensalidades já cria as mensalidades futuras

  if (turmaIds.length) {
    await supabase.from("aluno_turmas").insert(turmaIds.map((turma_id) => ({ aluno_id: aluno.id, turma_id })));
  }

  await supabase.from("auditoria").insert({
    escola_id: usuario.escola_id,
    usuario_id: auth.user.id,
    acao: "Aluno cadastrado",
    entidade: "aluno",
    entidade_id: aluno.id,
    detalhe: `${nome} — dia ${dueDay}, ${valor}`,
  });

  revalidatePath("/alunos");
  revalidatePath("/hoje");
  redirect(`/alunos/${aluno.id}`);
}

export async function editarAluno(alunoId: string, _prev: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, erro: "Sessão expirada." };

  const patch: Record<string, unknown> = {
    nome: String(formData.get("nome") || "").trim(),
    telefone: onlyDigits(String(formData.get("telefone") || "")),
    email: String(formData.get("email") || "") || null,
    origem: String(formData.get("origem") || "") || null,
    obs: String(formData.get("obs") || "") || null,
    obs_interna: String(formData.get("obs_interna") || "") || null,
  };
  const { error } = await supabase.from("alunos").update(patch).eq("id", alunoId);
  if (error) return { ok: false, erro: "Não foi possível salvar as alterações." };

  const matriculaId = String(formData.get("matricula_id") || "");
  const valor = Number(formData.get("valor") || 0);
  const dueDay = Number(formData.get("dia_vencimento") || 0);
  const cycleStart = String(formData.get("inicio_ciclo") || "");
  if (matriculaId && valor >= 0 && dueDay >= 1 && dueDay <= 31 && cycleStart) {
    // os gatilhos do banco cuidam de propagar só para mensalidades futuras em aberto
    await supabase
      .from("matriculas")
      .update({ valor, dia_vencimento: dueDay, inicio_ciclo: cycleStart })
      .eq("id", matriculaId);
  }

  revalidatePath(`/alunos/${alunoId}`);
  revalidatePath("/alunos");
  return { ok: true };
}

export async function inativarAluno(alunoId: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const hoje = new Date().toISOString().slice(0, 10);
  await supabase.from("alunos").update({ status: "inativo", inativo_em: hoje }).eq("id", alunoId);
  if (auth.user) {
    const { data: usuario } = await supabase.from("usuarios").select("escola_id").eq("id", auth.user.id).single();
    if (usuario) {
      await supabase.from("auditoria").insert({
        escola_id: usuario.escola_id, usuario_id: auth.user.id,
        acao: "Aluno inativado", entidade: "aluno", entidade_id: alunoId, detalhe: "",
      });
    }
  }
  revalidatePath(`/alunos/${alunoId}`);
  revalidatePath("/alunos");
  revalidatePath("/hoje");
}

export async function reativarAluno(alunoId: string) {
  const supabase = await createClient();
  await supabase.from("alunos").update({ status: "ativo", inativo_em: null }).eq("id", alunoId);
  revalidatePath(`/alunos/${alunoId}`);
  revalidatePath("/alunos");
}

export async function registrarPagamento(_prev: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, erro: "Sessão expirada." };

  const mensalidadeId = String(formData.get("mensalidade_id") || "");
  const valor = Number(formData.get("valor") || 0);
  const pagoEm = String(formData.get("pago_em") || "");
  const metodo = String(formData.get("metodo") || "");

  if (!mensalidadeId) return { ok: false, erro: "Selecione a mensalidade." };
  if (!(valor > 0)) return { ok: false, erro: "O valor precisa ser maior que zero." };
  if (!pagoEm) return { ok: false, erro: "Informe a data do pagamento." };

  const { data: m } = await supabase
    .from("mensalidades")
    .select("id, aluno_id, matricula_id")
    .eq("id", mensalidadeId)
    .single();
  if (!m) return { ok: false, erro: "Mensalidade não encontrada." };

  const { error } = await supabase.from("pagamentos").insert({
    mensalidade_id: m.id,
    aluno_id: m.aluno_id,
    valor,
    pago_em: pagoEm,
    metodo,
    recibo: String(formData.get("recibo") || "") || null,
    obs: String(formData.get("obs") || "") || null,
    registrado_por: auth.user.id,
  });
  if (error) return { ok: false, erro: "Não foi possível registrar o pagamento." };

  // mantém o horizonte de mensalidades futuras rolando
  await supabase.rpc("gerar_mensalidades", { p_matricula: m.matricula_id, p_horizonte_meses: 2 });

  const { data: usuario } = await supabase.from("usuarios").select("escola_id").eq("id", auth.user.id).single();
  if (usuario) {
    await supabase.from("auditoria").insert({
      escola_id: usuario.escola_id, usuario_id: auth.user.id,
      acao: "Pagamento registrado", entidade: "pagamento", entidade_id: m.aluno_id,
      detalhe: `Mensalidade ${mensalidadeId} — ${valor} via ${metodo}`,
    });
  }

  revalidatePath(`/alunos/${m.aluno_id}`);
  revalidatePath("/mensalidades");
  revalidatePath("/hoje");
  return { ok: true };
}

export async function estornarPagamento(pagamentoId: string, alunoId: string) {
  await (await createClient()).from("pagamentos").update({ status: "cancelado" }).eq("id", pagamentoId);
  revalidatePath(`/alunos/${alunoId}`);
  revalidatePath("/mensalidades");
  revalidatePath("/hoje");
}
