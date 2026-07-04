import { Component, type ErrorInfo, type ReactNode } from 'react';

import { RefreshIcon, WarningIcon } from 'fluxo-ui/icons';

import { Button } from './';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error,
            errorInfo,
        });

        console.error('Error caught by boundary:', error, errorInfo);

        this.reportError(error, errorInfo);
    }

    reportError = (error: Error, errorInfo: ErrorInfo) => {
        try {
            const errorData = {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
            };

            fetch('/api/errors/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(errorData),
            }).catch((err) => {
                console.error('Failed to report error:', err);
            });
        } catch (reportingError) {
            console.error('Error while reporting error:', reportingError);
        }
    };

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <WarningIcon className="w-8 h-8 text-red-600" />
                        </div>

                        <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>

                        <p className="text-gray-600 mb-6">
                            We apologize for the inconvenience. An unexpected error has occurred. Please try refreshing the page or contact
                            support if the problem persists.
                        </p>

                        {import.meta.env.MODE === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                                <h3 className="font-medium text-gray-900 mb-2">Error Details:</h3>
                                <pre className="text-xs text-gray-700 overflow-auto max-h-32">
                                    {this.state.error.message}
                                    {this.state.error.stack}
                                </pre>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button onClick={this.handleReset} layout="outlined" className="flex items-center justify-center">
                                <RefreshIcon className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>

                            <Button onClick={this.handleReload} className="flex items-center justify-center">
                                Reload Page
                            </Button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                Need help?{' '}
                                <a href="https://jiraassistant.com/contact-us" className="text-blue-600 hover:text-blue-700">
                                    Contact Support
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
