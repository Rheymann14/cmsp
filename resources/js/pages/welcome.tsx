// resources/js/Pages/welcome.tsx
import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun, ChevronDown, X, ChevronDownIcon, FileText, ShieldCheck, CheckCircle2, FileClock, Search, School, BookOpen, MapPin, Copy, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusCard from '@/components/StatusCard';


import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp";
import { router } from '@inertiajs/react'; import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import Confetti from "react-confetti";
import { Checkbox } from "@/components/ui/checkbox";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
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
import { differenceInCalendarDays, format, parseISO } from "date-fns";

type AyDeadline = {
    id: number;
    academic_year: string;
    deadline: string; // comes as YYYY-MM-DD from backend
    is_enabled: boolean;
};

type TrackData = {
    tracking_no: string;
    submitted_at: string | null;
    incoming: boolean;
    latest_validation: {
        document_status: string | null;
    } | null;
    application_status: {
        key: 'submitted' | 'under_review';
        label: string;
    };
    applicant: {
        name: string | null;
        birthdate: string | null;
        sex: "male" | "female" | string;
        ethnicity?: string | null;
        religion?: string | null;
    };
    academic: {
        academic_year: string | null;
        deadline: string | null;
        school: { name: string | null; type: string | null };
        course: string | null;
        year_level: string | null;
        gad_stufaps_course?: string | null;
        gwa?: { g12_s1?: number; g12_s2?: number };
    };
    address: {
        scope: "Region XII" | "BARMM" | string;
        province?: string | null;
        municipality?: string | null;
        barangay?: string | null;
        purok_street?: string | null;
        zip_code?: string | null;
        district?: string | null;
    };
    files: Record<string, boolean>;
};

const resolveTrackingFromFlash = (flash: SharedData['flash'] | undefined): string | null => {
    if (!flash) return null;

    if (typeof flash.trackingNo === 'string' && flash.trackingNo.trim()) {
        return flash.trackingNo;
    }

    const legacyTracking = (flash as Record<string, unknown>).tracking_no;

    if (typeof legacyTracking === 'string' && legacyTracking.trim()) {
        return legacyTracking;
    }

    return null;
};

type ApplicationInfoCardProps = {
    ayDeadline: AyDeadline | null | undefined;
    formattedDeadline: string;
    onTrackClick: () => void;
};

