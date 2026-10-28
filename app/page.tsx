"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage, type SiteLanguage } from "./components/LanguageProvider";

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("top") === "1") {
      window.history.scrollRestoration = "manual";

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });

      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });
      });
    }
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("media") === "1") {
      const scrollToMedia = () => {
        document.getElementById("media")?.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToMedia);
      });
    }
  }, []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showEmergencyPopup, setShowEmergencyPopup] = useState(false);
  const [adoptionName, setAdoptionName] = useState("");
  const [adoptionEmail, setAdoptionEmail] = useState("");
  const [adoptionPhone, setAdoptionPhone] = useState("");
  const [adoptionMessage, setAdoptionMessage] = useState("");
  const [adoptionSubmitted, setAdoptionSubmitted] = useState(false);
  const [adoptionSubmitting, setAdoptionSubmitting] = useState(false);

  type Animal = {
    id: number;
    name: string;
    species: string;
    age: number;
    gender: string;
    image_url: string;
    description: string;
    status: string;
  };
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [visibleAnimals, setVisibleAnimals] = useState(4);
  const [selectedAnimalIndex, setSelectedAnimalIndex] = useState(0);
  const [activeNav, setActiveNav] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  const handleAdoptionSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!animals.length) return;

    setAdoptionSubmitting(true);

    const { error } = await supabase
      .from("adoption_enquiries")
      .insert({
        animal_id: animals[selectedAnimalIndex].id,
        name: adoptionName,
        email: adoptionEmail,
        phone: adoptionPhone,
        message: adoptionMessage,
        status: "pending",
      });

    setAdoptionSubmitting(false);

    if (error) {
      console.error("Error submitting adoption enquiry:", error);
      return;
    }

    setAdoptionSubmitted(true);
    setAdoptionName("");
    setAdoptionEmail("");
    setAdoptionPhone("");
    setAdoptionMessage("");
  };
  useEffect(() => {
    const fetchAnimals = async () => {
      const { data, error } = await supabase
        .from("animals")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading animals:", error);
        return;
      }

      setAnimals(data || []);
    };

    fetchAnimals();
  }, []);

  // Automatically update the active navigation item while scrolling.
  useEffect(() => {
    const sectionIds = ["home", "about", "work", "adoption", "media", "contact"];
    let frame = 0;

    const updateActiveSection = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const header = document.querySelector("header");
        const headerHeight = header?.getBoundingClientRect().height ?? 0;
        const activationLine = headerHeight + window.innerHeight * 0.28;
        let currentSection = "home";

        for (const id of sectionIds) {
          const section = document.getElementById(id);
          if (section && section.getBoundingClientRect().top <= activationLine) {
            currentSection = id;
          }
        }

        const nearPageBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 8;
        if (nearPageBottom) currentSection = "contact";

        setActiveNav((previous) =>
          previous === currentSection ? previous : currentSection
        );
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FAF8F0] text-[#20222B]">

      {/* =====================================================
          HERO
      ===================================================== */}
      <section
        id="home"
        className="relative min-h-screen overflow-hidden bg-[#36394F]"
      >
        {/* HERO BACKGROUND VIDEO */}
        <video
          src="/videos/hero-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />


        {/* VIDEO OVERLAY */}
        <div className="absolute inset-0 bg-[#25283B]/55" />

        <div className="absolute inset-0 bg-gradient-to-r from-[#25283B]/85 via-[#36394F]/45 to-transparent" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#25283B]/80 via-transparent to-[#25283B]/30" />


        {/* =================================================
            HEADER
        ================================================= */}
        <header className="fixed left-0 right-0 top-0 z-50 bg-[#25283B]/95 backdrop-blur-md">

          {/* TOP BAR */}
          <div className="hidden border-b border-white/15 bg-[#25283B]/60 lg:block">

            <div className="mx-auto flex max-w-[1500px] items-center justify-between px-8 py-2">

              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/60">
                {t("header.topline")}
              </p>

              <div className="flex items-center gap-6 text-[11px] text-white/65">

                <span>
                  {t("header.together")}
                </span>

                <span className="h-3 w-px bg-white/20" />

                <a
                  href="#contact"
                  onClick={() => setActiveNav("contact")}
                  className="transition-colors duration-300 hover:text-white"
                >
                  {t("nav.contact")}
                </a>

                {/* SOCIAL MEDIA ICONS */}
                <div className="flex items-center gap-3">
                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/benevolentsoulsfoundation?xtok=cDhsZDBxdGVlaHN6&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit Benevolent Souls Foundation on Instagram"
                    title="Instagram"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-pink-400/40 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                  >
                    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/login/?next=https%3A%2F%2Fwww.facebook.com%2FBenevolentSoulsFoundation%2F"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit Benevolent Souls Foundation on Facebook"
                    title="Facebook"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#1877F2]/40 bg-[#1877F2] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#166FE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"                  >
                    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="currentColor" aria-hidden="true">
                      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.4v2H7v3.1h2.9v8h3.6Z" />
                    </svg>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/919881198449"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Contact Benevolent Souls Foundation on WhatsApp"
                    title="WhatsApp"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#25D366]/40 bg-[#25D366] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1DA851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"                  >
                    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z" />
                      <path d="M9 8.5c.4 2 2.1 3.7 4.2 4.4l1.1-1 2 1c-.2 1.3-1.2 2-2.5 1.8-3.3-.6-6.2-3.5-6.7-6.5-.2-1.3.6-2.3 1.8-2.5l1 2-0.9.8Z" />
                    </svg>
                  </a>
                </div>

              </div>

            </div>

          </div>


          {/* MAIN NAV */}
          <nav className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">

            {/* LOGO */}
            <a
              href="#home"
              onClick={() => setActiveNav("home")}
              className="flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC928] shadow-lg">

                <span className="text-sm font-black text-[#25283B]">
                  BS
                </span>

              </div>

              <div>

                <p className="text-[17px] font-bold leading-tight text-white">
                  Benevolent Souls
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-white/55">
                  Foundation
                </p>

              </div>

            </a>


            {/* NAVIGATION: animated active pill */}
            <div className="hidden items-center gap-2 xl:flex">
              {([
                { key: "home", href: "#home", label: t("nav.home") },
                { key: "about", href: "#about", label: t("nav.about") },
                { key: "work", href: "#work", label: t("nav.work") },
                { key: "adoption", href: "#adoption", label: t("nav.adoption") },
                { key: "media", href: "#media", label: t("nav.media") },
                { key: "contact", href: "#contact", label: t("nav.contact") },
              ] as const).map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={() => setActiveNav(item.key)}
                  aria-current={activeNav === item.key ? "location" : undefined}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928] ${activeNav === item.key
                    ? "bg-white text-[#25283B] shadow-md shadow-black/10"
                    : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                    }`}
                >
                  {item.label}
                </a>
              ))}
            </div>


            {/* DESKTOP LANGUAGE SELECTOR */}
            <div className="hidden xl:flex items-center">
              <label htmlFor="site-language-desktop" className="sr-only">
                {t("language.label")}
              </label>
              <select
                id="site-language-desktop"
                value={language}
                onChange={(event) => setLanguage(event.target.value as SiteLanguage)}
                className="max-w-[125px] cursor-pointer border border-white/20 bg-[#25283B] px-3 py-2.5 text-xs font-semibold text-white outline-none transition hover:border-[#FFC928] focus:border-[#FFC928]"
              >
                <option value="en">English</option>
                <option value="mr">मराठी</option>
                <option value="hi">हिन्दी</option>
              </select>
            </div>

            {/* DONATE */}

            <a
              href="/donate"
              className="hidden xl:inline-flex items-center justify-center bg-[#FFC928] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[#25283B] transition duration-300 hover:-translate-y-0.5 hover:bg-[#FFD54F]"
            >
              {t("nav.donate")}
            </a>


            {/* MOBILE MENU WITH POP-UP / POP-DOWN ANIMATION */}
            <div className="relative xl:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all duration-300 hover:border-[#FFC928]/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                aria-label={mobileMenuOpen ? t("header.closeMenu") : t("header.openMenu")}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation-menu"
              >
                <span className={`inline-block text-xl transition-transform duration-300 ${mobileMenuOpen ? "rotate-90" : "rotate-0"}`} aria-hidden="true">
                  {mobileMenuOpen ? "×" : "☰"}
                </span>
              </button>

              <div
                id="mobile-navigation-menu"
                aria-hidden={!mobileMenuOpen}
                className={`absolute right-0 top-14 flex w-64 max-h-[calc(100dvh-5.5rem)] origin-top-right flex-col overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#25283B]/98 p-2 shadow-2xl backdrop-blur-xl transition-all duration-[250ms] ease-out ${mobileMenuOpen
                  ? "translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none max-h-0 -translate-y-2 scale-95 opacity-0"
                  }`}
              >
                <a href="#home" onClick={() => { setActiveNav("home"); closeMobileMenu(); }} aria-current={activeNav === "home" ? "location" : undefined} tabIndex={mobileMenuOpen ? 0 : -1} className={`block rounded-full px-4 py-3.5 text-sm font-semibold transition-all duration-300 ease-out hover:translate-x-1 ${activeNav === "home" ? "bg-white text-[#25283B] shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
                  {t("nav.home")}
                </a>
                <a href="#about" onClick={() => { setActiveNav("about"); closeMobileMenu(); }} aria-current={activeNav === "about" ? "location" : undefined} tabIndex={mobileMenuOpen ? 0 : -1} className={`block rounded-full px-4 py-3.5 text-sm font-semibold transition-all duration-300 ease-out hover:translate-x-1 ${activeNav === "about" ? "bg-white text-[#25283B] shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
                  {t("nav.about")}
                </a>
                <a href="#work" onClick={() => { setActiveNav("work"); closeMobileMenu(); }} aria-current={activeNav === "work" ? "location" : undefined} tabIndex={mobileMenuOpen ? 0 : -1} className={`block rounded-full px-4 py-3.5 text-sm font-semibold transition-all duration-300 ease-out hover:translate-x-1 ${activeNav === "work" ? "bg-white text-[#25283B] shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
                  {t("nav.work")}
                </a>
                <a href="#adoption" onClick={() => { setActiveNav("adoption"); closeMobileMenu(); }} aria-current={activeNav === "adoption" ? "location" : undefined} tabIndex={mobileMenuOpen ? 0 : -1} className={`block rounded-full px-4 py-3.5 text-sm font-semibold transition-all duration-300 ease-out hover:translate-x-1 ${activeNav === "adoption" ? "bg-white text-[#25283B] shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
                  {t("nav.adoption")}
                </a>
                <a href="#media" onClick={() => { setActiveNav("media"); closeMobileMenu(); }} aria-current={activeNav === "media" ? "location" : undefined} tabIndex={mobileMenuOpen ? 0 : -1} className={`block rounded-full px-4 py-3.5 text-sm font-semibold transition-all duration-300 ease-out hover:translate-x-1 ${activeNav === "media" ? "bg-white text-[#25283B] shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
                  {t("nav.media")}
                </a>
                <a href="#contact" onClick={() => { setActiveNav("contact"); closeMobileMenu(); }} aria-current={activeNav === "contact" ? "location" : undefined} tabIndex={mobileMenuOpen ? 0 : -1} className={`block rounded-full px-4 py-3.5 text-sm font-semibold transition-all duration-300 ease-out hover:translate-x-1 ${activeNav === "contact" ? "bg-white text-[#25283B] shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
                  {t("nav.contact")}
                </a>

                <div className="px-4 py-3">
                  <label htmlFor="site-language-mobile" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                    {t("language.label")}
                  </label>
                  <select id="site-language-mobile" value={language} onChange={(event) => setLanguage(event.target.value as SiteLanguage)} tabIndex={mobileMenuOpen ? 0 : -1} className="w-full cursor-pointer border border-white/20 bg-[#25283B] px-3 py-3 text-sm text-white outline-none focus:border-[#FFC928]">
                    <option value="en">English</option>
                    <option value="mr">मराठी</option>
                    <option value="hi">हिन्दी</option>
                  </select>
                </div>

                <div className="flex items-center justify-center gap-4 border-t border-white/10 px-4 py-4">
                  <a
                    href="https://www.instagram.com/benevolentsoulsfoundation?xtok=cDhsZDBxdGVlaHN6&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    tabIndex={mobileMenuOpen ? 0 : -1}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-pink-400/40 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white transition-all duration-300 hover:-translate-y-1 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  </a>

                  <a
                    href="https://www.facebook.com/login/?next=https%3A%2F%2Fwww.facebook.com%2FBenevolentSoulsFoundation%2F"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    tabIndex={mobileMenuOpen ? 0 : -1}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1877F2]/40 bg-[#1877F2] text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#166FE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.4v2H7v3.1h2.9v8h3.6Z" />
                    </svg>
                  </a>

                  <a
                    href="https://wa.me/919881198449"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    tabIndex={mobileMenuOpen ? 0 : -1}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#25D366]/40 bg-[#25D366] text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#1DA851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z" />
                      <path d="M9 8.5c.4 2 2.1 3.7 4.2 4.4l1.1-1 2 1c-.2 1.3-1.2 2-2.5 1.8-3.3-.6-6.2-3.5-6.7-6.5-.2-1.3.6-2.3 1.8-2.5l1 2-0.9.8Z" />
                    </svg>
                  </a>
                </div>

                <div className="my-2 border-t border-white/10" />
                <a href="#donate" onClick={closeMobileMenu} tabIndex={mobileMenuOpen ? 0 : -1} className="block rounded-xl bg-[#FFC928] px-4 py-3.5 text-center text-sm font-bold text-[#25283B] transition-all duration-300 hover:bg-[#FFD84D] hover:shadow-lg">
                  {t("nav.donate")}
                </a>
              </div>
            </div>

          </nav>

        </header>


        {/* =================================================
            HERO CONTENT
        ================================================= */}
        <div className="relative z-10 flex min-h-screen items-end">

          <div className="mx-auto w-full max-w-[1500px] px-6 pb-12 pt-[150px] sm:px-10 sm:pb-16 sm:pt-[160px] lg:px-16 lg:pb-20 lg:pt-[170px]">

            <div className="max-w-[900px]">

              {/* LABEL */}
              <div className="mb-6 flex items-center gap-4">

                <span className="h-[3px] w-14 bg-[#FFC928]" />

                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFC928]">
                  {t("hero.eyebrow")}
                </p>

              </div>


              {/* TITLE */}
              <h1
                className={
                  language === "en"
                    ? "text-[clamp(3.2rem,7.5vw,7.5rem)] font-bold leading-[0.88] tracking-[-0.065em] text-white"
                    : "text-[clamp(2.7rem,5.2vw,6rem)] font-bold leading-[1.16] tracking-normal text-white"
                }
              >

                {t("hero.title1")}

                <br />

                <span className="text-[#FFC928]">
                  {t("hero.title2")}
                </span>

              </h1>


              {/* DESCRIPTION */}
              <p className="mt-8 max-w-2xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
                {t("hero.description")}
              </p>


              {/* BUTTONS */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={() => setShowEmergencyPopup(true)}
                  aria-label={`${t("hero.emergency")}: +91 93594 41200`}
                  className="group inline-flex min-h-[52px] items-center justify-between gap-4 bg-[#FFC928] px-8 py-2 text-sm font-bold leading-4 text-[#25283B] transition duration-300 hover:-translate-y-1 hover:bg-[#FFD84F]"
                >
                  <span className="flex flex-col items-start justify-center leading-none">
                    <span className="text-sm font-bold leading-4">
                      {t("hero.emergency")}
                    </span>

                    <span className="mt-1 text-[10px] font-medium leading-3 tracking-wide">
                      +91 93594 41200
                    </span>
                  </span>

                  <span
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </button>


                <a
                  href="#adoption"
                  className="inline-flex items-center text-sm font-semibold text-white/55 transition hover:text-[#FFC928]"
                >
                  {t("hero.adopt")}
                </a>

              </div>





              {/* BOTTOM INFO */}
              <div className="mt-14 flex flex-col gap-5 border-t border-white/20 pt-5 sm:flex-row sm:items-center sm:justify-between">

                <p className="max-w-xl text-xs leading-5 text-white/55">
                  {t("hero.bottomLine")}
                </p>

                <a
                  href="#about"
                  className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white"
                >
                  {t("hero.discover")}

                  <span className="transition-transform group-hover:translate-x-2">
                    →
                  </span>

                </a>

              </div>

            </div>

          </div>

        </div>


        {/* SCROLL */}
        <div className="absolute bottom-8 right-8 z-20 hidden items-center gap-3 text-white/50 lg:flex">

          <span className="text-[9px] uppercase tracking-[0.3em]">
            {t("hero.scroll")}
          </span>

          <span className="h-10 w-px bg-white/30" />

        </div>

      </section>



      {/* EMERGENCY CONTACT POPUP */}
      {showEmergencyPopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#171927]/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-popup-title"
          onClick={() => setShowEmergencyPopup(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto bg-[#FAF8F0] p-7 shadow-2xl sm:p-9"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowEmergencyPopup(false)}
              aria-label={t("emergency.close")}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center bg-[#25283B] text-xl text-white transition hover:bg-[#FFC928] hover:text-[#25283B]"
            >
              ×
            </button>

            <p className="pr-10 text-xs font-bold uppercase tracking-[0.2em] text-[#B28A00]">
              Benevolent Souls Foundation
            </p>
            <h2 id="emergency-popup-title" className="mt-4 text-3xl font-bold text-[#25283B]">
              {t("emergency.title")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#687080]">
              {t("emergency.description")}
            </p>

            <div className="mt-6 border-t border-[#25283B]/15 pt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#687080]">Emergency Contact</p>
              <a href="tel:+919359441200" className="mt-2 inline-block text-xl font-bold text-[#25283B] transition hover:text-[#B28A00]">
                +91 93594 41200
              </a>

              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#687080]">Additional Contact</p>
              <a href="tel:9881198449" className="mt-2 inline-block text-lg font-semibold text-[#25283B] transition hover:text-[#B28A00]">
                9881198449
              </a>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#687080]">Email</p>
              <a href="mailto:info@benevolentsouls.in" className="mt-2 inline-block break-all text-sm font-semibold text-[#25283B] transition hover:text-[#B28A00]">
                info@benevolentsouls.in
              </a>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#687080]">Registered Address</p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=SN%20110%2F1%2FA%20CTS%20N.%201148%20FL%20N%20504%2C%20L7%20BALWANTPURAM%20SAMRAJYA%2C%20Kothrud%2C%20Pune%2C%20Pune%20City%2C%20Maharashtra%2C%20India%2C%20411038"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm leading-6 text-[#25283B] transition hover:text-[#B28A00]"
              >
                SN 110/1/A CTS N. 1148 FL N 504, L7 BALWANTPURAM SAMRAJYA, Kothrud, Pune, Pune City, Maharashtra, India, 411038
              </a>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="tel:+919359441200" className="flex flex-1 items-center justify-center bg-[#FFC928] px-5 py-4 text-sm font-bold text-[#25283B] transition hover:bg-[#FFD84F]">
                {t("emergency.call")}
              </a>
              <button type="button" onClick={() => setShowEmergencyPopup(false)} className="flex-1 border border-[#25283B]/20 px-5 py-4 text-sm font-bold text-[#25283B] transition hover:bg-[#25283B] hover:text-white">
                {t("emergency.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ABOUT / INTRODUCTION — UPDATED FROM NGO QUESTIONNAIRE
      ===================================================== */}
      <section
        id="about"
        className="relative scroll-mt-28 overflow-hidden bg-[#FAF8F0] px-6 py-24 sm:px-10 lg:px-16 lg:py-32"
      >
        <div className="mx-auto max-w-[1350px]">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B28A00]">
                {language === "mr" ? "आमच्याबद्दल" : language === "hi" ? "हमारे बारे में" : "ABOUT BENEVOLENT SOULS"}
              </p>
              <h2 className={`mt-5 font-bold tracking-[-0.055em] text-[#36394F] ${language === "en"
                ? "text-5xl leading-[0.98] sm:text-6xl lg:text-7xl"
                : "text-4xl leading-[1.14] sm:text-5xl lg:text-6xl"
                }`}>
                {language === "mr" ? <>प्रत्येक जीवासाठी<br /><span className="text-[#C39A00]">करुणा आणि काळजी</span></> :
                  language === "hi" ? <>हर जीवन के लिए<br /><span className="text-[#C39A00]">करुणा और देखभाल</span></> :
                    <>Compassion in<br /><span className="text-[#C39A00]">Every Action.</span></>}
              </h2>
              <p className="mt-7 max-w-xl text-base leading-8 text-[#687080]">
                {language === "mr"
                  ? "बेनेव्होलंट सोल्स फाउंडेशन ही पुणे येथे कार्यरत संस्था आहे. जखमी आणि आजारी प्राणी, पक्षी व सरपटणाऱ्या प्राण्यांना मदत करणे आणि मानव व प्राणी यांच्यातील सहजीवनाबद्दल जागरूकता वाढवणे हे तिच्या कार्याचे केंद्र आहे."
                  : language === "hi"
                    ? "बेनेवोलेंट सोल्स फाउंडेशन पुणे में स्थित एक संस्था है। इसका कार्य घायल और बीमार जानवरों, पक्षियों तथा सरीसृपों की मदद करना और मनुष्यों व जानवरों के बीच बेहतर सह-अस्तित्व के लिए जागरूकता बढ़ाना है।"
                    : "Benevolent Souls Foundation is a Pune-based organisation focused on helping animals, birds and reptiles in distress. Its work brings together animal care, support from volunteers and veterinary professionals, and awareness that encourages people and animals to live together more safely."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#work" className="inline-flex items-center gap-3 bg-[#36394F] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#C39A00]">
                  {language === "mr" ? "आमचे कार्य पाहा" : language === "hi" ? "हमारा काम देखें" : "Explore Our Work"} <span aria-hidden="true">→</span>
                </a>
                <a href="mailto:info@benevolentsouls.in" className="inline-flex items-center border border-[#36394F]/20 px-6 py-3.5 text-sm font-bold text-[#36394F] transition hover:border-[#C39A00] hover:text-[#9B7800]">
                  {language === "mr" ? "संपर्क साधा" : language === "hi" ? "संपर्क करें" : "Get in Touch"}
                </a>
              </div>
            </div>

            <div className="relative min-h-[360px] overflow-hidden bg-[#36394F] sm:min-h-[480px]">
              <img
                src="/image/ngo/community/ngo-community-12.jpeg"
                alt="Volunteer caring for a puppy alongside other dogs"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#25283B]/90 via-[#25283B]/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFC928]">
                  {language === "mr" ? "आमचा दृष्टिकोन" : language === "hi" ? "हमारा दृष्टिकोण" : "OUR APPROACH"}
                </p>
                <h3 className="mt-3 max-w-xl text-3xl font-bold leading-tight text-white sm:text-4xl">
                  {language === "mr" ? "उपचार, पुनर्वसन आणि जागरूकता." : language === "hi" ? "देखभाल, पुनर्वास और जागरूकता।" : "Care, rehabilitation and awareness."}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
                  {language === "mr"
                    ? "गरजू प्राण्यांना योग्य मदत मिळावी यासाठी स्वयंसेवक, पशुवैद्यकीय तज्ज्ञ आणि समुदाय यांच्यात सहकार्य वाढवणे."
                    : language === "hi"
                      ? "ज़रूरतमंद जानवरों को उचित सहायता दिलाने के लिए स्वयंसेवकों, पशु-चिकित्सकों और समुदाय के बीच सहयोग को बढ़ावा देना।"
                      : "Working with volunteers, veterinary professionals and the community to help animals in distress receive appropriate care."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                number: "01",
                title: language === "mr" ? "मदत आणि बचाव" : language === "hi" ? "मदद और बचाव" : "Rescue & Support",
                description: language === "mr" ? "अडचणीत असलेल्या जखमी किंवा आजारी प्राण्यांना मदत." : language === "hi" ? "मुसीबत में घायल या बीमार जानवरों की सहायता।" : "Helping injured or unwell animals and connecting them with support."
              },
              {
                number: "02",
                title: language === "mr" ? "वैद्यकीय काळजी" : language === "hi" ? "चिकित्सा देखभाल" : "Medical Care",
                description: language === "mr" ? "उपचार, लसीकरण आणि निर्जंतुकीकरण उपक्रमांना सहकार्य." : language === "hi" ? "इलाज, टीकाकरण और नसबंदी से जुड़े प्रयासों में सहयोग।" : "Supporting treatment, vaccination and sterilisation initiatives."
              },
              {
                number: "03",
                title: language === "mr" ? "दत्तक प्रक्रिया" : language === "hi" ? "गोद लेने में सहायता" : "Adoption Support",
                description: language === "mr" ? "प्राण्यांना प्रेमळ आणि जबाबदार कायमस्वरूपी घरे मिळवून देण्यास मदत." : language === "hi" ? "जानवरों को प्यार करने वाले और ज़िम्मेदार स्थायी घर दिलाने में मदद।" : "Helping animals find caring, responsible homes through adoption."
              },
              {
                number: "04",
                title: language === "mr" ? "जनजागृती" : language === "hi" ? "जन-जागरूकता" : "Public Awareness",
                description: language === "mr" ? "मानव-प्राणी सहजीवन आणि दयाळू वर्तनाबद्दल शिक्षण." : language === "hi" ? "मनुष्य और जानवरों के बेहतर सह-अस्तित्व और दयालु व्यवहार पर जागरूकता।" : "Encouraging humane behaviour and reducing human–animal conflict."
              }
            ].map((item) => (
              <article key={item.number} className="border-t-2 border-[#FFC928] bg-white p-6 sm:p-7">
                <p className="text-xs font-bold tracking-[0.18em] text-[#B28A00]">{item.number}</p>
                <h3 className="mt-4 text-xl font-bold text-[#36394F]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#687080]">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 border border-[#36394F]/10 bg-white p-6 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B28A00]">
              {language === "mr" ? "प्रभावाविषयी पारदर्शकता" : language === "hi" ? "प्रभाव में पारदर्शिता" : "TRANSPARENT IMPACT REPORTING"}
            </p>
            <h3 className="mt-3 text-xl font-bold text-[#36394F]">
              {language === "mr" ? "विश्वसनीय आकडेवारी महत्त्वाची आहे." : language === "hi" ? "विश्वसनीय आँकड़े महत्वपूर्ण हैं।" : "Every impact figure should be evidence-based."}
            </h3>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-[#687080]">
              {language === "mr" ? "सध्या सार्वजनिकरीत्या पडताळलेली बचाव, उपचार, लसीकरण किंवा दत्तक संख्या उपलब्ध नाही. संस्थेच्या नोंदींवरून पुष्टी झाल्यानंतरच अशी आकडेवारी प्रकाशित केली पाहिजे." : language === "hi" ? "फिलहाल बचाव, उपचार, टीकाकरण या गोद लेने की सार्वजनिक रूप से सत्यापित संख्या उपलब्ध नहीं है। ऐसे आँकड़े संस्था के रिकॉर्ड से पुष्टि के बाद ही प्रकाशित किए जाने चाहिए।" : "No publicly verified totals for rescues, treatments, vaccinations or adoptions were found in the sources reviewed. We will only display impact statistics after the Foundation confirms them from its own records."}
            </p>
          </div>
          <div className="mt-16 grid gap-8 border-t border-[#36394F]/15 pt-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B28A00]">
                {language === "mr" ? "आमचे ध्येय" : language === "hi" ? "हमारा उद्देश्य" : "OUR MISSION"}
              </p>
              <h3 className="mt-3 text-3xl font-bold leading-tight text-[#36394F]">
                {language === "mr" ? "प्रत्येक जीवाला काळजीची संधी." : language === "hi" ? "हर जीवन को देखभाल का अवसर।" : "Give every life a chance to heal."}
              </h3>
            </div>
            <div>
              <p className="text-base leading-8 text-[#596172]">
                {language === "mr"
                  ? "जखमी आणि आजारी प्राणी, पक्षी व सरपटणाऱ्या प्राण्यांना मदत करणे, त्यांच्यासाठी उपचार व पुनर्वसनाला हातभार लावणे आणि समाजात प्राणी कल्याणाबद्दल जागरूकता वाढवणे—या उद्दिष्टाभोवती आमचा दृष्टिकोन केंद्रित आहे."
                  : language === "hi"
                    ? "घायल और बीमार जानवरों, पक्षियों तथा सरीसृपों की सहायता करना, उनके इलाज और पुनर्वास में योगदान देना और समाज में पशु कल्याण के प्रति जागरूकता बढ़ाना—हमारा दृष्टिकोण इसी उद्देश्य पर केंद्रित है।"
                    : "Our approach centres on helping injured and sick animals, birds and reptiles, supporting treatment and rehabilitation, and building public awareness about animal welfare. This mission statement is a website draft based on the organisation's public activity description and should be approved by the Foundation."}
              </p>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-[#36394F]">
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#C39A00]" />{language === "mr" ? "करुणा" : language === "hi" ? "करुणा" : "Compassion"}</span>
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#C39A00]" />{language === "mr" ? "समुदायाचे सहकार्य" : language === "hi" ? "समुदाय का सहयोग" : "Community Partnership"}</span>
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#C39A00]" />{language === "mr" ? "जबाबदार काळजी" : language === "hi" ? "ज़िम्मेदार देखभाल" : "Responsible Care"}</span>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border border-[#36394F]/10 bg-[#F0EEE5] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B28A00]">
                {language === "mr" ? "संस्थेची नोंदणी" : language === "hi" ? "संस्था पंजीकरण" : "ORGANISATION PROFILE"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#596172]">
                {language === "mr" ? "कंपनी नोंदणीच्या सार्वजनिक माहितीनुसार, संस्था ६ डिसेंबर २०२२ रोजी पुणे येथे नोंदणीकृत झाली." : language === "hi" ? "सार्वजनिक कंपनी-रजिस्ट्री जानकारी के अनुसार, संस्था 6 दिसंबर 2022 को पुणे में पंजीकृत हुई।" : "Public company-information listings report that Benevolent Souls Foundation was incorporated on 6 December 2022 and registered with ROC Pune."}
              </p>
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-[#687080]">CIN</p>
              <p className="mt-2 break-all text-sm font-bold text-[#36394F]">U85300PN2022NPL216697</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#737B88]">
            {language === "mr" ? "नोंदणी तपशील सार्वजनिक कंपनी-माहिती स्रोतांवर आधारित आहेत; अंतिम प्रकाशनापूर्वी अधिकृत नोंदी आणि संस्थेची मान्यता तपासा." : language === "hi" ? "पंजीकरण विवरण सार्वजनिक कंपनी-सूचना स्रोतों पर आधारित हैं; प्रकाशन से पहले आधिकारिक रिकॉर्ड और संस्था की पुष्टि करें।" : "Registration details are based on public company-information listings; verify against official MCA records and obtain the Foundation's approval before publication."}
          </p>
        </div>
      </section>


      {/* =====================================================
    OUR WORK
===================================================== */}
      <section
        id="work"
        className="scroll-mt-40 bg-white px-6 py-16 sm:px-10 lg:px-16 lg:py-20"
      >
        <div className="mx-auto max-w-[1350px]">

          {/* SECTION HEADER */}
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B28A00]">
                {t("work.label")}
              </p>

              <h2
                className={
                  language === "en"
                    ? "mt-5 max-w-3xl text-5xl font-bold leading-[0.95] tracking-[-0.055em] text-[#36394F] sm:text-6xl lg:text-7xl"
                    : "mt-5 max-w-3xl text-4xl font-bold leading-[1.14] tracking-normal text-[#36394F] sm:text-5xl lg:text-6xl"
                }
              >
                {t("work.titleTop")}
                <br />
                into <span className="text-[#C39A00]">action.</span>
              </h2>
            </div>

            <div className="lg:pb-2">
              <p className="max-w-xl text-lg leading-8 text-[#687080]">
                {t("work.description")}
              </p>
            </div>

          </div>


          {/* =================================================
        FEATURED WORK
    ================================================= */}
          <div className="mt-16 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">

            {/* LARGE FEATURE */}
            <article className="group relative min-h-[560px] overflow-hidden bg-[#36394F]">

              {/* NGO Animal Care Image */}
              <img
                src="/image/ngo/community/ngo-community-03.jpeg"
                alt="Volunteer holding a dog at Benevolent Souls Foundation"
                className="absolute inset-0 h-full w-full object-contain object-center bg-[#36394F] transition-transform duration-700 group-hover:scale-[1.01]"
              />


              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#25283B] via-[#25283B]/20 to-transparent" />

              {/* Content */}
              {/* ANIMAL SELECTOR */}

              <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10">

                <div className="flex items-end justify-between gap-6">

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFC928]">
                      {t("work.animalCareLabel")}
                    </p>

                    <h3 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                      {t("work.careTitleTop")}
                      <br />
                      {t("work.careTitleBottom")}
                    </h3>

                    <p className="mt-4 max-w-lg text-sm leading-6 text-white/75">
                      {t("work.careDesc")}
                    </p>

                  </div>

                  <a
                    href="#media"
                    aria-label="Explore animal care media"
                    className="relative z-20 hidden h-12 w-12 shrink-0 items-center justify-center border border-white/30 text-white transition duration-300 hover:bg-[#FFC928] hover:text-[#25283B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928] sm:flex"
                  >
                    <span aria-hidden="true">→</span>
                  </a>

                </div>

              </div>

            </article>


            {/* SIDE FEATURE */}
            <article className="group relative min-h-[560px] overflow-hidden bg-[#FFC928]">

              <div className="absolute inset-0 overflow-hidden">
                <img
                  src="/image/ngo/community/ngo-community-08.jpeg"
                  alt="Volunteer caring for a dog"
                  className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#25283B]/10 via-[#FFC928]/20 to-[#FFC928]" />
              </div>


              <div className="relative flex min-h-[560px] flex-col justify-between p-8 sm:p-10">

                <div className="flex items-center justify-between">

                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#36394F]/65">
                    {t("work.adoptionLabel")}
                  </p>

                  <a
                    href="#adoption"
                    aria-label="Explore adoption options"
                    className="relative z-10 flex h-11 w-11 items-center justify-center border border-[#36394F]/20 text-[#36394F] transition-colors duration-300 hover:border-[#25283B] hover:bg-[#25283B] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25283B]"
                  >
                    <span aria-hidden="true">→</span>
                  </a>

                </div>

                <div>

                  <h3 className="text-3xl font-bold leading-tight text-[#25283B] sm:text-4xl">
                    {t("work.adoptionTitle1")}
                    <br />
                    {t("work.adoptionTitle2")}
                    <br />
                    <span className="underline decoration-2 underline-offset-4">
                      {t("work.adoptionTitle3")}
                    </span>
                  </h3>

                  <p className="mt-5 text-sm leading-6 text-[#36394F]/70">
                    {t("work.adoptionDesc")}
                  </p>

                </div>

              </div>

            </article>

          </div>


          {/* =================================================
        SECONDARY WORK CARDS
    ================================================= */}
          <div className="mt-5 grid gap-5 md:grid-cols-2">

            {/* COMMUNITY */}
            <article className="group grid overflow-hidden border border-[#36394F]/10 bg-[#EEF0F5] sm:grid-cols-[0.9fr_1.1fr]">


              <div className="relative min-h-[300px] overflow-hidden">
                <img
                  src="/image/ngo/community/ngo-community-08.jpeg"
                  alt="Volunteer sitting with a dog at Benevolent Souls Foundation"
                  className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-between p-8 sm:p-10">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B28A00]">
                    {t("work.communityLabel")}
                  </p>

                  <h3 className="mt-4 text-3xl font-bold leading-tight text-[#36394F]">
                    {t("work.communityTitle1")}
                    <br />
                    {t("work.communityTitle2")}
                  </h3>

                  <p className="mt-4 text-sm leading-6 text-[#687080]">
                    {t("work.communityDesc")}
                  </p>

                </div>


              </div>

            </article>


            {/* AWARENESS */}
            <article className="group grid overflow-hidden border border-[#36394F]/10 bg-[#F7F4EC] sm:grid-cols-[0.9fr_1.1fr]">

              <div className="relative min-h-[300px] overflow-hidden">
                <img
                  src="/image/ngo/community/ngo-community-14.jpeg"
                  alt="Animal Rescue Team vehicle and volunteer"
                  className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-col justify-between p-8 sm:p-10">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B28A00]">
                    {t("work.awarenessLabel")}
                  </p>

                  <h3 className="mt-4 text-3xl font-bold leading-tight text-[#36394F]">
                    {t("work.awarenessTitle1")}
                    <br />
                    {t("work.awarenessTitle2")}
                  </h3>

                  <p className="mt-4 text-sm leading-6 text-[#687080]">
                    {t("work.awarenessDesc")}
                  </p>



                </div>
              </div>

            </article>

          </div>


          {/* ACTIVITY FOCUS — based on public directory description; NGO to confirm current services */}
          <div className="mt-10 border-t border-[#36394F]/15 pt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B28A00]">
              {language === "mr" ? "कार्याचे प्रमुख क्षेत्र" : language === "hi" ? "कार्य के प्रमुख क्षेत्र" : "AREAS OF FOCUS"}
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  n: "01",
                  title: language === "mr" ? "बचाव आणि पुनर्वसन" : language === "hi" ? "बचाव और पुनर्वास" : "Rescue & Rehabilitation",
                  body: language === "mr" ? "जखमी किंवा आजारी प्राणी, पक्षी आणि सरपटणाऱ्या प्राण्यांना मदत करण्यावर लक्ष." : language === "hi" ? "घायल या बीमार जानवरों, पक्षियों और सरीसृपों की सहायता पर ध्यान।" : "A focus on helping injured or sick animals, birds and reptiles and supporting their recovery."
                },
                {
                  n: "02",
                  title: language === "mr" ? "वैद्यकीय मदत" : language === "hi" ? "चिकित्सा सहायता" : "Medical Support",
                  body: language === "mr" ? "सार्वजनिक वर्णनानुसार, स्वयंसेवक आणि डॉक्टरांच्या सहकार्याने उपचार व काळजी." : language === "hi" ? "सार्वजनिक विवरण के अनुसार, स्वयंसेवकों और डॉक्टरों के सहयोग से उपचार और देखभाल।" : "The public description mentions care and treatment with support from volunteers and doctors."
                },
                {
                  n: "03",
                  title: language === "mr" ? "जागरूकता आणि शिक्षण" : language === "hi" ? "जागरूकता और शिक्षा" : "Awareness & Education",
                  body: language === "mr" ? "मानव-प्राणी संघर्ष कमी करण्यासाठी सह-अस्तित्व आणि जबाबदार वर्तनाबद्दल जागरूकता." : language === "hi" ? "मनुष्य-जानवर संघर्ष कम करने के लिए सह-अस्तित्व और जिम्मेदार व्यवहार पर जागरूकता।" : "Awareness and education to encourage safer coexistence and reduce human–animal conflict."
                }
              ].map((item) => (
                <article key={item.n} className="border border-[#36394F]/10 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <p className="text-xs font-bold tracking-[0.18em] text-[#B28A00]">{item.n}</p>
                  <h3 className="mt-3 text-lg font-bold text-[#36394F]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#687080]">{item.body}</p>
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#737B88]">
              {language === "mr" ? "ही माहिती सार्वजनिक निर्देशिकेतील वर्णनावर आधारित आहे. सध्याच्या सेवा आणि उपक्रमांची अंतिम पुष्टी संस्थेकडून घ्यावी." : language === "hi" ? "यह जानकारी सार्वजनिक निर्देशिका के विवरण पर आधारित है। वर्तमान सेवाओं और गतिविधियों की पुष्टि संस्था से की जानी चाहिए।" : "These focus areas are based on a third-party public directory description. Please confirm the Foundation's current services before treating them as an official service list."}
            </p>
          </div>

          {/* BOTTOM STATEMENT */}

          {/* SIDE FEATURE */}
        </div>
      </section>


      {/* =====================================================
    ADOPTION
===================================================== */}
      <section
        id="adoption"
        className="scroll-mt-28 bg-[#FAF8F0] px-6 pt-16 pb-8 sm:px-10 sm:pt-20 sm:pb-10 lg:px-16 lg:pt-24 lg:pb-10"      >
        <div className="mx-auto max-w-[1350px]">

          {/* HEADER */}
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">

            <div>

              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B28A00]">
                {t("adoption.label")}
              </p>

              <h2
                className={
                  language === "en"
                    ? "mt-5 text-5xl font-bold leading-[0.92] tracking-[-0.055em] text-[#36394F] sm:text-6xl lg:text-7xl"
                    : "mt-5 text-4xl font-bold leading-[1.14] tracking-normal text-[#36394F] sm:text-5xl lg:text-6xl"
                }
              >

                {t("adoption.title1")}
                <br />

                {t("adoption.title2")}
                <br />

                <span className="text-[#C39A00]">
                  {t("adoption.title3")}
                </span>

              </h2>

            </div>


            <div className="lg:pb-2">

              <p className="max-w-xl text-lg leading-8 text-[#687080]">
                {t("adoption.description")}
              </p>



            </div>

          </div>


          <div className="mt-10 border border-[#C39A00]/30 bg-white p-6 sm:flex sm:items-start sm:gap-4 sm:p-7">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF4C2] text-lg font-bold text-[#806300]" aria-hidden="true">i</div>
            <div>
              <h3 className="text-base font-bold text-[#36394F]">
                {language === "mr" ? "दत्तक प्रक्रियेबद्दल महत्त्वाची माहिती" : language === "hi" ? "गोद लेने की प्रक्रिया के बारे में महत्वपूर्ण जानकारी" : "A note about adoption enquiries"}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#687080]">
                {language === "mr" ? "संस्थेची अधिकृत दत्तक धोरणे, पात्रता, शुल्क आणि घरभेट प्रक्रिया सार्वजनिक स्रोतांमध्ये पडताळता आली नाही. येथे चौकशी पाठवणे म्हणजे दत्तक मंजूर होणे नव्हे. पुढील पावले आणि प्राण्याची अद्ययावत आरोग्य-माहिती संस्थेकडून थेट निश्चित करा." : language === "hi" ? "संस्था की आधिकारिक गोद लेने की नीति, पात्रता, शुल्क और घर-जाँच प्रक्रिया सार्वजनिक स्रोतों से सत्यापित नहीं हो सकी। यहाँ पूछताछ भेजना गोद लेने की मंजूरी नहीं है। आगे की प्रक्रिया और जानवर की अद्यतन स्वास्थ्य जानकारी संस्था से सीधे पुष्टि करें।" : "The Foundation's official adoption policy, eligibility rules, fees and home-check process could not be verified from public sources. Sending an enquiry does not mean an adoption is approved. Please confirm the next steps and each animal's current health information directly with the Foundation."}
              </p>
            </div>
          </div>

          {/* =================================================
        FEATURED ADOPTION AREA
    ================================================= */}
          <div className="mt-16">
            {animals.length > 0 ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {animals.slice(0, visibleAnimals).map((animal) => (
                    <article
                      key={animal.id}
                      className="group overflow-hidden border border-[#36394F]/10 bg-white"
                    >
                      <div className="relative h-[300px] overflow-hidden bg-[#36394F]">
                        {animal.image_url ? (
                          <img
                            src={animal.image_url}
                            alt={animal.name}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#36394F]">
                            <div className="text-center">
                              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#FFC928]/40">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFC928]">
                                  {t("adoption.animal")}
                                </span>
                              </div>

                              <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-white/60">
                                {animal.name}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#B28A00]">
                          {t("adoption.available")}
                        </p>

                        <h3 className="mt-3 text-2xl font-bold text-[#36394F]">
                          {animal.name}
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#687080]">
                          <span>{animal.species}</span>
                          <span>•</span>
                          <span>{animal.age} {t("adoption.years")}</span>
                          <span>•</span>
                          <span>{animal.gender}</span>
                        </div>

                        <p className="mt-4 min-h-[48px] line-clamp-2 text-sm leading-6 text-[#687080]">
                          {animal.description}
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            const index = animals.findIndex((item) => item.id === animal.id);
                            setSelectedAnimalIndex(index);
                            document
                              .getElementById("adoption-enquiry")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="mt-auto w-full bg-[#25283B] px-5 py-3 text-sm font-bold text-white transition duration-300 hover:bg-[#FFC928] hover:text-[#25283B]"
                        >
                          {t("adoption.enquireAbout")} {animal.name}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {(visibleAnimals < animals.length || visibleAnimals > 4) && (
                  <div className="mt-10 flex flex-wrap justify-center gap-3">
                    {visibleAnimals < animals.length && (
                      <button
                        type="button"
                        onClick={() => setVisibleAnimals((current) => current + 4)}
                        className="border border-[#25283B] bg-[#25283B] px-8 py-3 text-sm font-bold text-white transition duration-300 hover:bg-[#FFC928] hover:text-[#25283B]"
                      >
                        {t("adoption.loadMore")}
                      </button>
                    )}

                    {visibleAnimals > 4 && (
                      <button
                        type="button"
                        onClick={() => {
                          setVisibleAnimals(4);
                          window.scrollTo({
                            top: document.getElementById("adoption")?.offsetTop ?? 0,
                            behavior: "smooth",
                          });
                        }}
                        className="border border-[#25283B] bg-[#25283B] px-8 py-3 text-sm font-bold text-white transition duration-300 hover:bg-[#FFC928] hover:text-[#25283B]"
                      >
                        {t("adoption.showFour")}
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="border border-[#36394F]/10 bg-white p-10 text-center">
                <p className="text-sm text-[#687080]">
                  {t("adoption.noneAvailable")}
                </p>
              </div>
            )}

            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B28A00]">
                {t("adoption.findAvailable")}
              </p>

              <h3 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#36394F] sm:text-4xl">
                {t("adoption.findCompanion")}
              </h3>
            </div>
            {/* MAIN VISUAL */}


            {/* EMERGENCY CONTACT */}

            {/* ADOPTION ENQUIRY FORM */}
            <div
              id="adoption-enquiry"
              className="mt-10 bg-white p-8 shadow-sm sm:p-10"
            >
              <div className="mb-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#25283B]/50">
                  {t("adoption.formTitle")}
                </p>

                <h3 className="mt-3 text-2xl font-bold text-[#25283B]">
                  {t("adoption.formQuestion")}
                </h3>
                {animals.length > 0 && (
                  <p className="mt-3 text-sm font-semibold text-[#B28A00]">
                    {t("adoption.enquiryFor")} {animals[selectedAnimalIndex].name}
                  </p>
                )}

                <p className="mt-3 text-sm leading-6 text-[#25283B]/60">
                  {t("adoption.formDesc")}
                </p>
              </div>

              {
                adoptionSubmitted ? (
                  <div className="border border-green-200 bg-green-50 p-6">
                    <p className="text-sm font-semibold text-green-700">
                      {t("adoption.thanks")}
                    </p>
                    <p className="mt-2 text-sm text-green-700/80">
                      {t("adoption.teamContact")}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleAdoptionSubmit} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#25283B]">
                        {t("form.fullName")}
                      </label>

                      <input
                        type="text"
                        value={adoptionName}
                        onChange={(e) => setAdoptionName(e.target.value)}
                        required
                        className="w-full border border-[#25283B]/15 px-4 py-3 text-sm outline-none transition focus:border-[#FFC928]"
                        placeholder={t("form.namePlaceholder")}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#25283B]">
                        {t("form.email")}
                      </label>

                      <input
                        type="email"
                        value={adoptionEmail}
                        onChange={(e) => setAdoptionEmail(e.target.value)}
                        required
                        className="w-full border border-[#25283B]/15 px-4 py-3 text-sm outline-none transition focus:border-[#FFC928]"
                        placeholder={t("form.emailPlaceholder")}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#25283B]">
                        {t("form.phone")}
                      </label>

                      <input
                        type="tel"
                        value={adoptionPhone}
                        onChange={(e) => setAdoptionPhone(e.target.value)}
                        required
                        className="w-full border border-[#25283B]/15 px-4 py-3 text-sm outline-none transition focus:border-[#FFC928]"
                        placeholder={t("form.phonePlaceholder")}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#25283B]">
                        {t("form.message")}
                      </label>

                      <textarea
                        value={adoptionMessage}
                        onChange={(e) => setAdoptionMessage(e.target.value)}
                        rows={5}
                        className="w-full resize-none border border-[#25283B]/15 px-4 py-3 text-sm outline-none transition focus:border-[#FFC928]"
                        placeholder={t("form.adoptionMessagePlaceholder")}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={adoptionSubmitting}
                      className="w-full bg-[#25283B] px-6 py-4 text-sm font-bold text-white transition duration-300 hover:bg-[#FFC928] hover:text-[#25283B] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {adoptionSubmitting ? t("form.submitting") : t("form.submit")}
                    </button>
                  </form>
                )
              }
            </div >

          </div >


        </div >
      </section >


      {/* =====================================================
    MEDIA ONLY
===================================================== */}
      <section
        id="media"
        className="scroll-mt-28 bg-[#FAF8F0] px-6 pt-24 pb-16 sm:px-10 lg:px-16 lg:pt-32 lg:pb-20"
      >
        <div className="mx-auto max-w-[1350px]">

          {/* SECTION HEADER */}
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">

            <div>

              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B28A00]">
                {t("media.kicker")}
              </p>

              <h2
                className={
                  language === "en"
                    ? "mt-5 text-5xl font-bold leading-[0.92] tracking-[-0.055em] text-[#36394F] sm:text-6xl lg:text-7xl"
                    : "mt-5 text-4xl font-bold leading-[1.14] tracking-normal text-[#36394F] sm:text-5xl lg:text-6xl"
                }
              >
                {t("media.title1")}
                <br />
                <span className="text-[#C39A00]">
                  {t("media.title2")}
                </span>
              </h2>

            </div>


            <div className="max-w-md lg:pb-2">

              <p className="text-lg leading-8 text-[#687080]">
                {t("media.description")}
              </p>

            </div>

          </div>


          {/* =================================================
        MEDIA GRID
    ================================================= */}
          <div className="mt-10 grid gap-5 lg:grid-cols-2">


            {/* MEDIA 01 */}
            <article className="group overflow-hidden bg-white">

              <div className="relative h-[330px] overflow-hidden bg-[#C8CDD8]">

                <img
                  src="/image/ngo/ngo-recognition-event.jpeg"
                  alt="Animal care at Benevolent Souls Foundation"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#25283B]/40 via-transparent to-transparent" />

                <a
                  href="/gallery"
                  className="absolute left-5 top-5 block bg-[#FFC928] px-5 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[#25283B]"
                >
                  {t("stories.viewGallery")}
                </a>

              </div>


              <div className="border border-t-0 border-[#36394F]/10 p-7">

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B28A00]">
                  {t("stories.photos")}
                </p>

                <h3 className="mt-3 text-2xl font-bold leading-tight text-[#36394F]">
                  {t("stories.photoTitle1")}
                  <br />
                  {t("stories.photoTitle2")}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#687080]">
                  {t("stories.photoDesc")}
                </p>


              </div>

            </article>


            {/* MEDIA 02 */}


            {/* MEDIA 03 */}
            <article className="group overflow-hidden bg-[#36394F]">

              <div className="relative h-[330px] overflow-hidden bg-[#4B5067]">

                <video
                  src="/videos/ngo-media-video-3.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />



                <div className="absolute left-5 top-5 bg-white px-3 py-2">

                  <a
                    href="/videos"
                    className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#36394F]"
                  >
                    {t("stories.watchVideos")}
                  </a>

                </div>

              </div>


              <div className="p-7">

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFC928]">
                  {t("stories.videoLabel")}
                </p>

                <h3 className="mt-3 text-2xl font-bold leading-tight text-white">
                  {t("stories.videoTitle1")}
                  <br />
                  {t("stories.videoTitle2")}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/50">
                  {t("stories.videoDesc")}
                </p>



              </div>

            </article>

          </div>


          {/* =================================================
        SOCIAL / MEDIA STRIP
    ================================================= */}
          <div className="mt-10 border-y border-[#36394F]/15 py-7">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B28A00]">
                  {t("media.socialText")}
                </p>

                <p className="mt-2 text-lg font-bold text-[#36394F]">
                  {t("media.more")}
                </p>

              </div>




            </div>

          </div>

        </div>
      </section >


      {/* =====================================================
    DONATION CTA
===================================================== */}
      <section
        id="donate"
        className="scroll-mt-28 relative overflow-hidden bg-[#FFC928] px-6 py-24 sm:px-10 lg:px-16 lg:py-32"
      >
        {/* Decorative circles */}

        <div className="relative mx-auto max-w-[1200px]">

          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">


            {/* LEFT */}
            <div>

              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#36394F]/60">
                {t("donate.supportMission")}
              </p>

              <h2
                className={
                  language === "en"
                    ? "mt-5 max-w-4xl text-5xl font-bold leading-[0.92] tracking-[-0.055em] text-[#25283B] sm:text-6xl lg:text-7xl"
                    : "mt-5 max-w-4xl text-4xl font-bold leading-[1.14] tracking-normal text-[#25283B] sm:text-5xl lg:text-6xl"
                }
              >

                {t("donate.title1")}
                <br />

                {t("donate.title2")}
                <br />

                {t("donate.title3")}

              </h2>

            </div>


            {/* RIGHT */}
            <div>

              <p className="text-lg leading-8 text-[#36394F]/75">
                {t("donate.description")}
              </p>

              <p className="mt-5 text-sm leading-6 text-[#36394F]/55">
                {t("donate.paymentNote")}
              </p>


              {/* BUTTONS */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                <a
                  href="/donate"
                  className="inline-flex items-center justify-center gap-4 bg-[#36394F] px-7 py-4 text-sm font-bold text-white transition duration-300 hover:-translate-y-1 hover:bg-[#25283B]"
                >
                  {t("donate.now")}

                  <span>
                    →
                  </span>

                </a>


                <a
                  href="#contact"
                  className="inline-flex items-center justify-center border-2 border-[#36394F] px-7 py-4 text-sm font-bold text-[#36394F] transition duration-300 hover:bg-[#36394F] hover:text-white"
                >
                  {t("nav.contact")}
                </a>

              </div>
              {/* EMERGENCY CONTACT */}
              <div className="mt-7 flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full border border-[#FFC928] flex items-center justify-center text-[#FFC928]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.8"
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.09l-4.423-.999a1.125 1.125 0 0 0-1.173.417l-.97 1.182a1.125 1.125 0 0 1-1.272.337 12.035 12.035 0 0 1-7.125-7.125 1.125 1.125 0 0 1 .337-1.272l1.182-.97c.36-.295.52-.76.417-1.173l-.999-4.423A1.125 1.125 0 0 0 5.622 3H4.25A2.25 2.25 0 0 0 2 5.25v1.5Z"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFC928]">
                    {t("donate.animalEmergency")}
                  </p>

                  <a href="tel:+919359441200" className="mt-1 inline-block text-sm font-semibold text-[#36394F] transition hover:underline">
                    +91 93594 41200 — {t("donate.urgent")}
                  </a>
                </div>
              </div>

            </div>

          </div>


          {/* DONATION NOTE */}
          <div className="mt-16 border-t border-[#36394F]/20 pt-6">

            <p className="text-xs font-medium text-[#36394F]/55">
              {t("donate.supportNote")}
            </p>

          </div>

        </div>

      </section >


      {/* =====================================================
    FOOTER
===================================================== */}

      {/* CONTACT SECTION */}
      <section
        id="contact"
        className="scroll-mt-28 bg-[#25283B] px-6 py-20 sm:px-8 lg:px-12 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">

          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">

            {/* LEFT CONTENT */}
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#FFC928]">
                {t("contact.label")}
              </p>

              <h2 className="max-w-2xl text-4xl font-bold leading-tight text-[#FAF8F0] sm:text-5xl lg:text-6xl">
                {t("contact.title")}
                <span className="text-[#FFC928]">{t("contact.titleTogether")}</span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                {t("contact.description")}
              </p>

              <div className="mt-10 space-y-6">

                {/* PHONE */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFC928] text-[#25283B]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.8"
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.09l-4.423-.999a1.125 1.125 0 0 0-1.173.417l-.97 1.182a1.125 1.125 0 0 1-1.272.337 12.035 12.035 0 0 1-7.125-7.125 1.125 1.125 0 0 1 .337-1.272l1.182-.97c.36-.295.52-.76.417-1.173l-.999-4.423A1.125 1.125 0 0 0 5.622 3H4.25A2.25 2.25 0 0 0 2 5.25v1.5Z"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white/50">
                      {t("contact.phone")}
                    </p>

                    <a href="tel:9881198449" className="mt-1 inline-block text-sm font-semibold text-white transition hover:text-[#FFC928]">
                      9881198449
                    </a>
                    <br />
                    <a href="tel:+919359441200" className="mt-1 inline-block text-sm font-semibold text-white transition hover:text-[#FFC928]">
                      +91 93594 41200 ({t("contact.emergency")})
                    </a>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFC928] text-[#25283B]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.8"
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V6.75Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m3.5 6.5 8.5 6.25 8.5-6.25"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white/50">
                      {t("form.email")}
                    </p>

                    <a href="mailto:info@benevolentsouls.in" className="mt-1 inline-block break-all text-sm font-semibold text-white transition hover:text-[#FFC928]">
                      info@benevolentsouls.in
                    </a>
                  </div>
                </div>

                {/* LOCATION */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFC928] text-[#25283B]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.8"
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21s7-5.25 7-11a7 7 0 1 0-14 0c0 5.75 7 11 7 11Z"
                      />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white/50">
                      {t("contact.location")}
                    </p>

                    <a
                      href="https://www.google.com/maps/search/?api=1&query=SN%20110%2F1%2FA%20CTS%20N.%201148%20FL%20N%20504%2C%20L7%20BALWANTPURAM%20SAMRAJYA%2C%20Kothrud%2C%20Pune%2C%20Pune%20City%2C%20Maharashtra%2C%20India%2C%20411038"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-sm leading-6 font-semibold text-white transition hover:text-[#FFC928]"
                    >
                      SN 110/1/A CTS N. 1148 FL N 504, L7 BALWANTPURAM SAMRAJYA, Kothrud, Pune, Pune City, Maharashtra, India, 411038
                    </a>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT CARD */}
            <div className="rounded-3xl bg-[#FAF8F0] p-7 shadow-2xl sm:p-9">

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#25283B]/50">
                {t("contact.enquiry")}
              </p>

              <h3 className="mt-3 text-3xl font-bold text-[#25283B]">
                {t("contact.howHelp")}
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#25283B]/60">
                {t("contact.sendMessage")}
              </p>

              <form className="mt-8 space-y-5">

                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-2 block text-sm font-semibold text-[#25283B]"
                  >
                    {t("contact.yourName")}
                  </label>

                  <input
                    id="contact-name"
                    type="text"
                    placeholder={t("contact.namePlaceholder")}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-[#25283B]/10 bg-white px-4 py-3.5 text-sm text-[#25283B] outline-none transition focus:border-[#FFC928] focus:ring-2 focus:ring-[#FFC928]/20"

                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-2 block text-sm font-semibold text-[#25283B]"
                  >
                    {t("contact.emailAddress")}
                  </label>

                  <input
                    id="contact-email"
                    type="email"
                    placeholder={t("form.emailPlaceholder")}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#25283B]/10 bg-white px-4 py-3.5 text-sm text-[#25283B] outline-none transition focus:border-[#FFC928] focus:ring-2 focus:ring-[#FFC928]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-sm font-semibold text-[#25283B]"
                  >
                    {t("form.message")}
                  </label>

                  <textarea
                    id="contact-message"
                    rows={5}
                    placeholder={t("contact.messagePlaceholder")}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full resize-none rounded-xl border border-[#25283B]/10 bg-white px-4 py-3.5 text-sm text-[#25283B] outline-none transition focus:border-[#FFC928] focus:ring-2 focus:ring-[#FFC928]/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!name.trim() || !email.trim() || !message.trim()) {
                      alert(t("contact.fillAll"));
                      return;
                    }

                    const { error } = await supabase
                      .from("contact_enquiries")
                      .insert([
                        {
                          name: name.trim(),
                          email: email.trim(),
                          message: message.trim(),
                        },
                      ]);

                    if (error) {
                      alert(t("contact.error"));
                      console.error(error);
                      return;
                    }

                    setSubmitted(true);

                    setName("");
                    setEmail("");
                    setMessage("");
                  }}
                  className="w-full rounded-xl bg-[#25283B] px-6 py-4 text-sm font-bold text-[#FAF8F0] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#FFC928] hover:text-[#25283B] hover:shadow-lg"
                >
                  {t("contact.sendEnquiry")}
                </button>

              </form>
              {submitted && (
                <div className="mt-5 rounded-2xl border border-[#2E7D32]/20 bg-[#2E7D32]/10 p-5">
                  <p className="text-sm font-bold text-[#2E7D32]">
                    {t("contact.success")}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#25283B]/70">
                    {t("contact.successDesc")}
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      <footer

        id="footer"
        className="bg-[#25283B] text-white"
      >

        <div className="mx-auto max-w-[1450px] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">


          {/* =================================================
        FOOTER MAIN GRID
    ================================================= */}
          <div className="grid gap-14 lg:grid-cols-[1.35fr_0.75fr_0.75fr_1fr]">


            {/* =================================================
          BRAND
      ================================================= */}
            <div>

              {/* LOGO */}
              <a
                href="#home"
                className="inline-flex items-center gap-3"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC928]">

                  <span className="text-sm font-black text-[#25283B]">
                    BS
                  </span>

                </div>


                <div>

                  <p className="text-lg font-bold text-white">
                    Benevolent Souls
                  </p>

                  <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-white/40">
                    Foundation
                  </p>

                </div>

              </a>


              {/* DESCRIPTION */}
              <p className="mt-7 max-w-sm text-sm leading-7 text-white/60">
                {t("footer.description")}
              </p>

            </div>


            {/* =================================================
          QUICK LINKS
      ================================================= */}
            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
                {t("footer.explore")}
              </p>


              <div className="mt-7 space-y-4">

                <a
                  href="#about"
                  className="block text-sm text-white/55 transition hover:text-[#FFC928]"
                >
                  {t("about.label")}
                </a>

                <a
                  href="#work"
                  className="block text-sm text-white/55 transition hover:text-[#FFC928]"
                >
                  {t("work.label")}
                </a>

                <a
                  href="#adoption"
                  className="block text-sm text-white/55 transition hover:text-[#FFC928]"
                >
                  {t("adoption.label")}
                </a>



                <a
                  href="#media"
                  className="block text-sm text-white/55 transition hover:text-[#FFC928]"
                >
                  {t("nav.media")}
                </a>

              </div>

            </div>


            {/* =================================================
          GET INVOLVED
      ================================================= */}
            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
                {t("footer.getInvolved")}
              </p>


              <div className="mt-7 space-y-4">

                <a
                  href="/donate"
                  className="inline-flex items-center justify-center bg-[#FFC928] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[#25283B] transition duration-300 hover:-translate-y-0.5 hover:bg-[#FFD54F]"
                >
                  {t("nav.donate")}
                </a>

                <a
                  href="#adoption"
                  className="block w-fit text-sm font-semibold text-white/55 transition hover:text-[#FFC928]"
                >
                  {t("footer.adoptAnimal")}
                </a>

                <a
                  href="#contact"
                  className="block text-sm text-white/55 transition hover:text-[#FFC928]"
                >
                  {t("nav.contact")}
                </a>

              </div>

            </div>


            {/* =================================================
          CONTACT
      ================================================= */}
            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
                {t("contact.sectionLabel")}
              </p>


              <div className="mt-7 space-y-6">


                {/* PHONE */}
                <div>

                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                    {t("contact.phone")}
                  </p>

                  <a href="tel:9881198449" className="mt-2 block w-fit text-sm text-white/75 transition hover:text-[#FFC928]">
                    9881198449
                  </a>
                  <a href="tel:+919359441200" className="mt-2 block w-fit text-sm text-white/75 transition hover:text-[#FFC928]">
                    +91 93594 41200 ({t("contact.emergency")})
                  </a>

                </div>


                {/* EMAIL */}
                <div>

                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                    {t("form.email")}
                  </p>

                  <a href="mailto:info@benevolentsouls.in" className="mt-2 inline-block break-all text-sm text-white/65 transition hover:text-[#FFC928]">
                    info@benevolentsouls.in
                  </a>

                </div>


                {/* LOCATION */}
                <div>

                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                    {t("contact.location")}
                  </p>

                  <a
                    href="https://www.google.com/maps/search/?api=1&query=SN%20110%2F1%2FA%20CTS%20N.%201148%20FL%20N%20504%2C%20L7%20BALWANTPURAM%20SAMRAJYA%2C%20Kothrud%2C%20Pune%2C%20Pune%20City%2C%20Maharashtra%2C%20India%2C%20411038"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm leading-6 text-white/65 transition hover:text-[#FFC928]"
                  >
                    SN 110/1/A CTS N. 1148 FL N 504, L7 BALWANTPURAM SAMRAJYA, Kothrud, Pune, Pune City, Maharashtra, India, 411038
                  </a>

                </div>


                <div className="border-t border-white/10 pt-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                    {t("footer.follow")}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    {/* Instagram */}
                    <a
                      href="https://www.instagram.com/benevolentsoulsfoundation?xtok=cDhsZDBxdGVlaHN6&utm_source=qr"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Visit Benevolent Souls Foundation on Instagram"
                      title="Instagram"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-pink-400/40 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white transition-all duration-300 hover:-translate-y-1 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="5" />
                        <circle cx="12" cy="12" r="4" />
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                      </svg>
                    </a>

                    {/* Facebook */}
                    <a
                      href="https://www.facebook.com/BenevolentSoulsFoundation/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Visit Benevolent Souls Foundation on Facebook"
                      title="Facebook"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1877F2]/40 bg-[#1877F2] text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#166FE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                        <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.4v2H7v3.1h2.9v8h3.6Z" />
                      </svg>
                    </a>

                    {/* WhatsApp */}
                    <a
                      href="https://wa.me/919881198449"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Contact Benevolent Souls Foundation on WhatsApp"
                      title="WhatsApp"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#25D366]/40 bg-[#25D366] text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#1DA851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC928]"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                        <path
                          d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9 8.5c.4 2 2.1 3.7 4.2 4.4l1.1-1 2 1c-.2 1.3-1.2 2-2.5 1.8-3.3-.6-6.2-3.5-6.7-6.5-.2-1.3.6-2.3 1.8-2.5l1 2-.9.8Z"
                          fill="currentColor"
                        />
                      </svg>
                    </a>
                  </div>
                </div>


              </div>

            </div>

          </div>


          {/* =================================================
        CONTACT CTA STRIP
    ================================================= */}
          <div className="mt-16 border-y border-white/10 py-7">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFC928]">
                  {t("footer.haveQuestion")}
                </p>

                <p className="mt-2 text-lg font-bold text-white">
                  {t("footer.loveToHear")}
                </p>

              </div>


              <a
                href="#contact"
                className="flex w-fit items-center gap-4 bg-white px-6 py-3.5 text-sm font-bold text-[#25283B] transition duration-300 hover:bg-[#FFC928]"
              >

                {t("footer.contactNgo")}

                <span>
                  →
                </span>

              </a>

            </div>

          </div>


          {/* =================================================
        FOOTER BOTTOM
    ================================================= */}
          <div className="mt-7 flex flex-col gap-4 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">

            <p>
              © 2026 Benevolent Souls Foundation. {t("footer.allRights")}
            </p>


            <div className="flex gap-6">

              <a
                href="#"
                className="transition hover:text-white"
              >
                {t("footer.privacy")}
              </a>

              <a
                href="#"
                className="transition hover:text-white"
              >
                {t("footer.terms")}
              </a>

            </div>

          </div>

        </div>

      </footer>
    </main >
  );
}
