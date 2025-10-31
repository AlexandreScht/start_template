import { type ApiRequests } from '@/interfaces/clientApi';
import apiRoutes from '@/router/api';

const {
  api: { test: router },
} = apiRoutes;

// Service simple qui fait une vraie requête HTTP pour tester le cache
export const simple = () => async (axios) => {
  try {
    console.log('🚀 Service simple appelé', {
      timestamp: new Date().toISOString(),
      side: typeof window === 'undefined' ? 'server' : 'client',
    });
    
    
    const response = await axios.get(router.simple());
    return response.data;
    
  } catch (error) {
    console.log(error);
    throw error;
  }
};
