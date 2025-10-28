# Vérification du flux SSR avec React Query

## Logs ajoutés pour tracer le flux

### 1. Côté Serveur (FetchServerSide)
```
[SERVER] FetchServerSide - Prefetching key: demoTest
[SERVER] FetchServerSide - Prefetch completed. Keys: ['demoTest']
```

### 2. Côté Serveur (useService dans le composant 'use client')
```
[SERVER] useService - cacheKey: demoTest, hasFetcher: false
```

### 3. Côté Client (useService)
```
[CLIENT] useService - cacheKey: demoTest, hasFetcher: false
```

## Comment vérifier que tout fonctionne correctement

### ✅ Flux correct attendu :

1. **Server Component** (`page.tsx`) :
   - `FetchServerSide` prefetch les données avec la clé `demoTest`
   - Log: `[SERVER] FetchServerSide - Prefetching key: demoTest`

2. **SSR du composant 'use client'** (`Demo`) :
   - `useService` est appelé côté serveur sans fetcher
   - Retourne `{}` pour permettre le rendu
   - Log: `[SERVER] useService - cacheKey: demoTest, hasFetcher: false`

3. **Hydration** :
   - `HydrationBoundary` transfert les données prefetchées au client

4. **Client** (`Demo`) :
   - `useService` lit les données du cache React Query
   - Log: `[CLIENT] useService - cacheKey: demoTest, hasFetcher: false`
   - `useQuery` trouve les données dans le cache → pas de nouvelle requête

## Points de vérification

### ✅ Les clés doivent correspondre :
- **FetchServerSide** : `services={{ demoTest: ... }}`
- **useService** : `serviceKey: 'demoTest'`

### ✅ Pas de nouvelle requête côté client :
- Si vous voyez une requête réseau côté client, c'est que les clés ne correspondent pas
- Vérifiez les logs pour comparer les `cacheKey`

### ✅ Données instantanées :
- `isLoading` doit être `false` immédiatement
- `data` doit être disponible dès le premier rendu client

## Exemple de configuration correcte

### page.tsx (Server Component)
```tsx
export default async function DemoPage() {
  return (
    <FetchServerSide services={{ demoTest: serviceSelector(v => v.simple()) }}>
      <Demo />
    </FetchServerSide>
  );
}
```

### demo.tsx (Client Component)
```tsx
'use client';

export default function Demo() {
  const { data, isLoading } = useService({
    serviceKey: 'demoTest', // ← Même clé que dans FetchServerSide
  });
  
  // isLoading sera false immédiatement
  // data contiendra les données prefetchées
}
```

## Dépannage

### Problème : Nouvelle requête côté client
**Cause** : Les clés ne correspondent pas
**Solution** : Vérifiez que `serviceKey` dans `useService` correspond exactement à la clé dans `FetchServerSide`

### Problème : `isLoading` reste à `true`
**Cause** : Les données n'ont pas été prefetchées ou la clé est différente
**Solution** : Vérifiez les logs pour voir si le prefetch s'est bien exécuté

### Problème : Erreur "Aucune donnée en cache"
**Cause** : `useQuery` ne trouve pas les données dans le cache
**Solution** : Assurez-vous que `FetchServerSide` entoure bien le composant qui utilise `useService`
