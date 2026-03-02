import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/FichaPersonagem.css";

/* ─────────────────────────────────────────
   CONFIG
───────────────────────────────────────── */
const periciasConfig = [
    { key: "brutalidade", label: "Brutalidade" },
    { key: "mira",        label: "Mira"        },
    { key: "agilidade",   label: "Agilidade"   },
    { key: "instinto",    label: "Instinto"     },
    { key: "coleta",      label: "Sucatear"     },
    { key: "sobrevivencia", label: "Sobrevivência" },
    { key: "manutencao",  label: "Mecânica"     },
    { key: "medicina",    label: "Medicina"     },
];

const dadosOpcoes        = ["D4","D6","D8","D10","D12"];
const dadosRolagemOpcoes = ["D4","D6","D8","D10","D12","D20"];

const rolarDado = (dadoStr) => {
    const faces = parseInt(dadoStr.replace("D",""), 10);
    return Math.floor(Math.random() * faces) + 1;
};

/* ─────────────────────────────────────────
   DADOS DA LOJA DE HABILIDADES
───────────────────────────────────────── */
const LOJA = {
    habilidades: {
        label: "Habilidades",
        cor: "#C79255",
        itens: [
            { id:"agr", nome:"Agressividade",  desc:"Aumenta o Modificador da Habilidade Brutalidade.",     tiers:[{custo:40,efeito:"Brutalidade +1"},{custo:50,efeito:"Brutalidade +1"},{custo:60,efeito:"Brutalidade +1"}] },
            { id:"con", nome:"Constância",      desc:"Aumenta o Modificador da Habilidade de Mira.",         tiers:[{custo:40,efeito:"Mira +1"},{custo:50,efeito:"Mira +1"},{custo:60,efeito:"Mira +1"}] },
            { id:"csc", nome:"Consciência",     desc:"Aumenta o Modificador da Habilidade Instinto.",        tiers:[{custo:30,efeito:"Instinto +1"},{custo:40,efeito:"Instinto +1"},{custo:50,efeito:"Instinto +1"}] },
            { id:"agi", nome:"Ágil",            desc:"Aumenta o Modificador da Habilidade Agilidade.",       tiers:[{custo:50,efeito:"Agilidade +1"},{custo:60,efeito:"Agilidade +1"},{custo:70,efeito:"Agilidade +1"}] },
            { id:"cat", nome:"Catador",         desc:"Aumenta o Modificador da Habilidade Vasculhar.",       tiers:[{custo:30,efeito:"Vasculhar +1"},{custo:40,efeito:"Vasculhar +1"},{custo:50,efeito:"Vasculhar +1"}] },
            { id:"sob", nome:"Sobrevivente",    desc:"Aumenta o Modificador da Habilidade Sobrevivência.",   tiers:[{custo:20,efeito:"Sobrevivência +1"},{custo:30,efeito:"Sobrevivência +1"},{custo:40,efeito:"Sobrevivência +1"}] },
            { id:"cur", nome:"Curandeiro",      desc:"Aumenta o Modificador da Habilidade Medicina.",        tiers:[{custo:20,efeito:"Medicina +1"},{custo:30,efeito:"Medicina +1"},{custo:40,efeito:"Medicina +1"}] },
            { id:"eng", nome:"Engenheiro",      desc:"Aumenta o Modificador da Habilidade Manutenção.",      tiers:[{custo:30,efeito:"Manutenção +1"},{custo:40,efeito:"Manutenção +1"},{custo:50,efeito:"Manutenção +1"}] },
        ],
    },
    sobrevivencia: {
        label: "Sobrevivência",
        cor: "#4ade80",
        itens: [
            { id:"crv", nome:"Corvo",                desc:"Encontre itens adicionais ao vasculhar.",                                            tiers:[{custo:30,efeito:"Dobra Pílulas/Peças ao vasculhar"},{custo:50,efeito:"Item adicional ao vasculhar"},{custo:70,efeito:"Itens extras acumulam"}] },
            { id:"vno", nome:"Visão Noturna",         desc:"Vantagem em Testes de Instinto em ambientes escuros.",                               tiers:[{custo:70,efeito:"Vantagem em Instinto no escuro"}] },
            { id:"med", nome:"Médico",                desc:"Aumenta a quantidade de cura dos Kits de Primeiros Socorros.",                       tiers:[{custo:25,efeito:"20HP + Teste de Medicina"},{custo:50,efeito:"35HP + Teste de Medicina"},{custo:75,efeito:"50HP + Teste de Medicina"}] },
            { id:"fci", nome:"Facas Improvisadas",    desc:"Aumenta a durabilidade das Facas/Estiletes.",                                        tiers:[{custo:40,efeito:"Facas têm dois usos antes de quebrar"}] },
            { id:"res", nome:"Resistir e Sobreviver", desc:"Sem Kit, pode rolar uma vez por dia para recuperar Vida.",                           tiers:[{custo:20,efeito:"D6 Vida"},{custo:40,efeito:"D12 Vida"},{custo:60,efeito:"D20 Vida"}] },
            { id:"vid", nome:"Vida",                  desc:"Aumenta a Vida Máxima.",                                                             tiers:[{custo:60,efeito:"50 Vida Máxima"},{custo:80,efeito:"75 Vida Máxima"},{custo:100,efeito:"100 Vida Máxima"}] },
            { id:"ban", nome:"Bancada de Trabalho",   desc:"Aumenta o Nível da Ferramenta.",                                                     tiers:[{custo:50,efeito:"Ferramenta Nível 2"},{custo:80,efeito:"Ferramenta Nível 3"},{custo:110,efeito:"Ferramenta Nível 4"}] },
            { id:"rel", nome:"Resiliência",           desc:"Re-rolagens de dados uma vez por dia.",                                              tiers:[{custo:30,efeito:"Uma Re-Rolagem"},{custo:60,efeito:"Duas Re-Rolagens"},{custo:90,efeito:"Três Re-Rolagens"}] },
        ],
    },
    combate: {
        label: "Combate",
        cor: "#f87171",
        itens: [
            { id:"pen", nome:"Punhos Ensanguentados", desc:"Aumenta o dano corpo a corpo.",                                                       tiers:[{custo:30,efeito:"1D8 Dano"},{custo:50,efeito:"2D10 Dano"},{custo:70,efeito:"1D12 Dano"}] },
            { id:"dur", nome:"Durável",               desc:"Aumenta a durabilidade das armas corpo a corpo.",                                     tiers:[{custo:25,efeito:"Durabilidade extra"},{custo:40,efeito:"Segunda durabilidade extra"},{custo:55,efeito:"Terceira durabilidade extra"}] },
            { id:"lut", nome:"Lutador",               desc:"Golpes extras corpo a corpo por turno.",                                              tiers:[{custo:25,efeito:"Segundo golpe"},{custo:50,efeito:"Terceiro golpe"},{custo:75,efeito:"Terceiro golpe dano dobrado"}] },
            { id:"imp", nome:"Impulso",               desc:"Golpe fatal gera ataque extra.",                                                      tiers:[{custo:90,efeito:"Ataque extra após golpe fatal"}] },
            { id:"sfr", nome:"Sangue Frio",           desc:"Modificadores adicionais em testes de Furtividade.",                                  tiers:[{custo:30,efeito:"+1 em Furtividade"},{custo:60,efeito:"+2 em Furtividade"},{custo:90,efeito:"+3 em Furtividade"}] },
            { id:"adr", nome:"Corrida de Adrenalina", desc:"Vida ≤10: dados extras nos testes de Habilidade.",                                    tiers:[{custo:20,efeito:"D4 nos testes"},{custo:40,efeito:"D6 nos testes"},{custo:60,efeito:"D8 nos testes"}] },
            { id:"fur", nome:"Fúria",                 desc:"Vantagem em um teste de Brutalidade por combate.",                                    tiers:[{custo:70,efeito:"Vantagem em Brutalidade 1×/combate"}] },
            { id:"pre", nome:"Precisão",              desc:"Vantagem em um teste de Mira por combate.",                                           tiers:[{custo:70,efeito:"Vantagem em Mira 1×/combate"}] },
            { id:"fco", nome:"Fogo de Cobertura",     desc:"Disparo gratuito ao escolher Cobertura (desvantagem em Mira).",                       tiers:[{custo:60,efeito:"Disparo gratuito ao cobrir"}] },
            { id:"fsu", nome:"Fogo Supressor",        desc:"Mantém inimigo sob pressão; consome munição dobrada.",                                tiers:[{custo:50,efeito:"Desvantagem + disparo de reação"}] },
            { id:"gex", nome:"Golpe Extra",           desc:"Adiciona modificador de Mira/Brutalidade ao Dano.",                                   tiers:[{custo:50,efeito:"Modificador = Dano adicional"},{custo:80,efeito:"Dano do Modificador dobrado"}] },
            { id:"ulc", nome:"Última Chance",         desc:"Ao cair para 0HP pela 1ª vez, cai para 1HP.",                                         tiers:[{custo:90,efeito:"Sobrevive com 1HP uma vez"}] },
        ],
    },
};

