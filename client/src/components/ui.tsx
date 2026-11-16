import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/* --------------------------------- Toasts -------------------------------- */

type Toast = { id: number; message: string; kind: 'info' | 'success' | 'error' };
type ToastCtx = { push: (message: string, kind?: Toast['kind']) => void };

const ToastContext = createContext<ToastCtx>({ push: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((message: string, kind: Toast['kind'] = 'info') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), kind === 'error' ? 6000 : 3800);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <span>{t.kind === 'error' ? '⚠' : t.kind === 'success' ? '✓' : 'ℹ'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* --------------------------------- Modal --------------------------------- */

export function Modal({
  title,
  subtitle,
  children,
  footer,
  onClose,
  size,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  size?: 'wide' | 'xl';
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size ?? ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{title}</h2>
            {subtitle ? <div className="sub">{subtitle}</div> : null}
          </div>
          <button className="btn ghost icon" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------- Form fields ------------------------------ */

export function Field({
  label,
  hint,
  children,
  style,
}: {
  label?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="field" style={style}>
      {label ? <label>{label}</label> : null}
      {children}
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="row">
        <input type="color" className="input-color" value={value} onChange={(e) => onChange(e.target.value)} />
        <input className="input sm mono" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

export function Pill({ children, tone }: { children: React.ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' | 'violet' }) {
  return <span className={`pill ${tone ?? ''}`}>{children}</span>;
}

export function StatusPill({ status }: { status?: string | null }) {
  const map: Record<string, { label: string; tone: 'green' | 'amber' | 'red' | 'blue' }> = {
    published: { label: 'Publicado', tone: 'green' },
    draft: { label: 'Rascunho', tone: 'amber' },
    offline: { label: 'Fora do ar', tone: 'red' },
    active: { label: 'Ativo', tone: 'green' },
    paused: { label: 'Pausado', tone: 'amber' },
    archived: { label: 'Arquivado', tone: 'red' },
  };
  const entry = map[status ?? ''] ?? { label: status ?? '—', tone: 'blue' as const };
  return (
    <span className={`pill dot ${entry.tone}`}>{entry.label}</span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="page-loading">
      <div className="dot" />
      {label ? <span className="small muted">{label}</span> : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children ? <div className="small">{children}</div> : null}
      {action}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        className="input"
        value={value}
        placeholder={placeholder ?? 'Buscar…'}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger,
  onConfirm,
  onCancel,
  details,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  details?: React.ReactNode;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn" onClick={onCancel}>
            Cancelar
          </button>
          <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ lineHeight: 1.6 }}>{message}</div>
      {details ? <div className="banner warn">{details}</div> : null}
    </Modal>
  );
}

/* ------------------------------- Utilitarios ----------------------------- */

export function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fn()
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((err) => {
        if (alive) setError(err?.message ?? 'Erro inesperado');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, reload: () => setNonce((n) => n + 1), setData };
}

export function downloadText(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
