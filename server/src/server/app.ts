import logsConfig from '@/config/logs';
import { type WebSocket } from '@/interfaces/websocket';
import RedisInstance from '@/libs/redis';
import socket from '@/libs/socket';
import { csrfProtection } from '@/utils/crsf';
import env from '@config';
import { ErrorMiddleware } from '@middlewares/error';
import ApiRouter from '@routes/index';
import { logger, stream } from '@utils/logger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import session from 'express-session';
import fs from 'fs';
import helmet from 'helmet';
import hpp from 'hpp';
import http from 'http';
import https from 'https';
import morgan from 'morgan';
import passport from 'passport';
import path from 'path';
import 'reflect-metadata';
import { Server } from 'socket.io';
const { COOKIE_SECRET, ORIGIN, NODE_ENV, PORT } = env;
import '@/libs/passport';
import { rateLimit } from '@/middlewares/limiter';
const { format } = logsConfig;

export default class App extends ApiRouter {
  public app: express.Application;
  public env: string;
  public port: string | number;
  private server: https.Server | http.Server;
  private productMode: boolean = ORIGIN.startsWith('https');
  // private server: http.Server;
  private io: WebSocket.wslServer;
  private allowedHeaders: string[] = ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Tag', 'X-Internal-Request'];

  constructor() {
    super();
    this.app = express();
    this.port = PORT || 3005;
    this.server =
      NODE_ENV === 'production'
        ? https.createServer(
            {
              key: fs.readFileSync(path.join(__dirname, '../certificates', 'privkey.pem')),
              cert: fs.readFileSync(path.join(__dirname, '../certificates', 'fullchain.pem')),
            },
            this.app,
          )
        : http.createServer(this.app);
    this.io = new Server(this.server, { cors: { origin: ORIGIN } });
  }

  public async initialize() {
    this.initializeStoredLibs();
    this.initializeMiddlewares();
    this.initializeAppRoutes();
    this.initializeErrorHandling();
    this.defaultError();
    if (this.productMode) {
      this.app.set('trust proxy', true);
    }
  }

  public listen() {
    this.server.listen(this.port, () => {
      logger.info(`======= Version: ${NODE_ENV || 'development'} =======
          🚀 server listening port: ${this.port} 🚀`);
    });
    return this.server;
  }

  private initializeMiddlewares() {
    this.app.use(morgan(format, { stream }));

    this.app.use(
      cors({
        origin: ORIGIN,
        credentials: true,
        methods: 'GET,PUT,PATCH,POST,DELETE',
        allowedHeaders: this.allowedHeaders,
      }),
    );
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.initializeBodyContent();
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser(COOKIE_SECRET));
    this.app.use(rateLimit);
    this.app.use(
      session({
        secret: process.env.SESSION_SECRET,
        name: '__Host-session.sid',
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          sameSite: this.productMode ? 'strict' : 'none',
          secure: this.productMode,
          maxAge: 30 * 24 * 60 * 60e3,
        },
      }),
    );
    this.app.use(passport.initialize());
    this.app.use(passport.session());
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.headers['x-internal-request'] === '1') {
        return next();
      }
      csrfProtection(req, res, next);
    });

    this.app.options(
      '*',
      cors({
        origin: ORIGIN,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: this.allowedHeaders,
      }),
    );
  }

  private initializeBodyContent() {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      //  for stripe webhook
      //! modify for /api/webhooks/stripe
      if (req.url === '/api/stripe_webhook') {
        express.raw({ type: 'application/json' })(req, res, next);
      } else {
        express.json()(req, res, next);
      }
    });
  }

  private initializeStoredLibs() {
    // MemoryServerCache;
    // socket.getInstance(this.io);

    // initialise redis
    RedisInstance.getInstance();
  }

  private initializeAppRoutes() {
    super.initializeRoutes();
    this.app.use('/api', this.router);
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }

  private defaultError() {
    this.app.use((req: Request, res: Response) => {
      res
        .status(404)
        .setHeader('Content-Type', 'application/json; charset=utf-8')
        .send({
          error: `Cannot find or << ${req.method} >> is incorrect method at ${req.url}`,
        });
    });
  }
}
