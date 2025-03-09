import type { TokenUser } from '@interfaces/session';
import type { Request, Response } from 'express';
import type { z, ZodNumber, ZodOptional, ZodString } from 'zod';
export type LocalsCTX =
  | {
      body: Record<string, unknown>;
      params: Record<string, unknown>;
      query: Record<string, unknown>;
      cookie: Record<string, unknown>;
      key: string;
    }
  | Record<string, any>;

export interface ctx<T extends LocalsCTX = LocalsCTX> {
  req: Request;
  res: Response;
  locals: T;
  onError: (() => Promise<void> | void)[];
  session?: Partial<TokenUser>;
  next: (err?: unknown) => Promise<void>;
}

export interface validators {
  body?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  token?: ZodString | ZodNumber | ZodOptional<ZodString> | ZodOptional<ZodNumber>;
}
