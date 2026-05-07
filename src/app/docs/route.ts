import { ApiReference } from "@scalar/nextjs-api-reference";

const config = {
  spec: {
    url: "/openapi.json",
  },
  pageTitle: "Polytoria.trade API Documentation",
};

export const GET = ApiReference(config);
