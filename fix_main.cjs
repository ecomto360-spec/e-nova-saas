const fs = require('fs');

let content = fs.readFileSync('src/main.tsx', 'utf8');

if (!content.includes('ErrorBoundary')) {
  content = `import { Component, ReactNode } from 'react';
class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: 20, color: 'red'}}><h1>Something went wrong.</h1><pre>{String(this.state.error)}</pre></div>;
    }
    return this.props.children;
  }
}
` + content;

  content = content.replace(
    /<App \/>/,
    `<ErrorBoundary><App /></ErrorBoundary>`
  );
  fs.writeFileSync('src/main.tsx', content);
}
console.log("Added ErrorBoundary to main.tsx");
