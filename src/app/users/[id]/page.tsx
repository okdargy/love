import Error from "@/components/Error";
import { UserData } from '@/app/_types/api';
import Image from "next/image";
import Inventory from "./Inventory";
import Recent from "./Recent";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { USER_AGENT } from "@/lib/utils";

const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    switch (true) {
        case diffInSeconds < 60:
            return 'Just now';
        
        case diffInSeconds < 3600:
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        
        case diffInSeconds < 86400:
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        
        case diffInSeconds < 2592000:
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} ${days === 1 ? 'day' : 'days'} ago`;
        
        case diffInSeconds < 31536000:
            const months = Math.floor(diffInSeconds / 2592000);
            return `${months} ${months === 1 ? 'month' : 'months'} ago`;
        
        default:
            const years = Math.floor(diffInSeconds / 31536000);
            return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    if(!params.id) {
        return (
            <Error message="User ID not provided" />
        )
    }

    const id = parseInt(params.id);

    if(isNaN(id)) {
        return <Error message="Invalid ID, must be a number" />
    }

    if(id < 1) {
        return <Error message="Invalid ID, must be greater than 0" />
    }

    const response = await fetch('https://api.polytoria.com/v1/users/' + id, {
        headers: {
            "User-Agent": USER_AGENT
        }
    });
    let userData: UserData | null = null;

    if(response.ok) {
        const data = await response.json();
        userData = data;
    } else {
        return <Error message="Failed to fetch user data" />
    }

    if (!userData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between flex-col md:flex-row gap-y-3">
                <div className="flex gap-x-5">
                    <Image src={userData.thumbnail.icon} alt={userData.username} width={512} height={512} className="h-20 w-20 rounded-full border-2 border-primary p-2" />
                    <div className="my-auto">
                        <h1 className="font-semibold text-2xl">{userData.username}</h1>
                        <div className="flex space-x-2">
                            <h2 className="text-neutral-400">Value: {formatNumber(userData.netWorth)}</h2>
                            <div className="border-l border-neutral-700 mx-1 h-3 my-auto"></div>
                            <h2 className="text-neutral-400">{formatRelativeTime(userData.lastSeenAt)}</h2>
                        </div>
                    </div>
                </div>
                <div className="flex my-auto space-x-2"> 
                    <Link href={`https://polytoria.com/users/${id}`} className="w-full">
                        <Button variant="secondary" className="w-full">
                            View on Polytoria
                        </Button>
                    </Link>
                    <Link href={`https://polytoria.com/trade/new/${id}`} className="w-full">
                        <Button variant="secondary" className="w-full">
                            <ArrowRightLeft />
                        </Button>
                    </Link>
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-3">Inventory</h2>
                <Inventory id={id} />
            </div>
            <div>
                <div className="flex justify-between mb-3">
                    <h2 className="text-2xl font-bold my-auto">Recent History</h2>
                    <Link href={`/recent`} className="my-auto">
                        <p className="text-sm text-neutral-500">
                            View All
                        </p>
                    </Link>
                </div>
                <Recent id={id} />
            </div>
        </div>
    );
}