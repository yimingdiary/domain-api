import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const IANA_URL = "https://data.iana.org/TLD/tlds-alpha-by-domain.txt";
const PSL_URL = "https://publicsuffix.org/list/public_suffix_list.dat";

const outDir = path.resolve("data");

// 解析 IANA 顶级域
function parseIana(text) {
  const lines = text.split("\n");
  const meta = { version: "", lastUpdated: "" };
  const tlds = [];

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    if (l.startsWith("# Version")) {
      const versionMatch = l.match(/Version\s+(\d+)/);
      const dateMatch = l.match(/Last Updated\s+(.+)$/);
      if (versionMatch) meta.version = versionMatch[1];
      if (dateMatch) meta.lastUpdated = dateMatch[1];
      continue;
    }

    if (l.startsWith("#")) continue;
    tlds.push(l.toLowerCase());
  }

  return { tlds, meta };
}

// 解析 PSL 公共后缀
function parsePsl(text) {
  return text
    .split("\n")
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l && !l.startsWith("//"));
}

async function main() {
  console.log("Fetching IANA TLD list...");
  const iana = await fetch(IANA_URL).then((r) => r.text());

  console.log("Fetching Public Suffix List...");
  const psl = await fetch(PSL_URL).then((r) => r.text());

  const ianaParsed = parseIana(iana);
  const pslParsed = parsePsl(psl);

  const meta = {
    updatedAt: new Date().toISOString(),
    ianaVersion: ianaParsed.meta.version,
    tldCount: ianaParsed.tlds.length,
    pslCount: pslParsed.length,
    sources: {
      iana: IANA_URL,
      psl: PSL_URL
    }
  };

  fs.writeFileSync(path.join(outDir, "tlds.json"), JSON.stringify(ianaParsed.tlds, null, 2));
  fs.writeFileSync(path.join(outDir, "public-suffix.json"), JSON.stringify(pslParsed, null, 2));
  fs.writeFileSync(path.join(outDir, "meta.json"), JSON.stringify(meta, null, 2));

  console.log("Generated JSON:");
  console.log("- data/tlds.json");
  console.log("- data/public-suffix.json");
  console.log("- data/meta.json");
}

main();
