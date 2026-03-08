const express = require("express");
const router  = express.Router();
const { pool } = require("../db");

// ── Helper de autenticação (igual ao tlou.js) ─────────────────────────────────
async function getUserId(google_id) {
  const [rows] = await pool.query("SELECT id, name FROM users WHERE google_id = ?", [google_id]);
  return rows[0] || null;
}

// ── Helper: resolve id do NC pela tabela ──────────────────────────────────────
async function resolveNcId(nivel_shinobi, nc) {
  const [rows] = await pool.query(
    `SELECT id FROM naruto_niveis_campanha
      WHERE nc = ? AND nivel_shinobi = ?
      LIMIT 1`,
    [nc, nivel_shinobi]
  );
  if (!rows.length) throw new Error(`NC inválido: ${nivel_shinobi} (nc ${nc})`);
  return rows[0].id;
}

// ── Helper: calcula energias (livro pág. 21) ──────────────────────────────────
function calcEnergias(atributos, nc) {
  const vitalidade = 10 + 3 * (atributos.vigor      ?? 0) + 5 * nc;
  const chakra     = 10 + 3 * (atributos.espirito   ?? 0);
  return { vitalidade, chakra };
}

// ── POST /api/naruto/fichas ───────────────────────────────────────────────────
router.post("/fichas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });

  const {
    nc, nivel_shinobi,
    cla, tendencia,
    atributos, combate, sociais, pericias,
    nome_personagem, nome_jogador, vila,
    aparencia, personalidade, historico, objetivo,
    imagem,
  } = req.body;

  if (!nome_personagem?.trim())
    return res.status(400).json({ error: "nome_personagem é obrigatório." });
  if (!nc || !nivel_shinobi)
    return res.status(400).json({ error: "Nível de campanha obrigatório." });
  if (!cla)
    return res.status(400).json({ error: "Clã obrigatório." });
  if (!tendencia)
    return res.status(400).json({ error: "Tendência obrigatória." });

  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const ncId = await resolveNcId(nivel_shinobi, nc);
    const { vitalidade, chakra } = calcEnergias(atributos ?? {}, nc);

    const notasTexto = [
      vila          ? `Vila: ${vila}`                    : null,
      aparencia     ? `Aparência: ${aparencia}`           : null,
      personalidade ? `Personalidade: ${personalidade}`   : null,
      objetivo      ? `Objetivo: ${objetivo}`             : null,
    ].filter(Boolean).join("\n\n");

    const [result] = await pool.query(
      `INSERT INTO naruto_fichas (
        user_id, nome_jogador, nome_personagem, imagem,
        nc_id, cla_id, tendencia_id,
        atr_forca, atr_destreza, atr_agilidade, atr_percepcao,
        atr_inteligencia, atr_vigor, atr_espirito,
        hc_base_cc, hc_base_cd, hc_base_esq, hc_base_lm,
        carisma, manipulacao,
        vitalidade_maxima, vitalidade_atual,
        chakra_maximo, chakra_atual,
        ryos, dados_pericias,
        historico_personagem, notas
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        user.id,
        nome_jogador || user.name,
        nome_personagem.trim(),
        imagem || null,

        ncId, cla, tendencia,

        atributos?.forca        ?? 0,
        atributos?.destreza     ?? 0,
        atributos?.agilidade    ?? 0,
        atributos?.percepcao    ?? 0,
        atributos?.inteligencia ?? 0,
        atributos?.vigor        ?? 0,
        atributos?.espirito     ?? 0,

        combate?.bases?.CC  ?? 3,
        combate?.bases?.CD  ?? 3,
        combate?.bases?.ESQ ?? 3,
        combate?.bases?.LM  ?? 3,

        sociais?.carisma     ?? 0,
        sociais?.manipulacao ?? 0,

        vitalidade, vitalidade,
        chakra,     chakra,

        0,
        pericias ? JSON.stringify(pericias) : null,
        historico || null,
        notasTexto || null,
      ]
    );

    res.status(201).json({ id: result.insertId, message: "Ficha criada com sucesso." });
  } catch (err) {
    console.error("[naruto] POST /fichas erro:", err);
    if (err.message.startsWith("NC inválido"))
      return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/naruto/fichas  (lista do usuário logado) ────────────────────────
router.get("/fichas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [rows] = await pool.query(
      `SELECT
        f.id, f.nome_personagem, f.nome_jogador, f.imagem,
        n.nivel_shinobi, n.nc,
        c.nome  AS cla_nome, c.kekkei,
        t.nome  AS tendencia_nome,
        f.vitalidade_maxima, f.vitalidade_atual,
        f.chakra_maximo,     f.chakra_atual,
        f.criado_em, f.atualizado_em
       FROM naruto_fichas f
       JOIN naruto_niveis_campanha n ON f.nc_id        = n.id
       JOIN naruto_clas            c ON f.cla_id       = c.id
       JOIN naruto_tendencias      t ON f.tendencia_id = t.id
       WHERE f.user_id = ?
       ORDER BY f.criado_em DESC`,
      [user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("[naruto] GET /fichas erro:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/naruto/fichas/:id  (ficha completa) ─────────────────────────────
router.get("/fichas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [rows] = await pool.query(
      `SELECT
        f.*,
        n.nivel_shinobi, n.nc,
        n.pontos_atributo, n.pontos_pericia, n.pontos_poder, n.atributo_minimo,
        c.nome AS cla_nome, c.kekkei, c.descricao AS cla_descricao,
        t.nome AS tendencia_nome, t.eixo_etico, t.eixo_moral
       FROM naruto_fichas f
       JOIN naruto_niveis_campanha n ON f.nc_id        = n.id
       JOIN naruto_clas            c ON f.cla_id       = c.id
       JOIN naruto_tendencias      t ON f.tendencia_id = t.id
       WHERE f.id = ? AND f.user_id = ?`,
      [req.params.id, user.id]
    );

    if (!rows.length) return res.status(404).json({ error: "Ficha não encontrada" });

    const ficha = rows[0];
    for (const campo of ["dados_pericias", "poderes", "aptidoes", "equipamentos", "historico_rolagens"]) {
      if (typeof ficha[campo] === "string") {
        try { ficha[campo] = JSON.parse(ficha[campo]); } catch { ficha[campo] = null; }
      }
    }

    res.json(ficha);
  } catch (err) {
    console.error("[naruto] GET /fichas/:id erro:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/naruto/fichas/:id/salvar ────────────────────────────────────────
router.put("/fichas/:id/salvar", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });

  const CAMPOS_PERMITIDOS = [
    "nome_personagem", "nome_jogador", "imagem",
    "atr_forca", "atr_destreza", "atr_agilidade", "atr_percepcao",
    "atr_inteligencia", "atr_vigor", "atr_espirito",
    "hc_base_cc", "hc_base_cd", "hc_base_esq", "hc_base_lm",
    "carisma", "manipulacao",
    "vitalidade_atual", "chakra_atual",
    "vitalidade_maxima", "chakra_maximo",
    "ryos", "dados_pericias", "poderes", "aptidoes",
    "equipamentos", "historico_personagem", "notas", "historico_rolagens",
  ];

  const updates = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    if (req.body[campo] !== undefined) {
      updates[campo] = typeof req.body[campo] === "object"
        ? JSON.stringify(req.body[campo])
        : req.body[campo];
    }
  }

  if (!Object.keys(updates).length)
    return res.status(400).json({ error: "Nenhum campo válido para atualizar." });

  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const sets   = Object.keys(updates).map(k => `\`${k}\` = ?`).join(", ");
    const values = [...Object.values(updates), req.params.id, user.id];

    const [result] = await pool.query(
      `UPDATE naruto_fichas SET ${sets}, atualizado_em = NOW() WHERE id = ? AND user_id = ?`,
      values
    );

    if (!result.affectedRows)
      return res.status(404).json({ error: "Ficha não encontrada ou sem permissão." });

    res.json({ ok: true });
  } catch (err) {
    console.error("[naruto] PUT /fichas/:id/salvar erro:", err);
    res.status(500).json({ error: err.message });
  }
});


