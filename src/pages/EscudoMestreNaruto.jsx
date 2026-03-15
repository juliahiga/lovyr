import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/EscudoMestre.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";
const POLL_INTERVAL = 4000;

// ── Helpers ──
const parseDado = (str) => {
  const s = (str || "").trim().toUpperCase().replace(/\s/g, "");
  const m = s.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (!m) return null;
  return { qtd: parseInt(m[1] || "1", 10), faces: parseInt(m[2], 10), bonus: parseInt(m[3] || "0", 10) };
};

const rolarFormula = (str) => {
  const p = parseDado(str);
  if (!p) return null;
  const rolls = Array.from({ length: p.qtd }, () => Math.floor(Math.random() * p.faces) + 1);
  const soma = rolls.reduce((a, b) => a + b, 0) + p.bonus;
  return { rolls, soma, faces: p.faces, qtd: p.qtd, bonus: p.bonus };
};

const barraPct = (atual, max) => (max > 0 ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0);

const corBarra = (pct) => {
  if (pct > 60) return "#22c55e";
  if (pct > 30) return "#f59e0b";
  return "#ef4444";
};

const formatarHora = () => {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
};

// ── Barra animada ──
const Barra = ({ atual, max, cor, label }) => {
  const pct = barraPct(atual, max);
  return (
    <div className="em-barra-wrap">
      <div className="em-card-vida-label">{label}</div>
      <div className="em-barra-track">
        <div className="em-barra-fill" style={{ width: `${pct}%`, background: cor }} />
      </div>
      <span className="em-barra-label" style={{ color: cor }}>
        {atual} / {max}
      </span>
    </div>
  );
};

// ── Card de personagem ──
const PersonagemCard = ({ ficha, onVerFicha }) => {
  const pctVida   = barraPct(ficha.vitalidade_atual ?? 0, ficha.vitalidade_maxima ?? 1);
  const corVida   = corBarra(pctVida);
  const corChakra = "#3b82f6"; // chakra sempre azul
  const nome      = ficha.nome_personagem || "[Sem nome]";

  const atributos = [
    { label: "FOR",  val: ficha.atr_forca        ?? 0 },
    { label: "DES",  val: ficha.atr_destreza      ?? 0 },
    { label: "AGI",  val: ficha.atr_agilidade     ?? 0 },
    { label: "PER",  val: ficha.atr_percepcao     ?? 0 },
    { label: "INT",  val: ficha.atr_inteligencia  ?? 0 },
    { label: "VIG",  val: ficha.atr_vigor         ?? 0 },
    { label: "ESP",  val: ficha.atr_espirito      ?? 0 },
  ];

  return (
    <div className="em-card">
      <div className="em-card-header">
        <div className="em-card-avatar">
          {ficha.imagem
            ? <img src={ficha.imagem} alt={nome} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "7px" }} />
            : nome[0]?.toUpperCase() || "?"}
        </div>
        <div className="em-card-identity">
          <span className="em-card-nome">{nome}</span>
          {ficha.nome_jogador && (
            <span className="em-card-jogador">@{ficha.nome_jogador}</span>
          )}
          {ficha.nivel_shinobi && (
            <span className="em-card-jogador" style={{ color: "#C79255", fontSize: "0.68rem" }}>
              {ficha.nivel_shinobi} · {ficha.cla_nome}
            </span>
          )}
        </div>
        <button
          className="em-card-ficha-btn"
          onClick={() => onVerFicha(ficha.id)}
          title="Ver ficha"
        >
          <i className="fa-solid fa-arrow-up-right-from-square" />
        </button>
      </div>

      <Barra atual={ficha.vitalidade_atual ?? 0} max={ficha.vitalidade_maxima ?? 0} cor={corVida}   label="VITALIDADE" />
      <Barra atual={ficha.chakra_atual     ?? 0} max={ficha.chakra_maximo     ?? 0} cor={corChakra} label="CHAKRA" />

      <div className="em-card-pericias">
        {atributos.map(a => (
          <div key={a.label} className="em-pericia-chip">
            <span className="em-pericia-chip-label">{a.label}</span>
            <span className="em-pericia-chip-val">{a.val >= 0 ? `+${a.val}` : a.val}</span>
          </div>
        ))}
      </div>

      <div className="em-card-footer">
        <div className="em-card-stat">
          <i className="fa-solid fa-coins em-stat-icon" />
          <span>{ficha.ryos ?? 0}</span>
          <span className="em-stat-label">ryōs</span>
        </div>
        <div className="em-card-stat">
          <i className="fa-solid fa-layer-group em-stat-icon" />
          <span>NC {ficha.nc ?? "—"}</span>
          <span className="em-stat-label">nível</span>
        </div>
      </div>
    </div>
  );
};

