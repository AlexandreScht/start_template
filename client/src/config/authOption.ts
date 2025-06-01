import { ClientException } from '@/exceptions/errors';
import AxiosInstance from '@/libs/axiosInstance';
import routes from '@/router/client';
import PrepareServices from '@/services';
import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// import GoogleProvider from 'next-auth/providers/google';
import { cookies } from 'next/headers';
import env from '.';

const deleteCookie = async () => {
  if (process.env.COOKIE_NAME) {
    (await cookies()).set({
      name: process.env.COOKIE_NAME,
      value: '',
      expires: new Date(0),
    });
  }
};

const nextAuthOptions: NextAuthOptions = {
  providers: [
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID as string,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    //   authorization: {
    //     params: {
    //       prompt: 'consent',
    //       access_type: 'offline',
    //       response_type: 'code',
    //     },
    //   },
    // }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'email',
          type: 'string',
          placeholder: 'myMail@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password, confirmPassword } = credentials as any;

          if (!email || !password || !confirmPassword) {
            throw new ClientException(400, 'Veuillez entrer toutes les bonnes informations');
          }

          const { login } = PrepareServices;
          const axios = AxiosInstance({ side: 'server', cache: { cachePredicate: () => false } });

          const res = await login({ email, password, confirmPassword })(axios);

          if (!res || !res.payload) {
            throw new ClientException(400, "Une erreur s'est produite");
          }
          return {
            id: email,
            ...res.payload,
          };
        } catch (error: any) {
          console.log(error);

          console.error(`NextAuth authorize error: ${error.message}`);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'credentials') {
        return true;
      }
      if (account?.provider === 'google' && profile?.email_verified && account?.id_token && profile?.at_hash) {
        const { id_token } = account;
        const { at_hash } = profile;

        const { oAuth } = PrepareServices;
        const axios = AxiosInstance({ side: 'server', cache: { cachePredicate: () => false } });

        const res = await oAuth({ id_token, at_hash })(axios);

        if (!res || !res?.payload) {
          throw new ClientException(400, "Une erreur s'est produite");
        }

        user = { ...user, id: user.email || user.id, ...res.payload };

        return !!user;
      }

      return false;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }

      session;

      return { ...token, ...user };
    },
    async session({ session, token }) {
      return { ...session, ...token };
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: routes.home(),
    signOut: routes.login(),
    error: routes.login(),
  },
  events: {
    async signOut() {
      await deleteCookie();
    },
  },
};

export default nextAuthOptions;
