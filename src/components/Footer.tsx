import { FileText, GitBranch, Shield } from 'lucide-react';
import Link from 'next/link';

export const Discord = ({ ...props }) => (
    <svg viewBox="0 -28.5 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" {...props}>
        <g>
            <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"></path>
        </g>
    </svg>
);

export const Polytoria = ({ ...props }) => (
    <svg id="LogoLayer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 558 603.73"  {...props}>
        <g id="Logo">
            <path d="M291,204.23l85,49.12a24,24,0,0,1,12,20.78v98.31a24,24,0,0,1-12,20.77l-85,49.13a24,24,0,0,1-24,0l-85-49.13a24,24,0,0,1-12-20.77V274.13a24,24,0,0,1,12-20.78l85-49.12A24,24,0,0,1,291,204.23Z" />
            <path d="M267,121.23,147.6,190.29a24,24,0,0,1-24.16-.07L69.58,158.64a24,24,0,0,1,.14-41.48L267,3.22a24,24,0,0,1,24,0L488.29,117.16a24,24,0,0,1,.14,41.49l-53.84,31.56a24,24,0,0,1-24.15.08L291,121.23A24,24,0,0,0,267,121.23Z" />
            <path d="M457,270.18v138.2a24,24,0,0,1-12.06,20.82L326.06,497.37A24,24,0,0,0,314,518.19V579.7a24,24,0,0,0,36,20.78L546,487.21a24,24,0,0,0,12-20.78V239.74a24,24,0,0,0-36-20.81l-53,30.44A24,24,0,0,0,457,270.18Z" />
            <path d="M101,270.18v138.2a24,24,0,0,0,12.06,20.82l118.88,68.17A24,24,0,0,1,244,518.19V579.7a24,24,0,0,1-36,20.78L12,487.21A24,24,0,0,1,0,466.43V239.74a24,24,0,0,1,36-20.81l53,30.44A24,24,0,0,1,101,270.18Z" />
        </g>
    </svg>
);

export default function Footer({ sha }: { sha: string }) {
    return (
        <footer className="flex items-center gap-4 border-t bg-background">
            <div className="flex flex-row w-full max-w-screen-lg mx-auto gap-6 p-4 sm:p-6 justify-between">
                <div className="flex gap-x-3">
                    <Link href="https://discord.gg/jUFET2fN3p" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-md font-semibold hover:fill-primary hover:text-primary transition-colors">
                        <Discord className='h-5 w-5 fill-current' />
                    </Link>
                    <Link href="https://polytoria.com/guilds/584" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-md font-semibold hover:fill-primary hover:text-primary transition-colors">
                        <Polytoria className="h-5 w-5 fill-current" />
                    </Link>
                    <Link href="https://docs.google.com/document/d/1W7JN74MU-9Dbd-9xNnjxE18hQVBPXWuwjK5DGSnuQR4/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-md font-semibold hover:fill-primary hover:text-primary transition-colors">
                        <FileText className="h-5 w-5 fill-current" />
                    </Link>
                </div>
                <div className="text-sm text-muted-foreground text-right space-y-0.5 flex flex-col items-end">
                    <p className="">Not associated with the <a href="https://polytoria.com/" className='underline'>Polytoria</a> team</p>
                    <div className='flex gap-x-1'>
                        <GitBranch className="h-3 w-3 fill-current my-auto" />
                        <a href={`https://github.com/neverfirst/love/commit/${sha}`} target="_blank" rel="noopener noreferrer" className="text-xs">
                            {sha.slice(0, 7)}
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}