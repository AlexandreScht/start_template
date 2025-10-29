'use client';

import serviceSelector from '@/hooks/serviceSelector';
// import { useQuery } from '@tanstack/react-query';

import { useService } from '@/hooks/useService';

export default function Demo() {
  const { data, isLoading, error, isSuccess } = useService<string>({
    serviceKey: 'demoTest',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">🚀 Démo SSR avec React Query</h1>
          <p className="text-lg text-gray-600">Données prefetchées côté serveur et hydratées côté client</p>
        </div>

        {/* Status Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            className={`rounded-lg border-2 p-4 ${
              isLoading ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="mb-1 text-sm font-semibold text-gray-600">Loading</div>
            <div className="text-2xl font-bold">{isLoading ? '⏳ Oui' : '✅ Non'}</div>
          </div>

          <div
            className={`rounded-lg border-2 p-4 ${
              isSuccess ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="mb-1 text-sm font-semibold text-gray-600">Success</div>
            <div className="text-2xl font-bold">{isSuccess ? '✅ Oui' : '❌ Non'}</div>
          </div>

          <div
            className={`rounded-lg border-2 p-4 ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'}`}
          >
            <div className="mb-1 text-sm font-semibold text-gray-600">Error</div>
            <div className="text-2xl font-bold">{error ? '❌ Oui' : '✅ Non'}</div>
          </div>
        </div>

        {/* Data Display */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">📦 Données récupérées</h2>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-800">❌ Erreur</p>
              <p className="mt-1 text-sm text-red-600">{(error as Error).message}</p>
            </div>
          )}

          {isSuccess && data && (
            <div className="rounded-lg bg-gray-50 p-4">
              <pre className="max-h-96 overflow-auto text-sm text-gray-800">{data}</pre>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-3 text-lg font-semibold text-blue-900">ℹ️ Comment ça fonctionne</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2 font-bold">1.</span>
              <span>
                <strong>SSR:</strong> La page est rendue côté serveur (Server Component)
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">2.</span>
              <span>
                <strong>Prefetch:</strong> <code className="rounded bg-blue-100 px-1">FetchServerSide</code> prefetch
                les données avec <code className="rounded bg-blue-100 px-1">serviceSelector</code>
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">3.</span>
              <span>
                <strong>Hydration:</strong> Les données sont déshydratées et envoyées au client via{' '}
                <code className="rounded bg-blue-100 px-1">HydrationBoundary</code>
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">4.</span>
              <span>
                <strong>Client:</strong> Ce composant utilise <code className="rounded bg-blue-100 px-1">useQuery</code>{' '}
                pour lire les données du cache React Query (pas de nouvelle requête !)
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">5.</span>
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
