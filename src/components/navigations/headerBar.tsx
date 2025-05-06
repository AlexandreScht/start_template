import Image from 'next/image';
import Link from 'next/link';
import Button from '../buttons';
import ThemeSwitcher from '../buttons/theme';

export default async function HeaderBar() {
  return (
    <nav className="w-full sticky top-0 h-16 border-b-1.5 border-b-secondary-v5 flex items-center px-3 justify-between">
      <Image suppressHydrationWarning src="/cvSnap_logo.svg" alt="cvsnap logo" width={75} height={40} className="invert-(--icon-display)" />
      <ul className="list-none p-0 m-0 flex flex-row space-x-5 items-baseline mb-1.5">
        <li>
          <Link href="#" className="px-3 py-1.5 bg-secondary-v12 text-black/90 font-medium cursor-default rounded-md">
            Nouveau CV
          </Link>
        </li>
        <li>
          <Link href="#" className="px-3 py-1.5 text-secondary-v11 underline-from-center pb-1.5">
            Templates CV
          </Link>
        </li>
      </ul>
      <div className="flex flex-row gap-5 items-center">
        <Button colorTheme="primary" className="py-3.5  mb-1.5">
          Connexion
        </Button>
        <ThemeSwitcher className="mb-1.5 w-10 h-10 bg-secondary-v3 border-1 border-secondary-v6 hover:bg-secondary-v4" />
      </div>
    </nav>
  );
}
