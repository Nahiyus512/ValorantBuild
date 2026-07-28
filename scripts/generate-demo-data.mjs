import fs from "node:fs";

const weapons = JSON.parse(fs.readFileSync("data/weapons.json", "utf8"));
const rawWeaponsJson = JSON.parse(fs.readFileSync("data/raw/weapons.json", "utf8"));
const rawWeapons = rawWeaponsJson.data ?? rawWeaponsJson;
const buddies = JSON.parse(fs.readFileSync("data/buddies.json", "utf8"));
const cards = JSON.parse(fs.readFileSync("data/cards.json", "utf8"));
const titles = JSON.parse(fs.readFileSync("data/titles.json", "utf8"));
const sprays = JSON.parse(fs.readFileSync("data/sprays.json", "utf8"));
const rawBuddiesJson = JSON.parse(fs.readFileSync("data/raw/buddies.json", "utf8"));
const rawBuddies = rawBuddiesJson.data ?? rawBuddiesJson;
const rawWeaponMap = new Map(rawWeapons.map((weapon) => [weapon.uuid, weapon]));
const rawBuddyMap = new Map(rawBuddies.map((buddy) => [buddy.uuid, buddy]));

const asset = (type, uuid, name) =>
  `https://media.valorant-api.com/${type}/${uuid}/${name}.png`;
const cnTierPrices = { Select: 590, Deluxe: 890, Premium: 1290, Exclusive: 1590, Ultra: 1790 };
const meleePriceCN = (priceVP) => {
  if (priceVP <= 1750) return 1180;
  if (priceVP <= 2550) return 2580;
  if (priceVP <= 3550) return 3180;
  return 3780;
};

const output = {
  generatedAt: new Date().toISOString(),
  priceNote: "枪械采用国服品质档位；近战武器按 1180、2580、3180、3780 四档独立定价。",
  weapons: weapons.map((weapon) => {
    const raw = rawWeaponMap.get(weapon.uuid);
    return {
      id: weapon.uuid,
      name: weapon.name,
      category: weapon.category,
      defaultSkinId: raw?.defaultSkinUuid ?? weapon.skins.at(-1)?.uuid,
      icon: asset("weapons", weapon.uuid, "displayicon"),
      skins: weapon.skins
        .filter((skin) => !skin.name.includes("随机选择"))
        .map((skin) => ({
          id: skin.uuid,
          name: skin.name,
          rarity: skin.rarity,
          rarityName: skin.rarityName ?? "默认",
          rarityRank: skin.rarityRank ?? -1,
          rarityColor: skin.rarityColor ?? "#718791",
          rarityIcon: skin.rarityUuid
            ? asset("contenttiers", skin.rarityUuid, "displayicon")
            : null,
          priceVP: skin.priceVP,
          priceCN: skin.priceVP == null
            ? null
            : (weapon.category === "Melee" ? meleePriceCN(skin.priceVP) : (cnTierPrices[skin.rarity] ?? null)),
          icon: asset("weaponskins", skin.uuid, "displayicon"),
          chromas: skin.chromas.map((chroma, index) => ({
            id: chroma.uuid,
            name: chroma.name,
            render: asset("weaponskinchromas", chroma.uuid, "fullrender"),
            swatch: skin.chromas.length > 1
              ? asset("weaponskinchromas", chroma.uuid, "swatch")
              : null,
            priceRadianite: chroma.priceRadianite,
            isDefault: index === 0,
          })),
        })),
    };
  }),
  buddies: buddies.map((buddy) => {
    const raw = rawBuddyMap.get(buddy.uuid);
    return {
      id: buddy.uuid,
      name: buddy.name,
      icon: raw?.displayIcon ?? asset("buddies", buddy.uuid, "displayicon"),
    };
  }),
};

fs.writeFileSync("public/demo-data.json", JSON.stringify(output));

fs.mkdirSync("public/cosmetics/cards", { recursive: true });
fs.mkdirSync("public/cosmetics/sprays", { recursive: true });
const availableCards = cards.filter((card) => fs.existsSync(card.smallArt));
const availableSprays = sprays.filter((spray) => fs.existsSync(spray.transparentIcon));
for (const card of availableCards) {
  fs.copyFileSync(card.smallArt, `public/cosmetics/cards/${card.uuid}.png`);
}
for (const spray of availableSprays) {
  fs.copyFileSync(spray.transparentIcon, `public/cosmetics/sprays/${spray.uuid}.png`);
}
fs.writeFileSync("public/cosmetic-data.json", JSON.stringify({
  cards: availableCards.map((card) => ({
    id: card.uuid,
    name: card.name,
    icon: `/cosmetics/cards/${card.uuid}.png`,
  })),
  titles: titles.map((title) => ({
    id: title.uuid,
    name: title.titleText || title.name,
  })),
  sprays: availableSprays.map((spray) => ({
    id: spray.uuid,
    name: spray.name,
    icon: `/cosmetics/sprays/${spray.uuid}.png`,
  })),
}));
