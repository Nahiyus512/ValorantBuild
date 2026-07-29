import fs from "node:fs";

const API_BASE = "https://valorant-api.com/v1";
const LANGUAGE = "zh-CN";
const OUTPUT_PATH = "public/loadout-data.json";
const COSMETIC_OUTPUT_PATH = "public/cosmetic-data.json";

const rarityByTierId = {
  "12683d76-48d7-84a3-4e09-6985794f0445": "Select",
  "0cebb8be-46d7-c12a-d306-e9907bfc5a25": "Deluxe",
  "60bca009-4182-7998-dee7-b8a2558dc369": "Premium",
  "e046854e-406c-37f4-6607-19a9ba8426fc": "Exclusive",
  "471cb2e3-44b3-327c-6402-6f8e813a5c86": "Ultra",
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

const [weapons, buddies, cards, titles, sprays, contentTiers] = await Promise.all([
  fetchApi("weapons"),
  fetchApi("buddies"),
  fetchApi("playercards"),
  fetchApi("playertitles"),
  fetchApi("sprays"),
  fetchApi("contenttiers"),
]);

const tierMap = new Map(contentTiers.map((tier) => [tier.uuid, tier]));
const output = {
  generatedAt: new Date().toISOString(),
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
        const rarity = rarityByTierId[skin.contentTierUuid] ?? null;
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
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));
fs.writeFileSync(COSMETIC_OUTPUT_PATH, JSON.stringify(cosmeticOutput));

console.log(
  `已更新 ${output.weapons.length} 把武器、${output.weapons.reduce((sum, weapon) => sum + weapon.skins.length, 0)} 款皮肤、${output.buddies.length} 个挂饰。`,
);
