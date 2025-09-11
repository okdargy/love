"use client"

import { trpc } from '@/app/_trpc/client';
import { useParams } from 'next/navigation';
import { Coins, BarChart, Pencil, ExternalLink, TrendingUp, TrendingDown, Blocks, Tag, Plus, Info, Calculator } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import Image from 'next/image';
import { ReactNode, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/SessionContext';
import Link from 'next/link';
import Error from '@/components/Error';
import { Spinner } from '@/components/icons';
import Owners from './Owners';
import Recent from './Recent';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { EquationContext } from 'react-equation'
import Graph from './Graph';

// Function to calculate new average price after purchase
function calculateNewAveragePrice(currentAverage: number, purchasePrice: number): number {
  if (purchasePrice > currentAverage) {
    // IF RAISE: PRICE - AVG = X; X / 6.67 = Y; AVG + Y = NEW AVG
    const x = purchasePrice - currentAverage;
    const y = x / 6.67;
    return currentAverage + y;
  } else {
    // IF LOWERS: AVG - PRICE = X; X / 6.67 = Y; AVG - Y = NEW AVG
    const x = currentAverage - purchasePrice;
    const y = x / 6.67;
    return currentAverage - y;
  }
}

export default function Page() {
  const [hoardRate, setHoardRate] = useState(-1);
  const [ownersAmount, setOwnersAmount] = useState(-1);
  const { user } = useSession();
  const pathname = useParams<{ id: string }>()

  const id = parseInt(pathname.id);

  const itemInfo = trpc.getItemWithTags.useQuery(id, {
    onError(err) {
      console.error(err)
    }
  });

  const itemGraph = trpc.getItemGraph.useQuery(id, {
    onError(err) {
      console.error(err)
    }
  });

  useEffect(() => {
    if (itemInfo.data) {
      document.title = itemInfo.data.item.name + " - LOVE";
    }
  }, [itemInfo.data]);

  if (isNaN(id)) {
    return <Error message="Invalid ID, must be a number" />
  }

  if (id < 1) {
    return <Error message="Invalid ID, must be greater than 0" />
  }

  return (
    <main>
      {itemInfo.isLoading ? (
        <div className="flex justify-center items-center p-2">
          <Spinner width="24" height="24" className="fill-primary" />
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
                <BreadcrumbPage>{itemInfo.data.item.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-col md:flex-row items-start space-y-1 md:space-y-0 md:space-x-4">
            <div className="relative flex-shrink-0 w-full md:w-1/4 space-y-3">
              <div className="relative w-full h-auto max-w-sm mx-auto">
                <div className="absolute inset-0 bg-[url('/client-background.png')] bg-cover bg-center opacity-30 rounded-lg"></div>
                <Image
                  src={itemInfo.data.item.thumbnailUrl}
                  alt={itemInfo.data.item.name}
                  width={800}
                  height={800}
                  className="relative w-full h-auto object-cover rounded-lg border data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-100/10"
                  data-loaded='false'
                  onLoad={event => {
                    event.currentTarget.setAttribute('data-loaded', 'true')
                  }}
                />
              </div>
              <div className="flex-grow min-w-0 space-y-3">
                <div className="space-y-1">
                  <h3 className="text-neutral-500 mb-1 capitalize">{itemInfo.data.item.type}</h3>
                  <h1 className="text-2xl md:text-3xl font-bold mt-4 md:mt-0">{itemInfo.data.item.name}</h1>
                  <p className="text-sm text-neutral-400">{itemInfo.data.item.description}</p>
                </div>
                {
                  (itemInfo.data.item.tags.length > 0 && itemInfo.data.allTags) && (
                    <div className="flex flex-wrap gap-2">
                      {itemInfo.data.item.tags.map(tag => itemInfo.data?.allTags.find(t => t.id === tag.tagId) && (
                        <Badge key={tag.tagId} variant={'outline'}>
                          {itemInfo.data.allTags.find(t => t.id === tag.tagId)?.name || tag.tagId}
                        </Badge>
                      ))}
                    </div>
                  )
                }
                <div className='space-y-2'>
                  <div className="flex gap-2">
                    <Link href={"https://polytoria.com/store/" + itemInfo.data.item.id} className='w-full'>
                      <Button variant={'secondary'} className='w-full'>
                        <ExternalLink className='w-4 h-4' />
                      </Button>
                    </Link>
                    {user && user.role === "admin" && (
                      <Link href={"/store/" + itemInfo.data.item.id + "/edit"} className='w-full'>
                        <Button variant={'secondary'} className='w-full'>
                          <Pencil className='w-4 h-4' />
                        </Button>
                      </Link>
                    )}
                  </div>
                  <div>
                    <Button variant={'secondary'} className='w-full gap-x-2' disabled>
                      <Plus className='w-4 h-4' />
                      Add to Calculator
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full space-y-3">
              <div className='grid grid-cols-1 sm:grid-cols-2 grid-rows-2 gap-x-3 gap-y-3 mt-4 md:mt-0'>
                <InfoCard title="Value" value={itemInfo.data.item.stats.value} icon={<Coins />} />
                <InfoCard title="Demand" value={itemInfo.data.item.stats.demand} icon={<BarChart />} />
                <InfoCard title="Trend" value={itemInfo.data.item.stats.trend} icon={<TrendingUp />} />
                <InfoCard title="Shorthand" value={itemInfo.data.item.shorthand} icon={<Tag />} />
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3 mt-4 md:mt-0'>
                <SmallInfoCard title="Recent Average" value={itemInfo.data.item.recentAverage} />
                <SmallInfoCard title="Current Lowest Price" value={itemInfo.data.latestListing?.bestPrice} />
                {itemInfo.data.item.recentAverage && itemInfo.data.latestListing?.bestPrice && (
                  <div className="sm:col-span-2">
                    <ProjectedAverageCard
                      currentAverage={itemInfo.data.item.recentAverage}
                      lowestPrice={itemInfo.data.latestListing.bestPrice}
                    />
                  </div>
                )}
              </div>
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <h2 className="text-xl font-semibold my-auto">Owners{ownersAmount > 0 ? <span className="text-neutral-500 text-sm my-auto ml-1"> ({ownersAmount})</span> : ""}</h2>
                  <HoverCard>
                    <HoverCardTrigger>
                      <span className="my-auto text-sm text-neutral-500">{hoardRate == -1 ? "Loading..." : `${hoardRate.toFixed(2)}% Hoard Rate`}</span>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <p className="text-neutral-400 text-sm">
                        The hoard rate is a measure of how many copies of <span className="font-semibold">{itemInfo.data.item.name}</span> are owned by people with more than 1 copy.
                        <br></br><br></br>
                        We calculate this using the formula:
                        <br></br><br></br>
                        <span className="overflow-hidden">
                          <EquationContext render={(equation) => (
                            <span>{equation('(Hoarded Total)/(Total) * 100')}</span>
                          )} />
                        </span>
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <Owners id={itemInfo.data.item.id} setHoardRate={setHoardRate} setOwnersAmount={setOwnersAmount} />
              </div>
            </div>
          </div>
          {(itemInfo.data.item.stats.funFact && itemInfo.data.item.stats.funFact.trim() !== "") && (
            <div className="flex flex-col space-y-1">
              <div className='space-y-3'>
                <h2 className="text-xl font-semibold my-auto">Fun Fact</h2>
                <div className="border border-neutral-100/10 p-4 rounded-lg shadow-md">
                  <p>
                    {itemInfo.data.item.stats.funFact}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className='space-y-3'>
            <h2 className="text-xl font-semibold my-auto">Graphs</h2>
            <div className="border border-neutral-100/10 p-4 rounded-lg shadow-md">
              {itemGraph.data?.listings && <Graph data={itemGraph.data} />}
            </div>
          </div>
          <div className='space-y-3'>
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold my-auto">Recent Transactions</h2>
              <Link href={`/recent`} className="my-auto">
                <p className="text-sm text-neutral-500">
                  View All
                </p>
              </Link>
            </div>
            <Recent id={itemInfo.data.item.id} />
          </div>
        </div>
      ) : (
        <Error message="Could not find item" />
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
  if (typeof value === 'number') {
    value = new Intl.NumberFormat().format(value);
  } else if (typeof value === 'string') {
    value = value.charAt(0).toUpperCase() + value.slice(1);
  }

  return (
    <div className="relative bg-neutral-900 border border-neutral-100/10 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="relative flex items-center justify-between">
        <div>
          <h3 className="text-neutral-400 text-sm uppercase tracking-wide">{title}</h3>
          <p className="text-xl font-semibold text-white mt-2">
            {value !== null && value !== "" ? value : "N/A"}
          </p>
        </div>
        <div className="ml-2 text-white" style={{ fontSize: '2rem' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProjectedAverageCard({ currentAverage, lowestPrice }: {
  currentAverage: number;
  lowestPrice: number;
}) {
  const projectedAverage = calculateNewAveragePrice(currentAverage, lowestPrice);
  const isIncreasing = lowestPrice > currentAverage;
  const difference = Math.abs(projectedAverage - currentAverage);
  const percentageChange = ((difference / currentAverage) * 100);

  return (
    <div className="relative bg-neutral-900/50 border border-neutral-100/10 px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative flex gap-x-3 items-center justify-between">
        <div className="flex items-center gap-x-3 text-neutral-400">
          <Calculator className="w-4 h-4" />
          <h3 className="text-sm font-medium tracking-wide">Avg. After Purchase</h3>
        </div>
        <div className="flex items-center">
          <div className="text-right">
            <p className="text-lg font-semibold text-white">
              {new Intl.NumberFormat().format(Math.round(projectedAverage))}
            </p>
            <div className={`flex text-xs gap-x-2 ${isIncreasing ? 'text-green-400' : 'text-red-400'}`}>
              {isIncreasing ? (
                <TrendingUp className="w-4 h-4 my-auto" />
              ) : (
                <TrendingDown className="w-4 h-4 my-auto" />
              )}
              {isIncreasing ? '+' : '-'}{Math.round(difference)} ({percentageChange.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmallInfoCard({ title, value }: {
  title: string;
  value: string | number | null;
}) {
  if (typeof value === 'number') {
    value = new Intl.NumberFormat().format(Math.round(value));
  }

  return (
    <div className={`relative bg-neutral-900/50 border border-neutral-100/10 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden`}>
      <div className="relative flex gap-x-2 items-center justify-between">
        <h3 className={`text-neutral-400 text-sm tracking-wide`}>{title}</h3>
        <p className={`text-lg font-semibold`}>
          {value !== null && value !== "" ? value : "N/A"}
        </p>
      </div>
    </div>
  );
}