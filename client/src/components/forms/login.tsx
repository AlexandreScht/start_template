'use client';
import { loginSchema } from '@/validators/users';
import { Button, cn, Input } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MdPermIdentity } from 'react-icons/md';
import { TbLockPassword } from 'react-icons/tb';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';
import type { z } from 'zod';

type FormData = z.infer<typeof loginSchema>;
export default function LoginForm() {
  const searchParams = useSearchParams();
  const [passwordField, setPasswordField] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const {
    register,
    handleSubmit: onSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      setError(err);
    }
  }, [searchParams]);

  const EndContent = useMemo(() => (passwordField ? VscEye : VscEyeClosed), [passwordField]);

  const handleSubmit = useCallback((data: FormData) => {
    console.log(data);
    setError(undefined);
    alert(`Login avec: ${data.email}`);
  }, []);

  return (
    <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full duration-150">
      <h2 className="mb-2 text-center text-4xl font-extrabold text-[var(--color-foreground)]">Bienvenue</h2>
      <p className="mb-8 text-center text-[var(--color-foreground-v9)]">Connectez-vous pour accéder à votre espace</p>
      {error && (
        <div
          className="animate-shake mb-6 rounded-lg bg-[var(--color-danger-v3)] p-4 text-center font-semibold text-[var(--color-danger-v11)] ring-1 ring-[var(--color-danger-v6)]"
          role="alert"
        >
          {error}
        </div>
      )}
      <form onSubmit={onSubmit(handleSubmit)} className="flex flex-col gap-5">
        <Input
          type="email"
          placeholder="votre.email@exemple.com"
          startContent={<MdPermIdentity className="text-foreground-v8 h-5 w-5" />}
          fullWidth
          classNames={{
            base: 'mt-2',
            inputWrapper: cn('data-[focus]:ring-1 data-[focus]:ring-secondary', {
              'ring-danger-v8': errors.email,
            }),
            input: cn(
              'w-full rounded-lg border-none py-3 pl-10 pr-4 bg-background-v4 text-foreground transition-all duration-250 placeholder:text-foreground-v7 outline-none ring-none',
              { 'text-danger': errors.email },
            ),
            errorMessage: 'mt-1 text-sm text-danger-v11',
          }}
          {...register('email')}
          isInvalid={!!errors.email}
          errorMessage={errors.email?.message}
        />
        <Input
          type={passwordField ? 'password' : 'text'}
          placeholder="******"
          startContent={<TbLockPassword className="text-foreground-v8 h-5 w-5" />}
          endContent={
            <EndContent
              className="hover:bg-secondary-v1 text-foreground-v8 hover:text-secondary h-6 w-6 cursor-pointer transition-all duration-100 hover:scale-125"
              onClick={() => setPasswordField(v => !v)}
            />
          }
          fullWidth
          classNames={{
            base: 'mt-2',
            inputWrapper: cn('data-[focus]:ring-1 data-[focus]:ring-secondary', {
              'ring-danger-v8': errors.email,
            }),
            input: cn(
              'w-full rounded-lg border-none py-3 pl-10 pr-4 bg-background-v4 text-foreground transition-all duration-250 placeholder:text-foreground-v7 outline-none ring-none',
              { 'text-danger': errors.email },
            ),
            errorMessage: 'mt-1 text-sm text-danger-v11',
          }}
          {...register('password')}
          isInvalid={!!errors.password}
          errorMessage={errors.password?.message}
        />
        <Button
          className={cn(
            '!text-p1 bg-primary border-1 border-border relative h-fit min-h-0 w-full rounded-lg py-2 text-white',
            {
              'from-secondary to-special border-primary border-2 bg-gradient-to-tr font-medium opacity-100':
                isSubmitting,
            },
          )}
          type="submit"
          isLoading={isSubmitting}
        >
          Se connecter
        </Button>
      </form>
    </motion.div>
  );
}
