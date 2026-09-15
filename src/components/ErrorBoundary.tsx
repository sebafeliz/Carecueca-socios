import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { CarecuecaLogo } from './CarecuecaLogo';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleSafeReset = () => {
    try {
      // Remove possibly corrupted dues or transient cache without touching safety vault
      localStorage.removeItem('carecueca_dues');
      localStorage.removeItem('carecueca_periods');
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center">
            <div className="flex justify-center mb-5">
              <CarecuecaLogo size="lg" lightText={false} />
            </div>

            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Se detectó una interrupción temporal
            </h2>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              La aplicación encontró un detalle al renderizar los datos. Tus registros de socios y pagos se encuentran resguardados.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar Aplicación</span>
              </button>

              <button
                onClick={this.handleSafeReset}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer border border-slate-200"
              >
                <Database className="w-4 h-4 text-slate-500" />
                <span>Recuperar Vista y Sincronizar</span>
              </button>
            </div>

            {this.state.error && (
              <div className="mt-6 text-left">
                <details className="text-xs text-slate-400 cursor-pointer">
                  <summary className="hover:text-slate-600">Detalle técnico</summary>
                  <pre className="mt-2 p-3 bg-slate-100 rounded-lg overflow-x-auto text-[11px] text-slate-700 font-mono">
                    {this.state.error.toString()}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
