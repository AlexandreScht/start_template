'use server';

import { revalidateServerCache } from '@/hooks/revalidateServer';
import { revalidatePath } from 'next/cache';
import { setServerCacheValue, deleteServerCacheValue } from '@/lib/serverCache';

/**
 * Server Action pour muter les données avec une valeur personnalisée
 * 
 * @param inputValue - La nouvelle valeur à stocker dans le cache
 * @returns Résultat de la mutation avec les nouvelles données
 */
export async function mutateAndRevalidateDemo(inputValue: string) {
  try {
    // Validation
    if (!inputValue || inputValue.trim() === '') {
      return {
        success: false,
        message: 'La valeur ne peut pas être vide',
        newData: null,
      };
    }

    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 500));

    const newData = inputValue.trim();
    const cacheKey = 'ssrdemo-simple-value';

    // Stocker la nouvelle valeur dans le cache serveur
    setServerCacheValue(cacheKey, newData);

    // Dans un cas réel, on appellerait l'API ici :
    // const { data, error } = await mutateAndRevalidate(
    //   (services) => services.simple.update({ value: newData }),
    //   ['ssrdemo-simple']
    // );
    // if (error) throw new Error(error.err);

    // Revalider le cache Next.js pour forcer le rechargement
    await revalidateServerCache('ssrdemo-simple');
    revalidatePath('/ssrdemo');

    console.log('[SERVER ACTION] Cache updated with:', newData);

    return { 
      success: true, 
      message: 'Données mutées et mises en cache avec succès !',
      newData,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[SERVER ACTION] Erreur:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      newData: null,
    };
  }
}

/**
 * Server Action pour revalider les caches et supprimer la valeur mutée
 * Cela force un nouvel appel API pour récupérer les données originales
 */
export async function revalidateMultipleDemoCaches() {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const cacheKey = 'ssrdemo-simple-value';
    
    // Supprimer la valeur mutée du cache serveur
    deleteServerCacheValue(cacheKey);
    console.log('[SERVER ACTION] Deleted mutated cache value');

    // Revalider les caches Next.js
    await revalidateServerCache('ssrdemo-simple');
    await revalidateServerCache('ssrdemo');
    
    // Forcer le rechargement de la page
    revalidatePath('/ssrdemo');

    return { 
      success: true, 
      message: 'Cache revalidé ! Les données originales vont être rechargées.',
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
