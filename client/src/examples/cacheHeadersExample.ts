/**
 * Exemples d'utilisation de la configuration des headers de cache
 * 
 * Ce fichier montre comment utiliser l'option allowedHeaders pour contrôler
 * quels headers HTTP sont conservés dans le cache serveur.
 */

import { useServerService } from '@/hooks/useServerService';
import { serviceSelector } from '@/commands/serviceSelector';
import AxiosInstance from '@/lib/axiosInstance';

/**
 * Exemple 1 : Conserver des headers personnalisés via useServerService
 */
export async function exampleWithCustomHeaders() {
  const result = await useServerService({
    serviceKey: 'api-with-custom-headers',
    fetcher: serviceSelector(async (axios) => {
      const response = await axios.get('/api/data');
      return response.data;
    }),
    options: {
      cache: {
        // Ces headers seront conservés dans le cache en plus des headers par défaut
        allowedHeaders: ['x-api-version', 'x-rate-limit-remaining', 'etag'],
        persist: true,
        lifeTime: 300, // 5 minutes
      }
    }
  });

  return result;
}

/**
 * Exemple 2 : Utilisation directe avec AxiosInstance
 */
export async function exampleWithAxiosInstance() {
  const axios = AxiosInstance({
    headers: {
      Authorization: 'Bearer token123',
    },
    cache: {
      allowedHeaders: ['x-signature', 'x-tag'],
      lifeTime: 600, // 10 minutes
    },
    ssr: true,
  });

  const response = await axios.get('/api/secure-endpoint');
  return response.data;
}

/**
 * Exemple 3 : API avec ETag pour validation conditionnelle
 */
export async function exampleWithETag() {
  const result = await useServerService({
    serviceKey: 'resource-with-etag',
    fetcher: serviceSelector(async (axios) => {
      const response = await axios.get('/api/resource');
      // Le header ETag sera conservé dans le cache
      return response.data;
    }),
    options: {
      cache: {
        allowedHeaders: ['etag', 'last-modified', 'cache-control'],
        persist: true,
      },
      tags: ['resources'],
    }
  });

  return result;
}

/**
 * Exemple 4 : API avec headers de versioning
 */
export async function exampleWithVersioning() {
  const result = await useServerService({
    serviceKey: 'versioned-api',
    fetcher: serviceSelector(async (axios) => {
      const response = await axios.get('/api/v2/users');
      return response.data;
    }),
    options: {
      cache: {
        allowedHeaders: [
          'x-api-version',
          'x-deprecation-warning',
          'x-rate-limit-remaining',
          'x-rate-limit-reset'
        ],
      }
    }
  });

  return result;
}

/**
 * Exemple 5 : Sans headers personnalisés (utilise seulement les headers par défaut)
 */
export async function exampleWithDefaultHeaders() {
  const result = await useServerService({
    serviceKey: 'simple-api',
    fetcher: serviceSelector(async (axios) => {
      const response = await axios.get('/api/simple');
      return response.data;
    }),
    // Pas d'option cache.allowedHeaders
    // Seuls les headers par défaut seront conservés:
    // - content-type
    // - content-length
    // - access-control-allow-credentials
  });

  return result;
}
