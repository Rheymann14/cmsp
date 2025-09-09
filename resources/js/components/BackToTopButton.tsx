import React, { useState, useEffect } from 'react';

const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={
        "fixed bottom-8 right-8 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg " +
        "hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 " +
        "dark:bg-[#EDEDEC] dark:text-[#1C1C1A] dark:hover:bg-white dark:hover:text-[#1C1C1A] " +
        "dark:focus:ring-[#3E3E3A] transition"
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    </button>
  );
};

export default BackToTopButton;