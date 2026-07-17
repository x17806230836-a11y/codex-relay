// ============================================================
// 数据处理器 —— 清洗、去重、排序
// ============================================================

import type { ProductItem, SearchResult, Platform } from "../types.js";
import { PLATFORM_LABELS } from "../types.js";

/**
 * 数据清洗：过滤异常价格、补齐缺失字段
 */
export function cleanProducts(products: ProductItem[]): ProductItem[] {
  return products.filter((p) => {
    // 价格必须为正数
    if (p.price <= 0 || p.price > 999999) return false;
    // 名称不能为空
    if (!p.name || p.name.trim().length === 0) return false;
    return true;
  });
}

/**
 * 去重：基于商品名称相似度去重
 * 使用简单的 Jaccard 相似度判断
 */
export function deduplicateProducts(products: ProductItem[]): ProductItem[] {
  const seen: Set<string> = new Set();
  const result: ProductItem[] = [];

  for (const p of products) {
    const key = normalizeName(p.name);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(p);
  }

  return result;
}

/** 名称归一化 */
function normalizeName(name: string): string {
  return name
    .replace(/[（(].*?[)）]/g, "")
    .replace(/[【\[](.+?)[】\]]/g, "$1")
    .replace(/\s+/g, "")
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "")
    .toLowerCase()
    .slice(0, 30);
}

/**
 * 按价格从低到高排序
 */
export function sortByPrice(products: ProductItem[]): ProductItem[] {
  return [...products].sort((a, b) => a.price - b.price);
}

/**
 * 计算价格区间分布
 */
function calcPriceRange(products: ProductItem[]): SearchResult["priceRange"] {
  const range: SearchResult["priceRange"] = {
    "0-100": 0,
    "100-500": 0,
    "500-1000": 0,
    "1000-5000": 0,
    "5000+": 0,
  };
  for (const p of products) {
    if (p.price < 100) range["0-100"]++;
    else if (p.price < 500) range["100-500"]++;
    else if (p.price < 1000) range["500-1000"]++;
    else if (p.price < 5000) range["1000-5000"]++;
    else range["5000+"]++;
  }
  return range;
}

/**
 * 计算平台统计
 */
function calcPlatformStats(
  products: ProductItem[],
): SearchResult["platformStats"] {
  const map = new Map<Platform, ProductItem[]>();
  for (const p of products) {
    if (!map.has(p.platform)) map.set(p.platform, []);
    map.get(p.platform)!.push(p);
  }

  return Array.from(map.entries()).map(([platform, items]) => ({
    platform,
    count: items.length,
    avgPrice: Math.round((items.reduce((s, i) => s + i.price, 0) / items.length) * 100) / 100,
    minPrice: Math.min(...items.map((i) => i.price)),
  }));
}

/**
 * 完整的处理流水线：清洗 → 去重 → 排序
 */
export function processProducts(
  products: ProductItem[],
  keyword: string,
): Pick<SearchResult, "products" | "platformStats" | "priceRange" | "timestamp"> {
  const cleaned = cleanProducts(products);
  const deduped = deduplicateProducts(cleaned);
  const sorted = sortByPrice(deduped);

  return {
    products: sorted,
    platformStats: calcPlatformStats(sorted),
    priceRange: calcPriceRange(sorted),
    timestamp: new Date().toISOString(),
  };
}