export type AnnouncementListItemProps = {
    title: string;
    body?: string;
    publishedOn?: string;
    variant?: 'full' | 'titleOnly';
};

export function AnnouncementListItem({
    title,
    body,
    publishedOn,
    variant = 'full',
}: AnnouncementListItemProps) {
    return (
        <article className="space-y-1 border-b border-sidebar-border/70 pb-4 last:border-b-0 dark:border-sidebar-border">
            <h3 className="text-base font-medium">{title}</h3>
            {variant === 'full' && body !== undefined && (
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {body}
                </p>
            )}
            {variant === 'full' && publishedOn !== undefined && (
                <p className="text-xs text-muted-foreground">{publishedOn}</p>
            )}
        </article>
    );
}
