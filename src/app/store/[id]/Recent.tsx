import React from 'react';
import { Spinner } from '@/components/icons';
import Error from '@/components/Error';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { History, User } from 'lucide-react';
import Link from 'next/link';
import { formatDateWithFallback } from '@/lib/utils';

export default function Owners({ id }: { id: number }) {
    const history = trpc.getRecentItemHistory.useQuery(id);

    return (
        <div className="border border-border p-4 rounded-lg shadow-md">
            {history.isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner width="24" height="24" className="fill-primary" />
                </div>
            ) : history.error ? (
                <Error message={history.error.message} />
            ) : (
                <div className='space-y-3'>
                    <ul className="space-y-4">
                        {history.data?.length == 0 ? (
                            <p className="text-muted-foreground">No recent history</p>
                        ) : history.data?.map(entry => (
                            <li key={entry.id} className="flex justify-between">
                                <div>
                                    <p className="font-semibold">{entry.username}</p>
                                    <p className="text-sm text-muted-foreground">Indexed on {formatDateWithFallback(entry.created_at, { timeStyle: "long", dateStyle: "short" })}</p>
                                </div>
                                <div className='flex gap-x-4'>
                                    <p className="text-sm text-muted-foreground my-auto">#{entry.serial}</p>
                                    <Link href={`/users/${entry.userId}`} className='my-auto'>
                                        <Button className="gap-x-2" variant={'outline'}>
                                            <User />
                                        </Button>
                                    </Link>
                                    <Link href={`/store/${entry.itemId}/${entry.serial}`} className='my-auto'>
                                        <Button className="gap-x-2" variant={'outline'}>
                                            <History />
                                        </Button>
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
