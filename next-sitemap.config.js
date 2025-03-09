/**
 * @type {import('next-sitemap').IConfig}
 * @see https://github.com/iamvishnusankar/next-sitemap#readme
 */
import { config } from 'dotenv';
config(); // Charge les variables d'environnement depuis le fichier .env

import process from 'process';

module.exports = {
  siteUrl: process.env?.NEXTAUTH_URL || 'https://YourOnlineSiteUrl',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [{ userAgent: '*', Disallow: '/src/app/admin' }],
  },
};
