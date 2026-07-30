import type { CosmeticData, LoadoutData } from "@/types/valorant";

let loadoutPromise: Promise<LoadoutData> | undefined;
let cosmeticPromise: Promise<CosmeticData> | undefined;

async function fetchJson<T>(url: string, validate: (value: unknown) => boolean): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`加载 ${url} 失败（${response.status}）`);
  const value: unknown = await response.json();
  if (!validate(value)) throw new Error(`${url} 的数据格式无效`);
  return value as T;
}

export function loadLoadoutData(): Promise<LoadoutData> {
  loadoutPromise ??= fetchJson<LoadoutData>(
    "/loadout-data.json",
    value => !!value && typeof value === "object" && Array.isArray((value as LoadoutData).weapons) && Array.isArray((value as LoadoutData).buddies),
  ).catch(error => {
    loadoutPromise = undefined;
    throw error;
  });
  return loadoutPromise;
}

export function loadCosmeticData(): Promise<CosmeticData> {
  cosmeticPromise ??= fetchJson<CosmeticData>(
    "/cosmetic-data.json",
    value => {
      if (!value || typeof value !== "object") return false;
      const data = value as CosmeticData;
      return [data.cards, data.titles, data.sprays, data.flexes].every(Array.isArray);
    },
  ).catch(error => {
    cosmeticPromise = undefined;
    throw error;
  });
  return cosmeticPromise;
}
