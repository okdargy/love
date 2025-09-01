import React, { useState, useEffect } from 'react';
import { Spinner } from '@/components/icons';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowLeft, ArrowRight, ArrowRightLeft, Eye, User } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Error from '@/components/Error';

export default function Owners({ id, setHoardRate }: { id: number; setHoardRate: React.Dispatch<React.SetStateAction<number>> }) {
    const [page, setPage] = useState(1);
    const LIMIT_PER_PAGE = 5;
    const owners = trpc.getAllItemOwners.useQuery(id);

    const allSerials = React.useMemo(() => {
        if (!owners.data) return [];

        const serials: Array<{ serial: number; username: string; userId: number }> = [];
        owners.data.forEach(owner => {
            owner.serials.forEach(serial => {
                serials.push({
                    serial,
                    username: owner.username,
                    userId: owner.id
                });
            });
        });

        return serials.sort((a, b) => a.serial - b.serial);
    }, [owners.data]);

    // Color mapping for users with multiple serials
    const userColors = React.useMemo(() => {
        if (!owners.data) return {};

        const colors = [
            '#3b82f6', // blue
            '#10b981', // emerald
            '#f59e0b', // amber
            '#ef4444', // red
            '#8b5cf6', // violet
            '#06b6d4', // cyan
            '#f97316', // orange
            '#84cc16', // lime
            '#ec4899', // pink
            '#6366f1', // indigo
        ];

        const colorMap: Record<number, string> = {};
        let colorIndex = 0;

        owners.data.forEach(owner => {
            if (owner.serials.length > 1) {
                colorMap[owner.id] = colors[colorIndex % colors.length];
                colorIndex++;
            }
        });

        return colorMap;
    }, [owners.data]);

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


            const hoardRate = hoardedTotal / total * 100;
            setHoardRate(hoardRate);
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

    const renderListView = () => (
        <div className='space-y-3'>
            <ul className="space-y-4">
                {owners.data!.slice((page - 1) * LIMIT_PER_PAGE, page * LIMIT_PER_PAGE).map(owner => (
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
                <span className="text-neutral-600 text-sm my-auto">{owners.data!.length <= page * LIMIT_PER_PAGE ? owners.data!.length : page * LIMIT_PER_PAGE}/{owners.data!.length}</span>
                <Button
                    onClick={handleNextPage}
                    disabled={owners.data!.length <= page * LIMIT_PER_PAGE}
                    variant='secondary'
                >
                    Next
                </Button>
            </div>
        </div>
    );

    const renderGridView = () => (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(3rem,1fr))] gap-2 max-w-full overflow-x-auto pb-5">
            <TooltipProvider>
                {allSerials.map(({ serial, username, userId }, index) => {
                    const userColor = userColors[userId];

                    return (
                        <Tooltip key={`${serial}-${userId}-${index}`}>
                            <TooltipTrigger asChild>
                                <Link href={`/store/${id}/${serial}`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-12 text-xs font-mono transition-colors"
                                        style={userColor ? {
                                            borderColor: userColor,
                                            borderWidth: '2px'
                                        } : {}}
                                    >
                                        {serial}
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent className="text-center">
                                <div className="font-semibold">{username}</div>
                                <div className="text-gray-300">Serial #{serial}</div>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </TooltipProvider>
        </div>
    )

    return (
        <div className="border border-neutral-100/10 p-4 rounded-lg shadow-md">
            {owners.isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner width="24" height="24" className="fill-primary" />
                </div>
            ) : owners.error ? (
                <Error message={owners.error.message} />
            ) : (
                <Tabs defaultValue="list" className="space-y-4">
                    <TabsList>
                        <div>
                            <TabsTrigger value="list">List View</TabsTrigger>
                            <TabsTrigger value="grid">Grid View</TabsTrigger>
                        </div>
                    </TabsList>
                    <TabsContent value="list">
                        {renderListView()}
                    </TabsContent>
                    <TabsContent value="grid">
                        {renderGridView()}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}