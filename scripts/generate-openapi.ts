import { generateOpenAPIDocument } from "@trpc/openapi";
import { writeFileSync } from "fs";
import { join } from "path";

const SUMMARY_MAP: Record<string, string> = {
  searchPlayers: "Search players by username",
  searchItems: "Search items by name or shorthand",
  getItems: "List items with pagination",
  getItemsByPage: "Browse items with filters and sorting",
  getItem: "Get item details by ID",
  getMetadataItem: "Get lightweight item metadata",
  getItemWithTags: "Get item with tags and latest listing",
  getAllItemOwners: "Get all owners of an item",
  getItemGraph: "Get price chart data for an item",
  getTopValueItems: "Get highest-value items",
  searchCalculatorItems: "Search items for calculator",
  getSerialHistory: "Get trade history for a specific serial",
  getRecentItemHistory: "Get recent trades for an item",
  getAllRecentHistory: "Get recent trade history feed",
  getUsersLatestHistory: "Get recent trades for a user",
  searchTags: "Search available tags",
  // hidden: getAllItemOwners, getItemGraph (fetch from polytoria directly)
  getUserConnectionStatus: "Check linked Polytoria account",
  initializeUserConnection: "Link a Polytoria account",
  unlinkUserConnection: "Unlink Polytoria account",
  setUserInventoryNotForSale: "Toggle item for-sale status",
  verifyUser: "Verify user (deprecated)",
};

const HIDDEN_PROCEDURES = new Set([
  "getAllItemOwners",
  "getItemGraph",
]);

const ADMIN_PROCEDURES = new Set([
  "editItemStats",
  "getAuditLogs",
  "getAdminUsers",
  "getAdminLinkedUsers",
  "updateUserRole",
  "getAdminAnnouncementSettings",
  "updateAdminAnnouncementSettings",
  "addTag",
  "removeTag",
  "editTag",
]);

const TAG_MAP: Record<string, string> = {
  searchPlayers: "Players",
  searchItems: "Items",
  getItems: "Items",
  getItemsByPage: "Items",
  getItem: "Items",
  getMetadataItem: "Items",
  getItemWithTags: "Items",
  // getAllItemOwners: "Items",
  // getItemGraph: "Items",
  getTopValueItems: "Items",
  searchCalculatorItems: "Calculator",
  getSerialHistory: "Trade History",
  getRecentItemHistory: "Trade History",
  getAllRecentHistory: "Trade History",
  getUsersLatestHistory: "Trade History",
  searchTags: "Tags",
  getUserConnectionStatus: "Users",
  initializeUserConnection: "Users",
  unlinkUserConnection: "Users",
  setUserInventoryNotForSale: "Users",
  verifyUser: "Users",
  editItemStats: "Admin",
  getAuditLogs: "Admin",
  getAdminUsers: "Admin",
  getAdminLinkedUsers: "Admin",
  updateUserRole: "Admin",
  getAdminAnnouncementSettings: "Admin",
  updateAdminAnnouncementSettings: "Admin",
  addTag: "Admin",
  removeTag: "Admin",
  editTag: "Admin",
};

async function main() {
  const doc = await generateOpenAPIDocument(
    join(process.cwd(), "src/server/index.ts"),
    {
      exportName: "appRouter",
      title: "polytoria.trade API",
      version: "1.0.0",
    },
  );

  const seenTags = new Set<string>();
  const tags: { name: string; description: string }[] = [];

  for (const [path, pathItem] of Object.entries(doc.paths ?? {})) {
    const procedureName = path.replace(/^\//, "");

    if (ADMIN_PROCEDURES.has(procedureName) || HIDDEN_PROCEDURES.has(procedureName)) {
      delete doc.paths![path];
      continue;
    }

    const tagName = TAG_MAP[procedureName] ?? "Procedures";

    if (!seenTags.has(tagName)) {
      seenTags.add(tagName);
      tags.push({
        name: tagName,
        description: getTagDescription(tagName),
      });
    }

    if (pathItem) {
      for (const method of ["get", "post"] as const) {
        const op = (pathItem as any)[method];
        if (op) {
          op.tags = [tagName];
          op.summary = SUMMARY_MAP[procedureName] ?? procedureName;
        }
      }
    }

    const newPath = `/api/trpc${path}`;
    doc.paths![newPath] = pathItem;
    delete doc.paths![path];
  }

  doc.tags = tags;

  doc.info = {
    title: "polytoria.trade API",
    version: "1.0.0",
    description:
      "API for [polytoria.trade](https://polytoria.trade), not affiliated with Polytoria\n\nThis API is built with [tRPC](https://trpc.io). Procedures mapped to their HTTP endpoints.",
  };

  const outputPath = join(process.cwd(), "public/openapi.json");
  writeFileSync(outputPath, JSON.stringify(doc, null, 2));
  console.log(`OpenAPI spec generated at ${outputPath}`);
  console.log(`Paths: ${Object.keys(doc.paths ?? {}).length}`);
  console.log(`Tags: ${tags.map((t) => t.name).join(", ")}`);
}

function getTagDescription(name: string): string {
  const descriptions: Record<string, string> = {
    Items: "Item queries and search",
    "Trade History": "Trade history and transaction data",
    Players: "Player search",
    Users: "User account management",
    Tags: "Tag management",
    Calculator: "Value calculator operations",
  };
  return descriptions[name] ?? `${name} procedures`;
}

main().catch((e) => {
  console.error("Failed to generate OpenAPI spec:", e);
  process.exit(1);
});
