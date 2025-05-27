import Link from 'next/link';
import Button from '../buttons';
import ThemeSwitcher from '../buttons/theme';

export default async function HeaderBar() {
  return (
    <nav className="border-b-1.5 border-b-secondary-v5 sticky top-0 flex h-16 w-full items-center justify-between px-3">
      <ThemeSwitcher className="bg-secondary-v3 border-1 border-secondary-v6 hover:bg-secondary-v4 mb-1.5 h-10 w-10" />
      <ul className="m-0 mb-1.5 flex list-none flex-row items-baseline space-x-5 p-0">
        <li>
          <Link href="#" className="bg-asset-v12 text-foreground cursor-default rounded-md px-3 py-1.5 font-medium">
            Button A
          </Link>
        </li>
        <li>
          <Link href="#" className="text-secondary-v11 underline-from-center px-3 py-1.5 pb-1.5">
            Button B
          </Link>
        </li>
      </ul>
      <div className="flex flex-row items-center gap-5">
        <Button colorTheme="primary" className="mb-1.5 py-3.5">
          Connexion
        </Button>
      </div>
    </nav>
  );
}
