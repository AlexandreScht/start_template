import type { Request, Response } from 'express';
import type { z } from 'zod';
import { type Session } from './session';
export type LocalsCTX =
  | {
      body: Record<string, unknown>;
      params: Record<string, unknown>;
      query: Record<string, unknown>;
      cookie: Record<string, unknown>;
      token: string;
    }
  | Record<string, any>;

export interface ctx<T extends LocalsCTX = LocalsCTX> {
  req: Request;
  res: Response;
  locals: T;
  onError: (() => Promise<void> | void)[];
  onSuccess: (() => Promise<void> | void)[];
  onComplete: (() => Promise<void> | void)[];
  session?: Partial<Session.TokenUser>;
  next: (err?: unknown) => Promise<void>;
}

export interface validators {
  body?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  token?: any;
}

export interface slowDown {
  onError?: number;
  onSuccess?: number;
  onExecute?: number;
  onComplete?: number;
}
