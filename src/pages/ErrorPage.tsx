Here's a comprehensive ErrorPage.tsx implementation:

```typescript
import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface ErrorDetails {
  status?: number;
  statusText?: string;
  message?: string;
  error?: Error;
}

const ErrorPage: React.FC = () => {
  const error = useRouteError();
  
  const renderErrorDetails = (): ErrorDetails => {
    if (isRouteErrorResponse(error)) {
      return {
        status: error.status,
        statusText: error.statusText,
        message: error.data?.message || 'An unexpected error occurred',
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        error,
      };
    }

    return {
      message: 'An unknown error occurred',
    };
  };

  const errorDetails = renderErrorDetails();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <ExclamationTriangleIcon 
            className="h-16 w-16 text-red-500" 
            aria-hidden="true" 
          />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {errorDetails.status 
            ? `Error ${errorDetails.status}` 
            : 'Unexpected Error'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {errorDetails.message || errorDetails.statusText || 'Something went wrong'}
        </p>

        {process.env.NODE_ENV === 'development' && errorDetails.error && (
          <div className="bg-gray-100 p-4 rounded-md text-left mb-6 overflow-x-auto">
            <h2 className="font-bold mb-2">Stack Trace:</h2>
            <pre className="text-xs text-gray-700">
              {errorDetails.error.stack}
            </pre>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <Link 
            to="/" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Go Home
          </Link>
          
          <button 
            onClick={() => window.location.reload()}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
```

Key features:
- Uses `useRouteError` and `isRouteErrorResponse` for robust error handling
- TypeScript type safety
- Responsive design with Tailwind CSS classes
- Conditional stack trace display (development only)
- Error icon from Heroicons
- 'Go Home' and 'Reload Page' actions
- Handles various error scenarios (route errors, standard errors)

Note: This assumes you're using Tailwind CSS and @heroicons/react. Adjust styling as needed for your project's design system.
