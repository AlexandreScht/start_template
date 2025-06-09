'use client';

export default function GoogleLoginButton() {
  return (
    <div>
      <button
        onClick={() => {
          // Redirection plein écran vers Express
          window.location.href = 'http://localhost:3005/api/auth/google';
        }}
      >
        Se connecter avec Google
      </button>
    </div>
  );
}
