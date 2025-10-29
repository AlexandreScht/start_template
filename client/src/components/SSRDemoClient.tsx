'use client';

import { mutateAndRevalidateDemo, revalidateMultipleDemoCaches } from '@/app/(pages)/ssrdemo/actions';
import { useState, useTransition } from 'react';

interface SSRDemoClientProps {
  initialData?: string;
}

export default function SSRDemoClient({ initialData }: SSRDemoClientProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  
  // État local pour les données (mise à jour optimiste)
  const [currentData, setCurrentData] = useState<string | undefined>(initialData);
  const [isDataUpdated, setIsDataUpdated] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleMutateAndRevalidate = () => {
    startTransition(async () => {
      setMessage(null);

      // Validation côté client
      if (!inputValue.trim()) {
        setMessage({
          type: 'error',
          text: 'Veuillez saisir une valeur',
        });
        setTimeout(() => setMessage(null), 3000);
        return;
      }
      
      const result = await mutateAndRevalidateDemo(inputValue);
      
      if (result.success && result.newData) {
        // Mise à jour optimiste : afficher les nouvelles données immédiatement
        setCurrentData(result.newData);
        setIsDataUpdated(true);
        
        setMessage({ 
          type: 'success', 
          text: result.message,
        });
        setLastUpdate(result.timestamp || new Date().toISOString());

        // Vider l'input après succès
        setInputValue('');

        // Retirer l'animation après 1 seconde
        setTimeout(() => setIsDataUpdated(false), 1000);
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message,
        });
      }

      // Effacer le message après 5 secondes
      setTimeout(() => setMessage(null), 5000);
    });
  };

  const handleRevalidateMultiple = () => {
    startTransition(async () => {
      setMessage(null);
      
      const result = await revalidateMultipleDemoCaches();
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: result.message,
        });
        setLastUpdate(new Date().toISOString());
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message,
        });
      }

      setTimeout(() => setMessage(null), 5000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Actions Card */}
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-semibold text-gray-800">🔄 Actions de mutation</h2>
        
        <div className="space-y-4">
          {/* Input pour la nouvelle valeur */}
          <div>
            <label htmlFor="mutation-input" className="mb-2 block text-sm font-medium text-gray-700">
              Nouvelle valeur à mettre en cache
            </label>
            <input
              id="mutation-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isPending) {
                  handleMutateAndRevalidate();
                }
              }}
              placeholder="Entrez une nouvelle valeur..."
              disabled={isPending}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              💡 Appuyez sur <kbd className="rounded bg-gray-200 px-2 py-1 font-mono text-xs">Entrée</kbd> ou cliquez sur le bouton
            </p>
          </div>

          {/* Bouton principal */}
          <div>
            <button
              onClick={handleMutateAndRevalidate}
              disabled={isPending || !inputValue.trim()}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-purple-600 disabled:hover:to-indigo-600"
            >
              {isPending ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="mr-3 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Mutation en cours...
                </span>
              ) : (
                '🔄 Muter le cache avec cette valeur'
              )}
            </button>
            <p className="mt-2 text-sm text-gray-600">
              Modifie le cache SSR avec votre valeur personnalisée
            </p>
          </div>

          {/* Bouton secondaire */}
          <div>
            <button
              onClick={handleRevalidateMultiple}
              disabled={isPending}
              className="w-full rounded-lg border-2 border-red-600 bg-white px-6 py-3 font-semibold text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? 'Traitement...' : '🔄 Réinitialiser le cache (données originales)'}
            </button>
            <p className="mt-2 text-sm text-gray-600">
              Supprime la valeur mutée et recharge les données depuis l'API
            </p>
          </div>
        </div>

        {/* Message de feedback */}
        {message && (
          <div
            className={`mt-4 animate-fade-in rounded-lg p-4 ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            <div className="flex items-center">
              <span className="mr-2 text-xl">
                {message.type === 'success' ? '✅' : '❌'}
              </span>
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Dernière mise à jour */}
        {lastUpdate && (
          <div className="mt-4 rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-900">
              <strong>Dernière revalidation :</strong>{' '}
              {new Date(lastUpdate).toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'medium',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Explication */}
      <div className="rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 p-6">
        <h3 className="mb-3 flex items-center text-lg font-semibold text-amber-900">
          <span className="mr-2">💡</span>
          Comment fonctionne le cache persistant ?
        </h3>
        <ol className="space-y-2 text-sm text-amber-800">
          <li className="flex items-start">
            <span className="mr-2 font-bold">1.</span>
            <span>
              Vous saisissez une valeur dans l'input et cliquez sur "Muter le cache"
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 font-bold">2.</span>
            <span>
              La <strong>Server Action</strong> stocke votre valeur dans le cache serveur (en mémoire)
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 font-bold">3.</span>
            <span>
              Le cache Next.js est revalidé avec <code className="rounded bg-amber-200 px-1">revalidateTag</code>
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 font-bold">4.</span>
            <span>
              La page se rafraîchit et affiche votre nouvelle valeur
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 font-bold">5.</span>
            <span>
              <strong>Rechargez la page (F5)</strong> : votre valeur est toujours là ! 🎉
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 font-bold">6.</span>
            <span>
              Le cache persiste jusqu'au redémarrage du serveur ou pendant 3 minutes
            </span>
          </li>
        </ol>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-600">Données actuelles</p>
          <p className="mt-1 truncate text-sm font-semibold text-gray-900" title={currentData}>
            {currentData || 'N/A'}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-600">État</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {isPending ? '⏳ En cours' : '✅ Prêt'}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-600">Type de cache</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">Next.js + Axios</p>
        </div>
      </div>

      {/* Affichage détaillé des données */}
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-3 text-lg font-semibold text-gray-800">📊 Données en temps réel</h3>
        <div 
          className={`rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 transition-all duration-300 ${
            isDataUpdated ? 'scale-105 ring-4 ring-green-400 ring-opacity-50' : ''
          }`}
        >
          <p className="mb-2 text-sm font-medium text-gray-600">Valeur actuelle :</p>
          <pre className={`overflow-auto text-base font-mono text-gray-900 transition-all duration-300 ${
            isDataUpdated ? 'text-green-600 font-bold' : ''
          }`}>
            {currentData}
          </pre>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>Données initiales SSR : {initialData}</span>
          <span className={currentData !== initialData ? 'font-semibold text-green-600' : ''}>
            {currentData !== initialData ? '✨ Modifié' : '📦 Original'}
          </span>
        </div>
      </div>
    </div>
  );
}
