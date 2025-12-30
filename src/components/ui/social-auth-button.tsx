import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
interface SocialAuthButtonProps {
  provider: 'google' | 'apple';
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}
export function SocialAuthButton({ provider, onClick, isLoading, className }: SocialAuthButtonProps) {
  const isGoogle = provider === 'google';
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "w-full h-12 relative flex items-center justify-center gap-3 rounded-xl border-2 transition-all active:scale-[0.98]",
        isGoogle
          ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
          : "bg-black text-white border-black hover:bg-gray-900 shadow-md",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className={cn("w-5 h-5 animate-spin", isGoogle ? "text-gray-500" : "text-white")} />
      ) : (
        <>
          {isGoogle ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-.98-.42-2.08-.45-3.08.02-1.05.5-2.18.6-3.25-.45-4.4-4.4-3.75-11.5 1.2-11.5 1.35.05 2.3.8 3.05.8 1.05-.05 2.35-1.05 3.9-.9 1.6.15 2.8.75 3.55 1.85-3.1 1.6-2.55 5.85.5 7.1-.65 1.65-1.5 3.25-2.8 4.65zM12.9 5.28c-.25-1.7 1.1-3.3 2.6-3.55.3 1.8-1.35 3.55-2.6 3.55z" />
            </svg>
          )}
          <span className="font-bold text-sm">
            {isGoogle ? 'Continue with Google' : 'Continue with Apple'}
          </span>
        </>
      )}
    </Button>
  );
}