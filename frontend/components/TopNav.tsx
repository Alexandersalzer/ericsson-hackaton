import Link from "next/link";

// Planned sections: visible so the product's structure is clear, but not clickable yet.
const LATER = ["Search", "Duplicates"];

export function TopNav({ isMock }: { isMock: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-page items-center gap-3 px-6 sm:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold tracking-tight">
          <Logo />
          Data Vault
        </Link>

        <ul className="flex items-center gap-1">
          <NavItem href="/">Compress</NavItem>
          <NavItem href="/#library">Library</NavItem>
          {LATER.map((label) => (
            // Hidden on phones: the nav must never be wider than the screen.
            <li key={label} className="hidden md:block">
              <span
                aria-disabled="true"
                className="flex cursor-default items-center gap-1.5 rounded-md px-3 py-1.5 text-faint"
              >
                {label}
                <span className="rounded-full border border-line px-1.5 text-[10px] leading-4">Soon</span>
              </span>
            </li>
          ))}
        </ul>

        {isMock && (
          <span
            title="Showing generated sample data. Set DATA_SOURCE=real to read data/output/."
            className="ml-auto hidden rounded-full border sm:inline border-line bg-subtle px-2.5 py-0.5 font-mono text-xs text-muted"
          >
            mock data
          </span>
        )}
      </nav>
    </header>
  );
}

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="rounded-md px-3 py-1.5 text-muted transition-colors hover:bg-subtle hover:text-ink">
        {children}
      </Link>
    </li>
  );
}

/** Simple mark: three stacked bars (= layers of compressed data). */
function Logo() {
  return (
    <span className="grid size-6 place-items-center rounded-md bg-ink" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
        <rect x="1" y="1" width="10" height="2" rx="1" />
        <rect x="2.5" y="5" width="7" height="2" rx="1" />
        <rect x="4" y="9" width="4" height="2" rx="1" />
      </svg>
    </span>
  );
}
