# Page de Démo SSR avec React Query

Cette page démontre l'utilisation de React Query avec Server-Side Rendering (SSR) dans Next.js.

## 📁 Fichiers créés

### 1. **Page SSR** (`page.tsx`)
- Composant serveur async qui prefetch les données
- Affiche les données directement côté serveur
- Hydrate les données pour les composants clients

### 2. **Hook personnalisé** (`/hooks/useServerData.ts`)
- Hook client pour accéder aux données prefetchées
- Type-safe avec les clés de services disponibles
- Compatible avec React Query

### 3. **Composant d'affichage** (`/components/ServerDataDisplay.tsx`)
- Composant client réutilisable
- Affiche les données avec gestion du loading et des erreurs
- Utilise le hook `useServerData`

## 🚀 Comment ça fonctionne

### Étape 1: Prefetch côté serveur
```tsx
const axiosInstance = AxiosInstance({ side: 'server' });
const simpleFetcher = PrepareServices.simple(undefined);

const services = {
  simple: () => simpleFetcher(axiosInstance),
};
```

### Étape 2: Hydratation avec PostsPage
```tsx
<PostsPage services={services}>
  {/* Vos composants clients */}
</PostsPage>
```

### Étape 3: Utilisation côté client
```tsx
const { data, isLoading, error } = useServerData('simple');
```

## 🎯 Avantages

- ✅ **SEO optimisé**: Les données sont rendues côté serveur
- ✅ **Performance**: Pas de waterfall de requêtes
- ✅ **Type-safety**: TypeScript strict sur les clés de services
- ✅ **Cache partagé**: Plusieurs composants peuvent utiliser les mêmes données
- ✅ **Hydratation automatique**: React Query gère la synchronisation

## 📝 Utilisation

### Ajouter un nouveau service

1. Créez votre service dans `/services/`
2. Exportez-le dans `/services/index.ts`
3. Le type sera automatiquement disponible dans `useServerData`

### Exemple avec plusieurs services

```tsx
const services = {
  simple: () => simpleFetcher(axiosInstance),
  login: () => loginFetcher(axiosInstance),
};

// Dans le composant client
const simpleData = useServerData('simple');
const loginData = useServerData('login');
```

## 🔧 Configuration

Les options de React Query sont configurées dans `/config/services.ts`:
- `staleTime`: 60 secondes
- `refetchOnWindowFocus`: désactivé

## 📦 Dépendances

- `@tanstack/react-query`: Gestion du cache et des requêtes
- `axios`: Client HTTP
- `Next.js 14+`: Framework React avec SSR
