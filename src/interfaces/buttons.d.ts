import { type ButtonProps, type SpinnerProps } from '@heroui/react';
import { type colorsType, type variantType } from 'color-theme';
import { type ButtonHTMLAttributes } from 'react';

declare namespace Buttons {
  type ButtonDefaultProps = ButtonHTMLAttributes<HTMLButtonElement> & Omit<ButtonProps, 'variant' | 'color' | 'size' | 'radius'>;
  interface index extends ButtonDefaultProps {
    variant?: variantType;
    disabled?: boolean;
    colorTheme?: colorsType;
    spinnerClass?: SpinnerProps['classNames'];
  }
}
