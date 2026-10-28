
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AddAnimalPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState("");
    const [species, setSpecies] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("available");

    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!imageFile) {
            setImagePreview("");
            return;
        }

        const previewUrl = URL.createObjectURL(imageFile);
        setImagePreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [imageFile]);

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            // Confirm that the admin is signed in.
            const { data: sessionData, error: sessionError } =
                await supabase.auth.getSession();

            if (sessionError || !sessionData.session) {
                setError("Your session has expired. Please log in again.");
                router.replace("/admin/login");
                return;
            }

            let uploadedImageUrl: string | null = null;

            // Upload the selected image to Supabase Storage.
            if (imageFile) {
                const safeFileName = imageFile.name
                    .toLowerCase()
                    .replace(/[^a-z0-9.-]/g, "-");

                const filePath =
                    `${Date.now()}-${safeFileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("animal-images")
                    .upload(filePath, imageFile, {
                        contentType: imageFile.type,
                        upsert: false,
                    });

                if (uploadError) {
                    console.error("Image upload error:", uploadError);
                    setError(
                        `Image upload failed: ${uploadError.message}`
                    );
                    return;
                }

                const { data: publicUrlData } = supabase.storage
                    .from("animal-images")
                    .getPublicUrl(filePath);

                uploadedImageUrl = publicUrlData.publicUrl;
            }

            // Save the animal and its image URL in the database.
            const { error: insertError } = await supabase
                .from("animals")
                .insert({
                    name: name.trim(),
                    species: species.trim(),
                    age: Number(age),
                    gender,
                    image_url: uploadedImageUrl,
                    description: description.trim(),
                    status,
                });

            if (insertError) {
                console.error("Animal insert error:", insertError);
                setError(
                    `Unable to save animal: ${insertError.message}`
                );
                return;
            }

            router.replace("/admin/animals");
        } catch (err) {
            console.error("Unexpected error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F8F9FA]">
            {/* Header */}
            <header className="bg-[#25283B] px-6 py-5 text-white shadow-md">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">
                            Add Animal
                        </h1>
                        <p className="mt-1 text-xs text-white/50">
                            Animal Management
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push("/admin/animals")}
                        className="bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:bg-[#FFC928]"
                    >
                        ← Animals
                    </button>
                </div>
            </header>

            {/* Form */}
            <section className="mx-auto max-w-5xl px-6 py-10">
                <div className="mb-8">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFC928]">
                        Management
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-[#25283B]">
                        Add New Animal
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Add an animal to the adoption section of the website.
                    </p>
                </div>

                <div className="bg-white p-8 shadow-sm sm:p-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name + Species */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="animal-name"
                                    className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#25283B]"
                                >
                                    Animal Name
                                </label>

                                <input
                                    id="animal-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Bruno"
                                    required
                                    disabled={saving}
                                    className="w-full border border-gray-200 px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#FFC928] disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="animal-species"
                                    className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#25283B]"
                                >
                                    Species
                                </label>

                                <input
                                    id="animal-species"
                                    type="text"
                                    value={species}
                                    onChange={(e) => setSpecies(e.target.value)}
                                    placeholder="e.g. Dog"
                                    required
                                    disabled={saving}
                                    className="w-full border border-gray-200 px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#FFC928] disabled:opacity-60"
                                />
                            </div>
                        </div>

                        {/* Age + Gender */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="animal-age"
                                    className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#25283B]"
                                >
                                    Age
                                </label>

                                <input
                                    id="animal-age"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    placeholder="e.g. 3"
                                    required
                                    disabled={saving}
                                    className="w-full border border-gray-200 px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#FFC928] disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="animal-gender"
                                    className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#25283B]"
                                >
                                    Gender
                                </label>

                                <select
                                    id="animal-gender"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    required
                                    disabled={saving}
                                    className="w-full border border-gray-200 bg-white px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#FFC928] disabled:opacity-60"
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>

                        {/* Image picker */}
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#25283B]">
                                Animal Image
                            </label>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                disabled={saving}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];

                                    if (!file) return;

                                    if (!file.type.startsWith("image/")) {
                                        setError("Please select an image file.");
                                        e.target.value = "";
                                        return;
                                    }

                                    if (file.size > 5 * 1024 * 1024) {
                                        setError(
                                            "Image size must be 5 MB or less."
                                        );
                                        e.target.value = "";
                                        return;
                                    }

                                    setError("");
                                    setImageFile(file);
                                }}
                                className="hidden"
                            />

                            <div className="border border-dashed border-gray-300 p-5">
                                {imagePreview ? (
                                    <div>
                                        <img
                                            src={imagePreview}
                                            alt="Selected animal preview"
                                            className="mb-4 max-h-72 w-full object-contain"
                                        />

                                        <p className="mb-3 break-all text-sm text-gray-500">
                                            {imageFile?.name}
                                        </p>

                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                className="bg-[#FFC928] px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#25283B] transition hover:bg-[#25283B] hover:text-white disabled:opacity-60"
                                            >
                                                Change Image
                                            </button>

                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() => {
                                                    setImageFile(null);
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = "";
                                                    }
                                                }}
                                                className="border border-gray-300 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#25283B] hover:bg-gray-100 disabled:opacity-60"
                                            >
                                                Remove Image
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-5 text-center">
                                        <div className="mb-3 text-3xl text-[#25283B]">
                                            <span aria-hidden="true">＋</span>
                                        </div>

                                        <p className="mb-2 text-sm text-gray-500">
                                            Choose an animal photo from your computer.
                                        </p>

                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className="bg-[#FFC928] px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:bg-[#25283B] hover:text-white disabled:opacity-60"
                                        >
                                            Choose Image
                                        </button>

                                        <p className="mt-3 text-xs text-gray-400">
                                            JPG, PNG, WEBP or GIF · Maximum 5 MB
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                htmlFor="animal-description"
                                className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#25283B]"
                            >
                                Description
                            </label>

                            <textarea
                                id="animal-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Write a short description about the animal..."
                                rows={5}
                                required
                                disabled={saving}
                                className="w-full resize-none border border-gray-200 px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#FFC928] disabled:opacity-60"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label
                                htmlFor="animal-status"
                                className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#25283B]"
                            >
                                Status
                            </label>

                            <select
                                id="animal-status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                disabled={saving}
                                className="w-full border border-gray-200 bg-white px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#FFC928] disabled:opacity-60"
                            >
                                <option value="available">Available</option>
                                <option value="adopted">Adopted</option>
                                <option value="unavailable">Unavailable</option>
                            </select>
                        </div>

                        {/* Error */}
                        {error && (
                            <div
                                role="alert"
                                className="break-words bg-red-50 px-4 py-3 text-sm text-red-600"
                            >
                                {error}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-[#FFC928] px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:bg-[#25283B] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Add Animal"}
                            </button>

                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => router.push("/admin/animals")}
                                className="border border-[#25283B] px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:bg-[#25283B] hover:text-white disabled:opacity-60"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        </main>
    );
}
