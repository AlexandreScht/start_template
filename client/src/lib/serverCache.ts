import { AxiosStorage, type EmptyStorageValue, type NotEmptyStorageValue } from 'axios-cache-interceptor';
import QuickLRU from 'quick-lru';

type CacheEntryWithTags = {
  value: NotEmptyStorageValue;
  tags: string[];
};

class ServerMemoryClass {
  private static instance: ServerMemoryClass;
  private readonly lru: QuickLRU<string, CacheEntryWithTags>;
  private allowedHeaders: Set<string> = new Set([
    'content-type',
    'content-length',
    'access-control-allow-credentials',
  ]);

  private constructor() {
    this.lru = new QuickLRU({ maxSize: 1000 });
  }

  public static getInstance(): ServerMemoryClass {
    if (!ServerMemoryClass.instance) {
      ServerMemoryClass.instance = new ServerMemoryClass();
    }
    return ServerMemoryClass.instance;
  }

  public setAllowedHeaders(headers: string[]): void {
    this.allowedHeaders = new Set(headers.map(h => h.toLowerCase()));
  }

  public addAllowedHeaders(headers: string[]): void {
    headers.forEach(h => this.allowedHeaders.add(h.toLowerCase()));
  }

  public set: AxiosStorage["set"] = async (key, value, currentRequest) => {
    if (
      ((value?.data?.data && value.state === 'cached') || value.state === 'loading')
    ) {
      const originalHeaders = value?.data?.headers ?? {};
      const filteredHeaders = Object.entries(originalHeaders).reduce<Record<string, string>>(
        (acc, [headerName, headerValue]) => {
          if (this.allowedHeaders.has(headerName.toLowerCase())) {
            acc[headerName] = headerValue as any;
          }
          return acc;
        },
        {},
      );
      
      const tags: string[] = (currentRequest as any)?.__cacheTags || [];
      
      this.lru.set(key, {
        value: {
          ...value,
          data: {
            ...(value?.data as any),
            headers: filteredHeaders,
          },
        },
        tags,
      });
    }
  };


  public find: AxiosStorage["get"]  = async (key: string)=> {
    const entry = this.lru.get(key);
    
    if (!entry) return { state: 'empty', data: undefined } as EmptyStorageValue;
    
    const { value } = entry;
    
    if (value && value.ttl !== undefined && value.ttl !== -1 && value.createdAt !== undefined) {
      const now = Date.now();
      const isExpired = now > value.createdAt + value.ttl;
      
      if (isExpired) {
        this.lru.delete(key);
        return { state: 'empty', data: undefined } as EmptyStorageValue;
      }
    }
    
    return value;
  };

  get getAll() {
    return Array.from(this.lru.entries()).map(([key, entry]) => [key, entry.value] as const);
  }

  public getByTags = (tags: string[]): Array<[string, NotEmptyStorageValue]> => {
    const results: Array<[string, NotEmptyStorageValue]> = [];
    
    for (const [key, entry] of this.lru.entries()) {
      const hasMatchingTag = tags.some(tag => entry.tags.includes(tag));
      if (hasMatchingTag) {
        results.push([key, entry.value]);
      }
    }
    
    return results;
  };

  public removeByTags = (tags: string[]): number => {
    let deletedCount = 0;
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.lru.entries()) {
      const hasMatchingTag = tags.some(tag => entry.tags.includes(tag));
      if (hasMatchingTag) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.lru.delete(key);
      deletedCount++;
    });
    
    return deletedCount;
  };

  public remove = (key: string) => {
    this.lru.delete(key);
  };

  public has = (key: string) => {
    return this.lru.has(key);
  };

  public clear = () => {
    this.lru.clear();
  };

  public update = async <T>(
    options: { serviceKey?: string; tags?: string[] },
    newData: T
  ): Promise<NotEmptyStorageValue | Array<{ key: string; value: NotEmptyStorageValue }> | undefined> => {
    const { serviceKey, tags } = options;

    if (serviceKey) {
      const entry = this.lru.get(serviceKey);
      
      if (!entry) {
        return undefined;
      }

      const updatedValue = {
        ...entry.value,
        createdAt: Date.now(),
        data: {
          ...(entry.value.data as any),
          data: newData,
        },
      } as NotEmptyStorageValue;

      this.lru.set(serviceKey, {
        value: updatedValue,
        tags: entry.tags,
      });
      return updatedValue;
    }

    if (tags && tags.length > 0) {
      const updatedEntries: Array<{ key: string; value: NotEmptyStorageValue }> = [];
      
      for (const [key, entry] of this.lru.entries()) {
        const hasMatchingTag = tags.some(tag => entry.tags.includes(tag));
        if (hasMatchingTag) {
          const updatedValue = {
            ...entry.value,
            createdAt: Date.now(),
            data: {
              ...(entry.value.data as any),
              data: newData,
            },
          } as NotEmptyStorageValue;

          this.lru.set(key, {
            value: updatedValue,
            tags: entry.tags,
          });

          updatedEntries.push({ key, value: updatedValue });
        }
      }
      
      return updatedEntries;
    }

    return undefined;
  };
}

const ServerMemory = ServerMemoryClass.getInstance();
export default ServerMemory;