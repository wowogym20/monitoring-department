import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const gradientButtonVariants = cva(
  [
    // Layout
    'relative inline-flex shrink-0 items-center justify-center',
    'gap-2 whitespace-nowrap rounded-full border',
    'font-semibold outline-none',
    'transition-all duration-300 ease-in-out',

    // Focus
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2',
    'focus-visible:ring-offset-background',

    // Disabled
    'disabled:pointer-events-none',
    'disabled:opacity-50',

    // Icon
    '[&_svg]:pointer-events-none',
    '[&_svg]:shrink-0',
    '[&_svg]:text-current',
  ],
  {
    variants: {
      theme: {
        /**
         * Mengikuti tema Next Themes.
         *
         * Light mode:
         * - background terang
         * - teks foreground
         * - border atas cerah
         * - border bawah gelap
         *
         * Dark mode:
         * - background gelap
         * - teks foreground
         * - border atas cerah
         * - border bawah lebih gelap
         * cara pemakaian: theme="light" atau theme="dark" atau theme="system" atau theme="inverse"
         */
        auto: [
          // Light mode
          'text-foreground',

          'border-black/[0.12]',

          'bg-gradient-to-b',
          'from-background',
          'via-muted/60',
          'to-muted/90',

          'shadow-[inset_0_1px_0_rgba(255,255,255,0.65),inset_0_-1px_0_rgba(0,0,0,0.10),0_2px_5px_rgba(0,0,0,0.06)]',

          'hover:from-white',
          'hover:via-background',
          'hover:to-muted/70',

          'active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.16)]',

          // Dark mode
          'dark:text-foreground',

          'dark:border-white/[0.12]',

          'dark:from-white/[0.14]',
          'dark:via-white/[0.09]',
          'dark:to-white/[0.05]',

          'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.55),0_3px_8px_rgba(0,0,0,0.25)]',

          'dark:hover:from-white/[0.20]',
          'dark:hover:via-white/[0.13]',
          'dark:hover:to-white/[0.07]',

          'dark:active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.50)]',
        ],

        /**
         * Selalu memakai tema terang,
         * meskipun halaman sedang dark mode.
         */
        light: [
          'text-zinc-900',

          'border-black/[0.12]',

          'bg-gradient-to-b',
          'from-zinc-50',
          'via-zinc-100',
          'to-zinc-300',

          'shadow-[inset_0_1px_0_rgba(255,255,255,0.90),inset_0_-1px_0_rgba(0,0,0,0.12),0_2px_5px_rgba(0,0,0,0.08)]',

          'hover:from-zinc-50',
          'hover:via-zinc-50',
          'hover:to-zinc-200',

          'active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)]',
        ],

        /**
         * Selalu memakai tema gelap,
         * meskipun halaman sedang light mode.
         */
        dark: [
          'text-white',

          'border-white/[0.12]',

          'bg-gradient-to-b',
          'from-zinc-700',
          'via-zinc-800',
          'to-zinc-900',

          'shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(0,0,0,0.70),0_3px_8px_rgba(0,0,0,0.25)]',

          'hover:from-zinc-600',
          'hover:via-zinc-700',
          'hover:to-zinc-800',

          'active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.55)]',
        ],
        inverse: [
          // Light mode: tombol gelap
          "text-white",
          "border-x-white/10",
          "border-t-white/20",
          "border-b-black/80",

          "bg-gradient-to-b",
          "from-zinc-700",
          "via-zinc-800",
          "to-zinc-900",

          "shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(0,0,0,0.70),0_3px_8px_rgba(0,0,0,0.25)]",

          "hover:from-zinc-600",
          "hover:via-zinc-700",
          "hover:to-zinc-800",

          "active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.55)]",

          // Dark mode: tombol terang
          "dark:text-zinc-900",
          "dark:border-x-black/10",
          "dark:border-t-white/90",
          "dark:border-b-black/20",

          "dark:bg-gradient-to-b",
          "dark:from-white",
          "dark:via-zinc-100",
          "dark:to-zinc-300",

          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.90),inset_0_-1px_0_rgba(0,0,0,0.12),0_2px_5px_rgba(0,0,0,0.08)]",

          "dark:hover:from-white",
          "dark:hover:via-zinc-50",
          "dark:hover:to-zinc-200",

          "dark:active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)]",
        ],
      },

      size: {
        sm: 'h-9 px-4 text-sm [&_svg]:size-4',

        default: 'h-10 px-5 text-sm [&_svg]:size-4',

        lg: 'h-12 px-6 text-base [&_svg]:size-5',

        icon: 'size-10 p-0 [&_svg]:size-5',
      },
    },

    defaultVariants: {
      theme: 'auto',
      size: 'default',
    },
  },
);

export interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(({ className, size, theme = 'auto', asChild = false, type = 'button', ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      data-button-theme={theme}
      className={cn(
        gradientButtonVariants({
          size,
          theme,
        }),
        className,
      )}
      {...props}
    />
  );
});

GradientButton.displayName = 'GradientButton';

export { GradientButton, gradientButtonVariants };
