import { type CacheRequestConfig, type NotEmptyStorageValue } from 'axios-cache-interceptor';
import QuickLRU from 'quick-lru';

class ServerMemoryClass {
  private static instance: ServerMemoryClass;
  private readonly lru: QuickLRU<string, NotEmptyStorageValue>;

  private constructor() {
    this.lru = new QuickLRU({ maxSize: 1000 });
  }

  public static getInstance(): ServerMemoryClass {
    if (!ServerMemoryClass.instance) {
      ServerMemoryClass.instance = new ServerMemoryClass();
    }
    return ServerMemoryClass.instance;
  }

  public set = async (key: string, value: NotEmptyStorageValue, currentRequest?: CacheRequestConfig) => {
    if (
      ((value?.data?.data && value.state === 'cached') || value.state === 'loading') &&
      currentRequest?.baseURL !== '/rev_cache'
    ) {
      const originalHeaders = value?.data?.headers ?? {};
      const allowed = new Set([
        'content-type',
        'content-length',
        'access-control-allow-credentials',
        'x-signature',
        'signature',
        'x-tag',
        'etag',
      ]);
      const filteredHeaders = Object.entries(originalHeaders).reduce<Record<string, string>>(
        (acc, [headerName, headerValue]) => {
          if (allowed.has(headerName.toLowerCase())) {
            acc[headerName] = headerValue as any;
          }
          return acc;
        },
        {},
      );
      this.lru.set(key, {
        ...value,
        data: {
          ...(value?.data as any),
          headers: filteredHeaders,
        },
      });
    }
  };

  public find = async (key: string) => {
    return this.lru.get(key);
  };

  get getAll() {
    return Array.from(this.lru.entries());
  }

  public remove = (key: string) => {
    this.lru.delete(key);
  };

  public clear = () => {
    this.lru.clear();
  };
}

const ServerMemory = ServerMemoryClass.getInstance();
export default ServerMemory;
