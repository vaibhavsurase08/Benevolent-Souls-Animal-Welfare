
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
    const router = useRouter();
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        let active = true;

        const checkSession = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (!active) return;

            if (error || !data.session) {
                router.replace("/admin/login");
                return;
            }

            setCheckingAuth(false);
        };

        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!active) return;

            if (!session) {
                router.replace("/admin/login");
            } else {
                setCheckingAuth(false);
            }
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, [router]);

    const handleLogout = async () => {
        setLoggingOut(true);

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Logout failed:", error.message);
            setLoggingOut(false);
            return;
        }

        router.replace("/admin/login");
        router.refresh();
    };

    if (checkingAuth) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
                <p className="text-sm font-semibold text-[#25283B]">
                    Verifying administrator access...
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#F8F9FA]">
            {/* Header */}
            <header className="bg-[#25283B] px-6 py-5 text-white shadow-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">
                            Admin Dashboard
                        </h1>
                        <p className="mt-1 text-xs text-white/50">
                            Animal Welfare Management
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="bg-[#FFC928] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:bg-white disabled:opacity-60"
                    >
                        {loggingOut ? "Logging out..." : "Logout"}
                    </button>
                </div>
            </header>

            {/* Main */}
            <section className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-10">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFC928]">
                        Administration
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-[#25283B]">
                        Welcome to the Dashboard
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Manage your animal welfare website from one place.
                    </p>
                </div>

                {/* Dashboard Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Animals */}
                    <button
                        type="button"
                        onClick={() => router.push("/admin/animals")}
                        className="group w-full bg-white p-7 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                    >
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC928] text-[#25283B]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9.75a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0Zm12 0a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0ZM6 15.75c0-1.657 1.343-3 3-3h6c1.657 0 3 1.343 3 3v.75H6v-.75Z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[#25283B]">Animals</h3>
                        <p className="mt-2 text-sm text-gray-500">Manage animals available for adoption.</p>
                        <div className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition group-hover:text-[#B88900]">
                            Manage Animals →
                        </div>
                    </button>

                    {/* Adoption */}
                    <button
                        type="button"
                        onClick={() => router.push("/admin/adoption")}
                        className="group w-full bg-white p-7 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                    >
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC928] text-[#25283B]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[#25283B]">Adoption Enquiries</h3>
                        <p className="mt-2 text-sm text-gray-500">View and manage adoption enquiries.</p>
                        <div className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition group-hover:text-[#B88900]">
                            View Enquiries →
                        </div>
                    </button>

                    {/* Messages */}
                    <button
                        type="button"
                        onClick={() => router.push("/admin/messages")}
                        className="group w-full bg-white p-7 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                    >
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC928] text-[#25283B]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15A2.25 2.25 0 0 0 2.25 6.75m19.5 0-8.69 5.213a2.25 2.25 0 0 1-2.32 0L2.25 6.75" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[#25283B]">Messages</h3>
                        <p className="mt-2 text-sm text-gray-500">View contact messages.</p>
                        <div className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition group-hover:text-[#B88900]">
                            View Messages →
                        </div>
                    </button>

                    {/* Media */}
                    <button
                        type="button"
                        onClick={() => router.push("/admin/media")}
                        className="group w-full bg-white p-7 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                    >
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC928] text-[#25283B]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v9.75A2.25 2.25 0 0 1 18.75 18.75H5.25A2.25 2.25 0 0 1 3 16.5Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="m3 15 4.5-4.5 3.75 3.75 2.25-2.25L21 19.5" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[#25283B]">Media</h3>
                        <p className="mt-2 text-sm text-gray-500">Manage website photos and videos.</p>
                        <div className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition group-hover:text-[#B88900]">
                            Manage Media →
                        </div>
                    </button>

                    {/* Donations */}
                    <button
                        type="button"
                        onClick={() => router.push("/admin/donations")}
                        className="group w-full bg-white p-7 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                    >
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC928] text-[#25283B]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m4-9.5c0-1.105-1.79-2-4-2s-4 .895-4 2 1.79 2 4 2 4 .895 4 2-1.79 2-4 2-4-.895-4-2" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 4.5h11M6.5 19.5h11" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[#25283B]">Donations</h3>
                        <p className="mt-2 text-sm text-gray-500">Manage donation information.</p>
                        <div className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition group-hover:text-[#B88900]">
                            Manage Donations →
                        </div>
                    </button>

                    {/* Public Website */}
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="group w-full bg-white p-7 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                    >
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC928] text-[#25283B]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
                                <circle cx="12" cy="12" r="9" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3c2.25 2.47 3.5 5.47 3.5 9s-1.25 6.53-3.5 9c-2.25-2.47-3.5-6.53-3.5-9S9.75 5.47 12 3Z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[#25283B]">Public Website</h3>
                        <p className="mt-2 text-sm text-gray-500">Open the public NGO website.</p>
                        <div className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition group-hover:text-[#B88900]">
                            Open Website →
                        </div>
                    </button>
                </div>
            </section>
        </main>
    );
}