const ApplicationInfoCard = ({ ayDeadline, formattedDeadline, onTrackClick }: ApplicationInfoCardProps) => (
    <Card className="rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800/70 dark:bg-zinc-950/40">
        <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
                <Badge
                    variant="outline"
                    className="rounded-full border-green-200 bg-green-50 text-xs text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300"
                >
                    Call for Application
                </Badge>
                {ayDeadline && (
                    <Badge
                        variant="outline"
                        className="rounded-full border-blue-200 bg-blue-50 text-xs text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300"
                    >
                        AY {ayDeadline.academic_year}
                    </Badge>
                )}
            </div>

            {/* row: logos/title at left, track button at right (wraps on mobile) */}
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {/* left cluster */}
                <div className="flex items-center gap-0">
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

                {/* right: compact track section */}
                <div className="sm:ml-4 flex flex-col items-end">
                    <motion.div
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-50 via-white to-blue-100 dark:from-[#1e293b] dark:via-[#0a0a0a] dark:to-[#1e293b] rounded-xl px-3 py-2 shadow-sm border border-blue-100 dark:border-zinc-800"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                        }}
                        onClick={onTrackClick}
                    >
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                            Already applied? <strong>Click here!</strong>
                        </span>
                        <Button
                            className="h-8 px-3 text-xs font-semibold rounded-full bg-gradient-to-r from-[#1e3c73] to-[#25468a] hover:from-[#25468a] hover:to-[#1e3c73] text-white shadow transition-all duration-200"
                            onClick={onTrackClick}
                            aria-label="Track Application Status"
                        >
                            <FileClock className="mr-1 h-4 w-4" />
                            Track your Application Status
                        </Button>
                    </motion.div>
                </div>
            </div>
        </CardHeader>

        <CardContent className="space-y-4 text-[13px] leading-relaxed text-zinc-800 dark:text-zinc-200">
            <p className="text-justify">
                CHED Merit Scholarship Program (CMSP) Application of CHED Regional Office 12 for the Academic Year {ayDeadline?.academic_year}.
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
                            {ayDeadline && (
                                <Badge
                                    variant="outline"
                                    className="rounded-full border-amber-300 bg-amber-100/80 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                >
                                    Deadline: {formattedDeadline}
                                </Badge>
                            )}

                            <span className="text-[12px] text-zinc-600 dark:text-zinc-400">
                                Late submissions will not be entertained.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <p className="pt-1 text-[12px] text-zinc-500 dark:text-zinc-400">Thank you!</p>
        </CardContent>
    </Card>
);

const TRACKING_RAW_REGEX = /^[A-Z0-9]{5}\d{4}$/;

type WelcomePageProps = {
    auth: SharedData['auth'];
    ayDeadline: AyDeadline;
    flash?: {
        trackingNo?: string | null;
        tracking_no?: string | null;
        success?: string;
    };
};

const normalizeTrackingInput = (value: string) => {
    const up = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const left = up.slice(0, 5);
    const right = up.slice(5).replace(/\D/g, "");
    return (left + right.slice(0, 4)).slice(0, 9);
};

const isValidTrackingRaw = (raw: string) => TRACKING_RAW_REGEX.test(raw);

const toHyphenatedTracking = (raw: string) =>
    raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5, 9)}` : raw;


export default function Welcome() {

    const { auth, ayDeadline, flash } = usePage<WelcomePageProps>().props;
    const isApplicationOpen = ayDeadline?.is_enabled ?? true;
    const formattedDeadline = ayDeadline
        ? new Date(ayDeadline.deadline).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "";

    const deadlineDate = useMemo(() => {
        if (!ayDeadline?.deadline) return null;
        try {
            return parseISO(ayDeadline.deadline);
        } catch {
            return null;
        }
    }, [ayDeadline?.deadline]);

    const daysRemaining = useMemo(() => {
        if (!deadlineDate) return null;
        return differenceInCalendarDays(deadlineDate, new Date());
    }, [deadlineDate]);

    const isDeadlinePast = typeof daysRemaining === "number" && daysRemaining < 0;
    const isDeadlineToday = daysRemaining === 0;
    const friendlyDeadline = deadlineDate ? format(deadlineDate, "MMMM d, yyyy") : formattedDeadline;

    const deadlineStatusLabel = useMemo(() => {
        if (daysRemaining == null) return null;
        if (isDeadlinePast) {
            const daysAgo = Math.abs(daysRemaining);
            return daysAgo === 0
                ? "Deadline just passed"
                : `Closed ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`;
        }
        if (isDeadlineToday) {
            return "Deadline is today";
        }
        if (daysRemaining === 1) {
            return "1 day left to apply";
        }
        return `${daysRemaining} days left to apply`;
    }, [daysRemaining, isDeadlinePast, isDeadlineToday]);
    const closedWindowLabel = ayDeadline?.academic_year
        ? `Academic Year ${ayDeadline.academic_year}`
        : formattedDeadline
            ? `the deadline of ${formattedDeadline}`
            : "this cycle";

    const { appearance, updateAppearance } = useAppearance();
    const isDark = appearance === 'dark';
    const appFormRef = useRef<HTMLInputElement | null>(null);
    const [hasAppForm, setHasAppForm] = useState(false);

    const initialTracking = resolveTrackingFromFlash(flash);

    const [successOpen, setSuccessOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"form" | "req">("form");
    const [generatedTrackingNo, setGeneratedTrackingNo] = useState<string | null>(initialTracking);
    const lastHandledTrackingRef = useRef<string | null>(initialTracking);

    const [trackOpen, setTrackOpen] = useState(false);
    const [trackingCode, setTrackingCode] = useState("");
    const [loadingTrack, setLoadingTrack] = useState(false);
    const [trackResult, setTrackResult] = useState<TrackData | null>(null);
    const [trackError, setTrackError] = useState<string | null>(null);


    const handleCheckStatus = async () => {
        const normalized = normalizeTrackingInput(trackingCode);

        if (!isValidTrackingRaw(normalized)) {
            setTrackError("Please enter a valid tracking number, e.g., ABCDE-1234.");
            setTrackResult(null);
            return;
        }

        if (normalized !== trackingCode) {
            setTrackingCode(normalized);
        }

        const formatted = toHyphenatedTracking(normalized);
        try {
            setLoadingTrack(true);
            setTrackError(null);
            setTrackResult(null);

            const res = await fetch(`/cmsp/track/${formatted}`, {
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            });

            if (!res.ok) {
                let errorMessage: string | null = null;

                try {
                    const errorBody = await res.json();
                    errorMessage =
                        errorBody?.message ??
                        errorBody?.errors?.tracking_no?.[0] ??
                        errorBody?.errors?.trackingNo?.[0] ??
                        null;
                } catch (parseError) {
                    errorMessage = null;
                }

                if (!errorMessage) {
                    errorMessage = res.status === 404
                        ? "Tracking number not found."
                        : "Unable to fetch status. Please try again.";
                }

                setTrackError(errorMessage);
                return;
            }

            const json = await res.json(); // { data: ... }
            setTrackResult(json.data as TrackData);
        } catch (e) {
            setTrackError("Network error. Please try again.");
        } finally {
            setLoadingTrack(false);
        }
    };

    const handleSuccessOpenChange = (open: boolean) => {
        setSuccessOpen(open);
        if (!open) {
            setGeneratedTrackingNo(null);
            setActiveTab("req");
            lastHandledTrackingRef.current = null;
        }
    };

    const handleCopyTracking = async () => {
        if (!generatedTrackingNo) return;
        try {
            await navigator.clipboard.writeText(generatedTrackingNo);
            toast.success('Tracking number copied to clipboard.');
        } catch (error) {
            console.error('Clipboard copy failed', error);
            toast.error('Unable to copy the tracking number. Please copy it manually.');
        }
    };



    // focus the first OTP cell when dialog opens
    useEffect(() => {
        if (!trackOpen) return;
        const t = setTimeout(() => {
            document.querySelector<HTMLInputElement>('[data-input-otp] input')?.focus();
        }, 50);
        return () => clearTimeout(t);
    }, [trackOpen]);

    const flashTrackingNo = useMemo(() => resolveTrackingFromFlash(flash), [flash]);

    useEffect(() => {
        if (flashTrackingNo && flashTrackingNo !== lastHandledTrackingRef.current) {
            lastHandledTrackingRef.current = flashTrackingNo;
            setGeneratedTrackingNo(flashTrackingNo);
            setSuccessOpen(true);
            const successMessage =
                typeof flash?.success === 'string'
                    ? flash.success
                    : 'Application submitted successfully!';
            toast.success(successMessage, { id: 'cmsp-submit' });
        } else if (!flashTrackingNo) {
            lastHandledTrackingRef.current = null;
        }
    }, [flashTrackingNo, flash?.success]);


    // confetti viewport size
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    // control confetti run
    const [showConfetti, setShowConfetti] = useState(false);

    // keep canvas sized to window
    useEffect(() => {
        const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
        onResize();
        window.addEventListener("resize", onResize, { passive: true });
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // trigger confetti whenever the success dialog opens
    useEffect(() => {
        if (successOpen) {
            setShowConfetti(true);
            const t = setTimeout(() => setShowConfetti(false), 5000); // confetti for 5s
            return () => clearTimeout(t);
        } else {
            setShowConfetti(false);
        }
    }, [successOpen]);

    const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [hasFileMap, setHasFileMap] = useState<Record<string, boolean>>({});

    const proofIncomeRef = useRef<HTMLInputElement | null>(null);
    const [hasProofIncome, setHasProofIncome] = useState(false);

    const proofSpecialRef = useRef<HTMLInputElement | null>(null);
    const [hasProofSpecial, setHasProofSpecial] = useState(false);

    const [fatherNA, setFatherNA] = useState(false);
    const [fatherDeceased, setFatherDeceased] = useState(false);
    const [motherNA, setMotherNA] = useState(false);
    const [motherDeceased, setMotherDeceased] = useState(false);

    const fatherFieldsDisabled = fatherNA;
    const motherFieldsDisabled = motherNA;
    const fatherUnavailable = fatherNA || fatherDeceased;
    const motherUnavailable = motherNA || motherDeceased;
    const showGuardian = fatherUnavailable && motherUnavailable;

    // refs to clear uncontrolled inputs
    const fatherNameRef = useRef<HTMLInputElement>(null);
    const fatherOccRef = useRef<HTMLInputElement>(null);
    const fatherMonthlyRef = useRef<HTMLInputElement>(null);

    const motherNameRef = useRef<HTMLInputElement>(null);
    const motherOccRef = useRef<HTMLInputElement>(null);
    const motherMonthlyRef = useRef<HTMLInputElement>(null);

    // helpers
    const clearFatherInputs = () => {
        if (fatherNameRef.current) fatherNameRef.current.value = "";
        if (fatherOccRef.current) fatherOccRef.current.value = "";
        if (fatherMonthlyRef.current) fatherMonthlyRef.current.value = "";
        setFatherMonthly(""); // you already have this state
    };
    const clearMotherInputs = () => {
        if (motherNameRef.current) motherNameRef.current.value = "";
        if (motherOccRef.current) motherOccRef.current.value = "";
        if (motherMonthlyRef.current) motherMonthlyRef.current.value = "";
        setMotherMonthly(""); // you already have this state
    };

    // effects: clear only when N/A is turned on
    useEffect(() => { if (fatherNA) clearFatherInputs(); }, [fatherNA]);
    useEffect(() => { if (motherNA) clearMotherInputs(); }, [motherNA]);



    // Father N/A
    const onFatherNAChange = (v: boolean | 'indeterminate') => {
        const val = v === true;
        setFatherNA(val);
        if (val) {
            setFatherDeceased(false);
            // clear inputs when N/A is turned on
            if (fatherNameRef.current) fatherNameRef.current.value = '';
            if (fatherOccRef.current) fatherOccRef.current.value = '';
            if (fatherMonthlyRef.current) fatherMonthlyRef.current.value = '';
            setFatherMonthly('');

            // persist draft
            persistDraft('father_na', val ? 1 : 0);
            persistDraft('father_deceased', 0);
            persistDraft('father_name', '');
            persistDraft('father_occupation', '');
            persistDraft('father_income_monthly', '');
            persistDraft('father_income_yearly_bracket', '');
        } else {
            persistDraft('father_na', 0);
        }
    };

    // Father Deceased
    const onFatherDeceasedChange = (v: boolean | 'indeterminate') => {
        const val = v === true;
        setFatherDeceased(val);
        if (val) setFatherNA(false);

        // persist draft (keep existing values when Deceased)
        persistDraft('father_deceased', val ? 1 : 0);
        if (val) persistDraft('father_na', 0);
    };

    // Mother N/A
    const onMotherNAChange = (v: boolean | 'indeterminate') => {
        const val = v === true;
        setMotherNA(val);
        if (val) {
            setMotherDeceased(false);
            if (motherNameRef.current) motherNameRef.current.value = '';
            if (motherOccRef.current) motherOccRef.current.value = '';
            if (motherMonthlyRef.current) motherMonthlyRef.current.value = '';
            setMotherMonthly('');
            persistDraft('mother_na', val ? 1 : 0);
            persistDraft('mother_deceased', 0);
            persistDraft('mother_name', '');
            persistDraft('mother_occupation', '');
            persistDraft('mother_income_monthly', '');
            persistDraft('mother_income_yearly_bracket', '');
        } else {
            persistDraft('mother_na', 0);
        }
    };

    // Mother Deceased
    const onMotherDeceasedChange = (v: boolean | 'indeterminate') => {
        const val = v === true;
        setMotherDeceased(val);
        if (val) setMotherNA(false);
        persistDraft('mother_deceased', val ? 1 : 0);
        if (val) persistDraft('mother_na', 0);
    };


    const guardianshipRef = useRef<HTMLInputElement | null>(null);
    const [hasGuardianship, setHasGuardianship] = useState(false);

    const [naSelected, setNaSelected] = useState(false);

    // === error highlighting helpers ===
    const INVALID_CLASS =
        "ring-2 ring-red-500/40 border-red-500 focus:ring-red-300 focus:border-red-500";
    const GROUP_INVALID_CLASS =
        "ring-2 ring-red-500/40 border border-red-500 rounded-md";

    const cssEscape = (v: string) =>
        (window as any).CSS?.escape ? (window as any).CSS.escape(v) : v.replace(/"/g, '\\"');

    const formEl = () =>
        document.getElementById("cmspForm") as HTMLFormElement | null;

    const clearInvalidMarks = () => {
        const f = formEl();
        if (!f) return;
        // remove on regular controls
        f.querySelectorAll<HTMLElement>("[data-invalid='true']").forEach((el) => {
            el.dataset.invalid = "false";
            el.classList.remove(...INVALID_CLASS.split(" "));
            el.classList.remove(...GROUP_INVALID_CLASS.split(" "));
            el.removeAttribute("aria-invalid");
            el.removeAttribute("title");
        });
    };

    const findTargetEl = (name: string): HTMLElement | null => {
        const f = formEl();
        if (!f) return null;

        // 1) try exact name match (works for single inputs, files, hiddens, etc.)
        let el = f.querySelector<HTMLElement>(`[name="${cssEscape(name)}"]`);
        if (el) {
            // radio/checkbox groups should highlight the group container instead
            const input = el as HTMLInputElement;
            if (input.type === "radio" || input.type === "checkbox") {
                const group = f.querySelector<HTMLElement>(`[data-group="${cssEscape(name)}"]`);
                if (group) return group;
            }
            return el;
        }

        // 2) try data-field="[name]" (for custom selects/buttons/popovers)
        el = f.querySelector<HTMLElement>(`[data-field="${cssEscape(name)}"]`);
        if (el) return el;

        // 3) try group container by name (explicit)
        el = f.querySelector<HTMLElement>(`[data-group="${cssEscape(name)}"]`);
        if (el) return el;

        return null;
    };

    const markInvalid = (name: string, message?: string) => {
        const el = findTargetEl(name);
        if (!el) return;
        el.dataset.invalid = "true";
        el.setAttribute("aria-invalid", "true");
        if (message) el.setAttribute("title", message);

        // choose class based on element kind
        const isGroup = el.hasAttribute("data-group");
        el.classList.add(...(isGroup ? GROUP_INVALID_CLASS : INVALID_CLASS).split(" "));
    };

    const scrollToFirstError = () => {
        const f = formEl();
        if (!f) return;
        const first = f.querySelector<HTMLElement>("[data-invalid='true']");
        if (first) {
            first.scrollIntoView({ behavior: "smooth", block: "center" });
            (first as HTMLElement).focus?.();
        }
    };

    // Build a quick "required but empty" map using FormData
    const buildClientRequiredErrors = (fd: FormData, region: string) => {
        // keep base rules
        const BASE_REQUIRED = [
            "incoming",
            "lrn",
            "email",
            "contact_number",
            "last_name",
            "first_name",
            "middle_name",
            "birthdate",
            "sex",


            "ethnicity",
            "religion",
            // address fields are added per region below
            "intended_school",
            "school_type",
            "year_level",
            "course",
            "shs_name",
            "shs_address",
            "shs_school_type",

            "gwa_g12_s1",
            "gwa_g12_s2",
            "special_groups[]",
            "consent",
            // files
            "application_form",
            "grades_g12_s1",
            "grades_g12_s2",
            "birth_certificate",
            "proof_of_income",
        ] as const;

        const REGION_XII_REQUIRED = [
            "province_municipality",
            "barangay",
            "purok_street",
            "zip_code",
            "district",
        ] as const;

        const BARMM_REQUIRED = [
            "barmm_province",
            "barmm_municipality",
            "barmm_barangay",
            "barmm_purok_street",
            "barmm_zip_code",
        ] as const;

        const fatherFieldsDisabled = fd.get("father_na") === "1";
        const motherFieldsDisabled = fd.get("mother_na") === "1";
        const fatherUnavailable = fatherFieldsDisabled || (fd.get("father_deceased") === "1");
        const motherUnavailable = motherFieldsDisabled || (fd.get("mother_deceased") === "1");
        const showGuardian = fatherUnavailable && motherUnavailable;

        const FATHER_REQUIRED = [
            "father_name",
            "father_occupation",
            "father_income_monthly",
            "father_income_yearly_bracket",
        ] as const;

        const MOTHER_REQUIRED = [
            "mother_name",
            "mother_occupation",
            "mother_income_monthly",
            "mother_income_yearly_bracket",
        ] as const;

        const GUARDIAN_REQUIRED = [
            "guardian_name",
            "guardian_occupation",
            "guardian_income_monthly",
        ] as const;

        const REQUIRED = [
            ...BASE_REQUIRED,
            ...(region === "Region XII" ? REGION_XII_REQUIRED : []),
            ...(region === "BARMM" ? BARMM_REQUIRED : []),
            ...(!fatherFieldsDisabled ? FATHER_REQUIRED : []),
            ...(!motherFieldsDisabled ? MOTHER_REQUIRED : []),
            ...(showGuardian ? GUARDIAN_REQUIRED : []),
        ] as const;

        const errs: Record<string, string> = {};

        for (const name of REQUIRED) {
            if (name.endsWith("[]")) {
                const vals = fd.getAll(name);
                if (!vals.length) errs[name] = "This field is required.";
                continue;
            }
            const val = fd.get(name);
            if (val instanceof File) {
                if (!val || val.size === 0) errs[name] = "Please upload a PDF.";
            } else {
                const s = (val ?? "").toString().trim();
                if (!s) errs[name] = "This field is required.";
            }
        }

        const sexVal = String(fd.get("sex") ?? "").toLowerCase();
        if (sexVal === "female") {
            const mv = (fd.get("maiden_name") ?? "").toString().trim();
            if (!mv) errs["maiden_name"] = "This field is required.";
        }

        return errs;
    };


    const highlightInvalidFields = (errorMap: Record<string, string>) => {
        clearInvalidMarks();
        Object.entries(errorMap).forEach(([name, msg]) => markInvalid(name, msg));
        scrollToFirstError();
    };


    // --- PERSIST DRAFT (all non-file fields) ---
    const STORAGE_KEY = 'cmspFormDraft';
    const draftRef = useRef<Record<string, any>>({});

    const loadDraft = (): Record<string, any> => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    };

    const persistDraft = (name: string, value: any) => {
        draftRef.current = { ...draftRef.current, [name]: value };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draftRef.current));
        } catch { }
    };

    // Apply saved values to the DOM inputs that are NOT controlled by React
    const applyDraftToForm = (data: Record<string, any>) => {
        const form = document.getElementById('cmspForm') as HTMLFormElement | null;
        if (!form) return;

        Object.entries(data).forEach(([name, value]) => {
            // Skip files
            const maybeFile = form.querySelector<HTMLInputElement>(`input[type="file"][name="${name}"]`);
            if (maybeFile) return;

            const radios = form.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${name}"]`);
            const checkboxes = form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${name}"]`);
            const field = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${name}"]`);

            if (checkboxes.length) {
                // ✅ single boolean checkbox (e.g., father_na)
                if (checkboxes.length === 1) {
                    const c = checkboxes[0];
                    const truthy =
                        value === true || value === 1 || value === '1' || value === 'true' || value === 'on';
                    c.checked = !!truthy;
                    return;
                }

                // ✅ multi checkbox (e.g., special_groups[])
                const arr = Array.isArray(value) ? value.map(String) : [String(value)];
                checkboxes.forEach((c) => (c.checked = arr.includes(String(c.value))));
                return;
            }

            if (radios.length) {
                radios.forEach(r => (r.checked = r.value === String(value)));
                return;
            }
            if (checkboxes.length) {
                const arr = Array.isArray(value) ? value.map(String) : [String(value)];
                checkboxes.forEach(c => (c.checked = arr.includes(c.value)));
                return;
            }
            if (field) {
                if (field.tagName === 'SELECT') {
                    const sel = field as HTMLSelectElement;
                    if (sel.multiple && Array.isArray(value)) {
                        Array.from(sel.options).forEach(opt => (opt.selected = value.includes(opt.value)));
                    } else {
                        sel.value = value ?? '';
                    }
                } else {
                    field.value = value ?? '';
                }
            }
        });
    };



    // Toggle for the compact requirements section (shown by default)
    const [showReqs, setShowReqs] = useState(true);
    const [incoming, setIncoming] = useState<string | null>(null);

    // States for dropdowns
    const [nameExt, setNameExt] = useState<string>("");
    const [openNameExt, setOpenNameExt] = useState(false);
    const [nameRegion, setRegion] = useState<string>("");
    const [openRegion, setOpenRegion] = useState(false);

    // --- Ethnicity
    const [ethnicityId, setEthnicityId] = useState<number | null>(null);
    const [ethnicityLabel, setEthnicityLabel] = useState<string>("");
    const [openEthnicity, setOpenEthnicity] = useState(false);
    const [ethnicities, setEthnicities] = useState<{ id: number; label: string }[]>([]);
    const [loadingEthnicities, setLoadingEthnicities] = useState(true);

    // --- Religion
    const [religionId, setReligionId] = useState<number | null>(null);
    const [religionLabel, setReligionLabel] = useState<string>("");
    const [openReligion, setOpenReligion] = useState(false);
    const [religions, setReligions] = useState<{ id: number; label: string }[]>([]);
    const [loadingReligions, setLoadingReligions] = useState(true);

    const [provinceId, setProvinceId] = useState<number | null>(null);
    const [provinceLabel, setProvinceLabel] = useState<string>("");
    const [openProvince, setOpenProvince] = useState(false);
    const [districtId, setDistrictId] = useState<number | null>(null);
    const [districtLabel, setDistrictLabel] = useState<string>("");
    const [openDistrict, setOpenDistrict] = useState(false);
    const [schoolId, setSchoolId] = useState<number | null>(null);
    const [schoolLabel, setSchoolLabel] = useState<string>("");
    const [openSchool, setOpenSchool] = useState(false);
    const [schoolQuery, setSchoolQuery] = useState("");
    const OTHERS_LABEL = "OTHERS";
    const [yearLevel, setYearLevel] = useState<string>("Incoming First Year");
    const [openYearLevel, setOpenYearLevel] = useState(false);
    const [sex, setSex] = useState<'' | 'male' | 'female'>('');
    const [courseId, setCourseId] = useState<number | null>(null);
    const [courseLabel, setCourseLabel] = useState<string>("");
    const [openCourse, setOpenCourse] = useState(false);
    const [locations, setLocations] = useState<{ id: number; label: string }[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(true);

    // --- Parents income helpers ---
    const [fatherMonthly, setFatherMonthly] = useState<string>("");
    const [motherMonthly, setMotherMonthly] = useState<string>("");

    const getYearly = (m: string) => {
        const v = Number((m || "").replace(/\D/g, ""));
        return Number.isFinite(v) ? v * 12 : 0;
    };
    const fmt = (n: number) => n.toLocaleString("en-PH");


    const formLocked = false;

    function clearFile(
        input: HTMLInputElement | null | undefined,
        onCleared?: () => void
    ) {
        if (!input) return;
        // clear the file input
        input.value = "";
        // make sure any listeners update their state
        input.dispatchEvent(new Event("change", { bubbles: true }));
        // optional callback to flip local state (e.g., hasFileMap[name] = false)
        onCleared?.();
        // return focus for accessibility
        input.focus();
    }

    const SPECIAL_GROUP_NAME = 'special_groups[]';



    const enforceSpecialGroupRule = () => {
        const form = document.getElementById('cmspForm') as HTMLFormElement | null;
        if (!form) return;

        const boxes = Array.from(
            form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${SPECIAL_GROUP_NAME}"]`)
        );
        const na = boxes.find((b) => b.value === 'N/A');

        const naChecked = !!na?.checked;
        if (na) na.disabled = false;        // N/A itself always clickable
        boxes.forEach((b) => {              // Others disabled only when N/A is checked
            if (b !== na) b.disabled = naChecked;
        });
    };


    const handleSpecialGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (formLocked) return;
        const form = document.getElementById('cmspForm') as HTMLFormElement | null;
        if (!form) return;

        const boxes = Array.from(
            form.querySelectorAll<HTMLInputElement>(
                `input[type="checkbox"][name="${SPECIAL_GROUP_NAME}"]`
            )
        );
        const na = boxes.find((b) => b.value === 'N/A');
        const clicked = e.currentTarget;

        if (clicked === na && clicked.checked) {
            // N/A picked -> uncheck + disable all others, disable proof uploader
            boxes.forEach((b) => {
                if (b !== na) {
                    b.checked = false;
                    b.disabled = true;
                }
            });

        } else {
            // Any other selection -> ensure N/A is off, enable others + proof uploader
            if (na) na.checked = false;
            boxes.forEach((b) => {
                if (b !== na) b.disabled = false;
            });

        }

        // Persist after enforcing the rule
        const selected = boxes.filter((b) => b.checked).map((b) => b.value);
        persistDraft(SPECIAL_GROUP_NAME, selected);
        setNaSelected(selected.includes("N/A"));
    };

    useEffect(() => {
        if (naSelected && proofSpecialRef.current) {
            proofSpecialRef.current.value = "";
            if (hasProofSpecial) setHasProofSpecial(false);
        }
    }, [naSelected, hasProofSpecial]);


    useEffect(() => {
        const onScroll = () => setOpen(false);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

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
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    useEffect(() => {
        if (!provinceId) {
            setDistricts([]);
            setLoadingDistricts(false);
            return;
        }

        setLoadingDistricts(true);

        fetch(`/api/districts?location_id=${provinceId}`, {
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest", // 👈 tell Laravel it's AJAX
            },
        })
            .then((res) => res.json())
            .then((data) => setDistricts(data.data ?? []))
            .catch(() => setDistricts([]))
            .finally(() => setLoadingDistricts(false));
    }, [provinceId]);

    useEffect(() => {
        if (!districtId) return;

        const exists = districts.some((d) => d.id === districtId);
        if (!exists) {
            setDistrictId(null);
            setDistrictLabel("");
            persistDraft("district", "");
            persistDraft("district_label", "");
        }
    }, [districts, districtId]);

    useEffect(() => {
        if (districtId || districts.length !== 1) return;

        const only = districts[0];
        setDistrictId(only.id);
        setDistrictLabel(only.label);
        persistDraft("district", String(only.id));
        persistDraft("district_label", only.label);
    }, [districts, districtId]);


    const [schools, setSchools] = useState<{ id: number; label: string }[]>([]);
    const [loadingSchools, setLoadingSchools] = useState(true);
    const [showDeadlineBanner, setShowDeadlineBanner] = useState(true);


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

    // Ethnicities
    useEffect(() => {
        fetch("/api/ethnicities", {
            headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
        })
            .then((res) => res.json())
            .then((data) => setEthnicities(data.data || []))
            .catch(() => setEthnicities([]))
            .finally(() => setLoadingEthnicities(false));
    }, []);

    // Religions
    useEffect(() => {
        fetch("/api/religions", {
            headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
        })
            .then((res) => res.json())
            .then((data) => setReligions(data.data || []))
            .catch(() => setReligions([]))
            .finally(() => setLoadingReligions(false));
    }, []);


    const sortedSchools = useMemo(() => {
        return [...schools].sort((a, b) => {
            const aIsOthers = a.label?.trim().toLowerCase() === "others";
            const bIsOthers = b.label?.trim().toLowerCase() === "others";
            if (aIsOthers && !bIsOthers) return 1;
            if (!aIsOthers && bIsOthers) return -1;
            return (a.label || "").localeCompare(b.label || "");
        });
    }, [schools]);

    const othersId = useMemo(
        () => schools.find(s => s.label?.trim().toLowerCase() === "others")?.id ?? null,
        [schools]
    );

    const isOthersSelected = useMemo(() => {
        const byId = othersId !== null && schoolId === othersId;
        const byLabel = (schoolLabel || "").trim().toLowerCase() === "others";
        return byId || byLabel;
    }, [othersId, schoolId, schoolLabel]);

    useEffect(() => {
        if (!isOthersSelected) {
            const el = document.querySelector<HTMLInputElement>('[name="other_school"]');
            if (el) {
                el.value = "";
                // fire a change so your draft persister picks it up
                el.dispatchEvent(new Event("change", { bubbles: true }));
            }
        }
    }, [isOthersSelected]);


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

    // Load saved draft on mount (also hydrate your controlled states)
    useEffect(() => {
        const saved = loadDraft();
        draftRef.current = saved;
        const sg = saved[SPECIAL_GROUP_NAME];

        const T = (v: any) =>
            v === true || v === 1 || v === '1' || v === 'true' || v === 'on';

        // if you already have these states in your component
        setFatherNA(T(saved.father_na));
        setFatherDeceased(T(saved.father_deceased));
        setMotherNA(T(saved.mother_na));
        setMotherDeceased(T(saved.mother_deceased));

        if (Array.isArray(sg)) setNaSelected(sg.includes("N/A"));
        if (typeof saved.region === 'string') setRegion(saved.region);
        if (typeof saved.sex === 'string') setSex(saved.sex as 'male' | 'female' | '');
        // hydrate controlled pieces
        if (typeof saved.incoming === 'string') setIncoming(saved.incoming);
        if (typeof saved.name_extension === 'string') setNameExt(saved.name_extension);
        if (typeof saved.ethnicity === "string") {
            const n = Number(saved.ethnicity);
            setEthnicityId(Number.isFinite(n) ? n : null);
        }
        if (typeof saved.ethnicity_label === "string") setEthnicityLabel(saved.ethnicity_label);

        if (typeof saved.religion === "string") {
            const n = Number(saved.religion);
            setReligionId(Number.isFinite(n) ? n : null);
        }
        if (typeof saved.religion_label === "string") setReligionLabel(saved.religion_label);

        if (typeof saved.province_municipality === 'string') {
            const n = Number(saved.province_municipality);
            setProvinceId(Number.isFinite(n) ? n : null);
        }
        if (typeof saved.province_municipality_label === 'string') {
            setProvinceLabel(saved.province_municipality_label);
        }
        if (typeof saved.district === 'string') {
            const n = Number(saved.district);
            setDistrictId(Number.isFinite(n) ? n : null);
        }
        if (typeof saved.district_label === 'string') {
            setDistrictLabel(saved.district_label);
        }
        if (typeof saved.intended_school === 'string') {
            const n = Number(saved.intended_school);
            setSchoolId(Number.isFinite(n) ? n : null);
        }
        if (typeof saved.intended_school_label === 'string') {
            setSchoolLabel(saved.intended_school_label);
        }

        if (typeof saved.year_level === 'string') setYearLevel(saved.year_level);
        if (typeof saved.course === 'string') {
            const n = Number(saved.course);
            setCourseId(Number.isFinite(n) ? n : null);
        }
        if (typeof saved.course_label === 'string') {
            setCourseLabel(saved.course_label);
        }

        if (typeof saved.father_income_monthly === 'string') {
            setFatherMonthly(saved.father_income_monthly);
        }
        if (typeof saved.mother_income_monthly === 'string') {
            setMotherMonthly(saved.mother_income_monthly);
        }


        if (typeof saved.birthdate === 'string') {
            setBirthdate(saved.birthdate);
            if (saved.birthdate) setDate(parseISO(saved.birthdate));
        }

        setTimeout(() => {
            applyDraftToForm(saved);
            enforceSpecialGroupRule();
        }, 0);
    }, []);

    useEffect(() => {
        if (sex === 'female') {
            const form = document.getElementById('cmspForm') as HTMLFormElement | null;
            const saved = draftRef.current || {};
            if (form && typeof saved.maiden_name === 'string') {
                const el = form.querySelector<HTMLInputElement>('[name="maiden_name"]');
                if (el) el.value = saved.maiden_name;
            }
        }
    }, [sex]);


    // Form-level change/input listeners: keep draft updated while the user types
    useEffect(() => {
        const form = document.getElementById('cmspForm') as HTMLFormElement | null;
        if (!form) return;

        const handler = (e: Event) => {
            const t = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
            if (!t || !t.name) return;

            let value: any = '';
            if (t instanceof HTMLInputElement && t.type === 'file') {
                // cannot persist files
                return;
            }
            if (t instanceof HTMLInputElement && t.type === 'checkbox') {
                const all = form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${t.name}"]`);
                value = Array.from(all).filter(cb => cb.checked).map(cb => cb.value);
            } else if (t instanceof HTMLInputElement && t.type === 'radio') {
                const checked = form.querySelector<HTMLInputElement>(`input[type="radio"][name="${t.name}"]:checked`);
                value = checked?.value ?? '';
            } else if (t instanceof HTMLSelectElement && t.multiple) {
                value = Array.from(t.selectedOptions).map(o => o.value);
            } else {
                value = (t as any).value ?? '';
            }

            persistDraft(t.name, value);
        };

        form.addEventListener('input', handler);
        form.addEventListener('change', handler);
        return () => {
            form.removeEventListener('input', handler);
            form.removeEventListener('change', handler);
        };
    }, []);





    // GWA validation (80–100, integers only)
    const GWA_MIN = 80;
    const GWA_MAX = 100;

    const handleGwaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        const toastId = `gwa-${e.target.name}`;

        if (v === '') {
            e.target.setCustomValidity('');
            toast.dismiss(toastId);
            return;
        }

        const n = Number(v);
        const isInt = Number.isInteger(n);
        const inRange = n >= GWA_MIN && n <= GWA_MAX;

        if (!isInt || !inRange) {
            e.target.setCustomValidity(`GWA must be a whole number between ${GWA_MIN} and ${GWA_MAX}.`);
            toast.error(`GWA must be a whole number between ${GWA_MIN} and ${GWA_MAX}.`, { id: toastId });
        } else {
            e.target.setCustomValidity('');
            toast.dismiss(toastId);
        }
    };



    const [open, setOpen] = useState(false)
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [birthdate, setBirthdate] = useState<string>(date ? format(date, "yyyy-MM-dd") : "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    useEffect(() => {
        isSubmittingRef.current = isSubmitting;
    }, [isSubmitting]);

    useEffect(() => {
        const unsubscribe = router.on('exception', (event) => {
            if (!isSubmittingRef.current) {
                return;
            }

            console.error(event.detail.exception);
            toast.error('Something went wrong. Please try again.', { id: 'cmsp-submit' });
            setIsSubmitting(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isSubmitting) {
            return;
        }

        if (!ayDeadline?.academic_year || !ayDeadline?.deadline) {
            toast.error("Missing academic year or deadline. Please reload the page.");
            return;
        }

        const form = e.currentTarget;
        const fd = new FormData(form);

        const deadlineYMD = new Date(ayDeadline.deadline).toLocaleDateString('en-CA');
        fd.set('academic_year', ayDeadline.academic_year);
        fd.set('deadline', deadlineYMD);



        // Bridge UI state (from your Command/Popover, date picker, radios) → FormData
        fd.set('incoming', incoming ?? '');                 // "yes" | "no"
        fd.set('name_extension', nameExt || '');
        fd.set("ethnicity", ethnicityId ? String(ethnicityId) : "");
        fd.set("religion", religionId ? String(religionId) : "");

        fd.set('province_municipality', provinceId ? String(provinceId) : '');
        fd.set('district', districtId ? String(districtId) : '');
        fd.set('intended_school', schoolId ? String(schoolId) : '');
        fd.set('year_level', yearLevel || '');
        fd.set('course', courseId ? String(courseId) : '');
        fd.set('birthdate', birthdate.trim() ? birthdate.trim() : '');

        clearInvalidMarks();
        const clientErrs = buildClientRequiredErrors(fd, nameRegion || "");

        if (Object.keys(clientErrs).length) {
            highlightInvalidFields(clientErrs);
            toast.error("Please fill all required fields.", { id: "cmsp-submit" });
            return;
        }

        // PDF check (Accomplished Application Form)
        const pdf = fd.get('application_form') as File | null;
        if (!pdf || pdf.size === 0) {
            toast.error('Accomplished Application Form (PDF) is required.');
            return;
        }
        if (pdf.type !== 'application/pdf') {
            toast.error('The uploaded file must be a PDF.');
            return;
        }
        if (pdf.size > 10 * 1024 * 1024) {
            toast.error('Max file size is 10 MB.');
            return;
        }

        // Optional: require consent checkbox
        const consent = fd.get('consent') as string | null;
        if (consent !== 'yes') {
            toast.error('Please confirm the certification & data privacy consent.');
            return;
        }

        // Optional: At least 1 Special Group (including "N/A")
        if (!fd.getAll('special_groups[]').length) {
            toast.error('Please select your Special Group (choose "N/A" if none).');
            return;
        }


        setIsSubmitting(true);
        toast.loading('Submitting application…', { id: 'cmsp-submit' });

        router.post(route('cmsps.apply'), fd, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Application submitted successfully!', { id: 'cmsp-submit' });
                (document.getElementById('cmspForm') as HTMLFormElement)?.reset();
                form.reset();
                // clear saved draft
                localStorage.removeItem(STORAGE_KEY);
                draftRef.current = {};
                clearInvalidMarks();

                // reset controlled state
                setIncoming(null);
                setNameExt('');
                setProvinceId(null); setProvinceLabel('');
                setDistrictId(null); setDistrictLabel('');
                setSchoolId(null); setSchoolLabel('');
                setYearLevel('');
                setCourseId(null); setCourseLabel('');
                setDate(undefined);
                setBirthdate('');
                setSex('');

            },
            onError: (errors) => {
                highlightInvalidFields(errors as Record<string, string>);
                // Show first validation error
                const first = Object.values(errors)[0] as string | undefined;
                toast.error(first ?? 'Please review the highlighted fields.', { id: 'cmsp-submit' });
                console.log(errors);
            },
            onCancel: () => {
                toast.dismiss('cmsp-submit');
                setIsSubmitting(false);
            },
            onException: (error) => {
                console.error(error);
                toast.error('Something went wrong. Please try again.', { id: 'cmsp-submit' });
                setIsSubmitting(false);
            },
            onFinish: (visit) => {
                setIsSubmitting(false);
                if (!visit.completed) {
                    toast.dismiss('cmsp-submit');
                }
            },
        });
    };


    return (
        <>
            <Head title={`AY ${ayDeadline?.academic_year ?? ''}`}>

                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <Toaster richColors position="top-right" closeButton duration={4000} />

            <AnimatePresence>
                {deadlineDate && showDeadlineBanner && (
                    <motion.aside
                        key="deadline-banner"
                        initial={{ opacity: 0, x: -40 }}   // slide in from left
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="fixed left-3 right-3 top-[72px] z-[120] sm:left-6 sm:right-auto sm:max-w-sm md:max-w-md" // wider on desktop
                    >
                        {/* Container color switches: amber when open, red when closed */}
                        <div
                            className={`relative rounded-lg border p-2.5 backdrop-blur-sm shadow-md text-white
          ${isDeadlinePast ? 'border-red-500/30 bg-red-600/90' : 'border-amber-500/30 bg-amber-600/90'}`}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowDeadlineBanner(false)}
                                className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-white/20 transition"
                            >
                                <span className="text-xs font-bold leading-none">×</span>
                            </button>

                            <div className="flex items-start gap-2 pr-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15">
                                    <CalendarDays className="h-4 w-4" />
                                </div>

                                <div className="flex-1 leading-tight">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
                                        Deadline
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {friendlyDeadline || formattedDeadline}
                                    </p>
                                    {deadlineStatusLabel && (
                                        <p className="text-[11px] text-white/90">{deadlineStatusLabel}</p>
                                    )}
                                </div>
                            </div>

                            {!isDeadlinePast && daysRemaining != null && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
                                        <div
                                            className="h-full rounded-full bg-white"
                                            style={{
                                                width: `${Math.max(8, Math.min(100, 100 - daysRemaining * 6))}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] whitespace-nowrap">
                                        {isDeadlineToday ? "Today" : `${daysRemaining} d`}
                                    </span>
                                </div>
                            )}

                            {isDeadlinePast && (
                                <div className="mt-2 rounded-md border border-white/20 bg-white/10 p-1.5 text-center text-[10px] uppercase tracking-wider">
                                    Closed
                                </div>
                            )}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>





            {/* Offset for fixed navbar */}
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 pt-16 lg:pt-20 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <header className="w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    {/* Fixed navbar with explicit height */}

                    {showConfetti && viewport.width > 0 && viewport.height > 0 && (
                        <Confetti
                            width={viewport.width}
                            height={viewport.height}
                            numberOfPieces={320}
                            recycle={false}
                            gravity={0.5}
                            style={{ zIndex: 100000, pointerEvents: "none" }} // above overlays, no clicks blocked
                        />
                    )}

                    <Dialog open={successOpen} onOpenChange={handleSuccessOpenChange}>
                        <DialogContent
                            onInteractOutside={(e) => e.preventDefault()}
                            className="
                                sm:max-w-2xl lg:max-w-3xl p-0
                                rounded-3xl border border-zinc-200/70 dark:border-zinc-800/60
                                bg-white/85 dark:bg-zinc-950/75 backdrop-blur-md shadow-2xl [&>button:last-of-type]:hidden
                                "
                        >
                            {/* top-right close */}
                            <DialogClose asChild>
                                <button
                                    aria-label="Close"
                                    className="
                                        absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center
                                        rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800
                                        dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100
                                        transition
                                        "
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </DialogClose>

                            <div className="px-8 py-10 md:px-12 md:py-14">
                                {/* subtle success icon */}
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.25 }}
                                    className="mx-auto mb-6 flex h-16 w-16 items-center justify-center
                    rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30"
                                    aria-hidden
                                >
                                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                </motion.div>

                                <DialogHeader className="items-center">
                                    <DialogTitle className="text-center text-2xl md:text-3xl font-semibold tracking-tight">
                                        Congratulations!
                                    </DialogTitle>
                                    <DialogDescription className="mt-2 max-w-2xl text-center text-[15px] text-zinc-600 dark:text-zinc-400">
                                        You have successfully submitted your application. Please keep your email and phone active for updates.
                                    </DialogDescription>
                                </DialogHeader>

                                {generatedTrackingNo && (
                                    <div className="mt-8 flex flex-col items-center gap-4">
                                        <span className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                            Your tracking number
                                        </span>
                                        <div className="flex flex-col items-center gap-3 sm:flex-row">
                                            <span className="rounded-2xl bg-zinc-100 px-6 py-2 text-lg font-semibold tracking-[0.3em] text-zinc-800 shadow-sm dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-none">
                                                {generatedTrackingNo}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleCopyTracking}
                                                className="h-11 rounded-xl px-5"
                                                aria-label="Copy tracking number"
                                            >
                                                <Copy className="mr-2 h-5 w-5" />
                                                Copy
                                            </Button>
                                        </div>
                                        <div className="mt-3 flex flex-col items-center">
                                            <Badge
                                                variant="outline"
                                                className="max-w-md px-4 py-2 text-center text-xs leading-relaxed whitespace-normal break-words
                                                             border-blue-200 bg-blue-50/80 text-blue-700
                                                             dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
                                            >
                                                💡 Save this code to track your application status anytime.
                                                Go to "Eligibility & Requirements" tab and click "Track Status" to check your application.
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-10 flex justify-center">
                                    <DialogClose asChild>
                                        <Button
                                            type="button"
                                            autoFocus
                                            className="h-11 rounded-xl px-6 bg-[#1e3c73] hover:bg-[#25468a] text-white shadow-sm"
                                        >
                                            Close
                                        </Button>
                                    </DialogClose>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={trackOpen} onOpenChange={setTrackOpen}>
                        <DialogContent
                            className="
      p-0 rounded-3xl
      w-[95vw] sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl
      max-h-[90vh] overflow-y-auto
      bg-white dark:bg-zinc-950
      border border-zinc-200/80 dark:border-zinc-800
      shadow-2xl
      [&>button:last-of-type]:hidden
    "
                            onInteractOutside={(e) => e.preventDefault()}
                        >
                            {/* single top-right close */}
                            <DialogClose asChild>
                                <button
                                    aria-label="Close"
                                    className="
          absolute right-3 top-3 sm:right-4 sm:top-4 inline-flex h-8 w-8 sm:h-9 sm:w-9
          items-center justify-center
          rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800
          dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100
          transition
        "
                                >
                                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                            </DialogClose>

                            <div className="p-4 sm:p-6">
                                <DialogHeader className="space-y-1">
                                    <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight">
                                        Track Application Status
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Enter your Tracking Number.
                                    </DialogDescription>
                                </DialogHeader>

                                {/* OTP INPUT */}
                                <div className="mt-4 space-y-3">
                                    <div id="trackingCode" className="flex justify-center flex-wrap gap-1 sm:gap-2">
                                        <InputOTP
                                            data-input-otp
                                            maxLength={9}
                                            value={trackingCode}
                                            inputMode="text"
                                            onChange={(val) => {
                                                setTrackingCode(normalizeTrackingInput(val));
                                                if (trackError) setTrackError(null);
                                            }}
                                            onPaste={(e) => {
                                                const text = (e.clipboardData.getData('text') || '').trim();
                                                e.preventDefault();
                                                setTrackingCode(normalizeTrackingInput(text));
                                                if (trackError) setTrackError(null);
                                            }}
                                            className="gap-1 sm:gap-2 justify-center"
                                        >
                                            <InputOTPGroup className="gap-1 sm:gap-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <InputOTPSlot
                                                        key={i}
                                                        index={i}
                                                        className="
                    h-10 w-9 sm:h-12 sm:w-11 text-base sm:text-lg font-medium
                    rounded-xl border-2 border-zinc-300 dark:border-zinc-700
                    bg-white dark:bg-zinc-900 shadow-sm
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3c73]
                    data-[state=selected]:border-[#1e3c73]
                  "
                                                    />
                                                ))}
                                            </InputOTPGroup>

                                            <InputOTPSeparator className="px-1 sm:px-2 text-zinc-400">–</InputOTPSeparator>

                                            <InputOTPGroup className="gap-1 sm:gap-2">
                                                {[...Array(4)].map((_, i) => (
                                                    <InputOTPSlot
                                                        key={i + 5}
                                                        index={i + 5}
                                                        className="
                    h-10 w-9 sm:h-12 sm:w-11 text-base sm:text-lg font-medium
                    rounded-xl border-2 border-zinc-300 dark:border-zinc-700
                    bg-white dark:bg-zinc-900 shadow-sm
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3c73]
                    data-[state=selected]:border-[#1e3c73]
                  "
                                                    />
                                                ))}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>

                                    <p className="text-[11px] text-center text-zinc-500">
                                        Format: <span className="font-mono">AAAAA-YYYY</span>
                                    </p>
                                    {trackError && (
                                        <p className="text-xs text-center text-red-600 dark:text-red-400">{trackError}</p>
                                    )}
                                </div>

                                {/* STATUS RESULT */}
                                <div
                                    id="statusResult"
                                    className="
          mt-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700
          bg-white dark:bg-zinc-950 p-3 sm:p-5 min-h-[96px]
        "
                                >
                                    {loadingTrack ? (
                                        <div className="space-y-3">
                                            <Skeleton className="h-5 w-40" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-5/6" />
                                            <Skeleton className="h-4 w-3/4" />
                                        </div>
                                    ) : trackResult ? (
                                        <StatusCard data={trackResult} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center text-zinc-500">
                                            <FileClock className="mb-2 h-7 w-7 sm:h-8 sm:w-8 text-zinc-400 dark:text-zinc-600" />
                                            <p className="text-sm">
                                                Results will appear here after you enter your tracking number and click <b>Check Status</b>.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5 border-t border-zinc-200 dark:border-zinc-800" />

                                <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs w-full sm:w-auto"
                                        onClick={() => {
                                            setTrackingCode("");
                                            setTrackError(null);
                                            setTrackResult(null);
                                        }}
                                    >
                                        Clear
                                    </Button>

                                    <Button
                                        size="sm"
                                        className="text-xs w-full sm:w-auto bg-[#1e3c73] hover:bg-[#153159] text-white"
                                        onClick={handleCheckStatus}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleCheckStatus();
                                        }}
                                    >
                                        <Search className="mr-1.5 h-4 w-4" />
                                        Check Status
                                    </Button>
                                </DialogFooter>
                            </div>
                        </DialogContent>
                    </Dialog>


                    {!isApplicationOpen && (
                        <div className="fixed inset-0 z-50">
                            {/* Ambient background */}
                            <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_-10%,#e6f0ff_0%,transparent_60%),radial-gradient(60%_50%_at_50%_110%,#fff2cc_0%,transparent_60%)]
                    dark:bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(30,60,115,.25)_0%,transparent_60%),radial-gradient(60%_50%_at_50%_110%,rgba(245,158,11,.15)_0%,transparent_60%)]" />
                            <div className="absolute inset-0 backdrop-blur-xl bg-white/55 dark:bg-zinc-950/55" />

                            {/* Card with square top, rounded bottom */}
                            <div className="relative mx-auto grid h-full max-w-4xl place-items-center p-6">
                                <motion.div
                                    initial={{ y: 16, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="w-full rounded-b-3xl rounded-tl-none rounded-tr-none border border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-950/70 shadow-2xl"
                                >
                                    <div className="relative p-8 sm:p-10">
                                        {/* Accent bar */}
                                        <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-[#1e3c73] via-sky-500 to-emerald-500" />

                                        {/* Header chip */}
                                        <div className="mb-3 flex justify-center">
                                            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                                                Application Closed
                                            </div>
                                        </div>

                                        <h2 className="text-center text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                                            CMSP Online Application is Closed
                                        </h2>

                                        {/* Notice */}
                                        <div className="mt-6 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/75 dark:bg-amber-950/20 p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full ring-1 ring-amber-400/40 dark:ring-amber-700/50">
                                                    <svg className="h-5 w-5 text-amber-600 dark:text-amber-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 19.5A7.5 7.5 0 1 0 12 4.5a7.5 7.5 0 0 0 0 15z" />
                                                    </svg>
                                                </div>

                                                <div className="space-y-3 text-left">
                                                    <p className="font-semibold text-amber-900 dark:text-amber-200">Important Notice</p>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge
                                                            variant="secondary"
                                                            className="rounded-full border border-green-300/70 bg-green-100/80 text-[0.8rem] sm:text-sm font-medium text-green-800 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300"
                                                        >
                                                            {closedWindowLabel}
                                                        </Badge>

                                                        {ayDeadline && (
                                                            <Badge
                                                                variant="outline"
                                                                className="rounded-full border border-red-300 bg-red-100/80 text-[0.75rem] sm:text-xs font-medium text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                                                            >
                                                                Application Deadline: {formattedDeadline}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <p className="text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                                                        The CMSP online application for <strong>{closedWindowLabel}</strong> is no longer accepting new submissions.
                                                        You may still track your submitted application below.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CTA */}
                                        <div className="mt-8 flex justify-center">
                                            <Button
                                                onClick={() => setTrackOpen(true)}
                                                className="rounded-full bg-[#1e3c73] hover:bg-[#18325f] px-6 py-2.5 text-white text-sm sm:text-base shadow-sm shadow-[#1e3c73]/10 focus-visible:ring-2 focus-visible:ring-[#1e3c73] focus-visible:ring-offset-2"
                                            >
                                                <FileClock className="mr-2 h-4 w-4" />
                                                Track Application Status
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}





                    <nav
                        className="
                                fixed inset-x-0 top-0
                                z-[80] isolate                  /* keep nav above popovers/dialogs */
                                h-16 lg:h-20
                                border-b border-gray-200
                                bg-[#1e3c72]
                                dark:border-[#3E3E3A] dark:bg-[#161615]
                                "
                    >
                        <div className="mx-auto h-full max-w-screen-xl grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4">
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

                            <div className="hidden sm:block" />

                            <div className="col-start-3 justify-self-end flex items-center gap-2 rtl:space-x-reverse">
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

                        <Tabs
                            value={activeTab}
                            onValueChange={(value) => setActiveTab(value as "form" | "req")}
                            className="w-full mt-4"
                        >
                            <TabsList
                                aria-label="CMSP sections"
                                className="
                                    -mx-0 mb-2 pb-6 flex w-full items-center gap-1  bg-transparent px-1
                                    dark:border-zinc-800
                                    [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                                    "
                            >
                                <TabsTrigger
                                    value="form"
                                    className="
                                        group relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium
                                        text-zinc-600 transition-colors hover:text-zinc-900
                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3c73]/35
                                        data-[state=active]:text-[#1e3c73]
                                        data-[state=active]:bg-[#1e3c73]/10 dark:data-[state=active]:bg-[#1e3c73]/20
                                        after:absolute after:left-2 after:right-2 after:-bottom-[11px] after:h-[2px] after:rounded-full
                                        after:bg-transparent data-[state=active]:after:bg-[#1e3c73]
                                    "
                                >
                                    <FileText className="h-4 w-4" />
                                    <span className="whitespace-nowrap">Application Form</span>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="req"
                                    className="
                                        group relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium
                                        text-zinc-600 transition-colors hover:text-zinc-900
                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3c73]/35
                                        data-[state=active]:text-[#1e3c73]
                                        data-[state=active]:bg-[#1e3c73]/10 dark:data-[state=active]:bg-[#1e3c73]/20
                                        after:absolute after:left-2 after:right-2 after:-bottom-[11px] after:h-[2px] after:rounded-full
                                        after:bg-transparent data-[state=active]:after:bg-[#1e3c73]
                                    "
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="whitespace-nowrap">Eligibility & Requirements</span>
                                </TabsTrigger>

                            </TabsList>

                            <TabsContent value="form" forceMount className="mt-3 data-[state=inactive]:hidden">

                                <section className="w-full">
                                    <Card className="relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/75 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800/60 dark:bg-zinc-950/40">

                                        <div className="absolute inset-x-0 top-0 h-1 bg-[#1e3c73]" />

                                        <CardHeader className="py-3">
                                            <div className="grid items-center gap-3 grid-cols-1 sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto]">
                                                {/* logos */}
                                                <div className="flex items-center gap-2 shrink-0 justify-center">
                                                    <img src="/ched_logo.png" alt="CHED logo" className="h-8 w-auto md:h-9" />
                                                    <img src="/bagong_pilipinas.png" alt="Bagong Pilipinas logo" className="h-11 w-auto md:h-12" />
                                                </div>

                                                {/* title (no truncation, wraps nicely) */}
                                                <div className="min-w-0">
                                                    <CardTitle
                                                        className="
                                                            text-base font-semibold leading-tight text-zinc-900 dark:text-zinc-100
                                                            whitespace-normal break-words
                                                        "
                                                    >
                                                        CALL FOR APPLICATION FOR THE CHED Merit Scholarship Program (CMSP)
                                                    </CardTitle>
                                                    <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400">
                                                        CHED Regional Office XII
                                                    </CardDescription>
                                                </div>

                                                {/* badges */}
                                                <div className="flex flex-wrap items-center gap-1 justify-center sm:col-span-2 lg:col-span-1 lg:justify-end">
                                                    {ayDeadline && (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                                                            </svg>
                                                            AY {ayDeadline.academic_year}
                                                        </span>
                                                    )}

                                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100/80 px-2.5 py-1 text-[11px] font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                                                        </svg>
                                                        {ayDeadline ? `Deadline: ${formattedDeadline}` : "Deadline: TBA"}
                                                    </span>
                                                </div>
                                            </div>

                                        </CardHeader>
                                    </Card>
                                </section>




                                <form id="cmspForm" onSubmit={handleSubmit} encType="multipart/form-data" noValidate>
                                    <input type="hidden" name="academic_year" value={ayDeadline?.academic_year ?? ""} />
                                    <input type="hidden" name="deadline" value={ayDeadline?.deadline ?? ""} />

                                    <section className="w-full mt-4">
                                        <Card className="rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="flex items-center gap-3 text-sm font-semibold tracking-tight">
                                                    <span
                                                        className="
                                                            flex h-7 w-7 items-center justify-center rounded-full
                                                            bg-[#1e3c73] text-white font-bold text-base shadow
                                                            border-2 border-[#25468a]
                                                        "
                                                        aria-hidden
                                                    >
                                                        1
                                                    </span>
                                                    Step 1: Eligibility & Region
                                                </CardTitle>
                                            </CardHeader>

                                            <CardContent className="space-y-6">
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    {/* Incoming 1st Year */}
                                                    <div>
                                                        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                                            Are you an incoming 1st year college? <span className="text-red-500">*</span>
                                                        </p>
                                                        <div className="flex flex-col gap-2" data-group="incoming">
                                                            <label className="flex items-center gap-2 text-sm">
                                                                <input
                                                                    type="radio"
                                                                    name="incoming"
                                                                    value="yes"
                                                                    checked={incoming === "yes"}
                                                                    onChange={(e) => {
                                                                        setIncoming(e.target.value);
                                                                        persistDraft('incoming', e.target.value);
                                                                    }}
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
                                                                    onChange={(e) => {
                                                                        setIncoming(e.target.value);
                                                                        persistDraft('incoming', e.target.value);
                                                                    }}
                                                                    className="h-4 w-4"
                                                                />{" "}
                                                                If NO, you are not qualified to apply.
                                                            </label>
                                                        </div>

                                                    </div>

                                                    {/* Select Region */}
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">
                                                            Select Region <span className="text-red-500">*</span>
                                                        </label>
                                                        <Popover open={openRegion} onOpenChange={setOpenRegion}>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className="w-full justify-between"
                                                                    data-field="region"
                                                                >
                                                                    {nameRegion || "Select region"}
                                                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                                className="w-[var(--radix-popover-trigger-width)] p-0"
                                                                align="start"
                                                                sideOffset={8}
                                                            >
                                                                <Command>
                                                                    <CommandInput placeholder="Search region..." />
                                                                    <CommandList>
                                                                        <CommandEmpty>No result</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {["Region XII", "BARMM"].map((region) => (
                                                                                <CommandItem
                                                                                    key={region}
                                                                                    value={region}
                                                                                    onSelect={(value) => {
                                                                                        setRegion(value);
                                                                                        persistDraft('region', value);
                                                                                        setOpenRegion(false);
                                                                                    }}
                                                                                >
                                                                                    {region}
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </section>

                                    <section className="w-full mt-4">
                                        <Card className="rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-3">
                                                    <span
                                                        className="
                                                            flex h-7 w-7 items-center justify-center rounded-full
                                                            bg-[#1e3c73] text-white font-bold text-base shadow
                                                            border-2 border-[#25468a]
                                                        "
                                                        aria-hidden
                                                    >
                                                        2
                                                    </span>
                                                    Step 2: Personal Information
                                                </CardTitle>
                                            </CardHeader>

                                            <CardContent className="space-y-6">

                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">


                                                    {/* LRN (Learner Reference Number) */}
                                                    <div className="md:col-span-1">
                                                        <label className="mb-1 block text-sm font-medium">
                                                            Learner Reference Number (LRN) <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="lrn"
                                                            placeholder="Enter your 12-digit LRN"
                                                            maxLength={12}
                                                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
                                                                            focus:border-blue-500 focus:ring focus:ring-blue-200 
                                                                            dark:border-zinc-700 dark:bg-zinc-900"
                                                            required
                                                        />
                                                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                            Your LRN is a 12-digit number issued by DepEd.
                                                        </p>
                                                    </div>
                                                    {/* Email */}
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">Email (Active Email Address) <span className="text-red-500">*</span></label>
                                                        <input type="email" name="email" placeholder="Your answer"
                                                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" required />
                                                    </div>
                                                    {/* Contact Number */}
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">
                                                            Contact Number (Active Contact Number) <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            name="contact_number"
                                                            placeholder="09XXXXXXXXX"
                                                            required
                                                            inputMode="numeric"
                                                            autoComplete="tel-national"
                                                            maxLength={11}
                                                            pattern="^\d{11}$"
                                                            title="Enter exactly 11 digits (e.g., 09XXXXXXXXX)"
                                                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
                                                                            focus:border-blue-500 focus:ring focus:ring-blue-200 
                                                                            dark:border-zinc-700 dark:bg-zinc-900"
                                                            onInput={(e) => {
                                                                const t = e.currentTarget;
                                                                // keep digits only; hard cap at 11
                                                                t.value = t.value.replace(/\D/g, '').slice(0, 11);
                                                                // clear any previous custom error
                                                                t.setCustomValidity('');
                                                            }}
                                                            onBlur={(e) => {
                                                                const t = e.currentTarget;
                                                                if (t.value.length !== 11) {
                                                                    t.setCustomValidity('Contact number must be exactly 11 digits.');
                                                                } else {
                                                                    t.setCustomValidity('');
                                                                }
                                                            }}
                                                        />

                                                    </div>
                                                </div>





                                                {/* Grid 2–3 cols */}
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">






                                                    {/* Last Name */}
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
                                                        <input type="text" name="last_name" placeholder="Your answer"
                                                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" required />
                                                    </div>

                                                    {/* First Name */}
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">First Name <span className="text-red-500">*</span></label>
                                                        <input type="text" name="first_name" placeholder="Your answer"
                                                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" required />
                                                    </div>

                                                    {/* Middle Name */}
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">Middle Name <span className="text-red-500">*</span></label>
                                                        <input type="text" name="middle_name" placeholder="Your answer"
                                                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" required />
                                                    </div>

                                                    {/* Sex (Radio) */}
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">
                                                            Sex <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="flex flex-row gap-6" data-group="sex">
                                                            <label className="flex items-center gap-2 text-sm">
                                                                <input
                                                                    type="radio"
                                                                    name="sex"
                                                                    className="h-4 w-4"
                                                                    value="male"
                                                                    checked={sex === 'male'}
                                                                    onChange={(e) => {
                                                                        setSex('male');
                                                                        persistDraft('sex', 'male');
                                                                        // clear any previously typed maiden name if switching away from female
                                                                        persistDraft('maiden_name', '');
                                                                        const el = document.querySelector<HTMLInputElement>('[name="maiden_name"]');
                                                                        if (el) el.value = '';
                                                                    }}
                                                                />
                                                                Male
                                                            </label>
                                                            <label className="flex items-center gap-2 text-sm">
                                                                <input
                                                                    type="radio"
                                                                    name="sex"
                                                                    className="h-4 w-4"
                                                                    value="female"
                                                                    checked={sex === 'female'}
                                                                    onChange={(e) => {
                                                                        setSex('female');
                                                                        persistDraft('sex', 'female');
                                                                    }}
                                                                />
                                                                Female
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Maiden Name (only when Female) */}
                                                    {sex === 'female' && (
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">
                                                                Maiden Name (for Married Women) <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="maiden_name"
                                                                placeholder="Your answer"
                                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900"

                                                                required
                                                                onChange={(e) => persistDraft('maiden_name', e.currentTarget.value)}
                                                            />
                                                        </div>
                                                    )}


                                                    {/* Name Extension (Command searchable) */}
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">Name Extension</label>
                                                        <Popover open={openNameExt} onOpenChange={setOpenNameExt}>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className="w-full justify-between"
                                                                    data-field="name_extension"
                                                                >
                                                                    {nameExt || "Select extension"}
                                                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                                className="w-[var(--radix-popover-trigger-width)] p-0"
                                                                align="start"
                                                                sideOffset={8}
                                                            >
                                                                <Command>
                                                                    <CommandInput placeholder="Search extension..." />
                                                                    <CommandList>
                                                                        <CommandEmpty>No result</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {["Jr", "II", "III", "Others"].map((ext) => (
                                                                                <CommandItem
                                                                                    key={ext}
                                                                                    value={ext}
                                                                                    onSelect={(value) => {
                                                                                        setNameExt(value);
                                                                                        persistDraft('name_extension', value);
                                                                                        setOpenNameExt(false);
                                                                                    }}
                                                                                >
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
                                                        <Input
                                                            id="birthdate"
                                                            name="birthdate"
                                                            type="date"
                                                            value={birthdate}
                                                            onChange={(e) => {
                                                                const v = e.target.value;       // yyyy-MM-dd (partial typing allowed)
                                                                setBirthdate(v);
                                                                persistDraft("birthdate", v || "");
                                                            }}
                                                            onBlur={(e) => {
                                                                const v = e.currentTarget.value;
                                                                setDate(v ? new Date(v) : undefined); // sync your Date state after user finishes
                                                            }}
                                                            required
                                                        />


                                                    </div>

                                                    <label className="flex items-center gap-2 text-sm font-medium">
                                                        <input type="checkbox" name="working" className="h-4 w-4" value="yes" />
                                                        I am a working student
                                                    </label>

                                                    {/* Ethnicity (searchable) */}
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">
                                                            Ethnicity <span className="text-red-500">*</span>
                                                        </label>
                                                        <Popover open={openEthnicity} onOpenChange={setOpenEthnicity}>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className="w-full justify-between"
                                                                    data-field="ethnicity"
                                                                >
                                                                    {ethnicityLabel || "Select ethnicity"}
                                                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                                className="w-[var(--radix-popover-trigger-width)] p-0"
                                                                align="start"
                                                                sideOffset={8}
                                                            >
                                                                <Command>
                                                                    <CommandInput placeholder="Search ethnicity..." />
                                                                    <CommandList>
                                                                        {loadingEthnicities ? (
                                                                            <CommandEmpty>Loading...</CommandEmpty>
                                                                        ) : ethnicities.length === 0 ? (
                                                                            <CommandEmpty>No result</CommandEmpty>
                                                                        ) : (
                                                                            <CommandGroup heading="Ethnicities">
                                                                                {ethnicities.map((e) => (
                                                                                    <CommandItem
                                                                                        key={e.id}
                                                                                        value={e.label}
                                                                                        onSelect={() => {
                                                                                            setEthnicityId(e.id);
                                                                                            setEthnicityLabel(e.label);
                                                                                            persistDraft("ethnicity", String(e.id));
                                                                                            persistDraft("ethnicity_label", e.label);
                                                                                            setOpenEthnicity(false);
                                                                                        }}
                                                                                    >
                                                                                        {e.label}
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        )}
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>

                                                    {/* Religion (searchable) */}
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">
                                                            Religion <span className="text-red-500">*</span>
                                                        </label>
                                                        <Popover open={openReligion} onOpenChange={setOpenReligion}>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className="w-full justify-between"
                                                                    data-field="religion"
                                                                >
                                                                    {religionLabel || "Select religion"}
                                                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                                className="w-[var(--radix-popover-trigger-width)] p-0"
                                                                align="start"
                                                                sideOffset={8}
                                                            >
                                                                <Command>
                                                                    <CommandInput placeholder="Search religion..." />
                                                                    <CommandList>
                                                                        {loadingReligions ? (
                                                                            <CommandEmpty>Loading...</CommandEmpty>
                                                                        ) : religions.length === 0 ? (
                                                                            <CommandEmpty>No result</CommandEmpty>
                                                                        ) : (
                                                                            <CommandGroup heading="Religions">
                                                                                {religions.map((r) => (
                                                                                    <CommandItem
                                                                                        key={r.id}
                                                                                        value={r.label}
                                                                                        onSelect={() => {
                                                                                            setReligionId(r.id);
                                                                                            setReligionLabel(r.label);
                                                                                            persistDraft("religion", String(r.id));
                                                                                            persistDraft("religion_label", r.label);
                                                                                            setOpenReligion(false);
                                                                                        }}
                                                                                    >
                                                                                        {r.label}
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

                                    {nameRegion === "Region XII" && (
                                        <section className="w-full mt-4">
                                            <Card className="rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-3">
                                                        <span
                                                            className="
                                                            flex h-7 w-7 items-center justify-center rounded-full
                                                            bg-[#1e3c73] text-white font-bold text-base shadow
                                                            border-2 border-[#25468a]
                                                        "
                                                            aria-hidden
                                                        >
                                                            3
                                                        </span>
                                                        Step 3: Address
                                                        <Badge
                                                            variant="outline"
                                                            className="rounded-full border-blue-300 bg-blue-50 text-xs font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300"
                                                        >
                                                            For Applicants from <span className="font-bold">REGION XII</span>
                                                        </Badge>
                                                    </CardTitle>
                                                </CardHeader>

                                                <CardContent className="space-y-6">

                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                                                        {/* Province & Municipality */}
                                                        <div className="md:col-span-2">
                                                            <label className="mb-1 block text-sm font-medium">
                                                                Province & Municipality <span className="text-red-500">*</span>
                                                            </label>

                                                            <Popover open={openProvince} onOpenChange={setOpenProvince}>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        className="w-full justify-between"
                                                                        data-field="province_municipality"
                                                                    >
                                                                        {provinceLabel || "Select location"}
                                                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                                    </Button>
                                                                </PopoverTrigger>

                                                                <PopoverContent
                                                                    className="z-[60] w-[var(--radix-popover-trigger-width)] p-0"
                                                                    align="start"
                                                                    sideOffset={8}
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
                                                                                            value={loc.label}
                                                                                            onSelect={() => {
                                                                                                setProvinceId(loc.id);
                                                                                                setProvinceLabel(loc.label);
                                                                                                persistDraft('province_municipality', String(loc.id));
                                                                                                persistDraft('province_municipality_label', loc.label);
                                                                                                setDistricts([]);
                                                                                                setDistrictId(null);
                                                                                                setDistrictLabel("");
                                                                                                persistDraft('district', '');
                                                                                                persistDraft('district_label', '');
                                                                                                setOpenProvince(false);
                                                                                            }}
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
                                                            <input type="text" name="barangay" placeholder="Your answer"
                                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" />
                                                        </div>

                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Purok/Street <span className="text-red-500">*</span></label>
                                                            <input type="text" name="purok_street" placeholder="Your answer"
                                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" />
                                                        </div>

                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">ZIP Code <span className="text-red-500">*</span></label>
                                                            <input type="text" name="zip_code" placeholder="Your answer"
                                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" required />
                                                        </div>

                                                        {/* District */}
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">
                                                                District <span className="text-red-500">*</span>
                                                            </label>

                                                            <Popover open={openDistrict} onOpenChange={setOpenDistrict}>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        className="w-full justify-between"
                                                                        data-field="district"
                                                                        disabled={!provinceId || loadingDistricts}
                                                                    >
                                                                        {loadingDistricts
                                                                            ? "Loading..."
                                                                            : districtLabel || "Select district"}
                                                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                                    </Button>
                                                                </PopoverTrigger>

                                                                <PopoverContent
                                                                    className="z-[60] w-[var(--radix-popover-trigger-width)] p-0"
                                                                    align="start"
                                                                    sideOffset={8}
                                                                >
                                                                    <Command>
                                                                        <CommandInput
                                                                            placeholder="Search district..."
                                                                            disabled={!provinceId}
                                                                        />
                                                                        <CommandList>
                                                                            {!provinceId ? (
                                                                                <CommandEmpty>
                                                                                    Select a province & municipality first.
                                                                                </CommandEmpty>
                                                                            ) : loadingDistricts ? (
                                                                                <CommandEmpty>Loading...</CommandEmpty>
                                                                            ) : districts.length === 0 ? (
                                                                                <CommandEmpty>No results found.</CommandEmpty>
                                                                            ) : (
                                                                                <CommandGroup heading="Districts">
                                                                                    {districts.map((d) => (
                                                                                        <CommandItem
                                                                                            key={d.id}
                                                                                            value={d.label}
                                                                                            onSelect={() => {
                                                                                                setDistrictId(d.id);
                                                                                                setDistrictLabel(d.label);
                                                                                                persistDraft('district', String(d.id));
                                                                                                persistDraft('district_label', d.label);
                                                                                                setOpenDistrict(false);
                                                                                            }}
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
                                    )}


                                    {/* BARMM B Section */}
                                    {nameRegion === "BARMM" && (
                                        <section className="w-full mt-4">
                                            <Card className="rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">
                                                <CardHeader className="pb-2">

                                                    <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-3">
                                                        <span
                                                            className="
                                                            flex h-7 w-7 items-center justify-center rounded-full
                                                            bg-[#1e3c73] text-white font-bold text-base shadow
                                                            border-2 border-[#25468a]
                                                        "
                                                            aria-hidden
                                                        >
                                                            3
                                                        </span>
                                                        Step 3: Address

                                                        <Badge
                                                            variant="outline"
                                                            className="rounded-full border-purple-300 bg-purple-50 text-xs font-semibold text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/20 dark:text-purple-300"
                                                        >
                                                            For Applicants from <span className="font-bold">BARMM B</span>
                                                        </Badge>
                                                    </CardTitle>
                                                </CardHeader>

                                                <CardContent className="space-y-6">
                                                    {/* Address Fields */}
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                        {/* Province */}
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Province <span className="text-red-500">*</span></label>
                                                            <input
                                                                type="text"
                                                                name="barmm_province"
                                                                placeholder="Your answer"
                                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
                                                                focus:border-blue-500 focus:ring focus:ring-blue-200 
                                                                dark:border-zinc-700 dark:bg-zinc-900"

                                                            />
                                                        </div>

                                                        {/* Municipality */}
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Municipality <span className="text-red-500">*</span></label>
                                                            <input
                                                                type="text"
                                                                placeholder="Your answer"
                                                                name="barmm_municipality"
                                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
                focus:border-blue-500 focus:ring focus:ring-blue-200 
                dark:border-zinc-700 dark:bg-zinc-900"
                                                            />
                                                        </div>

                                                        {/* Barangay */}
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Barangay <span className="text-red-500">*</span></label>
                                                            <input
                                                                type="text"
                                                                placeholder="Your answer"
                                                                name="barmm_barangay"
                                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
                focus:border-blue-500 focus:ring focus:ring-blue-200 
                dark:border-zinc-700 dark:bg-zinc-900"
                                                            />
                                                        </div>

                                                        {/* Purok/Street */}
                                                        <div className="lg:col-span-2">
                                                            <label className="mb-1 block text-sm font-medium">Purok/Street <span className="text-red-500">*</span></label>
                                                            <input
                                                                type="text"
                                                                placeholder="Your answer"
                                                                name="barmm_purok_street"
                                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
                focus:border-blue-500 focus:ring focus:ring-blue-200 
                dark:border-zinc-700 dark:bg-zinc-900"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">ZIP Code <span className="text-red-500">*</span></label>
                                                            <input type="text" name="barmm_zip_code" placeholder="Your answer"
                                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900" />
                                                        </div>
                                                    </div>

                                                </CardContent>
                                            </Card>
                                        </section>
                                    )}

                                    <section className="w-full mt-4">
                                        <Card className="rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">
                                            <CardHeader className="pb-2">

                                                <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-3">
                                                    <span
                                                        className="
                                                            flex h-7 w-7 items-center justify-center rounded-full
                                                            bg-[#1e3c73] text-white font-bold text-base shadow
                                                            border-2 border-[#25468a]
                                                        "
                                                        aria-hidden
                                                    >
                                                        4
                                                    </span>
                                                    Step 4: School & Course


                                                </CardTitle>
                                            </CardHeader>

                                            <CardContent className="space-y-6">

                                                {/* School / Year / Course Section */}
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                                                    {/* School intended to enroll */}
                                                    <div className="lg:col-span-2">
                                                        <label className="mb-1 block text-sm font-medium">
                                                            School intended to enroll in College or Others<span className="text-red-500">*</span>
                                                        </label>

                                                        <Popover open={openSchool} onOpenChange={setOpenSchool}>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className="w-full justify-between"
                                                                    data-field="intended_school"
                                                                >
                                                                    {schoolLabel || "Choose school"}
                                                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>

                                                            <PopoverContent
                                                                className="z-[60] w-[var(--radix-popover-trigger-width)] p-0"
                                                                align="start"
                                                                sideOffset={8}
                                                            >
                                                                <Command>
                                                                    <CommandInput
                                                                        placeholder="Search school..."
                                                                        value={schoolQuery}
                                                                        onValueChange={(v) => {
                                                                            setSchoolQuery(v);
                                                                            const normalized = v.trim().toLowerCase();
                                                                            if (normalized === "others" || normalized === "other") {
                                                                                const others = schools.find(
                                                                                    (s) => s.label?.trim().toLowerCase() === "others"
                                                                                );
                                                                                if (others) {
                                                                                    setSchoolId(others.id);
                                                                                    setSchoolLabel(others.label);
                                                                                    persistDraft("intended_school", String(others.id));
                                                                                    persistDraft("intended_school_label", others.label);
                                                                                    setOpenSchool(false);
                                                                                }
                                                                            }
                                                                        }}
                                                                    />
                                                                    <CommandList>

                                                                        {loadingSchools ? (
                                                                            <CommandEmpty>Loading...</CommandEmpty>
                                                                        ) : schools.length === 0 ? (
                                                                            <CommandEmpty>No result</CommandEmpty>
                                                                        ) : (
                                                                            <CommandGroup heading="Schools">

                                                                                {sortedSchools.map((s) => (

                                                                                    <CommandItem
                                                                                        key={s.id}
                                                                                        value={s.label}
                                                                                        onSelect={() => {
                                                                                            setSchoolId(s.id);
                                                                                            setSchoolLabel(s.label);
                                                                                            persistDraft("intended_school", String(s.id));
                                                                                            persistDraft("intended_school_label", s.label);
                                                                                            setOpenSchool(false);
                                                                                            setSchoolQuery(""); // clear search for next time
                                                                                        }}
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
                                                        <div className="flex flex-col gap-2 text-sm" data-group="school_type">
                                                            {["Public", "LUC", "Private"].map((type) => (
                                                                <label key={type} className="flex items-center gap-2">
                                                                    <input
                                                                        type="radio"
                                                                        name="school_type"
                                                                        value={type}
                                                                        className="h-4 w-4"
                                                                    />
                                                                    {type}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>



                                                    {/* If not indicated */}
                                                    {isOthersSelected && (
                                                        <div className="lg:col-span-3">
                                                            <label className="mb-1 block text-sm font-medium">
                                                                If your school was not indicated, please specify here.{" "}
                                                                <span className="italic text-xs">(Do not abbreviate!)</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="other_school"
                                                                placeholder="Your answer"
                                                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
                                                                            focus:border-blue-500 focus:ring focus:ring-blue-200 
                                                                            dark:border-zinc-700 dark:bg-zinc-900"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Year Level */}
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">
                                                            Year Level <span className="text-red-500">*</span>
                                                        </label>

                                                        <Popover open={openYearLevel} onOpenChange={setOpenYearLevel}>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className="w-full justify-between"
                                                                    data-field="year_level"
                                                                >
                                                                    {yearLevel || "Choose"}
                                                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>

                                                            <PopoverContent
                                                                className="z-[60] w-[var(--radix-popover-trigger-width)] p-0"
                                                                align="start"
                                                                sideOffset={8}
                                                            >
                                                                <Command>
                                                                    <CommandInput placeholder="Search year level..." />
                                                                    <CommandList>
                                                                        <CommandEmpty>No result</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {["Incoming First Year"].map((lvl) => (
                                                                                <CommandItem
                                                                                    key={lvl}
                                                                                    value={lvl}
                                                                                    onSelect={(value) => {
                                                                                        setYearLevel(value);
                                                                                        persistDraft('year_level', value);
                                                                                        setOpenYearLevel(false); // 👈 close after selecting
                                                                                    }}
                                                                                >
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

                                                        <Popover open={openCourse} onOpenChange={setOpenCourse}>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className="w-full justify-between overflow-hidden"
                                                                    data-field="course"
                                                                >
                                                                    <span className="flex-1 min-w-0 truncate text-left" title={courseLabel || undefined}>
                                                                        {courseLabel || "Choose course"}
                                                                    </span>
                                                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                                                                </Button>
                                                            </PopoverTrigger>

                                                            <PopoverContent
                                                                className="z-[60] w-[var(--radix-popover-trigger-width)] p-0"
                                                                align="start"
                                                                sideOffset={8}
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
                                                                                        value={c.label}
                                                                                        onSelect={() => {
                                                                                            setCourseId(c.id);
                                                                                            setCourseLabel(c.label);
                                                                                            persistDraft('course', String(c.id));
                                                                                            persistDraft('course_label', c.label);
                                                                                            setOpenCourse(false);
                                                                                        }}
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

                                                    {/* === Senior High School === */}


                                                    {/* SHS Information Card */}
                                                    <div className="lg:col-span-3">
                                                        <Card className="mb-2 rounded-xl border border-blue-200 bg-blue-50/60 shadow-none dark:border-blue-900/40 dark:bg-blue-950/20">
                                                            <CardHeader className="py-2 px-4">
                                                                <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                                                                    Senior High School (SHS) Information
                                                                </CardTitle>
                                                                <CardDescription className="text-xs text-blue-800 dark:text-blue-300">
                                                                    Please provide details about your Senior High School. Strictly no abbreviations.
                                                                </CardDescription>
                                                            </CardHeader>
                                                            <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-3 px-4 pb-4">
                                                                <div className="lg:col-span-2">
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Name of Senior High School Attended/Graduated in (Strictly no abbreviation){" "}
                                                                        <span className="text-red-500">*</span>
                                                                    </label>
                                                                    <input type="text" name="shs_name" placeholder="Your answer"
                                                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
                                                                        focus:border-blue-500 focus:ring focus:ring-blue-200 
                                                                        dark:border-zinc-700 dark:bg-zinc-900" />
                                                                </div>
                                                                <div className="lg:col-span-1">
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        School Address (Senior High School) <span className="text-red-500">*</span>
                                                                    </label>
                                                                    <input type="text" name="shs_address" placeholder="Your answer"
                                                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm 
                                                                        focus:border-blue-500 focus:ring focus:ring-blue-200 
                                                                        dark:border-zinc-700 dark:bg-zinc-900" />
                                                                </div>
                                                                {/* Type of School */}
                                                                <div className="lg:col-span-1">
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Type of School <span className="text-red-500">*</span>
                                                                    </label>
                                                                    <div className="flex flex-row gap-4 text-sm" data-group="shs_school_type">
                                                                        {["Public", "Private"].map((type) => (
                                                                            <label key={type} className="flex items-center gap-2">
                                                                                <input
                                                                                    type="radio"
                                                                                    name="shs_school_type"
                                                                                    value={type}
                                                                                    className="h-4 w-4"
                                                                                />
                                                                                {type}
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        General Weighted Average (GWA) of<br />
                                                                        1st Semester Grade 12 <span className="text-red-500">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        name="gwa_g12_s1"
                                                                        placeholder="Value (80-100)"
                                                                        className="input-primary"
                                                                        min={80}
                                                                        max={100}
                                                                        step={1}
                                                                        inputMode="numeric"
                                                                        onChange={handleGwaChange}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        General Weighted Average (GWA) of<br />
                                                                        2nd Semester Grade 12 <span className="text-red-500">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        name="gwa_g12_s2"
                                                                        placeholder="Value (80-100)"
                                                                        className="input-primary"
                                                                        min={80}
                                                                        max={100}
                                                                        step={1}
                                                                        inputMode="numeric"
                                                                        onChange={handleGwaChange}
                                                                    />
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>





                                                    {/* === CHED Memorandum (Thumbnail) === */}
                                                    <div className="lg:col-span-3">
                                                        <label className="mb-1 block text-sm font-medium">
                                                            CHED Memorandum: Gender and Development StuFAPs Slot Allocation For SY 2011-2012
                                                        </label>

                                                        {/* Stack on mobile/tablet; row on large screens */}
                                                        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900 lg:flex-row lg:items-center">
                                                            {/* Thumbnail */}
                                                            <a
                                                                href="/files/memorandum.jpg"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="shrink-0 self-center lg:self-auto"
                                                            >
                                                                <img
                                                                    src="/files/memorandum.jpg"
                                                                    alt="CHED Memorandum"
                                                                    loading="lazy"
                                                                    className="h-24 w-auto rounded-md border border-zinc-300 object-cover hover:opacity-90 dark:border-zinc-600 md:h-28"
                                                                />
                                                            </a>

                                                            {/* Right side: link + dropdown */}
                                                            <div className="flex flex-1 min-w-0 flex-col gap-2">
                                                                <a
                                                                    href="/files/memorandum.jpg"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 break-words"
                                                                >
                                                                    View Full Memorandum
                                                                </a>

                                                                <select
                                                                    name="gad_stufaps_course"
                                                                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 lg:w-64"
                                                                >
                                                                    <option value="">Choose</option>
                                                                    <option value="Bachelor of Marine and Transportation">
                                                                        Bachelor of Marine and Transportation
                                                                    </option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>




                                                </div>
                                            </CardContent>
                                        </Card>
                                    </section>


                                    <section className="w-full mt-4">
                                        <Card className="rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-3">
                                                    <span
                                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1e3c73] text-white font-bold text-base shadow border-2 border-[#25468a]"
                                                        aria-hidden
                                                    >
                                                        5
                                                    </span>
                                                    Step 5: Parents &amp; Guardian Information
                                                </CardTitle>
                                            </CardHeader>

                                            <CardContent className="space-y-10">

                                                {/* === Father Information === */}
                                                <div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <h3 className="mb-3 text-sm font-semibold text-[#1e3c73] dark:text-zinc-200">
                                                            Father’s Information
                                                        </h3>

                                                        <div className="flex items-center gap-5">
                                                            <label htmlFor="father-na" className="flex items-center gap-2 text-sm">
                                                                <Checkbox id="father-na" checked={fatherNA} onCheckedChange={onFatherNAChange} />
                                                                <span>N/A</span>
                                                            </label>
                                                            <label htmlFor="father-deceased" className="flex items-center gap-2 text-sm">
                                                                <Checkbox id="father-deceased" checked={fatherDeceased} onCheckedChange={onFatherDeceasedChange} />
                                                                <span>Deceased</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div className="relative">


                                                        {/* REPLACE the wrapper around the grid with this (remove the overlay entirely) */}
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">
                                                                    Full Name <span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    ref={fatherNameRef}
                                                                    type="text"
                                                                    name="father_name"
                                                                    placeholder="Your answer"
                                                                    className="input-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                                                    disabled={fatherFieldsDisabled}
                                                                    aria-disabled={fatherFieldsDisabled}
                                                                    title={fatherFieldsDisabled ? "Disabled by N/A" : ""}
                                                                    required={!fatherFieldsDisabled}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">
                                                                    Occupation <span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    ref={fatherOccRef}
                                                                    type="text"
                                                                    name="father_occupation"
                                                                    placeholder="Your answer"
                                                                    className="input-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                                                    disabled={fatherFieldsDisabled}
                                                                    aria-disabled={fatherFieldsDisabled}
                                                                    title={fatherFieldsDisabled ? "Disabled by N/A" : ""}
                                                                    required={!fatherFieldsDisabled}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">
                                                                    Gross Monthly Income <span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    ref={fatherMonthlyRef}
                                                                    type="text"
                                                                    name="father_income_monthly"
                                                                    placeholder="e.g., 10000"
                                                                    className="input-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                                                    inputMode="numeric"
                                                                    onInput={(e) => {
                                                                        const t = e.currentTarget;
                                                                        t.value = t.value.replace(/\D/g, "");
                                                                        setFatherMonthly(t.value);
                                                                    }}
                                                                    disabled={fatherFieldsDisabled}
                                                                    aria-disabled={fatherFieldsDisabled}
                                                                    title={fatherFieldsDisabled ? "Disabled by N/A" : ""}
                                                                    required={!fatherFieldsDisabled}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">
                                                                    Gross Yearly Income <span className="text-red-500">*</span>
                                                                </label>
                                                                {/* Visible, non-editable display */}
                                                                <input
                                                                    type="text"
                                                                    className="input-primary bg-gray-100 text-gray-500 cursor-not-allowed border-dashed border-2 border-gray-300"
                                                                    value={!fatherNA && fatherMonthly ? fmt(getYearly(fatherMonthly)) : ""}
                                                                    placeholder="Auto-calculated"
                                                                    disabled
                                                                    aria-readonly="true"
                                                                    aria-disabled="true"
                                                                    tabIndex={-1}
                                                                />
                                                                <span className="text-xs text-gray-500 italic block mt-1">
                                                                    Auto-calculated from monthly income (read-only)
                                                                </span>

                                                                <input
                                                                    type="hidden"
                                                                    name="father_income_yearly_bracket"
                                                                    value={!fatherNA && fatherMonthly ? String(getYearly(fatherMonthly)) : ""}
                                                                />
                                                            </div>
                                                        </div>

                                                    </div>

                                                    {/* Optional: send flags */}
                                                    <input type="hidden" name="father_na" value={fatherNA ? "1" : "0"} />
                                                    <input type="hidden" name="father_deceased" value={fatherDeceased ? "1" : "0"} />
                                                </div>


                                                {/* === Mother Information === */}
                                                <div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <h3 className="mb-3 text-sm font-semibold text-[#1e3c73] dark:text-zinc-200">
                                                            Mother’s Information
                                                        </h3>

                                                        <div className="flex items-center gap-5">
                                                            <label htmlFor="mother-na" className="flex items-center gap-2 text-sm">
                                                                <Checkbox id="mother-na" checked={motherNA} onCheckedChange={onMotherNAChange} />
                                                                <span>N/A</span>
                                                            </label>
                                                            <label htmlFor="mother-deceased" className="flex items-center gap-2 text-sm">
                                                                <Checkbox id="mother-deceased" checked={motherDeceased} onCheckedChange={onMotherDeceasedChange} />
                                                                <span>Deceased</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div className="relative">

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">
                                                                    Full Name <span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    ref={motherNameRef}
                                                                    type="text"
                                                                    name="mother_name"
                                                                    placeholder="Your answer"
                                                                    className="input-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                                                    disabled={motherFieldsDisabled}
                                                                    aria-disabled={motherFieldsDisabled}
                                                                    title={motherFieldsDisabled ? "Disabled by N/A" : ""}
                                                                    required={!motherFieldsDisabled}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">
                                                                    Occupation <span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    ref={motherOccRef}
                                                                    type="text"
                                                                    name="mother_occupation"
                                                                    placeholder="Your answer"
                                                                    className="input-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                                                    disabled={motherFieldsDisabled}
                                                                    aria-disabled={motherFieldsDisabled}
                                                                    title={motherFieldsDisabled ? "Disabled by N/A" : ""}
                                                                    required={!motherFieldsDisabled}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">
                                                                    Gross Monthly Income <span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    ref={motherMonthlyRef}
                                                                    type="text"
                                                                    name="mother_income_monthly"
                                                                    placeholder="e.g., 10000"
                                                                    className="input-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                                                    inputMode="numeric"
                                                                    onInput={(e) => {
                                                                        const t = e.currentTarget;
                                                                        t.value = t.value.replace(/\D/g, "");
                                                                        setMotherMonthly(t.value);
                                                                    }}
                                                                    disabled={motherFieldsDisabled}
                                                                    aria-disabled={motherFieldsDisabled}
                                                                    title={motherFieldsDisabled ? "Disabled by N/A" : ""}
                                                                    required={!motherFieldsDisabled}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">
                                                                    Gross Yearly Income <span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="input-primary bg-gray-100 text-gray-500 cursor-not-allowed border-dashed border-2 border-gray-300"
                                                                    value={!motherNA && motherMonthly ? fmt(getYearly(motherMonthly)) : ""}
                                                                    placeholder="Auto-calculated"
                                                                    disabled
                                                                    aria-readonly="true"
                                                                    aria-disabled="true"
                                                                    tabIndex={-1}
                                                                />
                                                                <span className="text-xs text-gray-500 italic block mt-1">
                                                                    Auto-calculated from monthly income (read-only)
                                                                </span>

                                                                <input
                                                                    type="hidden"
                                                                    name="mother_income_yearly_bracket"
                                                                    value={!motherNA && motherMonthly ? String(getYearly(motherMonthly)) : ""}
                                                                />
                                                            </div>
                                                        </div>

                                                    </div>

                                                    <input type="hidden" name="mother_na" value={motherNA ? "1" : "0"} />
                                                    <input type="hidden" name="mother_deceased" value={motherDeceased ? "1" : "0"} />
                                                </div>


                                                {/* === Guardian Information === */}
                                                {showGuardian && (
                                                    <div>
                                                        <h3 className="mb-3 text-sm font-semibold text-[#1e3c73] dark:text-zinc-200">
                                                            Guardian’s Information
                                                        </h3>

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">
                                                                    Full Name <span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="guardian_name"
                                                                    placeholder="Your answer"
                                                                    className="input-primary"
                                                                    required
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">
                                                                    Occupation <span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="guardian_occupation"
                                                                    placeholder="Your answer"
                                                                    className="input-primary"
                                                                    required
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">
                                                                    Gross Monthly Income <span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    name="guardian_income_monthly"
                                                                    placeholder="Your answer"
                                                                    className="input-primary"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            </CardContent>
                                        </Card>
                                    </section>



                                    <section className="w-full mt-4">
                                        <Card className="rounded-2xl border border-zinc-200/80 bg-white/75 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">
                                            <CardHeader className="pb-2">

                                                <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-3">
                                                    <span
                                                        className="
                                                            flex h-7 w-7 items-center justify-center rounded-full
                                                            bg-[#1e3c73] text-white font-bold text-base shadow
                                                            border-2 border-[#25468a]
                                                        "
                                                        aria-hidden
                                                    >
                                                        6
                                                    </span>
                                                    Step 6: Attachments


                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-8">

                                                <div className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-200">
                                                    <strong>NOTE:</strong> All uploaded documents must be:
                                                    <ul className="mt-1 list-disc pl-5 space-y-0.5">
                                                        <li>Whole page readable — do not crop the document.</li>
                                                        <li>Upload only <strong>1 PDF file</strong> per field.</li>
                                                        <li>Maximum file size: <strong>10 MB</strong>.</li>
                                                    </ul>
                                                </div>


                                                {/* === Application Form Upload (no Badge) === */}
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        Accomplished Application Form <span className="text-red-500">*</span>
                                                    </label>

                                                    {/* Badge-like container */}
                                                    <div
                                                        className="rounded-xl mb-2 w-full border border-blue-200 bg-blue-50/70 p-3 text-sm text-blue-900
               dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200"
                                                    >
                                                        {/* Instruction row */}
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <FileText className="h-4 w-4" />
                                                                <span className="font-medium">Application Form:</span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <p className="leading-tight">

                                                                    Download the form

                                                                    , fill it out completely, scan as PDF, then upload below.
                                                                </p>
                                                                <a
                                                                    href="/files/CMSP_ANNEX_A-APPLICATION_FORM_2025-2026.pdf"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"

                                                                    className="inline-flex items-center bg-white hover:bg-gray-100 text-blue-600 hover:text-blue-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                                >
                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                    Download Form
                                                                </a>
                                                            </div>
                                                        </div>

                                                        {/* Upload area */}
                                                        <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-900/30">
                                                            <div className="relative">
                                                                <label htmlFor="application_form" className="sr-only">
                                                                    Upload accomplished application form (PDF)
                                                                </label>
                                                                <input
                                                                    id="application_form"
                                                                    ref={appFormRef}
                                                                    type="file"
                                                                    name="application_form"
                                                                    accept="application/pdf"
                                                                    onChange={(e) => setHasAppForm(!!e.currentTarget.files?.length)}
                                                                    className="
            w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm transition-colors
            file:mr-3 file:rounded-md file:border-0 file:bg-[#1e3c73] file:px-3 file:py-1.5
            file:text-sm file:font-medium file:text-white hover:file:bg-[#25468a]
            focus:border-blue-500 focus:ring focus:ring-blue-200
            dark:border-zinc-700 dark:bg-zinc-900 dark:file:bg-[#1e3c73] dark:hover:file:bg-[#25468a]
            disabled:cursor-not-allowed disabled:opacity-60
            disabled:file:bg-zinc-300 disabled:file:text-zinc-600 disabled:hover:file:bg-zinc-300
            dark:disabled:file:bg-zinc-700 dark:disabled:file:text-zinc-400 dark:disabled:hover:file:bg-zinc-700
          "
                                                                />

                                                                {hasAppForm && (
                                                                    <button
                                                                        type="button"
                                                                        aria-label="Clear file"
                                                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1
                       text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100
                       dark:hover:bg-zinc-800 disabled:opacity-50"
                                                                        onClick={() => {
                                                                            if (!appFormRef.current || appFormRef.current.disabled) return;
                                                                            appFormRef.current.value = '';
                                                                            setHasAppForm(false);
                                                                            appFormRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                                                                            appFormRef.current.focus();
                                                                            clearFile(appFormRef.current, () => setHasAppForm(false));
                                                                        }}
                                                                        disabled={appFormRef.current?.disabled}
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>


                                                        </div>
                                                    </div>
                                                </div>


                                                {/* === Required Documents === */}
                                                <div>
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                        {[

                                                            { name: "grades_g12_s1", label: "Grades/Report Card of 1st Semester in Grade 12" },
                                                            { name: "grades_g12_s2", label: "Grades/Report Card of 2nd Semester in Grade 12" },
                                                            { name: "birth_certificate", label: "Birth Certificate" },
                                                        ].map(({ name, label }) => (
                                                            <div key={name}>
                                                                <label htmlFor={name} className="mb-1 block text-sm font-medium">
                                                                    {label} <span className="text-red-500">*</span>
                                                                </label>


                                                                <div className="relative">
                                                                    <input
                                                                        id={name}
                                                                        name={name}
                                                                        type="file"
                                                                        required
                                                                        accept="application/pdf"
                                                                        ref={(el) => { fileRefs.current[name] = el; }}
                                                                        onChange={(e) => {
                                                                            const file = e.currentTarget.files?.[0];
                                                                            if (!file) { setHasFileMap(m => ({ ...m, [name]: false })); return; }
                                                                            const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
                                                                            if (!isPdf) {
                                                                                toast.error("PDF only.");
                                                                                e.currentTarget.value = "";
                                                                                setHasFileMap(m => ({ ...m, [name]: false }));
                                                                                return;
                                                                            }
                                                                            if (file.size > 10 * 1024 * 1024) {
                                                                                toast.error("Max file size is 10 MB.");
                                                                                e.currentTarget.value = "";
                                                                                setHasFileMap(m => ({ ...m, [name]: false }));
                                                                                return;
                                                                            }
                                                                            setHasFileMap(m => ({ ...m, [name]: true }));
                                                                        }}
                                                                        className="
        w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm transition-colors
        file:mr-3 file:rounded-md file:border-0 file:bg-[#1e3c73] file:px-3 file:py-1.5
        file:text-sm file:font-medium file:text-white
        hover:file:bg-[#25468a]
        focus:border-blue-500 focus:ring focus:ring-blue-200
        dark:border-zinc-700 dark:bg-zinc-900 dark:file:bg-[#1e3c73] dark:hover:file:bg-[#25468a]
        /* Disabled look for the whole control and the native file button */
        disabled:cursor-not-allowed disabled:opacity-60
        disabled:file:bg-zinc-300 disabled:file:text-zinc-600 disabled:hover:file:bg-zinc-300
        dark:disabled:file:bg-zinc-700 dark:disabled:file:text-zinc-400 dark:disabled:hover:file:bg-zinc-700
        "
                                                                    />

                                                                    {hasFileMap[name] && (
                                                                        <button
                                                                            type="button"
                                                                            aria-label="Clear file"
                                                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1
                    text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100
                    dark:hover:bg-zinc-800 disabled:opacity-50"
                                                                            onClick={() => {
                                                                                const el = fileRefs.current[name];
                                                                                if (!el || el.disabled) return;
                                                                                el.value = "";
                                                                                setHasFileMap(m => ({ ...m, [name]: false }));
                                                                                el.dispatchEvent(new Event("change", { bubbles: true }));
                                                                                el.focus();
                                                                                clearFile(fileRefs.current[name], () =>
                                                                                    setHasFileMap(m => ({ ...m, [name]: false }))
                                                                                );
                                                                            }}
                                                                            disabled={fileRefs.current[name]?.disabled}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    )}
                                                                </div>

                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* === Proof of Income === */}
                                                <div>
                                                    <h3 className="mb-3 text-sm font-semibold dark:text-zinc-200">
                                                        Proof of Income <span className="text-red-500">*</span>
                                                    </h3>

                                                    {/* Strong Emphasis */}
                                                    <div className="mb-3 rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-200">
                                                        You are required to upload <strong>ONLY ONE</strong> of the following documents:
                                                    </div>

                                                    {/* List of options */}
                                                    <ul className="mb-3 list-disc pl-5 text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
                                                        <li>Latest ITR of parents or guardian if employed</li>
                                                        <li>Certificate of Tax Exemption/Non-Filer issued by BIR</li>
                                                        <li>
                                                            Certified true copy of latest contract or proof of income (for children of Overseas Filipino Workers and Seafarers)
                                                        </li>
                                                        <li>Social Case Study Report issued by CSWD/MSWD</li>
                                                    </ul>



                                                    {/* File Upload */}
                                                    <div className="relative">
                                                        <input
                                                            ref={proofIncomeRef}
                                                            type="file"
                                                            accept="application/pdf"
                                                            name="proof_of_income"
                                                            onChange={(e) => {
                                                                const file = e.currentTarget.files?.[0];
                                                                if (!file) { setHasProofIncome(false); return; }

                                                                const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
                                                                if (!isPdf) {
                                                                    toast.error("PDF only.");
                                                                    e.currentTarget.value = "";
                                                                    setHasProofIncome(false);
                                                                    return;
                                                                }
                                                                if (file.size > 10 * 1024 * 1024) {
                                                                    toast.error("Max file size is 10 MB.");
                                                                    e.currentTarget.value = "";
                                                                    setHasProofIncome(false);
                                                                    return;
                                                                }
                                                                setHasProofIncome(true);
                                                            }}
                                                            className="
        w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm transition-colors
        file:mr-3 file:rounded-md file:border-0 file:bg-[#1e3c73] file:px-3 file:py-1.5 
        file:text-sm file:font-medium file:text-white 
        hover:file:bg-[#25468a] 
        focus:border-blue-500 focus:ring focus:ring-blue-200 
        dark:border-zinc-700 dark:bg-zinc-900 dark:file:bg-[#1e3c73] dark:hover:file:bg-[#25468a]
        disabled:cursor-not-allowed disabled:opacity-60
        disabled:file:bg-zinc-300 disabled:file:text-zinc-600 disabled:hover:file:bg-zinc-300
        dark:disabled:file:bg-zinc-700 dark:disabled:file:text-zinc-400 dark:disabled:hover:file:bg-zinc-700
      "
                                                        />

                                                        {hasProofIncome && (
                                                            <button
                                                                type="button"
                                                                aria-label="Clear file"
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1
                   text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100
                   dark:hover:bg-zinc-800 disabled:opacity-50"
                                                                onClick={() => {
                                                                    if (!proofIncomeRef.current || proofIncomeRef.current.disabled) return;
                                                                    proofIncomeRef.current.value = "";
                                                                    setHasProofIncome(false);
                                                                    proofIncomeRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                                                                    proofIncomeRef.current.focus();
                                                                }}
                                                                disabled={proofIncomeRef.current?.disabled}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>


                                                </div>


                                                {/* === Special Group === */}
                                                <div>
                                                    <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                                        Check if the applicant belongs to a Special Group <span className="text-red-500">*</span>
                                                    </h3>

                                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm" data-group="special_groups[]">
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
                                                                    <input
                                                                        type="checkbox"
                                                                        name="special_groups[]"
                                                                        value={option}
                                                                        className="h-4 w-4"
                                                                        onChange={handleSpecialGroupChange}
                                                                    />
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
                                                                "N/A", // always last
                                                            ].map((option, idx) => (
                                                                <label key={idx} className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        name="special_groups[]"
                                                                        value={option}
                                                                        className="h-4 w-4"
                                                                        onChange={handleSpecialGroupChange}
                                                                    />
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
                                                        <p className="text-xs text-justify rounded-md border border-green-200 bg-green-50 px-3 py-2 text-green-800 dark:border-green-600 dark:bg-green-900/30 dark:text-green-200">
                                                            Additional five (5) points in the total score are given to applicants belonging
                                                            to the special group of persons such as the Underprivileged and Homeless Citizens
                                                            under Republic Act (RA) No. 7279, Persons with Disability (PWD) under RA No. 7277
                                                            as amended, Solo Parents and/or their Dependents under RA 8972, Senior Citizens
                                                            under RA 9994, and Indigenous Peoples under RA 8371, after complying with all the
                                                            requirements herein set forth.
                                                        </p>

                                                        <div className="relative mt-2">
                                                            <input
                                                                ref={proofSpecialRef}
                                                                type="file"
                                                                accept="application/pdf"
                                                                name="proof_special_group"
                                                                disabled={naSelected}
                                                                onChange={(e) => {
                                                                    const file = e.currentTarget.files?.[0];
                                                                    if (!file) { setHasProofSpecial(false); return; }
                                                                    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
                                                                    if (!isPdf) {
                                                                        toast.error("PDF only.");
                                                                        e.currentTarget.value = "";
                                                                        setHasProofSpecial(false);
                                                                        return;
                                                                    }
                                                                    if (file.size > 10 * 1024 * 1024) {
                                                                        toast.error("Max file size is 10 MB.");
                                                                        e.currentTarget.value = "";
                                                                        setHasProofSpecial(false);
                                                                        return;
                                                                    }
                                                                    setHasProofSpecial(true);
                                                                }}
                                                                className="
                                                                w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm transition-colors
                                                                file:mr-3 file:rounded-md file:border-0 file:bg-[#1e3c73] file:px-3 file:py-1.5
                                                                file:text-sm file:font-medium file:text-white
                                                                hover:file:bg-[#25468a]
                                                                focus:border-blue-500 focus:ring focus:ring-blue-200
                                                                dark:border-zinc-700 dark:bg-zinc-900 dark:file:bg-[#1e3c73] dark:hover:file:bg-[#25468a]
                                                                /* Disabled styling */
                                                                disabled:cursor-not-allowed disabled:opacity-60
                                                                disabled:file:bg-zinc-300 disabled:file:text-zinc-600
                                                                dark:disabled:file:bg-zinc-700 dark:disabled:file:text-zinc-400
                                                                "
                                                            />

                                                            {hasProofSpecial && (
                                                                <button
                                                                    type="button"
                                                                    aria-label="Clear file"
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1
                    text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100
                    dark:hover:bg-zinc-800 disabled:opacity-50"
                                                                    onClick={() => {
                                                                        if (!proofSpecialRef.current || proofSpecialRef.current.disabled) return;
                                                                        proofSpecialRef.current.value = "";
                                                                        setHasProofSpecial(false);
                                                                        proofSpecialRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                                                                        proofSpecialRef.current.focus();
                                                                    }}
                                                                    disabled={proofSpecialRef.current?.disabled}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>


                                                    </div>

                                                    {/* === Certificate of Guardianship === */}
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">
                                                            Notarized Certificate of Guardianship, issued by the legal
                                                            guardian of the student applicant, if applicable.
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                ref={guardianshipRef}
                                                                type="file"
                                                                accept="application/pdf"
                                                                name="guardianship_certificate"
                                                                onChange={(e) => {
                                                                    const file = e.currentTarget.files?.[0];
                                                                    if (!file) { setHasGuardianship(false); return; }

                                                                    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
                                                                    if (!isPdf) {
                                                                        toast.error("PDF only.");
                                                                        e.currentTarget.value = "";
                                                                        setHasGuardianship(false);
                                                                        return;
                                                                    }
                                                                    if (file.size > 10 * 1024 * 1024) {
                                                                        toast.error("Max file size is 10 MB.");
                                                                        e.currentTarget.value = "";
                                                                        setHasGuardianship(false);
                                                                        return;
                                                                    }
                                                                    setHasGuardianship(true);
                                                                }}
                                                                className="
                                                                w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm transition-colors
                                                                file:mr-3 file:rounded-md file:border-0 file:bg-[#1e3c73] file:px-3 file:py-1.5 
                                                                file:text-sm file:font-medium file:text-white 
                                                                hover:file:bg-[#25468a] 
                                                                focus:border-blue-500 focus:ring focus:ring-blue-200 
                                                                dark:border-zinc-700 dark:bg-zinc-900 dark:file:bg-[#1e3c73] dark:hover:file:bg-[#25468a]
                                                                /* Disabled look */
                                                                disabled:cursor-not-allowed disabled:opacity-60
                                                                disabled:file:bg-zinc-300 disabled:file:text-zinc-600 disabled:hover:file:bg-zinc-300
                                                                dark:disabled:file:bg-zinc-700 dark:disabled:file:text-zinc-400 dark:disabled:hover:file:bg-zinc-700
                                                                "
                                                            />

                                                            {hasGuardianship && (
                                                                <button
                                                                    type="button"
                                                                    aria-label="Clear file"
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1
                                                                            text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100
                                                                            dark:hover:bg-zinc-800 disabled:opacity-50"
                                                                    onClick={() => {
                                                                        if (!guardianshipRef.current || guardianshipRef.current.disabled) return;
                                                                        guardianshipRef.current.value = "";
                                                                        setHasGuardianship(false);
                                                                        guardianshipRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                                                                        guardianshipRef.current.focus();
                                                                    }}
                                                                    disabled={guardianshipRef.current?.disabled}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>



                                                    </div>
                                                </div>




                                            </CardContent>
                                        </Card>
                                    </section>

                                    {/* === Certification & Data Privacy Consent === */}
                                    <section className="w-full mt-4">
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
                                                        <input type="checkbox" name="consent" className="h-4 w-4" value="yes" /> Yes <span className="text-red-500">*</span>
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

                                                className="w-full max-w-xs rounded-lg bg-[#1e3c73] px-6 py-2 text-sm font-medium text-white shadow-sm
                                                hover:bg-[#25468a] focus:outline-none focus:ring-2 focus:ring-[#1e3c73]
                                                disabled:cursor-not-allowed disabled:opacity-50
                                                dark:bg-[#1e3c73] dark:hover:bg-[#25468a] dark:focus:ring-[#1e3c73]"
                                                disabled={isSubmitting}
                                                aria-busy={isSubmitting}
                                            >
                                                {isSubmitting ? 'Processing…' : 'Submit Application'}
                                            </Button>
                                        </div>
                                    </section>
                                </form>

                            </TabsContent>
                            <TabsContent value="req" forceMount className="mt-3 data-[state=inactive]:hidden">

                                {/* Top CMSP card */}
                                <section className="w-full">
                                    <ApplicationInfoCard
                                        ayDeadline={ayDeadline}
                                        formattedDeadline={formattedDeadline}
                                        onTrackClick={() => setTrackOpen(true)}
                                    />
                                </section>

                                {/* Toggleable compact row — 3 columns: 1 (Ineligible) + 2 (Qualifications in 2-inner-cols) */}
                                <section className="w-full mt-4">
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

                            </TabsContent>
                        </Tabs>








                    </main>

                </div>

                <div className="hidden h-14.5 lg:block"></div>
            </div>

            <BackToTopButton />
        </>
    );
}
