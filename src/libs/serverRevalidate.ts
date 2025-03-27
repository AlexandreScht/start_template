import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import AxiosInstance from './axiosIntance';

export default async function serverRevalidate<U extends Services.Config.ServerServiceOption = Services.Config.ServerServiceOption>(
  selector: (services: Services.serverRevalidate.MutationServices<typeof PrepareServices>) => Array<any>,
  options?: U,
): Promise<void> {
  try {
    const axios = AxiosInstance({ ...options, side: 'server', revalidate: true });
    const data = await selector(PrepareServices)(axios);
    return { data };
  } catch (error) {
    return { error: servicesErrors(error) };
  }
}

// const axiosInstance = revalidateArgs => {
//   return { revalidateArgs };
// };

// function serverRevalidate(selector) {
//   // On crée un objet wrappedServices en mappant chaque service de PrepareServices
//   const wrappedServices = Object.keys(PrepareServices).reduce((acc, key) => {
//     acc[key] = (...args) => {
//       // args[0] : paramètre destiné à AccountService
//       // args[1] : fonction de revalidation (optionnelle)
//       const serviceFn = PrepareServices[key](args[0]);
//       // On retourne une fonction qui, lors de son exécution, crée un axiosInstance
//       // avec args[1] (s'il existe) et appelle le service avec cette instance
//       return () => {
//         const axios = axiosInstance(args[1]);
//         return serviceFn(axios);
//       };
//     };
//     return acc;
//   }, {});

//   // On récupère les services via le selector
//   const services = selector(wrappedServices);
//   // Pour chaque service retourné (qui est une fonction sans argument), on l'exécute
//   services.forEach(service => service());
// }

// serverRevalidate(v => [v.account({ id: 5 }, () => ({ id: 6 }))]);
