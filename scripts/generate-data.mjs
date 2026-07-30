import fs from "node:fs";

const API_BASE = "https://valorant-api.com/v1";
const LANGUAGE = "zh-CN";
const OUTPUT_PATH = "public/loadout-data.json";
const COSMETIC_OUTPUT_PATH = "public/cosmetic-data.json";
const STATS_OUTPUT_PATH = "app/generated/valorant-stats.json";

const rarityByTierRank = {
  0: "Select",
  1: "Deluxe",
  2: "Premium",
  3: "Exclusive",
  4: "Ultra",
};

async function fetchApi(endpoint, attempts = 3) {
  const url = `${API_BASE}/${endpoint}?language=${LANGUAGE}`;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "ValorantBuild data updater" },
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const payload = await response.json();
      if (!Array.isArray(payload.data)) throw new Error("响应缺少 data 数组");
      return payload.data;
    } catch (error) {
      if (attempt === attempts) throw new Error(`获取 ${endpoint} 失败：${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

function colorFromTier(tier) {
  const value = tier?.highlightColor;
  return value ? `#${value.slice(0, 6)}` : "#718791";
}

const [weapons, buddies, cards, titles, sprays, flexes, contentTiers] = await Promise.all([
  fetchApi("weapons"),
  fetchApi("buddies"),
  fetchApi("playercards"),
  fetchApi("playertitles"),
  fetchApi("sprays"),
  fetchApi("flex"),
  fetchApi("contenttiers"),
]);

const generatedAt = new Date().toISOString();
const tierMap = new Map(contentTiers.map((tier) => [tier.uuid, tier]));
const output = {
  generatedAt,
  weapons: weapons.map((weapon) => ({
    id: weapon.uuid,
    name: weapon.displayName,
    category: weapon.category.replace("EEquippableCategory::", ""),
    defaultSkinId: weapon.defaultSkinUuid,
    icon: weapon.displayIcon,
    skins: weapon.skins
      .filter((skin) => !skin.displayName.includes("从个人最爱中随机选择"))
      .map((skin) => {
        const tier = tierMap.get(skin.contentTierUuid);
        if (skin.contentTierUuid && !tier) {
          throw new Error(
            `皮肤 ${skin.displayName} 引用了未知品质 UUID：${skin.contentTierUuid}`,
          );
        }
        const rarity = rarityByTierRank[tier?.rank] ?? null;
        if (tier && !rarity) {
          throw new Error(
            `未知品质等级：${tier.displayName}（rank=${tier.rank}, uuid=${tier.uuid}）`,
          );
        }
        return {
          id: skin.uuid,
          name: skin.displayName,
          rarity,
          rarityName: tier?.displayName ?? "默认",
          rarityRank: tier?.rank ?? -1,
          rarityColor: colorFromTier(tier),
          rarityIcon: tier?.displayIcon ?? null,
          icon: skin.displayIcon ?? skin.levels[0]?.displayIcon ?? null,
          chromas: skin.chromas.map((chroma, index) => ({
            id: chroma.uuid,
            name: chroma.displayName,
            render: chroma.fullRender ?? chroma.displayIcon,
            swatch: chroma.swatch,
            isDefault: index === 0,
          })),
        };
      }),
  })),
  buddies: buddies.map((buddy) => ({
    id: buddy.uuid,
    name: buddy.displayName,
    icon: buddy.displayIcon ?? buddy.levels[0]?.displayIcon ?? null,
  })),
};

const cosmeticOutput = {
  cards: cards.map((card) => ({
    id: card.uuid,
    name: card.displayName,
    icon: card.largeArt ?? card.wideArt ?? card.displayIcon,
  })),
  titles: titles
    .map((title) => ({
      id: title.uuid,
      name: title.titleText || title.displayName || "未命名称号",
    }))
    .filter((title) => title.name.trim()),
  sprays: sprays.map((spray) => ({
    id: spray.uuid,
    name: spray.displayName,
    icon: spray.fullTransparentIcon ?? spray.displayIcon ?? null,
  })),
  flexes: flexes.map((flex) => ({
    id: flex.uuid,
    name: flex.displayName,
    icon: flex.displayIcon ?? null,
  })),
};

const stats = {
  generatedAt,
  weaponCount: output.weapons.length,
  skinCount: output.weapons.reduce((sum, weapon) => sum + weapon.skins.length, 0),
  buddyCount: output.buddies.length,
};

fs.mkdirSync("app/generated", { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));
fs.writeFileSync(COSMETIC_OUTPUT_PATH, JSON.stringify(cosmeticOutput));
fs.writeFileSync(STATS_OUTPUT_PATH, `${JSON.stringify(stats, null, 2)}\n`);

console.log(
  `已更新 ${stats.weaponCount} 把武器、${stats.skinCount} 款皮肤、${stats.buddyCount} 个挂饰。`,
);
