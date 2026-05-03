"use client";

import { trpc } from "@/app/_trpc/client";
import Error from "@/components/Error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateWithFallback } from "@/lib/utils";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { BuildProcedure } from "@trpc/server";
import { useEffect, useState } from "react";

type LinkedUser = NonNullable<ReturnType<typeof trpc.getAdminLinkedUsers.useMutation>["data"]>["linkedUsers"][number];

export default function AdminLinkedUsers() {
    const perPage = 25;

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState<TRPCClientErrorLike<BuildProcedure<"mutation", any, any>> | null>(null);

    const fetchUsers = (page: number, query?: string) => {
        getUsers.mutate({ page, total: perPage, query });
    };

    const getUsers = trpc.getAdminLinkedUsers.useMutation({
        onSuccess: (data) => {
            setLinkedUsers(data.linkedUsers);
            setTotalPages(data.totalPages);
            setError(null);
        },
        onError: (err) => {
            setError(err);
        },
    });

    useEffect(() => {
        fetchUsers(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updatePage = (page: number) => {
        setCurrentPage(page);
        fetchUsers(page, searchQuery || undefined);
    };

    const search = (query: string) => {
        setCurrentPage(1);
        fetchUsers(1, query || undefined);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            search(searchQuery);
        }
    };

    if (getUsers.isLoading) {
        return <p>Loading linked users...</p>;
    }

    if (error) {
        return <Error message={error.message} />;
    }

    return (
        <div className="space-y-3">
            <div className="w-full flex gap-x-2">
                <Input
                    placeholder="Search by Polytoria username or LOVE user"
                    className="w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                />
                <Button onClick={() => search(searchQuery)}>Search</Button>
            </div>
            {linkedUsers.length === 0 ? (
                <p>No linked users found</p>
            ) : (
                <>
                    {linkedUsers.map((entry) => (
                        <div key={entry.polytoriaId} className="border border-neutral-100/10 rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                                <p className="font-semibold leading-none">
                                    {entry.polytoriaUsername}{" "}
                                    <span className="text-neutral-400">
                                        (@{entry.display_name})
                                    </span>
                                </p>
                                <p className="text-sm text-neutral-400">
                                    Polytoria ID: <code>{entry.polytoriaId}</code> &middot; LOVE ID: <code>{entry.userId}</code>
                                </p>
                                <p className="text-sm text-neutral-400">
                                    Discord: <code>{entry.discordId}</code> &middot; Role: <code>{entry.role}</code>
                                </p>
                                <p className="text-sm text-neutral-400">
                                    Linked since: {formatDateWithFallback(new Date(entry.userCreatedAt).toISOString(), { timeZoneName: "short" })}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div className='flex justify-between items-center'>
                        <Button variant='secondary' onClick={() => updatePage(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
                        <p className='text-neutral-400'>{currentPage} of {totalPages || 1}</p>
                        <Button variant='secondary' onClick={() => updatePage(currentPage + 1)} disabled={currentPage === (totalPages || 1)}>Next</Button>
                    </div>
                </>
            )}
        </div>
    );
}
