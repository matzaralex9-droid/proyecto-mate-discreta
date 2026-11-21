import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';

export function IconButton({ label, children, onClick, disabled = false, className = '' }: { label: string; children: ReactNode; onClick: () => void; disabled?: boolean; className?: string }) {
  return <button type="button" className={'icon-button ' + className} title={label} aria-label={label} disabled={disabled} onClick={onClick}>{children}</button>;
}
export function usePlayback(length: number) {
  const [position, setPosition] = useState(0), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(1);
  useEffect(() => { if (!playing || !length) return; if (position >= length) { setPlaying(false); return; } const timer = window.setTimeout(() => setPosition(p => Math.min(p + 1, length)), 1150 / speed); return () => clearTimeout(timer); }, [playing, position, length, speed]);
  function toggle() { if (!length) return; if (position >= length) setPosition(0); setPlaying(p => !p); }
  useEffect(() => { const key = (e: KeyboardEvent) => { const el = e.target as HTMLElement; if (e.code !== 'Space' || /INPUT|TEXTAREA|SELECT|BUTTON/.test(el.tagName) || el.isContentEditable || document.querySelector('dialog[open]')) return; e.preventDefault(); toggle(); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); });
  return { position, playing, speed, setSpeed, toggle, seek: (p: number) => { setPlaying(false); setPosition(p); }, reset: () => { setPlaying(false); setPosition(0); }, start: () => { setPosition(0); setPlaying(true); } };
}
export type PlaybackController = ReturnType<typeof usePlayback>;
export function Playback({ player, total, onStart, label = 'recorrido', disabled = false }: { player: PlaybackController; total: number; onStart: () => void; label?: string; disabled?: boolean }) {
  return <div className="playback">
    <div className="playback-buttons">
      <IconButton label="Volver al inicio" onClick={() => player.seek(0)} disabled={!total || player.position === 0}><SkipBack size={17}/></IconButton>
      <IconButton label="Paso anterior" onClick={() => player.seek(Math.max(0, player.position - 1))} disabled={!total || !player.position}><ChevronLeft size={20}/></IconButton>
      <button className="play-button" disabled={disabled} onClick={total ? player.toggle : onStart} aria-label={player.playing ? 'Pausar' : player.position === total && total ? 'Repetir ' + label : 'Reproducir ' + label}>{player.playing ? <Pause size={19} fill="currentColor"/> : <Play size={19} fill="currentColor"/>}</button>
      <IconButton label="Siguiente paso" onClick={() => player.seek(Math.min(total, player.position + 1))} disabled={!total || player.position >= total}><ChevronRight size={20}/></IconButton>
      <IconButton label="Ver resultado" onClick={() => player.seek(total)} disabled={!total || player.position >= total}><SkipForward size={17}/></IconButton>
    </div>
    <div className="scrubber"><label htmlFor="playback-progress"><span>{player.playing ? 'En movimiento' : player.position === total && total ? 'Completado' : player.position ? 'En pausa' : 'Listo para explorar'}</span><span>{player.position} <span className="muted">/ {total || '—'}</span></span></label><input id="playback-progress" type="range" min="0" max={total || 1} value={player.position} disabled={!total} onChange={e => player.seek(Number(e.target.value))} aria-label="Paso de la animación"/></div>
    <label className="speed-control"><span>Velocidad</span><select value={player.speed} onChange={e => player.setSpeed(Number(e.target.value))} aria-label="Velocidad de animación"><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option><option value="3">3×</option></select></label>
  </div>;
}
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className={'modal ' + (wide ? 'wide' : '')} aria-labelledby="dialog-title" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current) { const b = ref.current.getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) onClose(); } }}><div className="modal-heading"><h2 id="dialog-title">{title}</h2><IconButton label="Cerrar ventana" onClick={onClose}><X size={21}/></IconButton></div><div className="modal-content">{children}</div></dialog>;
}
export function EmptyState({ title, description, onReset }: { title: string; description: string; onReset: () => void }) {
  return <div className="empty-state"><div className="empty-glyph"><span/><span/><span/></div><h3>{title}</h3><p>{description}</p><button className="button secondary" onClick={onReset}><RotateCcw size={16}/>Cargar un ejemplo</button></div>;
}
