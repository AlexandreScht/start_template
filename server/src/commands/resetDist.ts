// scripts/reset.js
import fs from 'fs';
import path from 'path';

// Récupère les arguments passés après "npm run reset"
const args = process.argv.slice(2);
const cleanLogs = args.includes('l');

async function deleteFilesInDir(dirPath) {
  try {
    const files = await fs.promises.readdir(dirPath);
    await Promise.all(files.map(file => fs.promises.unlink(path.join(dirPath, file))));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`✖ Erreur lors de la suppression dans ${dirPath}:`, err);
    }
  }
}

async function reset() {
  console.debug('🔄 Démarrage de la réinitialisation…');

  if (cleanLogs) {
    console.debug('🧹 Nettoyage des logs activé (-- l détecté) ');
    const logDirs = [
      path.resolve(__dirname, '../logs/debug'),
      path.resolve(__dirname, '../logs/error'),
      path.resolve(__dirname, '../logs/warn'),
    ];

    for (const dir of logDirs) {
      await deleteFilesInDir(dir);
    }
  } else {
    console.debug('⚠️  Nettoyage des logs désactivé (pas de -- l)');
  }

  console.debug('✅ Réinitialisation terminée.');
}

reset().catch(err => {
  console.error('❌ Échec de la réinitialisation :', err);
  process.exit(1);
});
