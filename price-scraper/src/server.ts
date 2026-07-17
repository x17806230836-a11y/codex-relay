// ============================================================
// Web 服务器 —— 提供 API 接口与演示页面
// ============================================================

import express from "express";
import { getAllScrapers } from "./scrapers/index.js";
import { processProducts } from "./processor.js";
import { computeValueScores } from "./recommender.js";
import type { Platform, SearchResult } from "./types.js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(resolve(__dirname, "../public")));

// API: 搜索商品
app.get("/api/search", async (req, res) => {
  try {
    const keyword = (req.query.keyword as string) || "手机";
    const platform = (req.query.platform as string) || "all";
    const pages = Math.max(1, parseInt(req.query.pages as string) || 1);

    const platforms: Platform[] =
      platform === "all"
        ? ["jd", "taobao", "pdd"]
        : (["jd", "taobao", "pdd"].includes(platform) ? [platform as Platform] : ["jd", "taobao", "pdd"]);

    const scrapers = getAllScrapers().filter((s) => platforms.includes(s.platform));

    const allProducts = (
      await Promise.all(scrapers.map((s) => s.search(keyword, pages)))
    ).flat();

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

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: 获取示例数据（初始化时展示）
app.get("/api/demo", async (_req, res) => {
  try {
    const keyword = "手机";
    const scrapers = getAllScrapers();
    const allProducts = (
      await Promise.all(scrapers.map((s) => s.search(keyword, 1)))
    ).flat();

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

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// 首页
app.get("/", (_req, res) => {
  const html = readFileSync(resolve(__dirname, "../public/index.html"), "utf-8");
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`🚀 价格采集工具已启动: http://localhost:${PORT}`);
  console.log(`📊 示例数据: http://localhost:${PORT}/api/demo`);
  console.log(`🔍 搜索API: http://localhost:${PORT}/api/search?keyword=手机`);
});