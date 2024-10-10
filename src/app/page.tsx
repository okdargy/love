"use client";

import { trpc } from "@/app/_trpc/client";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Spinner } from "@/components/icons";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TRPCClientErrorLike } from "@trpc/client";
import { BuildProcedure } from "@trpc/server";
import Error from "@/components/Error";

const ITEMS_PER_PAGE = 25;
const DEFAULT_PAGE = 1;

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [result, setDataResult] = useState<ReturnType<typeof trpc.getItemsByPage.useMutation>['data']>({
    items: [],
    totalPages: 0,
  });
  const [error, setError] = useState<TRPCClientErrorLike<BuildProcedure<"query", any, any>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
  const [currentPage, setCurrentPage] = useState(+(searchParams.get("page") ?? DEFAULT_PAGE));

  const getItems = trpc.getItemsByPage.useMutation({
    onError(error) {
      setError(error);
      setLoading(false);
    },
    onSuccess(data) {
      setDataResult(data);
      setLoading(false);
    },
  });

  const safeResult = result ?? { items: [], totalPages: 0 };

  useEffect(() => {
    getItems.mutate({
      page: currentPage < 1 ? DEFAULT_PAGE : currentPage,
      total: ITEMS_PER_PAGE,
      search: searchParams.get("search") ?? "",
    });
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(price);
  };

  const handleSearch = () => {
    setCurrentPage(DEFAULT_PAGE); // Reset to the first page on new search
    setLoading(true);
    const queryParams = new URLSearchParams({ page: DEFAULT_PAGE.toString() });

    if (searchTerm) {
      queryParams.append("search", searchTerm);
    }

    router.push(`/?${queryParams.toString()}`);
    getItems.mutate({
      page: DEFAULT_PAGE,
      total: ITEMS_PER_PAGE,
      search: searchTerm,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    // Ensure the new page is within the bounds of the total pages
    newPage = Math.max(1, Math.min(newPage, safeResult.totalPages));

    setCurrentPage(newPage);
    setLoading(true);

    const queryParams = new URLSearchParams({ page: newPage.toString() });

    if (searchTerm) {
      queryParams.append("search", searchTerm);
    }

    router.push(`/?${queryParams.toString()}`);

    getItems.mutate({
      page: newPage,
      total: ITEMS_PER_PAGE,
      search: searchTerm,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-x-2">
        <Input
          type="search"
          placeholder="Search for an item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button variant="default" onClick={handleSearch}>
          Search
        </Button>
      </div>
      {loading ? ( // Step 2: Show a loading icon when the data is being fetched
        <div className="flex justify-center items-center p-2">
          <Spinner width="24" height="24" className="fill-red-500" />
        </div>
      ) : error ? (
        <Error message={error.message} />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {safeResult.items.map((item, index) => (
              <Link key={index} href={`/store/${item.id}`} passHref={true}>
                <div className="p-4 space-y-3 border hover:border-red-500 transition-all rounded-lg shadow-sm flex flex-col justify-between relative">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.name}
                    width={200}
                    height={200}
                    className="rounded-lg data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-100/10"
                    data-loaded='false'
                    onLoad={event => {
                      event.currentTarget.setAttribute('data-loaded', 'true')
                    }}
                    unoptimized
                  />
                  <div className="mt-auto">
                    <h2 className="text-md text-gray-100 font-bold truncate">{item.name}</h2>
                    <p className="text-sm text-gray-400 overflow-hidden">
                      <i className="pi pi-brick me-2"></i>{formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="absolute -top-3 right-0 p-2">

                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? 'disabled' : ''}
                />
              </PaginationItem>
              <PaginationItem>
                {Array.from({ length: result?.totalPages ?? 1 }).map((_, index) => (
                  <PaginationLink
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`cursor-pointer ${currentPage === index + 1 ? 'active' : ''}`}
                  >
                    {index + 1}
                  </PaginationLink>
                ))}
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === (result?.totalPages ?? 1) ? 'disabled' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
