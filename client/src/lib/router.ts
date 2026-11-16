import { useEffect, useState } from 'react';

/** Router minimo baseado em hash: #/rota/param — sem dependencias externas. */
export function currentRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [pathPart, queryPart] = hash.split('?');
  const parts = pathPart.split('/').filter(Boolean);
  const params = new URLSearchParams(queryPart ?? '');
  return { parts, params, raw: hash };
}

export function navigate(path: string) {
  if (window.location.hash === `#/${path}`) return;
  window.location.hash = `/${path.replace(/^\/+/, '')}`;
}

export function useRoute() {
  const [route, setRoute] = useState(currentRoute());
  useEffect(() => {
    const onChange = () => {
      setRoute(currentRoute());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
