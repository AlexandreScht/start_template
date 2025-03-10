import { Services } from '@/interfaces/services';
import PrepareServices from '@/services';

const configureCache = (
  cacheOption: Services.Cache.option = { key: undefined, enabled: true, store: 'redis' },
  defaultKeyName?: string,
): Services.serviceOption => {
  const { key, enabled, storage } = cacheOption;
  if (!defaultKeyName && !key) {
    throw new Error('cache key do not exist');
  }
  return {
    cache: {
      key: key ?? defaultKeyName!,
      enabled: enabled ?? true,
      store: store ?? 'redis',
    },
  };
};

export default function useServerService<K extends keyof Services.Index.returnType>(
  serviceCall: (s: Services.Index.returnType) => ReturnType<Services.Index.returnType[K]>,
  options: Services.serviceOption = {},
): ReturnType<Services.Index.returnType[K]> {
  const { cache, ...headers } = options;

  const serviceCallStr = serviceCall?.toString() || '';
  const match = serviceCallStr.match(/\.([a-zA-Z0-9_$]+)\s*\(/);
  const defaultKeyName = match ? match[1] : undefined;

  const cacheOption = configureCache(cache, defaultKeyName);

  const service = PrepareServices({ ...headers, ...cacheOption });

  const interceptedService: Services.Index.returnType = Object.keys(service).reduce((acc, key) => {
    const typedKey = key as keyof Services.Index.returnType;
    acc[typedKey] = (arg: any) => {
      return service[typedKey](arg);
    };
    return acc;
  }, {} as Services.Index.returnType);

  return serviceCall(interceptedService);
}
