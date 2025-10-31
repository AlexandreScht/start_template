'use client';

import {
  mutateAndRevalidateAction,
  mutateCacheAction,
  mutateCacheByTagsAction,
  revalidateCacheAction,
} from '@/app/(pages)/ssrdemo/actions';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface SSRDemoClientProps {
  initialData?: string;
}

export default function SSRDemoClient({ initialData }: SSRDemoClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [stats, setStats] = useState({ updated: 0, deleted: 0 });

  const showMessage = (type: 'success' | 'error' | 'info', text: string, duration = 5000) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), duration);
  };

  // Test 1: Mutate SANS revalidation (router.refresh() verra la nouvelle valeur)
  const handleMutateOnly = () => {
    startTransition(async () => {
      if (!inputValue.trim()) {
        showMessage('error', 'Veuillez saisir une valeur', 3000);
        return;
      }

      const result = await mutateCacheAction('ssrdemo-simple', inputValue);
      console.log(result);
      
      if (result.success) {
        setStats(prev => ({ ...prev, updated: result.updated }));
        showMessage(
          'success',
          `✅ Cache muté ! (${result.updated} entrée). Cliquez sur "Voir la mutation" pour voir le résultat.`
        );
        setInputValue('');
      } else {
        showMessage('error', result.error || 'Erreur lors de la mutation');
      }
    });
  };

  // Test 2: Voir la mutation (router.refresh())
  const handleRefresh = () => {
    showMessage('info', '🔄 Rafraîchissement de la page...', 2000);
    router.refresh();
  };

  // Test 3: Mutate ET revalidate (force un refetch complet)
  const handleMutateAndRevalidate = () => {
    startTransition(async () => {
      if (!inputValue.trim()) {
        showMessage('error', 'Veuillez saisir une valeur', 3000);
        return;
      }

      const result = await mutateAndRevalidateAction('ssrdemo-simple', inputValue);

      if (result.success) {
        setStats({ updated: result.updated, deleted: result.deleted });
        showMessage(
          'success',
          `✅ Mutation et revalidation complètes ! ${result.updated} muté, ${result.deleted} supprimé.`
        );
        setInputValue('');
        router.refresh();
      } else {
        showMessage('error', result.error || 'Erreur lors de la mutation et revalidation');
      }
    });
  };

  // Test 4: Revalidate uniquement (supprime et force le refetch)
  const handleRevalidateOnly = () => {
    startTransition(async () => {
      const result = await revalidateCacheAction('ssrdemo-simple', ['ssrdemo']);

      if (result.success) {
        setStats(prev => ({ ...prev, deleted: result.deleted }));
        showMessage(
          'success',
          `✅ Cache invalidé ! ${result.deleted} entrée(s) supprimée(s). Rechargement...`
        );
        router.refresh();
      } else {
        showMessage('error', result.error || 'Erreur lors de la revalidation');
      }
    });
  };

  // Test 5: Mutate par tags
  const handleMutateByTags = () => {
    startTransition(async () => {
      if (!inputValue.trim()) {
        showMessage('error', 'Veuillez saisir une valeur', 3000);
        return;
      }

      const result = await mutateCacheByTagsAction(['ssrdemo'], `[TAG-UPDATE] ${inputValue}`);

      if (result.success) {
        setStats(prev => ({ ...prev, updated: result.updated }));
        showMessage(
          'success',
          `✅ ${result.updated} entrée(s) mutée(s) par tags ! Cliquez sur "Voir la mutation".`
        );
        setInputValue('');
      } else {
        showMessage('error', result.error || 'Erreur lors de la mutation par tags');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <div className="rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">🧪 Tests de cache</h2>
        
        <div className="mb-6">
          <label htmlFor="mutation-input" className="mb-2 block text-sm font-semibold text-gray-700">
            Valeur de test
          </label>
          <input
            id="mutation-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="ex: Hello World!"
            disabled={isPending}
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </div>

        {/* Message de feedback */}
        {message && (
          <div
            className={`mb-4 animate-fade-in rounded-lg p-4 ${
              message.type === 'success'
                ? 'bg-emerald-100 text-emerald-800'
                : message.type === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            <div className="flex items-center">
              <span className="mr-2 text-xl">
                {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <p className="text-xs font-medium uppercase text-blue-600">Entrées mutées</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">{stats.updated}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-xs font-medium uppercase text-red-600">Entrées supprimées</p>
            <p className="mt-1 text-2xl font-bold text-red-900">{stats.deleted}</p>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Test 1: Mutate Only */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-blue-900">1️⃣ Mutate Only</h3>
            <span className="rounded-full bg-blue-200 px-3 py-1 text-xs font-semibold text-blue-800">
              ssrMutate
            </span>
          </div>
          <p className="mb-4 text-sm text-blue-800">
            Modifie le cache SANS invalider. Le router.refresh() affichera la nouvelle valeur.
          </p>
          <div className="space-y-2">
            <button
              onClick={handleMutateOnly}
              disabled={isPending || !inputValue.trim()}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? '⏳ Mutation...' : '🔄 Muter le cache'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isPending}
              className="w-full rounded-lg border-2 border-blue-600 bg-white px-4 py-2 font-medium text-blue-600 transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              👁️ Voir la mutation (refresh)
            </button>
          </div>
        </div>

        {/* Test 2: Mutate AND Revalidate */}
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-purple-900">2️⃣ Mutate + Revalidate</h3>
            <span className="rounded-full bg-purple-200 px-3 py-1 text-xs font-semibold text-purple-800">
              ssrMutateAndRevalidate
            </span>
          </div>
          <p className="mb-4 text-sm text-purple-800">
            Modifie puis invalide le cache. Force un refetch complet avec la nouvelle valeur.
          </p>
          <button
            onClick={handleMutateAndRevalidate}
            disabled={isPending || !inputValue.trim()}
            className="w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? '⏳ Traitement...' : '🔄 Muter & Revalider'}
          </button>
        </div>

        {/* Test 3: Revalidate Only */}
        <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-red-900">3️⃣ Revalidate Only</h3>
            <span className="rounded-full bg-red-200 px-3 py-1 text-xs font-semibold text-red-800">
              ssrRevalidate
            </span>
          </div>
          <p className="mb-4 text-sm text-red-800">
            Supprime le cache et force un refetch des données originales depuis l'API.
          </p>
          <button
            onClick={handleRevalidateOnly}
            disabled={isPending}
            className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? '⏳ Suppression...' : '🗑️ Invalider le cache'}
          </button>
        </div>

        {/* Test 4: Mutate by Tags */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-emerald-900">4️⃣ Mutate by Tags</h3>
            <span className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
              tags: ['ssrdemo']
            </span>
          </div>
          <p className="mb-4 text-sm text-emerald-800">
            Modifie TOUTES les entrées avec le tag "ssrdemo" (peut être plusieurs entrées).
          </p>
          <button
            onClick={handleMutateByTags}
            disabled={isPending || !inputValue.trim()}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? '⏳ Mutation...' : '🏷️ Muter par tags'}
          </button>
        </div>
      </div>

      {/* Guide Info */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
        <h3 className="mb-3 flex items-center text-lg font-bold text-indigo-900">
          <span className="mr-2">💡</span>
          Guide de test
        </h3>
        <ol className="space-y-2 text-sm text-indigo-800">
          <li className="flex items-start">
            <span className="mr-2 font-bold">1.</span>
            <span>
              <strong>Mutate Only:</strong> Modifie le cache mais garde l'entrée valide. Parfait pour des mises à jour optimistes.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 font-bold">2.</span>
            <span>
              <strong>Mutate + Revalidate:</strong> Met à jour puis invalide. Utilisez pour forcer un refetch immédiat.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 font-bold">3.</span>
            <span>
              <strong>Revalidate Only:</strong> Supprime le cache pour revenir aux données originales de l'API.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 font-bold">4.</span>
            <span>
              <strong>Mutate by Tags:</strong> Modifie plusieurs entrées à la fois (utile pour des mises à jour globales).
            </span>
          </li>
        </ol>
      </div>

      {/* Current Data Display */}
      <div className="rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-bold text-gray-800">📊 Données actuelles</h3>
        <div className="rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 p-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Valeur dans le cache :</p>
          <div className="rounded-md bg-white p-4 shadow-inner">
            <pre className="overflow-auto text-lg font-mono font-bold text-indigo-600">{initialData}</pre>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <strong>💡 Astuce :</strong> Après avoir muté le cache, appuyez sur <kbd className="rounded bg-amber-200 px-2 py-1 font-mono text-xs">F5</kbd> pour recharger la page.
            La valeur mutée sera toujours là ! (pendant 3 min)
          </p>
        </div>
      </div>
    </div>
  );
}
