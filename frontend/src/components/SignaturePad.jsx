import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function SignaturePad({ onSave, value, readOnly }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const lastPos = useRef(null);

  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 150;

  useEffect(() => {
    if (readOnly || !value) return;
    // If there's an existing value passed in read mode, don't need canvas
  }, [readOnly, value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || readOnly) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [readOnly]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = useCallback((e) => {
    if (readOnly) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  }, [readOnly]);

  const draw = useCallback((e) => {
    if (!isDrawing || readOnly) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current = pos;
    setHasDrawing(true);
  }, [isDrawing, readOnly]);

  const stopDrawing = useCallback((e) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    setIsDrawing(false);
    lastPos.current = null;
  }, [isDrawing]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL('image/png');
    if (onSave) onSave(dataURL);
  };

  if (readOnly && value) {
    return (
      <div className="signature-display">
        <img src={value} alt="Firma" />
      </div>
    );
  }

  if (readOnly && !value) {
    return (
      <div className="signature-display" style={{ padding: '20px', color: '#94a3b8', textAlign: 'center', fontSize: '14px' }}>
        Sin firma
      </div>
    );
  }

  return (
    <div className="signature-pad">
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ width: '100%', height: `${CANVAS_HEIGHT}px` }}
        />
        {!hasDrawing && (
          <div className="signature-pad-placeholder">
            Firma aquí
          </div>
        )}
      </div>
      <div className="signature-pad-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={clearCanvas}
        >
          Limpiar
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={!hasDrawing}
        >
          Guardar firma
        </button>
        {value && (
          <span style={{ fontSize: '13px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ✓ Firma guardada
          </span>
        )}
      </div>
    </div>
  );
}
