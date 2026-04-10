"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import Image from "next/image";

import { trpc } from "@/app/_trpc/client";
import useDebounceValue from "@/app/_hooks/useDebounceValue";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Spinner } from "./icons";

interface PlayerSearchProps {
    className?: string;
}

export default function PlayerSearch({ className }: PlayerSearchProps) {
    const router = useRouter();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<Array<{ id: number; username: string; thumbnailUrl: string }>>([]);

    const debouncedQuery = useDebounceValue(query.trim(), 250);
    const searchPlayers = trpc.searchPlayers.useMutation();

    const canSearch = debouncedQuery.length >= 2;

    useEffect(() => {
        const search = async () => {
            if (!canSearch) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            const data = await searchPlayers.mutateAsync({
                input: debouncedQuery,
                limit: 8,
            });

            setResults(data);
            setIsOpen(true);
        };

        search().catch(() => {
            setResults([]);
            setIsOpen(true);
        });
    }, [canSearch, debouncedQuery]);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!wrapperRef.current) {
                return;
            }

            if (!wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const showDropdown = useMemo(() => {
        return isOpen && query.trim().length >= 2;
    }, [isOpen, query]);

    return (
        <div ref={wrapperRef} className={cn("relative z-[90] w-full", className)}>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    value={query}
                    onFocus={() => {
                        if (query.trim().length >= 2) {
                            setIsOpen(true);
                        }
                    }}
                    onChange={(event) => {
                        setQuery(event.target.value);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && results[0]) {
                            router.push(`/users/${results[0].id}`);
                            setIsOpen(false);
                        }
                    }}
                    placeholder="Search players..."
                    className="h-9 pl-9"
                />
                {searchPlayers.isLoading && (
                    <Spinner width="12" height="12" className="fill-primary absolute right-3 top-1/2 -translate-y-1/2" />
                )}
            </div>

            {showDropdown && (
                <div className="absolute z-[100] mt-1 max-h-72 w-full overflow-y-auto rounded-b-md border bg-popover p-1 shadow-xl">
                    {!searchPlayers.isLoading && results.length === 0 && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">No players found.</p>
                    )}

                    {results.map((player) => (
                        <Link
                            key={player.id}
                            href={`/users/${player.id}`}
                            className="flex items-center rounded-sm px-3 py-2 text-sm hover:bg-accent"
                            onClick={() => {
                                setIsOpen(false);
                                setQuery("");
                            }}
                        >
                            <Image src={player.thumbnailUrl.replace('.png', '-icon.png')} alt={player.username} width={24} height={24} className="rounded-full mr-2" />
                            <span>{player.username}</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
