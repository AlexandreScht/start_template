'use client';

import { useService } from '@/hooks/useService';
import { performanceMonitor } from '@/utils/performanceMonitor';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface Stats {
  totalRequests: number;
  minTime: number;
  maxTime: number;
  totalDuration: number;
  requestsPerSecond: number;
}

const INITIAL_STATS: Stats = {
  totalRequests: 0,
  minTime: Infinity,
  maxTime: 0,
  totalDuration: 0,
  requestsPerSecond: 0,
};

const TEST_DURATION = 5_000; // 30sec

export default function ApiPerformanceTest() {
  // ----------------------- STATE & REFS ----------------------------------
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [requestIndex, setRequestIndex] = useState<number | null>(null); // null = aucune requête active

  // Réfs temporelles
  const startTimeRef = useRef<number>(0);
  const intervalIdRef = useRef<number>();
  const timeoutIdRef = useRef<number>();
  const isRunningRef = useRef(false);

  // ------------------------ ACTIONS --------------------------------------
  const startTest = useCallback(() => {
    // Reset state
    performanceMonitor.clear();
    setStats(INITIAL_STATS);
    setIsCompleted(false);
    setProgress(0);
    setRequestIndex(0);

    startTimeRef.current = performance.now();
    isRunningRef.current = true;
    setIsRunning(true);

    // Met à jour la barre de progression toutes les 100ms
    intervalIdRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const pct = Math.min(1, elapsed / TEST_DURATION);
      setProgress(pct * 100);
    }, 100);

    // Sécurise la fin de test au bout de 30s
    timeoutIdRef.current = window.setTimeout(() => {
      if (isRunningRef.current) {
        isRunningRef.current = false;
        setIsRunning(false);
        setIsCompleted(true);
        setProgress(100);
      }
    }, TEST_DURATION);
  }, []);

  const stopTest = useCallback(() => {
    isRunningRef.current = false;
    setIsRunning(false);
    setIsCompleted(true);

    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
  }, []);

  /**
   * Mise à jour des statistiques & déclenchement dʼune nouvelle requête
   * lorsquʼune réponse arrive.
   */
  const handleRequestComplete = useCallback((duration: number) => {
    // 1. Agrège les stats
    setStats(prev => {
      const total = prev.totalRequests + 1;
      const totalDuration = prev.totalDuration + duration;
      const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
      return {
        totalRequests: total,
        minTime: Math.min(prev.minTime, duration),
        maxTime: Math.max(prev.maxTime, duration),
        totalDuration,
        requestsPerSecond: elapsedSec > 0 ? total / elapsedSec : 0,
      };
    });

    // 2. Relance si on est toujours dans la fenêtre de temps
    const stillInWindow = performance.now() - startTimeRef.current < TEST_DURATION;
    if (isRunningRef.current && stillInWindow) {
      setRequestIndex(prev => (typeof prev === 'number' ? prev + 1 : 0));
    }
  }, []);

  // ----------------------- RENDER ----------------------------------------
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">Test de Performance API</h1>

        {/* Description + boutons */}
        <div className="mb-6">
          <p className="mb-4 text-gray-600">
            Ce test enchaîne autant de requêtes <code>v.simple</code> que possible pendant&nbsp;30&nbsp;secondes. Il
            mesure le délai minimum, maximum et le débit en temps réel.
          </p>

          <div className="flex gap-4">
            <button
              onClick={startTest}
              disabled={isRunning}
              className={`rounded-lg px-6 py-3 font-medium ${
                isRunning ? 'cursor-not-allowed bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRunning ? 'Test en cours…' : 'Démarrer le test'}
            </button>

            {isRunning && (
              <button
                onClick={stopTest}
                className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700"
              >
                Arrêter le test
              </button>
            )}
          </div>
        </div>

        {/* Barre de progression */}
        {(isRunning || isCompleted) && (
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-sm text-gray-600">
              <span>Progression</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-3 bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Statistiques temps réel */}
        {(isRunning || isCompleted) && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="text-sm font-medium text-blue-800">Requêtes envoyées</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.totalRequests}</p>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <h3 className="text-sm font-medium text-green-800">Temps minimum (ms)</h3>
              <p className="text-2xl font-bold text-green-900">
                {Number.isFinite(stats.minTime) ? stats.minTime.toFixed(2) : '--'}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-4">
              <h3 className="text-sm font-medium text-red-800">Temps maximum (ms)</h3>
              <p className="text-2xl font-bold text-red-900">{stats.maxTime.toFixed(2)}</p>
            </div>

            <div className="rounded-lg bg-purple-50 p-4">
              <h3 className="text-sm font-medium text-purple-800">Req/sec</h3>
              <p className="text-2xl font-bold text-purple-900">{stats.requestsPerSecond.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Requête active (1 à la fois) */}
        {requestIndex !== null && (
          <RequestItem
            key={requestIndex}
            index={requestIndex}
            onComplete={handleRequestComplete}
            isRunning={isRunningRef}
          />
        )}
      </div>
    </div>
  );
}

// ------------------- SUB‑COMPONENTS --------------------------------------
interface RequestItemProps {
  index: number;
  onComplete: (duration: number) => void;
  isRunning: React.MutableRefObject<boolean>;
}

function RequestItem({ index, onComplete, isRunning }: RequestItemProps) {
  const startStampRef = useRef<number>(performance.now());
  const endTimerRef = useRef(performanceMonitor.startTimer('apiRequest'));

  // Clé unique : index + timestamp
  const { data, error } = useService(v => v.simple(undefined, `req-${index}-${startStampRef.current}`), {
    cache: {
      dedupingInterval: 0,
      revalidateOnFocus: false,
      refreshInterval: 0,
    },
  });

  useEffect(() => {
    if (!isRunning.current) return;
    if (data || error) {
      endTimerRef.current({ index, success: Boolean(data) });
      const duration = performance.now() - startStampRef.current;
      onComplete(duration);
    }
  }, [data, error, index, onComplete, isRunning]);

  return null;
}
