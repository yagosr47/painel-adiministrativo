/**
 * Catalogo de segmentos e modelos de template.
 *
 * Cada template declara identidade propria (cores, tipografia, tom de voz),
 * secoes especificas do segmento, catalogo inicial de produtos/servicos e
 * categorias. O `config` gerado aqui e sempre clonado ao criar um site.
 *
 * Marcadores dinamicos aceitos no conteudo:
 *   {{clientName}} {{city}} {{phone}} {{whatsapp}} {{email}} {{address}}
 */

export const SEGMENTS = [
  {
    slug: 'restaurantes',
    name: 'Restaurantes e lanchonetes',
    icon: 'utensils',
    description: 'Pizzarias, hamburguerias, cafes, deliverys e lanchonetes.',
    categories: [
      { slug: 'pizzas', name: 'Pizzas' },
      { slug: 'hamburgueres', name: 'Hamburgueres' },
      { slug: 'bebidas', name: 'Bebidas' },
      { slug: 'pratos', name: 'Pratos' },
      { slug: 'ambientes', name: 'Ambientes' },
      { slug: 'sobremesas', name: 'Sobremesas' },
    ],
  },
  {
    slug: 'barbearias',
    name: 'Barbearias e saloes',
    icon: 'scissors',
    description: 'Barbearias, saloes de beleza, studios de estetica.',
    categories: [
      { slug: 'cortes', name: 'Cortes' },
      { slug: 'cadeiras', name: 'Cadeiras e estacoes' },
      { slug: 'ambientes', name: 'Ambientes' },
      { slug: 'ferramentas', name: 'Ferramentas' },
      { slug: 'produtos', name: 'Produtos' },
    ],
  },
  {
    slug: 'oficinas',
    name: 'Oficinas e servicos automotivos',
    icon: 'wrench',
    description: 'Oficinas mecanicas, autocenters, estetica automotiva.',
    categories: [
      { slug: 'veiculos', name: 'Veiculos' },
      { slug: 'servicos', name: 'Servicos' },
      { slug: 'pecas', name: 'Pecas' },
      { slug: 'ambientes', name: 'Ambientes' },
    ],
  },
  {
    slug: 'lojas',
    name: 'Lojas de roupas',
    icon: 'shirt',
    description: 'Boutiques, streetwear, moda feminina e masculina.',
    categories: [
      { slug: 'roupas', name: 'Roupas' },
      { slug: 'calcados', name: 'Calcados' },
      { slug: 'acessorios', name: 'Acessorios' },
      { slug: 'vitrines', name: 'Vitrines' },
    ],
  },
  {
    slug: 'mercados',
    name: 'Mercados e mercearias',
    icon: 'shopping-basket',
    description: 'Mercados de bairro, hortifrutis, empórios, conveniencia.',
    categories: [
      { slug: 'hortifruti', name: 'Hortifruti' },
      { slug: 'padaria', name: 'Padaria' },
      { slug: 'bebidas', name: 'Bebidas' },
      { slug: 'mercearia', name: 'Mercearia' },
      { slug: 'ambientes', name: 'Ambientes' },
    ],
  },
  {
    slug: 'clinicas',
    name: 'Clinicas e servicos profissionais',
    icon: 'stethoscope',
    description: 'Clinicas, consultorios, odontologia, advocacia, contabilidade.',
    categories: [
      { slug: 'consultorios', name: 'Consultorios' },
      { slug: 'equipe', name: 'Equipe' },
      { slug: 'procedimentos', name: 'Procedimentos' },
      { slug: 'ambientes', name: 'Ambientes' },
    ],
  },
  {
    slug: 'portfolio',
    name: 'Portfolios e paginas institucionais',
    icon: 'layout',
    description: 'Portfolios criativos, agencias, institucionais e landing pages.',
    categories: [
      { slug: 'projetos', name: 'Projetos' },
      { slug: 'equipe', name: 'Equipe' },
      { slug: 'escritorio', name: 'Escritorio' },
      { slug: 'processo', name: 'Processo' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Helpers de composicao                                              */
/* ------------------------------------------------------------------ */

const WEEKDAYS = [
  { label: 'Segunda', open: '09:00', close: '18:00' },
  { label: 'Terca', open: '09:00', close: '18:00' },
  { label: 'Quarta', open: '09:00', close: '18:00' },
  { label: 'Quinta', open: '09:00', close: '18:00' },
  { label: 'Sexta', open: '09:00', close: '19:00' },
  { label: 'Sabado', open: '09:00', close: '14:00' },
  { label: 'Domingo', open: '', close: '', closed: true },
];

function baseConfig({
  name,
  tagline,
  description,
  theme,
  sections,
  categories = [],
  items = [],
  hours = WEEKDAYS,
  links = [],
  footerText,
  nav = [],
}) {
  return {
    schemaVersion: 1,
    identity: {
      name,
      tagline,
      description,
      logoImageId: null,
      logoText: '{{clientName}}',
      showLogoText: true,
    },
    theme,
    navigation: nav.length
      ? nav
      : sections
          .filter((s) => s.enabled !== false)
          .slice(0, 5)
          .map((s) => ({ label: s.label, href: `#${s.id}` })),
    sections,
    products: { categories, items },
    contact: {
      phone: '{{phone}}',
      whatsapp: '{{whatsapp}}',
      email: '{{email}}',
      address: '{{address}}',
      city: '{{city}}',
      mapUrl: '',
      hours,
      noteHours: '',
    },
    links,
    seo: { title: '{{clientName}}', description, keywords: '' },
    footer: {
      text: footerText || '{{clientName}} - Todos os direitos reservados.',
      note: 'Modelo desenvolvido a partir de um template do painel. Conteudo e imagens de exemplo.',
    },
  };
}

const sec = (id, type, label, props, extra = {}) => ({ id, type, label, enabled: true, variant: 'default', props, ...extra });

/* ------------------------------------------------------------------ */
/* TEMPLATES                                                          */
/* ------------------------------------------------------------------ */

export const TEMPLATES = [
  /* ----------------------------- RESTAURANTES ----------------------------- */
  {
    slug: 'forno-italiano',
    name: 'Forno Italiano',
    segment_slug: 'restaurantes',
    category: 'Pizzaria',
    summary: 'Site de pizzaria artesanal com destaque para o forno, cardapio enxuto e pedidos por WhatsApp.',
    description:
      'Estrutura para pizzarias e trattorias: hero com foto do forno, historia da casa, destaques do cardapio, galeria de ambientes e bloco de pedido por WhatsApp. Tipografia serifada e paleta quente reproduzem o clima de cantina italiana.',
    accent: '#c2410c',
    cover: 'rest-pizzas-1',
    thumbnail: 'rest-ambientes-1',
    config: baseConfig({
      name: 'Forno Italiano - Modelo Pizzaria',
      tagline: 'Massa de fermentacao natural, assada em forno a lenha',
      description:
        'Modelo para pizzarias artesanais com secoes de destaque do cardapio, historia e pedidos por WhatsApp.',
      theme: {
        primary: '#7c2d12',
        secondary: '#431407',
        accent: '#f97316',
        background: '#fffbf5',
        surface: '#ffedd5',
        text: '#1c1917',
        muted: '#78716c',
        radius: 6,
        fontHeading: 'serif',
        fontBody: 'humanist',
        density: 'comfortable',
      },
      hours: [
        { label: 'Terca a quinta', open: '18:00', close: '23:00' },
        { label: 'Sexta e sabado', open: '18:00', close: '00:30' },
        { label: 'Domingo', open: '18:00', close: '22:30' },
        { label: 'Segunda', open: '', close: '', closed: true },
      ],
      sections: [
        sec('hero', 'hero', 'Inicio', {
          eyebrow: 'Pizzaria artesanal',
          title: '{{clientName}}: pizza de fermentacao natural',
          subtitle: 'Massa descansada por 48 horas, ingredientes da regiao e forno a lenha a 450 graus.',
          imageId: 'rest-pizzas-1',
          align: 'left',
          overlay: 55,
          primaryLabel: 'Pedir pelo WhatsApp',
          primaryHref: 'https://wa.me/{{whatsapp}}',
          secondaryLabel: 'Ver cardapio',
          secondaryHref: '#cardapio',
          badges: ['Forno a lenha', 'Massa 48h', 'Delivery proprio'],
        }),
        sec('historia', 'about', 'Nossa historia', {
          title: 'Uma receita de familia desde 1998',
          body:
            'Comecamos com um forno de tijolos no quintal e a receita de massa que atravessou tres geracoes.\n\nHoje o {{clientName}} mantem o mesmo cuidado: fermentacao lenta, tomate italiano e queijos de produtores locais.',
          imageId: 'rest-ambientes-1',
          highlights: ['Fermentacao de 48h', 'Ingredientes locais', 'Massa aberta na hora', 'Opcoes vegetarianas'],
          layout: 'image-right',
        }),
        sec('cardapio', 'menu-highlights', 'Destaques', {
          title: 'Do forno direto para a mesa',
          subtitle: 'Os favoritos da casa, prontos para pedir.',
          itemIds: ['pz-margherita', 'pz-calabresa', 'pz-burrata', 'dr-limao'],
          layout: 'feature',
        }),
        sec('catalogo', 'catalog', 'Cardapio completo', {
          title: 'Cardapio',
          subtitle: 'Todas as pizzas, entradas e bebidas.',
          mode: 'compact',
          showPrices: true,
          columns: 2,
          categoryFilter: true,
          ctaLabel: 'Adicionar ao pedido',
        }),
        sec('galeria', 'gallery', 'Ambiente', {
          title: 'O clima da casa',
          subtitle: 'Mesas de madeira, luz baixa e o forno sempre aceso.',
          imageIds: ['rest-ambientes-1', 'rest-ambientes-2', 'rest-pizzas-2', 'rest-pizzas-3'],
          columns: 2,
          layout: 'grid',
        }),
        sec('depoimentos', 'testimonials', 'Depoimentos', {
          title: 'Quem senta a mesa, volta',
          subtitle: 'Avaliacoes de clientes frequentes.',
          items: [
            { quote: 'A melhor massa da cidade, sem exagero. Pedimos toda sexta.', author: 'Marina Alves', detail: 'Cliente desde 2019', rating: 5 },
            { quote: 'Entrega rapida e a pizza chega quente. Atendimento nota dez.', author: 'Rodrigo Pinto', detail: 'Delivery', rating: 5 },
          ],
        }),
        sec('horarios', 'hours', 'Horarios', {
          title: 'Horarios de funcionamento',
          subtitle: 'Atendemos para jantar e delivery.',
          days: [
            { label: 'Terca a quinta', open: '18:00', close: '23:00' },
            { label: 'Sexta e sabado', open: '18:00', close: '00:30' },
            { label: 'Domingo', open: '18:00', close: '22:30' },
            { label: 'Segunda', open: '', close: '', closed: true },
          ],
          note: 'Cozinha fecha 30 minutos antes do encerramento.',
        }),
        sec('contato', 'contact', 'Contato', {
          title: 'Pedidos e reservas',
          subtitle: 'Fale com a gente pelo WhatsApp ou passe para jantar.',
          showMap: true,
          showForm: true,
          formCta: 'Enviar mensagem',
        }),
      ],
      categories: [
        { id: 'pizzas', name: 'Pizzas', description: 'Assadas em forno a lenha', order: 0 },
        { id: 'entradas', name: 'Entradas', description: '', order: 1 },
        { id: 'bebidas', name: 'Bebidas', description: '', order: 2 },
        { id: 'sobremesas', name: 'Sobremesas', description: '', order: 3 },
      ],
      items: [
        { id: 'pz-margherita', name: 'Margherita', description: 'Molho de tomate italiano, mussarela de bufala e manjericao.', price: 62, categoryId: 'pizzas', imageId: 'rest-pizzas-2', badge: 'Classica', featured: true, order: 0 },
        { id: 'pz-calabresa', name: 'Calabresa artesanal', description: 'Calabresa defumada, cebola roxa e azeitonas.', price: 68, categoryId: 'pizzas', imageId: 'rest-pizzas-1', featured: true, order: 1 },
        { id: 'pz-burrata', name: 'Burrata e pesto', description: 'Burrata fresca, pesto de basilico e tomate confit.', price: 84, categoryId: 'pizzas', imageId: 'rest-pizzas-3', badge: 'Novidade', featured: true, order: 2 },
        { id: 'pz-quatro', name: 'Quatro queijos', description: 'Mussarela, gorgonzola, parmesao e catupiry.', price: 72, categoryId: 'pizzas', imageId: 'rest-pizzas-2', order: 3 },
        { id: 'en-bruschetta', name: 'Bruschetta da casa', description: 'Pao de fermentacao natural, tomate e manjericao.', price: 28, categoryId: 'entradas', imageId: 'rest-pratos-1', order: 4 },
        { id: 'en-focaccia', name: 'Focaccia com romero', description: 'Assada na hora com azeite extra virgem.', price: 26, categoryId: 'entradas', imageId: 'rest-pratos-2', order: 5 },
        { id: 'dr-limao', name: 'Limonada siciliana', description: 'Limao siciliano, hortela e gelo.', price: 16, categoryId: 'bebidas', imageId: 'rest-bebidas-1', featured: true, order: 6 },
        { id: 'dr-vinho', name: 'Taca de vinho da casa', description: 'Tinto italiano selecionado semanalmente.', price: 24, categoryId: 'bebidas', imageId: 'rest-bebidas-2', order: 7 },
        { id: 'so-tiramisu', name: 'Tiramisu', description: 'Receita tradicional com mascarpone.', price: 26, categoryId: 'sobremesas', imageId: 'rest-sobremesas-1', order: 8 },
      ],
      links: [
        { label: 'WhatsApp', type: 'whatsapp', value: 'https://wa.me/{{whatsapp}}' },
        { label: 'Instagram', type: 'instagram', value: 'https://instagram.com/' },
        { label: 'iFood', type: 'delivery', value: 'https://www.ifood.com.br/' },
      ],
    }),
  },
  {
    slug: 'burger-street',
    name: 'Burger Street',
    segment_slug: 'restaurantes',
    category: 'Hamburgueria',
    summary: 'Hamburgueria urbana com hero de impacto, combos, galeria e pedido direto.',
    description:
      'Feito para hamburguerias artesanais e lanchonetes: visual escuro com amarelo de destaque, blocos de combos, estatisticas da casa, galeria de burgers e faixa de CTA para delivery.',
    accent: '#f59e0b',
    cover: 'rest-hamburgueres-1',
    thumbnail: 'rest-hamburgueres-2',
    config: baseConfig({
      name: 'Burger Street - Modelo Hamburgueria',
      tagline: 'Blend artesanal, pao brioche e batata rustica',
      description: 'Modelo para hamburguerias com combos, galeria e CTA de delivery.',
      theme: {
        primary: '#111827',
        secondary: '#1f2937',
        accent: '#f59e0b',
        background: '#0b0f17',
        surface: '#161c27',
        text: '#f8fafc',
        muted: '#94a3b8',
        radius: 18,
        fontHeading: 'condensed',
        fontBody: 'geometric',
        density: 'compact',
      },
      hours: [
        { label: 'Terca a quinta', open: '18:30', close: '23:30' },
        { label: 'Sexta e sabado', open: '18:30', close: '01:00' },
        { label: 'Domingo', open: '18:00', close: '23:00' },
        { label: 'Segunda', open: '', close: '', closed: true },
      ],
      sections: [
        sec('hero', 'hero', 'Inicio', {
          eyebrow: 'Hamburgueria artesanal',
          title: 'Blend 180g. Pao brioche. Atitude.',
          subtitle: 'Carne moida na hora, queijo derretido no ferro e batata rustica crocante.',
          imageId: 'rest-hamburgueres-1',
          align: 'center',
          overlay: 60,
          primaryLabel: 'Pedir agora',
          primaryHref: 'https://wa.me/{{whatsapp}}',
          secondaryLabel: 'Ver menu',
          secondaryHref: '#menu',
          badges: ['Blend 180g', 'Pao brioche', 'Delivery em 35min'],
        }),
        sec('numeros', 'stats', 'A casa', {
          title: 'Tradicao em numeros',
          items: [
            { value: '120k', label: 'Burgers servidos' },
            { value: '4.9', label: 'Nota media' },
            { value: '35min', label: 'Entrega media' },
            { value: '12', label: 'Combos no menu' },
          ],
        }),
        sec('menu', 'catalog', 'Menu', {
          title: 'Menu da casa',
          subtitle: 'Combos, burgers classicos e acompanhamentos.',
          mode: 'cards',
          showPrices: true,
          columns: 3,
          categoryFilter: true,
          ctaLabel: 'Pedir este',
        }),
        sec('sobre', 'about', 'Sobre', {
          title: 'Carne, pao e nada mais',
          body:
            'Escolhemos apenas tres fornecedores de carne e moemos tudo no dia. O pao chega quentinho da padaria ao lado, e a batata e cortada a mao.\n\nSem congelados, sem atalhos.',
          imageId: 'rest-hamburgueres-3',
          highlights: ['Moido na hora', 'Pao artesanal', 'Batata cortada a mao', 'Opcoes veganas'],
          layout: 'image-left',
        }),
        sec('galeria', 'gallery', 'Galeria', {
          title: 'Direto da chapa',
          subtitle: 'O que sai da cozinha.',
          imageIds: ['rest-hamburgueres-1', 'rest-hamburgueres-2', 'rest-hamburgueres-3', 'rest-ambientes-2', 'rest-bebidas-1', 'rest-pratos-3'],
          columns: 3,
          layout: 'masonry',
        }),
        sec('cta-delivery', 'cta', 'Delivery', {
          title: 'Delivery em ate 35 minutos',
          body: 'Peca pelo WhatsApp e acompanhe o preparo em tempo real.',
          label: 'Chamar no WhatsApp',
          href: 'https://wa.me/{{whatsapp}}',
          imageId: 'rest-ambientes-1',
        }),
        sec('depoimentos', 'testimonials', 'Depoimentos', {
          title: 'O que dizem por ai',
          subtitle: '',
          items: [
            { quote: 'O melhor smash da regiao. Ponto.', author: 'Lucas Ferreira', detail: 'Google Reviews', rating: 5 },
            { quote: 'Pao macio, carne suculenta e entrega rapida.', author: 'Aline Souza', detail: 'Pedido no delivery', rating: 5 },
          ],
        }),
        sec('contato', 'contact', 'Contato', {
          title: 'Onde estamos',
          subtitle: 'Retirada no balcao ou entrega no seu endereco.',
          showMap: true,
          showForm: false,
          formCta: 'Enviar',
        }),
      ],
      categories: [
        { id: 'burgers', name: 'Burgers', description: 'Blend artesanal 180g', order: 0 },
        { id: 'combos', name: 'Combos', description: 'Burger + batata + bebida', order: 1 },
        { id: 'acompanhamentos', name: 'Acompanhamentos', description: '', order: 2 },
        { id: 'bebidas', name: 'Bebidas', description: '', order: 3 },
      ],
      items: [
        { id: 'bg-classic', name: 'Street Classic', description: 'Blend 180g, cheddar, alface, tomate e molho da casa.', price: 32, categoryId: 'burgers', imageId: 'rest-hamburgueres-1', badge: 'Mais pedido', featured: true, order: 0 },
        { id: 'bg-bacon', name: 'Double Bacon', description: 'Dois blends, cheddar duplo e bacon crocante.', price: 46, categoryId: 'burgers', imageId: 'rest-hamburgueres-2', featured: true, order: 1 },
        { id: 'bg-veggie', name: 'Veggie Crunch', description: 'Hamburguer de grao-de-bico, queijo e cebola crispy.', price: 34, categoryId: 'burgers', imageId: 'rest-hamburgueres-3', order: 2 },
        { id: 'cb-classic', name: 'Combo Classic', description: 'Street Classic + batata rustica + refrigerante.', price: 44, categoryId: 'combos', imageId: 'rest-hamburgueres-1', badge: 'Combo', featured: true, order: 3 },
        { id: 'cb-double', name: 'Combo Double', description: 'Double Bacon + batata grande + bebida.', price: 58, categoryId: 'combos', imageId: 'rest-hamburgueres-2', order: 4 },
        { id: 'ac-fries', name: 'Batata rustica', description: 'Corte fino, pimentao e maionese defumada.', price: 18, categoryId: 'acompanhamentos', imageId: 'rest-pratos-2', order: 5 },
        { id: 'ac-onion', name: 'Onion rings', description: 'Cebola empanada com molho barbecue.', price: 22, categoryId: 'acompanhamentos', imageId: 'rest-pratos-3', order: 6 },
        { id: 'dr-craft', name: 'Cerveja artesanal', description: 'Rotulo convidado, sempre gelado.', price: 18, categoryId: 'bebidas', imageId: 'rest-bebidas-2', order: 7 },
        { id: 'dr-soda', name: 'Soda de frutas', description: 'Morango, limao e agua com gas.', price: 12, categoryId: 'bebidas', imageId: 'rest-bebidas-1', order: 8 },
      ],
      links: [
        { label: 'WhatsApp', type: 'whatsapp', value: 'https://wa.me/{{whatsapp}}' },
        { label: 'Instagram', type: 'instagram', value: 'https://instagram.com/' },
        { label: 'iFood', type: 'delivery', value: 'https://www.ifood.com.br/' },
      ],
    }),
  },

  /* ----------------------------- BARBEARIAS ----------------------------- */
  {
    slug: 'navalha-de-ouro',
    name: 'Navalha de Ouro',
    segment_slug: 'barbearias',
    category: 'Barbearia classica',
    summary: 'Barbearia tradicional com agendamento, tabela de servicos e apresentacao dos barbeiros.',
    description:
      'Visual masculino escuro com dourado e tipografia condensada. Inclui secao de servicos com preco, time de barbeiros, galeria de cortes, horarios e bloco de agendamento.',
    accent: '#b45309',
    cover: 'barb-cortes-1',
    thumbnail: 'barb-ambientes-1',
    config: baseConfig({
      name: 'Navalha de Ouro - Modelo Barbearia',
      tagline: 'Corte, barba e navalha de verdade',
      description: 'Modelo para barbearias classicas com agendamento e tabela de servicos.',
      theme: {
        primary: '#0f172a',
        secondary: '#1e293b',
        accent: '#c08a2e',
        background: '#0b1120',
        surface: '#151f31',
        text: '#f1f5f9',
        muted: '#94a3b8',
        radius: 4,
        fontHeading: 'condensed',
        fontBody: 'geometric',
        density: 'comfortable',
      },
      hours: [
        { label: 'Segunda a sexta', open: '09:00', close: '20:00' },
        { label: 'Sabado', open: '08:00', close: '18:00' },
        { label: 'Domingo', open: '', close: '', closed: true },
      ],
      sections: [
        sec('hero', 'hero', 'Inicio', {
          eyebrow: 'Barbearia desde 2012',
          title: 'Corte classico, acabamento moderno',
          subtitle: 'Cadeira, navalha, toalha quente e um cafe enquanto voce espera.',
          imageId: 'barb-cortes-1',
          align: 'left',
          overlay: 62,
          primaryLabel: 'Agendar horario',
          primaryHref: '#agendamento',
          secondaryLabel: 'Ver servicos',
          secondaryHref: '#servicos',
          badges: ['Agendamento online', 'Toalha quente', 'Cerveja gelada'],
        }),
        sec('servicos', 'catalog', 'Servicos', {
          title: 'Servicos e valores',
          subtitle: 'Todos os servicos incluem finalizacao e consultoria de estilo.',
          mode: 'compact',
          showPrices: true,
          columns: 2,
          categoryFilter: false,
          ctaLabel: 'Agendar',
        }),
        sec('sobre', 'about', 'A barbearia', {
          title: 'Onde o corte acontece no detalhe',
          body:
            'Nossos barbeiros passam por formacao continua e trabalham com navalha, tesoura e maquina apenas com tecnica.\n\nCada cliente tem ficha propria com preferencias salvas: maquina, altura, acabamento e produtos.',
          imageId: 'barb-ambientes-1',
          highlights: ['Ficha de preferencias', 'Produtos profissionais', 'Ambiente climatizado', 'Wi-Fi e cafe'],
          layout: 'image-right',
        }),
        sec('time', 'team', 'Time', {
          title: 'Quem cuida do seu corte',
          subtitle: 'Escolha o profissional na hora de agendar.',
          members: [
            { name: 'Bruno Tavares', role: 'Master barber', imageId: 'barb-equipe-1', bio: 'Especialista em fade e degradê na navalha.' },
            { name: 'Diego Ramos', role: 'Barbeiro senior', imageId: 'barb-equipe-2', bio: 'Cortes classicos e sociais.' },
            { name: 'Igor Mendes', role: 'Barbeiro', imageId: 'barb-equipe-3', bio: 'Barba desenhada e acabamento a quente.' },
          ],
        }),
        sec('galeria', 'gallery', 'Galeria', {
          title: 'Cortes da casa',
          subtitle: 'Trabalhos recentes dos nossos barbeiros.',
          imageIds: ['barb-cortes-1', 'barb-cortes-2', 'barb-cortes-3', 'barb-ferramentas-1', 'barb-ambientes-2'],
          columns: 3,
          layout: 'grid',
        }),
        sec('numeros', 'stats', 'Numeros', {
          title: 'Nossa rotina',
          items: [
            { value: '12', label: 'Anos de estrada' },
            { value: '6', label: 'Barbeiros' },
            { value: '40min', label: 'Corte medio' },
            { value: '4.9', label: 'Avaliacao' },
          ],
        }),
        sec('depoimentos', 'testimonials', 'Depoimentos', {
          title: 'Freguesia antiga',
          subtitle: '',
          items: [
            { quote: 'Chego ha 5 anos no mesmo barbeiro. Nunca saiu diferente do combinado.', author: 'Rafael Costa', detail: 'Cliente desde 2020', rating: 5 },
            { quote: 'Ambiente top, atendimento pontual e preco justo.', author: 'Thiago Nunes', detail: 'Google Reviews', rating: 5 },
          ],
        }),
        sec('agendamento', 'booking', 'Agendamento', {
          title: 'Reserve seu horario',
          body: 'Escolha o profissional, o servico e o horario. Confirmamos pelo WhatsApp em minutos.',
          label: 'Agendar pelo WhatsApp',
          href: 'https://wa.me/{{whatsapp}}',
          channels: ['WhatsApp', 'Telefone', 'Instagram'],
        }),
        sec('horarios', 'hours', 'Horarios', {
          title: 'Funcionamento',
          subtitle: '',
          days: [
            { label: 'Segunda a sexta', open: '09:00', close: '20:00' },
            { label: 'Sabado', open: '08:00', close: '18:00' },
            { label: 'Domingo', open: '', close: '', closed: true },
          ],
          note: 'Ultimo atendimento 30 minutos antes do fechamento.',
        }),
        sec('contato', 'contact', 'Contato', {
          title: 'Venha nos visitar',
          subtitle: 'Estamos no centro, com estacionamento na porta.',
          showMap: true,
          showForm: false,
          formCta: 'Enviar',
        }),
      ],
      categories: [
        { id: 'cortes', name: 'Cortes', description: '', order: 0 },
        { id: 'barba', name: 'Barba', description: '', order: 1 },
        { id: 'combos', name: 'Combos', description: '', order: 2 },
        { id: 'produtos', name: 'Produtos', description: 'Leve o cuidado para casa', order: 3 },
      ],
      items: [
        { id: 'sv-corte', name: 'Corte masculino', description: 'Maquina, tesoura e finalizacao com pomada.', price: 55, categoryId: 'cortes', imageId: 'barb-cortes-1', featured: true, order: 0 },
        { id: 'sv-corte-barba', name: 'Corte + barba', description: 'Combo completo com toalha quente.', price: 85, categoryId: 'combos', imageId: 'barb-cortes-2', badge: 'Popular', featured: true, order: 1 },
        { id: 'sv-barba', name: 'Barba na navalha', description: 'Desenho, toalha quente e balsamo.', price: 40, categoryId: 'barba', imageId: 'barb-cortes-3', order: 2 },
        { id: 'sv-pezinho', name: 'Pe de cabelo', description: 'Acabamento rapido entre cortes.', price: 20, categoryId: 'cortes', imageId: 'barb-ferramentas-1', order: 3 },
        { id: 'sv-pigmento', name: 'Pigmentacao', description: 'Preenchimento de falhas com pigmento.', price: 35, categoryId: 'barba', imageId: 'barb-cortes-2', order: 4 },
        { id: 'pr-pomada', name: 'Pomada modeladora', description: 'Fixacao forte, efeito matte, 120g.', price: 48, categoryId: 'produtos', imageId: 'barb-produtos-1', order: 5 },
        { id: 'pr-oleo', name: 'Oleo para barba', description: 'Hidratacao e crescimento, 30ml.', price: 39, categoryId: 'produtos', imageId: 'barb-produtos-2', order: 6 },
      ],
      links: [
        { label: 'WhatsApp', type: 'whatsapp', value: 'https://wa.me/{{whatsapp}}' },
        { label: 'Instagram', type: 'instagram', value: 'https://instagram.com/' },
        { label: 'Google Maps', type: 'maps', value: 'https://maps.google.com/' },
      ],
    }),
  },
  {
    slug: 'studio-lumiere',
    name: 'Studio Lumiere',
    segment_slug: 'barbearias',
    category: 'Salao de beleza',
    summary: 'Salao de beleza claro e delicado com servicos, time e pacotes de tratamento.',
    description:
      'Paleta clara, tipografia manuscrita nos titulos e layout arejado. Ideal para saloes, studios de estetica e manicures que precisam mostrar procedimentos, preco e profissionais.',
    accent: '#db2777',
    cover: 'barb-ambientes-2',
    thumbnail: 'barb-cortes-2',
    config: baseConfig({
      name: 'Studio Lumiere - Modelo Salao',
      tagline: 'Beleza com cuidado, no seu tempo',
      description: 'Modelo para saloes de beleza e estudios de estetica.',
      theme: {
        primary: '#831843',
        secondary: '#9d174d',
        accent: '#f9a8d4',
        background: '#fff7fb',
        surface: '#fce7f3',
        text: '#3f1229',
        muted: '#9d7188',
        radius: 24,
        fontHeading: 'script',
        fontBody: 'humanist',
        density: 'spacious',
      },
      hours: [
        { label: 'Segunda a sexta', open: '10:00', close: '19:00' },
        { label: 'Sabado', open: '09:00', close: '17:00' },
        { label: 'Domingo', open: '', close: '', closed: true },
      ],
      sections: [
        sec('hero', 'hero', 'Inicio', {
          eyebrow: 'Studio de beleza',
          title: 'Seu cabelo, nossa assinatura',
          subtitle: 'Coloracao, corte, tratamento e nail design com produtos profissionais.',
          imageId: 'barb-ambientes-2',
          align: 'center',
          overlay: 35,
          primaryLabel: 'Agendar',
          primaryHref: '#agendamento',
          secondaryLabel: 'Ver procedimentos',
          secondaryHref: '#servicos',
          badges: ['Profissionais certificadas', 'Produtos importados'],
        }),
        sec('servicos', 'catalog', 'Procedimentos', {
          title: 'Procedimentos',
          subtitle: 'Preco transparente e avaliacao antes de cada servico.',
          mode: 'cards',
          showPrices: true,
          columns: 3,
          categoryFilter: true,
          ctaLabel: 'Agendar',
        }),
        sec('sobre', 'about', 'O studio', {
          title: 'Um espaco para desacelerar',
          body:
            'O {{clientName}} nasceu da ideia de oferecer atendimento individual: um cliente por vez, com tempo para escutar e testar.\n\nUtilizamos linhas profissionais e trabalhamos somente com produtos com registro na ANVISA.',
          imageId: 'barb-ambientes-1',
          highlights: ['Atendimento individual', 'Produtos certificados', 'Ambiente reservado', 'Cafe e cha'],
          layout: 'image-left',
        }),
        sec('time', 'team', 'Equipe', {
          title: 'Nossas profissionais',
          subtitle: 'Cada uma com especialidade propria.',
          members: [
            { name: 'Camila Rocha', role: 'Colorista', imageId: 'barb-equipe-2', bio: 'Especialista em loiros e correcao de cor.' },
            { name: 'Juliana Prado', role: 'Cabeleireira', imageId: 'barb-equipe-1', bio: 'Cortes com tecnicas de visagismo.' },
            { name: 'Renata Lima', role: 'Nail designer', imageId: 'barb-equipe-3', bio: 'Alongamento em fibra e esmaltacao.' },
          ],
        }),
        sec('galeria', 'gallery', 'Resultados', {
          title: 'Antes e depois',
          subtitle: 'Transformacoes reais do studio.',
          imageIds: ['barb-cortes-1', 'barb-cortes-3', 'barb-ambientes-2', 'barb-produtos-1'],
          columns: 2,
          layout: 'grid',
        }),
        sec('depoimentos', 'testimonials', 'Depoimentos', {
          title: 'Quem passa por aqui',
          subtitle: '',
          items: [
            { quote: 'Saí com o loiro que eu queria ha anos. Sem danificar o cabelo.', author: 'Patricia Melo', detail: 'Coloracao', rating: 5 },
            { quote: 'Atendimento calmo, sem pressa. Virou meu ritual de sexta.', author: 'Bianca Reis', detail: 'Cliente mensal', rating: 5 },
          ],
        }),
        sec('faq', 'faq', 'Duvidas', {
          title: 'Perguntas frequentes',
          subtitle: '',
          items: [
            { question: 'Preciso agendar com antecedencia?', answer: 'Recomendamos 48 horas para coloracao e alongamento. Cortes costumam ter encaixe no mesmo dia.' },
            { question: 'Fazem teste de mecha?', answer: 'Sim. Toda coloracao passa por avaliacao e teste quando ha historico de quimica.' },
            { question: 'Aceitam cartao?', answer: 'Aceitamos credito, debito, Pix e parcelamento em ate 3x.' },
          ],
        }),
        sec('agendamento', 'booking', 'Agendamento', {
          title: 'Agende seu horario',
          body: 'Respondemos em ate 1 hora no horario comercial.',
          label: 'Agendar no WhatsApp',
          href: 'https://wa.me/{{whatsapp}}',
          channels: ['WhatsApp', 'Instagram', 'Telefone'],
        }),
        sec('contato', 'contact', 'Contato', {
          title: 'Como chegar',
          subtitle: '',
          showMap: true,
          showForm: true,
          formCta: 'Enviar mensagem',
        }),
      ],
      categories: [
        { id: 'cabelo', name: 'Cabelo', description: '', order: 0 },
        { id: 'coloracao', name: 'Coloracao', description: '', order: 1 },
        { id: 'unhas', name: 'Unhas', description: '', order: 2 },
        { id: 'estetica', name: 'Estetica', description: '', order: 3 },
      ],
      items: [
        { id: 'cb-corte', name: 'Corte feminino', description: 'Consultoria de visagismo, corte e escova.', price: 90, categoryId: 'cabelo', imageId: 'barb-cortes-1', featured: true, order: 0 },
        { id: 'cb-escova', name: 'Escova modelada', description: 'Lavagem, escova e finalizacao.', price: 65, categoryId: 'cabelo', imageId: 'barb-cortes-2', order: 1 },
        { id: 'cl-loiros', name: 'Iluminado / loiros', description: 'Tecnica de mechas com protecao de fibra.', price: 380, categoryId: 'coloracao', imageId: 'barb-cortes-3', badge: 'Destaque', featured: true, order: 2 },
        { id: 'cl-raiz', name: 'Retoque de raiz', description: 'Correcao de raiz com 2 cm.', price: 150, categoryId: 'coloracao', imageId: 'barb-produtos-1', order: 3 },
        { id: 'un-gel', name: 'Alongamento em gel', description: 'Aplicacao completa com fibra.', price: 190, categoryId: 'unhas', imageId: 'barb-produtos-2', order: 4 },
        { id: 'un-mao', name: 'Mao e pe', description: 'Cuticulagem, lixamento e esmalte comum.', price: 70, categoryId: 'unhas', imageId: 'barb-produtos-3', order: 5 },
        { id: 'es-limpeza', name: 'Limpeza de pele', description: 'Extracao, mascara calmante e hidratacao.', price: 160, categoryId: 'estetica', imageId: 'barb-ambientes-2', order: 6 },
      ],
      links: [
        { label: 'WhatsApp', type: 'whatsapp', value: 'https://wa.me/{{whatsapp}}' },
        { label: 'Instagram', type: 'instagram', value: 'https://instagram.com/' },
        { label: 'Facebook', type: 'facebook', value: 'https://facebook.com/' },
      ],
    }),
  },

  /* ----------------------------- OFICINAS ----------------------------- */
  {
    slug: 'torque-auto-center',
    name: 'Torque Auto Center',
    segment_slug: 'oficinas',
    category: 'Oficina mecanica',
    summary: 'Oficina com servicos tabelados, orcamento online e credibilidade tecnica.',
    description:
      'Template tecnico e direto: lista de servicos com prazo, marcas atendidas, processo de orcamento em etapas e depoimentos de frotas. Paleta azul industrial.',
    accent: '#1d4ed8',
    cover: 'ofic-veiculos-1',
    thumbnail: 'ofic-servicos-1',
    config: baseConfig({
      name: 'Torque Auto Center - Modelo Oficina',
      tagline: 'Diagnostico preciso, servico com garantia',
      description: 'Modelo para oficinas mecanicas com servicos e orcamento online.',
      theme: {
        primary: '#0f172a',
        secondary: '#1d4ed8',
        accent: '#f59e0b',
        background: '#f8fafc',
        surface: '#e2e8f0',
        text: '#0f172a',
        muted: '#64748b',
        radius: 10,
        fontHeading: 'geometric',
        fontBody: 'geometric',
        density: 'comfortable',
      },
      hours: [
        { label: 'Segunda a sexta', open: '08:00', close: '18:00' },
        { label: 'Sabado', open: '08:00', close: '12:00' },
        { label: 'Domingo', open: '', close: '', closed: true },
      ],
      sections: [
        sec('hero', 'hero', 'Inicio', {
          eyebrow: 'Oficina mecanica',
          title: 'Seu carro em maos de quem entende',
          subtitle: 'Diagnostico eletronico, mecanica geral e revisao com garantia de 90 dias.',
          imageId: 'ofic-veiculos-1',
          align: 'left',
          overlay: 55,
          primaryLabel: 'Solicitar orcamento',
          primaryHref: '#orcamento',
          secondaryLabel: 'Servicos',
          secondaryHref: '#servicos',
          badges: ['Garantia 90 dias', 'Diagnostico eletronico', 'Busca e entrega'],
        }),
        sec('servicos', 'catalog', 'Servicos', {
          title: 'Servicos com preco fechado',
          subtitle: 'Valores de referencia para veiculos de passeio. O orcamento final depende da avaliacao.',
          mode: 'compact',
          showPrices: true,
          columns: 2,
          categoryFilter: true,
          ctaLabel: 'Solicitar',
        }),
        sec('processo', 'steps', 'Como funciona', {
          title: 'Do orcamento a entrega',
          subtitle: 'Transparencia em cada etapa.',
          items: [
            { title: '1. Contato', body: 'Voce descreve o problema pelo WhatsApp ou formulario.' },
            { title: '2. Diagnostico', body: 'Avaliamos o veiculo e enviamos fotos das pecas.' },
            { title: '3. Orcamento', body: 'Voce aprova o valor e o prazo antes de qualquer servico.' },
            { title: '4. Execucao', body: 'Servico executado com pecas originais ou homologadas.' },
            { title: '5. Entrega', body: 'Teste final, laudo e garantia por escrito.' },
          ],
        }),
        sec('sobre', 'about', 'Estrutura', {
          title: 'Oficina preparada, diagnostico honesto',
          body:
            'Trabalhamos com elevadores, scanner automotivo e equipe certificada.\n\nNosso diferencial e simples: enviamos foto da peca trocada e devolvemos a peca antiga ao cliente.',
          imageId: 'ofic-ambientes-1',
          highlights: ['5 elevadores', 'Scanner multimarcas', 'Pecas com nota fiscal', 'Devolucao da peca antiga'],
          layout: 'image-right',
        }),
        sec('numeros', 'stats', 'Numeros', {
          title: 'Nossa estrutura',
          items: [
            { value: '18', label: 'Anos de oficina' },
            { value: '9', label: 'Mecanicos' },
            { value: '1.2k', label: 'Carros/mes' },
            { value: '90', label: 'Dias de garantia' },
          ],
        }),
        sec('marcas', 'brands', 'Marcas', {
          title: 'Marcas atendidas',
          items: [
            { name: 'Volkswagen', imageId: null },
            { name: 'Fiat', imageId: null },
            { name: 'Chevrolet', imageId: null },
            { name: 'Toyota', imageId: null },
            { name: 'Honda', imageId: null },
            { name: 'Hyundai', imageId: null },
          ],
        }),
        sec('galeria', 'gallery', 'Galeria', {
          title: 'Por dentro da oficina',
          subtitle: '',
          imageIds: ['ofic-veiculos-1', 'ofic-veiculos-2', 'ofic-pecas-1', 'ofic-ambientes-2'],
          columns: 2,
          layout: 'grid',
        }),
        sec('orcamento', 'cta', 'Orcamento', {
          title: 'Peca seu orcamento sem compromisso',
          body: 'Responda em menos de 1 minuto e receba o retorno de um mecanico.',
          label: 'Falar com a oficina',
          href: 'https://wa.me/{{whatsapp}}',
          imageId: 'ofic-servicos-1',
        }),
        sec('faq', 'faq', 'Duvidas', {
          title: 'Duvidas frequentes',
          subtitle: '',
          items: [
            { question: 'Vocês parcelam?', answer: 'Sim, em ate 6x sem juros nos principais cartoes e Pix com desconto.' },
            { question: 'Preciso agendar?', answer: 'Para revisao recomendamos agendar. Para emergencia atendemos por ordem de chegada.' },
            { question: 'Usam pecas originais?', answer: 'Trabalhamos com originais e homologadas. Voce escolhe antes de aprovar o orcamento.' },
          ],
        }),
        sec('contato', 'contact', 'Contato', {
          title: 'Onde fica a oficina',
          subtitle: 'Estacionamento no local e sala de espera com cafe.',
          showMap: true,
          showForm: true,
          formCta: 'Solicitar orcamento',
        }),
      ],
      categories: [
        { id: 'revisao', name: 'Revisao', description: '', order: 0 },
        { id: 'motor', name: 'Motor', description: '', order: 1 },
        { id: 'suspensao', name: 'Suspensao e freios', description: '', order: 2 },
        { id: 'eletrica', name: 'Eletrica', description: '', order: 3 },
        { id: 'estetica', name: 'Estetica automotiva', description: '', order: 4 },
      ],
      items: [
        { id: 'sv-revisao', name: 'Revisao completa', description: '40 itens verificados com laudo digital.', price: 280, categoryId: 'revisao', imageId: 'ofic-servicos-1', badge: 'Mais pedido', featured: true, order: 0 },
        { id: 'sv-oleo', name: 'Troca de oleo e filtros', description: 'Oleo sintetico, filtro de oleo, ar e combustivel.', price: 240, categoryId: 'revisao', imageId: 'ofic-pecas-1', featured: true, order: 1 },
        { id: 'sv-correia', name: 'Correia dentada', description: 'Kit completo com tensor e bomba.', price: 780, categoryId: 'motor', imageId: 'ofic-pecas-2', order: 2 },
        { id: 'sv-embreagem', name: 'Embreagem', description: 'Kit platô, disco e atuador.', price: 1350, categoryId: 'motor', imageId: 'ofic-pecas-3', order: 3 },
        { id: 'sv-freio', name: 'Pastilhas e discos', description: 'Troca no eixo dianteiro com sangria.', price: 420, categoryId: 'suspensao', imageId: 'ofic-servicos-2', order: 4 },
        { id: 'sv-alinhamento', name: 'Alinhamento e balanceamento', description: '3D com laudo impresso.', price: 160, categoryId: 'suspensao', imageId: 'ofic-veiculos-2', order: 5 },
        { id: 'sv-scanner', name: 'Diagnostico com scanner', description: 'Leitura de codigos e relatorio.', price: 120, categoryId: 'eletrica', imageId: 'ofic-veiculos-1', order: 6 },
        { id: 'sv-polimento', name: 'Polimento e vitrificacao', description: 'Correcao de pintura com protecao 12 meses.', price: 890, categoryId: 'estetica', imageId: 'ofic-veiculos-3', order: 7 },
      ],
      links: [
        { label: 'WhatsApp', type: 'whatsapp', value: 'https://wa.me/{{whatsapp}}' },
        { label: 'Instagram', type: 'instagram', value: 'https://instagram.com/' },
        { label: 'Google Maps', type: 'maps', value: 'https://maps.google.com/' },
      ],
    }),
  },

  /* ----------------------------- LOJAS ----------------------------- */
  {
    slug: 'vitrine-urbana',
    name: 'Vitrine Urbana',
    segment_slug: 'lojas',
    category: 'Moda / boutique',
    summary: 'Boutique com vitrine editorial, colecoes, provador e atendimento por WhatsApp.',
    description:
      'Layout editorial com imagens grandes, categorias de colecao, pecas em destaque e bloco de atendimento personalizado. Ideal para lojas de roupa, calcados e acessorios.',
    accent: '#db2777',
    cover: 'loja-vitrines-1',
    thumbnail: 'loja-roupas-1',
    config: baseConfig({
      name: 'Vitrine Urbana - Modelo Loja de Roupas',
      tagline: 'Pecas selecionadas, atendimento de boutique',
      description: 'Modelo para lojas de roupa com colecoes e atendimento por WhatsApp.',
      theme: {
        primary: '#18181b',
        secondary: '#3f3f46',
        accent: '#e11d48',
        background: '#ffffff',
        surface: '#f4f4f5',
        text: '#18181b',
        muted: '#71717a',
        radius: 2,
        fontHeading: 'serif',
        fontBody: 'geometric',
        density: 'spacious',
      },
      hours: [
        { label: 'Segunda a sexta', open: '10:00', close: '19:00' },
        { label: 'Sabado', open: '10:00', close: '16:00' },
        { label: 'Domingo', open: '', close: '', closed: true },
      ],
      sections: [
        sec('hero', 'hero', 'Inicio', {
          eyebrow: 'Nova colecao',
          title: 'Vestir bem e questao de escolha',
          subtitle: 'Curadoria de pecas atemporais, provador com atendimento e troca em 7 dias.',
          imageId: 'loja-vitrines-1',
          align: 'left',
          overlay: 30,
          primaryLabel: 'Ver colecao',
          primaryHref: '#colecao',
          secondaryLabel: 'Falar com a loja',
          secondaryHref: 'https://wa.me/{{whatsapp}}',
          badges: ['Troca em 7 dias', 'Provador com atendimento'],
        }),
        sec('colecao', 'catalog', 'Colecao', {
          title: 'Colecao atual',
          subtitle: 'Pecas disponiveis em loja e para reserva.',
          mode: 'gallery',
          showPrices: true,
          columns: 3,
          categoryFilter: true,
          ctaLabel: 'Reservar peca',
        }),
        sec('sobre', 'about', 'A loja', {
          title: 'Curadoria antes de tendencia',
          body:
            'A {{clientName}} seleciona colecoes pequenas, com poucas pecas por modelo, para que cada cliente encontre algo que nao vai ver em todo lugar.\n\nNosso atendimento conhece o estoque e ajuda no caimento.',
          imageId: 'loja-vitrines-2',
          highlights: ['Colecoes limitadas', 'Consultoria de estilo', 'Troca facil', 'Reserva por WhatsApp'],
          layout: 'image-left',
        }),
        sec('diferenciais', 'features', 'Diferenciais', {
          title: 'Por que comprar aqui',
          subtitle: '',
          items: [
            { icon: 'truck', title: 'Entrega local', body: 'Motoboy no mesmo dia para a cidade.' },
            { icon: 'refresh', title: 'Troca em 7 dias', body: 'Sem burocracia, com etiqueta.' },
            { icon: 'scissors', title: 'Ajuste de barra', body: 'Costura parceira com preco fixo.' },
            { icon: 'heart', title: 'Atendimento 1 a 1', body: 'Consultoria de estilo na loja.' },
          ],
        }),
        sec('vitrine', 'gallery', 'Vitrine', {
          title: 'Na vitrine esta semana',
          subtitle: '',
          imageIds: ['loja-vitrines-1', 'loja-vitrines-2', 'loja-roupas-1', 'loja-calcados-1'],
          columns: 2,
          layout: 'masonry',
        }),
        sec('depoimentos', 'testimonials', 'Depoimentos', {
          title: 'Quem veste',
          subtitle: '',
          items: [
            { quote: 'Comprei para uma festa e recebi elogio a noite toda.', author: 'Fernanda Dias', detail: 'Cliente', rating: 5 },
            { quote: 'Atendimento paciente, sem pressao de venda.', author: 'Marina Lopes', detail: 'Cliente', rating: 5 },
          ],
        }),
        sec('faq', 'faq', 'Duvidas', {
          title: 'Antes de comprar',
          subtitle: '',
          items: [
            { question: 'Como reservo uma peca?', answer: 'Mande o print da peca no WhatsApp. Reservamos por 24 horas.' },
            { question: 'Fazem entrega?', answer: 'Sim, motoboy no mesmo dia na cidade e envio por transportadora para outras regioes.' },
            { question: 'Posso trocar?', answer: 'Sim, em ate 7 dias com etiqueta e sem sinais de uso.' },
          ],
        }),
        sec('contato', 'contact', 'Contato', {
          title: 'Venha provar',
          subtitle: 'Estamos a duas quadras da praca central.',
          showMap: true,
          showForm: true,
          formCta: 'Enviar',
        }),
      ],
      categories: [
        { id: 'vestidos', name: 'Vestidos', description: '', order: 0 },
        { id: 'blusas', name: 'Blusas e camisetas', description: '', order: 1 },
        { id: 'calcas', name: 'Calcas e saias', description: '', order: 2 },
        { id: 'calcados', name: 'Calcados', description: '', order: 3 },
        { id: 'acessorios', name: 'Acessorios', description: '', order: 4 },
      ],
      items: [
        { id: 'vt-vestido', name: 'Vestido midi linho', description: 'Tecido natural, forro interno, disponivel em 3 cores.', price: 249, categoryId: 'vestidos', imageId: 'loja-roupas-1', badge: 'Novo', featured: true, order: 0 },
        { id: 'vt-camisa', name: 'Camisa oversize', description: 'Algodao penteado, caimento amplo.', price: 179, categoryId: 'blusas', imageId: 'loja-roupas-2', featured: true, order: 1 },
        { id: 'vt-calca', name: 'Calca wide leg', description: 'Cintura alta com alfaiataria leve.', price: 219, categoryId: 'calcas', imageId: 'loja-roupas-3', order: 2 },
        { id: 'vt-saia', name: 'Saia plissada', description: 'Comprimento midi, elastico na cintura.', price: 189, categoryId: 'calcas', imageId: 'loja-roupas-2', order: 3 },
        { id: 'vt-tenis', name: 'Tenis couro', description: 'Couro legitimo, solado macio.', price: 399, categoryId: 'calcados', imageId: 'loja-calcados-1', featured: true, order: 4 },
        { id: 'vt-sandalia', name: 'Sandalia salto bloco', description: 'Salto 6 cm, tira ajustavel.', price: 289, categoryId: 'calcados', imageId: 'loja-calcados-2', order: 5 },
        { id: 'vt-bolsa', name: 'Bolsa estruturada', description: 'Couro vegano, alca removivel.', price: 219, categoryId: 'acessorios', imageId: 'loja-acessorios-1', order: 6 },
        { id: 'vt-cinto', name: 'Cinto fino', description: 'Metal dourado, fivela regulavel.', price: 89, categoryId: 'acessorios', imageId: 'loja-acessorios-2', order: 7 },
      ],
      links: [
        { label: 'WhatsApp', type: 'whatsapp', value: 'https://wa.me/{{whatsapp}}' },
        { label: 'Instagram', type: 'instagram', value: 'https://instagram.com/' },
        { label: 'TikTok', type: 'tiktok', value: 'https://tiktok.com/' },
      ],
    }),
  },

  /* ----------------------------- MERCADOS ----------------------------- */
  {
    slug: 'mercado-do-bairro',
    name: 'Mercado do Bairro',
    segment_slug: 'mercados',
    category: 'Mercado de bairro',
    summary: 'Mercado com ofertas da semana, setores, hortifruti e entrega no bairro.',
    description:
      'Template funcional para mercados e mercearias: bloco de ofertas, setores da loja, horarios, area de entrega e informacoes de pagamento. Cores frescas e legibilidade alta.',
    accent: '#16a34a',
    cover: 'merc-hortifruti-1',
    thumbnail: 'merc-ambientes-1',
    config: baseConfig({
      name: 'Mercado do Bairro - Modelo Mercado',
      tagline: 'Frescor e preco justo todos os dias',
      description: 'Modelo para mercados de bairro com ofertas, setores e entrega local.',
      theme: {
        primary: '#14532d',
        secondary: '#166534',
        accent: '#f59e0b',
        background: '#f7fdf9',
        surface: '#dcfce7',
        text: '#052e16',
        muted: '#4b7a5e',
        radius: 8,
        fontHeading: 'geometric',
        fontBody: 'humanist',
        density: 'compact',
      },
      hours: [
        { label: 'Segunda a sabado', open: '07:00', close: '21:00' },
        { label: 'Domingo', open: '07:00', close: '13:00' },
      ],
      sections: [
        sec('hero', 'hero', 'Inicio', {
          eyebrow: 'Mercado de bairro',
          title: 'Ofertas frescas todos os dias',
          subtitle: 'Hortifruti, padaria propria e entrega gratis no bairro acima de R$ 80.',
          imageId: 'merc-hortifruti-1',
          align: 'left',
          overlay: 40,
          primaryLabel: 'Ver ofertas',
          primaryHref: '#ofertas',
          secondaryLabel: 'Pedir entrega',
          secondaryHref: 'https://wa.me/{{whatsapp}}',
          badges: ['Entrega no bairro', 'Padaria propria', 'Pagamento por Pix'],
        }),
        sec('ofertas', 'catalog', 'Ofertas', {
          title: 'Ofertas da semana',
          subtitle: 'Valores validos enquanto durarem os estoques.',
          mode: 'compact',
          showPrices: true,
          columns: 3,
          categoryFilter: true,
          ctaLabel: 'Adicionar a lista',
        }),
        sec('setores', 'features', 'Setores', {
          title: 'Setores da loja',
          subtitle: 'Tudo o que voce precisa em um so lugar.',
          items: [
            { icon: 'leaf', title: 'Hortifruti', body: 'Frutas, legumes e verduras recebidas diariamente.' },
            { icon: 'bread', title: 'Padaria', body: 'Pao frances de hora em hora e bolos caseiros.' },
            { icon: 'beef', title: 'Acougue', body: 'Cortes selecionados e embalados na hora.' },
            { icon: 'bottle', title: 'Bebidas', body: 'Cervejas geladas, vinhos e nao alcoolicos.' },
            { icon: 'basket', title: 'Mercearia', body: 'Marca propria e itens a granel.' },
            { icon: 'snow', title: 'Congelados', body: 'Sorvetes, pratos prontos e polpas.' },
          ],
        }),
        sec('sobre', 'about', 'Sobre o mercado', {
          title: 'Do bairro, para o bairro',
          body:
            'O {{clientName}} atende familias da regiao ha mais de 10 anos, com compra diaria de hortifruti e padaria propria.\n\nAceitamos Pix, cartao e vale alimentacao.',
          imageId: 'merc-ambientes-1',
          highlights: ['Compra diaria de hortifruti', 'Padaria propria', 'Vale alimentacao', 'Entrega no bairro'],
          layout: 'image-right',
        }),
        sec('horarios', 'hours', 'Horarios', {
          title: 'Horarios',
          subtitle: 'Feriados com horario reduzido.',
          days: [
            { label: 'Segunda a sabado', open: '07:00', close: '21:00' },
            { label: 'Domingo', open: '07:00', close: '13:00' },
          ],
          note: 'Entrega de segunda a sabado, das 9h as 19h.',
        }),
        sec('entrega', 'steps', 'Entrega', {
          title: 'Como funciona a entrega',
          subtitle: 'Pedido por WhatsApp, com separacao na loja.',
          items: [
            { title: '1. Envie a lista', body: 'Mande a lista por foto ou audio no WhatsApp.' },
            { title: '2. Confirmamos', body: 'Enviamos o valor e as opcoes de substituicao.' },
            { title: '3. Pagamento', body: 'Pix, cartao na entrega ou dinheiro.' },
            { title: '4. Receba em casa', body: 'Entrega em ate 2 horas dentro do bairro.' },
          ],
        }),
        sec('galeria', 'gallery', 'Galeria', {
          title: 'Dentro da loja',
          subtitle: '',
          imageIds: ['merc-hortifruti-1', 'merc-hortifruti-2', 'merc-padaria-1', 'merc-ambientes-2'],
          columns: 2,
          layout: 'grid',
        }),
        sec('contato', 'contact', 'Contato', {
          title: 'Fale com o mercado',
          subtitle: 'Estacionamento rapido na porta.',
          showMap: true,
          showForm: false,
          formCta: 'Enviar',
        }),
      ],
      categories: [
        { id: 'hortifruti', name: 'Hortifruti', description: 'Frescos do dia', order: 0 },
        { id: 'padaria', name: 'Padaria', description: '', order: 1 },
        { id: 'acougue', name: 'Acougue', description: '', order: 2 },
        { id: 'bebidas', name: 'Bebidas', description: '', order: 3 },
        { id: 'mercearia', name: 'Mercearia', description: '', order: 4 },
      ],
      items: [
        { id: 'mc-banana', name: 'Banana prata', description: 'Preco por kg.', price: 5.99, categoryId: 'hortifruti', imageId: 'merc-hortifruti-1', badge: 'Oferta', featured: true, order: 0 },
        { id: 'mc-tomate', name: 'Tomate italiano', description: 'Preco por kg.', price: 7.49, categoryId: 'hortifruti', imageId: 'merc-hortifruti-2', featured: true, order: 1 },
        { id: 'mc-pao', name: 'Pao frances', description: 'Preco por kg, assado de hora em hora.', price: 14.9, categoryId: 'padaria', imageId: 'merc-padaria-1', order: 2 },
        { id: 'mc-bolo', name: 'Bolo de cenoura', description: 'Unidade, com cobertura de chocolate.', price: 18.9, categoryId: 'padaria', imageId: 'merc-padaria-1', order: 3 },
        { id: 'mc-picanha', name: 'Picanha bovina', description: 'Preco por kg, corte embalado na hora.', price: 79.9, categoryId: 'acougue', imageId: 'merc-mercearia-1', order: 4 },
        { id: 'mc-cerveja', name: 'Cerveja long neck', description: 'Pack com 6 unidades, gelada.', price: 32.9, categoryId: 'bebidas', imageId: 'merc-bebidas-1', order: 5 },
        { id: 'mc-arroz', name: 'Arroz tipo 1', description: 'Pacote 5 kg, marca propria.', price: 26.9, categoryId: 'mercearia', imageId: 'merc-mercearia-1', order: 6 },
        { id: 'mc-cafe', name: 'Cafe torrado', description: 'Pacote 500 g, torra media.', price: 19.9, categoryId: 'mercearia', imageId: 'merc-mercearia-2', order: 7 },
      ],
      links: [
        { label: 'WhatsApp', type: 'whatsapp', value: 'https://wa.me/{{whatsapp}}' },
        { label: 'Instagram', type: 'instagram', value: 'https://instagram.com/' },
      ],
    }),
  },

  /* ----------------------------- CLINICAS ----------------------------- */
  {
    slug: 'clinica-vitalis',
    name: 'Clinica Vitalis',
    segment_slug: 'clinicas',
    category: 'Clinica / saude',
    summary: 'Clinica com especialidades, equipe, convenios e agendamento de consulta.',
    description:
      'Visual limpo e confiavel: especialidades, corpo clinico, convenios atendidos, perguntas frequentes e agendamento. Tipografia legivel e paleta azul-petroleo.',
    accent: '#0ea5e9',
    cover: 'clin-consultorios-1',
    thumbnail: 'clin-equipe-1',
    config: baseConfig({
      name: 'Clinica Vitalis - Modelo Clinica',
      tagline: 'Atendimento humano e cuidado baseado em evidencia',
      description: 'Modelo para clinicas com especialidades, equipe e agendamento.',
      theme: {
        primary: '#0c4a6e',
        secondary: '#0e7490',
        accent: '#38bdf8',
        background: '#f8fafc',
        surface: '#e0f2fe',
        text: '#0f172a',
        muted: '#55708a',
        radius: 14,
        fontHeading: 'humanist',
        fontBody: 'humanist',
        density: 'comfortable',
      },
      hours: [
        { label: 'Segunda a sexta', open: '07:00', close: '19:00' },
        { label: 'Sabado', open: '08:00', close: '12:00' },
        { label: 'Domingo', open: '', close: '', closed: true },
      ],
      sections: [
        sec('hero', 'hero', 'Inicio', {
          eyebrow: 'Clinica multidisciplinar',
          title: 'Cuidado que comeca pela escuta',
          subtitle: 'Consultas com tempo, equipe especializada e acompanhamento continuo.',
          imageId: 'clin-consultorios-1',
          align: 'left',
          overlay: 35,
          primaryLabel: 'Agendar consulta',
          primaryHref: '#agendamento',
          secondaryLabel: 'Especialidades',
          secondaryHref: '#especialidades',
          badges: ['Convenios atendidos', 'Agendamento online', 'Estacionamento'],
        }),
        sec('especialidades', 'catalog', 'Especialidades', {
          title: 'Especialidades',
          subtitle: 'Consultas presenciais e telemedicina.',
          mode: 'cards',
          showPrices: true,
          columns: 3,
          categoryFilter: true,
          ctaLabel: 'Agendar',
        }),
        sec('sobre', 'about', 'A clinica', {
          title: 'Estrutura pensada para o paciente',
          body:
            'Consultorios individuais, sala de procedimentos e recepcao acessivel.\n\nA {{clientName}} trabalha com prontuario eletronico e retorno incluso em consultas de acompanhamento.',
          imageId: 'clin-ambientes-1',
          highlights: ['Prontuario eletronico', 'Acessibilidade', 'Retorno incluso', 'Telemedicina'],
          layout: 'image-right',
        }),
        sec('equipe', 'team', 'Equipe', {
          title: 'Corpo clinico',
          subtitle: 'Profissionais com registro ativo no conselho.',
          members: [
            { name: 'Dra. Helena Braga', role: 'Clinica medica - CRM 00000', imageId: 'clin-equipe-1', bio: 'Residencia em clinica medica, 12 anos de experiencia.' },
            { name: 'Dr. Paulo Sena', role: 'Ortopedia - CRM 00000', imageId: 'clin-equipe-2', bio: 'Especialista em coluna e reabilitacao.' },
            { name: 'Dra. Clara Vieira', role: 'Nutricao - CRN 00000', imageId: 'clin-equipe-3', bio: 'Foco em emagrecimento saudavel e doencas metabolicas.' },
          ],
        }),
        sec('convenios', 'brands', 'Convenios', {
          title: 'Convenios atendidos',
          items: [
            { name: 'Amil' },
            { name: 'Bradesco Saude' },
            { name: 'SulAmerica' },
            { name: 'Unimed' },
            { name: 'Particular' },
          ],
        }),
        sec('numeros', 'stats', 'Numeros', {
          title: 'Nossa operacao',
          items: [
            { value: '15', label: 'Anos de atuacao' },
            { value: '12', label: 'Especialidades' },
            { value: '30k', label: 'Consultas realizadas' },
            { value: '4.8', label: 'Avaliacao media' },
          ],
        }),
        sec('faq', 'faq', 'Duvidas', {
          title: 'Perguntas frequentes',
          subtitle: '',
          items: [
            { question: 'Como agendar?', answer: 'Pelo WhatsApp, telefone ou formulario do site. Confirmamos em ate 2 horas uteis.' },
            { question: 'Atendem convenio?', answer: 'Sim, consulte a lista de convenios e a disponibilidade por especialidade.' },
            { question: 'Fazem teleconsulta?', answer: 'Sim, para especialidades indicadas. A plataforma e enviada apos a confirmacao.' },
          ],
        }),
        sec('agendamento', 'booking', 'Agendamento', {
          title: 'Agende sua consulta',
          body: 'Informe a especialidade desejada e sua disponibilidade.',
          label: 'Agendar pelo WhatsApp',
          href: 'https://wa.me/{{whatsapp}}',
          channels: ['WhatsApp', 'Telefone', 'Formulario'],
        }),
        sec('contato', 'contact', 'Contato', {
          title: 'Como chegar',
          subtitle: 'Proximo ao centro, com estacionamento no local.',
          showMap: true,
          showForm: true,
          formCta: 'Enviar mensagem',
        }),
      ],
      categories: [
        { id: 'consultas', name: 'Consultas', description: '', order: 0 },
        { id: 'exames', name: 'Exames', description: '', order: 1 },
        { id: 'procedimentos', name: 'Procedimentos', description: '', order: 2 },
      ],
      items: [
        { id: 'cl-consulta', name: 'Consulta clinica', description: '50 minutos, com retorno em 30 dias incluso.', price: 320, categoryId: 'consultas', imageId: 'clin-consultorios-1', featured: true, order: 0 },
        { id: 'cl-ortopedia', name: 'Consulta ortopedica', description: 'Avaliacao completa com plano de reabilitacao.', price: 380, categoryId: 'consultas', imageId: 'clin-equipe-2', featured: true, order: 1 },
        { id: 'cl-nutri', name: 'Consulta nutricional', description: 'Avaliacao corporal e plano alimentar.', price: 260, categoryId: 'consultas', imageId: 'clin-equipe-3', order: 2 },
        { id: 'ex-sangue', name: 'Coleta de exames', description: 'Coleta em laboratorio parceiro, laudo em 48h.', price: 90, categoryId: 'exames', imageId: 'clin-consultorios-2', order: 3 },
        { id: 'ex-eco', name: 'Ecocardiograma', description: 'Exame de imagem com laudo do cardiologista.', price: 450, categoryId: 'exames', imageId: 'clin-consultorios-3', order: 4 },
        { id: 'pr-curativo', name: 'Curativo e procedimentos', description: 'Curativos simples e complexos.', price: 120, categoryId: 'procedimentos', imageId: 'clin-ambientes-2', order: 5 },
        { id: 'pr-inj', name: 'Aplicacao de injetaveis', description: 'Com prescricao medica.', price: 60, categoryId: 'procedimentos', imageId: 'clin-ambientes-1', order: 6 },
      ],
      links: [
        { label: 'WhatsApp', type: 'whatsapp', value: 'https://wa.me/{{whatsapp}}' },
        { label: 'Telefone', type: 'phone', value: 'tel:{{phone}}' },
        { label: 'Google Maps', type: 'maps', value: 'https://maps.google.com/' },
      ],
    }),
  },
  {
    slug: 'escritorio-vertice',
    name: 'Escritorio Vertice',
    segment_slug: 'clinicas',
    category: 'Servicos profissionais',
    summary: 'Escritorio de advocacia ou contabilidade com areas de atuacao e formulario de contato.',
    description:
      'Layout sobrio e institucional para escritorios profissionais: areas de atuacao, equipe, processo de atendimento, artigos e formulario de contato qualificado.',
    accent: '#334155',
    cover: 'clin-escritorio-1',
    thumbnail: 'clin-equipe-2',
    config: baseConfig({
      name: 'Escritorio Vertice - Modelo Servicos Profissionais',
      tagline: 'Assessoria tecnica com atendimento proximo',
      description: 'Modelo para escritorios de advocacia, contabilidade e consultoria.',
      theme: {
        primary: '#1e293b',
        secondary: '#334155',
        accent: '#b08d57',
        background: '#ffffff',
        surface: '#f1f5f9',
        text: '#0f172a',
        muted: '#64748b',
        radius: 4,
        fontHeading: 'serif',
        fontBody: 'humanist',
        density: 'comfortable',
      },
      hours: [
        { label: 'Segunda a sexta', open: '09:00', close: '18:00' },
        { label: 'Sabado', open: '', close: '', closed: true },
        { label: 'Domingo', open: '', close: '', closed: true },
      ],
      sections: [
        sec('hero', 'hero', 'Inicio', {
          eyebrow: 'Assessoria juridica e contabil',
          title: 'Seguranca para decidir',
          subtitle: 'Atendimento consultivo para pessoas fisicas e empresas, com linguagem clara.',
          imageId: 'clin-escritorio-1',
          align: 'left',
          overlay: 50,
          primaryLabel: 'Falar com especialista',
          primaryHref: '#contato',
          secondaryLabel: 'Areas de atuacao',
          secondaryHref: '#areas',
          badges: ['Primeira consulta gratuita', 'Atendimento online'],
        }),
        sec('areas', 'catalog', 'Areas de atuacao', {
          title: 'Areas de atuacao',
          subtitle: 'Solucoes para pessoa fisica e empresas.',
          mode: 'cards',
          showPrices: false,
          columns: 3,
          categoryFilter: true,
          ctaLabel: 'Saiba mais',
        }),
        sec('processo', 'steps', 'Metodo', {
          title: 'Como trabalhamos',
          subtitle: 'Um metodo claro, do primeiro contato ao encerramento.',
          items: [
            { title: 'Diagnostico', body: 'Reuniao inicial para entender o caso e o contexto.' },
            { title: 'Estrategia', body: 'Proposta com cenarios, prazos e honorarios definidos.' },
            { title: 'Execucao', body: 'Acompanhamento com relatorios periodicos.' },
            { title: 'Encerramento', body: 'Entrega com documentacao organizada.' },
          ],
        }),
        sec('sobre', 'about', 'O escritorio', {
          title: 'Tecnica com transparencia',
          body:
            'Atuamos com foco em prevencao de conflitos e planejamento.\n\nNossos honorarios sao apresentados por escrito antes de qualquer trabalho comecar.',
          imageId: 'clin-escritorio-2',
          highlights: ['Honorarios por escrito', 'Relatorios periodicos', 'Atendimento online', 'Sigilo profissional'],
          layout: 'image-left',
        }),
        sec('equipe', 'team', 'Sociedade', {
          title: 'Nossos socios',
          subtitle: '',
          members: [
            { name: 'Ana Beatriz Ferraz', role: 'Socia - Direito empresarial', imageId: 'clin-equipe-2' },
            { name: 'Marcos Vinicius Lemos', role: 'Socio - Contencioso', imageId: 'clin-equipe-1' },
            { name: 'Sofia Andrade', role: 'Contadora responsavel', imageId: 'clin-equipe-3' },
          ],
        }),
        sec('depoimentos', 'testimonials', 'Depoimentos', {
          title: 'Clientes',
          subtitle: '',
          items: [
            { quote: 'Explicaram cada etapa e cumpriram o prazo combinado.', author: 'Construtora Aravel', detail: 'Cliente empresarial', rating: 5 },
            { quote: 'Atendimento rapido e documentacao impecavel.', author: 'Rita Campos', detail: 'Cliente pessoa fisica', rating: 5 },
          ],
        }),
        sec('faq', 'faq', 'Duvidas', {
          title: 'Perguntas frequentes',
          subtitle: '',
          items: [
            { question: 'A primeira consulta e gratuita?', answer: 'Sim, a conversa inicial de 30 minutos e sem custo.' },
            { question: 'Atendem fora da cidade?', answer: 'Sim, por videoconferencia e com protocolo digital.' },
            { question: 'Como sao definidos os honorarios?', answer: 'Por escopo ou por exito, sempre apresentado por escrito.' },
          ],
        }),
        sec('contato', 'contact', 'Contato', {
          title: 'Fale com o escritorio',
          subtitle: 'Respondemos em ate 1 dia util.',
          showMap: true,
          showForm: true,
          formCta: 'Solicitar contato',
        }),
      ],
      categories: [
        { id: 'empresarial', name: 'Empresarial', description: '', order: 0 },
        { id: 'trabalhista', name: 'Trabalhista', description: '', order: 1 },
        { id: 'tributario', name: 'Tributario', description: '', order: 2 },
        { id: 'contabil', name: 'Contabil', description: '', order: 3 },
      ],
      items: [
        { id: 'ar-contratos', name: 'Contratos e negociacoes', description: 'Elaboracao e revisao de contratos empresariais.', price: null, priceNote: 'Sob consulta', categoryId: 'empresarial', imageId: 'clin-escritorio-1', featured: true, order: 0 },
        { id: 'ar-constituicao', name: 'Constituicao de empresa', description: 'Abertura, alteracoes e encerramento.', price: null, priceNote: 'Sob consulta', categoryId: 'empresarial', imageId: 'clin-escritorio-2', order: 1 },
        { id: 'ar-trabalhista', name: 'Consultoria trabalhista', description: 'Adequacao de rotinas e folha.', price: null, priceNote: 'Sob consulta', categoryId: 'trabalhista', imageId: 'clin-equipe-2', order: 2 },
        { id: 'ar-tributario', name: 'Planejamento tributario', description: 'Analise de regime e reducao de carga.', price: null, priceNote: 'Sob consulta', categoryId: 'tributario', imageId: 'clin-escritorio-1', featured: true, order: 3 },
        { id: 'ar-contabil', name: 'Contabilidade mensal', description: 'Escrituracao, folha e obrigacoes acessorias.', price: null, priceNote: 'Sob consulta', categoryId: 'contabil', imageId: 'clin-escritorio-2', order: 4 },
      ],
      links: [
        { label: 'WhatsApp', type: 'whatsapp', value: 'https://wa.me/{{whatsapp}}' },
        { label: 'LinkedIn', type: 'linkedin', value: 'https://linkedin.com/' },
        { label: 'E-mail', type: 'email', value: 'mailto:{{email}}' },
      ],
    }),
  },

  /* ----------------------------- PORTFOLIO ----------------------------- */
  {
    slug: 'ateliere-portfolio',
    name: 'Ateliere Portfolio',
    segment_slug: 'portfolio',
    category: 'Portfolio criativo',
    summary: 'Portfolio visual para estudios e freelancers, com projetos em grade e bio.',
    description:
      'Grade editorial de projetos, bio enxuta, servicos e contato direto. Fundo claro, tipografia grande e foco total em imagem.',
    accent: '#6366f1',
    cover: 'port-projetos-1',
    thumbnail: 'port-projetos-2',
    config: baseConfig({
      name: 'Ateliere Portfolio - Modelo Portfolio',
      tagline: 'Design que resolve',
      description: 'Modelo para portfolios criativos e estudios de design.',
      theme: {
        primary: '#111827',
        secondary: '#312e81',
        accent: '#6366f1',
        background: '#ffffff',
        surface: '#eef2ff',
        text: '#111827',
        muted: '#6b7280',
        radius: 0,
        fontHeading: 'geometric',
        fontBody: 'geometric',
        density: 'spacious',
      },
      hours: [
        { label: 'Segunda a sexta', open: '09:00', close: '18:00' },
        { label: 'Sabado', open: '', close: '', closed: true },
        { label: 'Domingo', open: '', close: '', closed: true },
      ],
      sections: [
        sec('hero', 'hero', 'Inicio', {
          eyebrow: 'Estudio de design',
          title: 'Marcas que se explicam sozinhas',
          subtitle: 'Identidade visual, sites e embalagem para negocios que estao comecando ou se reinventando.',
          imageId: 'port-projetos-1',
          align: 'left',
          overlay: 25,
          primaryLabel: 'Ver projetos',
          primaryHref: '#projetos',
          secondaryLabel: 'Falar com o estudio',
          secondaryHref: '#contato',
          badges: ['Desde 2016', 'Projetos no Brasil e exterior'],
        }),
        sec('projetos', 'catalog', 'Projetos', {
          title: 'Projetos selecionados',
          subtitle: 'Uma amostra do que fazemos.',
          mode: 'gallery',
          showPrices: false,
          columns: 2,
          categoryFilter: true,
          ctaLabel: 'Ver estudo de caso',
        }),
        sec('sobre', 'about', 'Sobre', {
          title: 'Um estudio pequeno e proximo',
          body:
            'Trabalhamos com poucos projetos por vez para acompanhar de perto.\n\nCada entrega inclui manual de marca, arquivos abertos e sessao de apresentacao.',
          imageId: 'port-escritorio-1',
          highlights: ['Poucos projetos por vez', 'Arquivos abertos', 'Manual de marca', 'Apresentacao ao vivo'],
          layout: 'image-right',
        }),
        sec('servicos', 'features', 'Servicos', {
          title: 'O que entregamos',
          subtitle: '',
          items: [
            { icon: 'pen', title: 'Identidade visual', body: 'Logo, paleta, tipografia e manual de uso.' },
            { icon: 'layout', title: 'Sites e landing pages', body: 'Design e desenvolvimento responsivo.' },
            { icon: 'box', title: 'Embalagem', body: 'Rotulo, caixa e mockups.' },
            { icon: 'camera', title: 'Direcao de arte', body: 'Ensaio fotografico e direcao criativa.' },
          ],
        }),
        sec('processo', 'steps', 'Processo', {
          title: 'Como um projeto acontece',
          subtitle: '',
          items: [
            { title: 'Briefing', body: 'Conversa de 1h para entender contexto e objetivo.' },
            { title: 'Pesquisa', body: 'Referencias, concorrencia e definicao de territorio visual.' },
            { title: 'Criacao', body: 'Duas rotas criativas apresentadas com aplicacoes.' },
            { title: 'Entrega', body: 'Refinamento, arquivos finais e manual.' },
          ],
        }),
        sec('equipe', 'team', 'Quem faz', {
          title: 'Quem faz',
          subtitle: '',
          members: [
            { name: 'Lia Monteiro', role: 'Diretora de arte', imageId: 'port-equipe-2' },
            { name: 'Caio Ferraz', role: 'Designer e front-end', imageId: 'port-equipe-1' },
          ],
        }),
        sec('depoimentos', 'testimonials', 'Depoimentos', {
          title: 'O que dizem',
          subtitle: '',
          items: [
            { quote: 'O estudio entendeu o negocio antes de falar de estetica.', author: 'Cafeteria Grão', detail: 'Projeto de identidade', rating: 5 },
            { quote: 'Entrega no prazo e materiais completos para a equipe.', author: 'Studio Aurora', detail: 'Site institucional', rating: 5 },
          ],
        }),
        sec('contato', 'contact', 'Contato', {
          title: 'Vamos conversar',
          subtitle: 'Conte sobre o projeto e retornamos em ate 2 dias uteis.',
          showMap: false,
          showForm: true,
          formCta: 'Enviar briefing',
        }),
      ],
      categories: [
        { id: 'identidade', name: 'Identidade visual', description: '', order: 0 },
        { id: 'sites', name: 'Sites', description: '', order: 1 },
        { id: 'embalagem', name: 'Embalagem', description: '', order: 2 },
        { id: 'fotografia', name: 'Fotografia', description: '', order: 3 },
      ],
      items: [
        { id: 'pj-cafe', name: 'Cafeteria Grão', description: 'Identidade visual, embalagem e sinalizacao.', price: null, categoryId: 'identidade', imageId: 'port-projetos-1', featured: true, order: 0 },
        { id: 'pj-studio', name: 'Studio Aurora', description: 'Site institucional e fotografia de produto.', price: null, categoryId: 'sites', imageId: 'port-projetos-2', featured: true, order: 1 },
        { id: 'pj-verde', name: 'Horta Verde', description: 'Embalagem para linha de temperos organicos.', price: null, categoryId: 'embalagem', imageId: 'port-projetos-3', order: 2 },
        { id: 'pj-moda', name: 'Marcia Lima', description: 'Ensaio editorial para colecao de verao.', price: null, categoryId: 'fotografia', imageId: 'port-projetos-4', featured: true, order: 3 },
        { id: 'pj-barbearia', name: 'Navalha de Ouro', description: 'Identidade e site para barbearia.', price: null, categoryId: 'identidade', imageId: 'port-projetos-1', order: 4 },
      ],
      links: [
        { label: 'Instagram', type: 'instagram', value: 'https://instagram.com/' },
        { label: 'Behance', type: 'portfolio', value: 'https://behance.net/' },
        { label: 'E-mail', type: 'email', value: 'mailto:{{email}}' },
      ],
    }),
  },
  {
    slug: 'instituto-horizonte',
    name: 'Instituto Horizonte',
    segment_slug: 'portfolio',
    category: 'Institucional',
    summary: 'Pagina institucional para ONGs, escolas e associacoes, com causa, impacto e transparencia.',
    description:
      'Estrutura institucional com missao, projetos sociais, numeros de impacto, equipe, transparencia e canais de doacao. Tom acolhedor e acessivel.',
    accent: '#0d9488',
    cover: 'port-escritorio-2',
    thumbnail: 'port-projetos-3',
    config: baseConfig({
      name: 'Instituto Horizonte - Modelo Institucional',
      tagline: 'Educacao que transforma o bairro',
      description: 'Modelo institucional para ONGs, escolas e associacoes.',
      theme: {
        primary: '#134e4a',
        secondary: '#0f766e',
        accent: '#f59e0b',
        background: '#fbfdfc',
        surface: '#ccfbf1',
        text: '#0f2b28',
        muted: '#5a7f7b',
        radius: 16,
        fontHeading: 'humanist',
        fontBody: 'humanist',
        density: 'comfortable',
      },
      hours: [
        { label: 'Segunda a sexta', open: '08:00', close: '17:00' },
        { label: 'Sabado', open: '', close: '', closed: true },
        { label: 'Domingo', open: '', close: '', closed: true },
      ],
      sections: [
        sec('hero', 'hero', 'Inicio', {
          eyebrow: 'Organizacao social',
          title: 'Toda crianca merece aprender perto de casa',
          subtitle: 'Atendemos 320 criancas e adolescentes com reforco escolar, esporte e oficinas culturais.',
          imageId: 'port-projetos-3',
          align: 'left',
          overlay: 45,
          primaryLabel: 'Apoiar o projeto',
          primaryHref: '#contato',
          secondaryLabel: 'Nossa historia',
          secondaryHref: '#sobre',
          badges: ['Desde 2009', '320 atendidos', 'Prestacao de contas publica'],
        }),
        sec('numeros', 'stats', 'Impacto', {
          title: 'Nosso impacto',
          items: [
            { value: '320', label: 'Criancas atendidas' },
            { value: '16', label: 'Anos de atuacao' },
            { value: '42', label: 'Voluntarios' },
            { value: '96%', label: 'Frequencia escolar' },
          ],
        }),
        sec('sobre', 'about', 'Nossa historia', {
          title: 'Comecou com uma sala emprestada',
          body:
            'Em 2009, um grupo de professores abriu as portas de uma sala cedida para reforco escolar.\n\nHoje o {{clientName}} mantem contraturno, esporte e oficinas, com prestacao de contas publicada todo semestre.',
          imageId: 'port-escritorio-2',
          highlights: ['Contraturno escolar', 'Esporte e cultura', 'Prestacao de contas publica', 'Rede de voluntarios'],
          layout: 'image-right',
        }),
        sec('projetos', 'catalog', 'Projetos', {
          title: 'Projetos em andamento',
          subtitle: 'Cada frente com objetivo e publico definidos.',
          mode: 'cards',
          showPrices: false,
          columns: 3,
          categoryFilter: false,
          ctaLabel: 'Saber mais',
        }),
        sec('equipe', 'team', 'Equipe', {
          title: 'Quem esta a frente',
          subtitle: '',
          members: [
            { name: 'Marcia Andrade', role: 'Coordenacao pedagogica', imageId: 'port-equipe-3' },
            { name: 'Jose Ricardo', role: 'Diretor executivo', imageId: 'port-equipe-1' },
            { name: 'Taina Souza', role: 'Mobilizacao de voluntarios', imageId: 'port-equipe-2' },
          ],
        }),
        sec('depoimentos', 'testimonials', 'Historias', {
          title: 'Historias do projeto',
          subtitle: '',
          items: [
            { quote: 'Entrei no reforco aos 9 anos. Hoje estudo enfermagem.', author: 'Bruna, 19', detail: 'Ex-aluna', rating: 5 },
            { quote: 'Como voluntaria, vejo o quanto a constancia muda a vida das criancas.', author: 'Elisa Prado', detail: 'Voluntaria desde 2021', rating: 5 },
          ],
        }),
        sec('faq', 'faq', 'Transparencia', {
          title: 'Perguntas frequentes',
          subtitle: '',
          items: [
            { question: 'Para onde vai o dinheiro doado?', answer: '70% para atividades e materiais, 20% para equipe pedagogica e 10% para estrutura. Relatorios semestrais sao publicados no site.' },
            { question: 'Como ser voluntario?', answer: 'Pelo formulario de contato. O voluntario passa por conversa inicial e formacao.' },
            { question: 'Posso doar materiais?', answer: 'Sim. Entre em contato para alinharmos a lista de necessidades do semestre.' },
          ],
        }),
        sec('contato', 'contact', 'Contato', {
          title: 'Fale com o instituto',
          subtitle: 'Visitas guiadas as tercas e quintas, com agendamento.',
          showMap: true,
          showForm: true,
          formCta: 'Quero ajudar',
        }),
      ],
      categories: [
        { id: 'educacao', name: 'Educacao', description: '', order: 0 },
        { id: 'cultura', name: 'Cultura', description: '', order: 1 },
        { id: 'esporte', name: 'Esporte', description: '', order: 2 },
      ],
      items: [
        { id: 'pc-reforco', name: 'Reforco escolar', description: 'Turmas de 12 alunos no contraturno.', price: null, categoryId: 'educacao', imageId: 'port-projetos-3', featured: true, order: 0 },
        { id: 'pc-leitura', name: 'Clube de leitura', description: 'Emprestimo de livros e rodas de leitura.', price: null, categoryId: 'cultura', imageId: 'port-projetos-2', order: 1 },
        { id: 'pc-teatro', name: 'Oficina de teatro', description: 'Encontros semanais com apresentacao semestral.', price: null, categoryId: 'cultura', imageId: 'port-projetos-4', order: 2 },
        { id: 'pc-futebol', name: 'Futebol de base', description: 'Treinos duas vezes por semana.', price: null, categoryId: 'esporte', imageId: 'port-projetos-1', order: 3 },
      ],
      links: [
        { label: 'WhatsApp', type: 'whatsapp', value: 'https://wa.me/{{whatsapp}}' },
        { label: 'Instagram', type: 'instagram', value: 'https://instagram.com/' },
        { label: 'E-mail', type: 'email', value: 'mailto:{{email}}' },
      ],
    }),
  },
];

/* ------------------------------------------------------------------ */
/* Imagens da biblioteca demonstrativa                                */
/* ------------------------------------------------------------------ */

const IMG = (segment, category, title, { tags = [], license = 'illustrative', note = '', size = [1200, 800] } = {}) => ({
  segment,
  category,
  title,
  tags,
  license,
  note: note || 'Ilustracao gerada pelo sistema. Uso demonstrativo; substitua por imagens proprias do estabelecimento.',
  width: size[0],
  height: size[1],
});

export const LIBRARY_IMAGES = [
  /* ---------- restaurantes ---------- */
  IMG('restaurantes', 'pizzas', 'Pizza margherita', { tags: ['pizza', 'queijo', 'forno'] }),
  IMG('restaurantes', 'pizzas', 'Pizza de calabresa', { tags: ['pizza', 'calabresa'] }),
  IMG('restaurantes', 'pizzas', 'Pizza de burrata', { tags: ['pizza', 'burrata', 'gourmet'] }),
  IMG('restaurantes', 'hamburgueres', 'Burger classic', { tags: ['hamburguer', 'cheddar'] }),
  IMG('restaurantes', 'hamburgueres', 'Double bacon', { tags: ['hamburguer', 'bacon'] }),
  IMG('restaurantes', 'hamburgueres', 'Burger veggie', { tags: ['hamburguer', 'vegano'] }),
  IMG('restaurantes', 'bebidas', 'Limonada artesanal', { tags: ['bebida', 'limao'] }),
  IMG('restaurantes', 'bebidas', 'Cerveja artesanal', { tags: ['bebida', 'cerveja'] }),
  IMG('restaurantes', 'bebidas', 'Cafe especial', { tags: ['cafe', 'bebida'] }),
  IMG('restaurantes', 'pratos', 'Entrada da casa', { tags: ['prato', 'entrada'] }),
  IMG('restaurantes', 'pratos', 'Prato principal', { tags: ['prato', 'principal'] }),
  IMG('restaurantes', 'pratos', 'Tábua de frios', { tags: ['prato', 'compartilhar'] }),
  IMG('restaurantes', 'ambientes', 'Salao do restaurante', { tags: ['ambiente', 'mesa'] }),
  IMG('restaurantes', 'ambientes', 'Balcao e bar', { tags: ['ambiente', 'bar'] }),
  IMG('restaurantes', 'sobremesas', 'Tiramisu', { tags: ['sobremesa', 'doce'] }),
  IMG('restaurantes', 'sobremesas', 'Brownie com sorvete', { tags: ['sobremesa', 'chocolate'] }),

  /* ---------- barbearias ---------- */
  IMG('barbearias', 'cortes', 'Corte degradê', { tags: ['corte', 'fade'] }),
  IMG('barbearias', 'cortes', 'Corte social', { tags: ['corte', 'social'] }),
  IMG('barbearias', 'cortes', 'Barba desenhada', { tags: ['barba', 'navalha'] }),
  IMG('barbearias', 'cadeiras', 'Cadeira de barbeiro', { tags: ['cadeira', 'classica'] }),
  IMG('barbearias', 'cadeiras', 'Estacao de atendimento', { tags: ['estacao', 'espelho'] }),
  IMG('barbearias', 'ambientes', 'Interior da barbearia', { tags: ['ambiente', 'loja'] }),
  IMG('barbearias', 'ambientes', 'Salao de beleza', { tags: ['ambiente', 'salao'] }),
  IMG('barbearias', 'ferramentas', 'Navalha e tesoura', { tags: ['ferramenta', 'navalha'] }),
  IMG('barbearias', 'ferramentas', 'Kit de acabamento', { tags: ['ferramenta', 'maquina'] }),
  IMG('barbearias', 'produtos', 'Pomada modeladora', { tags: ['produto', 'cabelo'] }),
  IMG('barbearias', 'produtos', 'Oleo para barba', { tags: ['produto', 'barba'] }),
  IMG('barbearias', 'produtos', 'Shampoo profissional', { tags: ['produto', 'lavatorio'] }),
  IMG('barbearias', 'ambientes', 'Lavatorio', { tags: ['ambiente', 'lavatorio'] }),
  IMG('barbearias', 'ambientes', 'Estacao de barba', { tags: ['ambiente', 'barba'] }),
  IMG('barbearias', 'cadeiras', 'Cadeira estilo classico', { tags: ['cadeira', 'couro'] }),

  /* ---------- oficinas ---------- */
  IMG('oficinas', 'veiculos', 'Carro no elevador', { tags: ['veiculo', 'elevador'] }),
  IMG('oficinas', 'veiculos', 'Motor em revisao', { tags: ['veiculo', 'motor'] }),
  IMG('oficinas', 'veiculos', 'Carro finalizado', { tags: ['veiculo', 'polimento'] }),
  IMG('oficinas', 'servicos', 'Troca de oleo', { tags: ['servico', 'oleo'] }),
  IMG('oficinas', 'servicos', 'Alinhamento', { tags: ['servico', 'alinhamento'] }),
  IMG('oficinas', 'servicos', 'Diagnostico eletronico', { tags: ['servico', 'scanner'] }),
  IMG('oficinas', 'pecas', 'Filtros', { tags: ['peca', 'filtro'] }),
  IMG('oficinas', 'pecas', 'Kit correia dentada', { tags: ['peca', 'correia'] }),
  IMG('oficinas', 'pecas', 'Pastilhas de freio', { tags: ['peca', 'freio'] }),
  IMG('oficinas', 'ambientes', 'Vista da oficina', { tags: ['ambiente', 'oficina'] }),
  IMG('oficinas', 'ambientes', 'Sala de espera', { tags: ['ambiente', 'recepcao'] }),
  IMG('oficinas', 'veiculos', 'Carro na oficina', { tags: ['veiculo', 'oficina'] }),
  IMG('oficinas', 'pecas', 'Kit de embreagem', { tags: ['peca', 'embreagem'] }),

  /* ---------- lojas ---------- */
  IMG('lojas', 'roupas', 'Vestido midi', { tags: ['roupa', 'vestido'] }),
  IMG('lojas', 'roupas', 'Camisa oversize', { tags: ['roupa', 'camisa'] }),
  IMG('lojas', 'roupas', 'Calca wide leg', { tags: ['roupa', 'calca'] }),
  IMG('lojas', 'calcados', 'Tenis de couro', { tags: ['calcado', 'tenis'] }),
  IMG('lojas', 'calcados', 'Sandalia salto bloco', { tags: ['calcado', 'sandalia'] }),
  IMG('lojas', 'acessorios', 'Bolsa estruturada', { tags: ['acessorio', 'bolsa'] }),
  IMG('lojas', 'acessorios', 'Cinto fino', { tags: ['acessorio', 'cinto'] }),
  IMG('lojas', 'vitrines', 'Vitrine da loja', { tags: ['vitrine', 'loja'] }),
  IMG('lojas', 'vitrines', 'Provador', { tags: ['vitrine', 'provador'] }),
  IMG('lojas', 'roupas', 'Saia plissada', { tags: ['roupa', 'saia'] }),
  IMG('lojas', 'acessorios', 'Vitrine de acessorios', { tags: ['acessorio', 'vitrine'] }),

  /* ---------- mercados ---------- */
  IMG('mercados', 'hortifruti', 'Banca de frutas', { tags: ['hortifruti', 'frutas'] }),
  IMG('mercados', 'hortifruti', 'Legumes frescos', { tags: ['hortifruti', 'legumes'] }),
  IMG('mercados', 'padaria', 'Pao frances', { tags: ['padaria', 'pao'] }),
  IMG('mercados', 'padaria', 'Bolos caseiros', { tags: ['padaria', 'bolo'] }),
  IMG('mercados', 'bebidas', 'Bebidas geladas', { tags: ['bebida', 'geladeira'] }),
  IMG('mercados', 'mercearia', 'Prateleira de mercearia', { tags: ['mercearia', 'estoque'] }),
  IMG('mercados', 'mercearia', 'Cafe e graos', { tags: ['mercearia', 'cafe'] }),
  IMG('mercados', 'ambientes', 'Corredor do mercado', { tags: ['ambiente', 'mercado'] }),
  IMG('mercados', 'ambientes', 'Caixa e atendimento', { tags: ['ambiente', 'caixa'] }),
  IMG('mercados', 'hortifruti', 'Cesta de frutas da semana', { tags: ['hortifruti', 'cesta'] }),
  IMG('mercados', 'padaria', 'Prateleira da padaria', { tags: ['padaria', 'vitrine'] }),
  IMG('mercados', 'mercearia', 'Ofertas da semana', { tags: ['mercearia', 'oferta'] }),

  /* ---------- clinicas ---------- */
  IMG('clinicas', 'consultorios', 'Consultorio', { tags: ['consultorio', 'atendimento'] }),
  IMG('clinicas', 'consultorios', 'Sala de exames', { tags: ['exame', 'sala'] }),
  IMG('clinicas', 'consultorios', 'Recepcao', { tags: ['recepcao', 'espera'] }),
  IMG('clinicas', 'equipe', 'Profissional de saude', { tags: ['equipe', 'medico'] }),
  IMG('clinicas', 'equipe', 'Equipe clinica', { tags: ['equipe', 'clinica'] }),
  IMG('clinicas', 'procedimentos', 'Procedimento', { tags: ['procedimento', 'cuidado'] }),
  IMG('clinicas', 'ambientes', 'Corredor da clinica', { tags: ['ambiente', 'clinica'] }),
  IMG('clinicas', 'ambientes', 'Escritorio profissional', { tags: ['ambiente', 'escritorio'] }),
  IMG('clinicas', 'ambientes', 'Sala de espera', { tags: ['ambiente', 'espera'] }),
  IMG('clinicas', 'consultorios', 'Consultorio de especialidade', { tags: ['consultorio', 'atendimento'] }),
  IMG('clinicas', 'equipe', 'Retrato de profissional', { tags: ['equipe', 'retrato'] }),
  IMG('clinicas', 'escritorio', 'Sala de reuniao', { tags: ['escritorio', 'reuniao'] }),
  IMG('clinicas', 'escritorio', 'Escritorio de atendimento', { tags: ['escritorio', 'atendimento'] }),

  /* ---------- portfolio ---------- */
  IMG('portfolio', 'projetos', 'Projeto de identidade', { tags: ['projeto', 'identidade'] }),
  IMG('portfolio', 'projetos', 'Projeto digital', { tags: ['projeto', 'site'] }),
  IMG('portfolio', 'projetos', 'Projeto de embalagem', { tags: ['projeto', 'embalagem'] }),
  IMG('portfolio', 'projetos', 'Ensaio editorial', { tags: ['projeto', 'fotografia'] }),
  IMG('portfolio', 'equipe', 'Retrato profissional', { tags: ['equipe', 'retrato'] }),
  IMG('portfolio', 'escritorio', 'Espaco do estudio', { tags: ['escritorio', 'estudio'] }),
  IMG('portfolio', 'processo', 'Mesa de trabalho', { tags: ['processo', 'criacao'] }),
  IMG('portfolio', 'escritorio', 'Sala de reuniao', { tags: ['escritorio', 'reuniao'] }),
  IMG('portfolio', 'projetos', 'Estudo de caso', { tags: ['projeto', 'estudo'] }),
  IMG('portfolio', 'equipe', 'Retrato da equipe', { tags: ['equipe', 'retrato'] }),
];

/** Imagens compartilhadas de equipe, usadas por templates de varios segmentos. */
export const SHARED_IMAGES = [
  IMG('geral', 'equipe', 'Retrato equipe 1', { tags: ['equipe'] }),
  IMG('geral', 'equipe', 'Retrato equipe 2', { tags: ['equipe'] }),
  IMG('geral', 'equipe', 'Retrato equipe 3', { tags: ['equipe'] }),
];

/**
 * Mapeia ids estaveis usados nos templates (`pizzas-1`, `cortes-2`...) para
 * as imagens da biblioteca. O id e deterministico: `${categoria}-${n}`.
 */
export function libraryIdFor(segment, category, index) {
  return `${category}-${index + 1}`;
}

export function buildLibraryRecords() {
  const records = [];
  const counters = new Map();
  const segmentPrefix = (segment) => segment.replace(/-/g, '').slice(0, 4);
  const push = (img, segmentFallback) => {
    const segment = img.segment === 'geral' ? segmentFallback : img.segment;
    const key = `${segment}:${img.category}`;
    const next = (counters.get(key) ?? 0) + 1;
    counters.set(key, next);
    records.push({
      id: `${segmentPrefix(segment)}-${img.category}-${next}`,
      segment_slug: segment,
      category_slug: img.category,
      title: img.title,
      alt: img.title,
      tags: img.tags,
      license: img.license,
      license_note: img.note,
      width: img.width,
      height: img.height,
      source: 'library',
      is_cover: next === 1,
    });
  };
  for (const img of LIBRARY_IMAGES) push(img, img.segment);
  // imagens "gerais" sao clonadas por segmento que as usa, evitando id duplicado
  const sharedBySegment = {
    restaurantes: 0,
    barbearias: 3,
    oficinas: 0,
    lojas: 0,
    mercados: 0,
    clinicas: 3,
    portfolio: 4,
  };
  for (const [segment, count] of Object.entries(sharedBySegment)) {
    for (let i = 0; i < count; i += 1) {
      const img = SHARED_IMAGES[i] ?? SHARED_IMAGES[0];
      const key = `${segment}:equipe`;
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      records.push({
        id: `${segmentPrefix(segment)}-equipe-${next}`,
        segment_slug: segment,
        category_slug: 'equipe',
        title: img.title,
        alt: img.title,
        tags: img.tags,
        license: img.license,
        license_note: img.note,
        width: img.width,
        height: img.height,
        source: 'library',
        is_cover: false,
      });
    }
  }
  return records;
}
