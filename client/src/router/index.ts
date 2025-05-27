import type { ParamsType, QueryType, RouteObject, RoutesPropsType } from '@/interfaces/routes';

export function createRouteWithProps(route: string, params?: ParamsType<unknown>, query?: QueryType<Record<string, unknown>>): string {
  let fullRoute = route;

  if (params) {
    const customParams = Array.isArray(params) ? params : [params];
    const ps = customParams
      .filter(v => v)
      .map(v => (v ? encodeURIComponent(v.toString()) : ''))
      .join('/');

    if (ps) {
      fullRoute += `/${ps}`;
    }
  }

  if (query) {
    const searchParams = new URLSearchParams();

    for (const key in query) {
      if (Object.prototype.hasOwnProperty.call(query, key) && query[key] !== undefined) {
        searchParams.append(key, query[key]?.toString());
      }
    }

    const qs = searchParams.toString();
    if (qs) {
      fullRoute += `?${qs}`;
    }
  }

  return fullRoute;
}

//* exemple: { key1: "value1", key2: 15 }
export function createRouteWithQueries(route: string, queries?: QueryType<unknown>): string {
  if (queries === undefined || queries === null) {
    return route;
  }

  const searchParams = new URLSearchParams();

  for (const key in queries) {
    if (Object.prototype.hasOwnProperty.call(queries, key) && queries[key] !== undefined) {
      searchParams.append(key, queries[key]?.toString());
    }
  }

  const qs = searchParams.toString();

  return qs ? `${route}?${qs}` : route;
}

//* exemple: ["value1", 15]
export function createRouteWithParams(route: string, params?: ParamsType<unknown>): string {
  if (!params) {
    return route;
  }

  const customParams = Array.isArray(params) ? params : [params];

  const ps = customParams
    .filter(v => v)
    .map(v => (v ? encodeURIComponent(v.toString()) : ''))
    .join('/');

  return ps ? `${route}/${ps}` : route;
}

export function createRoutes<T extends RouteObject>(obj: T, basePath: string = ''): T {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];

    if (typeof value === 'function') {
      return {
        ...acc,
        [key]: (args: RoutesPropsType) => `${basePath}${value(args)}`,
      };
    }
    if (typeof value === 'object' && value !== null) {
      return {
        ...acc,
        [key]: createRoutes(value, `${basePath}/${key}`),
      };
    }

    return acc;
  }, {} as T);
}
