import { type ButtonProps, type SpinnerProps } from '@heroui/react';
import { type ButtonHTMLAttributes } from 'react';

declare namespace Buttons {
  type variantType = 'solid' | 'soft' | 'bordered' | 'ghost';

  type colorsType = 'primary' | 'special' | 'secondary' | 'foreground' | 'success' | 'warning' | 'danger';

  type ButtonDefaultProps = ButtonHTMLAttributes<HTMLButtonElement> & Omit<ButtonProps, 'variant' | 'color' | 'size' | 'radius'>;
  interface index extends ButtonDefaultProps {
    variant?: variantType;
    disabled?: boolean;
    colorTheme?: colorsType;
    spinnerClass?: SpinnerProps['classNames'];
  }
}
