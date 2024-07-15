'use client';

import { trpc } from '@/app/_trpc/client';
import { useParams  } from 'next/navigation';
import { useState } from 'react';
 
export default function Page() {
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
      {
        itemInfo.isLoading ? (
          <p>Loading...</p>
        ) : itemInfo.data
        ? (
          <div>
            <img className="w-16 h-16" src={itemInfo.data.thumbnailUrl} alt={itemInfo.data.name} />
            <h1>{itemInfo.data.name}</h1>
            <p>{itemInfo.data.description}</p>
            <code>{JSON.stringify(itemInfo.data)}</code>
          </div>
        ) : (
          <p>Couldn't find item with id: {id}</p>
        )
      }
    </main>
  )
}