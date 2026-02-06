import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionFilePath = path.join(__dirname, 'public', 'version.json');

const versionData = {
    version: new Date().getTime().toString()
};

fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));

console.log(`✅ Version file generated at ${versionFilePath}`);
console.log(`Version: ${versionData.version}`);
