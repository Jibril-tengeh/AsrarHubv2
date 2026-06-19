import {StrictMode, Component, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';

import App from './App.tsx';
import './index.css';
import { SettingsProvider } from './contexts/SettingsContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ReadingProvider } from './contexts/ReadingContext';
import { StatsProvider } from './contexts/StatsContext';
import { AudioProvider } from './contexts/AudioContext';

try {
  class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
    constructor(props: {children: ReactNode}) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }
    render() {
      if (this.state.hasError) {
        return (
          <div style={{ padding: 20, color: 'white', backgroundColor: 'black', minHeight: '100vh', zIndex: 9999 }}>
            <h2>React Error</h2>
            <pre style={{ whiteSpace: 'pre-wrap', color: 'red' }}>{this.state.error?.toString()}</pre>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '10px' }}>{this.state.error?.stack}</pre>
          </div>
        );
      }
      return this.props.children;
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <SettingsProvider>
          <StatsProvider>
            <ReadingProvider>
              <FavoritesProvider>
                <AudioProvider>
                  <App />
                </AudioProvider>
              </FavoritesProvider>
            </ReadingProvider>
          </StatsProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (e: any) {
  document.body.innerHTML = '<div style="color:red;padding:20px;background:black;height:100vh;">Init Error: ' + e.toString() + '</div>';
}

