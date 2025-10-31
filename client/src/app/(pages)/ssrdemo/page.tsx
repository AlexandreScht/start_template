import SSRDemoClient from '@/components/SSRDemoClient';
import serviceSelector from '@/hooks/serviceSelector';
import { useServerService } from '@/hooks/useServerService';

export default async function SSRDemoPage() {
  const { data, success, error } = await useServerService({
    serviceKey: 'ssrdemo-simple',
    fetcher: serviceSelector(v => v.simple()),
    options: {
      revalidate: 180,
      tags: ['ssrdemo'],
    },
  });

  if (!success || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-lg bg-red-100 p-6 text-red-800">
            <h1 className="mb-2 text-2xl font-bold">❌ Erreur</h1>
            <p>{error?.message || 'Une erreur est survenue'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-5xl font-extrabold text-transparent">
            🚀 SSR Cache Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test complet du système de cache avec <code className="rounded bg-gray-200 px-2 py-1 text-sm">ssrMutate</code>
          </p>
        </div>

        {/* Info Card */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">📦 Données du cache</h2>
            <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              ✅ Cached SSR
            </span>
          </div>
          
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Valeur actuelle :</p>
            <div className="rounded-md bg-white p-4 shadow-inner">
              <pre className="overflow-auto text-xl font-mono font-bold text-indigo-600">{data}</pre>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-xs font-medium uppercase text-blue-600">Cache Key</p>
              <p className="mt-1 font-mono text-sm font-semibold text-blue-900">ssrdemo-simple</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 text-center">
              <p className="text-xs font-medium uppercase text-purple-600">TTL</p>
              <p className="mt-1 font-mono text-sm font-semibold text-purple-900">180s (3 min)</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4 text-center">
              <p className="text-xs font-medium uppercase text-emerald-600">Tags</p>
              <p className="mt-1 font-mono text-sm font-semibold text-emerald-900">[ssrdemo]</p>
            </div>
          </div>
        </div>

        {/* Client Component pour les tests */}
        <SSRDemoClient initialData={data} />

        {/* Architecture Info */}
        <div className="mt-8 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg">
          <h3 className="mb-4 flex items-center text-xl font-bold text-amber-900">
            <span className="mr-2 text-2xl">🏗️</span>
            Architecture du système de cache
          </h3>
          <div className="space-y-3 text-sm text-amber-800">
            <div className="flex items-start">
              <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold">1</span>
              <div>
                <strong className="text-amber-900">ServerMemory (QuickLRU)</strong>
                <p className="mt-1 text-amber-700">Stockage en mémoire unifié pour tous les caches</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold">2</span>
              <div>
                <strong className="text-amber-900">axios-cache-interceptor</strong>
                <p className="mt-1 text-amber-700">Intercepte les requêtes HTTP et utilise ServerMemory</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold">3</span>
              <div>
                <strong className="text-amber-900">ssrMutate / ssrRevalidate</strong>
                <p className="mt-1 text-amber-700">API de mutation et invalidation du cache SSR</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold">4</span>
              <div>
                <strong className="text-amber-900">Next.js revalidateTag</strong>
                <p className="mt-1 text-amber-700">Synchronisation avec le système de cache Next.js</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
