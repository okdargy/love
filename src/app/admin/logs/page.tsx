"use client";

import { trpc } from '@/app/_trpc/client';
import Error from '@/components/Error';
import { TRPCClientErrorLike } from "@trpc/client";
import { BuildProcedure } from "@trpc/server";
import { useEffect, useState } from 'react';
import Image from "next/image"
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"
import { Label } from '@/components/ui/label';
  
const SheetItem = ({ label, value, code }: { label: string; value: string, code?: boolean }) => (
    <div className='space-y-0.5'>
        <Label className='block'>{label}</Label>
        {code ? (
            <code className='block'>{value}</code>
        ) : (
            <p className='block'>{value}</p>
        )}
    </div>
);

export default function AdminLogs() {
    const [page, setPage] = useState(1);
    const [error, setError] = useState<TRPCClientErrorLike<BuildProcedure<"query", any, any>> | null>(null);
    const [data, setData] = useState<ReturnType<typeof trpc.getAuditLogs.useMutation>['data']>({
        logs: []
    });

    const total = 10;
    const getAuditLogs = trpc.getAuditLogs.useMutation({
        onSuccess: (data) => {
            setData(data);
        },
        onError: (error) => {
            setError(error);
        }
    });

    useEffect(() => {
        getAuditLogs.mutate({
            page,
            total
        });
    }, []);

    return (
        <div>
            {getAuditLogs.isLoading ? (
                <p>Loading...</p>
            ) : error ? (
                <Error message={error.message} />
            ) : data && data.logs.length > 0 ? (
                <div className='space-y-4'>
                    {data?.logs.map(log => (
                        <div key={log.id} className='flex justify-between gap-x-4 w-full border border-gray-100/10 p-3 rounded-md'>
                            <div className='flex gap-x-4'>
                                <Image
                                    src={`https://cdn.discordapp.com/avatars/${log.user.discordId}/${log.user.avatar}.png`}
                                    alt={log.user.display_name}
                                    width={64}
                                    height={64}
                                    className='rounded-full w-10 h-10 my-auto'
                                />
                                <div className='my-auto'>
                                    <p className='text-neutral-400'>✏️ {log.action} to {log.where}</p>
                                    <p className='font-semibold text-md'>{log.user.display_name} ({log.user.username})</p>
                                    <p className='text-neutral-400'>
                                        {new Date(log.timestamp + 'Z').toLocaleString(undefined, {
                                            timeZoneName: 'short'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <Sheet>
                                <SheetTrigger>
                                    <Button variant='secondary'>View</Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                    <SheetTitle>Audit Log</SheetTitle>
                                    <SheetDescription className='space-y-2'>  
                                        <SheetItem label='ID' value={log.id.toString()} />
                                        <SheetItem label='Action' value={log.action} />
                                        <SheetItem label='Table' value={log.where} />
                                        <SheetItem label='Timestamp' value={
                                            new Date(log.timestamp + 'Z').toLocaleString(undefined, {
                                                timeZoneName: 'short'
                                            })
                                        } />
                                        <SheetItem label='User ID' value={log.user.id} />
                                        <SheetItem label='Payload' value={log.payload} code={true} />
                                    </SheetDescription>
                                    </SheetHeader>
                                </SheetContent>
                            </Sheet>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No logs found</p>
            )}
        </div>
    );
};
