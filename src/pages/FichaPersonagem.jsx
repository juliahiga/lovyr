import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/FichaPersonagem.css";

const periciasConfig = [
    { key: "brutalidade", label: "Brutalidade" },
    { key: "mira", label: "Mira" },
    { key: "agilidade", label: "Agilidade" },
    { key: "instinto", label: "Instinto" },
    { key: "coleta", label: "Sucatear" },
    { key: "sobrevivencia", label: "Sobrevivência" },
    { key: "manutencao", label: "Mecânica" },
    { key: "medicina", label: "Medicina" },
];

const dadosOpcoes = ["D10", "D12", "D20"];

const HABILIDADE_PERICIA_MAP = {
    agr: "brutalidade",
    con: "mira",
    csc: "instinto",
    agi: "agilidade",
    cat: "coleta",
    sob: "sobrevivencia",
    cur: "medicina",
    eng: "manutencao",
};

const calcularBonusDeHabilidades = (comprados) => {
    const delta = {};
    Object.entries(comprados).forEach(([id, tierComprado]) => {
        const periciaKey = HABILIDADE_PERICIA_MAP[id];
        if (!periciaKey || !tierComprado) return;
        delta[periciaKey] = (delta[periciaKey] || 0) + tierComprado;
    });
    return delta;
};

const rolarDado = (dadoStr) => {
    const faces = parseInt(dadoStr.replace("D", ""), 10);
    return Math.floor(Math.random() * faces) + 1;
};

const LOJA = {
    habilidades: {
        label: "Habilidades",
        cor: "#C79255",
        itens: [
            { id: "agr", nome: "Agressividade", desc: "Aumenta o bônus da Perícia de Brutalidade.", tiers: [{ custo: 40, efeito: "Brutalidade +1" }, { custo: 50, efeito: "Brutalidade +1" }, { custo: 60, efeito: "Brutalidade +1" }] },
            { id: "con", nome: "Constância", desc: "Aumenta o bônus da Perícia de de Mira.", tiers: [{ custo: 40, efeito: "Mira +1" }, { custo: 50, efeito: "Mira +1" }, { custo: 60, efeito: "Mira +1" }] },
            { id: "csc", nome: "Consciência", desc: "Aumenta o bônus da Perícia de Instinto.", tiers: [{ custo: 30, efeito: "Instinto +1" }, { custo: 40, efeito: "Instinto +1" }, { custo: 50, efeito: "Instinto +1" }] },
            { id: "agi", nome: "Ágil", desc: "Aumenta o bônus da Perícia de Agilidade.", tiers: [{ custo: 50, efeito: "Agilidade +1" }, { custo: 60, efeito: "Agilidade +1" }, { custo: 70, efeito: "Agilidade +1" }] },
            { id: "cat", nome: "Catador", desc: "Aumenta o bônus da Perícia de Vasculhar.", tiers: [{ custo: 30, efeito: "Vasculhar +1" }, { custo: 40, efeito: "Vasculhar +1" }, { custo: 50, efeito: "Vasculhar +1" }] },
            { id: "sob", nome: "Sobrevivente", desc: "Aumenta o bônus da Perícia de Sobrevivência.", tiers: [{ custo: 20, efeito: "Sobrevivência +1" }, { custo: 30, efeito: "Sobrevivência +1" }, { custo: 40, efeito: "Sobrevivência +1" }] },
            { id: "cur", nome: "Curandeiro", desc: "Aumenta o bônus da Perícia de Medicina.", tiers: [{ custo: 20, efeito: "Medicina +1" }, { custo: 30, efeito: "Medicina +1" }, { custo: 40, efeito: "Medicina +1" }] },
            { id: "eng", nome: "Engenheiro", desc: "Aumenta o bônus da Perícia de Manutenção.", tiers: [{ custo: 30, efeito: "Manutenção +1" }, { custo: 40, efeito: "Manutenção +1" }, { custo: 50, efeito: "Manutenção +1" }] },
        ],
    },
    sobrevivencia: {
        label: "Sobrevivência",
        cor: "#4ade80",
        itens: [
            { id: "crv", nome: "Corvo", desc: "Encontre itens adicionais ao vasculhar.", tiers: [{ custo: 30, efeito: "Dobra Pílulas/Peças ao vasculhar" }, { custo: 50, efeito: "Item adicional ao vasculhar" }, { custo: 70, efeito: "Itens extras acumulam" }] },
            { id: "vno", nome: "Visão Noturna", desc: "Vantagem em Testes de Instinto em ambientes escuros.", tiers: [{ custo: 70, efeito: "Vantagem em Instinto no escuro" }] },
            { id: "med", nome: "Médico", desc: "Aumenta a quantidade de cura dos Kits de Primeiros Socorros.", tiers: [{ custo: 25, efeito: "20HP + Teste de Medicina" }, { custo: 50, efeito: "35HP + Teste de Medicina" }, { custo: 75, efeito: "50HP + Teste de Medicina" }] },
            { id: "fci", nome: "Facas Improvisadas", desc: "Aumenta a durabilidade das Facas/Estiletes.", tiers: [{ custo: 40, efeito: "Facas têm dois usos antes de quebrar" }] },
            { id: "res", nome: "Resistir e Sobreviver", desc: "Sem Kit, pode rolar uma vez por dia para recuperar Vida.", tiers: [{ custo: 20, efeito: "D6 Vida" }, { custo: 40, efeito: "D12 Vida" }, { custo: 60, efeito: "D20 Vida" }] },
            { id: "vid", nome: "Vida", desc: "Aumenta a Vida Máxima.", tiers: [{ custo: 60, efeito: "50 Vida Máxima" }, { custo: 80, efeito: "75 Vida Máxima" }, { custo: 100, efeito: "100 Vida Máxima" }] },
            { id: "ban", nome: "Bancada de Trabalho", desc: "Aumenta o Nível da Ferramenta.", tiers: [{ custo: 50, efeito: "Ferramenta Nível 2" }, { custo: 80, efeito: "Ferramenta Nível 3" }, { custo: 110, efeito: "Ferramenta Nível 4" }] },
            { id: "rel", nome: "Resiliência", desc: "Re-rolagens de dados uma vez por dia.", tiers: [{ custo: 30, efeito: "Uma Re-Rolagem" }, { custo: 60, efeito: "Duas Re-Rolagens" }, { custo: 90, efeito: "Três Re-Rolagens" }] },
        ],
    },
    combate: {
        label: "Combate",
        cor: "#f87171",
        itens: [
            { id: "pen", nome: "Punhos Ensanguentados", desc: "Aumenta o dano corpo a corpo.", tiers: [{ custo: 30, efeito: "1D8 Dano" }, { custo: 50, efeito: "2D10 Dano" }, { custo: 70, efeito: "1D12 Dano" }] },
            { id: "dur", nome: "Durável", desc: "Aumenta a durabilidade das armas corpo a corpo.", tiers: [{ custo: 25, efeito: "Durabilidade extra" }, { custo: 40, efeito: "Segunda durabilidade extra" }, { custo: 55, efeito: "Terceira durabilidade extra" }] },
            { id: "lut", nome: "Lutador", desc: "Golpes extras corpo a corpo por turno.", tiers: [{ custo: 25, efeito: "Segundo golpe" }, { custo: 50, efeito: "Terceiro golpe" }, { custo: 75, efeito: "Terceiro golpe dano dobrado" }] },
            { id: "imp", nome: "Impulso", desc: "Golpe fatal gera ataque extra.", tiers: [{ custo: 90, efeito: "Ataque extra após golpe fatal" }] },
            { id: "sfr", nome: "Sangue Frio", desc: "Modificadores adicionais em testes de Furtividade.", tiers: [{ custo: 30, efeito: "+1 em Furtividade" }, { custo: 60, efeito: "+2 em Furtividade" }, { custo: 90, efeito: "+3 em Furtividade" }] },
            { id: "adr", nome: "Corrida de Adrenalina", desc: "Vida ≤10: dados extras nos testes de Habilidade.", tiers: [{ custo: 20, efeito: "D4 nos testes" }, { custo: 40, efeito: "D6 nos testes" }, { custo: 60, efeito: "D8 nos testes" }] },
            { id: "fur", nome: "Fúria", desc: "Vantagem em um teste de Brutalidade por combate.", tiers: [{ custo: 70, efeito: "Vantagem em Brutalidade 1×/combate" }] },
            { id: "pre", nome: "Precisão", desc: "Vantagem em um teste de Mira por combate.", tiers: [{ custo: 70, efeito: "Vantagem em Mira 1×/combate" }] },
            { id: "fco", nome: "Fogo de Cobertura", desc: "Disparo gratuito ao escolher Cobertura (desvantagem em Mira).", tiers: [{ custo: 60, efeito: "Disparo gratuito ao cobrir" }] },
            { id: "fsu", nome: "Fogo Supressor", desc: "Mantém inimigo sob pressão; consome munição dobrada.", tiers: [{ custo: 50, efeito: "Desvantagem + disparo de reação" }] },
            { id: "gex", nome: "Golpe Extra", desc: "Adiciona modificador de Mira/Brutalidade ao Dano.", tiers: [{ custo: 50, efeito: "Modificador = Dano adicional" }, { custo: 80, efeito: "Dano do Modificador dobrado" }] },
            { id: "ulc", nome: "Última Chance", desc: "Ao cair para 0HP pela 1ª vez, cai para 1HP.", tiers: [{ custo: 90, efeito: "Sobrevive com 1HP uma vez" }] },
        ],
    },
};