/* ─────────────────────────────────────────
   COMPONENTES BASE
───────────────────────────────────────── */
const CampoEditavel = ({ valor, onSalvar, placeholder, className }) => {
    const [editando, setEditando] = useState(false);
    const [inputVal, setInputVal] = useState(valor);
    const inputRef = useRef(null);
    useEffect(() => { setInputVal(valor); }, [valor]);
    useEffect(() => { if (editando && inputRef.current) inputRef.current.select(); }, [editando]);
    const confirmar = () => { onSalvar(inputVal.trim() || valor); setEditando(false); };
    if (editando) return (
        <input ref={inputRef} className={`ficha-identidade-input ${className||""}`} value={inputVal} placeholder={placeholder}
            onChange={e => setInputVal(e.target.value)} onBlur={confirmar}
            onKeyDown={e => { if(e.key==="Enter") confirmar(); if(e.key==="Escape"){setInputVal(valor);setEditando(false);} }} />
    );
    return (
        <span className={`ficha-identidade-valor ficha-identidade-editavel ${className||""}`} onClick={()=>setEditando(true)} title="Clique para editar">
            {valor || <span className="ficha-identidade-vazio">{placeholder}</span>}
            <i className="fas fa-pen ficha-identidade-edit-icon"/>
        </span>
    );
};

