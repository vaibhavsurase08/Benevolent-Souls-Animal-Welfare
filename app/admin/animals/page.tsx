
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Animal = {
    id: number;
    name: string;
    species: string;
    age: number;
    gender: string;
    image_url: string | null;
    description: string | null;
    status: string;
};

export default function AdminAnimalsPage() {
    const router = useRouter();

    const [animals, setAnimals] = useState<Animal[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Animal | null>(null);
    const [successMessage, setSuccessMessage] = useState("");

    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [removeImage, setRemoveImage] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let active = true;

        const checkSession = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (!active) return;

            if (error || !data.session) {
                router.replace("/admin/login");
                return;
            }

            await fetchAnimals();
        };

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (active && !session) {
                router.replace("/admin/login");
            }
        });

        checkSession();

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, [router]);

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const fetchAnimals = async () => {
        const { data, error } = await supabase
            .from("animals")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading animals:", error);
            setLoading(false);
            return;
        }

        setAnimals(data || []);
        setLoading(false);
    };

    const clearSelectedImage = () => {
        setSelectedImageFile(null);
        setImagePreview(null);
        setRemoveImage(false);

        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const removeCurrentImage = () => {
        setSelectedImageFile(null);
        setImagePreview(null);
        setRemoveImage(true);

        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const cancelEditing = () => {
        setEditingAnimal(null);
        clearSelectedImage();
    };

    const saveEditedAnimal = async () => {
        if (!editingAnimal) return;

        setSavingEdit(true);

        let updatedImageUrl = removeImage ? "" : (editingAnimal.image_url ?? "");

        // Upload a new image only if one has been selected.
        if (selectedImageFile) {
            const safeName = selectedImageFile.name.replace(
                /[^a-zA-Z0-9.-]/g,
                "-"
            );

            const filePath = `${Date.now()}-${editingAnimal.id}-${safeName}`;

            const { error: uploadError } = await supabase.storage
                .from("animal-images")
                .upload(filePath, selectedImageFile, {
                    contentType: selectedImageFile.type,
                    upsert: false,
                });

            if (uploadError) {
                console.error("Image upload error:", uploadError);
                alert(`Image upload failed: ${uploadError.message}`);
                setSavingEdit(false);
                return;
            }

            const { data: publicUrlData } = supabase.storage
                .from("animal-images")
                .getPublicUrl(filePath);

            updatedImageUrl = publicUrlData.publicUrl;
        }

        const updatedAnimal = {
            name: editingAnimal.name,
            species: editingAnimal.species,
            age: editingAnimal.age,
            gender: editingAnimal.gender,
            image_url: updatedImageUrl || null,
            description: editingAnimal.description ?? "",
            status: editingAnimal.status,
        };

        const { error } = await supabase
            .from("animals")
            .update(updatedAnimal)
            .eq("id", editingAnimal.id);

        if (error) {
            console.error("Error updating animal:", error);
            alert(`Failed to update animal: ${error.message}`);
            setSavingEdit(false);
            return;
        }

        const savedAnimal: Animal = {
            ...editingAnimal,
            ...updatedAnimal,
        };

        setAnimals((current) =>
            current.map((animal) =>
                animal.id === savedAnimal.id ? savedAnimal : animal
            )
        );

        setEditingAnimal(null);
        clearSelectedImage();
        setSavingEdit(false);
        setSuccessMessage("Animal updated successfully.");

        setTimeout(() => {
            setSuccessMessage("");
        }, 5000);
    };

    const deleteAnimal = async (animalId: number) => {
        const { error } = await supabase
            .from("animals")
            .delete()
            .eq("id", animalId);

        if (error) {
            console.error("Error deleting animal:", error);
            alert("Failed to delete animal.");
            return;
        }

        setAnimals((current) =>
            current.filter((animal) => animal.id !== animalId)
        );

        setSuccessMessage("Animal deleted successfully.");
        setDeleteTarget(null);

        setTimeout(() => {
            setSuccessMessage("");
        }, 5000);
    };

    const updateEditingAnimal = (changes: Partial<Animal>) => {
        setEditingAnimal((current) =>
            current ? { ...current, ...changes } : current
        );
    };

    return (
        <main className="min-h-screen bg-[#F8F9FA]">
            {/* Header */}
            <header className="bg-[#25283B] px-6 py-5 text-white shadow-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Animals</h1>
                        <p className="mt-1 text-xs text-white/50">
                            Animal Management
                        </p>
                    </div>

                    <button
                        onClick={() => router.push("/admin")}
                        className="bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:bg-[#FFC928]"
                    >
                        ← Dashboard
                    </button>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-6 py-10">
                {/* EDIT MODE */}
                {editingAnimal ? (
                    <div className="bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFC928]">
                                    Edit
                                </p>

                                <h2 className="mt-2 text-2xl font-bold text-[#25283B]">
                                    Edit Animal
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    Update the animal information below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cancelEditing}
                                className="border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#25283B] transition hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="mt-8 grid gap-5 sm:grid-cols-2">
                            {/* Name */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
                                    Name
                                </label>

                                <input
                                    type="text"
                                    value={editingAnimal.name}
                                    onChange={(e) =>
                                        updateEditingAnimal({ name: e.target.value })
                                    }
                                    className="mt-2 w-full border border-gray-200 bg-white px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#25283B]"
                                />
                            </div>

                            {/* Species */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
                                    Species
                                </label>

                                <input
                                    type="text"
                                    value={editingAnimal.species}
                                    onChange={(e) =>
                                        updateEditingAnimal({ species: e.target.value })
                                    }
                                    className="mt-2 w-full border border-gray-200 bg-white px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#25283B]"
                                />
                            </div>

                            {/* Age */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
                                    Age
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    value={editingAnimal.age}
                                    onChange={(e) =>
                                        updateEditingAnimal({
                                            age: Number(e.target.value),
                                        })
                                    }
                                    className="mt-2 w-full border border-gray-200 bg-white px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#25283B]"
                                />
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
                                    Gender
                                </label>

                                <select
                                    value={editingAnimal.gender}
                                    onChange={(e) =>
                                        updateEditingAnimal({
                                            gender: e.target.value,
                                        })
                                    }
                                    className="mt-2 w-full border border-gray-200 bg-white px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#25283B]"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            {/* Image Upload */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
                                    Animal Image
                                </label>

                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        if (!file.type.startsWith("image/")) {
                                            alert("Please select an image file.");
                                            e.target.value = "";
                                            return;
                                        }

                                        if (file.size > 5 * 1024 * 1024) {
                                            alert("Image size must be 5 MB or less.");
                                            e.target.value = "";
                                            return;
                                        }

                                        setImagePreview(URL.createObjectURL(file));
                                        setSelectedImageFile(file);
                                        setRemoveImage(false);
                                    }}
                                />

                                <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4">
                                    <div className="flex min-h-[320px] w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-[#F8F9FA] p-3">
                                        {(imagePreview || (editingAnimal.image_url && !removeImage)) ? (
                                            <img
                                                src={imagePreview || editingAnimal.image_url || ""}
                                                alt={`${editingAnimal.name} preview`}
                                                className="max-h-[420px] max-w-full object-contain"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-400">No image selected</p>
                                        )}
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => imageInputRef.current?.click()}
                                            className="bg-[#25283B] px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#FFC928] hover:text-[#25283B]"
                                        >
                                            {selectedImageFile ? "Change Image" : "Choose Image"}
                                        </button>

                                        {(editingAnimal.image_url || imagePreview) && !removeImage && (
                                            <button
                                                type="button"
                                                onClick={removeCurrentImage}
                                                className="border border-red-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-600 hover:text-white"
                                            >
                                                Remove Image
                                            </button>
                                        )}

                                        {selectedImageFile && (
                                            <button
                                                type="button"
                                                onClick={clearSelectedImage}
                                                className="border border-gray-400 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-gray-600 transition hover:bg-gray-100"
                                            >
                                                Cancel New Image
                                            </button>
                                        )}

                                        <span className="text-sm text-gray-500">
                                            {selectedImageFile
                                                ? selectedImageFile.name
                                                : "Choose an image from your gallery. Maximum size: 5 MB."}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
                                    Description
                                </label>

                                <textarea
                                    value={editingAnimal.description ?? ""}
                                    onChange={(e) =>
                                        updateEditingAnimal({
                                            description: e.target.value,
                                        })
                                    }
                                    rows={4}
                                    className="mt-2 w-full border border-gray-200 bg-white px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#25283B]"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
                                    Status
                                </label>

                                <select
                                    value={editingAnimal.status}
                                    onChange={(e) =>
                                        updateEditingAnimal({
                                            status: e.target.value,
                                        })
                                    }
                                    className="mt-2 w-full border border-gray-200 bg-white px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#25283B]"
                                >
                                    <option value="available">Available</option>
                                    <option value="adopted">Adopted</option>
                                    <option value="unavailable">Unavailable</option>
                                </select>
                            </div>
                        </div>

                        {/* Save Actions */}
                        <div className="mt-8 border-t border-gray-200 pt-6">
                            <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={saveEditedAnimal}
                                disabled={savingEdit}
                                className="bg-[#25283B] px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#FFC928] hover:text-[#25283B] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {savingEdit ? "Saving..." : "Save Changes"}
                            </button>

                            <button
                                type="button"
                                onClick={cancelEditing}
                                disabled={savingEdit}
                                className="border border-[#25283B] px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#25283B] transition hover:bg-gray-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* NORMAL VIEW */}
                        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFC928]">
                                    Management
                                </p>

                                <h2 className="mt-2 text-3xl font-bold text-[#25283B]">
                                    Animals
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    View animals currently stored in the system.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.push("/admin/animals/add")}
                                    className="bg-[#FFC928] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:bg-[#25283B] hover:text-white"
                                >
                                    + Add Animal
                                </button>

                                <div className="bg-[#25283B] px-5 py-3 text-sm font-bold text-white">
                                    {animals.length} Animals
                                </div>
                            </div>
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="bg-white p-10 text-center shadow-sm">
                                <p className="text-sm text-gray-500">
                                    Loading animals...
                                </p>
                            </div>
                        )}

                        {/* Success Message */}
                        {successMessage && (
                            <div className="mb-6 flex items-center justify-between border border-green-200 bg-green-50 px-5 py-4">
                                <p className="text-sm font-semibold text-green-700">
                                    {successMessage}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => setSuccessMessage("")}
                                    className="text-xs font-bold uppercase tracking-[0.1em] text-green-700 underline underline-offset-4"
                                >
                                    Close
                                </button>
                            </div>
                        )}

                        {/* No Animals */}
                        {!loading && animals.length === 0 && (
                            <div className="bg-white p-10 text-center shadow-sm">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFC928] text-xl">
                                    🐾
                                </div>

                                <h3 className="text-lg font-bold text-[#25283B]">
                                    No animals found
                                </h3>

                                <p className="mt-2 text-sm text-gray-500">
                                    There are currently no animals in the database.
                                </p>
                            </div>
                        )}

                        {/* Animal Cards */}
                        {!loading && animals.length > 0 && (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {animals.map((animal) => (
                                    <div
                                        key={animal.id}
                                        className="flex h-full flex-col overflow-hidden bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                    >
                                        {/* Image */}
                                        <div className="h-52 bg-[#36394F]">
                                            {animal.image_url ? (
                                                <img
                                                    src={animal.image_url}
                                                    alt={animal.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center bg-[#F1EFE7]">
                                                    <div className="text-center">
                                                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#25283B] text-white">
                                                            <span className="text-2xl font-bold">
                                                                {animal.species?.charAt(0).toUpperCase() ||
                                                                    "A"}
                                                            </span>
                                                        </div>

                                                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B]/50">
                                                            No image available
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex flex-1 flex-col p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-[#25283B]">
                                                        {animal.name}
                                                    </h3>

                                                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
                                                        {animal.species}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                                                        animal.status === "available"
                                                            ? "bg-green-100 text-green-700"
                                                            : animal.status === "adopted"
                                                              ? "bg-blue-100 text-blue-700"
                                                              : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {animal.status}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                                        Age
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold text-[#25283B]">
                                                        {animal.age} years
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                                        Gender
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold text-[#25283B]">
                                                        {animal.gender}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p className="mt-5 text-sm leading-6 text-gray-500">
                                                {animal.description ??
                                                    "No description available."}
                                            </p>

                                            {/* Actions */}
                                            <div className="mt-6 border-t border-gray-100 pt-5">
                                                <div className="flex flex-wrap gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            clearSelectedImage();
                                                            setEditingAnimal(animal);
                                                        }}
                                                        className="flex-1 border border-[#25283B] bg-[#25283B] px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#FFC928] hover:text-[#25283B]"
                                                    >
                                                        Edit Animal
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(animal)}
                                                        className="flex-1 border border-red-600 bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-600 hover:text-white"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* DELETE MODAL */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25283B]/60 px-4">
                    <div className="w-full max-w-md bg-white p-8 shadow-xl">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
                            Delete Animal
                        </p>

                        <h3 className="mt-3 text-2xl font-bold text-[#25283B]">
                            Delete {deleteTarget.name}?
                        </h3>

                        <p className="mt-3 text-sm leading-6 text-gray-500">
                            This action will permanently remove this animal from the
                            system. Are you sure you want to continue?
                        </p>

                        <div className="mt-8 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 border border-[#25283B] bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#25283B] transition hover:bg-gray-100"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => deleteAnimal(deleteTarget.id)}
                                className="flex-1 bg-red-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
