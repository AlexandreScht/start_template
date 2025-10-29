# Système de Cache SSR - Documentation

## Vue d'ensemble

Le système de cache SSR combine deux technologies complémentaires :
1. **axios-cache-interceptor** : Cache au niveau HTTP pour les requêtes API
2. **Next.js unstable_cache** : Cache au niveau des données pour les Server Components

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    useServerService                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Next.js unstable_cache                       │   │
│  │  - Cache les résultats des fonctions                 │   │
│  │  - Revalidation avec tags                            │   │
│  │  - Durée de vie configurable                         │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         AxiosInstance (SSR mode)                     │   │
│  │  - Ajoute X-Cache-Key header                         │   │
│  │  - Configure axios-cache-interceptor                 │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      axios-cache-interceptor                         │   │
│  │  - Cache HTTP au niveau requête                      │   │
│  │  - Stockage LRU en mémoire                           │   │
│  │  - Interprétation des headers de cache               │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│                     ▼                                        │
│                API Backend                                   │
└─────────────────────────────────────────────────────────────┘
```

## Composants du système

### 1. useServerService.ts

**Rôle** : Hook principal pour les appels SSR avec cache Next.js

**Fonctionnalités** :
- Cache avec `unstable_cache` de Next.js
- Revalidation par tags
- Type safety complet
- Gestion des erreurs

**Utilisation** :
```typescript
const { data, success, error } = await useServerService({
  serviceKey: 'users-list',  // Obligatoire : utilisé comme tag de cache
  fetcher: serviceSelector(v => v.users.getAll()),
  options: {
    revalidate: 180,  // 3 minutes (défaut)
    tags: ['users'],  // Tags additionnels pour revalidation
    cache: {
      lifeTime: 300,  // Cache axios de 5 minutes
    },
  },
});
```

### 2. axiosInstance.ts

**Rôle** : Création et configuration de l'instance Axios

**Fonctionnalités** :
- Mode SSR automatique
- Configuration du cache axios-cache-interceptor
- Ajout du header `X-Cache-Key`
- Intercepteurs pour logging et erreurs

**Configuration** :
```typescript
const axiosInstance = AxiosInstance({
  ssr: true,
  cacheKey: 'my-cache-key',  // Pour revalidation
  headers: { Authorization: token },
  cache: {
    lifeTime: 300,
    persist: false,
  },
});
```

### 3. revalidateServer.ts

**Rôle** : Fonctions utilitaires pour la revalidation du cache

**Fonctions** :

#### revalidateServerCache
```typescript
// Revalider un seul cache
await revalidateServerCache('users-list');
```

#### revalidateMultipleCaches
```typescript
// Revalider plusieurs caches
await revalidateMultipleCaches(['users-list', 'users-detail']);
```

#### mutateAndRevalidate
```typescript
// Effectuer une mutation et revalider automatiquement
const { data, error } = await mutateAndRevalidate(
  (services) => services.users.create(),
  ['users-list', 'users-count'],  // Caches à revalider
  { headers: { Authorization: token } }
);
```

### 4. cacheOption.ts

**Rôle** : Configuration par défaut du cache axios-cache-interceptor

**Fonctionnalités** :
- Stockage LRU en mémoire
- Génération de clés de cache
- Interprétation des headers `X-Cache-Option`
- Logging en développement

**Header personnalisé** :
```json
{
  "x-cache-option": "{\"cache\": 300, \"stale\": 60}"
}
```

### 5. configureCache.ts

**Rôle** : Combine la config par défaut avec les options personnalisées

**Options** :
```typescript
{
  lifeTime: 300,              // Durée de vie en secondes
  persist: false,             // Cache persistant (1 mois)
  enabled: (req) => true,     // Prédicat de cache
  serverConfig: (headers) => {...},  // Interpréteur custom
}
```

## Flux de données

### 1. Première requête (Cache MISS)

```
useServerService
  ↓
unstable_cache (MISS)
  ↓
AxiosInstance (ajoute X-Cache-Key)
  ↓
axios-cache-interceptor (MISS)
  ↓
API Backend
  ↓
Réponse stockée dans axios-cache
  ↓
Réponse stockée dans Next.js cache
  ↓
Retour à l'utilisateur
```

### 2. Requête suivante (Cache HIT)

```
useServerService
  ↓
unstable_cache (HIT) ⚡
  ↓
