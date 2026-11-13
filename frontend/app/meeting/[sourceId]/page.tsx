import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getMeeting } from "@/lib/data";
import { meetingTitle } from "@/lib/format";

// Screen 2: Meeting view. Placeholder until step 3 builds the full "recreated meeting".
export default function MeetingPage({ params }: PageProps<"/meeting/[sourceId]">) {
  return (
    <div className="mx-auto max-w-page px-6 py-16">
      <Link href="/#library" className="text-muted hover:text-ink">
        ← Library
      </Link>
      {/* params and file reads happen at request time, so they stream in inside Suspense. */}
      <Suspense fallback={<div className="mt-6 h-10 w-1/2 animate-pulse rounded bg-subtle" />}>
        <MeetingContent params={params} />
      </Suspense>
    </div>
  );
}

async function MeetingContent({ params }: { params: Promise<{ sourceId: string }> }) {
  await connection();
  const { sourceId } = await params;
  const meeting = await getMeeting(decodeURIComponent(sourceId));
  if (!meeting) notFound();
  return (
    <>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{meetingTitle(meeting.info.file_name)}</h1>
      <p className="mt-3 text-muted">
        {meeting.slides.length} slides. The full meeting view is built in the next step.
      </p>
    </>
  );
}
