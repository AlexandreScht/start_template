import { type ApiRequests } from '@/interfaces/clientApi';

// Fonction helper pour simuler un délai réseau
const simulateNetworkDelay = (ms: number = 1000) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Service simple qui respecte le type setRequest<undefined, true>
export const simple: ApiRequests.Perf.simple = ((...args: any[]) => async (axios) => {
  // Simuler un délai réseau de 1 seconde
  await simulateNetworkDelay(350);
  
  // Log pour debug (optionnel)
  console.log('🚀 Service simple appelé', {
    timestamp: new Date().toISOString(),
    side: typeof window === 'undefined' ? 'server' : 'client',
  });
  
  // Retourner true comme spécifié dans le type
  return true;
}) as ApiRequests.Perf.simple;
