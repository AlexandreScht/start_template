'use client';

import { type Buttons } from '@/interfaces/buttons';
import { cn, Spinner, Button as UiButton } from '@heroui/react';
import { useMemo } from 'react';

export default function Button({ children, className, disabled, isLoading, spinnerClass, spinner, colorTheme, variant, ...other }: Buttons.index) {
  const [color, isSpecial, textColor] = useMemo(() => {
    const color = !colorTheme ? 'primary' : colorTheme === 'special' ? 'primary' : colorTheme === 'foreground' ? 'secondary' : colorTheme;
    const isSpecialColored = colorTheme === 'foreground' || colorTheme === 'special';
    const textColor = isSpecialColored || colorTheme === 'warning' ? '[var(--sage-5)]' : '[var(--gray-12)]';
    return [color, isSpecialColored, textColor];
  }, [colorTheme]);

  console.log(isSpecial);

  return (
    <UiButton
      color={undefined as any}
      className={cn(
        'rounded-md px-5 min-w-0 pb-3 pt-2.5 min-h-0 h-fit text-[0.9rem] font-semibold !opacity-100 gap-2 leading-3.5 tracking-2',
        {
          [`bg-${color}-${isSpecial ? 'v12' : 'v9'} text-${textColor} data-[hover=true]:bg-${color}-${isSpecial ? 'v12' : 'v10'}`]:
            variant === 'solid',
          [`bg-${color}-v3 text-${color}-${isSpecial ? 'v12' : 'v11'} border-1 border-${color}-v3 data-[hover=true]:bg-${color}-v4`]:
            variant === 'soft',
          [`bg-transparent data-[hover=true]:bg-${color}-v2 pb-[0.74rem] pt-[0.7rem] shadow-[inset_0_0_0_1px_var(--color-${color}-${isSpecial ? 'v12' : 'v8'})] text-${color}-${isSpecial ? 'v12' : 'v11'}`]:
            variant === 'bordered',
          [`text-${color}-${isSpecial ? 'v12' : 'v11'} data-[hover=true]:bg-${color}-v3 bg-transparent pb-[0.74rem] pt-[0.7rem]`]:
            variant === 'ghost',
          [`bg-${color}-${isSpecial ? 'v12' : 'v9'} text-${textColor} inset-shadow-buttons data-[hover=true]:bg-${color}-${isSpecial ? 'v12' : 'v10'}`]:
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
