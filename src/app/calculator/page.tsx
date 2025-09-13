'use client';

import { useState } from 'react';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Search, TrendingUp, TrendingDown, Equal } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/icons';

interface CalculatorItem {
    id: number;
    name: string;
    shorthand: string | null;
    thumbnailUrl: string | null;
    recentAverage: number | null;
    stats?: { value: number | null } | null;
}

interface TradeItem extends CalculatorItem {
    quantity: number;
}

export default function CalculatorPage() {
    const [offerItems, setOfferItems] = useState<TradeItem[]>([]);
    const [requestItems, setRequestItems] = useState<TradeItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSide, setSelectedSide] = useState<'offer' | 'request'>('offer');
    const [itemCache, setItemCache] = useState<Map<number, CalculatorItem>>(new Map());
    const [offerBricks, setOfferBricks] = useState<number>(0);
    const [requestBricks, setRequestBricks] = useState<number>(0);

    const searchItems = trpc.searchCalculatorItems.useMutation();

    const handleSearch = async () => {
        if (searchQuery.trim()) {
            await searchItems.mutateAsync({
                input: searchQuery,
                limit: 10
            });
        }
    };

    const addItemToSide = (item: any, side: 'offer' | 'request') => {
        const cachedItem: CalculatorItem = {
            id: item.id,
            name: item.name,
            shorthand: item.shorthand,
            thumbnailUrl: item.thumbnailUrl,
            recentAverage: item.recentAverage,
            stats: item.stats || null
        };

        setItemCache(prev => new Map(prev.set(item.id, cachedItem)));

        const tradeItem: TradeItem = {
            ...cachedItem,
            quantity: 1
        };

        if (side === 'offer') {
            const existingIndex = offerItems.findIndex(i => i.id === item.id);
            if (existingIndex >= 0) {
                const newItems = [...offerItems];
                newItems[existingIndex].quantity += 1;
                setOfferItems(newItems);
            } else {
                setOfferItems(prev => [...prev, tradeItem]);
            }
        } else {
            const existingIndex = requestItems.findIndex(i => i.id === item.id);
            if (existingIndex >= 0) {
                const newItems = [...requestItems];
                newItems[existingIndex].quantity += 1;
                setRequestItems(newItems);
            } else {
                setRequestItems(prev => [...prev, tradeItem]);
            }
        }
    };

    const updateQuantity = (itemId: number, side: 'offer' | 'request', change: number) => {
        if (side === 'offer') {
            setOfferItems(prev =>
                prev.map(item => {
                    if (item.id === itemId) {
                        const newQuantity = Math.max(0, item.quantity + change);
                        if (newQuantity === 0) {
                            const stillUsed = requestItems.some(reqItem => reqItem.id === itemId);
                            if (!stillUsed) {
                                setItemCache(cache => {
                                    const newCache = new Map(cache);
                                    newCache.delete(itemId);
                                    return newCache;
                                });
                            }
                        }
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
                }).filter(item => item.quantity > 0)
            );
        } else {
            setRequestItems(prev =>
                prev.map(item => {
                    if (item.id === itemId) {
                        const newQuantity = Math.max(0, item.quantity + change);
                        if (newQuantity === 0) {
                            const stillUsed = offerItems.some(offerItem => offerItem.id === itemId);
                            if (!stillUsed) {
                                setItemCache(cache => {
                                    const newCache = new Map(cache);
                                    newCache.delete(itemId);
                                    return newCache;
                                });
                            }
                        }
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
                }).filter(item => item.quantity > 0)
            );
        }
    };

    const removeItem = (itemId: number, side: 'offer' | 'request') => {
        if (side === 'offer') {
            setOfferItems(prev => prev.filter(item => item.id !== itemId));
            const stillUsed = requestItems.some(reqItem => reqItem.id === itemId);
            if (!stillUsed) {
                setItemCache(cache => {
                    const newCache = new Map(cache);
                    newCache.delete(itemId);
                    return newCache;
                });
            }
        } else {
            setRequestItems(prev => prev.filter(item => item.id !== itemId));
            const stillUsed = offerItems.some(offerItem => offerItem.id === itemId);
            if (!stillUsed) {
                setItemCache(cache => {
                    const newCache = new Map(cache);
                    newCache.delete(itemId);
                    return newCache;
                });
            }
        }
    };

    const calculateTotal = (items: TradeItem[], useValue: boolean = false) => {
        return items.reduce((total, item) => {
            const price = useValue && item.stats?.value
                ? item.stats.value
                : item.recentAverage || 0;
            return total + (price * item.quantity);
        }, 0);
    };

    const offerTotalRAP = calculateTotal(offerItems, false) + offerBricks;
    const requestTotalRAP = calculateTotal(requestItems, false) + requestBricks;
    const offerTotalValue = calculateTotal(offerItems, true) + offerBricks;
    const requestTotalValue = calculateTotal(requestItems, true) + requestBricks;

    const rapDifference = offerTotalRAP - requestTotalRAP;
    const valueDifference = offerTotalValue - requestTotalValue;

    const getTradeStatus = (difference: number) => {
        if (Math.abs(difference) < 100) return 'neutral';
        return difference > 0 ? 'overpay' : 'underpay';
    };

    const formatNumber = (num: number) => new Intl.NumberFormat().format(Math.round(num));

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Offer</h2>
                        <div className="text-sm text-neutral-400">
                            Value: <span className="text-blue-400">{formatNumber(calculateTotal(offerItems, true))}</span>
                            {offerBricks > 0 && <span className="text-orange-400"> + {formatNumber(offerBricks)} bricks</span>} |
                            RAP: <span className="text-green-400">{formatNumber(calculateTotal(offerItems, false))}</span>
                            {offerBricks > 0 && <span className="text-orange-400"> + {formatNumber(offerBricks)} bricks</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-400">Bricks:</span>
                        <Input
                            type="number"
                            value={offerBricks || ''}
                            onChange={(e) => setOfferBricks(Number(e.target.value) || 0)}
                            placeholder="0"
                            className="w-24 h-8 text-sm"
                            min="0"
                        />
                    </div>
                    <div className="border border-neutral-500/20 bg-neutral-900/5 rounded-lg">
                        <div className="grid grid-cols-3 gap-2 p-3 min-h-[200px]">
                            {offerItems.map(item => (
                                <CalculatorItemSlot
                                    key={`offer-${item.id}`}
                                    item={item}
                                    onUpdateQuantity={(change) => updateQuantity(item.id, 'offer', change)}
                                    onRemove={() => removeItem(item.id, 'offer')}
                                />
                            ))}
                            {Array.from({ length: Math.max(0, 6 - offerItems.length) }).map((_, i) => (
                                <EmptySlot key={`offer-empty-${i}`} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Request</h2>
                        <div className="text-sm text-neutral-400">
                            Value: <span className="text-blue-400">{formatNumber(calculateTotal(requestItems, true))}</span>
                            {requestBricks > 0 && <span className="text-orange-400"> + {formatNumber(requestBricks)} bricks</span>} |
                            RAP: <span className="text-green-400">{formatNumber(calculateTotal(requestItems, false))}</span>
                            {requestBricks > 0 && <span className="text-orange-400"> + {formatNumber(requestBricks)} bricks</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-400">Bricks:</span>
                        <Input
                            type="number"
                            value={requestBricks || ''}
                            onChange={(e) => setRequestBricks(Number(e.target.value) || 0)}
                            placeholder="0"
                            className="w-24 h-8 text-sm"
                            min="0"
                        />
                    </div>
                    <div className="border border-neutral-500/20 bg-neutral-900/5 rounded-lg">
                        <div className="grid grid-cols-3 gap-2 p-3 min-h-[200px]">
                            {requestItems.map(item => (
                                <CalculatorItemSlot
                                    key={`request-${item.id}`}
                                    item={item}
                                    onUpdateQuantity={(change) => updateQuantity(item.id, 'request', change)}
                                    onRemove={() => removeItem(item.id, 'request')}
                                />
                            ))}
                            {Array.from({ length: Math.max(0, 6 - requestItems.length) }).map((_, i) => (
                                <EmptySlot key={`request-empty-${i}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            { (offerItems.length === 0 && requestItems.length === 0 && offerBricks === 0 && requestBricks === 0) ? null : (
                <div className="border border-neutral-100/10 bg-neutral-900/20 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-neutral-400 mb-2">RAP Difference</p>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                {getTradeStatus(rapDifference) === 'overpay' && <TrendingUp className="w-5 h-5 text-red-400" />}
                                {getTradeStatus(rapDifference) === 'underpay' && <TrendingDown className="w-5 h-5 text-green-400" />}
                                {getTradeStatus(rapDifference) === 'neutral' && <Equal className="w-5 h-5 text-yellow-400" />}
                                <span className={`text-xl font-bold ${getTradeStatus(rapDifference) === 'overpay' ? 'text-red-400' :
                                        getTradeStatus(rapDifference) === 'underpay' ? 'text-green-400' :
                                            'text-yellow-400'
                                    }`}>
                                    {rapDifference > 0 ? '+' : ''}{formatNumber(rapDifference)}
                                </span>
                            </div>
                            <Badge variant={
                                getTradeStatus(rapDifference) === 'overpay' ? 'destructive' :
                                    getTradeStatus(rapDifference) === 'underpay' ? 'default' :
                                        'secondary'
                            }>
                                {getTradeStatus(rapDifference) === 'overpay' ? 'You Overpay' :
                                    getTradeStatus(rapDifference) === 'underpay' ? 'You Win' :
                                        'Fair Trade'}
                            </Badge>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-neutral-400 mb-2">Value Difference</p>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                {getTradeStatus(valueDifference) === 'overpay' && <TrendingUp className="w-5 h-5 text-red-400" />}
                                {getTradeStatus(valueDifference) === 'underpay' && <TrendingDown className="w-5 h-5 text-green-400" />}
                                {getTradeStatus(valueDifference) === 'neutral' && <Equal className="w-5 h-5 text-yellow-400" />}
                                <span className={`text-xl font-bold ${getTradeStatus(valueDifference) === 'overpay' ? 'text-red-400' :
                                        getTradeStatus(valueDifference) === 'underpay' ? 'text-green-400' :
                                            'text-yellow-400'
                                    }`}>
                                    {valueDifference > 0 ? '+' : ''}{formatNumber(valueDifference)}
                                </span>
                            </div>
                            <Badge variant={
                                getTradeStatus(valueDifference) === 'overpay' ? 'destructive' :
                                    getTradeStatus(valueDifference) === 'underpay' ? 'default' :
                                        'secondary'
                            }>
                                {getTradeStatus(valueDifference) === 'overpay' ? 'You Overpay' :
                                    getTradeStatus(valueDifference) === 'underpay' ? 'You Win' :
                                        'Fair Trade'}
                            </Badge>
                        </div>
                    </div>
                </div>
            )}

            <div className="border border-neutral-100/10 p-4 rounded-lg">
                <div className="flex gap-x-2 mb-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button onClick={handleSearch} disabled={!searchQuery.trim()} variant="default">
                        Search
                    </Button>
                </div>

                <div className="flex gap-2 mb-4">
                    <Button
                        variant={selectedSide === 'offer' ? 'default' : 'outline'}
                        onClick={() => setSelectedSide('offer')}
                        size="sm"
                    >
                        Add to Offer
                    </Button>
                    <Button
                        variant={selectedSide === 'request' ? 'default' : 'outline'}
                        onClick={() => setSelectedSide('request')}
                        size="sm"
                    >
                        Add to Request
                    </Button>
                </div>

                {searchItems.isLoading && (
                    <div className="flex justify-center p-4">
                        <Spinner width="24" height="24" className="fill-primary" />
                    </div>
                )}

                {searchItems.data && searchItems.data.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {searchItems.data.map(item => (
                            <SearchResultItem
                                key={item.id}
                                item={item}
                                onClick={() => addItemToSide(item, selectedSide)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function CalculatorItemSlot({
    item,
    onUpdateQuantity,
    onRemove
}: {
    item: TradeItem;
    onUpdateQuantity: (change: number) => void;
    onRemove: () => void;
}) {
    return (
        <div className="relative group border border-neutral-100/10 bg-neutral-900/30 rounded-lg p-2 hover:bg-neutral-800/50 transition-colors">
            <div className="flex flex-col h-full">
                <div className="relative flex-1">
                    <Image
                        src={item.thumbnailUrl || '/noomy_404.png'}
                        alt={item.name}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover rounded border"
                    />
                    {item.quantity > 1 && (
                        <div className="absolute -top-1 -right-1 bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {item.quantity}
                        </div>
                    )}
                </div>

                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 rounded-lg">
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateQuantity(-1)}
                            className="h-6 w-6 p-0 text-xs"
                        >
                            <Minus className="w-3 h-3" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateQuantity(1)}
                            className="h-6 w-6 p-0 text-xs"
                        >
                            <Plus className="w-3 h-3" />
                        </Button>
                    </div>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={onRemove}
                        className="h-6 text-xs px-2"
                    >
                        Remove
                    </Button>
                </div>
            </div>
        </div>
    );
}

function EmptySlot() {
    return (
        <div className="border-2 border-dashed border-neutral-600 rounded-lg aspect-square flex items-center justify-center bg-neutral-900/10">
            <div className="text-neutral-500 text-xs text-center">
            </div>
        </div>
    );
}

function SearchResultItem({
    item,
    onClick
}: {
    item: any;
    onClick: () => void;
}) {
    const formatNumber = (num: number) => new Intl.NumberFormat().format(Math.round(num));

    return (
        <div
            className="border border-neutral-100/10 bg-neutral-900/20 rounded-lg p-2 hover:bg-neutral-800/50 cursor-pointer transition-colors"
            onClick={onClick}
        >
            <div className="flex flex-col h-full">
                <div className="flex-1">
                    <Image
                        src={item.thumbnailUrl || '/noomy_404.png'}
                        alt={item.name}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover rounded border"
                    />
                </div>
                <div className="mt-1 text-center">
                    <p className="text-xs truncate font-medium">{item.name}</p>
                    {item.shorthand && (
                        <p className="text-xs text-neutral-400 truncate">{item.shorthand}</p>
                    )}
                </div>
                <div className="flex mx-auto gap-x-2 mt-1 text-center">
                    {item.recentAverage && (
                        <span className="text-xs text-green-400">
                            {formatNumber(item.recentAverage)}
                        </span>
                    )}
                    {item.recentAverage && item.stats?.value && (
                        <span className="text-xs text-neutral-400 mx-1">|</span>
                    )}
                    {item.stats?.value && (
                        <div className="text-xs text-blue-400">
                            {formatNumber(item.stats.value)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}