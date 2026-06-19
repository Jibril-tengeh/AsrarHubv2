import React, { useState } from 'react';
import { signInWithGoogle } from '../firebase';
import { Lock, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [errorDetails, setErrorDetails] = useState<{message: string, code?: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setErrorDetails(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorDetails({
        message: err.message || "An unknown error occurred during sign in.",
        code: err.code
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Lock className="h-8 w-8 text-blue-600" aria-hidden="true" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          AsrarHub Admin
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to manage your content
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errorDetails && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Sign in failed</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p className="font-semibold break-all">{errorDetails.code}</p>
                    <p className="mt-1 break-words">{errorDetails.message}</p>
                    {errorDetails.code === 'auth/unauthorized-domain' && (
                      <div className="mt-3 p-3 bg-white bg-opacity-50 rounded text-xs select-auto">
                        <p className="font-bold mb-1">Action required:</p>
                        <p>1. Go to Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</p>
                        <p>2. Add this domain:</p>
                        <code className="block mt-1 p-1 bg-gray-100 rounded text-black break-all select-all">
                          {window.location.hostname}
                        </code>
                      </div>
                    )}
                    {(errorDetails.code === 'auth/popup-blocked' || errorDetails.code === 'auth/popup-closed-by-user' || errorDetails.code === 'auth/disallowed-useragent') && (
                      <div className="mt-3 p-3 bg-white bg-opacity-50 rounded text-xs">
                        <p>If you are embedded in an app or iframe, try opening this page in a new normal browser tab (Chrome/Safari).</p>
                      </div>
                    )}
                    {errorDetails.code === 'auth/configuration-not-found' && (
                      <div className="mt-3 p-3 bg-white bg-opacity-50 rounded text-xs select-auto">
                        <p className="font-bold mb-1">Action required in Firebase Console:</p>
                        <p>1. Go to <b>Authentication</b> &gt; <b>Sign-in method</b> tab.</p>
                        <p>2. Click <b>Add new provider</b> and select <b>Google</b>.</p>
                        <p>3. Toggle it to <b>Enable</b>, set a support email, and click Save.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className={`flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
