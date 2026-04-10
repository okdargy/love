"use client";

import { trpc } from "@/app/_trpc/client";
import Error from "@/components/Error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatDateWithFallback } from "@/lib/utils";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { BuildProcedure } from "@trpc/server";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type UserRole = "user" | "developer" | "admin" | "editor";

const roleOptions: UserRole[] = ["user", "developer", "editor", "admin"];

type AdminUser = NonNullable<ReturnType<typeof trpc.getAdminUsers.useMutation>["data"]>["users"][number];

const roleLabel = (role: UserRole) => role.charAt(0).toUpperCase() + role.slice(1);

export default function AdminUsers() {
    const usersPerPage = 5;

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [pendingRoles, setPendingRoles] = useState<Record<string, UserRole>>({});
    const [error, setError] = useState<TRPCClientErrorLike<BuildProcedure<"mutation", any, any>> | null>(null);

    const fetchUsers = (page: number, query?: string) => {
        getUsers.mutate({
            page,
            total: usersPerPage,
            query,
        });
    };

    const getUsers = trpc.getAdminUsers.useMutation({
        onSuccess: (data) => {
            setUsers(data.users);
            setTotalPages(data.totalPages);
            setPendingRoles(
                data.users.reduce<Record<string, UserRole>>((acc, entry) => {
                    acc[entry.id] = entry.role as UserRole;
                    return acc;
                }, {})
            );
            setError(null);
        },
        onError: (err) => {
            setError(err);
        },
    });

    const updateUserRole = trpc.updateUserRole.useMutation({
        onError: (err) => {
            toast.error(err.message);
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

    const searchUsers = (query: string) => {
        setCurrentPage(1);
        fetchUsers(1, query || undefined);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            searchUsers(searchQuery);
        }
    };

    const hasChangedRole = (user: AdminUser) => {
        const pending = pendingRoles[user.id];
        return pending !== undefined && pending !== user.role;
    };

    const handleSaveRole = async (user: AdminUser) => {
        const nextRole = pendingRoles[user.id];

        if (!nextRole || nextRole === user.role) {
            return;
        }

        await updateUserRole.mutateAsync({
            userId: user.id,
            role: nextRole,
        });

        setUsers((prev) => prev.map((entry) => (
            entry.id === user.id
                ? { ...entry, role: nextRole, updated_at: Date.now() }
                : entry
        )));

        toast.success("User role updated");
    };

    if (getUsers.isLoading) {
        return <p>Loading users...</p>;
    }

    if (error) {
        return <Error message={error.message} />;
    }

    return (
        <div className="space-y-3">
            <div className="w-full flex gap-x-2">
                <Input
                    placeholder="Search users"
                    className="w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                />
                <Button onClick={() => searchUsers(searchQuery)}>Search</Button>
            </div>
            {users.length === 0 ? (
                <p>No users found</p>
            ) : (
                <>
                    {users.map((user) => {
                        const selectedRole = pendingRoles[user.id] ?? (user.role as UserRole);
                        const mutationVariables = updateUserRole.variables as { userId: string; role: UserRole } | undefined;
                        const isSavingThisRow = updateUserRole.isLoading && mutationVariables?.userId === user.id;

                        return (
                            <div key={user.id} className="border border-neutral-100/10 rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-1">
                                    <p className="font-semibold leading-none">{user.display_name} <span className="text-neutral-400">(@{user.username})</span></p>
                                    <p className="text-sm text-neutral-400">ID: <code>{user.id}</code></p>
                                    <p className="text-sm text-neutral-400">Created: {formatDateWithFallback(new Date(user.created_at).toISOString(), { timeZoneName: "short" })}</p>
                                    <p className="text-sm text-neutral-400">Updated: {formatDateWithFallback(new Date(user.updated_at).toISOString(), { timeZoneName: "short" })}</p>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <Select
                                        value={selectedRole}
                                        onValueChange={(value) => {
                                            setPendingRoles((prev) => ({
                                                ...prev,
                                                [user.id]: value as UserRole,
                                            }));
                                        }}
                                    >
                                        <SelectTrigger className="w-[170px]">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roleOptions.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {roleLabel(role)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="secondary"
                                        disabled={!hasChangedRole(user) || isSavingThisRow}
                                        onClick={() => handleSaveRole(user)}
                                    >
                                        {isSavingThisRow ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
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
