'use client';

import Card from '@/components/cards';
import { CardBody } from '@heroui/react';
import Link from 'next/link';

export default function Home() {
  return (
    <Card>
      <CardBody>
        <p>
          Make beautiful{' '}
          <Link className="font-normal" href="#">
            websites
          </Link>{' '}
          regardless of your design experience.
        </p>
      </CardBody>
    </Card>
  );
}
