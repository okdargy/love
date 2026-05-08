export interface DealPayload {
  id: number;
  name: string;
  thumbnailUrl: string;
  shorthand?: string | null;
  oldPrice: number;
  newPrice: number;
  discount: number;
  timestamp: string;
}

const MAX_DEALS = 100;
const deals: DealPayload[] = [];
const clients = new Set<import("bun").ServerWebSocket<undefined>>();

export function startWSServer(port: number = 3002) {
  Bun.serve({
    port,
    fetch(req, server) {
      const url = new URL(req.url);
      if (url.pathname === "/ws") {
        const upgraded = server.upgrade(req);
        if (!upgraded) return new Response("upgrade failed", { status: 400 });
        return;
      }
      return new Response("Not found", { status: 404 });
    },
    websocket: {
      open(ws) {
        clients.add(ws);
        ws.send(JSON.stringify({ type: "history", deals }));
      },
      close(ws) {
        clients.delete(ws);
      },
      message(_ws, _message) {},
      drain(_ws) {},
    },
  });

  console.log(`[WS] Deals WebSocket server started on port ${port}`);
}

export function broadcastDeal(deal: DealPayload) {
  deals.unshift(deal);
  if (deals.length > MAX_DEALS) deals.pop();

  const message = JSON.stringify({ type: "deal", deal });
  for (const ws of clients) {
    try {
      ws.send(message);
    } catch {}
  }
}
