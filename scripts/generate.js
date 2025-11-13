import fs from "fs";
import path from "path";
import fetch from "node-fetch";

async function main() {
  // 支持外部传入目录：temp_data 或 data
  const outDir = process.argv[2] || "data";
  fs.mkdirSync(outDir, { recursive: true });

  /* ---------------- IANA TLD 读取 + 解析 ---------------- */
  const tldRes = await fetch("https://data.iana.org/TLD/tlds-alpha-by-domain.txt");
  const tldText = await tldRes.text();

  // 提取头部信息
  const ianaHeader = tldText.split("\n").slice(0, 5).join("\n");
  const ianaVersionMatch = ianaHeader.match(/Version\s+(\d+)/i);
  const ianaUpdatedMatch = ianaHeader.match(/Last\s+Updated\s+(.*)/i);

  const ianaVersion = ianaVersionMatch ? ianaVersionMatch[1] : null;
  const ianaLastUpdated = ianaUpdatedMatch ? ianaUpdatedMatch[1].trim() : null;

  // 过滤实际 TLD 内容
  const tlds = tldText
    .split("\n")
    .filter(l => l && !l.startsWith("#"))
    .map(l => l.trim().toLowerCase());

  /* ---------------- PSL 读取 + 解析 ---------------- */
  const pslRes = await fetch("https://publicsuffix.org/list/public_suffix_list.dat");
  const pslText = await pslRes.text();

  // 提取头部前几行
  const pslHeader = pslText.split("\n").slice(0, 20).join("\n");

  const pslVersionMatch = pslHeader.match(/VERSION:\s*(.*)/i);
  const pslUpdatedMatch = pslHeader.match(/Last[- ]Updated:\s*(.*)/i);

  const pslVersion = pslVersionMatch ? pslVersionMatch[1].trim() : null;
  const pslLastUpdated = pslUpdatedMatch ? pslUpdatedMatch[1].trim() : null;

  // 过滤正式 PSL 列表内容
  const psl = pslText
    .split("\n")
    .filter(l => l.trim() && !l.startsWith("//"))
    .map(l => l.trim().toLowerCase());

  /* ---------------- 写入数据文件 ---------------- */

  fs.writeFileSync(path.join(outDir, "tlds.json"), JSON.stringify(tlds, null, 2));
  fs.writeFileSync(path.join(outDir, "public-suffix.json"), JSON.stringify(psl, null, 2));

  // 生成包含官方更新时间的 meta.json
  fs.writeFileSync(
    path.join(outDir, "meta.json"),
    JSON.stringify(
      {
        iana_version: ianaVersion,
        iana_last_updated: ianaLastUpdated,

        psl_version: pslVersion,
        psl_last_updated: pslLastUpdated,

        tld_count: tlds.length,
        psl_count: psl.length
      },
      null,
      2
    )
  );

  console.log("✔ Domain lists + official metadata generated.");
}

main().catch(err => {
  console.error("❌ Generate failed:", err);
  process.exit(1);
});
