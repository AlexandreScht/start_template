'use client';

import { type Buttons } from '@/interfaces/buttons';
import { cn, Spinner, Button as UiButton } from '@heroui/react';
import { useMemo } from 'react';

export default function Button({
  children,
  className,
  disabled,
  isLoading,
  spinnerClass,
  spinner,
  colorTheme,
  variant,
  ...other
}: Buttons.index) {
  const [color, isSpecial, textColor] = useMemo(() => {
    const color = !colorTheme
      ? 'primary'
      : colorTheme === 'special'
        ? 'primary'
        : colorTheme === 'foreground'
          ? 'secondary'
          : colorTheme;
    const isSpecialColored = colorTheme === 'foreground' || colorTheme === 'special';
    const textColor = isSpecialColored || colorTheme === 'warning' ? '(--sage-5)' : '(--gray-12)';
    return [color, isSpecialColored, textColor];
  }, [colorTheme]);

  return (
    <UiButton
      color={undefined as any}
      className={cn(
        'leading-3.5 tracking-2 h-fit min-h-0 min-w-0 gap-2 rounded-md px-5 pb-3 pt-2.5 text-[0.9rem] font-semibold !opacity-100',
        {
          [`bg-${color}-${isSpecial ? 'v12' : 'v9'} text-${textColor} data-[hover=true]:bg-${color}-${isSpecial ? 'v12' : 'v10'}`]:
            variant === 'solid',
          [`bg-${color}-v3 text-${color}-${isSpecial ? 'v12' : 'v11'} border-1 border-${color}-v3 data-[hover=true]:bg-${color}-v4`]:
            variant === 'surface',
          [`bg-transparent data-[hover=true]:bg-${color}-v2 pb-[0.74rem] pt-[0.7rem] shadow-[inset_0_0_0_1px_var(--color-${color}-${isSpecial ? 'v12' : 'v8'})] text-${color}-${isSpecial ? 'v12' : 'v11'}`]:
            variant === 'bordered',
          [`text-${color}-${isSpecial ? 'v12' : 'v11'} data-[hover=true]:bg-${color}-v3 bg-transparent pb-[0.74rem] pt-[0.7rem]`]:
            variant === 'ghost',
          [`bg-${color}-${isSpecial ? 'v12' : 'v9'} text-${textColor} shadow-(--buttons-shadow) data-[hover=true]:bg-${color}-${isSpecial ? 'v12' : 'v10'}`]:
            !variant,
        },
        {
          'cursor-not-allowed': disabled || isLoading,
        },
        className,
      )}
      spinner={spinner ? spinner : <Spinner classNames={spinnerClass} variant="spinner" />}
      isDisabled={disabled || isLoading}
      isLoading={isLoading}
      {...other}
    >
      {children}
    </UiButton>
  );
}
