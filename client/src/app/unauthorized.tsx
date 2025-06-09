import React from 'react';

import Link from 'next/link';

const Unauthorized = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="mb-4 text-3xl font-bold text-red-600">Unauthorized</h1>
      <p className="mb-8 text-gray-700">Vous n'avez pas l'autorisation d'accéder à cette page.</p>
      <div className="flex gap-4">
        <Link href="/" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Aller à l'accueil
        </Link>
        <Link href="/login" className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
          Se connecter
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
