"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/icons";
import Image from "next/image";
import { Wifi, WifiOff, RefreshCw, Volume2, Settings2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DealTag {
  tagId: number;
  emoji?: string | null;
  name?: string | null;
}

interface Deal {
  id: number;
  name: string;
  thumbnailUrl: string;
  shorthand?: string | null;
  oldPrice: number;
  newPrice: number;
  discount: number;
  timestamp: string;
  value: number | null;
  tags: DealTag[];
  recentAverage: number | null;
}

type ConnectionState = "connecting" | "connected" | "disconnected";

const SOUND_OPTIONS = [
  { value: "dargy", label: "dargy", file: "/sounds/dargy.mp3" },
  { value: "nuclear", label: "Ancarchyland's Nuclear", file: "/sounds/nuclear.mp3" },
  { value: "bell", label: "Bell", file: "/sounds/bell.mp3" }
] as const;

type SoundId = (typeof SOUND_OPTIONS)[number]["value"];

const THRESHOLD_OPTIONS = [
  { value: "0", label: "Off" },
  { value: "5", label: "5%" },
  { value: "10", label: "10%" },
  { value: "15", label: "15%" },
  { value: "20", label: "20%" },
  { value: "25", label: "25%" },
  { value: "30", label: "30%" },
  { value: "35", label: "35%" },
  { value: "40", label: "40%" },
  { value: "45", label: "45%" },
  { value: "50", label: "50%" },
] as const;

export default function DealsPage() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [deals, setDeals] = useState<Deal[]>([]);

  const [soundThreshold, setSoundThreshold] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deals-sound-threshold");
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  const [soundId, setSoundId] = useState<SoundId>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deals-sound-id") as SoundId | null;
      return saved && SOUND_OPTIONS.some((s) => s.value === saved) ? saved : "dargy";
    }
    return "dargy";
  });

  const [, setTick] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundThresholdRef = useRef(soundThreshold);
  const soundIdRef = useRef(soundId);
  const audioCacheRef = useRef<Map<SoundId, HTMLAudioElement>>(new Map());

  soundThresholdRef.current = soundThreshold;
  soundIdRef.current = soundId;

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    setConnectionState("connecting");
    const wsUrl = process.env.NEXT_PUBLIC_DEALS_WS_URL || "ws://localhost:3002/ws";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnectionState("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "history") {
          setDeals(data.deals || []);
        } else if (data.type === "deal") {
          const deal = data.deal as Deal;
          setDeals((prev) => [deal, ...prev]);
          if (soundThresholdRef.current > 0 && deal.discount >= soundThresholdRef.current) {
            playDealSound(soundIdRef.current, audioCacheRef.current);
          }
        }
      } catch {}
    };

    ws.onclose = () => {
      setConnectionState("disconnected");
      wsRef.current = null;
      reconnectTimerRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connect]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem("deals-sound-threshold", String(soundThreshold));
  }, [soundThreshold]);

  useEffect(() => {
    localStorage.setItem("deals-sound-id", soundId);
  }, [soundId]);

  const connectionIndicator = () => {
    switch (connectionState) {
      case "connected":
        return (
          <span className="flex items-center gap-2.5 text-sm text-green-500">
            <Wifi size={14} /> Live
          </span>
        );
      case "disconnected":
        return (
          <span className="flex items-center gap-2.5 text-sm text-red-500">
            <WifiOff size={14} /> Disconnected
          </span>
        );
      case "connecting":
        return (
          <span className="flex items-center gap-2.5 text-sm text-yellow-500">
            <Spinner width={14} height={14} className="fill-current" /> Connecting
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Deals</h1>
          <p className="text-muted-foreground">Look for newly dropped prices</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Sound settings"
              >
                <Settings2 size={16} />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sound settings</DialogTitle>
                <DialogDescription>
                  Configure when and how you get notified of new deals.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alert threshold</label>
                  <Select
                    value={String(soundThreshold)}
                    onValueChange={(val) => setSoundThreshold(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THRESHOLD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Play a sound when a deal drops at least this much.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notification sound</label>
                  <Select
                    value={soundId}
                    onValueChange={(val) => setSoundId(val as SoundId)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOUND_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    i&apos;m lowk desperate for ping sounds.. message okdargy on discord and i&apos;ll probably add it
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => playDealSound(soundId, audioCacheRef.current)}
                >
                  <Volume2 size={14} className="mr-2" />
                  Test Sound
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {soundThreshold > 0 && <Volume2 size={14} className="text-muted-foreground" />}
          {connectionIndicator()}
        </div>
      </div>

      {connectionState === "connecting" && (
        <div className="flex justify-center items-center h-64">
          <Spinner width={24} height={24} className="fill-primary" />
        </div>
      )}

      {connectionState === "connected" && deals.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <p className="text-lg font-medium">No deals detected yet</p>
          <p className="text-sm">Waiting for price drops to come in...</p>
        </div>
      )}

      {connectionState === "disconnected" && (
        <Card className="flex flex-col items-center gap-3 p-8">
          <WifiOff size={32} className="text-muted-foreground" />
          <p className="text-muted-foreground">Connection lost. Auto-reconnecting...</p>
          <Button variant="outline" onClick={connect}>
            <RefreshCw size={16} className="mr-2" />
            Retry Now
          </Button>
        </Card>
      )}

      {connectionState === "connected" && deals.length > 0 && (
        <div className="space-y-3">
          {deals.map((deal, i) => (
            <a
              key={`${deal.id}-${deal.timestamp}-${i}`}
              href={`https://polytoria.com/store/${deal.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
            <Card className="flex items-center gap-4 p-4 animate-in fade-in slide-in-from-top-2 duration-300 hover:border-primary transition-colors cursor-pointer">
              <div className="shrink-0">
                <Image
                  src={deal.thumbnailUrl}
                  alt={deal.name}
                  width={64}
                  height={64}
                  className="rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate hover:underline">
                  {deal.name}
                  {deal.shorthand && (
                    <span className="text-muted-foreground font-normal">
                      {" "}({deal.shorthand})
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground line-through text-sm inline-flex items-center gap-1">
                    <i className="pi pi-brick"></i>
                    {deal.oldPrice.toLocaleString()}
                  </span>
                  <span className="text-green-500 font-semibold inline-flex items-center gap-1">
                    <i className="pi pi-brick"></i>
                    {deal.newPrice.toLocaleString()}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    -{Math.round(deal.discount)}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {deal.value != null && (
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      Value: <i className="pi pi-brick text-[#4F95E7]"></i>
                      <span className="text-[#4F95E7]">{deal.value.toLocaleString()}</span>
                    </span>
                  )}
                  {deal.recentAverage != null && (
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      Avg: <i className="pi pi-brick text-[#4FE883]"></i>
                      <span className="text-[#4FE883]">{deal.recentAverage.toLocaleString()}</span>
                    </span>
                  )}
                </div>
                {deal.tags && deal.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    {deal.tags.map((tag) => (
                      <span
                        key={tag.tagId}
                        className="text-xs bg-background/90 border border-border text-foreground rounded-md px-2 py-0.5"
                      >
                        {tag.emoji ?? tag.tagId}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground shrink-0 self-start pt-1">
                {formatRelativeTime(deal.timestamp)}
              </div>
            </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function playDealSound(soundId: SoundId, cache: Map<SoundId, HTMLAudioElement>) {
  try {
    let audio = cache.get(soundId);
    if (!audio) {
      const sound = SOUND_OPTIONS.find((s) => s.value === soundId);
      if (!sound) return;
      audio = new Audio(sound.file);
      audio.volume = 0.5;
      cache.set(soundId, audio);
    }
    audio.currentTime = 0;
    audio.play();
  } catch {}
}
