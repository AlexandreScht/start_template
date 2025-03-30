'use client';

import Link from 'next/link';

export default function ComponentName({ data }) {
  console.log(data);

  return (
    <Link href="/dashboard" legacyBehavior>
      <a>Aller à la dashboard</a>
    </Link>
  );
}
