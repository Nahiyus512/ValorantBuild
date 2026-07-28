import fs from "node:fs";

const weapons = JSON.parse(fs.readFileSync("data/weapons.json", "utf8"));
const rawWeaponsJson = JSON.parse(fs.readFileSync("data/raw/weapons.json", "utf8"));
const rawWeapons = rawWeaponsJson.data ?? rawWeaponsJson;
const buddies = JSON.parse(fs.readFileSync("data/buddies.json", "utf8"));
const rawBuddiesJson = JSON.parse(fs.readFileSync("data/raw/buddies.json", "utf8"));
const rawBuddies = rawBuddiesJson.data ?? rawBuddiesJson;
const rawWeaponMap = new Map(rawWeapons.map((weapon) => [weapon.uuid, weapon]));
const rawBuddyMap = new Map(rawBuddies.map((buddy) => [buddy.uuid, buddy]));

const asset = (type, uuid, name) =>
  `https://media.valorant-api.com/${type}/${uuid}/${name}.png`;

const output = {
  generatedAt: new Date().toISOString(),
  priceNote: "人民币价格按国服基础比例 1 元≈10 点券估算，未计充值档位赠送。",
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
          priceVP: skin.priceVP,
          priceCNY: skin.priceVP == null ? null : Math.round(skin.priceVP / 10 * 10) / 10,
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
