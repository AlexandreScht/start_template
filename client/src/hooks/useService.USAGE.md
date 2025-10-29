# useService - Guide d'utilisation

## Vue d'ensemble

Le hook `useService` supporte deux modes d'utilisation :
1. **Avec `fetcher`** : Le type est automatiquement inféré depuis le service
2. **Sans `fetcher`** : Le type doit être spécifié explicitement via un générique

## Mode 1 : Avec fetcher (Type inféré)

### Utilisation

```typescript
'use client';

import { useService } from '@/hooks/useService';
import serviceSelector from '@/hooks/serviceSelector';

export function UserList() {
  // Le type de 'data' est automatiquement inféré depuis le service
  const { data, isLoading, error } = useService({
    serviceKey: 'users',
    fetcher: serviceSelector(v => v.users.getAll()),
  });

  // TypeScript sait que data est User[] | undefined
  return (
    <ul>
      {data?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

### Avantages
- ✅ Type automatiquement inféré depuis `clientApi.d.ts`
- ✅ Pas besoin de spécifier le type manuellement
- ✅ Sécurité du typage garantie

### Exemple avec service simple

```typescript
// Dans clientApi.d.ts
namespace ApiRequests {
  namespace Perf {
    type simple = setRequest<undefined, string>;
  }
}

// Dans le composant
const { data } = useService({
  serviceKey: 'perf-simple',
  fetcher: serviceSelector(v => v.simple()),
});

// data est de type: string | undefined
```

## Mode 2 : Sans fetcher (Type explicite)

### Utilisation

```typescript
'use client';

import { useService } from '@/hooks/useService';

export function CachedData() {
  // Le type de 'data' est spécifié via le générique
  const { data, isLoading, error } = useService<string>({
    serviceKey: 'cached-data',
  });

  // TypeScript sait que data est string | undefined
  return <div>{data}</div>;
}
```

### Cas d'usage

Ce mode est utile quand :
- Les données sont **pré-fetchées côté serveur** (SSR)
- Vous voulez uniquement **lire le cache** React Query
- Le `fetcher` n'est pas nécessaire car les données sont déjà disponibles

### Exemple avec données SSR

```typescript
// Page serveur (Server Component)
import { fetchServiceSSR } from '@/hooks/useServerServices';
import serviceSelector from '@/hooks/serviceSelector';

export default async function Page() {
  // Pré-fetch côté serveur
  const result = await fetchServiceSSR({
    fetcher: serviceSelector(v => v.users.getAll()),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientComponent />
    </HydrationBoundary>
  );
}

// Composant client
'use client';

export function ClientComponent() {
  // Lecture du cache sans fetcher
  const { data } = useService<User[]>({
    serviceKey: 'users',
  });

  // data est de type: User[] | undefined
  return <div>{data?.length} utilisateurs</div>;
}
```

## Comparaison des deux modes

| Critère | Avec fetcher | Sans fetcher |
|---------|-------------|--------------|
| **Type** | Inféré automatiquement | Spécifié manuellement |
| **Sécurité** | ✅ Garantie par TypeScript | ⚠️ Dépend du générique fourni |
| **Cas d'usage** | Fetch de données | Lecture du cache |
| **Erreur si pas de cache** | ❌ Lance une exception | ❌ Lance une exception |
| **Syntaxe** | `useService({ fetcher })` | `useService<Type>({})` |

## Options React Query

Les deux modes supportent toutes les options de React Query :

```typescript
const { data } = useService<string>({
  serviceKey: 'data',
  options: {
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    enabled: true,
    refetchOnWindowFocus: false,
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Error:', error),
  },
});
```

## Exemples complets

### Exemple 1 : Fetch avec type inféré

```typescript
'use client';

import { useService } from '@/hooks/useService';
import serviceSelector from '@/hooks/serviceSelector';

export function ProductList() {
  const { data, isLoading, error, refetch } = useService({
    serviceKey: 'products',
    fetcher: serviceSelector(v => v.products.getAll()),
    options: {
      staleTime: 5 * 60 * 1000,
    },
  });

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div>
      <button onClick={() => refetch()}>Rafraîchir</button>
      <ul>
        {data?.map(product => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Exemple 2 : Cache SSR avec type explicite

```typescript
'use client';

import { useService } from '@/hooks/useService';

interface User {
  id: string;
  name: string;
  email: string;
}

export function UserProfile() {
  // Lecture du cache pré-fetché côté serveur
  const { data, isSuccess } = useService<User>({
    serviceKey: 'user-profile',
  });

  if (!isSuccess || !data) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}
```

### Exemple 3 : Combinaison des deux modes

```typescript
'use client';

import { useService } from '@/hooks/useService';
import serviceSelector from '@/hooks/serviceSelector';

export function Dashboard() {
  // Mode 1 : Avec fetcher (type inféré)
  const { data: users } = useService({
    serviceKey: 'users',
    fetcher: serviceSelector(v => v.users.getAll()),
  });

  // Mode 2 : Sans fetcher (type explicite, données SSR)
  const { data: config } = useService<AppConfig>({
    serviceKey: 'app-config',
  });

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Utilisateurs: {users?.length}</p>
      <p>Version: {config?.version}</p>
    </div>
  );
}
```

## Gestion des erreurs

Sans fetcher, si le cache n'existe pas, une exception est lancée :

```typescript
const { data, error } = useService<string>({
  serviceKey: 'non-existent-key',
});

// Si aucune donnée en cache, error contiendra :
// ClientException: 'useService: aucun cache disponible, le fetcher est obligatoire'
```

## Bonnes pratiques

1. **Préférer le mode avec fetcher** pour les nouvelles requêtes
2. **Utiliser le mode sans fetcher** uniquement pour lire le cache SSR
3. **Toujours spécifier `serviceKey`** pour identifier le cache
4. **Gérer les erreurs** avec `error` et `isError`
5. **Vérifier `isSuccess`** avant d'utiliser `data`

## Type de retour

Les deux modes retournent un `UseQueryResult` de React Query :

```typescript
{
  data: TData | undefined,
  isLoading: boolean,
  isFetching: boolean,
  isSuccess: boolean,
  isError: boolean,
  error: Error | null,
  refetch: () => void,
  // ... autres propriétés React Query
}
```
