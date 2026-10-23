// Gera json/<id>.json para cada pet e json/indice.json com a lista.
// Uso: node assets/pets/exportar.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { PETS, gerarPet } from './especies.js';

const pasta = new URL('./json/', import.meta.url);
mkdirSync(pasta, { recursive: true });

const indice = PETS.map(({ id, numero, nome, personalidade }) => {
  const dados = gerarPet(id);
  writeFileSync(new URL(`${id}.json`, pasta), `${JSON.stringify(dados)}\n`);
  console.log(`${id.padEnd(11)} ${String(dados.totalVoxels).padStart(5)} voxels  ${dados.tamanho.join(' × ')}`);
  return { id, numero, nome, personalidade, arquivo: `${id}.json`, voxels: dados.totalVoxels, tamanho: dados.tamanho };
});
writeFileSync(new URL('indice.json', pasta), `${JSON.stringify(indice, null, 2)}\n`);
