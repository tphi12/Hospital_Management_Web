import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function globalSetup() {
  const scriptPath = path.resolve(__dirname, '../../BE/scripts/seedE2EData.js');
  execFileSync('node', [scriptPath], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  });
}
