import Link from "next/link";

// Items that are planned but not built yet. They stay visible so the product's
// structure is clear in the demo, but they are not clickable.
const LATER = ["Library", "Search", "Duplicates"];

export function TopNav() {
  return (
    <header className="border-b border-line">
      <nav className="mx-auto flex h-16 max-w-content items-center justify-between px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Data Vault
        </Link>
        <ul className="flex items-center gap-8 text-sm">
          <li>
            <Link href="/" className="hover:text-accent">
              Compress
            </Link>
          </li>
          {LATER.map((label) => (
            <li key={label}>
              <span aria-disabled="true" title="Coming soon" className="cursor-default text-faint">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
