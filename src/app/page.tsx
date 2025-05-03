'use client';

import Button from '@/components/buttons';

export default function Home() {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <Button colorTheme="special" className="w-56">
        Default
      </Button>
      <Button colorTheme="primary" variant="solid">
        solid
      </Button>
      <Button colorTheme="warning" variant="soft">
        soft
      </Button>
      <Button colorTheme="primary" variant="bordered">
        bordered
      </Button>
      <Button colorTheme="danger" variant="ghost">
        ghost
      </Button>
    </div>
  );
}
