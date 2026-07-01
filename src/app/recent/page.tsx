"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { Spinner } from '@/components/icons';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import Error from '@/components/Error';
import { History, User } from 'lucide-react';
import Link from 'next/link';
import { formatDateWithFallback } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

function RecentHistory() {
    const searchParams = useSearchParams();
    const parsedUserId = Number(searchParams.get('userId'));
    const userId = Number.isInteger(parsedUserId) && parsedUserId > 0 ? parsedUserId : undefined;
    const [page, setPage] = useState(1);
    const [unableForward, setUnableForward] = useState(false);

    const LIMIT = 10;

    const recent = trpc.getAllRecentHistory.useMutation({
        onSuccess: (data) => {
            if(data && data.length < LIMIT) {
                setUnableForward(true);
            } else {
                setUnableForward(false);
            }
        }
    });
    const { mutate } = recent;

    useEffect(() => {
        setPage(1);
        mutate({
            limit: LIMIT,
            offset: 0,
            userId,
        });
    }, [mutate, userId]);

    const handleNextPage = () => {
        setPage(page + 1);

        recent.mutate({
            limit: LIMIT,
            offset: page * LIMIT,
            userId,
        });
    };

    const handlePrevPage = () => {
        setPage(page - 1);

        recent.mutate({
            limit: LIMIT,
            offset: (page - 2) * LIMIT,
            userId,
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-semibold">
                    {userId ? 'Player Recent History' : 'Recent History'}
                </h1>
                <p className="text-muted-foreground">
                    {userId ? `All indexed item history for player #${userId}` : 'Recent history of all indexed items'}
                </p>
            </div>

            <div className="border border-border p-4 rounded-lg shadow-md">
                {recent.isPending ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner width="24" height="24" className="fill-primary" />
                    </div>
                ) : recent.error ? (
                    <Error message={recent.error.message} />
                ) : (
                    <div className='space-y-3'>
                        <ul className="space-y-4">
                            {recent.data?.length == 0 ? (
                                <p className="text-muted-foreground">No recent history</p>
                            ) : recent.data?.map(entry => {
                                const item = Array.isArray(entry.item) ? entry.item[0] : entry.item;

                                return (
                                    <li key={entry.id} className="flex justify-between">
                                        <div>
                                            <p className="font-semibold">
                                                {userId ? item?.name ?? 'Unknown Item' : entry.username}
                                            </p>
                                            <p className="text-sm text-muted-foreground">Indexed on {formatDateWithFallback(entry.created_at, { timeStyle: "long", dateStyle: "short" })}</p>
                                        </div>
                                        <div className='flex gap-x-4'>
                                            <Link href={`/store/${entry.itemId}`} className='my-auto'>
                                                <p className="text-sm text-muted-foreground">#{entry.serial}</p>
                                            </Link>
                                            {!userId && (
                                                <Link href={`/users/${entry.userId}`} className='my-auto'>
                                                    <Button className="gap-x-2" variant={'outline'}>
                                                        <User />
                                                    </Button>
                                                </Link>
                                            )}
                                            <Link href={`/store/${entry.itemId}/${entry.serial}`} className='my-auto'>
                                                <Button className="gap-x-2" variant={'outline'}>
                                                    <History />
                                                </Button>
                                            </Link>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex justify-between">
                <Button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    variant='secondary'
                >
                    Previous
                </Button>
                <Button
                    onClick={handleNextPage}
                    disabled={unableForward}
                    variant='secondary'
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

export default function Recent() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-64">
                <Spinner width="24" height="24" className="fill-primary" />
            </div>
        }>
            <RecentHistory />
        </Suspense>
    );
}
