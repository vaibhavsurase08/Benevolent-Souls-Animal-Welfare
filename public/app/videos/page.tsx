"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MediaRecord = {
  id: number;
  title: string | null;
  type: string | null;
  url: string | null;
  description: string | null;
  created_at: string;
};

type VideoItem = {
  key: string;
  title: string;
  url: string;
  description: string;
};

const defaultVideos: VideoItem[] = [
  { key: "old-video-1", title: "NGO Video 1", url: "/videos/ngo-media-video-1.mp4", description: "A video from the organisation's media collection." },
  { key: "old-video-2", title: "NGO Video 2", url: "/videos/ngo-media-video-2.mp4", description: "A video from the organisation's media collection." },
  { key: "old-video-3", title: "NGO Video 3", url: "/videos/ngo-media-video-3.mp4", description: "A video from the organisation's media collection." },
  { key: "new-video-1", title: "Daily Animal Care", url: "/videos/ngo-stories/ngo-story-01.mp4", description: "A look at dogs in the care environment." },
  { key: "new-video-2", title: "Rescue Transport", url: "/videos/ngo-stories/ngo-story-02.mp4", description: "A rescue-related transport moment." },
  { key: "new-video-3", title: "Volunteer and Rescued Dog", url: "/videos/ngo-stories/ngo-story-03.mp4", description: "A volunteer spending time with a dog." },
  { key: "new-video-4", title: "Recovery Care", url: "/videos/ngo-stories/ngo-story-04.mp4", description: "A non-graphic recovery-care scene." },
  { key: "new-video-5", title: "Animal Shelter", url: "/videos/ngo-stories/ngo-story-05.mp4", description: "A short view of an animal care space." },
];

function uniqueItems(items: VideoItem[]) {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  return items.filter((item) => {
    const urlKey = item.url.trim().toLowerCase();
    const titleKey = item.title.trim().toLowerCase();
    if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) return false;
    seenUrls.add(urlKey);
    seenTitles.add(titleKey);
    return true;
  });
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>(defaultVideos);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadVideos() {
      const { data, error } = await supabase
        .from("media")
        .select("id, title, type, url, description, created_at")
        .eq("type", "video")
        .order("created_at", { ascending: false });

      if (!active) return;
      if (error) console.error("Could not load video media:", error);

      const databaseVideos: VideoItem[] = ((data ?? []) as MediaRecord[])
        .filter((item) => Boolean(item.url?.trim()))
        .map((item) => ({
          key: `database-${item.id}`,
          title: item.title?.trim() || "Video Story",
          url: item.url!.trim(),
          description: item.description?.trim() || "",
        }));

      setVideos(uniqueItems([...databaseVideos, ...defaultVideos]));
      setLoading(false);
    }

    void loadVideos();
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-[#FAF8F0] text-[#25283B]">
      <header className="bg-[#25283B] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="/#stories" className="text-xs font-bold uppercase tracking-[0.12em] text-white/80 transition hover:text-[#FFC928]">← Back to Media</a>
          <a href="/" className="text-xs font-bold uppercase tracking-[0.12em] text-[#FFC928]">Home</a>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#B28A00]">Benevolent Souls Foundation</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">Video Stories</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#25283B]/65">Watch videos from the organisation's animal care and rescue work.</p>
        <div className="mt-10 flex items-center justify-between border-b border-[#25283B]/15 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em]">Videos</p>
          <p className="text-sm text-[#25283B]/60">{videos.length} videos</p>
        </div>
        {loading && <p className="mt-4 text-sm text-[#25283B]/50">Checking for newly uploaded videos...</p>}
        <div className="mt-7 grid gap-7 md:grid-cols-2">
          {videos.map((video) => (
            <article key={video.key} className="overflow-hidden bg-white shadow-sm">
              <div className="aspect-video bg-[#25283B]">
                <video src={video.url} controls playsInline preload="metadata" className="h-full w-full object-contain">Your browser does not support video playback.</video>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold">{video.title}</h2>
                {video.description && <p className="mt-3 text-sm leading-6 text-[#25283B]/60">{video.description}</p>}
              </div>
            </article>
          ))}
        </div>
        <div className="mt-16 border-t border-[#25283B]/15 pt-8">
          <a href="/gallery" className="inline-flex items-center gap-4 bg-[#FFC928] px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] transition hover:bg-[#25283B] hover:text-white">View Photo Gallery <span>→</span></a>
        </div>
      </section>
      <footer className="bg-[#25283B] px-5 py-6 text-center text-xs text-white/50">Benevolent Souls Foundation</footer>
    </main>
  );
}
