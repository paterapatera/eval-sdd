import { Head } from '@inertiajs/react';
import { AnnouncementListItem } from '@/components/announcement-list-item';
import Heading from '@/components/heading';
import { dashboard } from '@/routes';

type RecentAnnouncement = {
    title: string;
};

type PageProps = {
    recentAnnouncements: RecentAnnouncement[];
    emptyMessage: string;
};

export default function Dashboard({
    recentAnnouncements,
    emptyMessage,
}: PageProps) {
    const hasAnnouncements = recentAnnouncements.length > 0;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <section className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <Heading title="Announcements" variant="small" />
                    {hasAnnouncements ? (
                        <div className="space-y-3">
                            {recentAnnouncements.map((announcement) => (
                                <AnnouncementListItem
                                    key={announcement.title}
                                    title={announcement.title}
                                    variant="titleOnly"
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {emptyMessage}
                        </p>
                    )}
                </section>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
