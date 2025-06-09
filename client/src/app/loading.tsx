import React from 'react';

const Loading = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-400 border-t-transparent"></div>
      <h1 className="text-xl font-semibold text-blue-700">Chargement...</h1>
    </div>
  );
};

export default Loading;
