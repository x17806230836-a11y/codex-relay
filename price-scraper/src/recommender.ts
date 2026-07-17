// ============================================================
// 性价比推荐引擎
// 综合价格、销量、店铺评分计算性价比分数
// ============================================================

import type { ProductItem, ValueScore } from "../types.js";

/**
 * 计算所有商品的性价比评分
 *
 * 评分逻辑：
 * - 价格分：价格越低分越高（同品类内归一化）
 * - 销量分：销量越高分越高
 * - 评分分：店铺评分越高分越高
 * - 综合 = 价格分*40% + 销量分*35% + 评分分*25%
 */
export function computeValueScores(products: ProductItem[]): ValueScore[] {
  if (products.length === 0) return [];

  const prices = products.map((p) => p.price);
  const sales = products.map((p) => p.sales);
  const ratings = products.map((p) => p.shopRating);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minSales = Math.min(...sales);
  const maxSales = Math.max(...sales);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);

  const priceRange = maxPrice - minPrice || 1;
  const salesRange = maxSales - minSales || 1;
  const ratingRange = maxRating - minRating || 1;

  const scores: ValueScore[] = products.map((p) => {
    // 价格越低分越高（反向归一化）
    const priceScore = ((maxPrice - p.price) / priceRange) * 100;
    // 销量越高分越高
    const salesScore = ((p.sales - minSales) / salesRange) * 100;
    // 评分越高分越高
    const ratingScore = ((p.shopRating - minRating) / ratingRange) * 100;

    const score = Math.round(priceScore * 0.4 + salesScore * 0.35 + ratingScore * 0.25);

    const reasons: string[] = [];
    if (priceScore > 70) reasons.push("价格优势明显");
    if (salesScore > 70) reasons.push("销量领先，市场认可度高");
    if (ratingScore > 70) reasons.push("店铺评分优秀");
    if (p.shopRating >= 4.8) reasons.push("高评分店铺");
    if (p.price <= minPrice * 1.1) reasons.push("同品类最低价区间");

    let level: ValueScore["level"];
    if (score >= 80) level = "highly-recommended";
    else if (score >= 60) level = "recommended";
    else if (score >= 40) level = "normal";
    else level = "caution";

    return {
      product: p,
      score,
      detail: {
        priceScore: Math.round(priceScore),
        salesScore: Math.round(salesScore),
        ratingScore: Math.round(ratingScore),
      },
      level,
      reasons,
    };
  });

  // 按综合分降序
  scores.sort((a, b) => b.score - a.score);
  return scores;
}

/** 性价比等级中文标签 */
export const LEVEL_LABELS: Record<ValueScore["level"], string> = {
  "highly-recommended": "强烈推荐",
  recommended: "推荐",
  normal: "一般",
  caution: "谨慎",
};

/** 性价比等级颜色 */
export const LEVEL_COLORS: Record<ValueScore["level"], string> = {
  "highly-recommended": "#22c55e",
  recommended: "#3b82f6",
  normal: "#f59e0b",
  caution: "#ef4444",
};