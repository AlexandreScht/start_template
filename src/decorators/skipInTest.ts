import { ServerException } from '@/exceptions';

export function SkipInTest(fnInTestMode?: (v?: unknown) => any, executeTestModeFn?: (v?: unknown) => any) {
  return function (target?: object | ((v?: unknown) => any), props?: string | ((v?: unknown) => any), descriptor?: PropertyDescriptor): any {
    //? pour méthode dans une classe
    if (typeof target === 'object' && typeof props === 'string') {
      const currentMethod = descriptor?.value;
      descriptor.value = function (...args: any[]) {
        try {
          if (process.env.NODE_ENV === 'test') {
            if (typeof fnInTestMode === 'function') {
              return fnInTestMode.apply(this, args);
            }
            return Promise.resolve();
          }
          return currentMethod.apply(this, args);
        } catch (error) {
          throw new ServerException(500, error);
        }
      };
      return descriptor;
    }
    //? pour classe (toutes les méthodes de la classe)
    if (typeof target === 'function' && target?.prototype) {
      Object.getOwnPropertyNames(target.prototype).forEach(methodName => {
        const originalMethod = target.prototype[methodName];
        if (typeof originalMethod === 'function' && methodName !== 'constructor') {
          target.prototype[methodName] = function (...args: any[]) {
            try {
              if (process.env.NODE_ENV === 'test') {
                if (fnInTestMode && typeof fnInTestMode === 'function') {
                  const paramNames = extractParamNames(originalMethod);
                  const propsObj = paramNames.reduce((obj, paramName, index) => {
                    obj[paramName] = args[index];
                    return obj;
                  }, {} as any);
                  return fnInTestMode({
                    method: methodName,
                    props: propsObj,
                  });
                }
                return Promise.resolve();
              }
              return originalMethod.apply(this, args);
            } catch (error) {
              throw new ServerException(500, error);
            }
          };
        }
      });
    }
    //? Pour une fonction simple
    if (typeof fnInTestMode === 'function' && !fnInTestMode?.prototype && !target) {
      return function (...args: any[]) {
        try {
          if (process.env.NODE_ENV === 'test') {
            if (typeof executeTestModeFn === 'function') {
              return executeTestModeFn(...args);
            } else {
              return Promise.resolve();
            }
          } else {
            return fnInTestMode(...args);
          }
        } catch (error) {
          throw new ServerException(500, error);
        }
      };
    }
  };
}

function extractParamNames(func: (v?: unknown) => any): string[] {
  const funcStr = func.toString();
  const paramsSection = funcStr.slice(funcStr.indexOf('(') + 1, funcStr.indexOf(')'));

  // Remplace les accolades destructurées par une virgule pour séparer les paramètres
  const cleanedParamsSection = paramsSection.replace(/[{}]/g, '').replace(/\s+/g, '').replace(/:/g, ',');

  // Correspondance avec les paramètres
  const result = cleanedParamsSection.split(',').filter(param => param);
  return result;
}
