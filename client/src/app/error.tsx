'use client';
import Link from 'next/link';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

const ErrorPage = ({ error, reset }: ErrorProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-red-50">
      <h1 className="mb-4 text-3xl font-bold text-red-700">Une erreur est survenue</h1>
      <p className="mb-4 text-gray-700">{error?.message || "Une erreur inattendue s'est produite."}</p>
      <div className="flex gap-4">
        <Link href="/" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Retour à l'accueil
        </Link>
        <button className="rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700" onClick={reset}>
          Réessayer
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
