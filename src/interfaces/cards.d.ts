import { type CardProps } from '@heroui/react';
import { type colorsType, type variantType } from 'color-theme';

declare namespace Cards {
  export interface index extends Omit<CardProps, 'isDisabled'> {
    variant?: Exclude<variantType, 'ghost'>;
    colorTheme?: Exclude<colorsType, 'special' | 'foreground'>;
    disabled?: boolean;
  }
}
