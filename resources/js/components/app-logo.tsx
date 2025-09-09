// Change to named exports instead of two defaults
import AppLogoIcon from './app-logo-icon';

export function AppLogo() {
  return (
    <>
      <div className="flex size-8 items-center justify-center text-sidebar-primary-foreground">
        <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
      </div>
      <div className="ml-1 grid flex-1 text-left text-sm">
        <span className="mb-0.5 truncate leading-tight font-semibold">CHED System</span>
      </div>
    </>
  );
}

export function AppLogoWide() {
  return (
    <>
      <div className="flex size-8 items-center justify-center text-sidebar-primary-foreground">
        <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
      </div>
      <div className="ml-1 grid flex-1 text-left text-sm">
        <div className="flex flex-col">
          <span className="hidden lg:block self-center text-2xs font-semibold whitespace-nowrap text-white dark:text-[#EDEDEC]">
            COMMISSION ON HIGHER EDUCATION
          </span>
          <span className="lg:hidden sm:block  text-2xs font-semibold whitespace-nowrap text-white dark:text-[#EDEDEC]">
            CHED
          </span>
          <span className="hidden lg:block text-2xs font-semibold whitespace-nowrap text-white dark:text-[#EDEDEC]">
            CHED System
          </span>
          <span className="lg:hidden sm:block text-2xs font-semibold whitespace-nowrap text-white dark:text-[#EDEDEC]">
            System
          </span>
        </div>
      </div>
    </>
  );
}
