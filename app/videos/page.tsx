"use client";

import { useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
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
  viewerDiscretion?: boolean;
};

type Orientation = "portrait" | "landscape" | "square";

const defaultVideos: VideoItem[] = [
  {
    key: "old-video-1",
    title: "Animal Treatment in Progress",
    url: "/videos/ngo-media-video-1.mp4",
    description:
      "A glimpse of an animal receiving hands-on care. Viewer discretion is advised.",
    viewerDiscretion: true,
  },
  {
    key: "old-video-2",
    title: "Injury and Recovery Care",
    url: "/videos/ngo-media-video-2.mp4",
    description:
      "A recovery-related clip showing a visible injury. Viewer discretion is advised.",
    viewerDiscretion: true,
  },
  {
    key: "old-video-3",
    title: "Care in the Shelter",
    url: "/videos/ngo-media-video-3.mp4",
    description: "A glimpse of animals in a care environment.",
  },
  {
    key: "new-video-1",
    title: "Daily Animal Care",
    url: "/videos/ngo-stories/ngo-story-01.mp4",
    description: "A short look at animals in the organisation's care.",
  },
  {
    key: "new-video-2",
    title: "Rescue and Transport",
    url: "/videos/ngo-stories/ngo-story-02.mp4",
    description: "A rescue-related transport moment.",
  },
  {
    key: "new-video-3",
    title: "Volunteer and Rescued Dog",
    url: "/videos/ngo-stories/ngo-story-03.mp4",
    description: "A volunteer spending time with a dog.",
  },
  {
    key: "new-video-4",
    title: "Recovery Care",
    url: "/videos/ngo-stories/ngo-story-04.mp4",
    description: "A clip related to animal care and recovery.",
    viewerDiscretion: true,
  },
  {
    key: "new-video-5",
    title: "Animal Shelter",
    url: "/videos/ngo-stories/ngo-story-05.mp4",
    description: "A view of an animal-care space.",
  },
];

function uniqueItems(items: VideoItem[]) {
  const seenUrls = new Set<string>();

  return items.filter((item) => {
    const urlKey = item.url.trim().toLowerCase();
    if (seenUrls.has(urlKey)) return false;
    seenUrls.add(urlKey);
    return true;
  });
}

