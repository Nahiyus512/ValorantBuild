export type Chroma = {
  id: string;
  name: string;
  render: string;
  swatch: string | null;
  isDefault: boolean;
};

export type Skin = {
  id: string;
  name: string;
  rarity: string | null;
  rarityName: string;
  rarityRank: number;
  rarityColor: string;
  rarityIcon: string | null;
  icon: string;
  chromas: Chroma[];
};

export type Weapon = {
  id: string;
  name: string;
  category: string;
  defaultSkinId: string;
  icon: string;
  skins: Skin[];
};

export type Buddy = { id: string; name: string; icon: string };
export type LoadoutData = { weapons: Weapon[]; buddies: Buddy[] };

export type Card = { id: string; name: string; icon: string };
export type Title = { id: string; name: string };
export type Spray = { id: string; name: string; icon: string };
export type Flex = { id: string; name: string; icon: string };
export type ExpressionType = "sprays" | "flexes";
export type CosmeticTab = "cards" | "titles" | ExpressionType;
export type ExpressionWheelItem = { type: ExpressionType; id: string };

export type CosmeticData = {
  cards: Card[];
  titles: Title[];
  sprays: Spray[];
  flexes: Flex[];
};

export type Equipped = {
  skinId: string;
  chromaId: string;
  buddyId: string | null;
};

export type SkinSort = "qualityAsc" | "qualityDesc";
