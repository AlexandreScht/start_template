import { errService } from '@/interfaces/routes';
import { AxiosError } from 'axios';
import { ZodError } from 'zod';
import { ExpiredSessionError, InvalidRoleAccessError } from './errors';

const unknownError = "Une erreur inconnue s'est produite.";

export function getErrorMessage(err: unknown): errService {
  if (err instanceof ExpiredSessionError) {
    return {
      err: "Problème d'authentification, vous allez être déconnecté.",
      code: 'AUTH_ERROR',
    };
  }

  if (err instanceof ZodError) {
    return {
      err: err.issues[0]?.message ?? unknownError,
      code: 'VALIDATION_ERROR',
    };
  }

  if (err instanceof InvalidRoleAccessError) {
    return {
      err: "Veuillez souscrire à une offre d'abonnement supérieure pour continuer",
      code: 'ROLE_ERROR',
    };
  }

  if (err instanceof AxiosError) {
    return {
      err: err.response?.data?.error ?? unknownError,
      code: 'AXIOS_ERROR',
    };
  }

  if (err instanceof Error) {
    return {
      err: err.message ?? unknownError,
      code: 'GENERIC_ERROR',
    };
  }

  return typeof err === 'string' ? { err, code: 'STRING_ERROR' } : { err: unknownError, code: 'UNKNOWN_ERROR' };
}