// ── Item de resultado no painel ──
const ResultadoItem = ({ r, index }) => {
  const isCriticoMax = r.critico_max;
  const isCriticoMin = r.critico_min;
  const cor = isCriticoMax ? "#22c55e" : isCriticoMin ? "#ef4444" : "#C79255";

  return (
    <div
      className="em-resultado-item"
      style={{ "--cor": cor, animationDelay: `${index * 30}ms` }}
    >
      <div className="em-resultado-topo">
        <span className="em-resultado-personagem">{r.personagem || "—"}</span>
        <span className="em-resultado-hora">{r.hora || ""}</span>
      </div>
      <div className="em-resultado-corpo">
        <i className="fas fa-dice-d20" style={{ color: cor, fontSize: "0.9rem" }} />
        <div className="em-resultado-info">
          <span className="em-resultado-label">{r.label}</span>
          {r.is_dano ? (
            <div className="em-resultado-valores">
              <div className="em-resultado-val-bloco">
                <span className="em-resultado-num" style={{ color: cor }}>{r.ataque_total}</span>
                <span className="em-resultado-sub">ATAQUE</span>
              </div>
              <div className="em-resultado-sep" style={{ background: cor }} />
              <div className="em-resultado-val-bloco">
                <span className="em-resultado-num">{r.total}</span>
                <span className="em-resultado-sub">DANO</span>
              </div>
            </div>
          ) : (
            <div className="em-resultado-simples">
              <span className="em-resultado-formula">
                {r.bonus !== 0
                  ? `[${r.valor_dado}]${r.bonus >= 0 ? "+" : ""}${r.bonus}`
                  : `[${r.valor_dado}]`}
              </span>
              <span className="em-resultado-igual">=</span>
              <span className="em-resultado-total" style={{ color: cor }}>{r.total}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Aba Dados ──
const AbaDados = ({ onNovoResultado }) => {
  const [modoRolagem, setModoRolagem] = useState("publico");
  const [formulaRapida, setFormulaRapida] = useState("");
  const [dados, setDados] = useState(() => {
    try { return JSON.parse(localStorage.getItem("em_naruto_dados_salvos") || "[]"); } catch { return []; }
  });

  const salvarDados = (lista) => {
    setDados(lista);
    try { localStorage.setItem("em_naruto_dados_salvos", JSON.stringify(lista)); } catch {}
  };

  const rolarItem = (formula, label) => {
    const str = (formula || "").trim().toUpperCase();
    const res = rolarFormula(str);
    if (!res) return;
    const item = {
      id: Date.now(),
      personagem: "Mestre",
      label: label || str,
      valor_dado: res.soma - res.bonus,
      bonus: res.bonus,
      total: res.soma,
      is_dano: false,
      hora: formatarHora(),
      critico_max: res.qtd === 1 && res.soma - res.bonus === res.faces,
      critico_min: res.qtd === 1 && res.soma - res.bonus === 1,
      privado: modoRolagem === "privado",
    };
    if (modoRolagem === "publico") onNovoResultado(item);
  };

  const handleRolarRapido = () => {
    if (!formulaRapida.trim()) return;
    rolarItem(formulaRapida, formulaRapida.toUpperCase());
    setFormulaRapida("");
  };

  const adicionarDado = () => {
    const novo = { id: Date.now(), nome: "Novo Dado", formula: "" };
    salvarDados([...dados, novo]);
  };

  const removerDado = (id) => salvarDados(dados.filter(d => d.id !== id));

  const atualizarDado = (id, campo, valor) =>
    salvarDados(dados.map(d => d.id === id ? { ...d, [campo]: valor } : d));

  return (
    <div className="em-aba-dados">
      <div className="em-dados-topo">
        <div className="em-dado-visib-row">
          <button className={`em-visib-btn ${modoRolagem === "publico" ? "ativo" : ""}`} onClick={() => setModoRolagem("publico")}>PÚBLICO</button>
          <button className={`em-visib-btn ${modoRolagem === "privado" ? "ativo" : ""}`} onClick={() => setModoRolagem("privado")}>PRIVADO</button>
        </div>
        <button className="em-add-dado-btn" onClick={adicionarDado}>
          Adicionar Dados
        </button>
      </div>

      <div className="em-dado-formula-row">
        <input
          className="em-dado-formula-input"
          placeholder="Rolar dados (ex: 1d20+3)"
          value={formulaRapida}
          onChange={e => setFormulaRapida(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleRolarRapido()}
        />
        <button className="em-dado-rolar-btn" onClick={handleRolarRapido}>
          <i className="fas fa-dice-d20" />
        </button>
      </div>

      <div className="em-dados-lista">
        {dados.map(d => (
          <div key={d.id} className="em-dado-item">
            <div className="em-dado-item-corpo">
              <input
                className="em-dado-item-nome"
                value={d.nome}
                onChange={e => atualizarDado(d.id, "nome", e.target.value)}
                placeholder="Nome do dado"
              />
              <div className="em-dado-item-row">
                <input
                  className="em-dado-item-formula"
                  value={d.formula}
                  onChange={e => atualizarDado(d.id, "formula", e.target.value)}
                  onKeyDown={e => e.key === "Enter" && rolarItem(d.formula, d.nome)}
                  placeholder="Ex: 1d20, 2D6+3"
                />
                <button className="em-dado-rolar-btn" onClick={() => rolarItem(d.formula, d.nome)}>
                  <i className="fas fa-dice-d20" />
                </button>
              </div>
            </div>
            <button className="em-dado-item-remover" onClick={() => removerDado(d.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Painel de Resultados (lateral) ──
const PainelResultados = ({ resultados }) => {
  const ref = useRef(null);
  return (
    <div className="em-painel" ref={ref}>
      <div className="em-painel-header">
        <i className="fas fa-dice-d20 em-painel-icone" />
        <span className="em-painel-titulo">Resultados</span>
        <span className="em-painel-contador">{resultados.length}</span>
      </div>
      <div className="em-painel-lista">
        {resultados.length === 0 && (
          <div className="em-painel-vazio">Nenhuma rolagem ainda.</div>
        )}
        {resultados.map((r, i) => (
          <ResultadoItem key={r.id || i} r={r} index={i} />
        ))}
      </div>
    </div>
  );
};

// ── Página principal ──
const EscudoMestreNaruto = () => {
  const { id: campanhaId } = useParams();
  const navigate = useNavigate();

  const [abaNome, setAbaNome]       = useState("personagens");
  const [campanha, setCampanha]     = useState(null);
  const [fichas, setFichas]         = useState([]);
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [ultimoUpdate, setUltimoUpdate] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/naruto/campanhas/${campanhaId}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setCampanha(d))
      .catch(() => {});
  }, [campanhaId]);

  const buscarFichas = useCallback(() => {
    fetch(`${API}/api/naruto/campanhas/${campanhaId}/fichas`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFichas(data); })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, [campanhaId]);

  const buscarResultados = useCallback(() => {
    fetch(`${API}/api/naruto/campanhas/${campanhaId}/rolagens`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setResultados(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const novos = data.filter(r => !existingIds.has(r.id));
            if (novos.length === 0) return prev;
            setUltimoUpdate(new Date());
            return [...novos, ...prev].slice(0, 100);
          });
        }
      })
      .catch(() => {});
  }, [campanhaId]);

  useEffect(() => {
    buscarFichas();
    buscarResultados();
  }, [buscarFichas, buscarResultados]);

  useEffect(() => {
    const fichasTimer   = setInterval(buscarFichas,     POLL_INTERVAL * 2);
    const rolagemTimer  = setInterval(buscarResultados, POLL_INTERVAL);
    return () => { clearInterval(fichasTimer); clearInterval(rolagemTimer); };
  }, [buscarFichas, buscarResultados]);

  const handleNovoResultado = useCallback((item) => {
    fetch(`${API}/api/naruto/campanhas/${campanhaId}/rolagens`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    }).catch(() => {});
    setResultados(prev => [item, ...prev].slice(0, 100));
  }, [campanhaId]);

  return (
    <div className="em-root">
      {/* ── Topbar ── */}
      <header className="em-topbar">
        <button className="em-back-btn" onClick={() => navigate(`/campanha-naruto/${campanhaId}`)}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className="em-topbar-centro">
          <i className="fa-solid fa-shield-halved em-topbar-icone" />
          <span className="em-topbar-titulo">Escudo do Mestre</span>
          {campanha?.nome && (
            <span className="em-topbar-campanha">— {campanha.nome}</span>
          )}
        </div>
        <div className="em-topbar-direita">
          {ultimoUpdate && (
            <span className="em-topbar-sync">
              <i className="fa-solid fa-circle em-sync-dot" />
              {ultimoUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </header>

      <div className="em-layout">
        <PainelResultados resultados={resultados} />

        <main className="em-main">
          <div className="em-abas">
            {[
              { id: "personagens", label: "PERSONAGENS", icon: "fa-solid fa-users" },
              { id: "dados",       label: "DADOS",       icon: "fa-solid fa-dice-d20" },
            ].map(a => (
              <button
                key={a.id}
                className={`em-aba-btn ${abaNome === a.id ? "ativa" : ""}`}
                onClick={() => setAbaNome(a.id)}
              >
                <i className={a.icon} />
                {a.label}
              </button>
            ))}
          </div>

          <div className="em-conteudo">
            {abaNome === "personagens" && (
              <div className="em-personagens">
                {carregando ? (
                  <div className="em-loading">
                    <i className="fas fa-circle-notch fa-spin" />
                    Carregando fichas...
                  </div>
                ) : fichas.length === 0 ? (
                  <div className="em-vazio">
                    <i className="fa-solid fa-users-slash" />
                    <p>Nenhum jogador com ficha nesta campanha.</p>
                  </div>
                ) : (
                  <div className="em-cards-grid">
                    {fichas.map(f => (
                      <PersonagemCard
                        key={f.id}
                        ficha={f}
                        onVerFicha={fichaId => navigate(`/naruto/ficha/${fichaId}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {abaNome === "dados" && (
              <AbaDados
                campanhaId={campanhaId}
                resultados={resultados}
                onNovoResultado={handleNovoResultado}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EscudoMestreNaruto;