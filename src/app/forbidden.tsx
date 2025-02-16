import Image from "next/image";

export default function NotFound() {
    return (
        <div className="text-center space-y-4 my-2">
            <Image src="/noomy_404-no-padding.png" alt="404" width={250} height={250} className="mx-auto" />
            <div>
                <h1 className="text-xl font-bold">unauthorized</h1>
                <p className="text-sm text-neutral-300">you&#39;re not allowed to access this page</p>
            </div>
        </div>
    );
}