import { Suspense } from "react";
import { CompressPanel } from "@/components/CompressPanel";
import { Library, LibrarySkeleton } from "@/components/Library";
import { DATA_SOURCE } from "@/lib/data";

// Screen 1: Compress. Drop a recording at the top, see all compressed meetings below.
export default function Home() {
  return (
    <div className="mx-auto max-w-page px-6">
      <section className="pb-12 pt-16 sm:pt-20">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tighter sm:text-5xl">
          Keep all knowledge, at a fraction of the storage.
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted">
          Turn meeting recordings into readable text and slide images. Searchable, AI-ready, and about 99% smaller.
        </p>
      </section>

      <section aria-label="Compress a recording" className="pb-16">
        <CompressPanel isMock={DATA_SOURCE === "mock"} />
      </section>

      <section id="library" className="scroll-mt-20 border-t border-line pb-24 pt-10">
        {/* The library reads from disk at request time, so it streams in behind a skeleton. */}
        <Suspense fallback={<LibrarySkeleton />}>
          <Library />
        </Suspense>
      </section>
    </div>
  );
}
