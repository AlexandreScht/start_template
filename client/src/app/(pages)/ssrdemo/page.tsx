import SSRDemoClient from '@/components/SSRDemoClient';
import serviceSelector from '@/hooks/serviceSelector';
import { useServerService } from '@/hooks/useServerService';

export default async function SSRDemoPage() {
  // useServerService gère automatiquement :
  // 1. Vérification du cache personnalisé (valeurs mutées) → ServerMemory
  // 2. Si pas de cache personnalisé → unstable_cache (utilise ServerMemory via NextCacheHandler)
  // 3. Si pas de cache Next.js → axios-cache-interceptor (utilise aussi ServerMemory)
  // 4. Si pas de cache axios → Appel API
  // 
  // ⚡ TOUS les caches sont unifiés sur ServerMemory (QuickLRU)
  const { data, success, error } = await useServerService({
    serviceKey: 'ssrdemo-simple',
    fetcher: serviceSelector(v => v.simple()),
    options: {
      revalidate: 180, // 3 minutes
      tags: ['ssrdemo'],
    },
  });

  if (!success || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-lg bg-red-100 p-6 text-red-800">
            <h1 className="mb-2 text-2xl font-bold">❌ Erreur</h1>
            <p>{error?.message || 'Une erreur est survenue'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            🚀 SSR Demo avec Cache & Revalidation
          </h1>
          <p className="text-lg text-gray-600">
            Données chargées côté serveur avec cache Next.js (3 min)
          </p>
        </div>

        {/* Info Card */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">📦 Données en cache</h2>
            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
              ✅ Cached
            </span>
          </div>
          
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="mb-2 text-sm font-medium text-gray-600">Valeur actuelle :</p>
            <pre className="overflow-auto text-lg font-mono text-gray-900">{data}</pre>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">Cache Key</p>
              <p className="text-xs text-blue-700">ssrdemo-simple</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-sm font-medium text-purple-900">Revalidation</p>
              <p className="text-xs text-purple-700">180 secondes (3 min)</p>
            </div>
          </div>
        </div>

        {/* Client Component pour mutation */}
        <SSRDemoClient initialData={data} />

        {/* Info technique */}
        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-800">ℹ️ Comment ça fonctionne ?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">1️⃣</span>
              <span>
                <strong>Chargement SSR :</strong> Les données sont chargées côté serveur avec{' '}
                <code className="rounded bg-gray-200 px-1">useServerService</code>
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2️⃣</span>
              <span>
                <strong>Cache unifié :</strong> Next.js et Axios utilisent{' '}
                <code className="rounded bg-gray-200 px-1">ServerMemory</code> (QuickLRU)
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3️⃣</span>
              <span>
                <strong>Mutation :</strong> Le bouton déclenche une Server Action qui modifie les données
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4️⃣</span>
              <span>
                <strong>Revalidation :</strong> Le cache est invalidé avec{' '}
                <code className="rounded bg-gray-200 px-1">revalidateTag</code>
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">5️⃣</span>
              <span>
                <strong>Rafraîchissement :</strong> La page se recharge automatiquement avec les nouvelles données
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
