'use client';

import Link from 'next/link';

export default function Redirecting() {
  return (
    <Link href="/dashboard" legacyBehavior>
      <a>Aller à la dashboard</a>
    </Link>
  );
}
