import React, { useState, useEffect } from 'react';
import { Spinner } from '@/components/icons';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ArrowRightLeft, Eye, User } from 'lucide-react';
import Link from 'next/link';
import Error from '@/components/Error';

export default function Owners({ id, setHoardRate }: { id: number; setHoardRate: React.Dispatch<React.SetStateAction<number>> }) {
    const [page, setPage] = useState(1);
    const LIMIT_PER_PAGE = 5;
    const owners = trpc.getAllItemOwners.useQuery(id);

    useEffect(() => {
        if (owners.data) {
            let total = 0;
            let hoardedTotal = 0;

            owners.data.forEach(owner => {
                total += owner.serials.length;

                if (owner.serials.length > 1) {
                    hoardedTotal += owner.serials.length - 1;
                }
            });

            setHoardRate(hoardedTotal / total * 100);
        }
    }, [owners.data]);

    const handleNextPage = () => {
        if (!owners.isLoading && owners.data) {
            setPage(prevPage => prevPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (page > 1) {
            setPage(prevPage => prevPage - 1);
        }
    };

    return (
        <div className="border border-neutral-100/10 p-4 rounded-lg shadow-md">
            {owners.isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner width="24" height="24" className="fill-primary" />
                </div>
            ) : owners.error ? (
                <Error message={owners.error.message} />
            ) : (
                <div className='space-y-3'>
                    <ul className="space-y-4">
                        {owners.data.slice((page - 1) * LIMIT_PER_PAGE, page * LIMIT_PER_PAGE).map(owner => (
                            <li key={owner.id} className="flex justify-between">
                                <div>
                                    <p className="font-semibold">{owner.username}</p>
                                    <p className="text-sm text-neutral-500">Owns {owner.serials.length} {owner.serials.length === 1 ? 'copy' : 'copies'}</p>
                                </div>
                                <div className='space-x-2'>
                                    <Link href={`/users/${owner.id}`} className='my-auto'>
                                        <Button className="gap-x-2" variant={'outline'}>
                                            <User />
                                        </Button>
                                    </Link>
                                    <Link href={`https://polytoria.com/trade/new/${owner.id}`} className='my-auto'>
                                        <Button className="gap-x-2" variant={'outline'}>
                                            <ArrowRightLeft />
                                        </Button> 
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-between">
                        <Button
                            onClick={handlePreviousPage}
                            disabled={page === 1}
                            variant='secondary'
                        >
                            Previous
                        </Button>
                        <span className="text-neutral-600 text-sm my-auto">{owners.data.length <= page * LIMIT_PER_PAGE ? owners.data.length : page * LIMIT_PER_PAGE}/{owners.data.length}</span>
                        <Button
                            onClick={handleNextPage}
                            disabled={owners.data.length <= page * LIMIT_PER_PAGE}
                            variant='secondary'
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}