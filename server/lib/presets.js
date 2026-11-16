/**
 * Modelos pre-prontos ("pontos de partida") por segmento.
 *
 * Um template novo criado do zero pelo painel ficava com o `emptyConfig`, ou
 * seja, sem secoes, sem tema e sem catalogo — o usuario precisava montar tudo
 * manualmente. Aqui ficam estruturas prontas por segmento: secoes na ordem
 * certa, tema coerente, categorias e itens de exemplo. O resultado e sempre
 * normalizado por `normalizeConfig`, e ao virar template/site cada cliente
 * recebe um clone independente.
 *
 * Regras de conteudo:
 *  - textos usam marcadores ({{clientName}}, {{city}}...) quando faz sentido;
 *  - nenhuma imagem e referenciada aqui. As imagens vem da biblioteca do
 *    segmento no momento da criacao (ver `attachPreviewImages`) e ficam
 *    marcadas como ilustrativas ate o cliente trocar.
 */

/** Config completa para cada segmento. */
export const SEGMENT_PRESETS = {
  restaurantes: {
    label: 'Restaurantes e lanchonetes',
    category: 'Alimentacao',
    accent: '#f97316',
    theme: {
      primary: '#7f1d1d',
      secondary: '#b91c1c',
      accent: '#f97316',
      background: '#fffbf5',
      surface: '#fef3c7',
      text: '#1c1917',
      muted: '#78716c',
      radius: 14,
      fontHeading: 'condensed',
      fontBody: 'humanist',
      density: 'comfortable',
    },
    identity: { tagline: 'Feito na casa, servido na hora', sectionLabel: 'Cardapio' },
    sections: ['hero', 'menu-highlights', 'catalog', 'about', 'gallery', 'hours', 'testimonials', 'contact'],
    products: {
      categories: [
        { id: 'destaques', name: 'Destaques' },
        { id: 'pratos', name: 'Pratos' },
        { id: 'bebidas', name: 'Bebidas' },
        { id: 'sobremesas', name: 'Sobremesas' },
      ],
      items: [
        { id: 'prato-1', name: 'Prato da casa', description: 'Receita assinatura do estabelecimento.', price: 48, categoryId: 'pratos', featured: true },
        { id: 'prato-2', name: 'Porcao para dividir', description: 'Serve duas pessoas.', price: 62, categoryId: 'pratos' },
        { id: 'bebida-1', name: 'Bebida artesanal', description: 'Preparada na hora.', price: 16, categoryId: 'bebidas', featured: true },
        { id: 'sobremesa-1', name: 'Sobremesa da casa', description: 'Receita propria.', price: 22, categoryId: 'sobremesas' },
      ],
    },
    seo: { title: '{{clientName}} — {{city}}', description: 'Cardapio, horarios e delivery de {{clientName}} em {{city}}.' },
  },

  barbearias: {
    label: 'Barbearias e saloes',
    category: 'Beleza',
    accent: '#0ea5e9',
    theme: {
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#0ea5e9',
      background: '#0b1220',
      surface: '#111c2e',
      text: '#e2e8f0',
      muted: '#94a3b8',
      radius: 10,
      fontHeading: 'condensed',
      fontBody: 'geometric',
      density: 'compact',
    },
    identity: { tagline: 'Corte, barba e cuidado', sectionLabel: 'Servicos' },
    sections: ['hero', 'features', 'catalog', 'team', 'gallery', 'testimonials', 'hours', 'booking', 'contact'],
    products: {
      categories: [
        { id: 'cortes', name: 'Cortes' },
        { id: 'barba', name: 'Barba' },
        { id: 'combos', name: 'Combos' },
        { id: 'produtos', name: 'Produtos' },
      ],
      items: [
        { id: 'sv-corte', name: 'Corte masculino', description: 'Maquina, tesoura e finalizacao.', price: 55, categoryId: 'cortes', featured: true },
        { id: 'sv-barba', name: 'Barba na navalha', description: 'Toalha quente e balsamo.', price: 40, categoryId: 'barba', featured: true },
        { id: 'sv-combo', name: 'Corte + barba', description: 'Combo completo.', price: 85, categoryId: 'combos' },
        { id: 'pd-pomada', name: 'Pomada modeladora', description: 'Fixacao media, acabamento matte.', price: 45, categoryId: 'produtos' },
      ],
    },
    seo: { title: '{{clientName}} — Barbearia em {{city}}', description: 'Agende corte e barba em {{clientName}}, {{city}}.' },
  },

  oficinas: {
    label: 'Oficinas e servicos automotivos',
    category: 'Automotivo',
    accent: '#f59e0b',
    theme: {
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#f59e0b',
      background: '#f8fafc',
      surface: '#e2e8f0',
      text: '#0f172a',
      muted: '#64748b',
      radius: 8,
      fontHeading: 'condensed',
      fontBody: 'humanist',
      density: 'comfortable',
    },
    identity: { tagline: 'Diagnostico preciso, servico garantido', sectionLabel: 'Servicos' },
    sections: ['hero', 'features', 'catalog', 'steps', 'about', 'gallery', 'testimonials', 'contact'],
    products: {
      categories: [
        { id: 'revisao', name: 'Revisao' },
        { id: 'freios', name: 'Freios e suspensao' },
        { id: 'motor', name: 'Motor' },
        { id: 'estetica', name: 'Estetica automotiva' },
      ],
      items: [
        { id: 'sv-revisao', name: 'Revisao completa', description: 'Checklist de 30 itens.', price: 290, categoryId: 'revisao', featured: true },
        { id: 'sv-oleo', name: 'Troca de oleo e filtros', description: 'Oleo sintetico e filtros.', price: 240, categoryId: 'motor', featured: true },
        { id: 'sv-freio', name: 'Pastilhas e discos', description: 'Par dianteiro com garantia.', price: 420, categoryId: 'freios' },
        { id: 'sv-alinhamento', name: 'Alinhamento e balanceamento', description: 'Geometria completa.', price: 150, categoryId: 'revisao' },
      ],
    },
    seo: { title: '{{clientName}} — Oficina em {{city}}', description: 'Revisao, freios e diagnostico em {{clientName}}, {{city}}.' },
  },

  lojas: {
    label: 'Lojas de roupas',
    category: 'Moda',
    accent: '#db2777',
    theme: {
      primary: '#18181b',
      secondary: '#3f3f46',
      accent: '#db2777',
      background: '#ffffff',
      surface: '#f4f4f5',
      text: '#18181b',
      muted: '#71717a',
      radius: 4,
      fontHeading: 'serif',
      fontBody: 'geometric',
      density: 'comfortable',
    },
    identity: { tagline: 'Colecao da estacao', sectionLabel: 'Colecao' },
    sections: ['hero', 'catalog', 'about', 'gallery', 'features', 'testimonials', 'contact'],
    products: {
      categories: [
        { id: 'novidades', name: 'Novidades' },
        { id: 'vestidos', name: 'Vestidos' },
        { id: 'partes', name: 'Partes de cima' },
        { id: 'calcados', name: 'Calcados' },
      ],
      items: [
        { id: 'pc-vestido', name: 'Vestido midi', description: 'Tecido leve, caimento fluido.', price: 189, categoryId: 'vestidos', featured: true },
        { id: 'pc-camisa', name: 'Camisa oversize', description: 'Algodao encorpado.', price: 129, categoryId: 'partes', featured: true },
        { id: 'pc-calca', name: 'Calca wide leg', description: 'Cintura alta.', price: 169, categoryId: 'novidades' },
        { id: 'pc-tenis', name: 'Tenis de couro', description: 'Solado confortavel.', price: 249, categoryId: 'calcados' },
      ],
    },
    seo: { title: '{{clientName}} — Moda em {{city}}', description: 'Colecao, novidades e atendimento de {{clientName}} em {{city}}.' },
  },

  mercados: {
    label: 'Mercados e mercearias',
    category: 'Varejo',
    accent: '#16a34a',
    theme: {
      primary: '#14532d',
      secondary: '#166534',
      accent: '#f59e0b',
      background: '#fefce8',
      surface: '#ecfccb',
      text: '#1a2e05',
      muted: '#4d5c3a',
      radius: 12,
      fontHeading: 'humanist',
      fontBody: 'humanist',
      density: 'compact',
    },
    identity: { tagline: 'Do bairro, para o bairro', sectionLabel: 'Ofertas' },
    sections: ['hero', 'features', 'catalog', 'hours', 'gallery', 'about', 'contact'],
    products: {
      categories: [
        { id: 'ofertas', name: 'Ofertas da semana' },
        { id: 'hortifruti', name: 'Hortifruti' },
        { id: 'padaria', name: 'Padaria' },
        { id: 'mercearia', name: 'Mercearia' },
      ],
      items: [
        { id: 'of-cesta', name: 'Cesta de frutas', description: 'Selecao da semana.', price: 39.9, categoryId: 'hortifruti', featured: true },
        { id: 'of-pao', name: 'Pao frances (kg)', description: 'Assado varias vezes ao dia.', price: 18.5, categoryId: 'padaria', featured: true },
        { id: 'of-cafe', name: 'Cafe 500g', description: 'Torra media.', price: 21.9, categoryId: 'mercearia' },
        { id: 'of-combo', name: 'Combo cafe da manha', description: 'Pao, leite e cafe.', price: 34.9, categoryId: 'ofertas' },
      ],
    },
    seo: { title: '{{clientName}} — Mercado em {{city}}', description: 'Ofertas, horarios e entrega de {{clientName}} em {{city}}.' },
  },

  clinicas: {
    label: 'Clinicas e servicos profissionais',
    category: 'Saude',
    accent: '#0ea5e9',
    theme: {
      primary: '#0c4a6e',
      secondary: '#075985',
      accent: '#0ea5e9',
      background: '#ffffff',
      surface: '#f0f9ff',
      text: '#0f172a',
      muted: '#64748b',
      radius: 16,
      fontHeading: 'geometric',
      fontBody: 'humanist',
      density: 'comfortable',
    },
    identity: { tagline: 'Atendimento com hora marcada', sectionLabel: 'Especialidades' },
    sections: ['hero', 'features', 'about', 'team', 'steps', 'testimonials', 'faq', 'booking', 'contact'],
    products: {
      categories: [
        { id: 'consultas', name: 'Consultas' },
        { id: 'exames', name: 'Exames' },
        { id: 'procedimentos', name: 'Procedimentos' },
      ],
      items: [
        { id: 'sv-consulta', name: 'Consulta clinica', description: 'Avaliacao inicial completa.', price: 280, categoryId: 'consultas', featured: true },
        { id: 'sv-retorno', name: 'Retorno', description: 'Acompanhamento em ate 30 dias.', price: 0, categoryId: 'consultas' },
        { id: 'sv-exame', name: 'Exame de rotina', description: 'Coleta no local.', price: 190, categoryId: 'exames' },
        { id: 'sv-procedimento', name: 'Procedimento estetico', description: 'Protocolo personalizado.', price: 450, categoryId: 'procedimentos' },
      ],
    },
    seo: { title: '{{clientName}} — Atendimento em {{city}}', description: 'Especialidades, equipe e agendamento de {{clientName}} em {{city}}.' },
  },

  portfolio: {
    label: 'Portfolios e institucionais',
    category: 'Institucional',
    accent: '#6366f1',
    theme: {
      primary: '#111827',
      secondary: '#1f2937',
      accent: '#6366f1',
      background: '#0b0f19',
      surface: '#151b2b',
      text: '#f8fafc',
      muted: '#94a3b8',
      radius: 6,
      fontHeading: 'geometric',
      fontBody: 'geometric',
      density: 'spacious',
    },
    identity: { tagline: 'Projetos, processo e resultados', sectionLabel: 'Projetos' },
    sections: ['hero', 'about', 'catalog', 'gallery', 'steps', 'stats', 'testimonials', 'contact'],
    products: {
      categories: [
        { id: 'projetos', name: 'Projetos' },
        { id: 'servicos', name: 'Servicos' },
      ],
      items: [
        { id: 'pj-1', name: 'Projeto em destaque', description: 'Estudo de caso completo.', price: 0, categoryId: 'projetos', featured: true, badge: 'Case' },
        { id: 'pj-2', name: 'Identidade visual', description: 'Marca, paleta e tipografia.', price: 0, categoryId: 'servicos', featured: true },
        { id: 'pj-3', name: 'Site institucional', description: 'Design e implementacao.', price: 0, categoryId: 'servicos' },
      ],
    },
    seo: { title: '{{clientName}} — Portfolio', description: 'Projetos selecionados de {{clientName}}.' },
  },
};

