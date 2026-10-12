import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { edit as editLoginHistory } from '@/routes/login-history';

type Entry = {
    loggedAt: string;
    ipAddress: string;
};

type Props = {
    entries: Entry[];
    isEmpty: boolean;
};

export default function LoginHistory({ entries, isEmpty }: Props) {
    return (
        <>
            <Head title="ログイン履歴" />

            <h1 className="sr-only">ログイン履歴</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="ログイン履歴"
                    description="最近のログイン日時と接続元IPを確認できます"
                />

                {isEmpty ? (
                    <p className="text-muted-foreground text-sm">
                        ログイン履歴はありません
                    </p>
                ) : (
                    <ul className="divide-y rounded-md border">
                        {entries.map((entry) => (
                            <li
                                key={`${entry.loggedAt}-${entry.ipAddress}`}
                                data-testid="login-history-entry"
                                className="px-4 py-3 text-sm"
                            >
                                <div className="font-medium">{entry.loggedAt}</div>
                                <div className="text-muted-foreground">
                                    {entry.ipAddress}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

LoginHistory.layout = {
    breadcrumbs: [
        {
            title: 'ログイン履歴',
            href: editLoginHistory(),
        },
    ],
};
