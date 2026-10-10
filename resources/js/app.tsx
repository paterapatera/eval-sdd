import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const appPages = import.meta.glob('./pages/**/*.{tsx,jsx}');
const modulePages = import.meta.glob(
    '../../Modules/*/resources/js/pages/**/*.{tsx,jsx}',
);

async function resolveInertiaPage(name: string) {
    const segments = name.split('/');

    if (segments.length > 1) {
        const [moduleName, ...pageSegments] = segments;
        const pagePath = pageSegments.join('/');

        for (const extension of ['tsx', 'jsx'] as const) {
            const key = `../../Modules/${moduleName}/resources/js/pages/${pagePath}.${extension}`;

            if (modulePages[key]) {
                const page = (await modulePages[key]()) as {
                    default: ResolvedComponent;
                };

                return page.default;
            }
        }
    }

    return (await resolvePageComponent(
        `./pages/${name}.tsx`,
        appPages,
    ).catch(() =>
        resolvePageComponent(`./pages/${name}.jsx`, appPages),
    )) as ResolvedComponent;
}

void createInertiaApp({
    resolve: (name) => resolveInertiaPage(name),
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
