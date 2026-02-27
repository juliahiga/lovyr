import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Campanhas.css";
import tlouImg from "../assets/tlouTTRPG.png";
import { useUser } from "../context/UserContext";

const sistemas = [
  { id: "tlou", nome: "The Last of Us TTRPG", imagem: tlouImg },
];

const Campanhas = () => {
  const { user, triggerLogin } = useUser();
  const campanhas = [];
  const [modalOpen, setModalOpen] = useState(false);
  const [hoveredSistema, setHoveredSistema] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="campanhas-page">
      {campanhas.length === 0 ? (
        <div className="campanhas-empty">
          <p className="campanhas-empty-text">VOCÊ AINDA NÃO CRIOU OU PARTICIPA DE NENHUMA CAMPANHA!</p>
          <button
            className="campanhas-novo-btn"
            onClick={() => {
              if (!user) {
                triggerLogin();
              } else {
                setModalOpen(true);
              }
            }}
          >
            NOVA CAMPANHA
          </button>
        </div>
      ) : (
        <div className="campanhas-lista" />
      )}

      {modalOpen && (
        <div className="sistema-overlay" onClick={() => setModalOpen(false)}>
          <div className="sistema-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="sistema-titulo">
              Em qual sistema você gostaria de criar sua campanha?
            </h2>
            <div className="sistema-grid">
              {sistemas.map((s) => (
                <div
                  key={s.id}
                  className={`sistema-card ${hoveredSistema === s.id ? "hovered" : ""}`}
                  onMouseEnter={() => setHoveredSistema(s.id)}
                  onMouseLeave={() => setHoveredSistema(null)}
                  onClick={() => navigate("/nova-campanha-tlourpg")}
                >
                  <img src={s.imagem} alt={s.nome} />
                  <span>{s.nome}</span>
                </div>
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="sistema-card empty">
                  <span>Em breve</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campanhas;