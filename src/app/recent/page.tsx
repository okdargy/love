"use client";

import React, { useEffect, useState } from 'react';
import { Spinner } from '@/components/icons';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import Error from '@/components/Error';
import { ArrowLeft, ArrowRight, ArrowRightLeft, History, User } from 'lucide-react';
import Link from 'next/link';

export default function Recent() {
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

    useEffect(() => {
        recent.mutate({
            limit: LIMIT,
            offset: 0
        });
    }, []);

    const handleNextPage = () => {
        setPage(page + 1);

        recent.mutate({
            limit: LIMIT,
            offset: page * LIMIT
        });
    };

    const handlePrevPage = () => {
        setPage(page - 1);

        recent.mutate({
            limit: LIMIT,
            offset: (page - 2) * LIMIT
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-semibold">Recent History</h1>
                <p className="text-neutral-500">Recent history of all indexed items</p>
            </div>

            <div className="border border-neutral-100/10 p-4 rounded-lg shadow-md">
                {recent.isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner width="24" height="24" className="fill-primary" />
                    </div>
                ) : recent.error ? (
                    <Error message={recent.error.message} />
                ) : (
                    <div className='space-y-3'>
                        <ul className="space-y-4">
                            {recent.data?.length == 0 ? (
                                <p className="text-neutral-500">No recent history</p>
                            ) : recent.data?.map(entry => (
                                <li key={entry.id} className="flex justify-between">
                                    <div>
                                        <p className="font-semibold">{entry.username}</p>
                                        <p className="text-sm text-neutral-500">Indexed on {new Date(entry.created_at + " UTC").toLocaleString(undefined, { timeStyle: "long", dateStyle: "short" })}</p>
                                    </div>
                                    <div className='flex gap-x-4'>
                                        <Link href={`/store/${entry.itemId}`} className='my-auto'>
                                            <p className="text-sm text-neutral-500">#{entry.serial}</p>
                                        </Link>
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

            <div className="flex justify-between">
                <Button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="gap-x-2"
                >
                    <ArrowLeft />
                </Button>
                <Button
                    onClick={handleNextPage}
                    disabled={unableForward}
                    className="gap-x-2"
                >
                    <ArrowRight />
                </Button>
            </div>
        </div>
    );
}