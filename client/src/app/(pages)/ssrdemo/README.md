# SSR Demo - Cache & Revalidation

## Vue d'ensemble

Cette page démontre le système de cache SSR avec revalidation en temps réel.

## Structure

```
ssrdemo/
├── page.tsx          # Page serveur avec useServerService
├── actions.ts        # Server Actions pour mutation
└── README.md         # Documentation
```

## Composants

### 1. page.tsx (Server Component)

**Rôle** : Page serveur qui charge les données avec cache

```typescript
const { data, success, error } = await useServerService({
  serviceKey: 'ssrdemo-simple',
  fetcher: serviceSelector(v => v.simple()),
  options: {
    revalidate: 180,  // Cache de 3 minutes
    tags: ['ssrdemo'],
  },
});
```

**Fonctionnalités** :
- ✅ Chargement SSR des données
- ✅ Cache Next.js avec `unstable_cache`
- ✅ Revalidation automatique après 3 minutes
- ✅ Tags pour revalidation manuelle

### 2. SSRDemoClient.tsx (Client Component)

**Rôle** : Interface utilisateur pour déclencher les mutations

**Fonctionnalités** :
- ✅ Boutons pour déclencher les Server Actions
- ✅ État de chargement avec `useTransition`
- ✅ Messages de feedback
- ✅ Affichage de la dernière mise à jour

### 3. actions.ts (Server Actions)

**Rôle** : Actions serveur pour mutation et revalidation

#### mutateAndRevalidateDemo()
```typescript
// Simule une mutation et revalide le cache
await revalidateServerCache('ssrdemo-simple');
revalidatePath('/ssrdemo');
```

#### revalidateMultipleDemoCaches()
```typescript
// Revalide plusieurs caches
await revalidateServerCache('ssrdemo-simple');
await revalidateServerCache('ssrdemo');
```

## Flux de données

### Chargement initial

```
1. Utilisateur accède à /ssrdemo
   ↓
2. Next.js exécute page.tsx (Server Component)
   ↓
3. useServerService charge les données
   ↓
4. unstable_cache vérifie le cache
   ↓
5a. Cache HIT → Retour immédiat ⚡
5b. Cache MISS → Appel API → Mise en cache
   ↓
6. HTML généré et envoyé au client
   ↓
7. Hydratation du Client Component
```

### Mutation et revalidation

```
1. Utilisateur clique sur "Muter & Revalider"
   ↓
2. useTransition démarre (isPending = true)
   ↓
3. Server Action mutateAndRevalidateDemo() est appelée
   ↓
4. revalidateServerCache('ssrdemo-simple') invalide le cache
   ↓
5. revalidatePath('/ssrdemo') force le refresh
   ↓
6. Next.js re-render la page
   ↓
7. useServerService refait l'appel API (cache invalidé)
   ↓
8. Nouvelles données affichées
   ↓
9. useTransition termine (isPending = false)
```

## Utilisation

### Accéder à la page

```
http://localhost:3000/ssrdemo
```

### Tester le cache

1. **Premier chargement** : Les données sont chargées depuis l'API
2. **Rechargement** : Les données viennent du cache (instantané)
3. **Clic sur "Muter & Revalider"** : Le cache est invalidé
4. **Rechargement** : Nouvelles données chargées depuis l'API

### Observer les logs

En mode développement, vous verrez :

```bash
[SERVER] FetchServerSide - Prefetching key: ssrdemo-simple
[AXIOS-CACHE] request-123: Cache MISS
🌐 API CALL GET /api/simple
[AXIOS-CACHE] request-123: Storing response
⚡ CACHE HIT GET /api/simple  # Lors du rechargement
[REVALIDATE] Revalidation de ssrdemo-simple  # Après mutation
```

## Configuration du cache

### Durées de vie

```typescript
// Cache Next.js
revalidate: 180  // 3 minutes

// Cache Axios (optionnel)
cache: {
  lifeTime: 300,  // 5 minutes
}
```

### Tags de cache

```typescript
tags: ['ssrdemo', 'ssrdemo-simple']

// Permet de revalider par tag
await revalidateServerCache('ssrdemo');  // Invalide tous les caches avec ce tag
```

## Personnalisation

### Modifier la durée du cache

```typescript
// page.tsx
options: {
  revalidate: 60,  // 1 minute au lieu de 3
}
```

### Ajouter une vraie mutation

```typescript
// actions.ts
export async function mutateAndRevalidateDemo() {
  // Remplacer la simulation par un vrai appel API
  const { data, error } = await mutateAndRevalidate(
    (services) => services.simple.update({ value: 'new value' }),
    ['ssrdemo-simple']
  );

  if (error) {
    return { success: false, message: error.err };
  }

  revalidatePath('/ssrdemo');
  return { success: true, message: 'Données mises à jour !' };
}
```

### Ajouter plus de données

```typescript
// page.tsx
const { data: simpleData } = await useServerService({
  serviceKey: 'ssrdemo-simple',
  fetcher: serviceSelector(v => v.simple()),
});

const { data: usersData } = await useServerService({
  serviceKey: 'ssrdemo-users',
  fetcher: serviceSelector(v => v.users.getAll()),
  options: {
    revalidate: 300,  // 5 minutes
    tags: ['ssrdemo', 'users'],
  },
});
```

## Cas d'usage réels

### 1. Dashboard avec données en temps réel

```typescript
// Dashboard avec cache court
const { data: stats } = await useServerService({
  serviceKey: 'dashboard-stats',
  fetcher: serviceSelector(v => v.stats.getToday()),
  options: {
    revalidate: 30,  // 30 secondes
    tags: ['dashboard'],
  },
});
```

### 2. Liste de produits avec mutations

```typescript
// Liste de produits
const { data: products } = await useServerService({
  serviceKey: 'products-list',
  fetcher: serviceSelector(v => v.products.getAll()),
  options: {
    revalidate: 300,  // 5 minutes
    tags: ['products'],
  },
});

// Action pour ajouter un produit
export async function addProduct(formData: FormData) {
  await mutateAndRevalidate(
    (s) => s.products.create({ name: formData.get('name') }),
    ['products-list', 'products-count']
  );
  revalidatePath('/products');
}
```

### 3. Profil utilisateur avec cache long

```typescript
// Profil utilisateur (rarement modifié)
const { data: profile } = await useServerService({
  serviceKey: `user-profile-${userId}`,
  fetcher: serviceSelector(v => v.users.getProfile({ id: userId })),
  options: {
    revalidate: 3600,  // 1 heure
    tags: ['users', `user-${userId}`],
  },
});
```

## Debugging

### Vérifier le cache

```typescript
// Ajouter des logs dans page.tsx
console.log('[SSR DEMO] Data loaded:', {
  data,
  timestamp: new Date().toISOString(),
  cached: data !== undefined,
});
```

### Forcer le rechargement

```typescript
// Désactiver le cache temporairement
options: {
  revalidate: false,  // Pas de cache
}
```

### Voir les tags de cache

```typescript
// Dans actions.ts
console.log('[REVALIDATE] Tags:', ['ssrdemo-simple', 'ssrdemo']);
```

## Bonnes pratiques

1. ✅ **Utiliser des serviceKey uniques** : Éviter les collisions de cache
2. ✅ **Choisir des durées adaptées** : Court pour données volatiles, long pour données statiques
3. ✅ **Grouper les tags** : Facilite la revalidation en masse
4. ✅ **Gérer les erreurs** : Toujours vérifier `success` et `error`
5. ✅ **Logger en dev** : Aide au debugging

## Ressources

- [Next.js unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
- [Next.js revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [useTransition](https://react.dev/reference/react/useTransition)
