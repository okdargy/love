import Image from "next/image";

export default function NotFound() {
    return (
        <div className="text-center">
            <Image src="/noomy_404.png" alt="404" width={400} height={400} className="mx-auto" />
            <h1 className="text-3xl text-red-500 font-bold">404</h1>
            <p className="text-neutral-700">Page not found, are you lost?</p>
        </div>
    );
}