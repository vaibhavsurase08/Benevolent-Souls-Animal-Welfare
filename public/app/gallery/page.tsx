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

type GalleryItem = {
  key: string;
  title: string;
  url: string;
  description: string;
};

const defaultPhotos: GalleryItem[] = [
  { key: "old-community", title: "Community and Animals", url: "/image/ngo/ngo-animals-community.jpeg", description: "Community and animals supported by the organisation." },
  { key: "old-care", title: "Animal Care", url: "/image/ngo/ngo-animal-care.jpeg", description: "Animal care and welfare activities." },
  { key: "old-puppy", title: "Puppy Care", url: "/image/ngo/ngo-puppy-care.jpeg", description: "A puppy receiving care." },
  { key: "old-recognition", title: "Recognition Event", url: "/image/ngo/ngo-recognition-event.jpeg", description: "An event connected with the organisation." },
  { key: "old-vaccination", title: "Vaccination Activities", url: "/image/ngo/ngo-vaccination.jpeg", description: "Community animal welfare activities." },
  { key: "community-01", title: "Rescue and Animal Care", url: "/image/ngo/community/ngo-community-01.jpeg", description: "A volunteer holding a rescued puppy." },
  { key: "community-02", title: "Caring for Animals", url: "/image/ngo/community/ngo-community-02.jpeg", description: "A volunteer with a dog." },
  { key: "community-03", title: "Volunteer with a Dog", url: "/image/ngo/community/ngo-community-03.jpeg", description: "An animal care moment." },
  { key: "community-04", title: "Care for Cats Too", url: "/image/ngo/community/ngo-community-04.jpeg", description: "A volunteer with a cat." },
  { key: "community-05", title: "Rescue Support", url: "/image/ngo/community/ngo-community-05.jpeg", description: "People helping animals during transport." },
  { key: "community-06", title: "Volunteer Holding a Puppy", url: "/image/ngo/community/ngo-community-06.jpeg", description: "A volunteer holding a puppy." },
  { key: "community-07", title: "Helping a Dog", url: "/image/ngo/community/ngo-community-07.jpeg", description: "A moment of care for a dog." },
  { key: "community-08", title: "Community Animal Care", url: "/image/ngo/community/ngo-community-08.jpeg", description: "A volunteer spending time with a dog." },
  { key: "community-09", title: "Animal Welfare in Action", url: "/image/ngo/community/ngo-community-09.jpeg", description: "A volunteer and a dog outdoors." },
  { key: "community-10", title: "Rescue Volunteer", url: "/image/ngo/community/ngo-community-10.jpeg", description: "A volunteer holding a dog." },
  { key: "community-11", title: "Animal Transport", url: "/image/ngo/community/ngo-community-11.jpeg", description: "People and a dog during transport." },
  { key: "community-12", title: "Caring for Puppies", url: "/image/ngo/community/ngo-community-12.jpeg", description: "A volunteer holding a group of puppies." },
  { key: "community-13", title: "Volunteer and Dog", url: "/image/ngo/community/ngo-community-13.jpeg", description: "A volunteer with a dog." },
  { key: "community-14", title: "Animal Rescue Team", url: "/image/ngo/community/ngo-community-14.jpeg", description: "An animal rescue vehicle and volunteer." },
];

function uniqueItems(items: GalleryItem[]) {
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

export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryItem[]>(defaultPhotos);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPhotos() {
      const { data, error } = await supabase
        .from("media")
        .select("id, title, type, url, description, created_at")
        .eq("type", "photo")
        .order("created_at", { ascending: false });

      if (!active) return;
      if (error) console.error("Could not load gallery media:", error);

      const databasePhotos: GalleryItem[] = ((data ?? []) as MediaRecord[])
        .filter((item) => Boolean(item.url?.trim()))
        .map((item) => ({
          key: `database-${item.id}`,
          title: item.title?.trim() || "Animal Welfare Photo",
          url: item.url!.trim(),
          description: item.description?.trim() || "",
        }));

      setPhotos(uniqueItems([...databasePhotos, ...defaultPhotos]));
      setLoading(false);
    }

    void loadPhotos();
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
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">Photo Gallery</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#25283B]/65">Photographs of animal care, rescue support and community interactions shared by the organisation.</p>
        <div className="mt-10 flex items-center justify-between border-b border-[#25283B]/15 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em]">Photographs</p>
          <p className="text-sm text-[#25283B]/60">{photos.length} photos</p>
        </div>
        {loading && <p className="mt-4 text-sm text-[#25283B]/50">Checking for newly uploaded photographs...</p>}
        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <article key={photo.key} className="group overflow-hidden bg-white shadow-sm">
              <div className="aspect-[4/3] overflow-hidden bg-[#EAE6DB]">
                <img src={photo.url} alt={photo.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
              </div>
              <div className="p-5">
                <h2 className="text-lg font-bold">{photo.title}</h2>
                {photo.description && <p className="mt-2 text-sm leading-6 text-[#25283B]/60">{photo.description}</p>}
              </div>
            </article>
          ))}
        </div>
        <div className="mt-16 border-t border-[#25283B]/15 pt-8">
          <a href="/videos" className="inline-flex items-center gap-4 bg-[#FFC928] px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] transition hover:bg-[#25283B] hover:text-white">Explore Video Stories <span>→</span></a>
        </div>
      </section>
      <footer className="bg-[#25283B] px-5 py-6 text-center text-xs text-white/50">Benevolent Souls Foundation</footer>
    </main>
  );
}
