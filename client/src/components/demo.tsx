'use client';

import { useService } from '@/hooks/useService';

export default function Demo() {
  const { data, isLoading, error, isSuccess } = useService({
    serviceKey: 'demoTest',
    fetcher: v => v.simple(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚀 Démo SSR avec React Query
          </h1>
          <p className="text-gray-600 text-lg">
            Données prefetchées côté serveur et hydratées côté client
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg border-2 ${
            isLoading ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-300'
          }`}>
            <div className="text-sm font-semibold text-gray-600 mb-1">Loading</div>
            <div className="text-2xl font-bold">
              {isLoading ? '⏳ Oui' : '✅ Non'}
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            isSuccess ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'
          }`}>
            <div className="text-sm font-semibold text-gray-600 mb-1">Success</div>
            <div className="text-2xl font-bold">
              {isSuccess ? '✅ Oui' : '❌ Non'}
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            error ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300'
          }`}>
            <div className="text-sm font-semibold text-gray-600 mb-1">Error</div>
            <div className="text-2xl font-bold">
              {error ? '❌ Oui' : '✅ Non'}
            </div>
          </div>
        </div>

        {/* Data Display */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📦 Données récupérées
          </h2>
          
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">❌ Erreur</p>
              <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
            </div>
          )}

          {isSuccess && data && (
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-800 overflow-auto max-h-96">
                {JSON.stringify(data as any, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            ℹ️ Comment ça fonctionne
          </h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>
                <strong>SSR:</strong> La page est rendue côté serveur (Server Component)
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>
                <strong>Prefetch:</strong> <code className="bg-blue-100 px-1 rounded">FetchServerSide</code> 
                {' '}prefetch les données avec <code className="bg-blue-100 px-1 rounded">serviceSelector</code>
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>
                <strong>Hydration:</strong> Les données sont déshydratées et envoyées au client via 
                {' '}<code className="bg-blue-100 px-1 rounded">HydrationBoundary</code>
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>
                <strong>Client:</strong> Ce composant utilise <code className="bg-blue-100 px-1 rounded">useQuery</code> 
                {' '}pour lire les données du cache React Query (pas de nouvelle requête !)
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">5.</span>
              <span>
                <strong>Résultat:</strong> Chargement instantané côté client grâce au prefetch SSR
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}