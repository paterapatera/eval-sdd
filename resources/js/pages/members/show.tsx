import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';

type Member = {
    id: number;
    name: string;
    bioDisplay: string;
    memberSinceLabel: string;
};

export default function MemberShow({ member }: { member: Member }) {
    return (
        <>
            <Head title={member.name} />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={member.name}
                    description={member.memberSinceLabel}
                />

                <div className="space-y-2">
                    <h2 className="text-sm font-medium text-muted-foreground">
                        Bio
                    </h2>
                    <p className="whitespace-pre-wrap text-sm">
                        {member.bioDisplay}
                    </p>
                </div>
            </div>
        </>
    );
}
