import { Component, ReactNode } from 'react';
class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: any}> {
  public state: { hasError: boolean; error: any } = { hasError: false, error: null };
  public declare props: {children: ReactNode};
  constructor(props: {children: ReactNode}) {
    super(props);
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
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { BUNDLE_ID } from './version';
import './index.css';

// Marqueur de version de bundle : visible dans la console et sur <html>.
// Permet de vérifier en une seconde qu'un navigateur exécute le bundle
// courant (un onglet resté ouvert depuis un déploiement précédent garde
// l'ancien code en mémoire tant qu'il n'est pas rechargé).
console.info(`[e-nova] bundle ${BUNDLE_ID}`);
document.documentElement.setAttribute('data-enova-bundle', BUNDLE_ID);

// Handle benign auth popup closures and extension rejections gracefully
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (
      reason?.code === 'auth/popup-closed-by-user' ||
      reason?.code === 'auth/cancelled-popup-request' ||
      (typeof reason?.message === 'string' && reason.message.includes('auth/popup-closed-by-user')) ||
      (typeof reason?.message === 'string' && reason.message.includes('getter')) ||
      (typeof reason?.stack === 'string' && reason.stack.includes('chrome-extension://'))
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
);
