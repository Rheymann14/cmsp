import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun, Clipboard, BarChart2, BookOpen, LifeBuoy } from 'lucide-react';
import BackToTopButton from '@/components/BackToTopButton';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const { appearance, updateAppearance } = useAppearance();
    const isDark = appearance === 'dark';
    const [qrOpen, setQrOpen] = useState(false);

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="fixed start-0 top-0 z-20 w-full border-b border-gray-200 bg-[#1e3c72] dark:border-[#3E3E3A] dark:bg-[#161615]">
                        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">
                            <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                                <img src="/ched_logo.png" className="h-8" alt="Logo" />
                                <div className="flex flex-col">
                                    <span className="hidden lg:block self-center text-2xs font-semibold whitespace-nowrap text-white dark:text-[#EDEDEC]">
                                        COMMISSION ON HIGHER EDUCATION
                                    </span>
                                    <span className="lg:hidden sm:block  text-2xs font-semibold whitespace-nowrap text-white dark:text-[#EDEDEC]">
                                        CHED
                                    </span>
                                    <span className="hidden lg:block text-2xs font-semibold whitespace-nowrap text-white dark:text-[#EDEDEC]">
                                        CHED System
                                    </span>
                                    <span className="lg:hidden sm:block text-2xs font-semibold whitespace-nowrap text-white dark:text-[#EDEDEC]">
                                        System
                                    </span>
                                </div>
                            </a>

                            <div className="flex items-center space-x-2 md:order-2 rtl:space-x-reverse">

                                <a
                                    href={route('login')}
                                    className="rounded-lg bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 px-4 py-2 text-center text-sm font-medium text-white  focus:ring-4  focus:outline-none dark:bg-[#EDEDEC] dark:text-[#1C1C1A] dark:hover:bg-white dark:hover:text-[#1C1C1A] dark:focus:ring-[#3E3E3A]"
                                >
                                    Log in
                                </a>
                                <button
                                    onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
                                    className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 transition-colors duration-300 hover:ring-2 hover:ring-blue-500"
                                    aria-label="Toggle dark mode"
                                >
                                    <Sun
                                        className={`absolute h-4 w-4 text-blue-900 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'
                                            }`}
                                    />
                                    <Moon
                                        className={`absolute h-4 w-4 text-blue-400 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'
                                            }`}
                                    />
                                </button>


                            </div>

                        </div>
                    </nav>

                </header>
                <div className="flex mt-6 w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0 mt-10 lg:mt-6">
                    <main className="flex w-full max-w-[335px] flex-col-reverse lg:max-w-4xl lg:flex-row">
                

                        {/* Feature Cards */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow hover:shadow-md transition">
                                <div className="flex items-center mb-4">
                                    <Clipboard className="h-6 w-6 text-blue-600 mr-3" />
                                    <h3 className="text-lg font-medium  dark:text-gray-400">Feedback</h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">Provide your valuable insights to improve our services.</p>
                                <Link href="/feedback" className="text-blue-600 dark:text-blue-400 font-medium">Give Feedback →</Link>
                            </div>
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow hover:shadow-md transition">
                                <div className="flex items-center mb-4">
                                    <BarChart2 className="h-6 w-6 text-blue-600 mr-3" />
                                    <h3 className="text-lg font-medium  dark:text-gray-400">Reports</h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">Access detailed client satisfaction reports and metrics.</p>
                                <Link href="/reports" className="text-blue-600 dark:text-blue-400 font-medium">View Reports →</Link>
                            </div>
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow hover:shadow-md transition">
                                <div className="flex items-center mb-4">
                                    <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
                                    <h3 className="text-lg font-medium  dark:text-gray-400">User Guide</h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">Learn how to navigate and utilize the portal effectively.</p>
                                <Link href="/guide" className="text-blue-600 dark:text-blue-400 font-medium">Read Guide →</Link>
                            </div>
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow hover:shadow-md transition">
                                <div className="flex items-center mb-4">
                                    <LifeBuoy className="h-6 w-6 text-blue-600 mr-3" />
                                    <h3 className="text-lg font-medium  dark:text-gray-400">Support</h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">Get help and assistance whenever you need it.</p>
                                <Link href="/support" className="text-blue-600 dark:text-blue-400 font-medium">Contact Support →</Link>
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
