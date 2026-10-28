"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BUCKET = "ngo-media";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

type MediaType = "photo" | "video";

type MediaItem = {
  id: number;
  created_at: string;
  title: string | null;
  type: string | null;
  url: string | null;
  description: string | null;
};

function getMediaType(file: File): MediaType | null {
  const mimeType = file.type.toLowerCase();
  const filename = file.name.toLowerCase();

  if (
    mimeType.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|avif|heic|heif|bmp)$/i.test(filename)
  ) {
    return "photo";
  }

  if (
    mimeType.startsWith("video/") ||
    /\.(mp4|mov|webm|m4v|3gp|avi|mkv)$/i.test(filename)
  ) {
    return "video";
  }

  return null;
}

function getContentType(file: File, type: MediaType): string {
  if (file.type) return file.type;

  const extension = file.name.split(".").pop()?.toLowerCase();

  const imageTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
    heic: "image/heic",
    heif: "image/heif",
    bmp: "image/bmp",
  };

  const videoTypes: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    m4v: "video/x-m4v",
    "3gp": "video/3gpp",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
  };

  return type === "photo"
    ? imageTypes[extension || ""] || "image/jpeg"
    : videoTypes[extension || ""] || "video/mp4";
}

export default function AdminMediaPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<MediaType>("photo");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [description, setDescription] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);

  // Check the current demo login and load media records.
  useEffect(() => {
    if (localStorage.getItem("adminLoggedIn") !== "true") {
      router.replace("/admin/login");
      return;
    }

    let active = true;

    async function loadMedia() {
      setLoading(true);

      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Error loading media:", error);
        setErrorMessage("Unable to load media. Please try again.");
      } else {
        setMedia((data ?? []) as MediaItem[]);
      }

      setLoading(false);
    }

    void loadMedia();

    return () => {
      active = false;
    };
  }, [router]);

  // Create a local preview for the selected file.
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  // Automatically hide notifications after five seconds.
  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!errorMessage) return;

    const timer = window.setTimeout(() => {
      setErrorMessage("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setErrorMessage("");
    setSuccessMessage("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const detectedType = getMediaType(file);

    if (!detectedType) {
      setSelectedFile(null);
      event.target.value = "";
      setErrorMessage("Please select a supported image or video file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      event.target.value = "";
      setErrorMessage("The selected file is larger than 50 MB.");
      return;
    }

    setSelectedFile(file);
    setType(detectedType);
  }

  async function addMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setErrorMessage("Please enter a title.");
      return;
    }

    if (!selectedFile) {
      setErrorMessage("Please choose an image or video from your device.");
      return;
    }

    const detectedType = getMediaType(selectedFile);

    if (!detectedType || detectedType !== type) {
      setErrorMessage("Please select a valid file for the chosen media type.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMessage("The selected file is larger than 50 MB.");
      return;
    }

    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    let uploadedPath = "";

    try {
      // Create a safe, unique filename.
      const safeFilename = selectedFile.name
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9._-]/g, "_");

      uploadedPath = `${Date.now()}-${safeFilename}`;

      // Upload the actual file to Supabase Storage.
      const { data: uploadedFile, error: uploadError } =
        await supabase.storage.from(BUCKET).upload(
          uploadedPath,
          selectedFile,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: getContentType(selectedFile, type),
          }
        );

      if (uploadError) {
        console.error("Storage upload failed:", uploadError);
        setErrorMessage(
          "Upload failed. Check your Supabase Storage bucket, permissions, and file size."
        );
        return;
      }

      uploadedPath = uploadedFile.path;

      // Obtain a public URL so Gallery and Videos can display the file.
      const { data: publicData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(uploadedPath);

      const publicUrl = publicData.publicUrl;

      // Save the uploaded file's details in the existing media table.
      const { data: savedMedia, error: databaseError } = await supabase
        .from("media")
        .insert([
          {
            title: title.trim(),
            type,
            url: publicUrl,
            description: description.trim(),
          },
        ])
        .select("*")
        .single();

      if (databaseError) {
        console.error("Saving media record failed:", databaseError);

        // Try to remove the uploaded file if its record could not be saved.
        const { error: cleanupError } = await supabase.storage
          .from(BUCKET)
          .remove([uploadedPath]);

        if (cleanupError) {
          console.error("Upload cleanup failed:", cleanupError);
        }

        setErrorMessage(
          "The file uploaded, but its media record could not be saved. Check the media table permissions."
        );
        return;
      }

      setMedia((current) => [savedMedia as MediaItem, ...current]);

      setTitle("");
      setType("photo");
      setSelectedFile(null);
      setDescription("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccessMessage("Media uploaded successfully.");
    } catch (error) {
      console.error("Unexpected upload error:", error);
      setErrorMessage("Something went wrong while uploading. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMedia() {
    if (!deleteTarget) return;

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Delete the database record first.
      const { error: databaseError } = await supabase
        .from("media")
        .delete()
        .eq("id", deleteTarget.id);

      if (databaseError) {
        console.error("Error deleting media record:", databaseError);
        setErrorMessage("Could not delete this media record.");
        return;
      }

      // Remove the actual file if it belongs to our storage bucket.
      let fileCleanupFailed = false;
      const marker = `/storage/v1/object/public/${BUCKET}/`;
      const mediaUrl = deleteTarget.url || "";
      const markerIndex = mediaUrl.indexOf(marker);

      if (markerIndex !== -1) {
        const encodedPath = mediaUrl
          .slice(markerIndex + marker.length)
          .split("?")[0];

        const storagePath = decodeURIComponent(encodedPath);

        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .remove([storagePath]);

        if (storageError) {
          console.error("Error removing storage file:", storageError);
          fileCleanupFailed = true;
        }
      }

      setMedia((current) =>
        current.filter((item) => item.id !== deleteTarget.id)
      );

      setDeleteTarget(null);

      setSuccessMessage(
        fileCleanupFailed
          ? "Media record deleted, but the stored file could not be removed."
          : "Media deleted successfully."
      );
    } catch (error) {
      console.error("Unexpected delete error:", error);
      setErrorMessage("Something went wrong while deleting media.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-[#25283B]">
      {/* PAGE HEADER */}
      <header className="bg-[#25283B] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFC928]">
              Administration
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Media Management
            </h1>

            <p className="mt-1 text-sm text-white/60">
              Upload and manage photographs and videos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="shrink-0 bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#25283B] transition hover:bg-[#FFC928]"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* NOTIFICATIONS */}
        {successMessage && (
          <div
            role="status"
            className="mb-5 flex items-center justify-between gap-4 border border-green-200 bg-green-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-green-800">
              {successMessage}
            </p>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="text-xs font-bold text-green-800 underline"
            >
              Close
            </button>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-4 border border-red-200 bg-red-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-red-700">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="text-xs font-bold text-red-700 underline"
            >
              Close
            </button>
          </div>
        )}

        {/* UPLOAD FORM */}
        <section className="bg-white p-5 shadow-sm sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B28A00]">
            Media Library
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Upload New Media
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Select a photo or video directly from your computer or mobile
            device.
          </p>

          <form onSubmit={addMedia} className="mt-7">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* TITLE */}
              <div>
                <label
                  htmlFor="media-title"
                  className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500"
                >
                  Media Title *
                </label>

                <input
                  id="media-title"
                  type="text"
                  required
                  maxLength={150}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Puppy Care"
                  className="mt-2 w-full border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#25283B]"
                />
              </div>

              {/* TYPE */}
              <div>
                <label
                  htmlFor="media-type"
                  className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500"
                >
                  Media Type *
                </label>

                <select
                  id="media-type"
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value as MediaType);
                    setSelectedFile(null);

                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="mt-2 w-full border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#25283B]"
                >
                  <option value="photo">Photo</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* FILE PICKER */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="media-file"
                  className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500"
                >
                  Choose File *
                </label>

                <div className="mt-2 border-2 border-dashed border-gray-300 bg-[#FAF8F0] p-5 sm:p-7">
                  <input
                    ref={fileInputRef}
                    id="media-file"
                    type="file"
                    required
                    accept={type === "photo" ? "image/*" : "video/*"}
                    onChange={handleFileChange}
                    className="block w-full cursor-pointer text-sm text-gray-600 file:mr-4 file:cursor-pointer file:border-0 file:bg-[#25283B] file:px-5 file:py-3 file:text-xs file:font-bold file:uppercase file:tracking-[0.1em] file:text-white hover:file:bg-[#B28A00]"
                  />

                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    On a computer, choose a file from File Explorer. On
                    a phone, select a photo or video from the available
                    gallery or file picker. Maximum size: 50 MB per file.
                  </p>


                  {selectedFile && (
                    <div className="mt-5 border-t border-gray-200 pt-4">
                      <p className="break-all text-sm font-semibold">
                        Selected: {selectedFile.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>

                      {previewUrl && type === "photo" && (
                        <img
                          src={previewUrl}
                          alt="Selected photo preview"
                          className="mt-4 max-h-64 max-w-full object-contain"
                        />
                      )}

                      {previewUrl && type === "video" && (
                        <video
                          src={previewUrl}
                          controls
                          playsInline
                          className="mt-4 max-h-64 max-w-full"
                        />
                      )}

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          setSelectedFile(null);

                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }

                          setErrorMessage("");
                          setSuccessMessage("");
                        }}
                        className="mt-4 border border-red-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove File
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="media-description"
                  className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500"
                >
                  Description
                </label>

                <textarea
                  id="media-description"
                  rows={3}
                  maxLength={1000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Write a short description (optional)"
                  className="mt-2 w-full resize-y border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#25283B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 bg-[#FFC928] px-7 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:bg-[#25283B] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Uploading File..."
                : `Upload ${type === "photo" ? "Photo" : "Video"}`}
            </button>
          </form>
        </section>

        {/* MEDIA LIBRARY */}
        <section className="mt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B28A00]">
                Saved Records
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Media Library
              </h2>
            </div>

            <div className="bg-[#25283B] px-4 py-3 text-sm font-bold text-white">
              {media.length} Items
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-10 text-center text-sm text-gray-500">
              Loading media...
            </div>
          ) : media.length === 0 ? (
            <div className="border border-dashed border-gray-300 bg-white p-10 text-center">
              <h3 className="text-lg font-bold">No media added yet</h3>

              <p className="mt-2 text-sm text-gray-500">
                Use the upload form above to add your first photo or video.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {media.map((item) => (
                <article
                  key={item.id}
                  className="flex min-w-0 flex-col overflow-hidden bg-white shadow-sm"
                >
                  <div className="relative flex h-56 items-center justify-center overflow-hidden bg-[#25283B]">
                    {item.url && item.type === "photo" ? (
                      <img
                        src={item.url}
                        alt={item.title || "Animal welfare photo"}
                        className="h-full w-full object-cover"
                      />
                    ) : item.url && item.type === "video" ? (
                      <video
                        src={item.url}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <p className="px-4 text-center text-sm text-white/60">
                        Preview unavailable
                      </p>
                    )}

                    <span className="absolute left-3 top-3 bg-[#FFC928] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#25283B]">
                      {item.type || "Media"}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="break-words text-lg font-bold">
                      {item.title || "Untitled media"}
                    </h3>

                    {item.description && (
                      <p className="mt-2 break-words text-sm leading-6 text-gray-500">
                        {item.description}
                      </p>
                    )}

                    <p className="mt-3 break-all text-xs text-gray-400">
                      {item.url}
                    </p>

                    <p className="mt-3 text-xs text-gray-400">
                      Added{" "}
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="mt-5 border border-red-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-600 hover:text-white"
                    >
                      Delete Media
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25283B]/70 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-media-title"
            className="w-full max-w-md bg-white p-7 shadow-xl sm:p-8"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Confirmation
            </p>

            <h3
              id="delete-media-title"
              className="mt-3 text-2xl font-bold"
            >
              Delete this media?
            </h3>

            <p className="mt-3 break-words text-sm leading-6 text-gray-500">
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.title || "this item"}</strong>?
              The media record and its stored file will be removed when
              the required permissions are available.
            </p>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-300 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={deleteMedia}
                className="flex-1 bg-red-600 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}