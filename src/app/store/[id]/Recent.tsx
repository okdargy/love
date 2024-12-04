import React from 'react';
import { Spinner } from '@/components/icons';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import Error from '@/components/Error';
import { History, User } from 'lucide-react';
import Link from 'next/link';

export default function Owners({ id }: { id: number }) {
    const history = trpc.getRecentItemHistory.useQuery(id);

    return (
        <div className="border border-neutral-100/10 p-4 rounded-lg shadow-md">
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
                            <p className="text-neutral-500">No recent history</p>
                        ) : history.data?.map(entry => (
                            <li key={entry.id} className="flex justify-between">
                                <div>
                                    <p className="font-semibold">{entry.username}</p>
                                    <p className="text-sm text-neutral-500">Indexed on {new Date(entry.created_at).toLocaleString()}</p>
                                </div>
                                <div className='flex gap-x-4'>
                                    <p className="text-sm text-neutral-500 my-auto">#{entry.serial}</p>
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