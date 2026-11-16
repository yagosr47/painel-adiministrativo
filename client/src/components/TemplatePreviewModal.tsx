import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { ImageAsset, ImageRef, Template, SiteConfig } from '../types';
import { Modal, Spinner } from './ui';
import { SiteRenderer } from '../site/SiteRenderer';

export function TemplatePreviewModal({
  template,
  onClose,
  configOverride,
  title,
}: {
  template: Template;
  onClose: () => void;
  configOverride?: SiteConfig;
  title?: string;
}) {
  const [full, setFull] = useState<Template | null>(template.config ? template : null);
  const [images, setImages] = useState<Record<string, ImageRef>>({});
  const [loading, setLoading] = useState(!template.config);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const detail = template.config
          ? { template }
          : await api.get<{ template: Template }>(`/api/templates/${template.id}`);
        if (!alive) return;
        setFull(detail.template);
        const res = await api.get<{ images: ImageAsset[] }>(
          `/api/images?segment=${detail.template.segment_slug}`,
        );
        if (!alive) return;
        setImages(
          Object.fromEntries(res.images.map((img) => [img.id, { id: img.id, url: img.url, title: img.title, alt: img.alt, license: img.license }])),
        );
      } catch (err: any) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [template.id]);

  const config = configOverride ?? full?.config;

  return (
    <Modal
      title={title ?? `Previa: ${template.name}`}
      subtitle={`${template.segment_name} · ${template.category} · configuracao do modelo (nao e um site publicado)`}
      size="xl"
      onClose={onClose}
      footer={
        <>
          <div className="chips" style={{ marginRight: 'auto' }}>
            <button className={`chip ${device === 'desktop' ? 'active' : ''}`} onClick={() => setDevice('desktop')}>
              Desktop
            </button>
            <button className={`chip ${device === 'mobile' ? 'active' : ''}`} onClick={() => setDevice('mobile')}>
              Mobile
            </button>
          </div>
          <button className="btn" onClick={onClose}>
            Fechar
          </button>
        </>
      }
    >
      {loading ? (
        <Spinner label="Montando previa…" />
      ) : error ? (
        <div className="banner danger">{error}</div>
      ) : config ? (
        <>
          <div className="device-frame" style={{ margin: '0 auto', width: device === 'mobile' ? 390 : '100%' }}>
            <div className="device-bar">
              <div className="dots">
                <i />
                <i />
                <i />
              </div>
              <div className="url">previa · {template.slug}</div>
              <span className="pill">Modelo</span>
            </div>
            <div className="preview-scroll">
              <SiteRenderer config={config} images={images} />
            </div>
          </div>
          <div className="banner info">
            <span>ℹ</span>
            <span>
              Esta previa usa a biblioteca ilustrativa do segmento. Ao criar um site para um cliente, o sistema
              gera uma copia propria do configuracao e aceita apenas imagens do segmento ou do acervo daquele
              cliente.
            </span>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
