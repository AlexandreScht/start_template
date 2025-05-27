import Button from '../buttons';
import ThemeSwitcher from '../buttons/theme';

export default async function HeaderBar() {
  return (
    <nav className="border-b-1.5 border-b-secondary-v5 sticky top-0 flex h-16 w-full items-center justify-between px-3">
      <div className="flex items-center gap-x-5">
        <h1 className="text-asset-12 m-0">Custom Chess</h1>
        <ThemeSwitcher className="bg-secondary-v3 border-1 border-secondary-v6 hover:bg-secondary-v4 mb-1.5 h-10 w-10" />
      </div>
      <div className="flex flex-row items-center gap-5">
        <Button colorTheme="primary" className="mb-1.5 py-3.5">
          Connexion
        </Button>
      </div>
    </nav>
  );
}
