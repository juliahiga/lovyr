import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/FichaPersonagemNaruto.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

// ── Helpers ───────────────────────────────────────────────────────────────────
const rolar2d8 = () => ({
  d1: Math.floor(Math.random() * 8) + 1,
  d2: Math.floor(Math.random() * 8) + 1,
});

const makeTimestamp = () => {
  const now = new Date();
  return `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
};

// ── Sub-componente: campo editável inline ─────────────────────────────────────
const CampoEditavel = ({ valor, onSalvar, placeholder }) => {
  const [editando, setEditando] = useState(false);
  const [tmp, setTmp] = useState(valor);
  const inputRef = useRef(null);

  useEffect(() => { setTmp(valor); }, [valor]);
  useEffect(() => { if (editando) inputRef.current?.focus(); }, [editando]);

  const salvar = () => { onSalvar(tmp); setEditando(false); };

  if (editando) return (
    <input
      ref={inputRef}
      className="fn-campo-input"
      value={tmp}
      onChange={e => setTmp(e.target.value)}
      onBlur={salvar}
      onKeyDown={e => { if (e.key === "Enter") salvar(); if (e.key === "Escape") setEditando(false); }}
    />
  );
  return (
    <span className="fn-campo-valor fn-campo-editavel" onClick={() => setEditando(true)} title="Clique para editar">
      {valor || <span className="fn-campo-vazio">{placeholder}</span>}
      <i className="fas fa-pen fn-campo-edit-icon" />
    </span>
  );
};

// ── Sub-componente: número clicável/editável inline ──────────────────────────
const CampoNumerico = ({ valor, onChange, min = 0, className = "" }) => {
  const [editando, setEditando] = useState(false);
  const [tmp, setTmp] = useState(String(valor));
  const inputRef = useRef(null);

  useEffect(() => { if (!editando) setTmp(String(valor)); }, [valor, editando]);
  useEffect(() => { if (editando && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editando]);

  const salvar = () => {
    const n = parseInt(tmp, 10);
    onChange(isNaN(n) ? min : Math.max(min, n));
    setEditando(false);
  };

  if (editando) return (
    <input
      ref={inputRef}
      className={`fn-num-input ${className}`}
      type="number"
      value={tmp}
      onChange={e => setTmp(e.target.value)}
      onBlur={salvar}
      onKeyDown={e => { if (e.key === "Enter") salvar(); if (e.key === "Escape") { setEditando(false); } }}
    />
  );
  return (
    <span className={`fn-num-val ${className}`} onClick={() => setEditando(true)} title="Clique para editar">
      {valor}
    </span>
  );
};

// ── Sub-componente: barra de energia (idêntico ao VidaControl do TLOU) ─────
const BarraEnergia = ({ label, cor, valor, max, onChange, onChangeMax }) => {
  const [eA, setEA] = useState(false); const [eM, setEM] = useState(false);
  const [iA, setIA] = useState(String(valor)); const [iM, setIM] = useState(String(max));
  const rA = useRef(null); const rM = useRef(null);
  useEffect(() => { if (eA && rA.current) rA.current.select(); }, [eA]);
  useEffect(() => { if (eM && rM.current) rM.current.select(); }, [eM]);
  const cA = () => { const n = parseInt(iA, 10); if (!isNaN(n)) onChange(n); setEA(false); };
  const cM = () => { const n = parseInt(iM, 10); if (!isNaN(n)) onChangeMax(n); setEM(false); };
  const pct = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0;
  const slot = { display: "inline-block", width: "42px", textAlign: "center", cursor: "text" };
  const inp  = { width: "42px", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "1rem", fontWeight: "700", textAlign: "center", fontFamily: '"Be Vietnam Pro",sans-serif', letterSpacing: "2px" };
  return (
    <div className="fn-energia-bloco">
      <div className="fn-energia-titulo">{label}</div>
      <div className="fn-energia-barra-wrapper">
        <div className="fn-energia-barra-fill" style={{ width: `${pct}%`, background: cor }} />
        <button className="fn-energia-btn" onClick={() => onChange(valor - 5)}>«</button>
        <button className="fn-energia-btn" onClick={() => onChange(valor - 1)}>‹</button>
        <div className="fn-energia-barra-bg">
          <div className="fn-energia-texto">
            <span style={slot}>{eA
              ? <input ref={rA} className="fn-energia-input-edit" style={inp} type="number" value={iA} onChange={e => setIA(e.target.value)} onBlur={cA} onKeyDown={e => { if (e.key === "Enter") cA(); if (e.key === "Escape") setEA(false); }} />
              : <span onClick={() => { setIA(String(valor)); setEA(true); }}>{valor}</span>}
            </span>
            <span style={{ opacity: 0.5 }}>/</span>
            <span style={slot}>{eM
              ? <input ref={rM} className="fn-energia-input-edit" style={inp} type="number" value={iM} onChange={e => setIM(e.target.value)} onBlur={cM} onKeyDown={e => { if (e.key === "Enter") cM(); if (e.key === "Escape") setEM(false); }} />
              : <span onClick={() => { setIM(String(max)); setEM(true); }}>{max}</span>}
            </span>
          </div>
        </div>
        <button className="fn-energia-btn" onClick={() => onChange(valor + 1)}>›</button>
        <button className="fn-energia-btn" onClick={() => onChange(valor + 5)}>»</button>
      </div>
    </div>
  );
};

// ── Sub-componente: rolagem 2d8 / 1d8 ───────────────────────────────────────
const ResultadoRolagem = ({ resultado, onFechar }) => {
  const [animando, setAnimando] = useState(false);
  const prev = useRef(null);
  useEffect(() => {
    if (resultado && resultado !== prev.current) {
      prev.current = resultado; setAnimando(true);
      const t = setTimeout(() => setAnimando(false), 500); return () => clearTimeout(t);
    }
  }, [resultado]);
  if (!resultado) return null;
  const { label, d1, d2, precisao, bonus, total, critico, falhaCritica, is1d8 } = resultado;
  const soma = is1d8 ? d1 : d1 + (d2 ?? 0);
  const cls = critico ? "critico-max" : falhaCritica ? "critico-min" : "";
  const formula = is1d8
    ? `1d8(${d1})${bonus !== 0 ? `+bônus(${bonus})` : ""}`
    : `2d8(${d1}+${d2}=${soma})${precisao !== 0 ? `+precisão(${precisao})` : ""}${bonus !== 0 ? `+bônus(${bonus})` : ""}`;
  return (
    <div className="rolagem-overlay" onClick={onFechar}>
      <div className={`rolagem-painel ${animando ? "rolagem-animando" : ""}`} onClick={e => e.stopPropagation()}>
        <button className="rolagem-fechar" onClick={onFechar}>×</button>
        <div className={`rolagem-icone ${cls}`}>
          <i className="fas fa-dice-d20 rolagem-dado-svg" />
        </div>
        <div className="rolagem-nome">{label}</div>
        <div className="rolagem-nova-formula">
          <div className={`rolagem-dado-destaque ${cls}`}>[{soma}]</div>
          {((!is1d8 && precisao !== 0) || bonus !== 0) && (
            <div className="rolagem-formula-resto">
              {!is1d8 && precisao !== 0 ? `${precisao >= 0 ? "+" : ""}${precisao}` : ""}
              {bonus !== 0 ? `${bonus >= 0 ? "+" : ""}${bonus}` : ""}
            </div>
          )}
          <div className="rolagem-igual">=</div>
          <div className={`rolagem-total-novo ${cls}`}>{total}</div>
        </div>
        <div className="rolagem-formula-label">{formula}</div>
      </div>
    </div>
  );
};

// ── Sub-componente: histórico de rolagens (idêntico ao TLOU) ─────────────────
const PainelHistorico = ({ historico, aberto, onFechar }) => {
  if (!aberto) return null;
  return (
    <div className="painel-resultados">
      <div className="painel-resultados-header">
        <span className="painel-resultados-titulo">Resultados</span>
        <button className="painel-resultados-fechar" onClick={onFechar}>✕</button>
      </div>
      <div className="painel-resultados-lista">
        {historico.length === 0 && <div className="painel-resultados-vazio">Nenhuma rolagem ainda.</div>}
        {[...historico].reverse().map((h, i) => {
          const cls = h.critico ? "critico-max" : h.falhaCritica ? "critico-min" : "";
          const cor = cls === "critico-max" ? "#22c55e" : cls === "critico-min" ? "#ef4444" : "#C79255";
          return (
            <div key={i} className="painel-item" style={{ borderColor: cls ? cor : "#2a2218" }}>
              <div className="painel-item-personagem">{h.personagem || "—"}</div>
              <div className="painel-item-card-row">
                <i className="fas fa-dice-d20 painel-item-icone" style={{ color: cor }} />
                <div className="painel-item-card-body">
                  <span className="painel-item-nome">{h.label}</span>
                  <div className="painel-item-pericia-row">
                    <span className="painel-item-formula-inline">[{h.d1}+{h.d2}]</span>
                    <span className="painel-item-igual">=</span>
                    <span className="painel-item-total" style={{ color: cor }}>{h.total}</span>
                  </div>
                </div>
              </div>
              <div className="painel-item-ts">{h.timestamp}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Lista de perícias com atributo vinculado ──────────────────────────────────
const periciasConfig = [
  { id: "acrobacia",        nome: "Acrobacia",          atr: "agilidade",    sigla: "AGI" },
  { id: "arte",             nome: "Arte",                atr: "inteligencia", sigla: "INT" },
  { id: "atletismo",        nome: "Atletismo",           atr: "forca",        sigla: "FOR" },
  { id: "ciencias_naturais",nome: "Ciências Naturais",   atr: "inteligencia", sigla: "INT" },
  { id: "concentracao",     nome: "Concentração",        atr: "inteligencia", sigla: "INT" },
  { id: "cultura",          nome: "Cultura",             atr: "inteligencia", sigla: "INT" },
  { id: "disfarces",        nome: "Disfarces",           atr: "percepcao",    sigla: "PER" },
  { id: "escapar",          nome: "Escapar",             atr: "destreza",     sigla: "DES" },
  { id: "furtividade",      nome: "Furtividade",         atr: "agilidade",    sigla: "AGI" },
  { id: "lidar_animais",    nome: "Lidar c/ Animais *",  atr: "percepcao",    sigla: "PER" },
  { id: "mecanismos",       nome: "Mecanismos *",        atr: "inteligencia", sigla: "INT" },
  { id: "medicina",         nome: "Medicina *",          atr: "inteligencia", sigla: "INT" },
  { id: "ocultismo",        nome: "Ocultismo *",         atr: "inteligencia", sigla: "INT" },
  { id: "prestidigitacao",  nome: "Prestidigitação",     atr: "destreza",     sigla: "DES" },
  { id: "procurar",         nome: "Procurar",            atr: "percepcao",    sigla: "PER" },
  { id: "rastrear",         nome: "Rastrear",            atr: "percepcao",    sigla: "PER" },
  { id: "prontidao",        nome: "Prontidão",           atr: "percepcao",    sigla: "PER" },
  { id: "veneficio",        nome: "Venefício * *",       atr: "inteligencia", sigla: "INT" },
];

const atributosConfig = [
  { id: "forca",        nome: "Força",        sigla: "FOR" },
  { id: "destreza",     nome: "Destreza",     sigla: "DES" },
  { id: "agilidade",    nome: "Agilidade",    sigla: "AGI" },
  { id: "percepcao",    nome: "Percepção",    sigla: "PER" },
  { id: "inteligencia", nome: "Inteligência", sigla: "INT" },
  { id: "vigor",        nome: "Vigor",        sigla: "VIG" },
  { id: "espirito",     nome: "Espírito",     sigla: "ESP" },
];


// ── Config de aptidões comuns (livro SNS) ─────────────────────────────────────
const aptidoesConfig = [
  // COMBATE
  { id: "acuidade",          nome: "Acuidade",           cat: "combate",  req: "Des 3",      desc: "CC usa Destreza ao invés de Força",                efeito: { tipo: "acuidade" } },
  { id: "reflexos",          nome: "Reflexos",            cat: "combate",  req: null,         desc: "ESQ +1",                                            efeito: { tipo: "hc", key: "ESQ", val: 1 } },
  { id: "intuicao",          nome: "Intuição",            cat: "combate",  req: null,         desc: "LM +1",                                             efeito: { tipo: "hc", key: "LM",  val: 1 } },
  { id: "diligente",         nome: "Diligente",           cat: "combate",  req: null,         desc: "Iniciativa +3",                                     efeito: { tipo: "iniciativa", val: 3 } },
  { id: "velocista",         nome: "Velocista",           cat: "combate",  req: null,         desc: "Deslocamento: dobra Agilidade",                     efeito: { tipo: "velocista" } },
  { id: "especialista",      nome: "Especialista",        cat: "combate",  req: null,         desc: "CC ou CD +1 (escolha tipo de arma)",                efeito: { tipo: "especialista" }, generica: true },
  { id: "combate_defensivo", nome: "Combate Defensivo",   cat: "combate",  req: "CC 9",       desc: "Ao usar: CC -2, ESQ +3 até próximo turno",          efeito: null },
  { id: "maestria",          nome: "Maestria",            cat: "combate",  req: null,         desc: "CC ou CD +1 em poder/técnica escolhida",            efeito: null, generica: true },
  { id: "mestre_selos",      nome: "Mestre dos Selos",    cat: "combate",  req: "Prest 12",   desc: "Selos de mão acelerados; 1 mão com Prest 14",       efeito: null },
  { id: "ataque_movimento",  nome: "Ataque em Movimento", cat: "combate",  req: "Agi 4",      desc: "Divide deslocamento antes e depois do ataque",      efeito: null },
  { id: "ataque_multiplo",   nome: "Ataque Múltiplo",     cat: "combate",  req: "CC/CD 11",   desc: "Divide ataque em 2 ou 3 golpes",                    efeito: null },
  { id: "trespassar",        nome: "Trespassar",          cat: "combate",  req: "CC 7",       desc: "Ataque extra ao abater inimigo",                    efeito: null },
  { id: "de_pe",             nome: "De Pé",               cat: "combate",  req: null,         desc: "Levanta como ação livre; 1x/cena como reação",      efeito: null },
  { id: "oportunista",       nome: "Oportunista",         cat: "combate",  req: null,         desc: "Ataques oportunos extras = Agi/2",                  efeito: null },
  { id: "mobilidade",        nome: "Mobilidade",          cat: "combate",  req: "Agi 3",      desc: "ESQ +3 contra ataques oportunos ao se mover",       efeito: null },
  { id: "ponto_cego",        nome: "Ponto Cego",          cat: "combate",  req: "Agi/Prest 6",desc: "Finta como ação de movimento",                      efeito: null },
  { id: "saque_rapido",      nome: "Saque Rápido",        cat: "combate",  req: null,         desc: "Saca/guarda arma como ação livre",                  efeito: null },
  { id: "retirada_rapida",   nome: "Retirada Rápida",     cat: "combate",  req: "Agi 10",     desc: "Recua sem provocar ataque oportuno",                efeito: null },
  { id: "usar_arma",         nome: "Usar Arma",           cat: "combate",  req: null,         desc: "Proficiência em arma marcial/especial",             efeito: null, generica: true },
  { id: "usar_arm_pesada",   nome: "Usar Armaduras Pesadas", cat: "combate", req: "FOR/VIG",  desc: "Usa armaduras pesadas sem penalidade extra",        efeito: null },
  { id: "lutar_cego",        nome: "Lutar às Cegas",      cat: "combate",  req: null,         desc: "Sem desvantagem ao atacar sem visão",               efeito: null },
  { id: "guerreiro",         nome: "Guerreiro",           cat: "combate",  req: "FOR/DES 10", desc: "Manobras com armas pesadas/longas sem penalidade",  efeito: null },
  { id: "critico_aprimorado",nome: "Crítico Aprimorado",  cat: "combate",  req: "Esp + CC/CD 13", desc: "Crítico com 1 a menos no dado",                efeito: null, generica: true },
  { id: "dano_extra",        nome: "Dano Extra",          cat: "combate",  req: "CC/CD 18",   desc: "+1 dano de arma na categoria escolhida",            efeito: null, generica: true },
  { id: "atirador",          nome: "Atirador",            cat: "combate",  req: "DES 12",     desc: "+3 dano arremesso ou +1 dano arco",                 efeito: null },
  { id: "tiro_longo",        nome: "Tiro Longo",          cat: "combate",  req: "DES 12",     desc: "Dobra alcance de armas de disparo",                 efeito: null },
  { id: "tiro_preciso",      nome: "Tiro Preciso",        cat: "combate",  req: "DES 9",      desc: "Ignora cobertura/camuflagem parcial",               efeito: null },
  { id: "mira_apurada",      nome: "Mira Apurada",        cat: "combate",  req: "DES 12, Tiro Longo", desc: "Ação de mover para mirar: CD +1",           efeito: null },
  { id: "rolamento",         nome: "Rolamento",           cat: "combate",  req: "Acro 2",     desc: "Dobra redução de queda; levanta como reação",       efeito: null },
  { id: "blq_ambidestro",    nome: "Bloqueio Ambidestro", cat: "combate",  req: "Ambidestria",desc: "+1 bloqueio com duas armas",                        efeito: null },
  { id: "ambidestria",       nome: "Ambidestria",         cat: "combate",  req: "CC 12",      desc: "Ataca com duas armas; soma dano de ambas",          efeito: null },
  // MANOBRA
  { id: "lutador",           nome: "Lutador",             cat: "manobra",  req: null,         desc: "Manobras desarmadas sem penalidade -2",             efeito: null },
  { id: "punho_ferro",       nome: "Punho de Ferro",      cat: "manobra",  req: "FOR 2",      desc: "Ataque desarmado: 1 dano de arma (escala c/ FOR)",  efeito: { tipo: "punho_ferro" } },
  { id: "apanhar_objetos",   nome: "Apanhar Objetos",     cat: "manobra",  req: null,         desc: "Apanha projéteis e devolve como ação livre",        efeito: null },
  { id: "ataque_giratório",  nome: "Ataque Giratório",    cat: "manobra",  req: "CC 8",       desc: "Ataque acerta todos ao redor",                      efeito: null },
  { id: "ataque_poderoso",   nome: "Ataque Poderoso",     cat: "manobra",  req: "CC 7",       desc: "CC -1, +1 dano",                                    efeito: null },
  { id: "ataque_atordoante", nome: "Ataque Atordoante",   cat: "manobra",  req: "FOR 12",     desc: "Ataque sem dano; alvo testa VIG ou fica atordoado", efeito: null },
  { id: "arremessar",        nome: "Arremessar",          cat: "manobra",  req: "FOR 6",      desc: "Arremessa inimigo derrubado até FOR metros",        efeito: null },
  { id: "rasteira",          nome: "Rasteira",            cat: "manobra",  req: null,         desc: "Chute baixo para derrubar",                         efeito: null },
  { id: "derrubar_agr",      nome: "Derrubar Agressivo",  cat: "manobra",  req: "Lutador/Guerreiro", desc: "Derruba e causa dano ao mesmo tempo",        efeito: null },
  { id: "desarme_agr",       nome: "Desarme Agressivo",   cat: "manobra",  req: "Lutador/Guerreiro", desc: "Desarma e causa dano ao mesmo tempo",        efeito: null },
  { id: "bloquear_arma",     nome: "Bloquear Arma",       cat: "manobra",  req: null,         desc: "+1 bloqueio contra ataques armados",                efeito: null },
  { id: "contragolpe",       nome: "Contragolpe",         cat: "manobra",  req: "CC 12",      desc: "Ataque oportuno ao bloquear com margem de 4+",      efeito: null },
  { id: "chute_giratório",   nome: "Chute Giratório",     cat: "manobra",  req: "CC 10",      desc: "Ataque giratório desarmado com +2 dano",            efeito: null },
  { id: "chute_duplo",       nome: "Chute Duplo",         cat: "manobra",  req: "Chute Gir.", desc: "Ataque Múltiplo: Chute Giratório + chute comum",    efeito: null },
  { id: "chute_inverso",     nome: "Chute Inverso",       cat: "manobra",  req: "CC 14",      desc: "Finta + ataque; alvo não pode bloquear",            efeito: null },
  { id: "soco_agarrado",     nome: "Soco Agarrado",       cat: "manobra",  req: "Lutador",    desc: "Alvo não pode bloquear ao atacar desarmado",        efeito: null },
  { id: "soco_gancho",       nome: "Soco em Gancho",      cat: "manobra",  req: "CC 11",      desc: "Último golpe do Ataque Múltiplo: +1 prec e dano",   efeito: null },
  { id: "golpe_atemi",       nome: "Golpe Atemi",         cat: "manobra",  req: "Ataque Pod.", desc: "-1 prec, +2 dano em ponto vital",                  efeito: null },
  { id: "golpe_karate",      nome: "Golpe Caratê",        cat: "manobra",  req: "CC 15",      desc: "Ignora 2 dureza de corpo",                          efeito: null },
  { id: "voadora",           nome: "Voadora",             cat: "manobra",  req: "Derrubar Agr.", desc: "Investida + Derrubar Agressivo: -1 prec, +2 dano", efeito: null },
  { id: "seguir_sombra",     nome: "Seguir Sombra",       cat: "manobra",  req: "Arremessar",  desc: "Persegue e ataca novamente inimigo arremessado",   efeito: null },
  { id: "ataque_progressivo",nome: "Ataque Progressivo",  cat: "manobra",  req: "Agi 14 ou Hachimon 6", desc: "Após Ataque Múltiplo bem-sucedido: 2 rolagens extras", efeito: null },
  // TÉCNICAS
  { id: "tecnica_acelerada", nome: "Técnica Acelerada",   cat: "tecnica",  req: "ESP/INT 12", desc: "Executa técnica de ação padrão como ação de mover", efeito: null },
  { id: "tecnica_eficiente", nome: "Técnica Eficiente",   cat: "tecnica",  req: "ESP/INT 10", desc: "Relança grau de dano, fica com melhor resultado",   efeito: null },
  { id: "tecnica_elevada",   nome: "Técnica Elevada",     cat: "tecnica",  req: "INT 6",      desc: "+2 dif para resistir às suas técnicas de perícia",  efeito: null },
  { id: "tecnica_poderosa",  nome: "Técnica Poderosa",    cat: "tecnica",  req: "ESP/INT 12", desc: "Grau de Dano +0,5 nas técnicas",                    efeito: null },
  { id: "potencializar",     nome: "Potencializar",       cat: "tecnica",  req: "ESP/INT 8",  desc: "Dobra área/alcance ou +1 dano base da técnica",     efeito: null },
  { id: "dominio_agua",      nome: "Domínio da Água",     cat: "tecnica",  req: "Suiton 5",   desc: "Acumula pontos de água p/ +1 dano Suiton",          efeito: null },
  { id: "dominio_fogo",      nome: "Domínio do Fogo",     cat: "tecnica",  req: "Katon 5",    desc: "Katon em área: alvo testa VIG ou fica debilitado",  efeito: null },
  { id: "dominio_raio",      nome: "Domínio do Raio",     cat: "tecnica",  req: "Raiton 5",   desc: "Crítico Aprimorado em todos efeitos Raiton",        efeito: null },
  { id: "dominio_terra",     nome: "Domínio da Terra",    cat: "tecnica",  req: "Doton 5",    desc: "Barreira Doton: gasta chakra para +1 dureza",       efeito: null },
  { id: "dominio_vento",     nome: "Domínio do Vento",    cat: "tecnica",  req: "Fuuton 5",   desc: "Fuuton em área: ventos reduzem deslocamento à metade", efeito: null },
  { id: "dominio_ninpou",    nome: "Domínio Ninpou",      cat: "tecnica",  req: "Ninpou 5",   desc: "Finta de Flechas custa ação parcial",               efeito: null },
  { id: "ilusao_profunda",   nome: "Ilusão Profunda",     cat: "tecnica",  req: "INT 5",      desc: "+1 dif p/ resistir ilusões (+2 contra Kai)",        efeito: null },
  // SHINOBI
  { id: "clone",             nome: "Clone",               cat: "shinobi",  req: "ESP 6",      desc: "Cria até 2 clones (Parceiros); 1 chakra cada",      efeito: null, generica: true },
  { id: "clone_verdadeiro",  nome: "Clone Verdadeiro",    cat: "shinobi",  req: "ESP 10",     desc: "1 clone que usa poderes e técnicas",                efeito: null },
  { id: "replica_enganadora",nome: "Réplica Enganadora",  cat: "shinobi",  req: null,         desc: "Escapa de ataque deixando clone no lugar",          efeito: null },
  { id: "sensor",            nome: "Sensor",              cat: "shinobi",  req: null,         desc: "Rastreia criaturas pelo chakra",                    efeito: null },
  { id: "shunjutsu",         nome: "Shunjutsu",           cat: "shinobi",  req: null,         desc: "Shunshin: movimento rápido em combate",             efeito: null },
  { id: "fascinar",          nome: "Fascinar",            cat: "shinobi",  req: null,         desc: "Cria ilusão na mente do inimigo",                   efeito: null },
  { id: "miragem",           nome: "Miragem",             cat: "shinobi",  req: null,         desc: "Cria ilusão sobre objeto ou lugar",                 efeito: null },
  { id: "trabalho_duro",     nome: "Trabalho Duro",       cat: "shinobi",  req: null,         desc: "Bônus genéricos durante o combate",                 efeito: null },
  // GERAIS
  { id: "ninja_medico",      nome: "Ninja Médico",        cat: "geral",    req: "Medicina 7", desc: "Habilita cirurgias, remédios e técnicas de cura",   efeito: { tipo: "treino_pericia", pericia: "medicina" } },
  { id: "quimico",           nome: "Químico",             cat: "geral",    req: "INT 8",      desc: "Habilita a compra/uso da perícia Venefício",        efeito: { tipo: "treino_pericia", pericia: "veneficio" } },
  { id: "engenheiro",        nome: "Engenheiro",          cat: "geral",    req: "INT 6",      desc: "Habilita criação de mecanismos e armadilhas",       efeito: { tipo: "treino_pericia", pericia: "mecanismos" } },
  { id: "pericia_inata",     nome: "Perícia Inata",       cat: "geral",    req: null,         desc: "Refaz um teste de perícia escolhida",               efeito: null, generica: true },
  { id: "perito",            nome: "Perito",              cat: "geral",    req: null,         desc: "+2 precisão em perícia escolhida",                  efeito: { tipo: "perito" }, generica: true },
  { id: "resistencia_maior", nome: "Resistência Maior",   cat: "geral",    req: null,         desc: "Refaz teste de resistência de atributo escolhido",  efeito: null, generica: true },
  { id: "duro_matar",        nome: "Duro de Matar",       cat: "geral",    req: null,         desc: "1x/dia: resiste golpe que levaria Vit a 0",         efeito: null },
  { id: "elemento_natural",  nome: "Elemento Natural",    cat: "geral",    req: null,         desc: "Habilita técnicas do elemento escolhido (restrito)", efeito: null, generica: true },
];

const CATS = [
  { id: "combate",  label: "COMBATE"  },
  { id: "manobra",  label: "MANOBRA"  },
  { id: "tecnica",  label: "TÉCNICA"  },
  { id: "shinobi",  label: "SHINOBI"  },
  { id: "geral",    label: "GERAL"    },
];

// ── Helper: verifica pré-requisitos de aptidão ───────────────────────────────
// Suporta: "Des 3", "CC 9", "INT 8", "Medicina 7", "Agi/Prest 6", "CC/CD 11" etc.
const verificarReq = (req, atr, pericias, hcCalc) => {
  if (!req) return true;
  // vírgula = todos os requisitos devem ser atendidos
  return req.split(",").every(parte => {
    // barra = basta um
    return parte.trim().split("/").some(p => {
      p = p.trim();
      const m = p.match(/^(.+?)\s+(\d+)$/);
      if (!m) return true; // req sem número (ex: "Ambidestria") — não bloqueia
      const nome = m[1].toLowerCase().trim();
      const num  = parseInt(m[2]);
      // atributos
      if (["for","força","forca"].includes(nome))         return (atr.forca        ?? 0) >= num;
      if (["des","destreza"].includes(nome))              return (atr.destreza     ?? 0) >= num;
      if (["agi","agilidade"].includes(nome))             return (atr.agilidade    ?? 0) >= num;
      if (["per","percepção","percepcao"].includes(nome)) return (atr.percepcao    ?? 0) >= num;
      if (["int","inteligência","inteligencia"].includes(nome)) return (atr.inteligencia ?? 0) >= num;
      if (["vig","vigor"].includes(nome))                 return (atr.vigor        ?? 0) >= num;
      if (["esp","espírito","espirito"].includes(nome))   return (atr.espirito     ?? 0) >= num;
      // habilidades de combate
      if (nome === "cc")    return (hcCalc?.CC  ?? 0) >= num;
      if (nome === "cd")    return (hcCalc?.CD  ?? 0) >= num;
      if (nome === "esq")   return (hcCalc?.ESQ ?? 0) >= num;
      if (nome === "lm")    return (hcCalc?.LM  ?? 0) >= num;
      if (nome === "cc/cd" || nome === "combate") return Math.max(hcCalc?.CC ?? 0, hcCalc?.CD ?? 0) >= num;
      // perícias pelo nome — total = ½atr base + pts gastos
      const mapaAtr = {
        acrobacia: "agilidade", atletismo: "forca", furtividade: "agilidade",
        prontidao: "percepcao", prontidão: "percepcao",
        procurar: "percepcao", rastrear: "percepcao",
        concentracao: "inteligencia", concentração: "inteligencia",
        cultura: "inteligencia", medicina: "inteligencia",
        mecanismos: "inteligencia", veneficio: "inteligencia",
        prestidigitacao: "destreza", prestidigitação: "destreza",
        escapar: "destreza", disfarces: "percepcao",
        prest: "destreza",
      };
      const nNorm = nome.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
      if (mapaAtr[nNorm]) {
        const atrKey = mapaAtr[nNorm];
        const base  = Math.ceil((atr[atrKey] ?? 0) / 2);
        const extra = pericias?.[nNorm] ?? 0;
        return (base + extra) >= num;
      }
      return true; // desconhecido — não bloqueia
    });
  });
};

// ── Sub-componente: painel de aptidões ────────────────────────────────────────
const AbaAptidoes = ({ aptidoes, setAptidoes, atr, pericias, hcCalc = {} }) => {
  const [busca, setBusca] = useState("");
  const [catAtiva, setCatAtiva] = useState("combate");
  const [modalApt, setModalApt] = useState(null); // aptidao config
  const [detalhe, setDetalhe] = useState(null);   // hover/click detail

  const temAptidao = (id) => aptidoes.some(a => a.id === id);

  const adicionarAptidao = (apt, obs = "") => {
    if (!apt.generica && temAptidao(apt.id)) return;
    setAptidoes(prev => [...prev, { id: apt.id, nome: apt.nome, cat: apt.cat, obs, efeito: apt.efeito }]);
    setModalApt(null);
  };

  const removerAptidao = (idx) => {
    setAptidoes(prev => prev.filter((_, i) => i !== idx));
  };

  const lista = aptidoesConfig.filter(a =>
    a.cat === catAtiva &&
    (busca === "" || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.desc.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="fn-aptidoes-wrapper">
      {/* ── BARRA SUPERIOR ── */}
      <div className="fn-apt-topbar">
        <input
          className="fn-apt-busca"
          placeholder="Buscar aptidão..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {/* ── ABAS DE CATEGORIA ── */}
      <div className="fn-apt-cats">
        {CATS.map(c => (
          <button
            key={c.id}
            className={`fn-apt-cat-btn ${catAtiva === c.id ? "ativo" : ""}`}
            onClick={() => { setCatAtiva(c.id); setBusca(""); }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ── LISTA DE APTIDÕES DISPONÍVEIS ── */}
      <div className="fn-apt-lista-disp">
        {lista.map(apt => {
          const ativa    = !apt.generica && temAptidao(apt.id);
          const liberada = verificarReq(apt.req, atr, pericias, hcCalc);
          return (
            <div
              key={apt.id}
              className={`fn-apt-item ${ativa ? "ativa" : ""} ${!liberada ? "bloqueada" : ""}`}
              onClick={() => {
                if (ativa || !liberada) return;
                if (apt.generica) setModalApt(apt);
                else adicionarAptidao(apt);
              }}
              onMouseEnter={() => setDetalhe(apt)}
              onMouseLeave={() => setDetalhe(null)}
              title={!liberada ? `Req: ${apt.req}` : apt.desc}
            >
              <span className="fn-apt-item-nome">{apt.nome}</span>
              {apt.req && <span className="fn-apt-item-req">{apt.req}</span>}
              {!liberada && <span className="fn-apt-item-lock">🔒</span>}
              {ativa && liberada && <span className="fn-apt-item-check">✓</span>}
            </div>
          );
        })}
      </div>

      {/* ── TOOLTIP DE DETALHE ── */}
      {detalhe && (
        <div className="fn-apt-tooltip">
          <strong>{detalhe.nome}</strong>
          {detalhe.req && <span className="fn-apt-tooltip-req">Req: {detalhe.req}</span>}
          <p>{detalhe.desc}</p>
        </div>
      )}

      {/* ── APTIDÕES ADQUIRIDAS ── */}
      <div className="fn-apt-adquiridas-titulo">ADQUIRIDAS</div>
      <div className="fn-apt-adquiridas">
        {aptidoes.length === 0 && (
          <div className="fn-apt-vazia">Nenhuma aptidão adquirida.</div>
        )}
        {aptidoes.map((a, idx) => (
          <div key={idx} className={`fn-apt-adq-item fn-apt-adq-${a.cat}`}>
            <div className="fn-apt-adq-info">
              <span className="fn-apt-adq-nome">{a.nome}</span>
              {a.obs && <span className="fn-apt-adq-obs">{a.obs}</span>}
            </div>
            <button className="fn-apt-adq-remover" onClick={() => removerAptidao(idx)} title="Remover">×</button>
          </div>
        ))}
      </div>

      {/* ── MODAL APTIDÃO GENÉRICA (pede observação) ── */}
      {modalApt && (
        <ModalAptidaoGenerica
          apt={modalApt}
          onConfirmar={(obs) => adicionarAptidao(modalApt, obs)}
          onCancelar={() => setModalApt(null)}
        />
      )}
    </div>
  );
};

const ModalAptidaoGenerica = ({ apt, onConfirmar, onCancelar }) => {
  const [obs, setObs] = useState("");
  return (
    <div className="fn-apt-modal-overlay" onClick={onCancelar}>
      <div className="fn-apt-modal" onClick={e => e.stopPropagation()}>
        <div className="fn-apt-modal-header">
          <span className="fn-apt-modal-titulo">{apt.nome}</span>
          <button className="fn-apt-modal-fechar" onClick={onCancelar}>×</button>
        </div>
        <p className="fn-apt-modal-desc">{apt.desc}</p>
        <input
          className="fn-apt-modal-input"
          placeholder="Especifique (ex: kunai, desarmado, Acrobacia...)"
          value={obs}
          onChange={e => setObs(e.target.value)}
          autoFocus
          onKeyDown={e => { if (e.key === "Enter" && obs.trim()) onConfirmar(obs.trim()); }}
        />
        <button
          className={`fn-apt-modal-btn ${obs.trim() ? "ativo" : ""}`}
          onClick={() => obs.trim() && onConfirmar(obs.trim())}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
};

// ── Sub-componente: aba de perícias com atributo trocável e bônus editável ───
const AbaPericiasNova = ({ periciasConfig, atributosConfig, atr, pericias, setPericias, aptPericiaBonus = {}, aptidoes = [], handleRolar }) => {
  const [atrOverride, setAtrOverride] = useState({});
  const [dropdownAberto, setDropdownAberto] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setDropdownAberto(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getAtrEfetivo = (p) => atrOverride[p.id] ?? { id: p.atr, sigla: p.sigla };

  return (
    <div className="fn-pericias-wrapper" ref={wrapperRef}>
      <div className="fn-pericias-box">
      <table className="fn-pericias-tabela">
        <thead>
          <tr>
            <th className="fnt-col-rolar"></th>
            <th className="fnt-col-nome">PERÍCIA</th>
            <th className="fnt-col-atr">ATR</th>
            <th className="fnt-col-total">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {periciasConfig.map(p => {
            const atrEfetivo = getAtrEfetivo(p);
            // Livro SNS: nível inicial = ½ Atributo (arredondado para cima)
            const base    = Math.ceil((atr[atrEfetivo.id] ?? 0) / 2);
            // pontos gastos distribuídos pelo jogador
            const extra   = pericias[p.id] ?? 0;
            // bônus de aptidão Perito (+2 na perícia)
            const aptKey  = p.id.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
            const aptBonus = aptPericiaBonus[aptKey] ?? 0;
            // total usado nas rolagens = ½Atr + pts gastos + bônus aptidões
            const total   = base + extra + aptBonus;
            const trocado = !!atrOverride[p.id];

            return (
              <tr key={p.id}>
                <td className="fnt-pericia-rolar">
                  <button className="fn-btn-rolar" onClick={() => handleRolar(p.nome, total, 0)} title={`Rolar ${p.nome}`}>
                    <i className="fas fa-dice-d20" />
                  </button>
                </td>
                <td className="fnt-pericia-nome">{p.nome}</td>
                <td className="fnt-pericia-atr-cell">
                  <div className="fn-atr-dropdown-wrapper">
                    <button
                      className={`fn-atr-badge ${trocado ? "fn-atr-badge-trocado" : ""}`}
                      onClick={() => setDropdownAberto(dropdownAberto === p.id ? null : p.id)}
                      title="Clique para trocar atributo"
                    >
                      {atrEfetivo.sigla}
                    </button>
                    {dropdownAberto === p.id && (
                      <div className="fn-atr-dropdown">
                        {atributosConfig.map(a => (
                          <button
                            key={a.id}
                            className={`fn-atr-dropdown-item ${atrEfetivo.id === a.id ? "fn-atr-dropdown-ativo" : ""}`}
                            onClick={() => {
                              if (a.id === p.atr) {
                                setAtrOverride(prev => { const n = { ...prev }; delete n[p.id]; return n; });
                              } else {
                                setAtrOverride(prev => ({ ...prev, [p.id]: { id: a.id, sigla: a.sigla } }));
                              }
                              setDropdownAberto(null);
                            }}
                          >
                            <span className="fn-atr-dropdown-sigla">{a.sigla}</span>
                            <span className="fn-atr-dropdown-nome">{a.nome}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                {/* Total = ½Atr + Pts — usado na rolagem */}
                <td className="fnt-pericia-total-cell">
                  <span className="fn-pericia-total-num">{total}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
};

// ── Sub-componente: Modal de Testes Sociais ───────────────────────────────────
const testesConfig = [
  {
    id: "atuacao",
    nome: "Atuação",
    formula: "Carisma + ½ Arte",
    base: "carisma",
    pericia: "arte",
    descricao: "Impressione uma plateia com música, canto, poesia ou outra manifestação artística.",
  },
  {
    id: "mudar_atitude",
    nome: "Mudar Atitude",
    formula: "Manipulação + ½ Percepção",
    base: "manipulacao",
    pericia: "percepcao",
    descricao: "Mude a atitude de alguém em uma categoria. Resistido por Inteligência do alvo.",
  },
  {
    id: "barganha",
    nome: "Barganha",
    formula: "Carisma + ½ Percepção",
    base: "carisma",
    pericia: "percepcao",
    descricao: "Negocie preços. Resistido pelo teste de Barganha do outro negociante.",
  },
  {
    id: "blefar",
    nome: "Blefar",
    formula: "Manipulação + ½ Inteligência",
    base: "manipulacao",
    pericia: "inteligencia",
    descricao: "Leve outros a tirar conclusões erradas. Resistido por Inteligência da vítima.",
  },
  {
    id: "intimidacao",
    nome: "Intimidação",
    formula: "Manipulação + ½ Percepção",
    base: "manipulacao",
    pericia: "percepcao",
    descricao: "Force obediência por ameaças ou coação. Resistido por Inteligência do alvo.",
  },
  {
    id: "obter_informacao",
    nome: "Obter Informação",
    formula: "Carisma + ½ Inteligência",
    base: "carisma",
    pericia: "inteligencia",
    descricao: "Faça contatos e descubra informações. Exige um dia inteiro e alguns Ryos.",
  },
];

const ModalTesteSocial = ({ aberto, onFechar, ficha, atr, pericias, handleRolar }) => {
  if (!aberto) return null;

  const calcPrecisao = (teste) => {
    // Livro SNS: Carisma/Manipulação + ½ atributo-ou-perícia (arredondado para cima)
    const baseVal = ficha?.[teste.base] ?? 0;
    const atrPericia = atr?.[teste.pericia];
    let halfPericia;
    if (atrPericia !== undefined) {
      // É um atributo direto (Percepção, Inteligência)
      halfPericia = Math.ceil(atrPericia / 2);
    } else {
      // É uma perícia (Arte): nível total = ½Atr + pts gastos
      // arte -> atributo: inteligencia
      const pCfg = { arte: "inteligencia" };
      const atrLink = pCfg[teste.pericia] ?? "inteligencia";
      const nivelBase  = Math.ceil((atr?.[atrLink] ?? 0) / 2);
      const nivelExtra = pericias?.[teste.pericia] ?? 0;
      const nivelTotal = nivelBase + nivelExtra;
      halfPericia = Math.ceil(nivelTotal / 2);
    }
    return baseVal + halfPericia;
  };

  return (
    <div className="ts-overlay" onClick={onFechar}>
      <div className="ts-modal" onClick={e => e.stopPropagation()}>
        <div className="ts-modal-header">
          <span className="ts-modal-titulo">TESTES SOCIAIS</span>
          <button className="ts-modal-fechar" onClick={onFechar}>×</button>
        </div>
        <div className="ts-modal-lista">
          {testesConfig.map(teste => {
            const precisao = calcPrecisao(teste);
            return (
              <div key={teste.id} className="ts-item">
                <div className="ts-item-top">
                  <div className="ts-item-info">
                    <span className="ts-item-nome">{teste.nome}</span>
                    <span className="ts-item-formula">{teste.formula}</span>
                    <span className="ts-item-desc">{teste.descricao}</span>
                  </div>
                  <div className="ts-item-right">
                    <span className="ts-item-precisao">{precisao}</span>
                    <button
                      className="ts-item-btn"
                      onClick={() => { handleRolar(teste.nome, precisao, 0); onFechar(); }}
                      title={`Rolar ${teste.nome}`}
                    >
                      <i className="fas fa-dice-d20" /> Rolar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
const FichaPersonagemNaruto = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ficha,      setFicha]      = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Identidade
  const [nomePersonagem, setNomePersonagem] = useState("");
  const [nomeJogador,    setNomeJogador]    = useState("");
  const [nc,             setNc]             = useState("");

  // Energias
  const [vitalAtual,  setVitalAtual]  = useState(0);
  const [vitalMax,    setVitalMax]    = useState(0);
  const [chakraAtual, setChakraAtual] = useState(0);
  const [chakraMax,   setChakraMax]   = useState(0);
  const [ryos,        setRyos]        = useState(0);

  // Atributos editáveis localmente
  const [atrEdit, setAtrEdit] = useState({});

  // Bônus manuais para habilidades de combate e iniciativa
  const [hcBonus, setHcBonus] = useState({ CC: 0, CD: 0, ESQ: 0, LM: 0 });
  const [iniciativaBonus, setIniciativaBonus] = useState(0);

  // Perícias — pontos gastos extras (além do base)
  const [pericias, setPericias] = useState({});

  // Aptidões adquiridas
  const [aptidoes, setAptidoes] = useState([]);

  // Rolagens
  const [resultado,     setResultado]     = useState(null);
  const [historico,     setHistorico]     = useState([]);
  const [painelAberto,  setPainelAberto]  = useState(false);
  const [modalTesteAberto, setModalTesteAberto] = useState(false);

  const fichaCarregada = useRef(false);
  const salvarTimer    = useRef(null);
  const payloadRef     = useRef(null);
  const nomeRef        = useRef("");
  useEffect(() => { nomeRef.current = nomePersonagem; }, [nomePersonagem]);

  // ── Fetch ficha ──
  useEffect(() => {
    fetch(`${API}/api/naruto/fichas/${id}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setFicha(data);
        console.log('[DEBUG ficha]', JSON.stringify(data, null, 2));
        setNomePersonagem(data.nome_personagem ?? "");
        setNomeJogador(data.nome_jogador ?? "");
        setNc(data.nc ?? "");
        setVitalAtual(data.vitalidade_atual ?? data.vitalidade_maxima ?? 0);
        setVitalMax(data.vitalidade_maxima ?? 0);
        setChakraAtual(data.chakra_atual ?? data.chakra_maximo ?? 0);
        setChakraMax(data.chakra_maximo ?? 0);
        setRyos(data.ryos ?? 0);

        if (data.dados_pericias) {
          try {
            const dp = typeof data.dados_pericias === "string"
              ? JSON.parse(data.dados_pericias)
              : data.dados_pericias;
            setPericias(dp);
          } catch { }
        }
        if (data.historico_rolagens) {
          try {
            const hr = typeof data.historico_rolagens === "string"
              ? JSON.parse(data.historico_rolagens)
              : data.historico_rolagens;
            setHistorico(hr);
          } catch { }
        }
        if (data.dados_extras) {
          try {
            const extras = typeof data.dados_extras === "string"
              ? JSON.parse(data.dados_extras)
              : data.dados_extras;
            if (extras.atrEdit)       setAtrEdit(extras.atrEdit);
            if (extras.hcBonus)       setHcBonus(extras.hcBonus);
            if (extras.iniciativaBonus !== undefined) setIniciativaBonus(extras.iniciativaBonus);
            if (extras.aptidoes)      setAptidoes(extras.aptidoes);
          } catch { }
        }
        setTimeout(() => { fichaCarregada.current = true; }, 200);
      })
      .catch(() => setFicha(null))
      .finally(() => setCarregando(false));
  }, [id]);

  // ── Autosave ──
  useEffect(() => {
    if (!fichaCarregada.current) return;
    const payload = {
      nome_personagem: nomePersonagem,
      nome_jogador: nomeJogador,
      nc,
      vitalidade_atual: vitalAtual,
      vitalidade_maxima: vitalMax,
      chakra_atual: chakraAtual,
      chakra_maximo: chakraMax,
      ryos,
      dados_pericias: JSON.stringify(pericias),
      historico_rolagens: JSON.stringify(historico),
      dados_extras: JSON.stringify({ atrEdit, hcBonus, iniciativaBonus, aptidoes }),
    };
    payloadRef.current = payload;
    clearTimeout(salvarTimer.current);
    salvarTimer.current = setTimeout(() => {
      fetch(`${API}/api/naruto/fichas/${id}/salvar`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(console.error);
    }, 1500);
  }, [id, nomePersonagem, nomeJogador, nc, vitalAtual, vitalMax, chakraAtual, chakraMax, ryos, pericias, historico, atrEdit, hcBonus, iniciativaBonus]); // eslint-disable-line

  // ── Save on unload ──
  useEffect(() => {
    const handler = () => {
      if (!fichaCarregada.current || !payloadRef.current) return;
      clearTimeout(salvarTimer.current);
      fetch(`${API}/api/naruto/fichas/${id}/salvar`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadRef.current),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [id]);

  const handleVoltar = async () => {
    clearTimeout(salvarTimer.current);
    if (fichaCarregada.current && payloadRef.current) {
      await fetch(`${API}/api/naruto/fichas/${id}/salvar`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadRef.current),
      }).catch(() => {});
    }
    navigate("/personagens");
  };

  // ── Rolar 2d8 ──
  const handleRolar = useCallback((label, precisaoExtra = 0, bonusExtra = 0) => {
    const { d1, d2 } = rolar2d8();
    const soma = d1 + d2;
    const critico     = soma >= 15;
    const falhaCritica = soma <= 3;
    const total = soma + precisaoExtra + bonusExtra;
    const entrada = {
      label, d1, d2,
      precisao: precisaoExtra,
      bonus: bonusExtra,
      total,
      critico,
      falhaCritica,
      timestamp: makeTimestamp(),
      personagem: nomeRef.current,
    };
    setResultado(entrada);
    setHistorico(h => [...h.slice(-99), entrada]);
  }, []);

  // ── Rolar 1d8 (Iniciativa) ──
  const handleRolar1d8 = useCallback((label, bonus = 0) => {
    const d1 = Math.floor(Math.random() * 8) + 1;
    const total = d1 + bonus;
    const critico = d1 === 8;
    const falhaCritica = d1 === 1;
    const entrada = {
      label, d1, d2: null,
      precisao: 0, bonus,
      total, critico, falhaCritica,
      timestamp: makeTimestamp(),
      is1d8: true,
      personagem: nomeRef.current,
    };
    setResultado(entrada);
    setHistorico(h => [...h.slice(-99), entrada]);
  }, []);

  // ── Helpers derivados ──
  const atr = ficha ? {
    forca:        atrEdit.forca        !== undefined ? atrEdit.forca        : (ficha.atr_forca        ?? 0),
    destreza:     atrEdit.destreza     !== undefined ? atrEdit.destreza     : (ficha.atr_destreza     ?? 0),
    agilidade:    atrEdit.agilidade    !== undefined ? atrEdit.agilidade    : (ficha.atr_agilidade    ?? 0),
    percepcao:    atrEdit.percepcao    !== undefined ? atrEdit.percepcao    : (ficha.atr_percepcao    ?? 0),
    inteligencia: atrEdit.inteligencia !== undefined ? atrEdit.inteligencia : (ficha.atr_inteligencia ?? 0),
    vigor:        atrEdit.vigor        !== undefined ? atrEdit.vigor        : (ficha.atr_vigor        ?? 0),
    espirito:     atrEdit.espirito     !== undefined ? atrEdit.espirito     : (ficha.atr_espirito     ?? 0),
  } : {};

  // ── Efeitos das aptidões ──────────────────────────────────────────────────
  const temApt = (id) => aptidoes.some(a => a.id === id);

  // Acuidade: CC usa Destreza
  const ccAtrBase = temApt("acuidade") ? (atr.destreza ?? 0) : (atr.forca ?? 0);

  // Bônus de HC vindo de aptidões
  const aptHcBonus = { CC: 0, CD: 0, ESQ: 0, LM: 0 };
  aptidoes.forEach(a => {
    if (a.efeito?.tipo === "hc") aptHcBonus[a.efeito.key] += a.efeito.val;
  });

  // Bônus de Iniciativa vindo de aptidões (Diligente: +3)
  const aptIniciativaBonus = temApt("diligente") ? 3 : 0;

  // Bônus de perícia vindo de aptidões (Perito: +2)
  const aptPericiaBonus = {};
  aptidoes.forEach(a => {
    if (a.efeito?.tipo === "perito" && a.obs) {
      const key = a.obs.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
      aptPericiaBonus[key] = (aptPericiaBonus[key] ?? 0) + 2;
    }
  });

  const hcCalc = ficha ? {
    CC:  (ficha.hc_base_cc  ?? 3) + ccAtrBase          + (hcBonus.CC  ?? 0) + aptHcBonus.CC,
    CD:  (ficha.hc_base_cd  ?? 3) + (atr.destreza ?? 0) + (hcBonus.CD  ?? 0) + aptHcBonus.CD,
    ESQ: (ficha.hc_base_esq ?? 3) + (atr.agilidade ?? 0) + (hcBonus.ESQ ?? 0) + aptHcBonus.ESQ,
    LM:  (ficha.hc_base_lm  ?? 3) + (atr.percepcao ?? 0) + (hcBonus.LM  ?? 0) + aptHcBonus.LM,
  } : {};

  const iniciativaCalc   = (atr.percepcao ?? 0) + (atr.agilidade ?? 0) + iniciativaBonus + aptIniciativaBonus;
  const reacaoEsqCalc    = (hcCalc.ESQ ?? 0) + 9;
  // Velocista: dobra Agilidade para deslocamento
  const deslocamentoCalc = temApt("velocista")
    ? 10 + (atr.agilidade ?? 0)
    : 10 + Math.floor((atr.agilidade ?? 0) / 2);



  if (carregando) return (
    <div className="fn-loading-page">
      <p className="fn-loading-text">Carregando ficha...</p>
    </div>
  );
  if (!ficha || ficha.error) return (
    <div className="fn-loading-page">
      <p className="fn-loading-text">Ficha não encontrada.</p>
      <button className="fn-voltar-btn" onClick={() => navigate("/personagens")}>← VOLTAR</button>
    </div>
  );

  return (
    <div className="fn-page">

      {/* ── TOPBAR ── */}
      <div className="fn-topbar">
        <button className="fn-voltar-btn" onClick={handleVoltar}>← VOLTAR</button>
      </div>

      <div className="fn-sheet">

        {/* ── IDENTIDADE ── */}
        <div className="fn-identidade">
          <div className="fn-identidade-col">
            <span className="fn-id-label">PERSONAGEM</span>
            <CampoEditavel valor={nomePersonagem} onSalvar={setNomePersonagem} placeholder="Nome" />
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">NÍVEL SHINOBI</span>
            <span className="fn-id-static">{ficha.nivel_shinobi}</span>
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">JOGADOR</span>
            <CampoEditavel valor={nomeJogador} onSalvar={setNomeJogador} placeholder="Jogador" />
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">CLÃ</span>
            <span className="fn-id-static">{ficha.cla_nome}</span>
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">TENDÊNCIA</span>
            <span className="fn-id-static">{ficha.tendencia_nome}</span>
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">NC</span>
            <CampoEditavel valor={nc} onSalvar={setNc} placeholder="NC" />
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="fn-body">

          {/* ── COL ESQUERDA: avatar + atributos + combate ── */}
          <div className="fn-col-esquerda">

            <div className="fn-avatar-wrapper">
              {ficha.imagem
                ? <img src={ficha.imagem} alt={nomePersonagem} className="fn-avatar-img" />
                : <div className="fn-avatar-placeholder">{nomePersonagem?.[0]?.toUpperCase() || "?"}</div>
              }
            </div>

            {/* Energias */}
            <BarraEnergia label="VITALIDADE" cor="#e05050"
              valor={vitalAtual}  max={vitalMax}
              onChange={setVitalAtual} onChangeMax={setVitalMax} />
            <BarraEnergia label="CHAKRA" cor="#4a90e2"
              valor={chakraAtual} max={chakraMax}
              onChange={setChakraAtual} onChangeMax={setChakraMax} />

            {/* Atributos */}
            <div className="fn-secao-titulo">ATRIBUTOS</div>
            <div className="fn-atributos-grid">
              {atributosConfig.map(a => (
                <div key={a.id} className="fn-atr-row">
                  <span className="fn-atr-sigla">{a.sigla}</span>
                  <span className="fn-atr-nome">{a.nome}</span>
                  <CampoNumerico
                    valor={atr[a.id] ?? 0}
                    onChange={v => setAtrEdit(prev => ({ ...prev, [a.id]: v }))}
                    className="fn-atr-val"
                  />
                </div>
              ))}
            </div>

            {/* Habilidades de combate */}
            <div className="fn-secao-titulo">HABILIDADES DE COMBATE</div>
            <div className="fn-combate-grid">
              {[
                { sigla: "CC",  nome: "Combate Corporal",    key: "CC"  },
                { sigla: "CD",  nome: "Combate à Distância", key: "CD"  },
                { sigla: "ESQ", nome: "Esquiva",             key: "ESQ" },
                { sigla: "LM",  nome: "Ler Movimento",       key: "LM"  },
              ].map(h => {
                const base = (ficha[`hc_base_${h.key.toLowerCase()}`] ?? 3) + (
                  h.key === "CC"  ? (atr.forca     ?? 0) :
                  h.key === "CD"  ? (atr.destreza  ?? 0) :
                  h.key === "ESQ" ? (atr.agilidade ?? 0) :
                                    (atr.percepcao ?? 0)
                );
                return (
                  <div key={h.sigla} className="fn-hc-row">
                    <span className="fn-hc-sigla">{h.sigla}</span>
                    <span className="fn-hc-nome">{h.nome}</span>
                    <CampoNumerico
                      valor={hcCalc[h.key]}
                      onChange={v => setHcBonus(prev => ({ ...prev, [h.key]: v - base }))}
                      min={0}
                      className="fn-hc-val"
                    />
                    <button className="fn-btn-rolar fn-hc-rolar" onClick={() => handleRolar(h.nome, hcCalc[h.key], 0)} title={`Rolar ${h.nome}`}>
                      <i className="fas fa-dice-d20" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Stats rápidos */}
            <div className="fn-stats-rapidos">
              <div className="fn-stat-item">
                <span className="fn-stat-label">INICIATIVA</span>
                <CampoNumerico
                  valor={iniciativaCalc}
                  onChange={v => setIniciativaBonus(v - ((atr.percepcao ?? 0) + (atr.agilidade ?? 0)))}
                  min={0}
                  className="fn-stat-val"
                />
                <button className="fn-btn-rolar fn-stat-rolar" onClick={() => handleRolar1d8("Iniciativa", iniciativaCalc)} title="Rolar Iniciativa (1d8)">
                  <i className="fas fa-dice-d20" />
                </button>
              </div>
              <div className="fn-stat-item fn-stat-item--center">
                <span className="fn-stat-label">REAÇÃO ESQ</span>
                <span className="fn-stat-val">{reacaoEsqCalc}</span>
              </div>
              <div className="fn-stat-item">
                <span className="fn-stat-label">DESLOCAMENTO</span>
                <span className="fn-stat-val">{deslocamentoCalc}m</span>
              </div>
            </div>

            {/* Sociais */}
            <div className="fn-secao-titulo">SOCIAIS</div>
            <div className="fn-sociais-grid">
              <div className="fn-social-item">
                <span className="fn-social-label">CARISMA</span>
                <span className="fn-social-val">{ficha.carisma ?? 0}</span>
              </div>
              <div className="fn-social-item">
                <span className="fn-social-label">MANIPULAÇÃO</span>
                <span className="fn-social-val">{ficha.manipulacao ?? 0}</span>
              </div>
            </div>
            <button className="fn-btn-escolher-teste" onClick={() => setModalTesteAberto(true)}>
              <i className="fas fa-dice-d20" /> Escolher Teste
            </button>
          </div>

          {/* ── COL DIREITA: abas ── */}
          <div className="fn-col-direita">

            {/* Precisão global + histórico */}
            <div className="fn-topbar-direita">
              <button className="fn-icone-btn" onClick={() => setPainelAberto(p => !p)} title="Histórico">
                <i className="fa-solid fa-book" />
              </button>
            </div>

            {/* Perícias + Aptidões lado a lado */}
            <div className="fn-aba-conteudo">
              <div className="fn-pericias-aptidoes-row">
                <AbaPericiasNova
                  periciasConfig={periciasConfig}
                  atributosConfig={atributosConfig}
                  atr={atr}
                  pericias={pericias}
                  setPericias={setPericias}
                  aptPericiaBonus={aptPericiaBonus}
                  aptidoes={aptidoes}
                  handleRolar={handleRolar}
                />
                <div className="fn-aptidoes-col">
                  <AbaAptidoes
                    aptidoes={aptidoes}
                    setAptidoes={setAptidoes}
                    atr={atr}
                    pericias={pericias}
                    hcCalc={hcCalc}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ResultadoRolagem resultado={resultado} onFechar={() => setResultado(null)} />
      <PainelHistorico historico={historico} aberto={painelAberto} onFechar={() => setPainelAberto(false)} />
      <ModalTesteSocial
        aberto={modalTesteAberto}
        onFechar={() => setModalTesteAberto(false)}
        ficha={ficha}
        atr={atr}
        pericias={pericias}
        handleRolar={handleRolar}
      />
    </div>
  );
};

export default FichaPersonagemNaruto;