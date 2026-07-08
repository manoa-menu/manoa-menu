import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const dateArg = process.argv[2];
const saveArg = process.argv[3];
const date = dateArg && !dateArg.startsWith("--")
  ? dateArg
  : new Date().toISOString().slice(0, 10);
const shouldSave = saveArg === "--save" || dateArg === "--save";

const apiKey = process.env.MMR_API_KEY;
const endpoints = [
  { name: "gw", url: process.env.GW_API_URL },
  { name: "ha", url: process.env.HA_API_URL },
];

if (!apiKey || endpoints.some((endpoint) => !endpoint.url)) {
  console.error("Missing one or more required env vars: MMR_API_KEY, GW_API_URL, HA_API_URL");
  process.exit(1);
}

const headers = {
  "API-Key": apiKey,
  Accept: "application/json",
};

const run = async () => {
  const allResults = [];

  for (const endpoint of endpoints) {
    const requestUrl = `${endpoint.url}?date=${date}`;
    const response = await fetch(requestUrl, { headers });
    const text = await response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    const result = {
      location: endpoint.name,
      status: response.status,
      url: requestUrl,
      data: parsed,
    };
    allResults.push(result);

    console.log(`\n=== ${endpoint.name.toUpperCase()} ${date} | ${response.status} ===`);
    console.log(typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2));
  }

  if (shouldSave) {
    const outputDir = path.join(process.cwd(), "scripts");
    const outputPath = path.join(outputDir, `sdx-response-${date}.json`);
    await fs.writeFile(outputPath, `${JSON.stringify(allResults, null, 2)}\n`, "utf8");
    console.log(`\nSaved response to ${outputPath}`);
  }
};

run().catch((error) => {
  console.error("SDX direct fetch failed:", error);
  process.exit(1);
});
