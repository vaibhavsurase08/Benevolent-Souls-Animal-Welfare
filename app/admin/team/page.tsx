"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  responsibility: string | null;
  image_url: string | null;
  created_at: string;
};

const initialMember: TeamMember = {
  id: "",
  name: "",
  role: "",
  responsibility: null,
  image_url: null,
  created_at: "",
};

export default function AdminTeamPage() {
  const router = useRouter();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(
        "Error loading team members:",
        `code=${error.code}, message=${error.message}, details=${error.details ?? "none"}, hint=${error.hint ?? "none"}`,
      );
      setErrorMessage("Could not load team members. Check your Supabase permissions.");
      setLoading(false);
      return;
    }

    setMembers((data || []) as TeamMember[]);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !data.session) {
        router.replace("/admin/login");
        return;
      }

      await fetchMembers();
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (!session) {
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

  const clearSelectedImage = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    setImageRemoved(false);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeProfilePhoto = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const cancelEditing = () => {
    setEditingMember(null);
    clearSelectedImage();
    setErrorMessage("");
  };

  const saveEditedMember = async () => {
    if (!editingMember) return;

    if (!editingMember.name.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }
    if (!editingMember.role.trim()) {
      setErrorMessage("Role is required.");
      return;
    }

    setSavingEdit(true);
    setErrorMessage("");

    let updatedImageUrl = imageRemoved ? "" : editingMember.image_url ?? "";

    if (selectedImageFile) {
      if (selectedImageFile.size > 5 * 1024 * 1024) {
        setErrorMessage("Image size must be under 5 MB.");
        setSavingEdit(false);
        return;
      }

      const safeName = selectedImageFile.name.replace(/[^a-zA-Z0-9.-]/g, "-");
      const filePath = `${Date.now()}-${editingMember.id || "new"}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("team-images")
        .upload(filePath, selectedImageFile, {
          contentType: selectedImageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Image upload error:", uploadError);
        setErrorMessage(`Image upload failed: ${uploadError.message}`);
        setSavingEdit(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("team-images")
        .getPublicUrl(filePath);

      updatedImageUrl = publicUrlData.publicUrl;
    }

    const memberPayload = {
      name: editingMember.name.trim(),
      role: editingMember.role.trim(),
      responsibility: editingMember.responsibility?.trim() || null,
      image_url: updatedImageUrl || null,
    };

    if (editingMember.id) {
      const { error } = await supabase
        .from("team_members")
        .update(memberPayload)
        .eq("id", editingMember.id);

      if (error) {
        console.error("Error updating team member:", error);
        setErrorMessage(`Failed to update team member: ${error.message}`);
        setSavingEdit(false);
        return;
      }

      setMembers((current) =>
        current.map((m) =>
          m.id === editingMember.id ? ({ ...m, ...memberPayload } as TeamMember) : m
        )
      );

      setSuccessMessage("Team member updated successfully.");
    } else {
      const { data: inserted, error } = await supabase
        .from("team_members")
        .insert(memberPayload)
        .select()
        .single();

      if (error) {
        console.error("Error inserting team member:", error);
        setErrorMessage(`Failed to add team member: ${error.message}`);
        setSavingEdit(false);
        return;
      }

      setMembers((current) => [...current, (inserted as TeamMember)]);
      setSuccessMessage("Team member added successfully.");
    }

    setEditingMember(null);
    clearSelectedImage();
    setSavingEdit(false);

    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  const deleteMember = async (memberId: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", memberId);

    if (error) {
      console.error("Error deleting team member:", error);
      setErrorMessage("Failed to delete team member.");
      setDeleteTarget(null);
      return;
    }

    setMembers((current) => current.filter((m) => m.id !== memberId));
    setSuccessMessage("Team member deleted successfully.");
    setDeleteTarget(null);

    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  const updateEditingMember = (changes: Partial<TeamMember>) => {
    setEditingMember((current) => (current ? { ...current, ...changes } : current));
  };

  const startAddMember = () => {
    setEditingMember({ ...initialMember });
    setErrorMessage("");
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      <header className="bg-[#25283B] px-6 py-5 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Team Members</h1>
            <p className="mt-1 text-xs text-white/50">Manage the NGO team</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:bg-[#FFC928]"
          >
            ← Dashboard
          </button>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-10">
        {editingMember ? (
          <div className="bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFC928]">{editingMember.id ? "Edit" : "Add"}</p>
                <h2 className="mt-2 text-2xl font-bold text-[#25283B]">{editingMember.id ? "Edit Team Member" : "Add Team Member"}</h2>
                <p className="mt-2 text-sm text-gray-500">{editingMember.id ? "Update the team member information below." : "Fill in the details to add a new team member."}</p>
              </div>
              <button type="button" onClick={cancelEditing} className="border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#25283B] transition hover:bg-gray-100">Cancel</button>
            </div>
            {errorMessage && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
            )}
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">Full Name</label>
                <input type="text" value={editingMember.name} onChange={(e) => updateEditingMember({ name: e.target.value })} className="mt-2 w-full border border-gray-200 bg-white px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#25283B]" placeholder="e.g. Chaitanya Kulkarni" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">Role</label>
                <input type="text" value={editingMember.role} onChange={(e) => updateEditingMember({ role: e.target.value })} className="mt-2 w-full border border-gray-200 bg-white px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#25283B]" placeholder="e.g. Director" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">Responsibility / Department</label>
                <input type="text" value={editingMember.responsibility ?? ""} onChange={(e) => updateEditingMember({ responsibility: e.target.value })} className="mt-2 w-full border border-gray-200 bg-white px-4 py-3 text-sm text-[#25283B] outline-none focus:border-[#25283B]" placeholder="e.g. Finance & Accounting" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">Profile Photo</label>
                <div className="mt-2">
                  {!imageRemoved && (imagePreview || (editingMember.image_url && !selectedImageFile)) ? (
                    <div className="mb-4 flex h-80 w-full max-w-xl items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-[#F8F9FA] p-3 sm:h-96">
                      <img
                        src={(imagePreview ?? editingMember.image_url) ?? undefined}
                        alt={`${editingMember.name} preview`}
                        className="h-full w-full object-contain object-center"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => imageInputRef.current?.click()} className="bg-[#25283B] px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#FFC928] hover:text-[#25283B]">{selectedImageFile ? "Change Image" : "Choose Image"}</button>
                    {(editingMember.image_url || selectedImageFile) && !imageRemoved && (
                      <button type="button" onClick={removeProfilePhoto} className="border border-red-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-600 hover:text-white">Remove Photo</button>
                    )}
                    <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={(e) => { const file = e.target.files?.[0] ?? null; setSelectedImageFile(file); if (file) { setImageRemoved(false); setImagePreview(URL.createObjectURL(file)); } }} />
                    {selectedImageFile && (
                      <button type="button" onClick={clearSelectedImage} className="border border-red-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-600 hover:text-white">Cancel New Image</button>
                    )}
                    <span className="text-sm text-gray-500">{imageRemoved ? "Photo will be removed when you save changes." : selectedImageFile ? selectedImageFile.name : editingMember.id ? "Choose a new image to replace the current photo." : "Choose an image from your gallery. Maximum size: 5 MB."}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-3 border-t border-gray-200 pt-8">
              <button type="button" onClick={saveEditedMember} disabled={savingEdit} className="bg-[#25283B] px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#FFC928] hover:text-[#25283B] disabled:cursor-not-allowed disabled:opacity-50">{savingEdit ? "Saving..." : editingMember.id ? "Save Changes" : "Add Member"}</button>
              <button type="button" onClick={cancelEditing} disabled={savingEdit} className="border border-[#25283B] px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#25283B] transition hover:bg-gray-100 disabled:opacity-50">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFC928]">Team Management</p>
                <h2 className="mt-2 text-3xl font-bold text-[#25283B]">Team Members</h2>
                <p className="mt-2 text-sm text-gray-500">View and manage the foundation&apos;s team members.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={startAddMember} className="bg-[#FFC928] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:bg-[#25283B] hover:text-white">+ Add Team Member</button>
                <div className="bg-[#25283B] px-5 py-3 text-sm font-bold text-white">{members.length} Team Member{members.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
            {loading && (
              <div className="bg-white p-10 text-center shadow-sm"><p className="text-sm text-gray-500">Loading team members...</p></div>
            )}
            {successMessage && (
              <div className="mb-6 flex items-center justify-between border border-green-200 bg-green-50 px-5 py-4">
                <p className="text-sm font-semibold text-green-700">{successMessage}</p>
                <button type="button" onClick={() => setSuccessMessage("")} className="text-xs font-bold uppercase tracking-[0.1em] text-green-700 underline underline-offset-4">Close</button>
              </div>
            )}
            {errorMessage && !editingMember && (
              <div className="mb-6 flex items-center justify-between border border-red-200 bg-red-50 px-5 py-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">{errorMessage}</p>
                  <button type="button" onClick={fetchMembers} className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-red-700 underline underline-offset-4 hover:text-red-900">Retry</button>
                </div>
                <button type="button" onClick={() => setErrorMessage("")} className="text-xs font-bold uppercase tracking-[0.1em] text-red-700 underline underline-offset-4">Close</button>
              </div>
            )}
            {!loading && members.length === 0 && !errorMessage && (
              <div className="bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFC928] text-xl">👥</div>
                <h3 className="text-lg font-bold text-[#25283B]">No team members found</h3>
                <p className="mt-2 text-sm text-gray-500">There are currently no team members in the database.</p>
              </div>
            )}
            {!loading && members.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => (
                  <div key={member.id} className="flex h-full flex-col overflow-hidden bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                    <div className="h-52 bg-[#36394F] relative">
                      {member.image_url ? (
                        <img src={member.image_url} alt={member.name} className="h-full w-full object-cover object-center" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">No photo</div>
                      )}
                      <button type="button" onClick={() => { clearSelectedImage(); setEditingMember(member); }} className="absolute top-2 right-2 bg-[#25283B] text-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] transition hover:bg-[#FFC928] hover:text-[#25283B]">Edit</button>
                    </div>
                    <div className="p-5">
                      <h4 className="mt-2 text-lg font-bold text-[#25283B]">{member.name}</h4>
                      <p className="mt-1 text-sm text-[#687080]">{member.role}</p>
                      {member.responsibility && (
                        <p className="mt-1 text-xs text-[#B28A00] font-medium">{member.responsibility}</p>
                      )}
                    </div>
                    <div className="mt-auto p-4 border-t border-[#36394F]/10 bg-[#F8F9FA]">
                      <button type="button" onClick={() => setDeleteTarget(member)} className="w-full border border-red-600 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-600 hover:text-white">Remove Member</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25283B]/60 px-4">
            <div className="w-full max-w-md bg-white p-8 shadow-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Delete Team Member</p>
              <h3 className="mt-3 text-2xl font-bold text-[#25283B]">Delete {deleteTarget.name}?</h3>
              <p className="mt-3 text-sm leading-6 text-gray-500">This action will permanently remove this team member. Are you sure you want to continue?</p>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 border border-[#25283B] bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#25283B] transition hover:bg-gray-100">Cancel</button>
                <button type="button" onClick={() => deleteMember(deleteTarget.id)} className="flex-1 bg-red-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

