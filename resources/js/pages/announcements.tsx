import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AnnouncementListItem } from '@/components/announcement-list-item';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { announcements } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type AnnouncementRow = {
    title: string;
    body: string;
    publishedOn: string;
};

type PaginatedAnnouncements = {
    data: AnnouncementRow[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type PageProps = {
    announcements: PaginatedAnnouncements;
};

const emptyMessage = 'お知らせはありません';

export default function Announcements({ announcements: paginator }: PageProps) {
    const hasAnnouncements = paginator.data.length > 0;

    return (
        <>
            <Head title="Announcements" />
            <div className="flex flex-col gap-6 p-4">
                <Heading title="Announcements" />
                {hasAnnouncements ? (
                    <div className="space-y-4">
                        {paginator.data.map((announcement) => (
                            <AnnouncementListItem
                                key={`${announcement.title}-${announcement.publishedOn}`}
                                title={announcement.title}
                                body={announcement.body}
                                publishedOn={announcement.publishedOn}
                            />
                        ))}
                        <nav
                            className="flex flex-wrap gap-2"
                            aria-label="Pagination"
                        >
                            {paginator.links
                                .filter((link) => link.url !== null)
                                .map((link) => (
                                    <Link
                                        key={link.label}
                                        href={link.url!}
                                        className={
                                            link.active
                                                ? 'text-sm font-medium'
                                                : 'text-sm text-muted-foreground hover:text-foreground'
                                        }
                                        preserveScroll
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                        </nav>
                    </div>
                ) : (
                    <p className="text-muted-foreground">{emptyMessage}</p>
                )}
            </div>
        </>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Announcements',
        href: announcements(),
    },
];

Announcements.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
