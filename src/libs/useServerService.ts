import { Services } from '@/interfaces/services';
import PrepareServices from '@/services';

const configureRequiredKeyCache = (cacheOption: Services.Cache.serverOption = {}, defaultKeyName?: string): Services.headerOption => {
  const { key, ...options } = cacheOption;
  if (!defaultKeyName && !key) {
    throw new Error('cache key do not exist');
  }
  return {
    cache: {
      key: key ?? defaultKeyName!,
      ...options,
    },
    side: 'server',
  };
};

export default function useServerService<K extends keyof Services.Index.returnType>(
  serviceCall: (s: Services.Index.returnType) => ReturnType<Services.Index.returnType[K]>,
  options: Partial<Services.ServiceServerOption> = {},
): ReturnType<Services.Index.returnType[K]> {
  const { cache, headers } = options;

  const serviceCallStr = serviceCall?.toString() || '';
  const match = serviceCallStr.match(/\.([a-zA-Z0-9_$]+)\s*\(/);
  const defaultKeyName = match ? match[1] : undefined;

  const requiredCacheOption = configureRequiredKeyCache(cache, defaultKeyName);

  const service = PrepareServices({ headers, ...requiredCacheOption });

  const interceptedService: Services.Index.returnType = Object.keys(service).reduce((acc, key) => {
    const typedKey = key as keyof Services.Index.returnType;
    acc[typedKey] = (arg: any) => {
      return service[typedKey](arg);
    };
    return acc;
  }, {} as Services.Index.returnType);

  return serviceCall(interceptedService);
}
