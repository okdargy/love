'use client';

import { trpc } from '@/app/_trpc/client';
import { useParams } from 'next/navigation';
import { Coins, BarChart, Pencil, ExternalLink } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import Image from 'next/image';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/SessionContext';
import Link from 'next/link';

export default function Page() {
  const { user } = useSession();
  const pathname = useParams<{ id: string }>()

  // check if the id is a number
  if (isNaN(parseInt(pathname.id))) {
    return <p>Invalid id</p>
  }

  const id = parseInt(pathname.id);
  const itemInfo = trpc.getItem.useQuery(id, {
    onError(err) {
      console.error(err)
    }
  })

  return (
    <main>
      {itemInfo.isLoading ? (
        <div>
          <p className="text-xl">Loading...</p>
        </div>
      ) : itemInfo.data ? (
        <div className="space-y-4">
          <Breadcrumb className=''>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{itemInfo.data.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-col md:flex-row items-start space-y-1 md:space-y-0 md:space-x-4">
            <div className="relative flex-shrink-0 w-full md:w-1/4 space-y-3">
              <div className="relative w-full h-auto max-w-sm mx-auto">
                <div className="absolute inset-0 bg-[url('/client-background.png')] bg-cover bg-center opacity-30 rounded-lg"></div>
                <Image
                  src={itemInfo.data.thumbnailUrl}
                  alt={itemInfo.data.name}
                  width={800}
                  height={800}
                  className="relative w-full h-auto object-cover rounded-lg border p-2 data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-100/10"
                  data-loaded='false'
                  onLoad={event => {
                    event.currentTarget.setAttribute('data-loaded', 'true')
                  }}
                />
              </div>
              <div className="flex-grow min-w-0 space-y-3">
                <div className="space-y-1">
                  <h3 className="text-neutral-500 mb-1 capitalize">{itemInfo.data.type}</h3>
                  <h1 className="text-2xl md:text-3xl font-bold mt-4 md:mt-0">{itemInfo.data.name}</h1>
                  <p className="text-sm text-neutral-400">{itemInfo.data.description}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={"https://polytoria.com/store/" + itemInfo.data.id} className='w-full'>
                    <Button variant={'secondary'} className='w-full'>
                      <ExternalLink className='w-4 h-4' />
                    </Button>
                  </Link>
                  {user && user.role === "admin" && (
                    <Link href={"/store/" + itemInfo.data.id + "/edit"} className='w-full'>
                      <Button variant={'secondary'} className='w-full'>
                        <Pencil className='w-4 h-4' />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className="w-full space-y-3">
              <div className='grid grid-cols-1 sm:grid-cols-2 grid-rows-2 gap-x-3 gap-y-3 mt-4 md:mt-0'>
                <InfoCard title="Value" value={itemInfo.data.stats.value} icon={<Coins />} />
                <InfoCard title="Demand" value={itemInfo.data.stats.demand} icon={<BarChart />} />
                <InfoCard title="Trend" value={itemInfo.data.stats.trend} icon={<BarChart />} />
                <InfoCard title="Stock" value={itemInfo.data.stats.ogStock} icon={<BarChart />} />
              </div>
              <div className=''>
                <h2 className="text-xl font-semibold mb-2">JSON Result</h2>
                <pre className="text-sm bg-neutral-800 p-2 rounded-lg grid grid-cols-1 overflow-auto">
                  {JSON.stringify(itemInfo.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-full">
          <p className="text-xl">Could not find item with id: {id}</p>
        </div>
      )
      }
    </main >
  )
}

function InfoCard({ title, value, icon }: {
  title: string;
  value: string | number | null;
  icon: ReactNode;
}) {
  return (
    <div className="relative bg-neutral-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="relative flex items-center justify-between">
        <div>
          <h3 className="text-neutral-400 text-sm uppercase tracking-wide">{title}</h3>
          <p className="text-xl font-semibold text-white mt-2">
            {value !== null ? value : "N/A"}
          </p>
        </div>
        <div className="ml-2 text-white" style={{ fontSize: '2rem' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}