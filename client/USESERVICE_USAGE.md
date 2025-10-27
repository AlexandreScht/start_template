# 📘 Guide d'Utilisation de useService

## Nouvelle API

`useService` accepte maintenant un objet avec les propriétés suivantes :

```typescript
useService({
  serviceKey?: string;      // Clé de cache optionnelle
  fetcher?: ServiceSelector; // Fonction pour fetcher les données
  options?: {               // Options React Query + axios-cache
    initialState?: TData;   // État initial
    cache?: {...};          // Options cache axios (serveur uniquement)
    // + toutes les options de useQuery
  };
})
```

---

## 📋 Règles

1. **Au moins `serviceKey` OU `fetcher` doit être défini** (ou les deux)
2. Si seul `fetcher` est défini → la `key` est extraite automatiquement du nom de la fonction
3. Si seul `serviceKey` est défini → lecture du cache uniquement (erreur si pas de données en cache)
4. Les deux peuvent être définis pour personnaliser la clé

---

## 💡 Cas d'Usage

### 1️⃣ Fetcher Uniquement (Clé Automatique)

```typescript
'use client';

function MyComponent() {
  // La clé sera automatiquement "simple"
  const { data, isLoading } = useService({
    fetcher: (v) => v.simple()
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
}
```

**Comportement** :
- **Serveur** : Fait la requête HTTP
- **Client** : Utilise React Query avec clé `["simple"]`

---

### 2️⃣ ServiceKey Uniquement (Lecture Cache)

```typescript
'use client';

function MyComponent() {
  // Lit le cache préfetché par FetchServerSide
  const { data, isLoading, error } = useService({
    serviceKey: "demoTest"
  });

  if (error) return <div>Données non trouvées en cache !</div>;
  if (isLoading) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
}
```

**Comportement** :
- **Serveur** : ❌ Erreur (pas de cache à lire côté serveur)
- **Client** : Lit le cache React Query uniquement (pas de requête)

**⚠️ Important** : Les données doivent avoir été prefetchées avant :

```typescript
// page.tsx (Server Component)
<FetchServerSide services={{ demoTest: serviceSelector(v => v.simple()) }}>
  <MyComponent />
</FetchServerSide>
```

---

### 3️⃣ Les Deux (Clé Personnalisée)

```typescript
'use client';

function MyComponent() {
  const { data } = useService({
    serviceKey: "maCleCustom",  // Clé personnalisée
    fetcher: (v) => v.simple(), // Fetcher pour la requête
  });

  return <div>{JSON.stringify(data)}</div>;
}
```

**Comportement** :
- Utilise la clé `["maCleCustom"]` au lieu de `["simple"]`
- Utile pour gérer plusieurs instances du même service

---

## ⚙️ Options

### InitialState

```typescript
const { data } = useService({
  fetcher: (v) => v.simple(),
  options: {
    initialState: true, // Valeur par défaut avant le fetch
  }
});

// data === true avant le premier fetch
```

### Options React Query

```typescript
const { data } = useService({
  fetcher: (v) => v.simple(),
  options: {
    staleTime: 5 * 60 * 1000,     // 5 minutes
    refetchInterval: 60 * 1000,    // Refetch toutes les minutes
    enabled: someCondition,        // Désactiver conditionnellement
    onSuccess: (data) => {         // Callback au succès
      console.log('Data fetched:', data);
    },
  }
});
```

### Options Cache Axios (Serveur uniquement)

```typescript
// Server Component
async function MyPage() {
  const data = await useService({
    fetcher: (v) => v.simple(),
    options: {
      cache: {
        ttl: 60 * 10,  // 10 minutes de cache
        persist: true,  // Cache longue durée
      }
    }
  });

  return <div>{JSON.stringify(data)}</div>;
}
```

---

## 🎯 Exemples Complets

### Avec Paramètres