// ── POST /api/naruto/fichas/:id/duplicar ─────────────────────────────────────
router.post("/fichas/:id/duplicar", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM naruto_fichas WHERE user_id = ?", [user.id]
    );
    if (total >= 12) return res.status(400).json({ error: "Limite de 12 personagens atingido" });

    const [result] = await pool.query(`
      INSERT INTO naruto_fichas (
        user_id, nome_jogador, nome_personagem, imagem,
        nc_id, cla_id, tendencia_id,
        atr_forca, atr_destreza, atr_agilidade, atr_percepcao,
        atr_inteligencia, atr_vigor, atr_espirito,
        hc_base_cc, hc_base_cd, hc_base_esq, hc_base_lm,
        carisma, manipulacao,
        vitalidade_maxima, vitalidade_atual,
        chakra_maximo, chakra_atual,
        ryos, dados_pericias, dados_extras,
        historico_personagem, notas
      )
      SELECT
        user_id, nome_jogador, CONCAT(nome_personagem, ' (cópia)'), imagem,
        nc_id, cla_id, tendencia_id,
        atr_forca, atr_destreza, atr_agilidade, atr_percepcao,
        atr_inteligencia, atr_vigor, atr_espirito,
        hc_base_cc, hc_base_cd, hc_base_esq, hc_base_lm,
        carisma, manipulacao,
        vitalidade_maxima, vitalidade_atual,
        chakra_maximo, chakra_atual,
        ryos, dados_pericias, dados_extras,
        historico_personagem, notas
      FROM naruto_fichas WHERE id = ? AND user_id = ?
    `, [req.params.id, user.id]);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error("[naruto] POST /fichas/:id/duplicar erro:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/naruto/fichas/:id ────────────────────────────────────────────
router.delete("/fichas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    await pool.query(
      "DELETE FROM naruto_fichas WHERE id = ? AND user_id = ?",
      [req.params.id, user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[naruto] DELETE /fichas/:id erro:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;