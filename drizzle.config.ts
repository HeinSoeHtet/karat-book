import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: ".dev.vars" });

const isProd = process.env.DB_ENV === "production";

export default defineConfig({
    // Points to your schema file
    schema: "./src/db/schema.ts",

    // The directory to output migration SQL files
    out: "./migrations",

    // Specify the D1 (SQLite) dialect for Drizzle Kit
    dialect: "sqlite",

    ...(isProd
        ? {
            driver: "d1-http",
            dbCredentials: {
                accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
                databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
                token: process.env.CLOUDFLARE_D1_TOKEN!,
            },
        }
        : {
            dbCredentials: {
                url: process.env.LOCAL_DB,
            },
        }),
});
