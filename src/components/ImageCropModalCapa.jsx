import React, { useState, useRef, useEffect, useCallback } from "react";
import "../styles/ImageCropModal.css";

const ASPECT_W = 3;
const ASPECT_H = 2; // 600x400

const ImageCropModalCapa = ({ onConfirm, onClose, src: externalSrc = null, title = "Foto de Capa" }) => {
  const [imageSrc, setImageSrc] = useState(externalSrc);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imagePos, setImagePos] = useState({ x: 0, y: 0 });
  const [box, setBox] = useState({ x: 0, y: 0, width: 300, height: 200 });
  const containerRef = useRef();
  const dragRef = useRef(null);
  const boxRef = useRef(box);
  const imagePosRef = useRef({ x: 0, y: 0 });
  const imageSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => { boxRef.current = box; }, [box]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const clamp = useCallback((x, y, w) => {
    const { x: iX, y: iY } = imagePosRef.current;
    const { width: iW, height: iH } = imageSizeRef.current;
    const minW = 60;
    const maxW = Math.min(iW, iH * ASPECT_W / ASPECT_H);
    const cW = Math.max(minW, Math.min(w, maxW));
    const cH = cW * ASPECT_H / ASPECT_W;
    const cX = Math.max(iX, Math.min(x, iX + iW - cW));
    const cY = Math.max(iY, Math.min(y, iY + iH - cH));
    return { x: cX, y: cY, width: cW, height: cH };
  }, []);

  useEffect(() => {
    if (!imageSrc || !containerRef.current) return;
    const img = new Image();
    img.onload = () => {
      const containerW = containerRef.current.offsetWidth;
      const containerH = containerRef.current.offsetHeight;
      const ratio = Math.min(containerW / img.width, containerH / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const imgX = (containerW - w) / 2;
      const imgY = (containerH - h) / 2;
      imageSizeRef.current = { width: w, height: h };
      imagePosRef.current = { x: imgX, y: imgY };
      setImageSize({ width: w, height: h });
      setImagePos({ x: imgX, y: imgY });
      const boxW = Math.min(w * 0.8, h * 0.8 * ASPECT_W / ASPECT_H);
      const boxH = boxW * ASPECT_H / ASPECT_W;
      const newBox = { x: imgX + (w - boxW) / 2, y: imgY + (h - boxH) / 2, width: boxW, height: boxH };
      setBox(newBox);
      boxRef.current = newBox;
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const onMouseDownBox = useCallback((e) => {
    e.preventDefault();
    dragRef.current = { type: "move", startX: e.clientX, startY: e.clientY, origBox: { ...boxRef.current } };
  }, []);

  const onMouseDownHandle = useCallback((e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { type: "resize", dir, startX: e.clientX, startY: e.clientY, origBox: { ...boxRef.current } };
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragRef.current) return;
      const { type, dir, startX, startY, origBox } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const minW = 60;

      if (type === "move") {
        const c = clamp(origBox.x + dx, origBox.y + dy, origBox.width);
        setBox(c); boxRef.current = c;
        return;
      }

      let x = origBox.x, y = origBox.y, w = origBox.width;
      if (dir === "e"  || dir === "se" || dir === "sw") { w = Math.max(minW, origBox.width + dx); }
      if (dir === "w"  || dir === "nw")                 { w = Math.max(minW, origBox.width - dx); x = origBox.x + origBox.width - w; }
      if (dir === "s")  { w = Math.max(minW, (origBox.height + dy) * ASPECT_W / ASPECT_H); }
      if (dir === "n")  { w = Math.max(minW, (origBox.height - dy) * ASPECT_W / ASPECT_H); y = origBox.y + origBox.height - w * ASPECT_H / ASPECT_W; }
      if (dir === "ne") { w = Math.max(minW, origBox.width + dx); y = origBox.y + origBox.height - w * ASPECT_H / ASPECT_W; }
      if (dir === "nw") { w = Math.max(minW, origBox.width - dx); x = origBox.x + origBox.width - w; y = origBox.y + origBox.height - w * ASPECT_H / ASPECT_W; }

      const c = clamp(x, y, w);
      setBox(c); boxRef.current = c;
    };

    const onMouseUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [clamp]);

  const handles = [
    { dir: "n",  style: { top: -5, left: "50%", transform: "translateX(-50%)", cursor: "n-resize" } },
    { dir: "s",  style: { bottom: -5, left: "50%", transform: "translateX(-50%)", cursor: "s-resize" } },
    { dir: "w",  style: { left: -5, top: "50%", transform: "translateY(-50%)", cursor: "w-resize" } },
    { dir: "e",  style: { right: -5, top: "50%", transform: "translateY(-50%)", cursor: "e-resize" } },
    { dir: "nw", style: { top: -5, left: -5, cursor: "nw-resize" } },
    { dir: "ne", style: { top: -5, right: -5, cursor: "ne-resize" } },
    { dir: "sw", style: { bottom: -5, left: -5, cursor: "sw-resize" } },
    { dir: "se", style: { bottom: -5, right: -5, cursor: "se-resize" } },
  ];

  const handleConfirm = () => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      const scaleX = img.width / imageSize.width;
      const scaleY = img.height / imageSize.height;
      const cropX = (box.x - imagePos.x) * scaleX;
      const cropY = (box.y - imagePos.y) * scaleY;
      const cropW = box.width * scaleX;
      const cropH = box.height * scaleY;
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 400;
      canvas.getContext("2d").drawImage(img, cropX, cropY, cropW, cropH, 0, 0, 600, 400);
      onConfirm(canvas.toDataURL("image/jpeg", 0.92));
      onClose();
    };
    img.src = imageSrc;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-box-capa">
        <div className="modal-header">
          <span>{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" ref={containerRef}>
          {!imageSrc ? (
            <label className="select-image-btn">
              Selecionar Imagem
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            </label>
          ) : (
            <>
              <img src={imageSrc} alt="preview" style={{
                position: "absolute", width: imageSize.width, height: imageSize.height,
                top: imagePos.y, left: imagePos.x, userSelect: "none", pointerEvents: "none",
              }} />

              {/* Sombras fora do crop */}
              <div style={{ position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", pointerEvents:"none",
                left:imagePos.x, top:imagePos.y, width:imageSize.width, height:box.y - imagePos.y }} />
              <div style={{ position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", pointerEvents:"none",
                left:imagePos.x, top:box.y + box.height, width:imageSize.width,
                height:imagePos.y + imageSize.height - (box.y + box.height) }} />
              <div style={{ position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", pointerEvents:"none",
                left:imagePos.x, top:box.y, width:box.x - imagePos.x, height:box.height }} />
              <div style={{ position:"absolute", backgroundColor:"rgba(0,0,0,0.6)", pointerEvents:"none",
                left:box.x + box.width, top:box.y,
                width:imagePos.x + imageSize.width - (box.x + box.width), height:box.height }} />

              {/* Guias regra dos terços */}
              <div style={{ position:"absolute", pointerEvents:"none", left:box.x, top:box.y,
                width:box.width, height:box.height, zIndex:9 }}>
                {[1/3, 2/3].map(p => (
                  <div key={`v${p}`} style={{ position:"absolute", left:`${p*100}%`, top:0,
                    width:1, height:"100%", background:"rgba(255,255,255,0.2)" }} />
                ))}
                {[1/3, 2/3].map(p => (
                  <div key={`h${p}`} style={{ position:"absolute", top:`${p*100}%`, left:0,
                    height:1, width:"100%", background:"rgba(255,255,255,0.2)" }} />
                ))}
              </div>

              {/* Box de crop */}
              <div onMouseDown={onMouseDownBox} style={{
                position:"absolute", left:box.x, top:box.y, width:box.width, height:box.height,
                border:"2px solid white", boxSizing:"border-box", cursor:"move", zIndex:10,
              }}>
                {handles.map(({ dir, style }) => (
                  <div key={dir} onMouseDown={(e) => onMouseDownHandle(e, dir)} style={{
                    position:"absolute", width:10, height:10, backgroundColor:"white",
                    border:"1px solid #aaa", borderRadius:2, zIndex:20, ...style,
                  }} />
                ))}
              </div>
            </>
          )}
        </div>

        {imageSrc && (
          <div className="modal-footer">
            <button className="reselect-btn" onClick={() => setImageSrc(null)}>Escolher outra imagem</button>
            <button className="confirm-btn" onClick={handleConfirm}>Confirmar</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCropModalCapa;