```typescript
'use client';

function UserProfile({ userId }: { userId: number }) {
  const { data: user, isLoading } = useService({
    fetcher: (s) => s.getUser({ id: userId }),
    options: {
      initialState: { name: 'Loading...', id: userId },
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  });

  return <div>{user.name}</div>;
}
```

### Lecture de Cache Prefetché

```typescript
// page.tsx (Server)
export default async function DemoPage() {
  return (
    <FetchServerSide services={{ 
      userData: serviceSelector(v => v.getUser({ id: 1 }))
    }}>
      <UserDisplay />
    </FetchServerSide>
  );
}

// UserDisplay.tsx (Client)
'use client';
function UserDisplay() {
  // Lit les données prefetchées
  const { data: user } = useService({
    serviceKey: "userData"
  });

  return <div>{user?.name}</div>;
}
```

### Clé Personnalisée pour Cache Multiple

```typescript
'use client';

function MultipleUsers() {
  // Deux instances du même service avec des clés différentes
  const { data: user1 } = useService({
    serviceKey: "user-1",
    fetcher: (s) => s.getUser({ id: 1 })
  });

  const { data: user2 } = useService({
    serviceKey: "user-2",
    fetcher: (s) => s.getUser({ id: 2 })
  });

  return (
    <div>
      <div>User 1: {user1?.name}</div>
      <div>User 2: {user2?.name}</div>
    </div>
  );
}
```

---

## 🚨 Erreurs Courantes

### ❌ Ni serviceKey ni fetcher

```typescript
// ❌ ERREUR
useService({
  options: { staleTime: 1000 }
});
// Error: Au moins serviceKey ou fetcher doit être défini
```

### ❌ ServiceKey seul côté serveur

```typescript
// Server Component
async function MyPage() {
  // ❌ ERREUR côté serveur
  const data = await useService({
    serviceKey: "myKey"
  });
  // Error: Impossible de lire le cache côté serveur
}
```

**Solution** : Fournir un fetcher côté serveur

```typescript
// ✅ CORRECT
async function MyPage() {
  const data = await useService({
    fetcher: (v) => v.simple()
  });
}
```

### ❌ ServiceKey sans prefetch côté client

```typescript
'use client';
function MyComponent() {
  // ❌ Données pas en cache
  const { error } = useService({
    serviceKey: "nonExistent"
  });
  // Error: Aucune donnée en cache pour la clé "nonExistent"
}
```

**Solution** : Prefetch avec FetchServerSide ou utiliser un fetcher

---

## 🔄 Migration depuis l'Ancienne API

### Avant

```typescript
// Ancienne API
useService('simple', undefined, { staleTime: 5000 });
```

### Après

```typescript
// Nouvelle API
useService({
  fetcher: (v) => v.simple(),
  options: { staleTime: 5000 }
});
```

---

## 📊 Comparaison des Modes

| Mode | ServiceKey | Fetcher | Serveur | Client | Cache |
|------|-----------|---------|---------|--------|-------|
| **Fetch Normal** | ❌ | ✅ | Requête HTTP | Requête + Cache | Auto |
| **Fetch + Clé** | ✅ | ✅ | Requête HTTP | Requête + Cache | Custom |
| **Read Cache** | ✅ | ❌ | ❌ Erreur | Lecture seule | Doit exister |

---

## 🎓 Résumé

| Cas | Code |
|-----|------|
| **Requête simple** | `useService({ fetcher: v => v.simple() })` |
| **Lire le cache** | `useService({ serviceKey: "myKey" })` |
| **Clé custom** | `useService({ serviceKey: "custom", fetcher: v => v.simple() })` |
| **Avec options** | `useService({ fetcher: v => v.simple(), options: {...} })` |
| **État initial** | `useService({ fetcher: v => v.simple(), options: { initialState: true } })` |

---

## 🔗 Ressources

- [React Query Docs](https://tanstack.com/query/latest)
- [axios-cache-interceptor](https://axios-cache-interceptor.js.org/)
- Voir `AUDIT_CACHE.md` pour l'architecture complète
