import RedisInstance from '@/libs/redis';
import ms from 'ms';
import { authenticator } from 'otplib';
import { v4 as uuid } from 'uuid';

export async function generateRefreshToken(id: number) {
  const redis = RedisInstance.getInstance();
  const refreshToken = uuid();
  redis.update(`user:${id}`, { refreshToken }, { EX: 60 * 60 * 24 * 30 });
  return refreshToken;
}

export function optCode(digits: number, time: ms.StringValue) {
  authenticator.options = {
    digits,
    step: ms(time) / 1000,
  };
  const secret = authenticator.generateSecret();
  const code = authenticator.generate(secret);

  return [secret, code];
}

export function checkOtpCode(secret: string, code: string) {
  return authenticator.check(code, secret);
}
