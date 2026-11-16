import React, { useState } from 'react';
import { api } from '../lib/api';
import type { Segment, Template, TemplatePreset } from '../types';
import { Modal, Field, useToast } from './ui';

export function TemplateCreateModal({
  segments,
  onClose,
  onCreated,
}: {
  segments: Segment[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [segment, setSegment] = useState(segments[0]?.slug ?? 'restaurantes');
  const [category, setCategory] = useState('');
  const [summary, setSummary] = useState('');
  const [source, setSource] = useState('');
  const [preset, setPreset] = useState(true);
  const [presets, setPresets] = useState<TemplatePreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const toast = useToast();

  React.useEffect(() => {
    api.get<{ templates: Template[] }>('/api/templates').then((r) => setTemplates(r.templates)).catch(() => {});
    api
      .get<{ presets: TemplatePreset[] }>('/api/template-presets')
      .then((r) => setPresets(r.presets))
      .catch(() => {});
  }, []);

  const currentPreset = presets.find((p) => p.segment_slug === segment);

  const submit = async () => {
    if (!name.trim()) {
      toast.push('Informe o nome do template', 'error');
      return;
    }
    setLoading(true);
    try {
      let config;
      if (source) {
        const base = templates.find((t) => t.id === source);
        if (base) {
          const detail = await api.get<{ template: Template }>(`/api/templates/${base.id}`);
          config = detail.template.config;
        }
      }
      const res = await api.post<{ template: Template }>('/api/templates', {
        name,
        segment_slug: segment,
        category: category || currentPreset?.category || 'geral',
        summary,
        status: 'draft',
        // config copiado de outro template vence o ponto de partida
        config,
        preset: !config && preset,
      });
      toast.push('Template criado como rascunho', 'success');
      onCreated(res.template.id);
    } catch (error: any) {
      toast.push(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const compatibleSources = templates.filter((t) => t.segment_slug === segment);

  return (
    <Modal
      title="Novo template"
      subtitle="Comece em branco ou reaproveite a estrutura de um modelo existente"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" onClick={submit} disabled={loading}>
            {loading ? <span className="spin" /> : null} Criar template
          </button>
        </>
      }
    >
      <div className="grid cols-2">
        <Field label="Nome do template">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Pizzaria Forno a Lenha" autoFocus />
        </Field>
        <Field label="Categoria interna" hint="Usada para organizar dentro do segmento">
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex.: Pizzaria, Hamburgueria…" />
        </Field>
      </div>
      <Field label="Segmento">
        <select className="select" value={segment} onChange={(e) => { setSegment(e.target.value); setSource(''); }}>
          {segments.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Resumo" hint="Aparece no card da biblioteca">
        <textarea className="textarea" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      <Field
        label="Ponto de partida"
        hint="O modelo pre-pronto ja vem com secoes, tema, categorias e itens de exemplo. Voce ajusta depois no editor."
      >
        <div className="start-options">
          <label className={`start-option ${preset && !source ? 'active' : ''}`}>
            <input
              type="radio"
              checked={preset && !source}
              onChange={() => {
                setPreset(true);
                setSource('');
              }}
            />
            <span>
              <strong>Modelo pre-pronto de {currentPreset?.segment_name ?? segment}</strong>
              <span className="small muted">
                {currentPreset
                  ? `${currentPreset.sections_count} secoes · ${currentPreset.products_count} itens · ${currentPreset.categories_count} categorias`
                  : 'carregando estrutura…'}
              </span>
            </span>
          </label>

          {compatibleSources.length ? (
            <label className={`start-option ${source ? 'active' : ''}`}>
              <input
                type="radio"
                checked={Boolean(source)}
                onChange={() => {
                  setPreset(false);
                  setSource(compatibleSources[0].id);
                }}
              />
              <span>
                <strong>Copiar de um template existente</strong>
                <span className="small muted">Cria uma copia independente da configuracao</span>
              </span>
            </label>
          ) : null}

          <label className={`start-option ${!preset && !source ? 'active' : ''}`}>
            <input
              type="radio"
              checked={!preset && !source}
              onChange={() => {
                setPreset(false);
                setSource('');
              }}
            />
            <span>
              <strong>Comecar em branco</strong>
              <span className="small muted">Somente o essencial; monte tudo no editor</span>
            </span>
          </label>
        </div>
      </Field>

      {source ? (
        <Field label="Template de origem">
          <select className="select" value={source} onChange={(e) => setSource(e.target.value)}>
            {compatibleSources.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <div className="banner info">
        Templates sao <strong>modelos</strong>. Sites de clientes guardam copia propria — editar este template
        depois nao altera nenhum site existente.
      </div>
    </Modal>
  );
}
