import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { LayoutProvider } from '@/contexts/layout-context';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({

    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    defaults: {
        visitOptions: () => {
            return { viewTransition: true };
        },
    },
    setup({ el, App, props }) {
        const root = createRoot(el);


        root.render(
            <LayoutProvider>
                <App {...props} />
            </LayoutProvider>
        );

        // to disable inspect elements long app code
        delete el.dataset.page;

    },

    progress: {
        color: '#db3545',
    },
});

// This will set light / dark mode on load...
initializeTheme();
