// resources/js/Pages/welcome.tsx
import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun, ChevronDown, ChevronUp, ChevronDownIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { motion, AnimatePresence } from "framer-motion";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"



import BackToTopButton from '@/components/BackToTopButton';
import { format } from "date-fns";



export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const { appearance, updateAppearance } = useAppearance();
    const isDark = appearance === 'dark';

    // Toggle for the compact requirements section (shown by default)
    const [showReqs, setShowReqs] = useState(true);
    const [incoming, setIncoming] = useState<string | null>(null);

    // States for dropdowns
    const [nameExt, setNameExt] = useState<string>("")
    const [province, setProvince] = useState<string>("")
    const [district, setDistrict] = useState<string>("")
    const [school, setSchool] = useState<string>("")
    const [yearLevel, setYearLevel] = useState<string>("")
    const [course, setCourse] = useState<string>("")

    const [locations, setLocations] = useState<{ id: number; label: string }[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(true);

    useEffect(() => {
        fetch("/api/locations", {
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest", // 👈 makes Laravel see it as AJAX
            },
        })
            .then((res) => res.json())
            .then((data) => setLocations(data.data || [])) // ✅ handle { message, data }
            .catch(() => setLocations([]))
            .finally(() => setLoadingLocations(false));
    }, []);


    const [districts, setDistricts] = useState<{ id: number; label: string }[]>([]);
    const [loadingDistricts, setLoadingDistricts] = useState(true);

    useEffect(() => {
        fetch("/api/districts", {
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest", // 👈 tell Laravel it's AJAX
            },
        })
            .then((res) => res.json())
            .then((data) => setDistricts(data.data ?? []))
            .catch(() => setDistricts([]))
            .finally(() => setLoadingDistricts(false));
    }, []);


    const [schools, setSchools] = useState<{ id: number; label: string }[]>([]);
    const [loadingSchools, setLoadingSchools] = useState(true);

    useEffect(() => {
        fetch("/api/schools", {
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest", // 👈 required
            },
        })
            .then((res) => res.json())
            .then((data) => setSchools(data.data || []))
            .catch(() => setSchools([]))
            .finally(() => setLoadingSchools(false));
    }, []);


    const [courses, setCourses] = useState<{ id: number; label: string; category?: string }[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    useEffect(() => {
        fetch("/api/courses", {
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
        })
            .then((res) => res.json())
            .then((data) => setCourses(data.data || []))
            .catch(() => setCourses([]))
            .finally(() => setLoadingCourses(false));
    }, []);


    const [open, setOpen] = useState(false)
    const [date, setDate] = useState<Date | undefined>(undefined)

    return (
        <>
            <Head title="AY 2025–2026">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            {/* Offset for fixed navbar */}
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 pt-16 lg:pt-20 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <header className="w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    {/* Fixed navbar with explicit height */}
                    <nav className="fixed inset-x-0 top-0 z-20 h-16 lg:h-20 border-b border-gray-200 bg-[#1e3c72] dark:border-[#3E3E3A] dark:bg-[#161615]">
                        <div className="mx-auto flex h-full max-w-screen-xl items-center justify-between px-4">
                            <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                                <img src="/ched_logo.png" className="h-8" alt="Logo" />
                                <div className="flex flex-col">
                                    <span className="hidden lg:block self-center text-2xs font-semibold whitespace-nowrap text-white dark:text-[#EDEDEC]">
                                        COMMISSION ON HIGHER EDUCATION - REGIONAL OFFICE XII
                                    </span>
                                    <span className="lg:hidden sm:block text-2xs font-semibold whitespace-nowrap text-white dark:text-[#EDEDEC]">
                                        CHEDRO XII
                                    </span>
                                    <span className="hidden lg:block text-2xs font-semibold whitespace-nowrap text-white dark:text-[#EDEDEC]">
                                        CHED Merit Scholarship Program (CMSP)
                                    </span>
                                    <span className="lg:hidden sm:block text-2xs font-semibold whitespace-nowrap text-white dark:text-[#EDEDEC]">
                                        CMSP
                                    </span>
                                </div>
                            </a>

                            <div className="flex items-center space-x-2 md:order-2 rtl:space-x-reverse">
                                {/* <a
                                    href={route('login')}
                                    className="rounded-lg bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 px-4 py-2 text-center text-sm font-medium text-white focus:ring-4 focus:outline-none dark:bg-[#EDEDEC] dark:text-[#1C1C1A] dark:hover:bg-white dark:hover:text-[#1C1C1A] dark:focus:ring-[#3E3E3A]"
                                >
                                    Log in
                                </a> */}
                                <button
                                    onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
                                    className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 transition-colors duration-300 hover:ring-2 hover:ring-blue-500 dark:bg-gray-800"
                                    aria-label="Toggle dark mode"
                                >
                                    <Sun className={`absolute h-4 w-4 text-blue-900 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
                                    <Moon className={`absolute h-4 w-4 text-blue-400 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`} />
                                </button>
                            </div>
                        </div>
                    </nav>
                </header>

                {/* Main */}
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-700 lg:grow">
                    <main className="mx-auto flex w-full max-w-[380px] sm:max-w-md flex-col gap-6 lg:max-w-7xl">
                        {/* Top CMSP card */}
                        <section className="w-full mt-6">
                            <Card className="rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800/70 dark:bg-zinc-950/40">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="rounded-full border-green-200 bg-green-50 text-xs text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300"
                                        >
                                            Call for Application
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="rounded-full border-blue-200 bg-blue-50 text-xs text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300"
                                        >
                                            AY 2025–2026
                                        </Badge>
                                    </div>

                                    <div className="mt-2 flex items-center gap-0">
                                        <img src="/ched_logo.png" alt="CHED Logo" className="h-10 w-auto p-1" />
                                        <img src="/bagong_pilipinas.png" alt="Bagong Pilipinas Logo" className="h-14 w-auto p-1" />
                                        <div className="ml-3">
                                            <CardTitle className="text-xl font-semibold tracking-tight">
                                                CHED Merit Scholarship Program (CMSP)
                                            </CardTitle>
                                            <CardDescription className="text-sm text-zinc-600 dark:text-zinc-400">
                                                CHED Regional Office XII
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4 text-[13px] leading-relaxed text-zinc-800 dark:text-zinc-200">
                                    <p className="text-justify">
                                        CHED Merit Scholarship Program (CMSP) Application of CHED Regional Office 12 for the Academic Year 2025–2026.
                                        Please be advised that this scholarship application is
                                        <span className="ml-1 font-bold"> intended only for all incoming first year college students.</span>
                                        Earned units and already in the college level are discouraged to apply. Please read the CHED Memorandum Order
                                        below before proceeding to fill out the form.
                                    </p>

                                    {/* NOTE card — amber */}
                                    <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                                        <div className="flex items-start gap-3">
                                            <div className="space-y-1">
                                                <p className="font-semibold text-amber-900 dark:text-amber-200">NOTE</p>
                                                <p className="text-justify text-zinc-800 dark:text-zinc-200">
                                                    Please ensure that the course you are planning to enroll in is aligned with the priority courses.
                                                </p>
                                                <p className="text-justify text-zinc-700 dark:text-zinc-300">
                                                    Additionally, check the completeness of your documents because only those with complete documents with at least{' '}
                                                    <span className="font-semibold">93% General Weighted Average (GWA)</span> are allowed to proceed to the Online Application.
                                                </p>

                                                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-full border-amber-300 bg-amber-100/80 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                                    >
                                                        Deadline: June 20, 2025
                                                    </Badge>
                                                    <span className="text-[12px] text-zinc-600 dark:text-zinc-400">
                                                        Late submissions will not be entertained.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="pt-1 text-[12px] text-zinc-500 dark:text-zinc-400">Thank you!</p>
                                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                            CMSP APPLICATION FORM
                                        </p>
                                        <a
                                            href="/files/CMSP_ANNEX_A-APPLICATION_FORM_2025-2026.pdf"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 inline-block text-sm text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Download Application Form / Qualification form
                                        </a>
                                    </div>

                                </CardContent>
                            </Card>
                        </section>

                        {/* Toggleable compact row — 3 columns: 1 (Ineligible) + 2 (Qualifications in 2-inner-cols) */}
                        <section className="w-full">
                            <div className="mb-2 flex items-center justify-between">
                                <h2
                                    className={`text-sm font-semibold ${showReqs
                                        ? "text-zinc-700 dark:text-zinc-300"
                                        : "text-zinc-400 dark:text-zinc-500"
                                        }`}
                                >
                                    Eligibility & Requirements
                                </h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    aria-expanded={showReqs}
                                    onClick={() => setShowReqs((s) => !s)}
                                    className="h-8 rounded-full px-3 flex items-center gap-1"
                                >
                                    <motion.div
                                        animate={{ rotate: showReqs ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </motion.div>
                                    {showReqs ? "Hide" : "Show"}
                                </Button>

                            </div>

                            <AnimatePresence initial={false}>
                                {showReqs && (
                                    <motion.div
                                        key="reqs"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >

                                        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3">
                                            {/* Col 1: Ineligible Applicant */}
                                            <Card className="flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-semibold tracking-tight">INELIGIBLE APPLICANT</CardTitle>
                                                    <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400">
                                                        The following applicants are ineligible to apply:
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="flex-1 text-[12px] leading-snug text-zinc-800 dark:text-zinc-200">
                                                    <ul className="list-none space-y-1.5">
                                                        <li className="grid grid-cols-[2.5rem_1fr] items-start gap-2">
                                                            <span className="font-medium tabular-nums text-right">5.1</span>
                                                            <span>Foreign students;</span>
                                                        </li>

                                                        <li className="grid grid-cols-[2.5rem_1fr] items-start gap-2">
                                                            <span className="font-medium tabular-nums text-right">5.2</span>
                                                            <span>Applicants who are not incoming or current first year undergraduate students;</span>
                                                        </li>

                                                        <li className="grid grid-cols-[2.5rem_1fr] items-start gap-2">
                                                            <span className="font-medium tabular-nums text-right">5.3</span>
                                                            <span>Applicants who will or are enrolled in priority programs but not granted government recognition or -certification by CHED;</span>
                                                        </li>

                                                        <li className="grid grid-cols-[2.5rem_1fr] items-start gap-2">
                                                            <span className="font-medium tabular-nums text-right">5.4</span>
                                                            <span>Applicants who will or intend to enroll in a non-priority program;</span>
                                                        </li>

                                                        <li className="grid grid-cols-[2.5rem_1fr] items-start gap-2">
                                                            <span className="font-medium tabular-nums text-right">5.5</span>
                                                            <span>Transferees and Shiftees;</span>
                                                        </li>

                                                        <li className="grid grid-cols-[2.5rem_1fr] items-start gap-2">
                                                            <span className="font-medium tabular-nums text-right">5.6</span>
                                                            <span>
                                                                An existing recipient of any nationally government-funded scholarships or grants, including Tertiary Education Subsidy (TES) or
                                                                Tulong Dunong Program (TDP). Grantees under the One-time Grants are exempted;
                                                            </span>
                                                        </li>

                                                        <li className="grid grid-cols-[2.5rem_1fr] items-start gap-2">
                                                            <span className="font-medium tabular-nums text-right">5.7</span>
                                                            <span>Applicants who has completed an undergraduate degree program or a second course taker; and</span>
                                                        </li>

                                                        <li className="grid grid-cols-[2.5rem_1fr] items-start gap-2">
                                                            <span className="font-medium tabular-nums text-right">5.8</span>
                                                            <span>Applicants who submitted tampered and/or falsified application documents, including documentary requirements.</span>
                                                        </li>
                                                    </ul>
                                                </CardContent>

                                            </Card>

                                            {/* Cols 2–3 */}
                                            <Card className="col-span-1 flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm lg:col-span-2 dark:border-zinc-800/70 dark:bg-zinc-950/40">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-semibold tracking-tight">
                                                        QUALIFICATIONS
                                                    </CardTitle>
                                                </CardHeader>

                                                {/* Three inner columns on lg+; stacked on mobile */}
                                                <CardContent className="flex-1 text-[12px] leading-snug text-zinc-800 dark:text-zinc-200">
                                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

                                                        {/* Col 1: I & II */}
                                                        <div className="space-y-3">
                                                            <div>
                                                                <h3 className="mb-1 text-[12px] font-semibold">I. Priority Programs:</h3>
                                                                <ol className="list-decimal pl-5 space-y-1">
                                                                    <li>National – CMO No. 7, s. 2023 entitled “List of Identified Priority Programs for AYs 2023-2024 to 2027-2028”;</li>
                                                                    <li>Regional – Memorandum from the Office of the Chairperson on Regional Priority Programs dated September 17, 2021; and</li>
                                                                    <li>Gender and Development (GAD) – Memorandum from the Chairperson on GAD StuFAPs Allocation dated April 4, 2011.</li>
                                                                </ol>
                                                            </div>

                                                            <div>
                                                                <h3 className="mb-1 text-[12px] font-semibold">II. Eligibility Requirements:</h3>
                                                                <ol className="list-decimal pl-5 space-y-1">
                                                                    <li>Filipino Citizen;</li>
                                                                    <li>Senior High school graduate with a minimum general weighted average (GWA) of 93% or its equivalent; and</li>
                                                                    <li>Combined annual gross income of parents, or legal guardian should not exceed PhP500,000.00;</li>
                                                                </ol>
                                                            </div>
                                                        </div>

                                                        {/* Col 2: III (1–4) */}
                                                        <div className="space-y-3">
                                                            <div>
                                                                <h3 className="mb-1 text-[12px] font-semibold">III. Documentary Requirements:</h3>
                                                                <ol className="list-decimal pl-5 space-y-1">
                                                                    <li>Accomplished Application Form;</li>
                                                                    <li>Copy of Birth certificate issued by NSO or PSA;</li>
                                                                    <li>Certified true copy of Form 138 (SF9), duly signed by the registrar;</li>
                                                                    <li>
                                                                        Financial - submit any one (1) of the following:
                                                                        <ul className="mt-1 list-[circle] pl-5 space-y-1">
                                                                            <li>Latest Income Tax Return (ITR) of parents or guardian</li>
                                                                            <li>Certificate of Tax Exemption/Non-Filer from BIR;</li>
                                                                            <li>Certified true copy of contract/proof of income (OFW/Seafarers);</li>
                                                                            <li>Social Case Study Report from CSWD/MSWD.</li>
                                                                        </ul>
                                                                    </li>
                                                                </ol>
                                                            </div>
                                                        </div>

                                                        {/* Col 3: III (5–6) */}
                                                        <div className="space-y-3">
                                                            <ol start={5} className="list-decimal pl-5 space-y-1">
                                                                <li>
                                                                    Other Requirements, if applicable
                                                                    <ul className="mt-1 list-[circle] pl-5 space-y-1">
                                                                        <li>PWD ID issued by CSWD/MSWD or Certification from PDAO;</li>
                                                                        <li>Solo Parent ID from CSWD/MSWD;</li>
                                                                        <li>Senior Citizen ID from CSWD/MSWD;</li>
                                                                        <li>Underprivileged/Homeless certification from DHSUD/CSWD/MSWD;</li>
                                                                        <li>Social Case Study Report under Magna Carta of the Poor / First-Gen Students</li>
                                                                        <li>Indigenous Peoples Certification from NCIP.</li>
                                                                    </ul>
                                                                </li>
                                                                <li>Notarized Certificate of Guardianship, if applicable.</li>
                                                            </ol>
                                                        </div>

                                                    </div>


                                                </CardContent>
                                            </Card>
                                            <div className="lg:col-span-3">
                                                <label className="mb-1 block text-sm font-medium">
                                                    CHED Memorandum Order No. 07 Series of 2023
                                                </label>

                                                <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">

                                                    {/* Thumbnails row - centered */}
                                                    <div className="flex justify-center gap-4 overflow-x-auto pb-2">
                                                        {[
                                                            "/files/CMO-NO.-7-S.-2023_page-0001.jpg",
                                                            "/files/CMO-NO.-7-S.-2023_page-0002.jpg",
                                                            "/files/CMO-NO.-7-S.-2023_page-0003.jpg",
                                                            "/files/CMO-NO.-7-S.-2023_page-0004.jpg",
                                                            "/files/CMO-NO.-7-S.-2023_page-0005.jpg",
                                                        ].map((src, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={src}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="shrink-0"
                                                            >
                                                                <img
                                                                    src={src}
                                                                    alt={`CHED Memorandum page ${idx + 1}`}
                                                                    className="h-32 w-auto rounded-md border border-zinc-300 object-cover hover:opacity-90 dark:border-zinc-600"
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>

                                                    {/* Link to full PDF */}
                                                    <div className="text-center">
                                                        <a
                                                            href="/files/CMO-NO.-7-S.-2023.pdf"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                        >
                                                            View Full CMO No. 07 Series of 2023 (PDF)
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>


                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>

                        <section className="w-full">
                            <Card className="rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold tracking-tight">
                                        Applicant Information
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-6">

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        {/* Incoming 1st Year */}
                                        <div>
                                            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                                Are you an incoming 1st year college? <span className="text-red-500">*</span>
                                            </p>
                                            <div className="flex flex-col gap-2">
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="radio"
                                                        name="incoming"
                                                        value="yes"
                                                        checked={incoming === "yes"}
                                                        onChange={(e) => setIncoming(e.target.value)}
                                                        className="h-4 w-4"
                                                    />{" "}
                                                    Yes
                                                </label>
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="radio"
                                                        name="incoming"
                                                        value="no"
                                                        checked={incoming === "no"}
                                                        onChange={(e) => setIncoming(e.target.value)}
                                                        className="h-4 w-4"
                                                    />{" "}
                                                    If NO, you are not qualified to apply.
                                                </label>
                                            </div>
                                        </div>

                                        {/* LRN (Learner Reference Number) */}
                                        <div className="md:col-span-1">
                                            <label className="mb-1 block text-sm font-medium">
                                                Learner Reference Number (LRN) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter your 12-digit LRN"
                                                maxLength={12}
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
        focus:border-blue-500 focus:ring focus:ring-blue-200 
        dark:border-zinc-700 dark:bg-zinc-900"
                                            />
                                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                Your LRN is a 12-digit number issued by DepEd.
                                            </p>
                                        </div>
                                    </div>





                                    {/* Grid 2–3 cols */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                                        {/* Email */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Email (Active Email Address) <span className="text-red-500">*</span></label>
                                            <input type="email" placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" />
                                        </div>

                                        {/* Contact Number */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Contact Number (Active Contact Number) <span className="text-red-500">*</span></label>
                                            <input type="text" placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" />
                                        </div>

                                        {/* Last Name */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
                                            <input type="text" placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" />
                                        </div>

                                        {/* First Name */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">First Name <span className="text-red-500">*</span></label>
                                            <input type="text" placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" />
                                        </div>

                                        {/* Middle Name */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Middle Name <span className="text-red-500">*</span></label>
                                            <input type="text" placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" />
                                        </div>

                                        {/* Maiden Name */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Maiden Name (for Married Women)</label>
                                            <input type="text" placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" />
                                        </div>

                                        {/* Name Extension (Command searchable) */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Name Extension</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {nameExt || "Select extension"}
                                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-[var(--radix-popover-trigger-width)] p-0"
                                                    align="start"
                                                >
                                                    <Command>
                                                        <CommandInput placeholder="Search extension..." />
                                                        <CommandList>
                                                            <CommandEmpty>No result</CommandEmpty>
                                                            <CommandGroup>
                                                                {["Jr", "III", "Others", "N/A"].map((ext) => (
                                                                    <CommandItem key={ext} onSelect={() => setNameExt(ext)}>
                                                                        {ext}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>

                                            </Popover>
                                        </div>

                                        {/* Birthdate */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">
                                                Birthdate <span className="text-red-500">*</span>
                                            </label>
                                            <Popover open={open} onOpenChange={setOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        id="date"
                                                        className="w-48 justify-between font-normal"
                                                    >
                                                        {date ? format(date, "dd/MM/yyyy") : "Select date"}
                                                        <ChevronDownIcon />
                                                    </Button>
                                                </PopoverTrigger>

                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={date}
                                                        onSelect={(date) => {
                                                            setDate(date);
                                                            setOpen(false);
                                                        }}
                                                        captionLayout="dropdown"
                                                        classNames={{
                                                            caption_dropdowns: "flex gap-2 items-center justify-center",
                                                            dropdown:
                                                                "rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus:outline-none",
                                                            caption_label: "hidden",
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>



                                        {/* Sex (Radio) */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Sex <span className="text-red-500">*</span></label>
                                            <div className="flex flex-col gap-2">
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input type="radio" name="sex" className="h-4 w-4" /> Male
                                                </label>
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input type="radio" name="sex" className="h-4 w-4" /> Female
                                                </label>
                                            </div>
                                        </div>

                                        {/* Province & Municipality */}
                                        <div className="md:col-span-2">
                                            <label className="mb-1 block text-sm font-medium">
                                                Province & Municipality <span className="text-red-500">*</span>
                                            </label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {province || "Select location"}
                                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-[var(--radix-popover-trigger-width)] p-0"
                                                    align="start"
                                                >
                                                    <Command>
                                                        <CommandInput placeholder="Search location..." />
                                                        <CommandList>
                                                            {loadingLocations ? (
                                                                <CommandEmpty>Loading...</CommandEmpty>
                                                            ) : locations.length === 0 ? (
                                                                <CommandEmpty>No results found.</CommandEmpty>
                                                            ) : (
                                                                <CommandGroup heading="Province & Municipality">
                                                                    {locations.map((loc) => (
                                                                        <CommandItem
                                                                            key={loc.id}
                                                                            onSelect={() => setProvince(loc.label)}
                                                                        >
                                                                            {loc.label}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            )}
                                                        </CommandList>

                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>


                                        {/* Address Fields */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Barangay <span className="text-red-500">*</span></label>
                                            <input type="text" placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Purok/Street <span className="text-red-500">*</span></label>
                                            <input type="text" placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-medium">ZIP Code <span className="text-red-500">*</span></label>
                                            <input type="text" placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" />
                                        </div>

                                        {/* District */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">
                                                District <span className="text-red-500">*</span>
                                            </label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {district || "Select district"}
                                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-[var(--radix-popover-trigger-width)] p-0"
                                                    align="start"
                                                >
                                                    <Command>
                                                        <CommandInput placeholder="Search district..." />
                                                        <CommandList>
                                                            {loadingDistricts ? (
                                                                <CommandEmpty>Loading...</CommandEmpty>
                                                            ) : districts.length === 0 ? (
                                                                <CommandEmpty>No results found.</CommandEmpty>
                                                            ) : (
                                                                <CommandGroup heading="Districts">
                                                                    {districts.map((d) => (
                                                                        <CommandItem
                                                                            key={d.id}
                                                                            onSelect={() => setDistrict(d.label)}
                                                                        >
                                                                            {d.label}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            )}
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>



                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* BARMM B Section */}
                        <section className="w-full">
                            <Card className="rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold tracking-tight">
                                        For Applicants from <span className="font-bold">BARMM B</span>
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    {/* Address Fields */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {/* Province */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Province</label>
                                            <input
                                                type="text"
                                                placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
              focus:border-blue-500 focus:ring focus:ring-blue-200 
              dark:border-zinc-700 dark:bg-zinc-900"
                                            />
                                        </div>

                                        {/* Municipality */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Municipality</label>
                                            <input
                                                type="text"
                                                placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
              focus:border-blue-500 focus:ring focus:ring-blue-200 
              dark:border-zinc-700 dark:bg-zinc-900"
                                            />
                                        </div>

                                        {/* Barangay */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Barangay</label>
                                            <input
                                                type="text"
                                                placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
              focus:border-blue-500 focus:ring focus:ring-blue-200 
              dark:border-zinc-700 dark:bg-zinc-900"
                                            />
                                        </div>

                                        {/* Purok/Street */}
                                        <div className="lg:col-span-2">
                                            <label className="mb-1 block text-sm font-medium">Purok/Street</label>
                                            <input
                                                type="text"
                                                placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
              focus:border-blue-500 focus:ring focus:ring-blue-200 
              dark:border-zinc-700 dark:bg-zinc-900"
                                            />
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <hr className="border-zinc-200 dark:border-zinc-700" />

                                    {/* School / Year / Course Section */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                                        {/* School intended to enroll */}
                                        <div className="lg:col-span-2">
                                            <label className="mb-1 block text-sm font-medium">
                                                School intended to enroll in College <span className="text-red-500">*</span>
                                            </label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {school || "Choose school"}
                                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-[var(--radix-popover-trigger-width)] p-0"
                                                    align="start"
                                                >
                                                    <Command>
                                                        <CommandInput placeholder="Search school..." />
                                                        <CommandList>
                                                            {loadingSchools ? (
                                                                <CommandEmpty>Loading...</CommandEmpty>
                                                            ) : schools.length === 0 ? (
                                                                <CommandEmpty>No result</CommandEmpty>
                                                            ) : (
                                                                <CommandGroup heading="Schools">
                                                                    {schools.map((s) => (
                                                                        <CommandItem
                                                                            key={s.id}
                                                                            onSelect={() => setSchool(s.label)}
                                                                        >
                                                                            {s.label}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            )}
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>


                                        {/* Type of School */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">
                                                Type of School <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex flex-col gap-2 text-sm">
                                                {["Public", "LUC", "Private"].map((type) => (
                                                    <label key={type} className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="schoolType"
                                                            value={type}
                                                            className="h-4 w-4"
                                                        />
                                                        {type}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>


                                        {/* If not indicated */}
                                        <div className="lg:col-span-3">
                                            <label className="mb-1 block text-sm font-medium">
                                                If your school was not indicated, please specify here.{" "}
                                                <span className="italic text-xs">(Do not abbreviate!)</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Your answer"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
              focus:border-blue-500 focus:ring focus:ring-blue-200 
              dark:border-zinc-700 dark:bg-zinc-900"
                                            />
                                        </div>

                                        {/* Year Level */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">
                                                Year Level <span className="text-red-500">*</span>
                                            </label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {yearLevel || "Choose"}
                                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-[var(--radix-popover-trigger-width)] p-0"
                                                    align="start"
                                                >
                                                    <Command>
                                                        <CommandInput placeholder="Search year level..." />
                                                        <CommandList>
                                                            <CommandEmpty>No result</CommandEmpty>
                                                            <CommandGroup>
                                                                {["Incoming First Year"].map((lvl) => (
                                                                    <CommandItem key={lvl} onSelect={() => setYearLevel(lvl)}>
                                                                        {lvl}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        {/* Course (CHED Priority) */}
                                        <div className="lg:col-span-2">
                                            <label className="mb-1 block text-sm font-medium">
                                                Course (CHED Priority Courses) <span className="text-red-500">*</span>
                                            </label>
                                            <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">
                                                Based on the:{" "}
                                                <a
                                                    href="/files/CMO-NO.-7-S.-2023.pdf"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 underline dark:text-blue-400"
                                                >
                                                    CHED Memorandum Order (CMO) No. 07 Series of 2023
                                                </a>
                                            </p>

                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {course || "Choose course"}
                                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-[var(--radix-popover-trigger-width)] p-0"
                                                    align="start"
                                                >
                                                    <Command>
                                                        <CommandInput placeholder="Search course..." />
                                                        <CommandList>
                                                            {loadingCourses ? (
                                                                <CommandEmpty>Loading...</CommandEmpty>
                                                            ) : courses.length === 0 ? (
                                                                <CommandEmpty>No result</CommandEmpty>
                                                            ) : (
                                                                <CommandGroup heading="CHED Priority Courses">
                                                                    {courses.map((c) => (
                                                                        <CommandItem
                                                                            key={c.id}
                                                                            onSelect={() => setCourse(c.label)}
                                                                        >
                                                                            {c.label}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            )}
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>


                                        {/* === CHED Memorandum (Thumbnail) === */}
                                        <div className="lg:col-span-3">
                                            <label className="mb-1 block text-sm font-medium">
                                                CHED Memorandum: Gender and Development StuFAPs Slot Allocation For SY 2011-2012
                                            </label>
                                            <div className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">

                                                {/* Thumbnail preview */}
                                                <a
                                                    href="/files/memorandum.jpg"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="shrink-0"
                                                >
                                                    <img
                                                        src="/files/memorandum.jpg"
                                                        alt="CHED Memorandum"
                                                        className="h-20 w-16 rounded-md border border-zinc-300 object-cover hover:opacity-90 dark:border-zinc-600"
                                                    />
                                                </a>

                                                {/* Right side: link + dropdown */}
                                                <div className="flex flex-col flex-1 gap-2">
                                                    <a
                                                        href="/files/memorandum.jpg"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        View Full Memorandum
                                                    </a>

                                                    <select
                                                        className="w-full sm:w-64 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
      focus:border-blue-500 focus:ring focus:ring-blue-200 
      dark:border-zinc-700 dark:bg-zinc-900"
                                                    >
                                                        <option value="">Choose</option>
                                                        <option value="Bachelor of Marine and Transportation">Bachelor of Marine and Transportation</option>
                                                    </select>
                                                </div>

                                            </div>
                                        </div>



                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Additional Information Section */}
                        <section className="w-full">
                            <Card className="rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">

                                <CardContent className="space-y-8">
                                    {/* === Application Form Upload === */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">
                                            Accomplished Application Form (PDF file only){" "}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm
                                                file:mr-3 file:rounded-md file:border-0 file:bg-[#1e3c73] file:px-3 file:py-1.5
                                                file:text-sm file:font-medium file:text-white 
                                                hover:file:bg-[#25468a] 
                                                focus:border-blue-500 focus:ring focus:ring-blue-200
                                                dark:border-zinc-700 dark:bg-zinc-900 dark:file:bg-[#1e3c73] dark:hover:file:bg-[#25468a]"
                                        />
                                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                            Upload 1 file only. Max size 10 MB.
                                        </p>
                                    </div>


                                    {/* === Senior High School === */}
                                    <div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            <div className="lg:col-span-2">
                                                <label className="mb-1 block text-sm font-medium">
                                                    Name of Senior High School Attended/Graduated in (Strictly no abbreviation){" "}
                                                    <span className="text-red-500">*</span>
                                                </label>
                                                <input type="text" placeholder="Your answer"
                                                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
                focus:border-blue-500 focus:ring focus:ring-blue-200 
                dark:border-zinc-700 dark:bg-zinc-900" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">
                                                    School Address (Senior High School) <span className="text-red-500">*</span>
                                                </label>
                                                <input type="text" placeholder="Your answer"
                                                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
                focus:border-blue-500 focus:ring focus:ring-blue-200 
                dark:border-zinc-700 dark:bg-zinc-900" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* === Parents Information === */}
                                    <div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {/* Father */}
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Father’s Full Name <span className="text-red-500">*</span></label>
                                                <input type="text" placeholder="Your answer"
                                                    className="input-primary" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Father’s Occupation <span className="text-red-500">*</span></label>
                                                <input type="text" placeholder="Your answer"
                                                    className="input-primary" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Father’s Gross Monthly Income <span className="text-red-500">*</span></label>
                                                <input type="number" placeholder="Your answer"
                                                    className="input-primary" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Father’s Gross Yearly Income <span className="text-red-500">*</span></label>
                                                <select className="input-primary">
                                                    <option value="">Choose</option>
                                                    <option value="0-70,000">0 - 70,000</option>
                                                    <option value="70,001-136,000">70,001 - 136,000</option>
                                                    <option value="136,001-202,000">136,001 - 202,000</option>
                                                    <option value="202,001-268,000">202,001 - 268,000</option>
                                                    <option value="268,001-334,000">268,001 - 334,000</option>
                                                    <option value="334,001-400,000">334,001 - 400,000</option>
                                                    <option value="400,001-500,000">400,001 - 500,000</option>
                                                </select>
                                            </div>

                                            {/* Mother */}
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Mother’s Full Name <span className="text-red-500">*</span></label>
                                                <input type="text" placeholder="Your answer"
                                                    className="input-primary" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Mother’s Occupation <span className="text-red-500">*</span></label>
                                                <input type="text" placeholder="Your answer"
                                                    className="input-primary" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Mother’s Gross Monthly Income <span className="text-red-500">*</span></label>
                                                <input type="number" placeholder="Your answer"
                                                    className="input-primary" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Mother’s Gross Yearly Income <span className="text-red-500">*</span></label>
                                                <select className="input-primary">
                                                    <option value="">Choose</option>
                                                    <option value="0-70,000">0 - 70,000</option>
                                                    <option value="70,001-136,000">70,001 - 136,000</option>
                                                    <option value="136,001-202,000">136,001 - 202,000</option>
                                                    <option value="202,001-268,000">202,001 - 268,000</option>
                                                    <option value="268,001-334,000">268,001 - 334,000</option>
                                                    <option value="334,001-400,000">334,001 - 400,000</option>
                                                    <option value="400,001-500,000">400,001 - 500,000</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* === Guardian Information === */}
                                    <div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Guardian’s Full Name or N/A <span className="text-red-500">*</span></label>
                                                <input type="text" placeholder="Your answer"
                                                    className="input-primary" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Guardian’s Occupation or N/A <span className="text-red-500">*</span></label>
                                                <input type="text" placeholder="Your answer"
                                                    className="input-primary" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Guardian’s Gross Monthly Income or N/A <span className="text-red-500">*</span></label>
                                                <input type="number" placeholder="Your answer"
                                                    className="input-primary" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* === Academic Performance === */}
                                    <div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">General Weighted Average (GWA) of 1st Semester Grade 11 <span className="text-red-500">*</span></label>
                                                <input type="number" placeholder="Value (80-100)" className="input-primary" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">General Weighted Average (GWA) of 2nd Semester Grade 11 <span className="text-red-500">*</span></label>
                                                <input type="number" placeholder="Value (80-100)" className="input-primary" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">General Weighted Average (GWA) of 1st Semester Grade 12 <span className="text-red-500">*</span></label>
                                                <input type="number" placeholder="Value (80-100)" className="input-primary" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* === Required Documents === */}
                                    <div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {[
                                                "Grades/Report Card of 1st Semester in Grade 11",
                                                "Grades/Report Card of 2nd Semester in Grade 11",
                                                "Grades/Report Card of 1st Semester in Grade 12",
                                                "Birth Certificate",
                                            ].map((label, idx) => (
                                                <div key={idx}>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        {label} <span className="text-red-500">*</span>
                                                    </label>
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">NOTE: Whole page is readable and please do not crop!</p>
                                                    <input
                                                        type="file"
                                                        accept="application/pdf"
                                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm
                                                            file:mr-3 file:rounded-md file:border-0 file:bg-[#1e3c73] file:px-3 file:py-1.5
                                                            file:text-sm file:font-medium file:text-white
                                                            hover:file:bg-[#25468a]
                                                            focus:border-blue-500 focus:ring focus:ring-blue-200
                                                            dark:border-zinc-700 dark:bg-zinc-900 dark:file:bg-[#1e3c73] dark:hover:file:bg-[#25468a]"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* === Proof of Income === */}
                                    <div>
                                        <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                            Proof of Income  (any 1 of the following)  <span className="text-red-500">*</span>
                                        </h3>
                                        <ul className="mb-2 list-disc pl-5 text-xs text-zinc-600 dark:text-zinc-400">
                                            <li>Latest ITR of parents or guardian if employed</li>
                                            <li>Certificate of Tax Exemption/Non-Filer issued by BIR</li>
                                            <li>Certified true copy of latest contract or proof of income (for children of Overseas Filipino Workers and Seafarers)</li>
                                            <li>Social Case Study Report issued by CSWD/MSWD</li>
                                        </ul>
                                        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                                            NOTE: Whole page is readable and please do not crop!
                                        </p>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm
                                                file:mr-3 file:rounded-md file:border-0 file:bg-[#1e3c73] file:px-3 file:py-1.5 
                                                file:text-sm file:font-medium file:text-white 
                                                hover:file:bg-[#25468a] 
                                                focus:border-blue-500 focus:ring focus:ring-blue-200 
                                                dark:border-zinc-700 dark:bg-zinc-900 dark:file:bg-[#1e3c73] dark:hover:file:bg-[#25468a]"
                                        />
                                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Upload 1 supported PDF file. Max 10 MB.</p>
                                    </div>

                                    {/* === Special Group === */}
                                    <div>
                                        <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                            Check if the applicant belongs to a Special Group{" "}
                                            <span className="text-red-500">*</span>
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
                                            {/* Left column */}
                                            <div className="space-y-2">
                                                {[
                                                    "Person With Disability (PWD)",
                                                    "Solo Parent",
                                                    "Dependent Solo Parent",
                                                    "Underprivileged  and Homeless Citizens",
                                                    "Magna Carta for the Poor",
                                                ].map((option, idx) => (
                                                    <label key={idx} className="flex items-center gap-2">
                                                        <input type="checkbox" className="h-4 w-4" />
                                                        {option}
                                                    </label>
                                                ))}
                                            </div>

                                            {/* Right column */}
                                            <div className="space-y-2">
                                                {[

                                                    "First Generation Students (first in the family to attend college or university)",
                                                    "Student Senior Citizen",
                                                    "Indigenous People (IP)",
                                                    "N/A", // always last in the right column
                                                ].map((option, idx) => (
                                                    <label key={idx} className="flex items-center gap-2">
                                                        <input type="checkbox" className="h-4 w-4" />
                                                        {option}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>


                                    {/* === Proof of Special Group & Certificate of Guardianship === */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {/* === Proof of Special Group === */}
                                        <div>
                                            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                                Proof of Special Group
                                            </h3>
                                            <ul className="mb-2 list-disc pl-5 text-xs text-zinc-600 dark:text-zinc-400">
                                                <li>PWD ID</li>
                                                <li>Solo parent ID</li>
                                                <li>Student Senior Citizen ID</li>
                                                <li>NCIP Certification</li>
                                                <li>Underprivileged and Homeless Citizens Certification issued by DHSUD or C/MSWD</li>
                                                <li>
                                                    Social Case Study Report issued by C/MSWD covered under Magna Carta for the Poor and/or First Generation Students
                                                </li>
                                            </ul>
                                            <p className="text-xs text-justify text-zinc-500 dark:text-zinc-400">
                                                Additional five (5) points in the total score are given to applicants belonging
                                                to the special group of persons such as the Underprivileged and Homeless Citizens
                                                under Republic Act (RA) No. 7279, Persons with Disability (PWD) under RA No. 7277
                                                as amended, Solo Parents and/or their Dependents under RA 8972, Senior Citizens
                                                under RA 9994, and Indigenous Peoples under RA 8371, after complying with all the
                                                requirements herein set forth.
                                            </p>
                                            <p className="mb-2 mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                                                NOTE: Upload 1 supported file: PDF. Max 10 MB.
                                            </p>
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm
                                                    file:mr-3 file:rounded-md file:border-0 file:bg-[#1e3c73] file:px-3 file:py-1.5 
                                                    file:text-sm file:font-medium file:text-white 
                                                    hover:file:bg-[#25468a] 
                                                    focus:border-blue-500 focus:ring focus:ring-blue-200 
                                                    dark:border-zinc-700 dark:bg-zinc-900 dark:file:bg-[#1e3c73] dark:hover:file:bg-[#25468a]"
                                            />
                                        </div>

                                        {/* === Certificate of Guardianship === */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">
                                                Notarized Certificate of Guardianship, issued by the legal
                                                guardian of the student applicant, if applicable.
                                            </label>
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
                                                    file:mr-3 file:rounded-md file:border-0 file:bg-[#1e3c73] file:px-3 file:py-1.5 
                                                    file:text-sm file:font-medium file:text-white 
                                                    hover:file:bg-[#25468a] 
                                                    focus:border-blue-500 focus:ring focus:ring-blue-200 
                                                    dark:border-zinc-700 dark:bg-zinc-900 dark:file:bg-[#1e3c73] dark:hover:file:bg-[#25468a]"
                                            />
                                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                Upload 1 supported file: PDF. Max 10 MB.
                                            </p>
                                        </div>
                                    </div>




                                </CardContent>
                            </Card>
                        </section>

                        {/* === Certification & Data Privacy Consent === */}
                        <section className="w-full">
                            <Card className="rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">


                                <CardContent className="space-y-6 text-sm text-zinc-700 dark:text-zinc-300">
                                    {/* Ranking Info */}
                                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm 
                dark:border-amber-900 dark:bg-amber-950/30">
                                        <p className="mb-2 text-amber-900 dark:text-amber-200">
                                            The ranking shall be used by selecting the most qualified applicants based on
                                            the requirements. The ranking shall be made according to the following
                                            percentage distribution:
                                        </p>
                                        <ul className="ml-4 list-disc space-y-1 text-amber-800 dark:text-amber-300">
                                            <li>
                                                Academic Performance – <span className="font-semibold">70%</span>
                                            </li>
                                            <li>
                                                Annual Gross Income – <span className="font-semibold">30%</span>
                                            </li>
                                            <li>
                                                TOTAL – <span className="font-semibold">100%</span>
                                            </li>
                                        </ul>
                                        <p className="mt-2 font-medium text-amber-900 dark:text-amber-200">
                                            Good luck and God bless!
                                        </p>
                                    </div>


                                    {/* Certification & Consent */}
                                    <div>
                                        <p className="mb-3 text-justify text-sm leading-relaxed">
                                            I hereby certify that the foregoing statements are true and correct. Any
                                            misinformation or withholding of information will automatically disqualify me
                                            from the CHED Scholarship Program. I am willing to refund the financial
                                            benefits received if such information is discovered after acceptance of the
                                            award.
                                        </p>
                                        <p className="mb-3 text-justify text-sm leading-relaxed">
                                            I hereby express my consent for the Commission on Higher Education to collect,
                                            record, organize, update or modify, retrieve, consult, use, consolidate, block,
                                            erase, or destruct my personal data as part of my information. I hereby affirm
                                            my right to be informed, object to processing, access and rectify, suspend or
                                            withdraw my personal data and be indemnified in case of damages pursuant to the
                                            provisions of the Republic Act No. 10173 of the Philippines, Data Privacy Act
                                            of 2012 and its corresponding Implementing Rules and Regulations.
                                        </p>

                                        {/* Checkbox */}
                                        <label className="flex items-center gap-2 text-sm font-medium">
                                            <input type="checkbox" className="h-4 w-4" /> Yes <span className="text-red-500">*</span>
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* === Submit Button Section === */}
                        <section className="w-full">
                            <div className="flex justify-center pt-6">
                                <Button
                                    type="submit"
                                    disabled={incoming === "no" || incoming === null}
                                    className="w-full max-w-xs rounded-lg bg-[#1e3c73] px-6 py-2 text-sm font-medium text-white shadow-sm
                                        hover:bg-[#25468a] focus:outline-none focus:ring-2 focus:ring-[#1e3c73] 
                                        disabled:cursor-not-allowed disabled:opacity-50
                                        dark:bg-[#1e3c73] dark:hover:bg-[#25468a] dark:focus:ring-[#1e3c73]"
                                >
                                    Submit Application
                                </Button>
                            </div>
                        </section>


                    </main>
                </div>

                <div className="hidden h-14.5 lg:block"></div>
            </div>

            <BackToTopButton />
        </>
    );
}
