// ============================================================
// 数据模型与类型定义
// ============================================================

/** 电商平台 */
export type Platform = "jd" | "taobao" | "pdd";

export const PLATFORM_LABELS: Record<Platform, string> = {
  jd: "京东",
  taobao: "淘宝",
  pdd: "拼多多",
};

export const PLATFORM_DOMAINS: Record<Platform, string> = {
  jd: "jd.com",
  taobao: "taobao.com",
  pdd: "pinduoduo.com",
};

/** 单条商品采集结果 */
export interface ProductItem {
  /** 唯一标识 */
  id: string;
  /** 商品名称 */
  name: string;
  /** 价格（元） */
  price: number;
  /** 原始价格字符串 */
  priceStr: string;
  /** 月销量 */
  sales: number;
  /** 店铺名称 */
  shopName: string;
  /** 店铺评分 (1-5) */
  shopRating: number;
  /** 商品链接 */
  url: string;
  /** 图片链接 */
  imageUrl: string;
  /** 来源平台 */
  platform: Platform;
  /** 搜索关键词 */
  keyword: string;
}

/** 性价比评分 */
export interface ValueScore {
  product: ProductItem;
  /** 综合性价比分数 (0-100) */
  score: number;
  /** 评分详细 */
  detail: {
    priceScore: number;
    salesScore: number;
    ratingScore: number;
  };
  /** 推荐等级 */
  level: "highly-recommended" | "recommended" | "normal" | "caution";
  /** 推荐理由 */
  reasons: string[];
}

/** 搜索结果汇总 */
export interface SearchResult {
  keyword: string;
  /** 采集时间 */
  timestamp: string;
  /** 平台统计 */
  platformStats: {
    platform: Platform;
    count: number;
    avgPrice: number;
    minPrice: number;
  }[];
  /** 所有商品 */
  products: ProductItem[];
  /** 性价比评分 */
  valueScores: ValueScore[];
  /** 价格区间统计 */
  priceRange: {
    "0-100": number;
    "100-500": number;
    "500-1000": number;
    "1000-5000": number;
    "5000+": number;
  };
}

/** 爬虫接口 */
export interface Scraper {
  platform: Platform;
  search(keyword: string, pageCount?: number): Promise<ProductItem[]>;
}