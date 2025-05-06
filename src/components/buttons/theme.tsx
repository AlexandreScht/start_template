'use client';
import { cn, useSwitch, VisuallyHidden, type SwitchProps } from '@heroui/react';
import { useTheme } from 'next-themes';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RxMoon, RxSun } from 'react-icons/rx';

export default function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const isLight = useMemo(() => theme === 'light', [theme]);

  const handleSwitch = useCallback(() => setTheme(isLight ? 'dark' : 'light'), [isLight, setTheme]);

  const { Component, isSelected, getBaseProps, getInputProps } = useSwitch({
    isSelected: isLight,
    onChange: handleSwitch,
  } satisfies SwitchProps);

  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return null;
  }

  return (
    <div className={cn('w-8 h-8 flex items-center justify-center cursor-pointer rounded-lg bg-default-100 hover:bg-default-200', className)}>
      <Component {...getBaseProps()} className="w-full h-full flex items-center justify-center cursor-pointer pt-0.5">
        <VisuallyHidden>
          <input {...getInputProps()} />
        </VisuallyHidden>
        {isSelected ? <RxSun fill="#000" className="w-3/5 h-3/5" /> : <RxMoon className="w-3/5 h-3/5" />}
      </Component>
    </div>
  );
}
