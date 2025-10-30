/** @type {import('next').NextConfig} */
const nextConfig = {
  // Utiliser un cache handler personnalisé basé sur ServerMemory
  cacheHandler: require.resolve('./src/lib/nextCacheHandler.ts'),
  
  // Activer le cache pour les pages et les données
  experimental: {
    // isrMemoryCacheSize: 0, // Désactiver le cache mémoire par défaut de Next.js
  },
};

export default nextConfig;
