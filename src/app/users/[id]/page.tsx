import Error from "@/components/Error";
import { UserData } from '@/app/_types/api';
import Image from "next/image";
import Inventory from "./Inventory";

const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default async function Page({ params }: { params: { id: string } }) {
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

    const response = await fetch('https://api.polytoria.com/v1/users/' + id);
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
            <div className="flex gap-x-3">
                <Image src={userData.thumbnail.icon} alt={userData.username} width={512} height={512} className="h-20 w-20 rounded-full border-2 border-primary p-2" />
                <div className="my-auto">
                    <h1 className="font-semibold text-2xl">{userData.username}</h1>
                    <h2 className="text-neutral-400">Value: {formatNumber(userData.netWorth)}</h2>
                </div>
            </div>
            <Inventory id={id} />
        </div>
    );
}