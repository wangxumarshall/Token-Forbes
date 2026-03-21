import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Github, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { SignInProvider } from '../firebase';

interface Props {
  login: (provider?: SignInProvider) => Promise<void>;
  isLoggingIn: boolean;
  activeProvider: SignInProvider | null;
  label?: string;
  align?: 'left' | 'right';
  fullWidth?: boolean;
  buttonClassName?: string;
  menuClassName?: string;
}

const PROVIDERS: Array<{ id: SignInProvider; label: string; accentClassName: string }> = [
  { id: 'github', label: 'GitHub', accentClassName: 'text-white' },
  { id: 'google', label: 'Google', accentClassName: 'text-[#D4AF37]' },
];

export default function LoginMenu({
  login,
  isLoggingIn,
  activeProvider,
  label = 'Login',
  align = 'right',
  fullWidth = false,
  buttonClassName,
  menuClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const buttonLabel =
    isLoggingIn && activeProvider
      ? `Connecting ${activeProvider === 'github' ? 'GitHub' : 'Google'}...`
      : label;

  return (
    <div ref={containerRef} className={clsx('relative', fullWidth && 'w-full')}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={isLoggingIn}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10 disabled:opacity-60 sm:px-4 sm:text-sm',
          fullWidth && 'w-full',
          buttonClassName,
        )}
      >
        {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <span>{buttonLabel}</span>
        <ChevronDown className={clsx('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          className={clsx(
            'absolute z-50 mt-2 min-w-[220px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#0f0f0f] p-2 shadow-2xl sm:max-w-none',
            align === 'right' ? 'right-0' : 'left-0',
            fullWidth && 'w-full min-w-0',
            menuClassName,
          )}
        >
          {PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => {
                setOpen(false);
                void login(provider.id);
              }}
              disabled={isLoggingIn}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              <span className="flex items-center gap-3">
                {provider.id === 'github' ? (
                  <Github className="h-4 w-4 text-white" />
                ) : (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#D4AF37]/50 text-[10px] font-bold text-[#D4AF37]">
                    G
                  </span>
                )}
                <span>
                  <span className="block text-sm font-semibold text-white">
                    {provider.label}
                  </span>
                  <span className="block text-xs text-gray-500">
                    Continue with {provider.label}
                  </span>
                </span>
              </span>

              {isLoggingIn && activeProvider === provider.id ? (
                <Loader2 className={clsx('h-4 w-4 animate-spin', provider.accentClassName)} />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
