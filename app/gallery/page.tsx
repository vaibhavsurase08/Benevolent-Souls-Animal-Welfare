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
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

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
          <a href="/?media=1#media" className="text-xs font-bold uppercase tracking-[0.12em] text-white/80 transition hover:text-[#FFC928]">← Back to Media</a>


          <a
            href="/?top=1"
            className="text-xs font-bold uppercase tracking-[0.12em] text-[#FFC928]"
          >
            Home
          </a>


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
        <div className="mt-7 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {photos.map((photo) => (
            <article
              key={photo.key}
              className="mb-6 inline-block w-full break-inside-avoid overflow-hidden bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg"
            >
              <button
                type="button"
                onClick={() => setSelectedPhoto(photo)}
                aria-label={`View full image: ${photo.title}`}
                className="group relative block aspect-[4/3] w-full overflow-hidden bg-[#EAE6DB]"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  loading="lazy"
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />

                <span className="absolute bottom-3 right-3 bg-[#25283B]/90 p-1 text-[10px] text-white rounded">
                  ⛶
                </span>
              </button>

              <div className="p-5">
                <h2 className="text-lg font-bold text-[#25283B]">
                  {photo.title}
                </h2>

                {photo.description && (
                  <p className="mt-2 text-sm leading-6 text-[#25283B]/60">
                    {photo.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
      <footer className="bg-[#25283B] px-5 py-6 text-center text-xs text-white/50">Benevolent Souls Foundation
      </footer>
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Viewing ${selectedPhoto.title}`}
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative flex max-h-[95vh] max-w-[96vw] flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              aria-label="Close image viewer"
              className="mb-3 self-end rounded-full bg-[#FFC928] px-4 py-2 text-2xl font-bold text-[#25283B]"
            >
              ×
            </button>

            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="max-h-[82vh] max-w-[94vw] object-contain"
            />

            <div className="mt-3 text-center">
              <h2 className="text-lg font-bold text-white">
                {selectedPhoto.title}
              </h2>

              {selectedPhoto.description && (
                <p className="mt-1 text-sm text-white/70">
                  {selectedPhoto.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
