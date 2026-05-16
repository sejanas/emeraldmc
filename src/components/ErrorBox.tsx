import React from 'react';
import { Button } from '@/components/ui/button';
import { userMessageFromError } from '@/lib/error';

interface Props {
  title?: string;
  message?: unknown;
  onRetry?: () => void;
}

export default function ErrorBox({ title = 'Error', message = 'Something went wrong.', onRetry }: Props) {
  const displayMessage = userMessageFromError(message);
  return (
    <div role="alert" aria-live="assertive" className="rounded p-4 border border-destructive bg-destructive/10 text-destructive">
      <div className="mb-2 font-medium">{title}</div>
      <div className="mb-3 text-sm">{displayMessage}</div>
      {onRetry && <Button onClick={onRetry}>{'Retry'}</Button>}
    </div>
  );
}
