'use client';

import { type Cards } from '@/interfaces/cards';
import { Card as CardHero, cn } from '@heroui/react';
import Link from 'next/link';
import React, { cloneElement, isValidElement, type ReactNode, useCallback, useMemo } from 'react';

export default function Card({ children, className, colorTheme, variant, disabled, ...other }: Cards.index) {
  const color = useMemo(() => colorTheme ?? 'secondary', [colorTheme]);
  const boldText = `text-${color}-v12`;

  const processChildren = useCallback(
    (node: ReactNode): ReactNode => {
      return React.Children.map(node, child => {
        if (!isValidElement(child)) return child;

        const { type, props: childProps } = child;
        const isAnchorOrBold = typeof type === 'string' && ['b', 'a'].includes(type);
        const isNextLink = type === Link;

        if (isAnchorOrBold || isNextLink) {
          const userClass = (childProps as { className?: string }).className;
          const combinedClass = userClass ? cn(boldText, userClass) : boldText;

          return cloneElement(child as React.ReactElement<any>, { className: combinedClass });
        }

        if (childProps.children) {
          const newChildren = processChildren(childProps.children);
          return cloneElement(child as React.ReactElement<any>, { children: newChildren });
        }

        return child;
      });
    },
    [boldText],
  );

  return (
    <CardHero
      className={cn(
        'leading-3.5 tracking-2 h-fit min-h-0 w-fit min-w-0 rounded-md px-3 py-2.5 text-sm font-semibold !opacity-100',
        {
          [`bg-${color}-v3 text-${color}-v11 shadow-[inset_0_0_0_1px_var(--color-${color}-v1),inset_0_0_0_1px_var(--color-${color}-v2)]`]:
            variant === 'solid' || !variant,
          [`bg-${color}-v2 text-${color}-v11 shadow-[inset_0_0_0_1px_var(--color-${color}-v6)]`]: variant === 'surface',
          [`bg-transparent text-${color}-v11 shadow-[inset_0_0_0_1px_var(--color-${color}-v7)]`]:
            variant === 'bordered',
        },
        {
          'cursor-not-allowed': disabled,
        },
        className,
      )}
      {...other}
    >
      {processChildren(children)}
    </CardHero>
  );
}
