import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Bookmark, Clock3, ExternalLink, MessageCircle, ShieldCheck, ThumbsDown, ThumbsUp } from "lucide-react";
import { demoPosts } from "@/features/feed/demo-data";

export function generateStaticParams() {
  return demoPosts.map((post) => ({ slug: post.slug }));
}

export default async function PolicyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = demoPosts.find((item) => item.slug === slug);
  if (!post) return <main className="content-width py-16"><h1 className="font-display text-3xl font-bold">Discussion not found</h1><Link href="/" className="mt-4 inline-block accent">Return to feed</Link></main>;

  return <main className="content-width min-h-screen py-6 pb-24 md:py-10">
    <Link href="/" className="inline-flex items-center gap-2 text-xs muted"><ArrowLeft size={14}/> Back to discussions</Link>
    <article className="mx-auto mt-6 max-w-[820px] overflow-hidden rounded-[24px] border" style={{background:"var(--surface)",borderColor:"var(--line)"}}>
      <div className="relative h-[220px] sm:h-[340px]">
        <Image src={post.image} alt={post.imageAlt} fill priority sizes="(max-width: 820px) 100vw, 820px" className="object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
        <span className="absolute bottom-5 left-5 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-white backdrop-blur">{post.category}</span>
      </div>
      <div className="p-5 sm:p-9">
        <div className="flex flex-wrap items-center gap-2 text-[11px] muted"><span>PolicyLens demo consultation</span><span>·</span><span>{post.language}</span><span>·</span><span>{post.status}</span></div>
        <h1 className="font-display mt-4 text-[32px] font-extrabold leading-[1.08] sm:text-[46px]">{post.title}</h1>
        <p className="mt-5 text-[15px] leading-7 muted">{post.excerpt}</p>
        <div className="mt-6 rounded-xl p-4" style={{background:"var(--surface-subtle)"}}>
          <p className="text-[10px] font-bold uppercase tracking-[.15em] accent">Consultation context</p>
          <p className="mt-2 text-sm leading-6">The full policy text, eligibility details, closing date and official source will appear here when connected to the consultation API. This is illustrative content, not an active government consultation.</p>
          <a href={post.sourceUrl} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold accent">View source details <ExternalLink size={13}/></a>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-y py-4" style={{borderColor:"var(--line)"}}>
          <span className="inline-flex items-center gap-2 text-xs muted"><MessageCircle size={15}/>{post.comments} responses <span className="text-[10px]">(demo)</span></span><span className="flex-1"/>
          <button type="button" className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs" style={{borderColor:"var(--line)"}}><Bookmark size={14}/> Save</button>
        </div>
        <section className="mt-7">
          <h2 className="font-display text-xl font-bold">Where do you stand?</h2>
          <p className="mt-1 text-xs muted">Review the source before sharing your position.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button type="button" className="flex flex-col items-center gap-2 rounded-xl border p-3 text-xs" style={{borderColor:"var(--line)"}}><ThumbsUp size={17} className="accent"/>Support</button>
            <button type="button" className="flex flex-col items-center gap-2 rounded-xl border p-3 text-xs" style={{borderColor:"var(--line)"}}><ThumbsDown size={17} className="muted"/>Oppose</button>
            <button type="button" className="flex flex-col items-center gap-2 rounded-xl border p-3 text-xs" style={{borderColor:"var(--line)"}}><ShieldCheck size={17} className="muted"/>No opinion</button>
          </div>
          <div className="mt-5 rounded-2xl border p-4 sm:p-5" style={{borderColor:"var(--line)"}}>
            <label htmlFor="comment" className="text-sm font-semibold">Add to the discussion</label>
            <textarea id="comment" rows={4} maxLength={3000} placeholder="Explain your view. What evidence or experience informs it?" className="mt-3 w-full resize-y rounded-xl border p-3 text-sm outline-none" style={{background:"var(--paper)",borderColor:"var(--line)"}}/>
            <div className="mt-3 flex items-center justify-between gap-3"><span className="text-[10px] muted">Be respectful. Support claims with evidence where possible.</span><Link href="/login" className="rounded-full px-4 py-2.5 text-xs font-semibold" style={{background:"var(--accent)",color:"var(--surface)"}}>Sign in to comment</Link></div>
          </div>
        </section>
        <section className="mt-8">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Community responses</h2><span className="inline-flex items-center gap-1 text-xs muted">Recent <Clock3 size={13}/></span></div>
          <div className="mt-4 rounded-xl border p-5" style={{borderColor:"var(--line)"}}><p className="text-sm font-semibold">Responses will appear here</p><p className="mt-1 text-xs leading-5 muted">Live responses will show account-controlled reactions, timestamp, stakeholder category and evidence when available.</p><p className="mt-4 text-[10px] muted">Community activity will remain separate from validated research findings.</p></div>
        </section>
        <div className="mt-5 text-[10px] muted">Comment editing and deletion will be server-limited to the first 10 minutes after posting.</div>
      </div>
    </article>
  </main>;
}