function VideoCard({ video }: { video: VideoItem }) {
  const [orientation, setOrientation] = useState<Orientation>("landscape");

  function detectOrientation(event: SyntheticEvent<HTMLVideoElement>) {
    const player = event.currentTarget;
    const { videoWidth, videoHeight } = player;

    if (!videoWidth || !videoHeight) return;

    const ratio = videoWidth / videoHeight;

    if (ratio < 0.92) {
      setOrientation("portrait");
    } else if (ratio > 1.08) {
      setOrientation("landscape");
    } else {
      setOrientation("square");
    }
  }

  const playerStyle =
    orientation === "portrait"
      ? {
        height: "min(68vh, 640px)",
        width: "auto",
        maxWidth: "100%",
        objectFit: "contain" as const,
      }
      : orientation === "square"
        ? {
          width: "min(100%, 68vh)",
          height: "auto",
          maxHeight: "68vh",
          objectFit: "contain" as const,
        }
        : {
          width: "100%",
          height: "auto",
          maxHeight: "68vh",
          objectFit: "contain" as const,
        };

  return (
    <article className="min-w-0 overflow-hidden bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="flex min-h-[220px] items-center justify-center bg-[#25283B] p-3 sm:p-4">
        <video
          src={video.url}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={detectOrientation}
          style={playerStyle}
          className="block"
        >
          Your browser does not support video playback.
        </video>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold sm:text-xl">{video.title}</h2>
          {video.viewerDiscretion && (
            <span className="inline-flex bg-[#FCE0E0] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#A51D24]">
              Viewer discretion
            </span>
          )}
        </div>

        {video.description && (
          <p className="mt-3 text-sm leading-6 text-[#25283B]/65">
            {video.description}
          </p>
        )}
      </div>
    </article>
  );
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

      if (error) {
        console.error("Could not load video media:", error);
      }

      const databaseVideos: VideoItem[] = ((data ?? []) as MediaRecord[])
        .filter((item) => Boolean(item.url?.trim()))
        .map((item) => {
          const savedTitle = item.title?.trim() || "";
          const isGenericVideoOne = /^ngo\s+video\s+1$/i.test(savedTitle);
          const isGenericVideoTwo = /^ngo\s+video\s+2$/i.test(savedTitle);
          const isGenericVideoThree = /^ngo\s+video\s+3$/i.test(savedTitle);
          const isGenericVideoFour = /^ngo\s+video\s+4$/i.test(savedTitle);
          const isGenericVideoFive = /^ngo\s+video\s+5$/i.test(savedTitle);

          // Replace generic demonstration titles with clearer labels.
          // Other titles entered in Admin Media are preserved.
          let title = savedTitle || "Video Story";
          let description = item.description?.trim() || "";
          let viewerDiscretion = false;

          if (isGenericVideoOne) {
            title = "Animal Treatment in Progress";
            description = "A close view of an animal receiving hands-on care. Viewer discretion is advised.";
            viewerDiscretion = true;
          } else if (isGenericVideoTwo) {
            title = "Injury and Recovery Care";
            description = "Recovery-related footage showing a visible injury. Viewer discretion is advised.";
            viewerDiscretion = true;
          } else if (isGenericVideoThree) {
            title = "Care in the Shelter";
            description = description || "A glimpse of animals in a care environment.";
          } else if (isGenericVideoFour) {
            title = "Animal Rescue and Care";
            description = description || "A video related to the organisation's animal-care activities.";
          } else if (isGenericVideoFive) {
            title = "Animal Welfare Story";
            description = description || "A video shared by the organisation.";
          }

          const needsViewerDiscretion =
            viewerDiscretion ||
            /\b(injury|injured|wound|wounded|treatment|recovery)\b/i.test(
              `${title} ${description}`
            );

          if (
            needsViewerDiscretion &&
            !/viewer discretion/i.test(description)
          ) {
            description = description
              ? `${description} Viewer discretion is advised.`
              : "This clip may show visible injuries or treatment. Viewer discretion is advised.";
          }

          return {
            key: `database-${item.id}`,
            title,
            url: item.url!.trim(),
            description,
            viewerDiscretion: needsViewerDiscretion,
          };
        });

      setVideos(uniqueItems([...databaseVideos, ...defaultVideos]));
      setLoading(false);
    }

    void loadVideos();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#FAF8F0] text-[#25283B]">
      <header className="bg-[#25283B] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a
            href="/?media=1#media"
            className="text-xs font-bold uppercase tracking-[0.12em] text-white/80 transition hover:text-[#FFC928]"
          >
            ← Back to Media
          </a>


          <a
            href="/?top=1"
            className="text-xs font-bold uppercase tracking-[0.12em] text-[#FFC928]"
          >
            Home
          </a>


        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#B28A00]">
          Benevolent Souls Foundation
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
          Video Stories
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-7 text-[#25283B]/65">
          Watch videos shared from the organisation's animal care, rescue, and
          shelter activities.
        </p>

        <div className="mt-10 flex items-center justify-between border-b border-[#25283B]/15 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em]">
            Videos
          </p>
          <p className="text-sm text-[#25283B]/60">
            {videos.length} videos
          </p>
        </div>

        {loading && (
          <p className="mt-4 text-sm text-[#25283B]/50">
            Checking for newly uploaded videos...
          </p>
        )}

        <div className="mt-7 grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video.key} video={video} />
          ))}
        </div>

        <div className="mt-16 border-t border-[#25283B]/15 pt-8">
          <a
            href="/gallery"
            className="inline-flex items-center gap-4 bg-[#FFC928] px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] transition hover:bg-[#25283B] hover:text-white"
          >
            View Photo Gallery <span>→</span>
          </a>
        </div>
      </section>

      <footer className="bg-[#25283B] px-5 py-6 text-center text-xs text-white/50">
        Benevolent Souls Foundation
      </footer>
    </main>
  );
}
