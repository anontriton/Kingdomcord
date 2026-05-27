import pino from 'pino';

export const logger = pino({
  name: 'kingdomcord',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});
