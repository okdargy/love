'use client';

import { useParams } from 'next/navigation';
import Error from '@/components/Error';
import { trpc } from '@/app/_trpc/client';
import { Spinner } from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowDownUp, User } from 'lucide-react';
import Image from 'next/image';

export default function Page() {
    const pathname = useParams<{ id: string, serial: string }>()

    const id = parseInt(pathname.id);
    const serial = parseInt(pathname.serial);

    if (isNaN(id) || isNaN(serial)) {
        return <Error message="Invalid ID, must be a number" />
    }

    if (id < 1 || serial < 1) {
        return <Error message="Invalid ID, must be greater than 0" />
    }

    const history = trpc.getSerialHistory.useQuery({ id, serial });

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Serial History</h1>
                    <p className="text-neutral-500">History of serial #{serial}{history.data ? ` for ${history.data.itemInfo?.name}` : ''}</p>
                </div>
                <div className="flex gap-x-3">
                    <Link href={`/store/${id}`} className='my-auto'>
                        <Button variant="secondary">
                            View Item
                        </Button>
                    </Link>
                </div>
            </div>
            <div className="border border-neutral-100/10 p-4 rounded-lg shadow-md">
                {history.isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner width="24" height="24" className="fill-primary" />
                    </div>
                ) : history.error ? (
                    <Error message={history.error.message} />
                ) : history.data ? (
                    <div className='space-y-3'>
                        <ul className="space-y-4">
                            {history.data.history.length === 0 ? (
                                <p className="text-neutral-500">No recent history</p>
                            ) : history.data.history.map((entry, index) => (
                                <div key={entry.id}>
                                    <li className="flex justify-between">
                                        <div>
                                            <p className="font-semibold">{entry.username}</p>
                                            <p className="text-sm text-neutral-500">
                                                Indexed on {new Date(entry.created_at + " UTC").toLocaleString(undefined, { timeStyle: "long", dateStyle: "short" })}
                                            </p>
                                        </div>
                                        <div className='flex gap-x-4'>
                                            <Link href={`/users/${entry.userId}`} className='my-auto'>
                                                <Button className="gap-x-2" variant={'outline'}>
                                                    <User />
                                                </Button>
                                            </Link>
                                        </div>
                                    </li>
                                    {history.data && index !== history.data.history.length - 1 && <ArrowDownUp className='mx-auto text-muted' />}
                                </div>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-neutral-500">No data found</p>
                )}
            </div>
        </div>
    );
}