export const PRESET_SEGMENTS = Object.keys(SEGMENT_PRESETS);

/** Lista enxuta para a UI mostrar o que cada ponto de partida oferece. */
export function listPresets(SEGMENTS = []) {
  return PRESET_SEGMENTS.map((slug) => {
    const preset = SEGMENT_PRESETS[slug];
    const segment = SEGMENTS.find((s) => s.slug === slug);
    return {
      segment_slug: slug,
      segment_name: segment?.name ?? preset.label,
      category: preset.category,
      accent: preset.accent,
      sections: preset.sections,
      sections_count: preset.sections.length,
      products_count: preset.products.items.length,
      categories_count: preset.products.categories.length,
      density: preset.theme.density,
      font_heading: preset.theme.fontHeading,
    };
  });
}

const SECTION_COPY = {
  hero: {
    eyebrow: '{{city}}',
    title: '{{clientName}}',
    subtitle: 'Conheca o que preparamos para voce.',
    align: 'left',
    overlay: 50,
    primaryLabel: 'Falar no WhatsApp',
    secondaryLabel: 'Ver secao',
    badges: ['Atendimento no local', 'Agendamento online'],
  },
  about: {
    title: 'Sobre {{clientName}}',
    body: 'Somos um estabelecimento de {{city}} e atendemos com cuidado, do primeiro contato ao pos-venda. Este texto e um ponto de partida: escreva a historia real do negocio.',
    highlights: ['Atendimento proximo', 'Equipe propria', 'Garantia de servico'],
    layout: 'image-right',
  },
  features: {
    title: 'Por que escolher a casa',
    subtitle: 'Tres motivos para confiar no atendimento.',
    items: [
      { icon: 'star', title: 'Qualidade', body: 'Padrao de entrega constante.' },
      { icon: 'clock', title: 'Agilidade', body: 'Resposta rapida e horarios claros.' },
      { icon: 'shield', title: 'Confianca', body: 'Compromisso com o que foi combinado.' },
    ],
  },
  catalog: { title: 'Catalogo', subtitle: 'Itens e servicos disponiveis.', mode: 'cards', showPrices: true, columns: 3, categoryFilter: true },
  'menu-highlights': { title: 'Destaques do cardapio', subtitle: 'O que sai mais da cozinha.' },
  gallery: { title: 'Galeria', subtitle: 'Um pouco do dia a dia.', columns: 3, layout: 'grid' },
  team: {
    title: 'Equipe',
    subtitle: 'Quem atende voce.',
    members: [
      { name: 'Profissional 1', role: 'Atendimento', bio: 'Especialista responsavel.' },
      { name: 'Profissional 2', role: 'Atendimento', bio: 'Especialista responsavel.' },
    ],
  },
  testimonials: {
    title: 'O que dizem os clientes',
    items: [
      { name: 'Cliente 1', role: 'Cliente', quote: 'Atendimento excelente e dentro do combinado.' },
      { name: 'Cliente 2', role: 'Cliente', quote: 'Voltarei mais vezes.' },
    ],
  },
  hours: {
    title: 'Horarios',
    subtitle: 'Funcionamento da semana',
    days: [
      { label: 'Segunda a sexta', open: '09:00', close: '18:00' },
      { label: 'Sabado', open: '09:00', close: '13:00' },
      { label: 'Domingo', closed: true },
    ],
    note: 'Horarios de exemplo: ajuste conforme o estabelecimento.',
  },
  contact: {
    title: 'Fale com a gente',
    subtitle: 'Telefone, WhatsApp e endereco.',
    showMap: false,
  },
  cta: { title: 'Vamos comecar?', subtitle: 'Fale com a equipe pelo WhatsApp.', label: 'Chamar no WhatsApp' },
  faq: {
    title: 'Perguntas frequentes',
    items: [
      { question: 'Como agendar?', answer: 'Pelo WhatsApp ou telefone informado nesta pagina.' },
      { question: 'Onde fica?', answer: 'O endereco completo esta na secao de contato.' },
    ],
  },
  stats: {
    title: 'Numeros',
    items: [
      { value: '10+', label: 'anos de atendimento' },
      { value: '500+', label: 'clientes atendidos' },
      { value: '4.9', label: 'avaliacao media' },
    ],
  },
  steps: {
    title: 'Como funciona',
    subtitle: 'Do primeiro contato a entrega.',
    items: [
      { title: 'Contato', body: 'Voce fala com a equipe.' },
      { title: 'Combinamos', body: 'Escopo, prazo e valor.' },
      { title: 'Execucao', body: 'Acompanhamento do inicio ao fim.' },
    ],
  },
  brands: { title: 'Marcas e parceiros', items: [] },
  booking: { title: 'Agende seu horario', subtitle: 'Escolha o melhor dia e horario.', label: 'Solicitar agendamento' },
};

