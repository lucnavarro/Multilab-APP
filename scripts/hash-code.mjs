// Uso:
//   npm run hash-code                 -> sorteia um código forte e mostra o hash
//   npm run hash-code -- MEU-CODIGO   -> mostra o hash de um código que você escolheu
import { createHash, randomInt } from 'node:crypto';

const normalize = (s) => s.trim().replace(/\s+/g, '').toLowerCase(); // igual ao app
const hash = (s) => createHash('sha256').update(normalize(s)).digest('hex');

let code = process.argv.slice(2).join(' ').trim();
const generated = !code;

if (generated) {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sem O/0/I/1/L para não confundir
  const part = () => Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join('');
  code = `MLAB-${part()}-${part()}`;
}

console.log(generated ? `Código sorteado: ${code}` : `Código: ${code}`);
console.log(`Hash (cole em VITE_ACCESS_CODE_HASH): ${hash(code)}`);