const CampoEditavel = ({ valor, onSalvar, placeholder, className }) => {
    const [editando, setEditando] = useState(false);
    const [inputVal, setInputVal] = useState(valor);
    const inputRef = useRef(null);
    useEffect(() => { setInputVal(valor); }, [valor]);
    useEffect(() => { if (editando && inputRef.current) inputRef.current.select(); }, [editando]);
    const confirmar = () => { onSalvar(inputVal.trim() || valor); setEditando(false); };
    if (editando) return (
        <input ref={inputRef} className={`ficha-identidade-input ${className || ""}`} value={inputVal} placeholder={placeholder}
            onChange={e => setInputVal(e.target.value)} onBlur={confirmar}
            onKeyDown={e => { if (e.key === "Enter") confirmar(); if (e.key === "Escape") { setInputVal(valor); setEditando(false); } }} />
    );
    return (
        <span className={`ficha-identidade-valor ficha-identidade-editavel ${className || ""}`} onClick={() => setEditando(true)} title="Clique para editar">
            {valor || <span className="ficha-identidade-vazio">{placeholder}</span>}
            <i className="fas fa-pen ficha-identidade-edit-icon" />
        </span>
    );
};

const DadoSelector = ({ valor, onChange }) => {
    const [aberto, setAberto] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    return (
        <div className="dado-selector" ref={ref}>
            <div className="ficha-circulo ficha-circulo-dado" onClick={() => setAberto(v => !v)}>{valor}</div>
            {aberto && (
                <div className="dado-dropdown">
                    {dadosOpcoes.map(d => (
                        <div key={d} className={`dado-opcao ${d === valor ? "dado-opcao-ativo" : ""}`} onClick={() => { onChange(d); setAberto(false); }}>{d}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

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

    // Modo ataque com dano separado
    if (resultado.isDano) {
        const facesAtaque = parseInt((resultado.dadoPericia || "D10").replace("D", ""), 10);
        const clsAtaque = resultado.rolagemAtaque === facesAtaque ? "critico-max" : resultado.rolagemAtaque === 1 ? "critico-min" : "";
        const ataqueColor = clsAtaque === "critico-max" ? "#22c55e" : clsAtaque === "critico-min" ? "#ef4444" : "#C79255";
        const ataqueShadow = clsAtaque === "critico-max" ? "0 0 24px rgba(34,197,94,0.55)" : clsAtaque === "critico-min" ? "0 0 24px rgba(239,68,68,0.55)" : "none";

        return (
            <div className="rolagem-overlay" onClick={onFechar}>
                <div className={`rolagem-painel ${animando ? "rolagem-animando" : ""}`} onClick={e => e.stopPropagation()}>
                    <button className="rolagem-fechar" onClick={onFechar}>×</button>
                    <div className={`rolagem-icone ${clsAtaque}`}>
                        <i className="fas fa-dice-d20 rolagem-dado-svg" />
                    </div>
                    <div className="rolagem-nome">{resultado.label}</div>
                    <div style={{
                        display: "flex", alignItems: "stretch", gap: 0,
                        margin: "10px 0 6px", border: `1px solid ${clsAtaque ? ataqueColor : "#3a3020"}`,
                        borderRadius: 8, overflow: "hidden",
                        boxShadow: clsAtaque ? ataqueShadow : "none",
                    }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 20px", background: "#0e0c08" }}>
                            <span style={{ fontFamily: "'Google Sans',sans-serif", fontSize: "2.4rem", fontWeight: 900, color: ataqueColor, lineHeight: 1, textShadow: clsAtaque ? ataqueShadow : "none" }}>
                                {resultado.ataqueTotal}
                            </span>
                            <span style={{ fontFamily: "'Google Sans',sans-serif", fontSize: "0.6rem", color: "#666", letterSpacing: "2px", textTransform: "uppercase", marginTop: 6 }}>
                                ATAQUE
                            </span>
                        </div>
                        <div style={{ width: 1, background: clsAtaque ? ataqueColor : "#3a3020" }} />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 20px", background: "#0e0c08" }}>
                            <span style={{ fontFamily: "'Google Sans',sans-serif", fontSize: "2.4rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                                {resultado.total}
                            </span>
                            <span style={{ fontFamily: "'Google Sans',sans-serif", fontSize: "0.6rem", color: "#666", letterSpacing: "2px", textTransform: "uppercase", marginTop: 6 }}>
                                DANO
                            </span>
                        </div>
                    </div>
                    <div className="rolagem-formula-label">
                        {resultado.periciaNome} · 1{resultado.dadoPericia}({resultado.rolagemAtaque}){resultado.bonusPericia !== 0 ? `${resultado.bonusPericia >= 0 ? "+" : ""}${resultado.bonusPericia}` : ""} = {resultado.ataqueTotal} · Dano: {resultado.dado}
                    </div>
                </div>
            </div>
        );
    }

    const { label, dado, valorDado, bonus, total } = resultado;
    const bonusNum = parseInt(bonus, 10) || 0;
    const dadoMatch = dado.match(/(\d+)D(\d+)/i);
    const qtdDados = dadoMatch ? parseInt(dadoMatch[1]) : 1;
    const faces = dadoMatch ? parseInt(dadoMatch[2]) : parseInt(dado.replace(/\D/g, ""), 10);
    const minPossivel = qtdDados;
    const maxPossivel = qtdDados * faces;
    const cls = valorDado === maxPossivel ? "critico-max" : valorDado === minPossivel ? "critico-min" : "";

    return (
        <div className="rolagem-overlay" onClick={onFechar}>
            <div className={`rolagem-painel ${animando ? "rolagem-animando" : ""}`} onClick={e => e.stopPropagation()}>
                <button className="rolagem-fechar" onClick={onFechar}>×</button>

                <div className={`rolagem-icone ${cls}`}>
                    <i className="fas fa-dice-d20 rolagem-dado-svg" />
                </div>

                <div className="rolagem-nome">{label}</div>

                <div className="rolagem-nova-formula">
                    <div className={`rolagem-dado-destaque ${cls}`}>
                        [{valorDado}]
                    </div>
                    {(bonusNum !== 0 || resultado.formulaResto) && (
                        <div className="rolagem-formula-resto">
                            {resultado.formulaResto
                                ? resultado.formulaResto.toUpperCase()
                                : `${bonusNum >= 0 ? "+" : ""}${bonusNum}`
                            }
                        </div>
                    )}
                    <div className="rolagem-igual">=</div>
                    <div className={`rolagem-total-novo ${cls}`}>{total}</div>
                </div>

                <div className="rolagem-formula-label">
                    Rolagem de Dado
                </div>
            </div>
        </div>
    );
};

const VidaControl = ({ valor, max, onChange, onChangeMax }) => {
    const [eA, setEA] = useState(false); const [eM, setEM] = useState(false);
    const [iA, setIA] = useState(String(valor)); const [iM, setIM] = useState(String(max));
    const rA = useRef(null); const rM = useRef(null);
    useEffect(() => { if (eA && rA.current) rA.current.select(); }, [eA]);
    useEffect(() => { if (eM && rM.current) rM.current.select(); }, [eM]);
    const cA = () => { const n = parseInt(iA, 10); if (!isNaN(n)) onChange(n); setEA(false); };
    const cM = () => { const n = parseInt(iM, 10); if (!isNaN(n)) onChangeMax(n); setEM(false); };
    const pct = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0;
    const slot = { display: "inline-block", width: "42px", textAlign: "center", cursor: "text" };
    const inp = { width: "42px", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "1rem", fontWeight: "700", textAlign: "center", fontFamily: '"Be Vietnam Pro",sans-serif', letterSpacing: "2px" };
    return (
        <div className="vida-control">
            <div className="vida-titulo">VIDA</div>
            <div className="vida-barra-wrapper">
                <div className="vida-barra-fill" style={{ width: `${pct}%` }} />
                <button className="vida-btn" onClick={() => onChange(valor - 5)}>«</button>
                <button className="vida-btn" onClick={() => onChange(valor - 1)}>‹</button>
                <div className="vida-barra-bg">
                    <div className="vida-barra-texto">
                        <span style={slot}>{eA
                            ? <input ref={rA} className="vida-input-edit" style={inp} type="number" value={iA} onChange={e => setIA(e.target.value)} onBlur={cA} onKeyDown={e => { if (e.key === "Enter") cA(); if (e.key === "Escape") setEA(false); }} />
                            : <span onClick={() => { setIA(String(valor)); setEA(true); }}>{valor}</span>}
                        </span>
                        <span style={{ opacity: 0.5 }}>/</span>
                        <span style={slot}>{eM
                            ? <input ref={rM} className="vida-input-edit" style={inp} type="number" value={iM} onChange={e => setIM(e.target.value)} onBlur={cM} onKeyDown={e => { if (e.key === "Enter") cM(); if (e.key === "Escape") setEM(false); }} />
                            : <span onClick={() => { setIM(String(max)); setEM(true); }}>{max}</span>}
                        </span>
                    </div>
                </div>
                <button className="vida-btn" onClick={() => onChange(valor + 1)}>›</button>
                <button className="vida-btn" onClick={() => onChange(valor + 5)}>»</button>
            </div>
        </div>
    );
};

const ArmaSlot = ({ titulo }) => (
    <div className="ficha-arma-slot">
        <div className="ficha-arma-titulo">{titulo}</div>
        <div className="ficha-arma-row ficha-arma-row-top">
            <div className="ficha-arma-field ficha-arma-nome"><span className="ficha-field-label">NOME</span><input className="ficha-input" /></div>
            <div className="ficha-arma-field ficha-arma-small"><span className="ficha-field-label">DANO</span><input className="ficha-input" /></div>
            <div className="ficha-arma-field ficha-arma-small"><span className="ficha-field-label">PENTE</span><input className="ficha-input" /></div>
            <div className="ficha-arma-field ficha-arma-small"><span className="ficha-field-label">CAPACIDADE</span><input className="ficha-input" /></div>
        </div>
        <div className="ficha-arma-row">
            <div className="ficha-arma-field ficha-arma-medium"><span className="ficha-field-label">CADÊNCIA DE TIRO</span><input className="ficha-input" /></div>
            <div className="ficha-arma-field ficha-arma-medium"><span className="ficha-field-label">PERFURAÇÃO DA ARMA</span><input className="ficha-input" /></div>
        </div>
    </div>
);

const ModalNovoAtaque = ({ onConfirmar, onFechar, ataqueInicial }) => {
    const [novo, setNovo] = useState(ataqueInicial ?? {
        nome: "Novo Ataque",
        dano: "",
        critico: "10",
        multiplicador: "2",
        ataqueBonus: "0",
        alcance: "-",
        pericia: "brutalidade",
        imagem: null,
        anotacoes: "",
    });

    const imagemRef = useRef(null);
    const anotacoesRef = useRef(null);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        if (ataqueInicial?.anotacoes && anotacoesRef.current) {
            anotacoesRef.current.innerHTML = ataqueInicial.anotacoes;
        }
        return () => { document.body.style.overflow = prev || ""; };
    }, []);

    const set = (k, v) => setNovo(p => ({ ...p, [k]: v }));

    const handleImagem = e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => set("imagem", ev.target.result);
        reader.readAsDataURL(file);
    };

    const aplicarFormato = (cmd) => {
        anotacoesRef.current?.focus();
        document.execCommand(cmd, false, null);
    };

    const inputStyle = {
        background: "#0e0c08", border: "1px solid #2a2218", borderRadius: "4px",
        color: "#fff", fontFamily: "'Google Sans', sans-serif", fontSize: "0.88rem",
        padding: "6px 10px", outline: "none", boxSizing: "border-box", width: "100%",
        transition: "border-color 0.2s",
    };

    const labelStyle = {
        fontFamily: "'Google Sans', sans-serif", fontSize: "0.65rem", color: "#777",
        letterSpacing: "1px", textTransform: "uppercase", marginBottom: "3px", display: "block",
    };

    const fieldStyle = { display: "flex", flexDirection: "column" };

    return (
        <div
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)",
                display: "flex", alignItems: "flex-start", justifyContent: "center",
                zIndex: 900, backdropFilter: "blur(2px)",
                padding: "80px 16px 1px", boxSizing: "border-box", overscrollBehavior: "contain",
            }}
            onClick={onFechar}
        >
            <div
                style={{
                    background: "#111009", border: "1px solid #C79255", borderRadius: "12px",
                    width: "100%", maxWidth: "520px", maxHeight: "700px", height: "85vh",
                    display: "flex", flexDirection: "column",
                    boxShadow: "0 12px 48px rgba(0,0,0,0.8)",
                    overflow: "hidden", overscrollBehavior: "contain", isolation: "isolate", margin: "auto",
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "18px 22px 14px", borderBottom: "1px solid #2a2218", flexShrink: 0,
                }}>
                    <span style={{ fontFamily: "'Google Sans', sans-serif", fontSize: "1.05rem", fontWeight: 800, color: "#fff" }}>
                        {ataqueInicial ? "Editar Ataque" : "Novo Ataque"}
                    </span>
                    <button onClick={onFechar}
                        style={{ background: "none", border: "none", color: "#666", fontSize: "1.2rem", cursor: "pointer", padding: "2px 6px", borderRadius: "4px", transition: "color .15s" }}
                        onMouseOver={e => e.currentTarget.style.color = "#C79255"}
                        onMouseOut={e => e.currentTarget.style.color = "#666"}>
                        <i className="fas fa-times" />
                    </button>
                </div>

                <div style={{
                    flex: 1, overflowY: "auto", padding: "20px 22px 4px",
                    display: "flex", flexDirection: "column", gap: "14px",
                    scrollbarWidth: "thin", scrollbarColor: "#3a3020 #0e0c08",
                }}>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Nome *</label>
                        <input style={inputStyle} value={novo.nome} onChange={e => set("nome", e.target.value)}
                            onFocus={e => e.target.style.borderColor = "#C79255"}
                            onBlur={e => e.target.style.borderColor = "#2a2218"} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                        {[
                            { k: "dano", l: "Dano *", p: "1d4" },
                            { k: "critico", l: "Crítico *", p: "20" },
                            { k: "multiplicador", l: "Multiplicador *", p: "2" },
                        ].map(({ k, l, p }) => (
                            <div key={k} style={fieldStyle}>
                                <label style={labelStyle}>{l}</label>
                                <input style={inputStyle} value={novo[k]} placeholder={p}
                                    onChange={e => set(k, e.target.value)}
                                    onFocus={e => e.target.style.borderColor = "#C79255"}
                                    onBlur={e => e.target.style.borderColor = "#2a2218"} />
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Ataque Bônus</label>
                            <input
                                style={{ ...inputStyle, MozAppearance: "textfield" }}
                                type="number"
                                value={novo.ataqueBonus}
                                onChange={e => set("ataqueBonus", e.target.value)}
                                onFocus={e => e.target.style.borderColor = "#C79255"}
                                onBlur={e => e.target.style.borderColor = "#2a2218"}
                                onWheel={e => e.target.blur()}
                                className="no-spinner"
                            />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Alcance</label>
                            <select
                                style={{ ...inputStyle, cursor: "pointer" }}
                                value={novo.alcance ?? "-"}
                                onChange={e => set("alcance", e.target.value)}
                                onFocus={e => e.target.style.borderColor = "#C79255"}
                                onBlur={e => e.target.style.borderColor = "#2a2218"}
                            >
                                <option value="-">-</option>
                                <option value="Curto">Curto</option>
                                <option value="Médio">Médio</option>
                                <option value="Longo">Longo</option>
                                <option value="Extremo">Extremo</option>
                            </select>
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Perícia</label>
                            <select
                                style={{ ...inputStyle, cursor: "pointer" }}
                                value={novo.pericia ?? "brutalidade"}
                                onChange={e => set("pericia", e.target.value)}
                                onFocus={e => e.target.style.borderColor = "#C79255"}
                                onBlur={e => e.target.style.borderColor = "#2a2218"}
                            >
                                {periciasConfig.map(p => (
                                    <option key={p.key} value={p.key}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={fieldStyle}>
                        <label style={labelStyle}>Imagem</label>
                        <div
                            style={{
                                width: "72px", height: "72px", background: "#0e0c08",
                                border: "1px solid #2a2218", borderRadius: "6px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", overflow: "hidden", transition: "border-color .2s",
                            }}
                            onClick={() => imagemRef.current?.click()}
                            onMouseOver={e => e.currentTarget.style.borderColor = "#C79255"}
                            onMouseOut={e => e.currentTarget.style.borderColor = "#2a2218"}
                        >
                            {novo.imagem
                                ? <img src={novo.imagem} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <i className="fas fa-image" style={{ color: "#3a3020", fontSize: "1.6rem" }} />
                            }
                        </div>
                        <input ref={imagemRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImagem} />
                    </div>

                    <div style={fieldStyle}>
                        <label style={{ ...labelStyle, marginBottom: "6px" }}>
                            Anotações{" "}
                            <span style={{ color: "#4a3a28", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
                                (utilize negrito para aplicar a cor roxo)
                            </span>
                        </label>
                        <div style={{
                            display: "flex", gap: "4px", padding: "6px 8px",
                            background: "#0e0c08", border: "1px solid #2a2218",
                            borderBottom: "none", borderRadius: "4px 4px 0 0",
                        }}>
                            {[
                                { cmd: "bold", icon: "B", extra: { fontWeight: 900 } },
                                { cmd: "italic", icon: "I", extra: { fontStyle: "italic" } },
                                { cmd: "underline", icon: "U", extra: { textDecoration: "underline" } },
                            ].map(({ cmd, icon, extra }) => (
                                <button key={cmd}
                                    onMouseDown={e => { e.preventDefault(); aplicarFormato(cmd); }}
                                    style={{
                                        background: "none", border: "none", color: "#aaa", cursor: "pointer",
                                        fontFamily: "'Google Sans', sans-serif", fontSize: "0.85rem",
                                        padding: "2px 8px", borderRadius: "3px", transition: "color .15s, background .15s",
                                        ...extra,
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "#2a2218"; }}
                                    onMouseOut={e => { e.currentTarget.style.color = "#aaa"; e.currentTarget.style.background = "none"; }}>
                                    {icon}
                                </button>
                            ))}
                        </div>
                        <div ref={anotacoesRef} contentEditable suppressContentEditableWarning
                            onInput={e => set("anotacoes", e.currentTarget.innerHTML)}
                            style={{
                                background: "#0e0c08", border: "1px solid #2a2218",
                                borderRadius: "0 0 4px 4px", color: "#ccc",
                                fontFamily: "'Google Sans', sans-serif", fontSize: "0.82rem",
                                padding: "10px 12px", minHeight: "110px", outline: "none",
                                lineHeight: 1.6, transition: "border-color .2s",
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = "#C79255"}
                            onBlur={e => e.currentTarget.style.borderColor = "#2a2218"} />
                    </div>

                    <div style={{ height: "6px", flexShrink: 0 }} />
                </div>

                <div style={{
                    display: "flex", justifyContent: "flex-end", gap: "10px",
                    padding: "14px 22px 18px", borderTop: "1px solid #2a2218", flexShrink: 0,
                }}>
                    <button onClick={onFechar}
                        style={{
                            background: "none", border: "1px solid #4a1a1a", color: "#c0392b",
                            fontFamily: "'Google Sans', sans-serif", fontSize: "0.65rem",
                            padding: "5px 10px", borderRadius: "4px", cursor: "pointer", transition: "background .2s",
                        }}
                        onMouseOver={e => e.currentTarget.style.background = "rgba(192, 57, 43, 0.15)"}
                        onMouseOut={e => e.currentTarget.style.background = "none"}>
                        CANCELAR
                    </button>
                    <button onClick={() => { if (novo.nome.trim()) onConfirmar(novo); }}
                        style={{
                            background: "#C79255", border: "none", color: "#0e0c08",
                            fontFamily: "'Google Sans', sans-serif", fontSize: "12px", fontWeight: 600,
                            letterSpacing: "0.5px", padding: "7px 20px", borderRadius: "4px", cursor: "pointer", transition: "opacity .2s",
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = "0.85"}
                        onMouseOut={e => e.currentTarget.style.opacity = "1"}>
                        {ataqueInicial ? "SALVAR" : "ADICIONAR"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ModalLoja = ({ pilulas, onGastarPilulas, comprados, onComprar, onFechar }) => {
    const [catAtiva, setCatAtiva] = useState("habilidades");
    const [busca, setBusca] = useState("");
    const [expandidos, setExpandidos] = useState({});
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev || ""; };
    }, []);

    const mostrarToast = (msg, tipo = "erro") => {
        setToast({ msg, tipo }); setTimeout(() => setToast(null), 2500);
    };

    const tierAtual = id => comprados[id] ?? 0;

    const comprarTier = (item, idx) => {
        const atual = tierAtual(item.id);
        if (idx !== atual) { mostrarToast(idx > atual ? `Compre o Tier ${atual + 1} primeiro!` : "Já comprado."); return; }
        const custo = item.tiers[idx].custo;
        const saldo = parseInt(pilulas, 10) || 0;
        if (saldo < custo) { mostrarToast(`Pílulas insuficientes! (${saldo}/${custo})`); return; }
        onGastarPilulas(custo);
        onComprar(item.id, idx + 1);
        mostrarToast(`${item.nome} Tier ${idx + 1} desbloqueado!`, "ok");
    };

    const catData = LOJA[catAtiva];
    const catKeys = Object.keys(LOJA);
    const filtrados = catData.itens.filter(i => i.nome.toLowerCase().includes(busca.toLowerCase()));

    return (
        <div className="loja-overlay" onClick={onFechar}>
            <div className="loja-modal" onClick={e => e.stopPropagation()}>
                <div className="loja-header">
                    <h2 className="loja-titulo">Melhorias de Sobrevivência</h2>
                    <button className="loja-fechar" onClick={onFechar}><i className="fas fa-times" /></button>
                </div>
                <div className="loja-pilulas-bar">
                    <i className="fas fa-capsules" />
                    <span>Pílulas disponíveis:</span>
                    <strong>{parseInt(pilulas, 10) || 0}</strong>
                </div>
                <div className="loja-cats">
                    {catKeys.map(k => (
                        <button key={k}
                            className={`loja-cat-btn ${catAtiva === k ? "loja-cat-ativa" : ""}`}
                            style={catAtiva === k ? { color: LOJA[k].cor, borderBottomColor: LOJA[k].cor } : {}}
                            onClick={() => { setCatAtiva(k); setBusca(""); }}>
                            {LOJA[k].label}
                        </button>
                    ))}
                </div>
                <div className="loja-busca-row">
                    <i className="fas fa-search loja-busca-icon" />
                    <input className="loja-busca-input" placeholder="Buscar habilidade..." value={busca} onChange={e => setBusca(e.target.value)} />
                </div>
                {toast && <div className={`loja-toast loja-toast-${toast.tipo}`}>{toast.msg}</div>}
                <div className="loja-lista">
                    {filtrados.map(item => {
                        const comprado = tierAtual(item.id);
                        const total = item.tiers.length;
                        const isMax = comprado >= total;
                        const exp = expandidos[item.id];
                        return (
                            <div key={item.id} className={`loja-item ${isMax ? "loja-item-max" : ""}`}>
                                <div className="loja-item-header" onClick={() => setExpandidos(p => ({ ...p, [item.id]: !p[item.id] }))}>
                                    <button className="loja-item-chevron"><i className={`fas fa-chevron-${exp ? "up" : "down"}`} /></button>
                                    <div className="loja-item-info">
                                        <div className="loja-item-nome-row">
                                            <span className="loja-item-nome" style={{ color: catData.cor }}>{item.nome}</span>
                                            {isMax && <span className="loja-badge-max">MAX</span>}
                                        </div>
                                        <div className="loja-progress-row">
                                            {item.tiers.map((_, i) => (
                                                <div key={i} className="loja-progress-pip"
                                                    style={{ background: i < comprado ? catData.cor : "#2a2218", borderColor: i < comprado ? catData.cor : "#3a3020" }} />
                                            ))}
                                            <span className="loja-progress-label">{comprado}/{total}</span>
                                        </div>
                                    </div>
                                    {!isMax && (
                                        <button className="loja-item-add"
                                            style={{ borderColor: catData.cor, color: catData.cor }}
                                            onClick={e => { e.stopPropagation(); comprarTier(item, comprado); }}>
                                            <i className="fas fa-plus" />
                                        </button>
                                    )}
                                </div>
                                {exp && (
                                    <div className="loja-item-corpo">
                                        <p className="loja-item-desc">{item.desc}</p>
                                        <div className="loja-tiers-lista">
                                            {item.tiers.map((tier, idx) => {
                                                const done = idx < comprado;
                                                const next = idx === comprado;
                                                const locked = idx > comprado;
                                                return (
                                                    <div key={idx} className={`loja-tier-row ${done ? "lt-done" : ""} ${locked ? "lt-locked" : ""}`}>
                                                        <div className="lt-left">
                                                            <span className="lt-label">Tier {idx + 1}</span>
                                                            <span className="lt-efeito">{tier.efeito}</span>
                                                        </div>
                                                        <div className="lt-right">
                                                            <span className="lt-custo"><i className="fas fa-capsules" /> {tier.custo}</span>
                                                            {done && <span className="lt-status lt-ok"><i className="fas fa-check" /></span>}
                                                            {locked && <span className="lt-status lt-lock"><i className="fas fa-lock" /></span>}
                                                            {next && (
                                                                <button className="lt-buy" style={{ background: catData.cor }}
                                                                    onClick={() => comprarTier(item, idx)}>
                                                                    Comprar
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {filtrados.length === 0 && <p className="loja-vazio">Nenhuma habilidade encontrada.</p>}
                </div>
            </div>
        </div>
    );
};

const parsearFormula = (formula) => {
    const str = formula.trim().toLowerCase().replace(/\s/g, "");
    const dadoMatch = str.match(/^(\d*)d(\d+)/);
    if (!dadoMatch) return null;
    const qtd = parseInt(dadoMatch[1] || "1", 10);
    const faces = parseInt(dadoMatch[2], 10);
    if (qtd < 1 || qtd > 20 || faces < 2) return null;
    const resto = str.slice(dadoMatch[0].length);
    let bonus = 0;
    if (resto) {
        try {
            bonus = Math.round(Function(`"use strict"; return (${resto})`)());
            if (!isFinite(bonus)) return null;
        } catch {
            return null;
        }
    }
    return { qtd, faces, bonus, resto };
};

const AbaCombate = ({ onRolar, bonus, dados }) => {
    const [formula, setFormula] = useState("");
    const [erro, setErro] = useState(false);
    const [ataques, setAtaques] = useState([]);
    const [exp, setExp] = useState({});
    const [modal, setModal] = useState(false);
    const [ataqueEditando, setAtaqueEditando] = useState(null);
    const [imgAmpliada, setImgAmpliada] = useState(null);

    const rolarLivre = () => {
        const parsed = parsearFormula(formula);
        if (!parsed) { setErro(true); return; }
        setErro(false);
        const { qtd, faces, bonus: b, resto } = parsed;
        let soma = 0;
        for (let i = 0; i < qtd; i++) soma += Math.floor(Math.random() * faces) + 1;
        onRolar({ label: formula.trim().toUpperCase(), dado: `${qtd}D${faces}`, valorDado: soma, bonus: b, formulaResto: resto || null, total: soma + b });
    };

    const rolarAtaque = ataque => {
        const m = (ataque.dano || "1d4").match(/(\d+)[dD](\d+)/);
        let danoVal = 0, dadoDano = ataque.dano || "1d4";
        if (m) {
            const q = parseInt(m[1]), f = parseInt(m[2]);
            dadoDano = `${q}D${f}`;
            for (let i = 0; i < q; i++) danoVal += Math.floor(Math.random() * f) + 1;
        } else danoVal = 1;
        const bonusPericia = parseInt(bonus?.[ataque.pericia], 10) || 0;
        const ataqueBonus = parseInt(ataque.ataqueBonus, 10) || 0;
        const dadoPericia = dados?.[ataque.pericia] ?? "D10";
        const facesPericia = parseInt(dadoPericia.replace("D", ""), 10);
        const rolagemAtaque = Math.floor(Math.random() * facesPericia) + 1;
        const ataqueTotal = rolagemAtaque + bonusPericia + ataqueBonus;
        onRolar({
            label: ataque.nome,
            dado: dadoDano,
            valorDado: danoVal,
            bonus: 0,
            total: danoVal,
            ataqueTotal,
            rolagemAtaque,
            dadoPericia,
            bonusPericia,
            ataqueBonus,
            periciaNome: periciasConfig.find(p => p.key === ataque.pericia)?.label || "",
            isDano: true,
        });
    };

    const adicionar = (novoAtaque) => {
        if (ataqueEditando) {
            setAtaques(p => p.map(a => a.id === ataqueEditando.id ? { ...a, ...novoAtaque } : a));
            setAtaqueEditando(null);
        } else {
            setAtaques(p => [...p, { id: Date.now(), ...novoAtaque }]);
        }
        setModal(false);
    };

    const abrirEdicao = (ataque) => {
        setAtaqueEditando(ataque);
        setModal(true);
    };

    return (
        <div className="aba-content">
            <div className="aba-filtro-row aba-filtro-com-btn" style={{ flexDirection: "column", alignItems: "stretch", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input className="aba-filtro-input"
                        style={{ flex: 1, borderBottom: `1px solid ${erro ? "#ef4444" : "#3a3020"}` }}
                        placeholder="Rolar Dados" value={formula}
                        onChange={e => { setFormula(e.target.value); setErro(false); }}
                        onKeyDown={e => e.key === "Enter" && rolarLivre()} spellCheck={false} />
                    <button className="aba-icon-btn" onClick={rolarLivre} title="Rolar" style={{ color: erro ? "#ef4444" : undefined }}>
                        <i className="fas fa-dice-d20" />
                    </button>
                    <button className="aba-btn-novo" onClick={() => { setAtaqueEditando(null); setModal(true); }}>NOVO ATAQUE</button>
                </div>
                {erro && <span style={{ fontSize: ".62rem", color: "#ef4444", letterSpacing: 1, fontFamily: "'Google Sans', sans-serif", paddingLeft: 2 }}>Fórmula inválida — use ex: 2d10+2 ou d20</span>}
            </div>

            <div className="aba-lista">
                {ataques.length === 0 && <p className="ficha-aba-vazio">Nenhum ataque cadastrado.</p>}
                {ataques.map(a => (
                    <div key={a.id} className="aba-item">
                        <div className="aba-item-header" onClick={() => setExp(p => ({ ...p, [a.id]: !p[a.id] }))}>
                            <button className="aba-chevron"><i className={`fas fa-chevron-${exp[a.id] ? "up" : "down"}`} /></button>
                            <div className="aba-item-info">
                                <span className="aba-item-nome">{a.nome}</span>
                                <div className="aba-item-meta">
                                    {a.dano && <span className="aba-tag">Dano: <strong>{a.dano}</strong></span>}
                                    {a.critico && <span className="aba-tag">Crítico: <strong>{a.critico}</strong></span>}
                                </div>
                            </div>
                            <button className="aba-icon-btn" onClick={e => { e.stopPropagation(); rolarAtaque(a); }}>
                                <i className="fas fa-dice-d20" />
                            </button>
                        </div>
                        {exp[a.id] && (
                            <div className="ataque-expandido">
                                <div className="ataque-expandido-info">
                                    {a.multiplicador && <span className="ataque-detalhe">Multiplicador: <strong>×{a.multiplicador}</strong></span>}
                                    <span className="ataque-detalhe">Ataque Bônus: <strong>{a.ataqueBonus || "0"}</strong></span>
                                    {(a.alcance && a.alcance !== "-") && (
                                        <span className="ataque-detalhe">Alcance: <strong>{a.alcance}</strong></span>
                                    )}
                                    {a.pericia && <span className="ataque-detalhe">Perícia: <strong>{periciasConfig.find(p => p.key === a.pericia)?.label || "—"}</strong></span>}
                                    {a.anotacoes && (
                                        <p className="ataque-detalhe" dangerouslySetInnerHTML={{ __html: a.anotacoes }} />
                                    )}
                                    <div className="ataque-expandido-btns">
                                        <button className="aba-btn-remover" onClick={() => setAtaques(p => p.filter(x => x.id !== a.id))}>
                                            REMOVER
                                        </button>
                                        <button className="aba-btn-editar" onClick={e => { e.stopPropagation(); abrirEdicao(a); }}>
                                            EDITAR
                                        </button>
                                    </div>
                                </div>
                                {a.imagem && (
                                    <img
                                        src={a.imagem}
                                        alt=""
                                        className="ataque-expandido-img"
                                        style={{ cursor: "zoom-in" }}
                                        onClick={e => { e.stopPropagation(); setImgAmpliada(a.imagem); }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {modal && (
                <ModalNovoAtaque
                    onConfirmar={adicionar}
                    onFechar={() => { setModal(false); setAtaqueEditando(null); }}
                    ataqueInicial={ataqueEditando}
                />
            )}

            {imgAmpliada && (
                <div
                    onClick={() => setImgAmpliada(null)}
                    style={{
                        position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 1100, backdropFilter: "blur(4px)", cursor: "zoom-out",
                    }}
                >
                    <img
                        src={imgAmpliada}
                        alt=""
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: "500px", height: "500px",
                            borderRadius: "10px", border: "none",
                            objectFit: "cover", cursor: "default",
                        }}
                    />
                    <button
                        onClick={() => setImgAmpliada(null)}
                        style={{
                            position: "fixed", top: 20, right: 24,
                            background: "none", border: "none", color: "#C79255",
                            fontSize: "1.8rem", cursor: "pointer", lineHeight: 1,
                            transition: "opacity .2s",
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = "0.7"}
                        onMouseOut={e => e.currentTarget.style.opacity = "1"}
                    >×</button>
                </div>
            )}
        </div>
    );
};

const AbaHabilidades = ({ pilulas, onGastarPilulas, onDevolverPilulas, compradosGlobal, onCompradosChange }) => {
    const [lojaAberta, setLojaAberta] = useState(false);
    const [expandidos, setExpandidos] = useState({});
    const [filtro, setFiltro] = useState("");

    const comprados = compradosGlobal;
    const onComprar = (id, tier) => onCompradosChange(prev => ({ ...prev, [id]: tier }));

    const adquiridas = [];
    Object.entries(LOJA).forEach(([, cat]) => {
        cat.itens.forEach(item => {
            const t = comprados[item.id];
            if (t && t > 0) adquiridas.push({ item, cat, tierComprado: t });
        });
    });

    const adquiridasFiltradas = adquiridas.filter(({ item }) =>
        item.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="aba-content">
            <div className="aba-filtro-row aba-filtro-com-btn">
                <input className="aba-filtro-input" placeholder="Filtrar habilidades" value={filtro} onChange={e => setFiltro(e.target.value)} />
                <button className="aba-btn-adicionar" onClick={() => setLojaAberta(true)}>
                    + ADICIONAR
                </button>
            </div>
            <div className="aba-lista">
                {adquiridasFiltradas.length === 0 && <p className="ficha-aba-vazio">Nenhuma habilidade adquirida.<br />Clique em Adicionar para comprar.</p>}
                {adquiridasFiltradas.map(({ item, cat, tierComprado }) => (
                    <div key={item.id} className="aba-item">
                        <div className="aba-item-header" onClick={() => setExpandidos(p => ({ ...p, [item.id]: !p[item.id] }))}>
                            <button className="aba-chevron"><i className={`fas fa-chevron-${expandidos[item.id] ? "up" : "down"}`} /></button>
                            <div className="aba-item-info">
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span className="aba-item-nome" style={{ color: cat.cor }}>{item.nome}</span>
                                    {tierComprado >= item.tiers.length && <span className="loja-badge-max">MAX</span>}
                                </div>
                                <div className="loja-progress-row" style={{ marginTop: 3 }}>
                                    {item.tiers.map((_, i) => (
                                        <div key={i} className="loja-progress-pip"
                                            style={{ background: i < tierComprado ? cat.cor : "#2a2218", borderColor: i < tierComprado ? cat.cor : "#3a3020" }} />
                                    ))}
                                    <span className="loja-progress-label">{tierComprado}/{item.tiers.length}</span>
                                </div>
                            </div>
                            <button
                                className="aba-icon-btn"
                                style={{ color: "#c0392b" }}
                                title={tierComprado > 1 ? `Remover Tier ${tierComprado}` : "Remover habilidade"}
                                onClick={e => {
                                    e.stopPropagation();
                                    const custoDevolver = item.tiers[tierComprado - 1]?.custo ?? 0;
                                    onDevolverPilulas(custoDevolver);
                                    if (tierComprado > 1) {
                                        onCompradosChange(prev => ({ ...prev, [item.id]: tierComprado - 1 }));
                                    } else {
                                        onCompradosChange(prev => {
                                            const next = { ...prev };
                                            delete next[item.id];
                                            return next;
                                        });
                                    }
                                }}
                            >
                                <i className="fas fa-trash" />
                            </button>
                            {tierComprado < item.tiers.length && (
                                <button className="aba-icon-btn" style={{ color: cat.cor }}
                                    onClick={e => { e.stopPropagation(); setLojaAberta(true); }}>
                                    <i className="fas fa-level-up-alt" />
                                </button>
                            )}
                        </div>
                        {expandidos[item.id] && (
                            <div className="aba-item-corpo">
                                <p className="aba-item-desc">{item.desc}</p>
                                <p className="aba-item-desc" style={{ color: cat.cor, fontWeight: 700 }}>
                                    Tier {tierComprado}: {item.tiers[tierComprado - 1]?.efeito}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {lojaAberta && (
                <ModalLoja
                    pilulas={pilulas}
                    onGastarPilulas={onGastarPilulas}
                    comprados={comprados}
                    onComprar={onComprar}
                    onFechar={() => setLojaAberta(false)}
                />
            )}
        </div>
    );
};

const CATS_MOCHILA = [
    { key: "armas", label: "Armas", cor: "#C79255" },
    { key: "municoes", label: "Munições", cor: "#60a5fa" },
    { key: "geral", label: "Geral", cor: "#a78bfa" },
];

const ModalLojaMochila = ({ onAdicionarItem, onFechar }) => {
    const [catAtiva, setCatAtiva] = useState("armas");
    const [busca, setBusca] = useState("");
    const [lojaData, setLojaData] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [expandidos, setExpandidos] = useState({});

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        fetch("http://localhost:3001/api/tlou/loja", { credentials: "include" })
            .then(r => r.json())
            .then(d => setLojaData(d))
            .catch(() => setLojaData(null))
            .finally(() => setCarregando(false));
        return () => { document.body.style.overflow = prev || ""; };
    }, []);

    const cor = CATS_MOCHILA.find(c => c.key === catAtiva)?.cor ?? "#C79255";

    const itensDaCat = () => {
        if (!lojaData) return [];
        if (catAtiva === "armas") return lojaData.armas || [];
        if (catAtiva === "municoes") return lojaData.municoes || [];
        if (catAtiva === "geral") return lojaData.geral || [];
        return [];
    };

    const melhoriasDaArma = arma_id =>
        (lojaData?.melhorias || []).filter(m => m.arma_id === arma_id);

    const filtrados = itensDaCat().filter(i =>
        i.nome.toLowerCase().includes(busca.toLowerCase())
    );

    const toggleExp = key => setExpandidos(p => ({ ...p, [key]: !p[key] }));

    const construirItem = (item) => {
        if (catAtiva === "armas") {
            const partes = [
                item.dano ? `Dano: ${item.dano}` : "",
                item.taxa_fogo ? `Taxa de Fogo: ${item.taxa_fogo}` : "",
                item.municao ? `Munição: ${item.municao}` : "",
                item.capacidade ? `Capacidade: ${item.capacidade}` : "",
                item.recarga ? `Recarga: ${item.recarga}` : "",
                item.perfuracao_armadura ? `Perfuração: ${item.perfuracao_armadura}` : "",
                item.observacoes ? item.observacoes : "",
            ].filter(Boolean);
            return { id: Date.now(), nome: item.nome, categoria: "Arma", espacos: "", descricao: partes.join(" · "), equipado: false };
        }
        if (catAtiva === "municoes") {
            return { id: Date.now(), nome: item.nome, categoria: "Munição", espacos: item.espacos ?? 1, descricao: item.descricao || "", equipado: false };
        }
        // geral
        const partes = [item.descricao, item.efeito].filter(Boolean);
        return { id: Date.now(), nome: item.nome, categoria: "Geral", espacos: "", descricao: partes.join(" | "), equipado: false };
    };

    const renderArma = (item) => {
        const expKey = `arma-${item.id}`;
        const exp = expandidos[expKey];
        const grupos = melhoriasDaArma(item.id).reduce((acc, m) => {
            if (!acc[m.categoria]) acc[m.categoria] = [];
            acc[m.categoria].push(m);
            return acc;
        }, {});
        return (
            <div key={item.id} className="loja-item">
                <div className="loja-item-header" onClick={() => toggleExp(expKey)}>
                    <button className="loja-item-chevron"><i className={`fas fa-chevron-${exp ? "up" : "down"}`} /></button>
                    <div className="loja-item-info">
                        <div className="loja-item-nome-row">
                            <span className="loja-item-nome" style={{ color: cor }}>{item.nome}</span>
                            {item.habilidade && <span style={{ fontSize: ".6rem", color: "#666", fontFamily: "'Google Sans',sans-serif" }}>{item.habilidade}</span>}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                            {item.dano && <span className="aba-tag">Dano: <strong>{item.dano}</strong></span>}
                            {item.municao && <span className="aba-tag">Mun: <strong>{item.municao}</strong></span>}
                            {item.taxa_fogo && <span className="aba-tag">Taxa: <strong>{item.taxa_fogo}</strong></span>}
                            {item.capacidade && <span className="aba-tag">Cap: <strong>{item.capacidade}</strong></span>}
                        </div>
                    </div>
                    <button className="loja-item-add" style={{ borderColor: cor, color: cor, flexShrink: 0 }}
                        onClick={e => { e.stopPropagation(); onAdicionarItem(construirItem(item)); }}>
                        <i className="fas fa-plus" />
                    </button>
                </div>
                {exp && (
                    <div className="loja-item-corpo">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "8px" }}>
                            {item.recarga && <span style={{ fontSize: ".72rem", color: "#aaa", fontFamily: "'Google Sans',sans-serif" }}>Recarga: <strong style={{ color: cor }}>{item.recarga}</strong></span>}
                            {item.perfuracao_armadura && <span style={{ fontSize: ".72rem", color: "#aaa", fontFamily: "'Google Sans',sans-serif" }}>Perfuração: <strong style={{ color: cor }}>{item.perfuracao_armadura}</strong></span>}
                            {item.construcao_sucatas && <span style={{ fontSize: ".72rem", color: "#aaa", fontFamily: "'Google Sans',sans-serif" }}>Construção: <strong style={{ color: cor }}>{item.construcao_sucatas} sucatas</strong></span>}
                        </div>
                        {item.observacoes && <p className="loja-item-desc">{item.observacoes}</p>}
                        {Object.keys(grupos).length > 0 && (
                            <>
                                <div style={{ fontSize: ".6rem", color: "#555", letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'Google Sans',sans-serif", margin: "10px 0 6px" }}>Melhorias</div>
                                {Object.entries(grupos).map(([cat, mels]) => (
                                    <div key={cat} style={{ marginBottom: "6px" }}>
                                        <div style={{ fontSize: ".58rem", color: cor, letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'Google Sans',sans-serif", marginBottom: "3px" }}>{cat}</div>
                                        {mels.map(m => (
                                            <div key={m.id} className="loja-tier-row" style={{ marginBottom: "2px" }}>
                                                <div className="lt-left"><span className="lt-efeito">{m.descricao}</span></div>
                                                <div className="lt-right">
                                                    {m.nivel_ferramenta && <span style={{ fontSize: ".6rem", color: "#888", fontFamily: "'Google Sans',sans-serif" }}>Ferr. Nv{m.nivel_ferramenta}</span>}
                                                    {m.custo_sucatas && <span className="lt-custo" style={{ marginLeft: 6 }}><i className="fas fa-cogs" /> {m.custo_sucatas}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderItemSimples = (item) => {
        const expKey = `item-${catAtiva}-${item.id}`;
        const exp = expandidos[expKey];
        const temDetalhes = item.descricao || item.efeito;
        return (
            <div key={item.id} className="loja-item">
                <div className="loja-item-header" onClick={() => temDetalhes && toggleExp(expKey)}>
                    {temDetalhes
                        ? <button className="loja-item-chevron"><i className={`fas fa-chevron-${exp ? "up" : "down"}`} /></button>
                        : <div style={{ width: 20, flexShrink: 0 }} />
                    }
                    <div className="loja-item-info">
                        <div className="loja-item-nome-row">
                            <span className="loja-item-nome" style={{ color: cor }}>{item.nome}</span>
                            {item.custo_sucatas && (
                                <span style={{ fontSize: ".6rem", color: "#888", fontFamily: "'Google Sans',sans-serif" }}>
                                    <i className="fas fa-cogs" style={{ marginRight: 3 }} />{item.custo_sucatas} sucatas
                                </span>
                            )}
                            {catAtiva === "municoes" && item.espacos > 0 && (
                                <span style={{ fontSize: ".6rem", color: "#666", fontFamily: "'Google Sans',sans-serif" }}>
                                    {item.espacos} espaço{item.espacos > 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                        {item.descricao && (
                            <div style={{ fontSize: ".7rem", color: "#888", fontFamily: "'Google Sans',sans-serif", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "260px" }}>
                                {item.descricao}
                            </div>
                        )}
                    </div>
                    <button className="loja-item-add" style={{ borderColor: cor, color: cor, flexShrink: 0 }}
                        onClick={e => { e.stopPropagation(); onAdicionarItem(construirItem(item)); }}>
                        <i className="fas fa-plus" />
                    </button>
                </div>
                {exp && (item.descricao || item.efeito) && (
                    <div className="loja-item-corpo">
                        {item.descricao && <p className="loja-item-desc">{item.descricao}</p>}
                        {item.efeito && <p className="loja-item-desc" style={{ color: cor }}><strong>Efeito:</strong> {item.efeito}</p>}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="loja-overlay" onClick={onFechar}>
            <div className="loja-modal" onClick={e => e.stopPropagation()}>
                <div className="loja-header">
                    <h2 className="loja-titulo">Itens</h2>
                    <button className="loja-fechar" onClick={onFechar}><i className="fas fa-times" /></button>
                </div>
                <div className="loja-cats">
                    {CATS_MOCHILA.map(c => (
                        <button key={c.key}
                            className={`loja-cat-btn ${catAtiva === c.key ? "loja-cat-ativa" : ""}`}
                            style={catAtiva === c.key ? { color: c.cor, borderBottomColor: c.cor } : {}}
                            onClick={() => { setCatAtiva(c.key); setBusca(""); setExpandidos({}); }}>
                            {c.label}
                        </button>
                    ))}
                </div>
                <div className="loja-busca-row">
                    <i className="fas fa-search loja-busca-icon" />
                    <input className="loja-busca-input" placeholder="Buscar item..." value={busca} onChange={e => setBusca(e.target.value)} />
                </div>
                <div className="loja-lista">
                    {carregando && (
                        <p style={{ color: "#666", textAlign: "center", padding: "30px 0", fontFamily: "'Google Sans',sans-serif", fontSize: ".8rem" }}>
                            <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Carregando...
                        </p>
                    )}
                    {!carregando && !lojaData && <p className="loja-vazio">Erro ao carregar itens.</p>}
                    {!carregando && lojaData && filtrados.length === 0 && <p className="loja-vazio">Nenhum item encontrado.</p>}
                    {!carregando && lojaData && filtrados.map(item =>
                        catAtiva === "armas" ? renderArma(item) : renderItemSimples(item)
                    )}
                </div>
            </div>
        </div>
    );
};

const AbaMochila = ({ itens, setItens }) => {
    const [filtro, setFiltro] = useState("");
    const [exp, setExp] = useState({});
    const [lojaAberta, setLojaAberta] = useState(false);

    const filtrados = itens.filter(i => i.nome.toLowerCase().includes(filtro.toLowerCase()));
    const toggleEquip = id => setItens(p => p.map(i => i.id === id ? { ...i, equipado: !i.equipado } : i));
    const adicionarDaLoja = item => setItens(p => [...p, { ...item, id: Date.now() }]);

    return (
        <div className="aba-content">
            <div className="aba-filtro-row aba-filtro-com-btn">
                <input className="aba-filtro-input" placeholder="Filtrar itens" value={filtro} onChange={e => setFiltro(e.target.value)} />
                <button className="aba-btn-adicionar" onClick={() => setLojaAberta(true)}>+ ADICIONAR</button>
            </div>
            <div className="aba-lista">
                {filtrados.length === 0 && <p className="ficha-aba-vazio">Mochila vazia.</p>}
                {filtrados.map(item => (
                    <div key={item.id} className="aba-item">
                        <div className="aba-item-header" onClick={() => setExp(p => ({ ...p, [item.id]: !p[item.id] }))}>
                            <button className="aba-chevron"><i className={`fas fa-chevron-${exp[item.id] ? "up" : "down"}`} /></button>
                            <div className="aba-item-info">
                                <span className="aba-item-nome">{item.nome}</span>
                                <div className="aba-item-meta">
                                    <span className="aba-tag">Categoria: <strong>{item.categoria}</strong></span>
                                    {item.espacos !== "" && item.espacos !== undefined && (
                                        <span className="aba-tag">Espaços: <strong>{item.espacos}</strong></span>
                                    )}
                                </div>
                            </div>
                            <button className={`mochila-equip-btn ${item.equipado ? "mochila-equip-on" : ""}`}
                                onClick={e => { e.stopPropagation(); toggleEquip(item.id); }}>
                                <i className={`fas ${item.equipado ? "fa-check-square" : "fa-square"}`} />
                            </button>
                        </div>
                        {exp[item.id] && (
                            <div className="aba-item-corpo">
                                {item.descricao && <p className="aba-item-desc">{item.descricao}</p>}
                                <button className="aba-btn-remover" onClick={() => setItens(p => p.filter(x => x.id !== item.id))}>
                                    <i className="fas fa-trash" /> Remover
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {lojaAberta && <ModalLojaMochila onAdicionarItem={adicionarDaLoja} onFechar={() => setLojaAberta(false)} />}
        </div>
    );
};

const FichaPersonagem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ficha, setFicha] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [abaAtiva, setAbaAtiva] = useState("combate");
    const [coldreLongo, setColdreLongo] = useState(false);
    const [coldreCurto, setColdreCurto] = useState(false);
    const [nomePersonagem, setNomePersonagem] = useState("");
    const [nomeJogador, setNomeJogador] = useState("");
    const [tipoSobrevivente, setTipoSobrevivente] = useState("");
    const [classeSobrevivente, setClasseSobrevivente] = useState("");
    const [vidaAtual, setVidaAtual] = useState(0);
    const [vidaMax, setVidaMax] = useState(0);
    const [sucata, setSucata] = useState("");
    const [pilulas, setPilulas] = useState("");
    const [nivFerramenta, setNivFerramenta] = useState("");
    const [medicinaVal, setMedicinaVal] = useState("");
    const [bonusBase, setBonusBase] = useState({});
    const [compradosGlobal, setCompradosGlobal] = useState({});
    const [dados, setDados] = useState({});
    const [resultado, setResultado] = useState(null);

    const [itensMochila, setItensMochila] = useState([]);

    const salvarTimer = useRef(null);
    const fichaCarregada = useRef(false);
    const estadoAtual = useRef({});

    const bonusDeHabilidades = calcularBonusDeHabilidades(compradosGlobal);
    const bonus = Object.fromEntries(
        periciasConfig.map(p => [
            p.key,
            (parseInt(bonusBase[p.key], 10) || 0) + (bonusDeHabilidades[p.key] || 0)
        ])
    );

    useEffect(() => {
        estadoAtual.current = {
            nome_personagem: nomePersonagem,
            nome_jogador: nomeJogador,
            vida_atual: vidaAtual,
            vida_maxima: vidaMax,
            pilulas: parseInt(pilulas, 10) || 0,
            sucata: parseInt(sucata, 10) || 0,
            nivel_ferramenta: parseInt(nivFerramenta, 10) || 1,
            medicina_val: medicinaVal,
            brutalidade: parseInt(bonusBase.brutalidade, 10) || 0,
            mira: parseInt(bonusBase.mira, 10) || 0,
            agilidade: parseInt(bonusBase.agilidade, 10) || 0,
            instinto: parseInt(bonusBase.instinto, 10) || 0,
            coleta: parseInt(bonusBase.coleta, 10) || 0,
            sobrevivencia: parseInt(bonusBase.sobrevivencia, 10) || 0,
            manutencao: parseInt(bonusBase.manutencao, 10) || 0,
            medicina: parseInt(bonusBase.medicina, 10) || 0,
            dados_pericias: JSON.stringify(dados),
            habilidades_compradas: JSON.stringify(compradosGlobal),
            itens_mochila: JSON.stringify(itensMochila),
        };
    }, [nomePersonagem, nomeJogador, vidaAtual, vidaMax, pilulas, sucata,
        nivFerramenta, medicinaVal, bonusBase, dados, compradosGlobal, itensMochila]);
    useEffect(() => {
        if (!fichaCarregada.current) return;
        clearTimeout(salvarTimer.current);
        salvarTimer.current = setTimeout(async () => {
            try {
                await fetch(`http://localhost:3001/api/tlou/fichas/${id}/salvar`, {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(estadoAtual.current),
                });
            } catch (e) {
                console.error("Erro ao salvar:", e);
            }
        }, 1000);
    }, [nomePersonagem, nomeJogador, vidaAtual, vidaMax, pilulas, sucata,
        nivFerramenta, medicinaVal, bonusBase, dados, compradosGlobal, itensMochila]);

    useEffect(() => {
        fetch(`http://localhost:3001/api/tlou/fichas/${id}`, { credentials: "include" })
            .then(r => r.json())
            .then(data => {
                setFicha(data);
                setNomePersonagem(data.nome_personagem ?? "");
                setNomeJogador(data.nome_jogador ?? "");
                setTipoSobrevivente(data.nivel ?? "");
                setClasseSobrevivente(data.classe ?? "");
                setVidaAtual(data.vida_atual ?? data.vida_maxima ?? 0);
                setVidaMax(data.vida_maxima ?? 0);
                setPilulas(String(data.pilulas ?? ""));
                setSucata(String(data.sucata ?? ""));
                setNivFerramenta(String(data.nivel_ferramenta ?? ""));
                setMedicinaVal(data.medicina_val ?? "");
                const b = {}, d = {};
                periciasConfig.forEach(p => {
                    b[p.key] = data[p.key] ?? 0;
                    d[p.key] = "D10";
                });
                setBonusBase(b);
                if (data.dados_pericias) {
                    try { setDados(JSON.parse(data.dados_pericias)); } catch { setDados(d); }
                } else {
                    setDados(d);
                }
                if (data.habilidades_compradas) {
                    try { setCompradosGlobal(JSON.parse(data.habilidades_compradas)); } catch { }
                }
                if (data.itens_mochila) {
                    try { setItensMochila(JSON.parse(data.itens_mochila)); } catch { }
                }
                setTimeout(() => {
                    fichaCarregada.current = true;
                }, 200);
            })
            .catch(() => setFicha(null))
            .finally(() => setCarregando(false));
    }, [id]);

    const handleRolar = (key, label) => {
        const dado = dados[key] ?? "D10";
        const bv = parseInt(bonus[key], 10) || 0;
        const v = rolarDado(dado);
        setResultado({ label, dado, valorDado: v, bonus: bv, total: v + bv });
    };

    const handleGastarPilulas = custo => {
        setPilulas(p => String(Math.max(0, (parseInt(p, 10) || 0) - custo)));
    };

    const handleDevolverPilulas = quantidade => {
        setPilulas(p => String((parseInt(p, 10) || 0) + quantidade));
    };

    if (carregando) return <div className="ficha-loading-page"><p className="ficha-loading-text">Carregando ficha...</p></div>;
    if (!ficha || ficha.error) return (
        <div className="ficha-loading-page">
            <p className="ficha-loading-text">Ficha não encontrada.</p>
            <button className="ficha-voltar-btn" onClick={() => navigate("/personagens")}>← VOLTAR</button>
        </div>
    );

    return (
        <div className="ficha-page">
            <div className="ficha-topbar">
                <button className="ficha-voltar-btn" onClick={() => navigate("/personagens")}>← VOLTAR</button>
            </div>

            <div className="ficha-sheet">
                <div className="ficha-identidade">
                    <div className="ficha-identidade-esquerda">
                        <div className="ficha-identidade-col">
                            <span className="ficha-identidade-label">PERSONAGEM</span>
                            <CampoEditavel valor={nomePersonagem} onSalvar={setNomePersonagem} placeholder="Nome do personagem" />
                        </div>
                        <div className="ficha-identidade-col">
                            <span className="ficha-identidade-label">SOBREVIVENTE</span>
                            <span className="ficha-identidade-valor ficha-identidade-static">{tipoSobrevivente || <span className="ficha-identidade-vazio">—</span>}</span>
                        </div>
                    </div>
                    <div className="ficha-identidade-meio">
                        <div className="ficha-identidade-col">
                            <span className="ficha-identidade-label">JOGADOR</span>
                            <CampoEditavel valor={nomeJogador} onSalvar={setNomeJogador} placeholder="Nome do jogador" />
                        </div>
                        <div className="ficha-identidade-col">
                            <span className="ficha-identidade-label">CLASSE</span>
                            <span className="ficha-identidade-valor ficha-identidade-static">{classeSobrevivente || <span className="ficha-identidade-vazio">—</span>}</span>
                        </div>
                    </div>
                </div>

                <div className="ficha-body">
                    <div className="ficha-col-esquerda">
                        <div className="ficha-pericias-bloco">
                            <div className="ficha-avatar-wrapper">
                                {ficha.imagem
                                    ? <img src={ficha.imagem} alt={nomePersonagem} className="ficha-avatar-img" />
                                    : <div className="ficha-avatar-placeholder">{nomePersonagem?.[0]?.toUpperCase() || "?"}</div>}
                            </div>
                            <VidaControl valor={vidaAtual} max={vidaMax} onChange={setVidaAtual} onChangeMax={setVidaMax} />
                            <table className="ficha-pericias-tabela">
                                <thead><tr><th>PERÍCIA</th><th>BÔNUS</th><th>DADO</th><th></th></tr></thead>
                                <tbody>
                                    {periciasConfig.map(p => (
                                        <tr key={p.key}>
                                            <td className="ficha-pericia-nome">{p.label}</td>
                                            <td className="ficha-pericia-bonus">
                                                <div className="ficha-circulo">
                                                    <input className="ficha-circulo-input" type="number" min={0}
                                                        value={bonus[p.key] ?? 0}
                                                        onChange={e => setBonusBase(prev => ({ ...prev, [p.key]: e.target.value }))} />
                                                </div>
                                            </td>
                                            <td className="ficha-pericia-dado">
                                                <DadoSelector valor={dados[p.key] ?? "D10"} onChange={v => setDados(prev => ({ ...prev, [p.key]: v }))} />
                                            </td>
                                            <td className="ficha-pericia-rolar">
                                                <button className="ficha-btn-rolar" onClick={() => handleRolar(p.key, p.label)}>
                                                    <i className="fas fa-dice-d20 ficha-btn-rolar-icon" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="ficha-col-meio">
                        <div className="ficha-status-row">
                            <div className="ficha-status-campo"><span className="ficha-field-label">SUCATA</span><input className="ficha-input ficha-status-input" value={sucata} onChange={e => setSucata(e.target.value)} /></div>
                            <div className="ficha-status-campo"><span className="ficha-field-label">PÍLULAS</span><input className="ficha-input ficha-status-input" value={pilulas} onChange={e => setPilulas(e.target.value)} /></div>
                            <div className="ficha-status-campo"><span className="ficha-field-label">NÍV. FERRAMENTA</span><input className="ficha-input ficha-status-input" value={nivFerramenta} onChange={e => setNivFerramenta(e.target.value)} /></div>
                            <div className="ficha-status-campo"><span className="ficha-field-label">REMÉDIO</span><input className="ficha-input ficha-status-input" value={medicinaVal} onChange={e => setMedicinaVal(e.target.value)} /></div>
                        </div>
                        <ArmaSlot titulo="ARMA LONGA" />
                        <ArmaSlot titulo="ARMA CURTA" />
                        {coldreLongo && <ArmaSlot titulo="COLDRE ARMA LONGA" />}
                        {coldreCurto && <ArmaSlot titulo="COLDRE ARMA CURTA" />}
                        <ArmaSlot titulo="MELEE" />
                        <div className="ficha-coldre-adicionar">
                            {!coldreLongo && (
                                <div className="ficha-coldre-item">
                                    <span className="ficha-coldre-label">Adicionar Coldre de Arma Longa</span>
                                    <button className="ficha-coldre-btn" onClick={() => setColdreLongo(true)}>+</button>
                                </div>
                            )}
                            {!coldreCurto && (
                                <div className="ficha-coldre-item">
                                    <span className="ficha-coldre-label">Adicionar Coldre de Arma Curta</span>
                                    <button className="ficha-coldre-btn" onClick={() => setColdreCurto(true)}>+</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="ficha-col-direita">
                    <div className="ficha-identidade-abas">
                        {["combate", "habilidades", "mochila"].map(aba => (
                            <button
                                key={aba}
                                className={`ficha-aba-btn ${abaAtiva === aba ? "ficha-aba-ativa" : ""}`}
                                onClick={() => setAbaAtiva(aba)}
                            >
                                {aba.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <div className="ficha-aba-conteudo">
                        {abaAtiva === "combate" && <AbaCombate onRolar={setResultado} bonus={bonus} dados={dados} />}
                        {abaAtiva === "habilidades" && (
                            <AbaHabilidades
                                pilulas={pilulas}
                                onGastarPilulas={handleGastarPilulas}
                                onDevolverPilulas={handleDevolverPilulas}
                                compradosGlobal={compradosGlobal}
                                onCompradosChange={setCompradosGlobal}
                            />
                        )}
                        {abaAtiva === "mochila" && <AbaMochila itens={itensMochila} setItens={setItensMochila} />}
                    </div>
                </div>
            </div>

            <ResultadoRolagem resultado={resultado} onFechar={() => setResultado(null)} />
        </div>
    );
};

export default FichaPersonagem;