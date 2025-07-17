import { type Session } from '@/interfaces/session';
import type { ctx } from '@interfaces/middlewares';
import deepmerge from 'deepmerge';
import type { NextFunction, Request, Response } from 'express';

const mw =
  (middlewaresHandler: any[]) =>
  async (req: Request, res: Response, nextExpress: NextFunction): Promise<void> => {
    if (!middlewaresHandler || middlewaresHandler.length === 0) {
      return nextExpress();
    }

    const locals = {};
    const onErrors: (() => Promise<void> | void)[] = [];
    const onSuccess: (() => Promise<void> | void)[] = [];
    const session: Partial<Session.TokenUser> = {};
    let handlerIndex = 0;
    const ctx: ctx = {
      req,
      res,
      get locals() {
        return locals;
      },
      set locals(newLocals) {
        Object.assign(locals, deepmerge(locals, newLocals));
      },
      get onError() {
        return onErrors;
      },
      set onError(newAction) {
        Object.assign(onErrors, deepmerge(onErrors, newAction));
      },
      get onSuccess() {
        return onSuccess;
      },
      set onSuccess(newAction) {
        Object.assign(onSuccess, deepmerge(onSuccess, newAction));
      },
      get onComplete() {
        return onSuccess;
      },
      set onComplete(newAction) {
        Object.assign(onSuccess, deepmerge(onSuccess, newAction));
      },
      get session() {
        return session;
      },
      set session(newSession) {
        Object.assign(session, deepmerge(session, newSession));
      },
      next: async err => {
        try {
          if (err && err instanceof Error) {
            if (ctx.onError.length) {
              await Promise.all(ctx.onError.map(fn => fn()));
            }
            return nextExpress(err);
          }

          const handler = middlewaresHandler[handlerIndex];
          handlerIndex += 1;

          if (typeof handler === 'function') {
            await handler(ctx);
          } else {
            return nextExpress(new Error('Handler is not a function'));
          }
        } catch (error) {
          if (ctx.onError.length) {
            await Promise.all(ctx.onError.map(fn => fn()));
          }
          return nextExpress(error);
        }
      },
    };
    try {
      if (req.user) ctx.session = req.user;

      if (req.method === 'GET') res.cookie('XSRF-TOKEN', req.csrfToken());
      await ctx.next();
    } catch (err) {
      console.log(err);

      return nextExpress(err);
    }
  };

export default mw;
