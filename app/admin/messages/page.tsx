"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ContactMessage = {
    id: number;
    created_at: string;
    name: string;
    email: string;
    message: string;
};
export default function AdminMessagesPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);
    const [successMessage, setSuccessMessage] = useState("");
    useEffect(() => {
        const loggedIn = localStorage.getItem("adminLoggedIn");

        if (loggedIn !== "true") {
            router.push("/admin/login");
            return;
        }

        fetchMessages();
    }, [router]);
    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from("contact_enquiries")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading messages:", error);
            setLoading(false);
            return;
        }

        setMessages(data || []);
        setLoading(false);
    };
    const deleteMessage = async (messageId: number) => {
        const { error } = await supabase
            .from("contact_enquiries")
            .delete()
            .eq("id", messageId);

        if (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message.");
            return;
        }

        setMessages((current) =>
            current.filter((message) => message.id !== messageId)
        );

        setDeleteTarget(null);
        setSuccessMessage("Message deleted successfully.");
    };
    const filteredMessages = messages.filter((message) => {
        const query = searchQuery.toLowerCase().trim();

        return (
            message.name.toLowerCase().includes(query) ||
            message.email.toLowerCase().includes(query)
        );
    });
    return (
        <main className="min-h-screen bg-[#F8F9FA]">

            {/* Header */}
            <header className="bg-[#25283B] px-6 py-5 text-white shadow-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between">

                    <div>
                        <h1 className="text-xl font-bold">
                            Messages
                        </h1>

                        <p className="mt-1 text-xs text-white/50">
                            Contact Enquiries
                        </p>
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

            {/* Content */}
            <section className="mx-auto max-w-7xl px-6 py-10">

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFC928]">
                    Communication
                </p>

                <div className="mt-2 flex items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold text-[#25283B]">
                        Messages
                    </h2>

                    <button
                        type="button"
                        onClick={fetchMessages}
                        className="bg-[#FFC928] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:bg-[#25283B] hover:text-white"
                    >
                        Refresh
                    </button>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                    View messages submitted through the website contact form.
                </p>


                <div className="mt-8">

                    {loading && (
                        <div className="bg-white p-10 text-center shadow-sm">
                            <p className="text-sm text-gray-500">
                                Loading messages...
                            </p>
                        </div>
                    )}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full border border-[#25283B]/15 bg-white px-5 py-3 pr-20 text-sm text-[#25283B] outline-none transition placeholder:text-gray-400 focus:border-[#25283B]"
                        />

                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-[0.1em] text-[#25283B]/60 hover:text-[#25283B]"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    {!loading && messages.length === 0 && (
                        <div className="bg-white p-10 text-center shadow-sm">
                            <h3 className="text-lg font-bold text-[#25283B]">
                                No messages yet
                            </h3>

                            <p className="mt-2 text-sm text-gray-500">
                                Messages submitted through the contact form will appear here.
                            </p>
                        </div>
                    )}

                    {!loading && filteredMessages.length > 0 && (
                        <div className="mt-6 space-y-5">

                            {filteredMessages.map((message) => (
                                <div
                                    key={message.id}
                                    className="bg-white p-6 shadow-sm sm:p-8"
                                >

                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#FFC928]">
                                                Contact Message
                                            </p>

                                            <h3 className="mt-2 text-xl font-bold text-[#25283B]">
                                                {message.name}
                                            </h3>
                                        </div>

                                        <p className="text-xs text-gray-400">
                                            {new Date(message.created_at).toLocaleString()}
                                        </p>

                                    </div>

                                    <div className="mt-5 border-t border-gray-100 pt-5">

                                        <p className="text-sm font-semibold text-[#25283B]">
                                            {message.email}
                                        </p>

                                        <p className="mt-4 text-sm leading-7 text-gray-600">
                                            {message.message}
                                        </p>

                                    </div>

                                    <div className="mt-5 flex items-center justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setDeleteTarget(message)}
                                            className="border border-red-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-600 hover:text-white"
                                        >
                                            Delete
                                        </button>
                                    </div>

                                </div>
                            ))}

                        </div>

                    )}
                    {!loading && messages.length > 0 && filteredMessages.length === 0 && (
                        <div className="mt-6 border border-[#25283B]/10 bg-white px-6 py-12 text-center">
                            <h3 className="text-lg font-bold text-[#25283B]">
                                No messages found
                            </h3>

                            <p className="mt-2 text-sm text-gray-500">
                                No contact messages match your search.
                            </p>
                        </div>
                    )}

                </div>

            </section>
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25283B]/60 px-4">
                    <div className="w-full max-w-md bg-white p-8 shadow-xl">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
                            Delete Message
                        </p>

                        <h3 className="mt-3 text-2xl font-bold text-[#25283B]">
                            Delete this message?
                        </h3>

                        <p className="mt-3 text-sm leading-6 text-gray-500">
                            This message will be permanently removed from the system.
                            Are you sure you want to continue?
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
                                onClick={() => deleteMessage(deleteTarget.id)}
                                className="flex-1 bg-red-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {successMessage && (
                <div className="fixed right-6 top-24 z-[60] w-full max-w-sm border border-green-200 bg-white px-6 py-5 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-green-600">
                                Success
                            </p>

                            <p className="mt-2 text-sm font-semibold text-[#25283B]">
                                {successMessage}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSuccessMessage("")}
                            className="text-xs font-bold text-gray-400 hover:text-[#25283B]"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}