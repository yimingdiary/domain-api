import fs from "fs";
import path from "path";
import fetch from "node-fetch";

async function main() {
  // 支持外部传入目录：temp_data 或 data
  const outDir = process.argv[2] || "data";
  fs.mkdirSync(outDir, { recursive: true });

  // 1. IANA TLD
  const tldRes = await fetch("https://data.iana.org/TLD/tlds-alpha-by-domain.txt");
  const tldText = await tldRes.text();
  const tlds = tldText
    .split("\n")
    .filter(l => l && !l.startsWith("#"))
    .map(l => l.trim().toLowerCase());

  // 2. Public Suffix List
  const pslRes = await fetch("https://publicsuffix.org/list/public_suffix_list.dat");
  const pslText = await pslRes.text();
  const psl = pslText
    .split("\n")
    .filter(l => l.trim() && !l.startsWith("//"))
    .map(l => l.trim().toLowerCase());

  // 3. 写入文件
  fs.writeFileSync(path.join(outDir, "tlds.json"), JSON.stringify(tlds, null, 2));
  fs.writeFileSync(path.join(outDir, "public-suffix.json"), JSON.stringify(psl, null, 2));
  fs.writeFileSync(
    path.join(outDir, "meta.json"),
    JSON.stringify(
      {
        updated_at: new Date().toISOString(),
        tld_count: tlds.length,
        psl_count: psl.length
      },
      null,
      2
    )
  );

  console.log(`✔ Output generated in ${outDir}`);
}

main().catch(err => {
  console.error("❌ Generate failed:", err);
  process.exit(1);
});