Retour immédiat (pas d'appel API)
```

### 3. Après revalidation

```
revalidateServerCache('users-list')
  ↓
Next.js invalide le cache
  ↓
Prochaine requête → Cache MISS → Nouvelle requête API
```

## Durées de cache

### Configuration par défaut (cache.ts)

```typescript
{
  DEFAULT_TIME_LIFE: 180,      // 3 minutes
  PERSIST_TIME_LIFE: 2678400,  // 1 mois
  CHECK_PERIOD: 180,           // 3 minutes
}
```

### Niveaux de cache

1. **Next.js unstable_cache** : Cache au niveau composant
   - Durée : `revalidate` option (défaut: 180s)
   - Revalidation : Par tags avec `revalidateTag()`

2. **axios-cache-interceptor** : Cache au niveau HTTP
   - Durée : `lifeTime` option (défaut: 180s)
   - Revalidation : Automatique après TTL

## Exemples d'utilisation

### Exemple 1 : Liste d'utilisateurs avec cache court

```typescript
// app/users/page.tsx
export default async function UsersPage() {
  const { data, success } = await useServerService({
    serviceKey: 'users-list',
    fetcher: serviceSelector(v => v.users.getAll()),
    options: {
      revalidate: 60,  // 1 minute
      tags: ['users'],
    },
  });

  if (!success) return <div>Erreur</div>;

  return (
    <ul>
      {data?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

### Exemple 2 : Configuration avec cache long

```typescript
// app/config/page.tsx
export default async function ConfigPage() {
  const { data } = await useServerService({
    serviceKey: 'app-config',
    fetcher: serviceSelector(v => v.config.get()),
    options: {
      revalidate: 3600,  // 1 heure
      tags: ['config'],
      cache: {
        persist: true,  // Cache de 1 mois
      },
    },
  });

  return <div>{data?.version}</div>;
}
```

### Exemple 3 : Action serveur avec revalidation

```typescript
// app/actions.ts
'use server';

import { revalidateServerCache } from '@/hooks/revalidateServer';
import serviceSelector from '@/hooks/serviceSelector';
import AxiosInstance from '@/libs/axiosInstance';

export async function createUser(formData: FormData) {
  const axios = AxiosInstance({ ssr: true });
  
  // Créer l'utilisateur
  await serviceSelector(v => v.users.create())(axios);
  
  // Revalider les caches liés
  await revalidateServerCache('users-list');
  await revalidateServerCache('users-count');
  
  return { success: true };
}
```

### Exemple 4 : Mutation avec revalidation automatique

```typescript
// app/actions.ts
'use server';

import { mutateAndRevalidate } from '@/hooks/revalidateServer';

export async function deleteUser(userId: string) {
  const { data, error } = await mutateAndRevalidate(
    (services) => services.users.delete({ id: userId }),
    ['users-list', 'users-count', `user-${userId}`],
  );

  return { success: !error, error };
}
```

## Bonnes pratiques

### 1. Nommage des clés de cache

```typescript
// ✅ Bon : Descriptif et unique
serviceKey: 'users-list'
serviceKey: 'user-profile-123'
serviceKey: 'products-category-electronics'

// ❌ Mauvais : Trop générique
serviceKey: 'data'
serviceKey: 'api'
```

### 2. Durées de revalidation

```typescript
// Données fréquemment modifiées
revalidate: 60  // 1 minute

// Données modérément modifiées
revalidate: 180  // 3 minutes (défaut)

// Données rarement modifiées
revalidate: 3600  // 1 heure

// Données statiques
revalidate: false  // Pas de revalidation automatique
```

### 3. Tags de cache

```typescript
// ✅ Bon : Tags hiérarchiques
tags: ['users', 'users-list']
tags: ['products', 'products-category-electronics']

// Permet de revalider par catégorie
await revalidateServerCache('users');  // Invalide tous les caches users
```

### 4. Gestion des erreurs

```typescript
const { data, success, error } = await useServerService({...});

if (!success) {
  // Logger l'erreur
  console.error('[SSR] Erreur:', error);
  
  // Afficher un fallback
  return <ErrorComponent message={error?.message} />;
}

// Utiliser les données
return <DataComponent data={data} />;
```

## Debugging

### Logs de cache

En mode développement, les logs suivants sont disponibles :

```
[AXIOS-CACHE] request-123: Cache MISS
[AXIOS-CACHE] request-123: Storing response
⚡ CACHE HIT GET /api/users
🌐 API CALL POST /api/users
[REVALIDATE] Revalidation de users-list
```

### Vérifier le cache

```typescript
// Dans un Server Component
const { data } = await useServerService({
  serviceKey: 'test',
  fetcher: serviceSelector(v => v.test()),
});

console.log('[CACHE TEST]', {
  cached: data !== undefined,
  timestamp: new Date().toISOString(),
});
```

## Limitations

1. **unstable_cache** : API instable de Next.js, peut changer
2. **Mémoire serveur** : Le cache est perdu au redémarrage
3. **Pas de cache distribué** : Chaque instance a son propre cache
4. **Tags limités** : Next.js limite le nombre de tags par cache

## Migration depuis l'ancien système

### Avant
```typescript
const { data } = await oldUseServerService(
  (services) => services.users.getAll(),
  { cache: { lifeTime: 300 } }
);
```

### Après
```typescript
const { data } = await useServerService({
  serviceKey: 'users-list',  // Nouveau : obligatoire
  fetcher: serviceSelector(v => v.users.getAll()),
  options: {
    revalidate: 300,
    cache: { lifeTime: 300 },
  },
});
```

## Ressources

- [Next.js unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
- [axios-cache-interceptor](https://axios-cache-interceptor.js.org/)
- [Next.js revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
