import { cp, mkdir, writeFile } from 'node:fs/promises';
import { publicConfig } from './config.mjs';
const config = publicConfig(process.env);
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await writeFile('dist/config.js', `export default ${JSON.stringify(config)};\n`);
console.log('PetCare: fitxers preparats a dist.');
