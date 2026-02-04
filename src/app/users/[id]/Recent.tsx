"use client";

import { trpc } from '@/app/_trpc/client';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Spinner } from '@/components/icons';
import Error from '@/components/Error';
import { History, User } from 'lucide-react';

export default function Recent({ id }: { id: number }) {
    const res = trpc.getUsersLatestHistory.useQuery(id);

    return (
        <div className="border border-neutral-100/10 rounded-md p-4">
            {res.isLoading ?
                <div className="flex justify-center items-center h-64">
                    <Spinner width="24" height="24" className="fill-primary" />
                </div> : res.error ? <Error message={res.error.message} />
                    : res.data && res.data.length == 0 ? <div className="flex flex-col items-center justify-center space-y-2">
                        <p className="text-neutral-500 text-center">No recent history</p>
                    </div> :
                        <div className='space-y-3'>
                            <ul className="space-y-4">
                                {res.data?.map(entry => (
                                    <li key={entry.id} className="flex justify-between">
                                        <div>
                                            <p className="font-semibold">{entry.item.name}</p>
                                            <p className="text-sm text-neutral-500">Indexed on {new Date(entry.created_at + " UTC").toLocaleString(undefined, { timeStyle: "long", dateStyle: "short" })}</p>
                                        </div>
                                        <div className='flex gap-x-4'>
                                            <Link href={`/store/${entry.itemId}`} className='my-auto'>
                                                <p className="text-sm text-neutral-500 my-auto">#{entry.serial}</p>
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
            }
        </div>
    );
}