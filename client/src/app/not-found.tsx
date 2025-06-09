import React from 'react';
import Link from 'next/link';

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="mb-4 text-3xl font-bold text-yellow-600">Page non trouvée</h1>
      <p className="mb-8 text-gray-700">La page que vous recherchez n'existe pas.</p>
      <Link href="/" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Retour à l'accueil
      </Link>
    </div>
  );
};

export default NotFound;
