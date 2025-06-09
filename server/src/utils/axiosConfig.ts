import { HmacSHA256, enc } from 'crypto-js';

export class BitGetApiSigned {
  private readonly secretKey: string;
  private readonly timestamp: string;
  private readonly method: string;
  private readonly requestPath: string;
  private readonly data: Record<string, any>;

  constructor(
    secretKey: string,
    timestamp: string,
    method: 'POST' | 'GET',
    requestPath: string,
    data?: Record<string, any>,
  ) {
    this.secretKey = secretKey;
    this.timestamp = timestamp;
    this.method = method;
    this.requestPath = requestPath;
    this.data = data || {};
  }

  generatePreHash() {
    let bodyStr = '';
    if (this.data && Object.keys(this.data).length > 0) {
      bodyStr = JSON.stringify(this.data);
    }
    return `${this.timestamp}${this.method.toUpperCase()}${this.requestPath}${bodyStr}`;
  }

  getBitGetSignature() {
    const message = this.generatePreHash();
    const hmac = HmacSHA256(message, this.secretKey);
    return enc.Base64.stringify(hmac);
  }
}

export function authorizedSymbols(symbol: string) {
  switch (symbol) {
    case 'VELODROME':
      return 'VELO';
    case 'OMNI1':
      return undefined;
    case 'NEIROCTO':
      return undefined;

    default:
      return symbol;
  }
}
export function blockChainSymbols(symbol: string) {
  return [
    'BTC',
    'ETH',
    'ADA',
    'SOL',
    'TRX',
    'XLM',
    'SUI',
    'KAS',
    'DOT',
    'AVAX',
    'LTC',
    'DOGE',
    'XRP',
    'BCH',
    'HBAR',
    'TON',
    'HYPE',
    'LEO',
    'NEAR',
    'OM',
  ].includes(symbol);
}

export function idToken(symbol: string) {
  switch (symbol) {
    case 'BTC':
      return 1;
    case 'DOGE':
      return 74;
    default:
      return undefined;
  }
}
