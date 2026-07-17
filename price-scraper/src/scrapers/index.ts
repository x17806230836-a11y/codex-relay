// ============================================================
// 爬虫基类 —— 定义统一的爬虫接口与公共逻辑
// ============================================================

import type { Platform, ProductItem, Scraper } from "../types.js";
import { generateMockProducts } from "../mock-data.js";

export abstract class BaseScraper implements Scraper {
  abstract platform: Platform;

  /**
   * 搜索商品 —— 实际部署时实现真实 HTTP 抓取 + cheerio 解析
   * 当前使用模拟数据以保证可运行性
   */
  async search(keyword: string, pageCount: number = 1): Promise<ProductItem[]> {
    const perPage = 12;
    const totalCount = perPage * pageCount;

    // 模拟网络延迟
    await this.delay(300 + Math.random() * 500);

    return generateMockProducts(this.platform, keyword, totalCount);
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

/**
 * 京东爬虫
 *
 * 实际实现思路：
 * 1. 使用 fetch/cheerio 请求搜索页
 * 2. 解析 .gl-item 商品列表
 * 3. 提取 data-sku、价格、标题、店铺等
 * 4. 翻页采集
 */
export class JDScraper extends BaseScraper {
  platform: Platform = "jd";
}

/**
 * 淘宝爬虫
 *
 * 实际实现思路：
 * 1. 淘宝反爬严格，建议使用无头浏览器 (Puppeteer/Playwright)
 * 2. 模拟用户搜索行为
 * 3. 解析渲染后的 DOM 获取商品数据
 * 4. 处理登录态与验证码
 */
export class TaobaoScraper extends BaseScraper {
  platform: Platform = "taobao";
}

/**
 * 拼多多爬虫
 *
 * 实际实现思路：
 * 1. 拼多多大量使用 JS 渲染，需无头浏览器
 * 2. 解析搜索列表 API 响应
 * 3. 注意反爬与频率控制
 */
export class PDDScraper extends BaseScraper {
  platform: Platform = "pdd";
}

/** 获取所有平台的爬虫实例 */
export function getAllScrapers(): Scraper[] {
  return [new JDScraper(), new TaobaoScraper(), new PDDScraper()];
}