const DadoSelector = ({ valor, onChange }) => {
    const [aberto, setAberto] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = e => { if(ref.current && !ref.current.contains(e.target)) setAberto(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    return (
        <div className="dado-selector" ref={ref}>
            <div className="ficha-circulo ficha-circulo-dado" onClick={()=>setAberto(v=>!v)}>{valor}</div>
            {aberto && (
                <div className="dado-dropdown">
                    {dadosOpcoes.map(d => (
                        <div key={d} className={`dado-opcao ${d===valor?"dado-opcao-ativo":""}`} onClick={()=>{onChange(d);setAberto(false);}}>{d}</div>
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
        if(resultado && resultado !== prev.current) {
            prev.current = resultado; setAnimando(true);
            const t = setTimeout(()=>setAnimando(false),500); return ()=>clearTimeout(t);
        }
    }, [resultado]);
    if(!resultado) return null;
    const { label, dado, valorDado, bonus, total } = resultado;
    const bonusNum = parseInt(bonus,10)||0;
    const faces = parseInt(dado.replace("D",""),10);
    const cls = valorDado===faces ? "critico-max" : valorDado===1 ? "critico-min" : "";
    return (
        <div className="rolagem-overlay" onClick={onFechar}>
            <div className={`rolagem-painel ${animando?"rolagem-animando":""}`} onClick={e=>e.stopPropagation()}>
                <button className="rolagem-fechar" onClick={onFechar}>×</button>
                <div className={`rolagem-icone ${cls}`}><i className="fas fa-dice-d20 rolagem-dado-svg"/></div>
                <div className="rolagem-nome">{label}</div>
                <div className="rolagem-formula">
                    <div className={`rolagem-dado-bloco ${cls}`}>
                        <span className="rolagem-dado-num">{valorDado}</span>
                        <span className="rolagem-dado-tag">{dado}</span>
                    </div>
                    {bonusNum!==0 && (<>
                        <span className="rolagem-op">{bonusNum>=0?"+":"−"}</span>
                        <div className="rolagem-bonus-bloco">
                            <span className="rolagem-bonus-num">{Math.abs(bonusNum)}</span>
                            <span className="rolagem-bonus-tag">BÔNUS</span>
                        </div>
                    </>)}
                    <span className="rolagem-op">=</span>
                    <div className="rolagem-total-bloco"><span className="rolagem-total">{total}</span></div>
                </div>
            </div>
        </div>
    );
};

const VidaControl = ({ valor, max, onChange, onChangeMax }) => {
    const [eA, setEA] = useState(false); const [eM, setEM] = useState(false);
    const [iA, setIA] = useState(String(valor)); const [iM, setIM] = useState(String(max));
    const rA = useRef(null); const rM = useRef(null);
    useEffect(()=>{if(eA&&rA.current)rA.current.select();},[eA]);
    useEffect(()=>{if(eM&&rM.current)rM.current.select();},[eM]);
    const cA=()=>{const n=parseInt(iA,10);if(!isNaN(n))onChange(n);setEA(false);};
    const cM=()=>{const n=parseInt(iM,10);if(!isNaN(n))onChangeMax(n);setEM(false);};
    const pct = max>0?Math.min(100,Math.round((valor/max)*100)):0;
    const slot={display:"inline-block",width:"42px",textAlign:"center",cursor:"text"};
    const inp={width:"42px",background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:"1rem",fontWeight:"700",textAlign:"center",fontFamily:'"Be Vietnam Pro",sans-serif',letterSpacing:"2px"};
    return (
        <div className="vida-control">
            <div className="vida-titulo">VIDA</div>
            <div className="vida-barra-wrapper">
                <div className="vida-barra-fill" style={{width:`${pct}%`}}/>
                <button className="vida-btn" onClick={()=>onChange(valor-5)}>«</button>
                <button className="vida-btn" onClick={()=>onChange(valor-1)}>‹</button>
                <div className="vida-barra-bg">
                    <div className="vida-barra-texto">
                        <span style={slot}>{eA
                            ? <input ref={rA} className="vida-input-edit" style={inp} type="number" value={iA} onChange={e=>setIA(e.target.value)} onBlur={cA} onKeyDown={e=>{if(e.key==="Enter")cA();if(e.key==="Escape")setEA(false);}}/>
                            : <span onClick={()=>{setIA(String(valor));setEA(true);}}>{valor}</span>}
                        </span>
                        <span style={{opacity:0.5}}>/</span>
                        <span style={slot}>{eM
                            ? <input ref={rM} className="vida-input-edit" style={inp} type="number" value={iM} onChange={e=>setIM(e.target.value)} onBlur={cM} onKeyDown={e=>{if(e.key==="Enter")cM();if(e.key==="Escape")setEM(false);}}/>
                            : <span onClick={()=>{setIM(String(max));setEM(true);}}>{max}</span>}
                        </span>
                    </div>
                </div>
                <button className="vida-btn" onClick={()=>onChange(valor+1)}>›</button>
                <button className="vida-btn" onClick={()=>onChange(valor+5)}>»</button>
            </div>
        </div>
    );
};

const ArmaSlot = ({ titulo }) => (
    <div className="ficha-arma-slot">
        <div className="ficha-arma-titulo">{titulo}</div>
        <div className="ficha-arma-row ficha-arma-row-top">
            <div className="ficha-arma-field ficha-arma-nome"><span className="ficha-field-label">NOME</span><input className="ficha-input"/></div>
            <div className="ficha-arma-field ficha-arma-small"><span className="ficha-field-label">DANO</span><input className="ficha-input"/></div>
            <div className="ficha-arma-field ficha-arma-small"><span className="ficha-field-label">PENTE</span><input className="ficha-input"/></div>
            <div className="ficha-arma-field ficha-arma-small"><span className="ficha-field-label">CAPACIDADE</span><input className="ficha-input"/></div>
        </div>
        <div className="ficha-arma-row">
            <div className="ficha-arma-field ficha-arma-medium"><span className="ficha-field-label">CADÊNCIA DE TIRO</span><input className="ficha-input"/></div>
            <div className="ficha-arma-field ficha-arma-medium"><span className="ficha-field-label">PERFURAÇÃO DA ARMA</span><input className="ficha-input"/></div>
        </div>
    </div>
);

/* ─────────────────────────────────────────
   MODAL LOJA DE HABILIDADES
───────────────────────────────────────── */
const ModalLoja = ({ pilulas, onGastarPilulas, comprados, onComprar, onFechar }) => {
    const [catAtiva, setCatAtiva]   = useState("habilidades");
    const [busca, setBusca]         = useState("");
    const [expandidos, setExpandidos] = useState({});
    const [toast, setToast]         = useState(null);

    // Bloqueia scroll da página quando a modal está aberta
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    const mostrarToast = (msg, tipo="erro") => {
        setToast({msg,tipo}); setTimeout(()=>setToast(null), 2500);
    };

    const tierAtual = id => comprados[id] ?? 0;

    const comprarTier = (item, idx) => {
        const atual = tierAtual(item.id);
        if(idx !== atual) { mostrarToast(idx>atual ? `Compre o Tier ${atual+1} primeiro!` : "Já comprado."); return; }
        const custo = item.tiers[idx].custo;
        const saldo = parseInt(pilulas,10)||0;
        if(saldo < custo) { mostrarToast(`Pílulas insuficientes! (${saldo}/${custo})`); return; }
        onGastarPilulas(custo);
        onComprar(item.id, idx+1);
        mostrarToast(`${item.nome} Tier ${idx+1} desbloqueado!`, "ok");
    };

    const catData   = LOJA[catAtiva];
    const catKeys   = Object.keys(LOJA);
    const filtrados = catData.itens.filter(i => i.nome.toLowerCase().includes(busca.toLowerCase()));

    return (
        <div className="loja-overlay" onClick={onFechar}>
            <div className="loja-modal" onClick={e=>e.stopPropagation()}>
                {/* Header */}
                <div className="loja-header">
                    <h2 className="loja-titulo">Melhorias de Sobrevivência</h2>
                    <button className="loja-fechar" onClick={onFechar}><i className="fas fa-times"/></button>
                </div>

                {/* Pílulas */}
                <div className="loja-pilulas-bar">
                    <i className="fas fa-capsules"/>
                    <span>Pílulas disponíveis:</span>
                    <strong>{parseInt(pilulas,10)||0}</strong>
                </div>

                {/* Tabs de categoria */}
                <div className="loja-cats">
                    {catKeys.map(k => (
                        <button key={k}
                            className={`loja-cat-btn ${catAtiva===k?"loja-cat-ativa":""}`}
                            style={catAtiva===k?{color:LOJA[k].cor, borderBottomColor:LOJA[k].cor}:{}}
                            onClick={()=>{setCatAtiva(k);setBusca("");}}>
                            {LOJA[k].label}
                        </button>
                    ))}
                </div>

                {/* Busca */}
                <div className="loja-busca-row">
                    <i className="fas fa-search loja-busca-icon"/>
                    <input className="loja-busca-input" placeholder="Buscar habilidade..." value={busca} onChange={e=>setBusca(e.target.value)}/>
                </div>

                {/* Toast */}
                {toast && <div className={`loja-toast loja-toast-${toast.tipo}`}>{toast.msg}</div>}

                {/* Lista */}
                <div className="loja-lista">
                    {filtrados.map(item => {
                        const comprado = tierAtual(item.id);
                        const total    = item.tiers.length;
                        const isMax    = comprado >= total;
                        const exp      = expandidos[item.id];

                        return (
                            <div key={item.id} className={`loja-item ${isMax?"loja-item-max":""}`}>
                                <div className="loja-item-header" onClick={()=>setExpandidos(p=>({...p,[item.id]:!p[item.id]}))}>
                                    <button className="loja-item-chevron">
                                        <i className={`fas fa-chevron-${exp?"up":"down"}`}/>
                                    </button>
                                    <div className="loja-item-info">
                                        <div className="loja-item-nome-row">
                                            <span className="loja-item-nome" style={{color:catData.cor}}>{item.nome}</span>
                                            {isMax && <span className="loja-badge-max">MAX</span>}
                                        </div>
                                        {/* Barra de progresso de tiers */}
                                        <div className="loja-progress-row">
                                            {item.tiers.map((_,i)=>(
                                                <div key={i} className="loja-progress-pip"
                                                    style={{background: i<comprado ? catData.cor : "#2a2218", borderColor: i<comprado ? catData.cor : "#3a3020"}}/>
                                            ))}
                                            <span className="loja-progress-label">{comprado}/{total}</span>
                                        </div>
                                    </div>
                                    {/* Botão + para o próximo tier disponível */}
                                    {!isMax && (
                                        <button className="loja-item-add"
                                            style={{borderColor:catData.cor, color:catData.cor}}
                                            onClick={e=>{e.stopPropagation(); comprarTier(item, comprado);}}>
                                            <i className="fas fa-plus"/>
                                        </button>
                                    )}
                                </div>

                                {exp && (
                                    <div className="loja-item-corpo">
                                        <p className="loja-item-desc">{item.desc}</p>
                                        <div className="loja-tiers-lista">
                                            {item.tiers.map((tier, idx) => {
                                                const done     = idx <  comprado;
                                                const next     = idx === comprado;
                                                const locked   = idx >  comprado;
                                                return (
                                                    <div key={idx} className={`loja-tier-row ${done?"lt-done":""} ${locked?"lt-locked":""}`}>
                                                        <div className="lt-left">
                                                            <span className="lt-label">Tier {idx+1}</span>
                                                            <span className="lt-efeito">{tier.efeito}</span>
                                                        </div>
                                                        <div className="lt-right">
                                                            <span className="lt-custo"><i className="fas fa-capsules"/> {tier.custo}</span>
                                                            {done   && <span className="lt-status lt-ok"><i className="fas fa-check"/></span>}
                                                            {locked && <span className="lt-status lt-lock"><i className="fas fa-lock"/></span>}
                                                            {next   && (
                                                                <button className="lt-buy" style={{background:catData.cor}}
                                                                    onClick={()=>comprarTier(item,idx)}>
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
                    {filtrados.length===0 && <p className="loja-vazio">Nenhuma habilidade encontrada.</p>}
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────
   ABA COMBATE
───────────────────────────────────────── */
const AbaCombate = ({ onRolar }) => {
    const [filtro, setFiltro]       = useState("");
    const [dadoLivre, setDadoLivre] = useState("D20");
    const [ataques, setAtaques]     = useState([]);
    const [exp, setExp]             = useState({});
    const [modal, setModal]         = useState(false);
    const [novo, setNovo]           = useState({nome:"",dano:"",critico:"",tipo:""});

    const filtrados = ataques.filter(a=>a.nome.toLowerCase().includes(filtro.toLowerCase()));

    const rolarLivre = () => {
        const faces = parseInt(dadoLivre.replace("D",""),10);
        const v = Math.floor(Math.random()*faces)+1;
        onRolar({label:`Rolagem ${dadoLivre}`,dado:dadoLivre,valorDado:v,bonus:0,total:v});
    };

    const rolarAtaque = ataque => {
        const m = (ataque.dano||"D6").match(/(\d+)[dD](\d+)/);
        let v=0, d=ataque.dano||"D6";
        if(m){const q=parseInt(m[1]),f=parseInt(m[2]);d=`${q}D${f}`;for(let i=0;i<q;i++)v+=Math.floor(Math.random()*f)+1;}
        else v=1;
        onRolar({label:ataque.nome,dado:d,valorDado:v,bonus:0,total:v});
    };

    const adicionar = () => {
        if(!novo.nome.trim()) return;
        setAtaques(p=>[...p,{id:Date.now(),...novo}]);
        setNovo({nome:"",dano:"",critico:"",tipo:""});
        setModal(false);
    };

    return (
        <div className="aba-content">
            {/* Filtro */}
            <div className="aba-filtro-row">
                <input className="aba-filtro-input" placeholder="Filtrar ataques" value={filtro} onChange={e=>setFiltro(e.target.value)}/>
            </div>
            {/* Rolar dado livre */}
            <div className="aba-rolar-row">
                <select className="aba-dado-select" value={dadoLivre} onChange={e=>setDadoLivre(e.target.value)}>
                    {dadosRolagemOpcoes.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
                <input className="aba-filtro-input" placeholder="Rolar dados" readOnly onClick={rolarLivre} style={{cursor:"pointer",flex:1}}/>
                <button className="aba-icon-btn" onClick={rolarLivre}><i className="fas fa-dice-d20"/></button>
            </div>
            {/* Novo ataque */}
            <div className="aba-actions-row">
                <button className="aba-btn-novo" onClick={()=>setModal(true)}>Novo Ataque</button>
            </div>
            {/* Lista */}
            <div className="aba-lista">
                {filtrados.length===0 && <p className="ficha-aba-vazio">Nenhum ataque cadastrado.</p>}
                {filtrados.map(a=>(
                    <div key={a.id} className="aba-item">
                        <div className="aba-item-header" onClick={()=>setExp(p=>({...p,[a.id]:!p[a.id]}))}>
                            <button className="aba-chevron"><i className={`fas fa-chevron-${exp[a.id]?"up":"down"}`}/></button>
                            <div className="aba-item-info">
                                <span className="aba-item-nome">{a.nome}</span>
                                <div className="aba-item-meta">
                                    {a.dano    && <span className="aba-tag">Dano: <strong>{a.dano}</strong></span>}
                                    {a.critico && <span className="aba-tag">Crítico: <strong>{a.critico}</strong></span>}
                                </div>
                            </div>
                            <button className="aba-icon-btn" onClick={e=>{e.stopPropagation();rolarAtaque(a);}}>
                                <i className="fas fa-dice-d20"/>
                            </button>
                        </div>
                        {exp[a.id] && (
                            <div className="aba-item-corpo">
                                {a.tipo && <p className="aba-item-desc"><strong>Tipo:</strong> {a.tipo}</p>}
                                <button className="aba-btn-remover" onClick={()=>setAtaques(p=>p.filter(x=>x.id!==a.id))}>
                                    <i className="fas fa-trash"/> Remover
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {/* Modal novo ataque */}
            {modal && (
                <div className="aba-modal-overlay" onClick={()=>setModal(false)}>
                    <div className="aba-modal" onClick={e=>e.stopPropagation()}>
                        <div className="aba-modal-titulo">Novo Ataque</div>
                        {[{k:"nome",l:"Nome",p:"Ex: Faca"},{k:"dano",l:"Dano",p:"Ex: 1d4"},{k:"critico",l:"Crítico",p:"Ex: 19"},{k:"tipo",l:"Tipo",p:"Ex: Cortante"}].map(({k,l,p})=>(
                            <div key={k} className="aba-modal-campo">
                                <label>{l}</label>
                                <input className="ficha-input" value={novo[k]} onChange={e=>setNovo(v=>({...v,[k]:e.target.value}))} placeholder={p}/>
                            </div>
                        ))}
                        <div className="aba-modal-btns">
                            <button className="aba-btn-cancelar" onClick={()=>setModal(false)}>Cancelar</button>
                            <button className="aba-btn-novo" onClick={adicionar}>Adicionar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────
   ABA HABILIDADES
───────────────────────────────────────── */
const AbaHabilidades = ({ pilulas, onGastarPilulas }) => {
    const [lojaAberta, setLojaAberta]   = useState(false);
    const [comprados, setComprados]     = useState({});   // { id: tierComprado (1-based) }
    const [expandidos, setExpandidos]   = useState({});

    const onComprar = (id, tier) => setComprados(p=>({...p,[id]:tier}));

    // Monta lista de habilidades adquiridas
    const adquiridas = [];
    Object.entries(LOJA).forEach(([catKey, cat]) => {
        cat.itens.forEach(item => {
            const t = comprados[item.id];
            if(t && t>0) adquiridas.push({item, cat, tierComprado:t});
        });
    });

    return (
        <div className="aba-content">
            <div className="aba-filtro-row aba-filtro-com-btn">
                <span className="aba-section-title">Habilidades Adquiridas</span>
                <button className="aba-btn-adicionar" onClick={()=>setLojaAberta(true)}>
                    <i className="fas fa-plus"/> Adicionar
                </button>
            </div>

            <div className="aba-lista">
                {adquiridas.length===0 && <p className="ficha-aba-vazio">Nenhuma habilidade adquirida.<br/>Clique em Adicionar para comprar.</p>}
                {adquiridas.map(({item, cat, tierComprado}) => (
                    <div key={item.id} className="aba-item">
                        <div className="aba-item-header" onClick={()=>setExpandidos(p=>({...p,[item.id]:!p[item.id]}))}>
                            <button className="aba-chevron"><i className={`fas fa-chevron-${expandidos[item.id]?"up":"down"}`}/></button>
                            <div className="aba-item-info">
                                <div style={{display:"flex",alignItems:"center",gap:6}}>
                                    <span className="aba-item-nome" style={{color:cat.cor}}>{item.nome}</span>
                                    {tierComprado >= item.tiers.length && <span className="loja-badge-max">MAX</span>}
                                </div>
                                <div className="loja-progress-row" style={{marginTop:3}}>
                                    {item.tiers.map((_,i)=>(
                                        <div key={i} className="loja-progress-pip"
                                            style={{background:i<tierComprado?cat.cor:"#2a2218",borderColor:i<tierComprado?cat.cor:"#3a3020"}}/>
                                    ))}
                                    <span className="loja-progress-label">{tierComprado}/{item.tiers.length}</span>
                                </div>
                            </div>
                            {/* Botão para comprar próximo tier se disponível */}
                            {tierComprado < item.tiers.length && (
                                <button className="aba-icon-btn" style={{color:cat.cor}}
                                    onClick={e=>{e.stopPropagation();setLojaAberta(true);}}>
                                    <i className="fas fa-level-up-alt"/>
                                </button>
                            )}
                        </div>
                        {expandidos[item.id] && (
                            <div className="aba-item-corpo">
                                <p className="aba-item-desc">{item.desc}</p>
                                <p className="aba-item-desc" style={{color:cat.cor,fontWeight:700}}>
                                    Tier {tierComprado}: {item.tiers[tierComprado-1]?.efeito}
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
                    onFechar={()=>setLojaAberta(false)}
                />
            )}
        </div>
    );
};

/* ─────────────────────────────────────────
   ABA MOCHILA
───────────────────────────────────────── */
const AbaMochila = () => {
    const [filtro, setFiltro]   = useState("");
    const [itens, setItens]     = useState([]);
    const [exp, setExp]         = useState({});
    const [modal, setModal]     = useState(false);
    const [novo, setNovo]       = useState({nome:"",categoria:"Geral",espacos:"",descricao:"",equipado:false});
    const categorias = ["Arma","Munição","Proteção","Geral","Item Amald."];

    const filtrados = itens.filter(i=>i.nome.toLowerCase().includes(filtro.toLowerCase()));
    const toggleEquip = id => setItens(p=>p.map(i=>i.id===id?{...i,equipado:!i.equipado}:i));
    const abrirModal = cat => { setNovo({nome:"",categoria:cat,espacos:"",descricao:"",equipado:false}); setModal(true); };
    const adicionar  = () => { if(!novo.nome.trim()) return; setItens(p=>[...p,{id:Date.now(),...novo}]); setModal(false); };

    return (
        <div className="aba-content">
            <div className="aba-filtro-row aba-filtro-com-btn">
                <input className="aba-filtro-input" placeholder="Filtrar itens" value={filtro} onChange={e=>setFiltro(e.target.value)}/>
                <button className="aba-btn-adicionar" onClick={()=>abrirModal("Geral")}><i className="fas fa-plus"/> Adicionar</button>
            </div>

            {/* Botões de categoria */}
            <div className="mochila-cats-row">
                <span className="mochila-novo-label">NOVO</span>
                {categorias.map(c=>(
                    <button key={c} className="mochila-cat-btn" onClick={()=>abrirModal(c)}>{c}</button>
                ))}
            </div>

            <div className="aba-lista">
                {filtrados.length===0 && <p className="ficha-aba-vazio">Mochila vazia.</p>}
                {filtrados.map(item=>(
                    <div key={item.id} className="aba-item">
                        <div className="aba-item-header" onClick={()=>setExp(p=>({...p,[item.id]:!p[item.id]}))}>
                            <button className="aba-chevron"><i className={`fas fa-chevron-${exp[item.id]?"up":"down"}`}/></button>
                            <div className="aba-item-info">
                                <span className="aba-item-nome">{item.nome}</span>
                                <div className="aba-item-meta">
                                    <span className="aba-tag">Categoria: <strong>{item.categoria}</strong></span>
                                    {item.espacos!=="" && <span className="aba-tag">Espaços: <strong>{item.espacos}</strong></span>}
                                </div>
                            </div>
                            <button className={`mochila-equip-btn ${item.equipado?"mochila-equip-on":""}`}
                                onClick={e=>{e.stopPropagation();toggleEquip(item.id);}}>
                                <i className={`fas ${item.equipado?"fa-check-square":"fa-square"}`}/>
                            </button>
                        </div>
                        {exp[item.id] && (
                            <div className="aba-item-corpo">
                                {item.descricao && <p className="aba-item-desc">{item.descricao}</p>}
                                <button className="aba-btn-remover" onClick={()=>setItens(p=>p.filter(x=>x.id!==item.id))}>
                                    <i className="fas fa-trash"/> Remover
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {modal && (
                <div className="aba-modal-overlay" onClick={()=>setModal(false)}>
                    <div className="aba-modal" onClick={e=>e.stopPropagation()}>
                        <div className="aba-modal-titulo">Novo Item</div>
                        <div className="aba-modal-campo"><label>Nome</label><input className="ficha-input" value={novo.nome} onChange={e=>setNovo(p=>({...p,nome:e.target.value}))} placeholder="Nome do item"/></div>
                        <div className="aba-modal-campo"><label>Categoria</label>
                            <select className="ficha-input" value={novo.categoria} onChange={e=>setNovo(p=>({...p,categoria:e.target.value}))}>
                                {categorias.map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="aba-modal-campo"><label>Espaços</label><input className="ficha-input" type="number" value={novo.espacos} onChange={e=>setNovo(p=>({...p,espacos:e.target.value}))} placeholder="Ex: 1"/></div>
                        <div className="aba-modal-campo"><label>Descrição</label><textarea className="ficha-input aba-textarea" value={novo.descricao} onChange={e=>setNovo(p=>({...p,descricao:e.target.value}))} rows={3} placeholder="Descrição..."/></div>
                        <div className="aba-modal-btns">
                            <button className="aba-btn-cancelar" onClick={()=>setModal(false)}>Cancelar</button>
                            <button className="aba-btn-novo" onClick={adicionar}>Adicionar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────
   FICHA PERSONAGEM PRINCIPAL
───────────────────────────────────────── */
const FichaPersonagem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ficha, setFicha]         = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [abaAtiva, setAbaAtiva]   = useState("combate");

    const [nomePersonagem, setNomePersonagem]     = useState("");
    const [nomeJogador, setNomeJogador]           = useState("");
    const [tipoSobrevivente, setTipoSobrevivente] = useState("");
    const [classeSobrevivente, setClasseSobrevivente] = useState("");
    const [vidaAtual, setVidaAtual] = useState(0);
    const [vidaMax, setVidaMax]     = useState(0);
    const [sucata, setSucata]       = useState("");
    const [pilulas, setPilulas]     = useState("");
    const [nivFerramenta, setNivFerramenta] = useState("");
    const [medicinaVal, setMedicinaVal]     = useState("");
    const [bonus, setBonus]         = useState({});
    const [dados, setDados]         = useState({});
    const [resultado, setResultado] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:3001/api/tlou/fichas/${id}`, { credentials:"include" })
            .then(r=>r.json())
            .then(data=>{
                setFicha(data);
                setNomePersonagem(data.nome_personagem??"");
                setNomeJogador(data.nome_jogador??"");
                setTipoSobrevivente(data.nivel??"");
                setClasseSobrevivente(data.classe??"");
                setVidaAtual(data.vida_atual??data.vida_maxima??0);
                setVidaMax(data.vida_maxima??0);
                setPilulas(data.pilulas??"");
                const b={}, d={};
                periciasConfig.forEach(p=>{ b[p.key]=data[p.key]??0; d[p.key]="D10"; });
                setBonus(b); setDados(d);
            })
            .catch(()=>setFicha(null))
            .finally(()=>setCarregando(false));
    }, [id]);

    const handleRolar = (key, label) => {
        const dado = dados[key]??"D10";
        const bv   = parseInt(bonus[key],10)||0;
        const v    = rolarDado(dado);
        setResultado({label, dado, valorDado:v, bonus:bv, total:v+bv});
    };

    const handleGastarPilulas = custo => {
        setPilulas(p=>String(Math.max(0,(parseInt(p,10)||0)-custo)));
    };

    if(carregando) return <div className="ficha-loading-page"><p className="ficha-loading-text">Carregando ficha...</p></div>;
    if(!ficha||ficha.error) return (
        <div className="ficha-loading-page">
            <p className="ficha-loading-text">Ficha não encontrada.</p>
            <button className="ficha-voltar-btn" onClick={()=>navigate("/personagens")}>← Voltar</button>
        </div>
    );

    return (
        <div className="ficha-page">
            <div className="ficha-topbar">
                <button className="ficha-voltar-btn" onClick={()=>navigate("/personagens")}>← Voltar</button>
            </div>

            <div className="ficha-sheet">
                {/* IDENTIDADE */}
                <div className="ficha-identidade">
                    <div className="ficha-identidade-col">
                        <span className="ficha-identidade-label">PERSONAGEM</span>
                        <CampoEditavel valor={nomePersonagem} onSalvar={setNomePersonagem} placeholder="Nome do personagem"/>
                    </div>
                    <div className="ficha-identidade-col">
                        <span className="ficha-identidade-label">JOGADOR</span>
                        <CampoEditavel valor={nomeJogador} onSalvar={setNomeJogador} placeholder="Nome do jogador"/>
                    </div>
                    <div className="ficha-identidade-col">
                        <span className="ficha-identidade-label">SOBREVIVENTE</span>
                        <span className="ficha-identidade-valor ficha-identidade-static">{tipoSobrevivente||<span className="ficha-identidade-vazio">—</span>}</span>
                    </div>
                    <div className="ficha-identidade-col">
                        <span className="ficha-identidade-label">CLASSE</span>
                        <span className="ficha-identidade-valor ficha-identidade-static">{classeSobrevivente||<span className="ficha-identidade-vazio">—</span>}</span>
                    </div>
                </div>

                <div className="ficha-body">
                    {/* COL ESQUERDA */}
                    <div className="ficha-col-esquerda">
                        <div className="ficha-pericias-bloco">
                            <div className="ficha-avatar-wrapper">
                                {ficha.imagem
                                    ? <img src={ficha.imagem} alt={nomePersonagem} className="ficha-avatar-img"/>
                                    : <div className="ficha-avatar-placeholder">{nomePersonagem?.[0]?.toUpperCase()||"?"}</div>}
                            </div>
                            <VidaControl valor={vidaAtual} max={vidaMax} onChange={setVidaAtual} onChangeMax={setVidaMax}/>
                            <table className="ficha-pericias-tabela">
                                <thead><tr><th>PERÍCIA</th><th>BÔNUS</th><th>DADO</th><th></th></tr></thead>
                                <tbody>
                                    {periciasConfig.map(p=>(
                                        <tr key={p.key}>
                                            <td className="ficha-pericia-nome">{p.label}</td>
                                            <td className="ficha-pericia-bonus">
                                                <div className="ficha-circulo">
                                                    <input className="ficha-circulo-input" type="number" min={0} max={9}
                                                        value={bonus[p.key]??0}
                                                        onChange={e=>setBonus(prev=>({...prev,[p.key]:e.target.value}))}/>
                                                </div>
                                            </td>
                                            <td className="ficha-pericia-dado">
                                                <DadoSelector valor={dados[p.key]??"D10"} onChange={v=>setDados(prev=>({...prev,[p.key]:v}))}/>
                                            </td>
                                            <td className="ficha-pericia-rolar">
                                                <button className="ficha-btn-rolar" onClick={()=>handleRolar(p.key,p.label)}>
                                                    <i className="fas fa-dice-d20 ficha-btn-rolar-icon"/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* COL MEIO */}
                    <div className="ficha-col-meio">
                        <div className="ficha-status-row">
                            <div className="ficha-status-campo"><span className="ficha-field-label">SUCATA</span><input className="ficha-input ficha-status-input" value={sucata} onChange={e=>setSucata(e.target.value)}/></div>
                            <div className="ficha-status-campo"><span className="ficha-field-label">PÍLULAS</span><input className="ficha-input ficha-status-input" value={pilulas} onChange={e=>setPilulas(e.target.value)}/></div>
                            <div className="ficha-status-campo"><span className="ficha-field-label">NÍV. FERRAMENTA</span><input className="ficha-input ficha-status-input" value={nivFerramenta} onChange={e=>setNivFerramenta(e.target.value)}/></div>
                            <div className="ficha-status-campo"><span className="ficha-field-label">REMÉDIO</span><input className="ficha-input ficha-status-input" value={medicinaVal} onChange={e=>setMedicinaVal(e.target.value)}/></div>
                        </div>
                        <ArmaSlot titulo="ARMA LONGA"/><ArmaSlot titulo="ARMA CURTA"/>
                        <ArmaSlot titulo="COLDRE ARMA LONGA"/><ArmaSlot titulo="COLDRE ARMA CURTA"/>
                        <ArmaSlot titulo="MELEE"/>
                        <div className="ficha-consumiveis">
                            <div className="ficha-consumivel-grupo">
                                <div className="ficha-consumivel-item"><span>💣</span><div className="ficha-consumivel-bar">/3</div></div>
                                <div className="ficha-consumivel-item"><span>💥</span><div className="ficha-consumivel-bar">/3</div></div>
                                <div className="ficha-consumivel-item"><span>🧱</span><div className="ficha-consumivel-bar">/3</div></div>
                            </div>
                            <div className="ficha-consumivel-label">ARMAS</div>
                            <div className="ficha-consumivel-grupo">
                                <div className="ficha-consumivel-item"><span>🔗</span><div className="ficha-consumivel-bar">/3</div></div>
                                <div className="ficha-consumivel-item"><span>🔪</span><div className="ficha-consumivel-bar">/3</div></div>
                                <div className="ficha-consumivel-item"><span>🗡</span><div className="ficha-consumivel-bar">/1</div></div>
                            </div>
                        </div>
                    </div>

                    {/* COL DIREITA */}
                    <div className="ficha-col-direita">
                        <div className="ficha-abas-nav">
                            {["combate","habilidades","mochila"].map(aba=>(
                                <button key={aba} className={`ficha-aba-btn ${abaAtiva===aba?"ficha-aba-ativa":""}`} onClick={()=>setAbaAtiva(aba)}>
                                    {aba.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <div className="ficha-aba-conteudo">
                            {abaAtiva==="combate"    && <AbaCombate onRolar={setResultado}/>}
                            {abaAtiva==="habilidades" && <AbaHabilidades pilulas={pilulas} onGastarPilulas={handleGastarPilulas}/>}
                            {abaAtiva==="mochila"    && <AbaMochila/>}
                        </div>
                    </div>
                </div>
            </div>

            <ResultadoRolagem resultado={resultado} onFechar={()=>setResultado(null)}/>
        </div>
    );
};

export default FichaPersonagem;