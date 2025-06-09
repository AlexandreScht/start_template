export interface ControllerWithParams<T extends string | object> {
  params: T extends 'id' ? { id: number } : T extends string ? { [key in T]: string } : T;
}

export type cookiesValues<T extends object> = T & {
  expired?: boolean;
};

export interface ControllerWithCookie<T extends object> {
  cookie: cookiesValues<T>;
}

export interface IsolatedMethod {
  body: {
    symbols: string[];
    balance: number;
    weekPeriod: number;
    leverage: number;
  };
}

export interface RepayMethod {
  body: {
    symbol: string;
    amount: number;
  };
}

export interface assetMethod {
  params?: {
    asset?: string;
  };
}
