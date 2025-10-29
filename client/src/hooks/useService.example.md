# Hook useService - Guide d'utilisation

## Vue d'ensemble

Le hook `useService` est conçu pour fonctionner avec `serviceSelector` et utilise React Query pour la gestion du cache côté client.

## Structure

### serviceSelector
Le `serviceSelector` retourne un objet `BrandedServiceSelector` :
```typescript
{
  __brand: 'ServiceSelector',
  fn: (axios: Services.Axios.instance) => Promise<R>
}
```

### useService
Le hook accepte un `BrandedServiceSelector` et retourne un objet `UseQueryResult` de React Query.

## Exemples d'utilisation

### 1. Utilisation basique

```typescript
'use client';

import { useService } from '@/hooks/useService';
import serviceSelector from '@/hooks/serviceSelector';

export function UserList() {
  const { data, isLoading, error, isSuccess } = useService({
    serviceKey: 'users-list',
    fetcher: serviceSelector(services => services.users.getAll()),
  });

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  
  return (
    <ul>
      {data?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

### 2. Avec options React Query

```typescript
'use client';

import { useService } from '@/hooks/useService';
import serviceSelector from '@/hooks/serviceSelector';

export function UserProfile() {
  const { data, isLoading, refetch, isFetching } = useService({
    serviceKey: 'user-profile',
    fetcher: serviceSelector(services => services.users.getProfile()),
    options: {
      initialState: null,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  });

  return (
    <div>
      <button onClick={() => refetch()} disabled={isFetching}>
        Rafraîchir
      </button>
      {isLoading && <div>Chargement...</div>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

### 3. Avec paramètres dynamiques

```typescript
'use client';

import { useService } from '@/hooks/useService';
import serviceSelector from '@/hooks/serviceSelector';

export function UserDetails({ userId }: { userId: string }) {
  const { data, isLoading, error } = useService({
    serviceKey: `user-${userId}`,
    fetcher: serviceSelector(services => services.users.getById(userId)),
    options: {
      enabled: !!userId, // Ne lance la requête que si userId existe
      staleTime: 5 * 60 * 1000,
    },
  });

  if (!userId) return <div>Sélectionnez un utilisateur</div>;
  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div>
      <h2>{data?.name}</h2>
      <p>{data?.email}</p>
    </div>
  );
}
```

### 4. Avec état initial

```typescript
'use client';

import { useService } from '@/hooks/useService';
import serviceSelector from '@/hooks/serviceSelector';

export function ProductList() {
  const { data, isLoading } = useService({
    serviceKey: 'products',
    fetcher: serviceSelector(services => services.products.getAll()),
    options: {
      initialState: [], // État initial pour éviter undefined
      staleTime: 2 * 60 * 1000,
    },
  });

  return (
    <div>
      {isLoading && <div>Chargement...</div>}
      <ul>
        {data.map(product => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 5. Gestion avancée des erreurs

```typescript
'use client';

import { useService } from '@/hooks/useService';
import serviceSelector from '@/hooks/serviceSelector';

export function DataFetcher() {
  const { data, isLoading, error, isError, refetch } = useService({
    serviceKey: 'important-data',
    fetcher: serviceSelector(services => services.data.fetch()),
    options: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: (error) => {
        console.error('Erreur lors du chargement:', error);
      },
      onSuccess: (data) => {
        console.log('Données chargées avec succès:', data);
      },
    },
  });

  if (isLoading) return <div>Chargement...</div>;
  
  if (isError) {
    return (
      <div>
        <p>Erreur: {error?.message}</p>
        <button onClick={() => refetch()}>Réessayer</button>
      </div>
    );
  }

  return <div>{JSON.stringify(data)}</div>;
}
```

## Options disponibles

### Options React Query principales

- **`initialState`**: Données initiales avant le premier chargement
- **`staleTime`**: Durée (ms) avant que les données soient considérées obsolètes
- **`gcTime`**: Durée (ms) avant garbage collection du cache
- **`retry`**: Nombre de tentatives en cas d'erreur (boolean ou number)
- **`retryDelay`**: Délai entre les tentatives (number ou fonction)
- **`enabled`**: Active/désactive la requête (boolean)
- **`refetchOnWindowFocus`**: Refetch au focus de la fenêtre (boolean)
- **`refetchOnReconnect`**: Refetch à la reconnexion (boolean)
- **`onSuccess`**: Callback appelé en cas de succès
- **`onError`**: Callback appelé en cas d'erreur

## Type de retour (UseQueryResult)

Le hook retourne un objet avec :

- **`data`**: Les données typées (inférées depuis le serviceSelector)
- **`isLoading`**: true pendant le chargement initial
- **`isFetching`**: true pendant toute requête (initial ou refetch)
- **`isSuccess`**: true si la requête a réussi
- **`isError`**: true si la requête a échoué
- **`error`**: L'erreur éventuelle
- **`refetch()`**: Fonction pour relancer la requête
- **`status`**: 'idle' | 'loading' | 'error' | 'success'

## Typage automatique

Le type de retour est automatiquement inféré depuis le `serviceSelector` :

```typescript
// Si votre service retourne User[]
const fetcher = serviceSelector(services => services.users.getAll());

// Alors data sera typé comme User[] | undefined
const { data } = useService({ fetcher });
```

## Notes importantes

1. **Mode client uniquement** : Le hook ne peut être utilisé que dans les composants clients (`'use client'`)
2. **serviceKey** : Utilisé comme clé de cache React Query. Doit être unique par requête
3. **Cache automatique** : React Query gère automatiquement le cache côté client
4. **Axios instance** : L'instance Axios est créée avec `ssr: false` pour le mode client
