// Lazy loading components for better performance and code splitting
import React, { Suspense } from 'react';

// Loading component for better UX during lazy loading
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-[200px]" role="status" aria-live="polite">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">{message}</p>
      <span className="sr-only">Loading content, please wait</span>
    </div>
  </div>
);

// Lazy load large components
const LazyRoadmapView = React.lazy(() => import('./RoadmapView'));
const LazyGoalsPage = React.lazy(() => import('./GoalsPage'));
const LazyProfilePage = React.lazy(() => import('./ProfilePage'));
const LazyNewGoalModal = React.lazy(() => import('./NewGoalModal'));

// Wrapper components with Suspense and custom loading states
export const RoadmapView = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading roadmap..." />}>
    <LazyRoadmapView {...props} />
  </Suspense>
);

export const GoalsPage = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading goals..." />}>
    <LazyGoalsPage {...props} />
  </Suspense>
);

export const ProfilePage = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading profile..." />}>
    <LazyProfilePage {...props} />
  </Suspense>
);

export const NewGoalModal = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading form..." />}>
    <LazyNewGoalModal {...props} />
  </Suspense>
);

// Error boundary specifically for lazy-loaded components
export class LazyLoadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
            <div className="text-red-600 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Component</h3>
            <p className="text-red-700 mb-4">There was an error loading this part of the application.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default {
  RoadmapView,
  GoalsPage,
  ProfilePage,
  NewGoalModal,
  LazyLoadErrorBoundary,
  LoadingSpinner,
};