/**
 * Gera o config completo de um ponto de partida.
 * @param {string} segmentSlug
 * @param {string} name nome do template (virou identity.name)
 */
export function buildPresetConfig(segmentSlug, name = 'Novo modelo') {
  const preset = SEGMENT_PRESETS[segmentSlug];
  if (!preset) return null;

  const sections = preset.sections.map((type, index) => ({
    id: `sec-${index + 1}`,
    type,
    label: SECTION_COPY[type]?.title ?? type,
    enabled: true,
    variant: 'default',
    props: structuredClone(SECTION_COPY[type] ?? {}),
  }));

  return {
    schemaVersion: 1,
    identity: {
      name,
      tagline: preset.identity.tagline,
      description: '',
      logoImageId: null,
      logoText: name,
      showLogoText: true,
    },
    theme: structuredClone(preset.theme),
    navigation: sections.slice(0, 5).map((section) => ({ label: section.label, anchor: section.id })),
    sections,
    products: structuredClone(preset.products),
    contact: {
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      city: '',
      mapUrl: '',
      hours: [],
      noteHours: '',
    },
    links: [
      { label: 'Instagram', url: '' },
      { label: 'WhatsApp', url: '' },
    ],
    media: { coverImageId: null, thumbnailImageId: null },
    seo: structuredClone(preset.seo),
    footer: { text: '{{clientName}} — {{city}}', note: 'Todos os direitos reservados.' },
  };
}

