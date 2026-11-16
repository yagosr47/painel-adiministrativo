import { seedDatabase } from './seed.js';

const force = process.argv.includes('--force');
const result = seedDatabase({ force });
if (result.skipped) {
  console.log(`[seed] ignorado: ${result.reason}. Use --force para recriar dados base.`);
} else {
  console.log('[seed] concluido');
  console.log(`  usuarios:   ${result.users.map((u) => u.email).join(', ')}`);
  console.log(`  segmentos:  ${result.segments}`);
  console.log(`  templates:  ${result.templates}`);
  console.log(`  imagens:    ${result.images}`);
  console.log(`  clientes:   ${result.clients}`);
}
