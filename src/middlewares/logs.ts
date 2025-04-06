import { type Middlewares } from '@/interfaces/middlewares';
import { logger } from '@/utils/logger';
import { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

/**
 * Attaches interceptors to the provided Axios instance.
 *
 * @param axiosInstance The Axios instance to attach interceptors.
 * @param allowedLevels An array of allowed log levels. By default, all levels are shown.
 */
export function logging(axiosInstance: AxiosInstance, allowedLevels: Middlewares.httpGateway.allowedLevel = ['info', 'warn', 'error']): void {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig<any>) => {
      if (allowedLevels.includes('info')) {
        logger.info(
          `Request started: [${config.method?.toUpperCase()}] ${config.url} - Params: ${JSON.stringify(
            config.params,
          )} - Data: ${JSON.stringify(config.data)}`,
        );
      }
      return config;
    },
    error => {
      if (allowedLevels.includes('error')) {
        logger.error(`Error preparing request: ${error.message}`);
      }
      return Promise.reject(error);
    },
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      if (allowedLevels.includes('info')) {
        logger.info(
          `Response received: [${response.config.method?.toUpperCase()}] ${response.config.url} - Status: ${response.status} - Data: ${JSON.stringify(response.data)}`,
        );
      }
      return response;
    },
    error => {
      if (error.response) {
        const status = error.response.status;
        if (status >= 400 && status < 500 && allowedLevels.includes('warn')) {
          logger.warn(
            `Response warning: [${error.config.method?.toUpperCase()}] ${error.config.url} - Status: ${status} - Data: ${JSON.stringify(error.response.data)}`,
          );
        } else if (allowedLevels.includes('error')) {
          logger.error(
            `Response error: [${error.config.method?.toUpperCase()}] ${error.config.url} - Status: ${status} - Data: ${JSON.stringify(error.response.data)}`,
          );
        }
      } else {
        if (allowedLevels.includes('error')) {
          logger.error(`Axios error with no response: ${error.message}`);
        }
      }
      return Promise.reject(error);
    },
  );
}