/**
 * Preenche capa/miniatura/galeria/hero com as imagens ilustrativas do segmento
 * na biblioteca. Sem isso o template nasce sem nenhuma imagem e a previa fica
 * cinza.
 */
export function attachPreviewImages(config, images = []) {
  const pool = images.filter((image) => image && image.id);
  if (!pool.length) return config;

  const next = structuredClone(config);
  const cover = pool[0].id;
  const thumbnail = (pool[1] ?? pool[0]).id;
  next.media = { coverImageId: cover, thumbnailImageId: thumbnail };

  const galleryIds = pool.slice(0, 12).map((image) => image.id);
  let cursor = 0;
  const take = () => galleryIds[cursor++ % galleryIds.length];

  for (const section of next.sections) {
    if (section.type === 'hero' && !section.props.imageId) section.props.imageId = cover;
    if (section.type === 'about' && !section.props.imageId) section.props.imageId = take();
    if (section.type === 'gallery') section.props.imageIds = galleryIds.slice(0, 12);
    if (section.type === 'team') {
      section.props.members = (section.props.members ?? []).map((member) => ({
        ...member,
        imageId: member.imageId ?? take(),
      }));
    }
  }
  for (const item of next.products.items ?? []) {
    if (!item.imageId) item.imageId = take();
  }
  return next;
}
