import React from 'react';
import ErrorBox from '@/components/ErrorBox';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // TODO: send to telemetry if desired
    // console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <ErrorBox title="Something went wrong" message={String(this.state.error?.message ?? 'An unexpected error occurred.')} />
        </div>
      );
    }
    return this.props.children;
  }
}
