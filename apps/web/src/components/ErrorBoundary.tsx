import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Catch rendering errors in calculator screens so the whole app doesn't go blank. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="warning-block" style={{ marginTop: 24 }}>
          <div>
            <strong>Something went wrong</strong>
            <p>Try switching calculator modes or refreshing the page.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
