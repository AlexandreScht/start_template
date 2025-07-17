import { Icons } from '@/assets/icons';
import OAuth from '@/components/buttons/oauth';
import LoginForm from '@/components/forms/login';

export default function LoginPage() {
  return (
    <>
      <LoginForm />
      <div className="relative my-8 flex items-center">
        <div className="border-b-1 border-foreground-v4 flex-grow border-t border-[var(--color-background-v6)]"></div>
        <span className="mx-4 flex-shrink text-sm font-medium text-[var(--color-foreground-v8)]">OU</span>
        <div className="border-b-1 border-foreground-v4 flex-grow border-t border-[var(--color-background-v6)]"></div>
      </div>
      <OAuth
        providerList={[
          {
            method: 'google',
            className:
              'flex w-full cursor-pointer transform items-center justify-center gap-4 rounded-lg bg-[var(--color-background-v3)] py-3.5 text-lg font-semibold text-[var(--color-foreground)] shadow-md ring-1 ring-[var(--color-background-v6)] transition-transform duration-150 ease-in-out hover:scale-105 hover:bg-[var(--color-background-v4)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-v7)] focus:ring-offset-2 focus:ring-offset-[var(--color-background-v2)]',
            content: (
              <>
                <Icons.google />
                Continuer avec Google
              </>
            ),
          },
        ]}
      />
    </>
  );
}
