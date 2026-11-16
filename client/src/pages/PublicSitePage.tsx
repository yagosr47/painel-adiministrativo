import React, { useEffect, useState } from 'react';
import { api, query } from '../lib/api';
import type { ImageRef, SiteConfig } from '../types';
import { Spinner } from '../components/ui';
import { SiteRenderer } from '../site/SiteRenderer';
import { navigate } from '../lib/router';

interface PublicSite {
  site: {
    id: string;
    subdomain: string;
    status: string;
    published_at: string | null;
    config: SiteConfig;
    segment_slug: string;
    client_name: string;
  };
  images: Record<string, ImageRef>;
  preview: boolean;
}

export function PublicSitePage({ slug, preview }: { slug: string; preview: boolean }) {
  const [data, setData] = useState<PublicSite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<PublicSite>(`/api/public/sites/${slug}${query({ preview: preview ? 1 : undefined })}`)
      .then((res) => {
        setData(res);
        document.title = res.site.config.seo?.title || res.site.config.identity.name;
        const description = res.site.config.seo?.description;
        if (description) {
          let meta = document.querySelector('meta[name="description"]');
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'description');
            document.head.appendChild(meta);
          }
          meta.setAttribute('content', description);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, preview]);

  if (loading) return <Spinner label="Carregando site…" />;
  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#0b1120' }}>
        <div className="card card-pad" style={{ maxWidth: 420, textAlign: 'center', display: 'grid', gap: 12, justifyItems: 'center' }}>
          <div className="brand-mark" style={{ width: 42, height: 42, borderRadius: 12 }}>
            PS
          </div>
          <h2 style={{ fontSize: 17 }}>Site nao encontrado</h2>
          <p className="small muted">
            {error ?? 'Este site ainda nao foi publicado ou o endereco esta incorreto.'}
          </p>
          <button className="btn" onClick={() => navigate('')}>
            Ir para o painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {data.preview ? (
        <div
          style={{
            background: '#78350f',
            color: '#fef3c7',
            fontSize: 12,
            padding: '6px 14px',
            textAlign: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          Pre-visualizacao do painel — este site nao esta publicado.
        </div>
      ) : null}
      <SiteRenderer config={data.site.config} images={data.images} />
    </>
  );
}
