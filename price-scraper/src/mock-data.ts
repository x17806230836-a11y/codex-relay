// ============================================================
// 模拟数据生成器 —— 为各平台生成逼真的商品数据
// 实际部署时可替换为真实爬虫逻辑
// ============================================================

import type { Platform, ProductItem } from "../types.js";

const BRANDS: Record<string, string[]> = {
  phone: [
    "iPhone 15 Pro Max",
    "iPhone 15 Pro",
    "iPhone 15",
    "华为 Mate 60 Pro",
    "华为 Pura 70 Ultra",
    "小米 14 Ultra",
    "小米 14 Pro",
    "OPPO Find X7 Ultra",
    "vivo X100 Pro",
    "荣耀 Magic6 Pro",
    "三星 Galaxy S24 Ultra",
    "一加 12",
  ],
  laptop: [
    "MacBook Pro 14 M3",
    "MacBook Air 15 M3",
    "ThinkPad X1 Carbon",
    "华为 MateBook X Pro",
    "小米笔记本 Pro 16",
    "华硕 灵耀14",
    "联想 小新 Pro 16",
    "戴尔 XPS 15",
    "惠普 战99",
    "ROG 枪神8 Plus",
    "暗影精灵 10",
    "RedmiBook Pro 16",
  ],
  headphone: [
    "AirPods Pro 2",
    "Sony WH-1000XM5",
    "Bose QC Ultra",
    "华为 FreeBuds Pro 3",
    "小米 Buds 4 Pro",
    "OPPO Enco X2",
    "森海塞尔 Momentum 4",
    "三星 Galaxy Buds3 Pro",
    "Beats Studio Pro",
    "JBL Tour One M2",
    "漫步者 NeoBuds Pro 2",
    "vivo TWS 4",
  ],
  default: [
    "旗舰款智能手表",
    "4K高清投影仪",
    "机械键盘RGB",
    "无线蓝牙音箱",
    "便携式充电宝",
    "智能体脂秤",
    "电动牙刷",
    "空气炸锅",
    "扫地机器人",
    "加湿器",
    "台灯护眼",
    "移动固态硬盘",
  ],
};

const SHOP_NAMES: Record<Platform, string[]> = {
  jd: [
    "官方旗舰店",
    "京东自营",
    "数码专营店",
    "品质优选店",
    "品牌授权店",
    "潮电旗舰店",
    "京东国际",
    "优选好货店",
  ],
  taobao: [
    "天猫官方旗舰店",
    "品牌直营店",
    "数码港专营店",
    "星选好货店",
    "全球购旗舰店",
    "酷玩数码店",
    "品质生活馆",
    "海淘优选店",
  ],
  pdd: [
    "品牌官方店",
    "万人团优选",
    "好货精选店",
    "百亿补贴店",
    "品质工厂店",
    "品牌特卖店",
    "天天特价店",
    "源头好货店",
  ],
};

function getBrands(keyword: string): string[] {
  for (const [k, v] of Object.entries(BRANDS)) {
    if (keyword.includes(k)) return v;
  }
  return BRANDS.default;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function generateMockProducts(
  platform: Platform,
  keyword: string,
  count: number = 12,
): ProductItem[] {
  const brands = getBrands(keyword);
  const shops = SHOP_NAMES[platform];

  // 各平台价格策略不同
  const priceMultiplier: Record<Platform, number> = {
    jd: 1.0,
    taobao: 0.92,
    pdd: 0.78,
  };

  const products: ProductItem[] = [];

  for (let i = 0; i < count; i++) {
    const brandName = pick(brands);
    const variant = ["标配", "高配", "顶配", "旗舰款", "入门款", "热销款"][i % 6];
    const name = `${brandName} ${variant}`;

    const basePrice =
      keyword.includes("手机")
        ? randBetween(999, 9999)
        : keyword.includes("笔记本") || keyword.includes("电脑")
          ? randBetween(2999, 14999)
          : keyword.includes("耳机")
            ? randBetween(99, 2999)
            : randBetween(49, 5999);

    const price = Math.round(basePrice * priceMultiplier[platform] * 100) / 100;
    const sales = randInt(100, 500000);
    const rating = Math.round(randBetween(3.8, 5.0) * 10) / 10;

    products.push({
      id: `${platform}-${generateId()}`,
      name,
      price,
      priceStr: `¥${price.toFixed(2)}`,
      sales,
      shopName: `${pick(shops)}`,
      shopRating: rating,
      url: `https://www.${platform === "pdd" ? "pinduoduo" : platform}.com/item/${generateId()}`,
      imageUrl: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(name + "产品图，白色背景")}&image_size=square`,
      platform,
      keyword,
    });
  }

  return products;
}