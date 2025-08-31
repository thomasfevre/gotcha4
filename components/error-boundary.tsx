"use client"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <NeuCard className="w-full max-w-md text-center">
            <div className="neu-inset rounded-full p-6 mx-auto mb-4 w-fit">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem
              persists.
            </p>
            <div className="flex gap-3">
              <NeuButton variant="flat" onClick={() => window.location.reload()} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </NeuButton>
              <NeuButton variant="primary" onClick={this.handleReset} className="flex-1">
                Try Again
              </NeuButton>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">Error Details</summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">{this.state.error.stack}</pre>
              </details>
            )}
          </NeuCard>
        </div>
      )
    }

    return this.props.children
  }
}
