#!/usr/bin/env node
// ============================================================
// CLI 命令行工具
// 用法: tsx src/cli.ts search <关键词> [选项]
// ============================================================

import { Command } from "commander";
import { getAllScrapers } from "./scrapers/index.js";
import { processProducts } from "./processor.js";
import { computeValueScores, LEVEL_LABELS } from "./recommender.js";
import type { Platform, SearchResult } from "./types.js";
import { PLATFORM_LABELS, PLATFORM_DOMAINS } from "./types.js";

const program = new Command();

program
  .name("price-scraper")
  .description("电商商品价格自动化采集与对比工具")
  .version("1.0.0");

program
  .command("search <keyword>")
  .description("按关键词搜索商品并对比")
  .option("-p, --platform <platform>", "指定平台 (jd/taobao/pdd/all)", "all")
  .option("-n, --pages <number>", "采集页数", "1")
  .option("-o, --output <format>", "输出格式 (table/json)", "table")
  .option("--top <number>", "只显示前N个性价比最高的商品", "10")
  .action(async (keyword: string, options) => {
    const platforms = resolvePlatforms(options.platform);
    const pageCount = Math.max(1, parseInt(options.pages) || 1);
    const topN = Math.max(1, parseInt(options.top) || 10);

    console.log(`\n🔍 正在搜索: "${keyword}"`);
    console.log(`📡 平台: ${platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}`);
    console.log(`📄 采集页数: ${pageCount}\n`);

    const scrapers = getAllScrapers().filter((s) =>
      platforms.includes(s.platform),
    );

    // 并行采集各平台
    const allProducts = (
      await Promise.all(scrapers.map((s) => s.search(keyword, pageCount)))
    ).flat();

    console.log(`📦 采集到 ${allProducts.length} 条商品数据\n`);

    // 处理流水线
    const processed = processProducts(allProducts, keyword);
    const valueScores = computeValueScores(processed.products);

    const result: SearchResult = {
      keyword,
      timestamp: processed.timestamp,
      platformStats: processed.platformStats,
      products: processed.products,
      valueScores,
      priceRange: processed.priceRange,
    };

    if (options.output === "json") {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printTable(result, topN);
    }
  });

function resolvePlatforms(platform: string): Platform[] {
  if (platform === "all") return ["jd", "taobao", "pdd"];
  const valid: Platform[] = ["jd", "taobao", "pdd"];
  return valid.includes(platform as Platform) ? [platform as Platform] : ["jd", "taobao", "pdd"];
}

function printTable(result: SearchResult, topN: number): void {
  // 平台统计
  console.log("=".repeat(70));
  console.log("📊 平台统计");
  console.log("=".repeat(70));
  for (const s of result.platformStats) {
    console.log(
      `  ${PLATFORM_LABELS[s.platform]}: ${s.count} 件 | 均价 ¥${s.avgPrice} | 最低 ¥${s.minPrice}`,
    );
  }

  // 价格区间
  console.log("\n📈 价格区间分布:");
  for (const [range, count] of Object.entries(result.priceRange)) {
    if (count > 0) {
      const bar = "█".repeat(Math.min(count, 30));
      console.log(`  ¥${range.padEnd(10)} ${bar} ${count} 件`);
    }
  }

  // 性价比排行
  console.log(`\n${"=".repeat(70)}`);
  console.log(`🏆 性价比排行 TOP ${topN}`);
  console.log("=".repeat(70));

  const top = result.valueScores.slice(0, topN);
  console.log(
    `\n${"排名".padEnd(5)} ${"商品名称".padEnd(30)} ${"价格".padEnd(10)} ${"销量".padEnd(10)} ${"评分".padEnd(6)} ${"性价比".padEnd(8)} ${"推荐"}`,
  );
  console.log("-".repeat(70));

  top.forEach((vs, i) => {
    const name = vs.product.name.slice(0, 28).padEnd(30);
    const price = vs.product.priceStr.padEnd(10);
    const sales = formatSales(vs.product.sales).padEnd(10);
    const rating = `★${vs.product.shopRating}`.padEnd(6);
    const score = `${vs.score}分`.padEnd(8);
    const level = LEVEL_LABELS[vs.level];
    const platform = `[${PLATFORM_LABELS[vs.product.platform]}]`;

    console.log(
      `${String(i + 1).padEnd(5)} ${name} ${price} ${sales} ${rating} ${score} ${level} ${platform}`,
    );
    if (vs.reasons.length > 0) {
      console.log(`      理由: ${vs.reasons.join(" | ")}`);
    }
  });

  console.log(`\n⏱  采集时间: ${result.timestamp}`);
  console.log(`📦 共 ${result.products.length} 件商品 (已去重排序)\n`);
}

function formatSales(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

program.parse();