"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GameCanvas } from "@/components/layout/game-canvas";
import { TopBrandBar } from "@/components/navigation/top-brand-bar";
import { LoadingState } from "@/components/ui/loading-state";
import { SharePreview } from "@/components/ui/share-preview";
import { SkinFilterDialog } from "@/components/ui/skin-filter-dialog";
import { WeaponBoard } from "@/components/valorant/weapon-board";
import { useFixedCanvasScale } from "@/hooks/use-fixed-canvas-scale";
import { useShareImage } from "@/hooks/use-share-image";
import valorantStats from "@/generated/valorant-stats.json";
import { asDataUrl, embedCloneImages, renderElementToPng } from "@/lib/share-image";
import { readStorage, writeStorage } from "@/lib/storage";
import { loadCosmeticData, loadLoadoutData } from "@/lib/valorant-data";
import type {
  CosmeticData,
  CosmeticTab,
  Equipped,
  ExpressionType,
  ExpressionWheelItem,
  LoadoutData,
  Skin,
  SkinSort,
  Weapon,
} from "@/types/valorant";

const storageKey = "valorantbuild.loadout.v1";
const cardTabs = [["cards", "卡面"], ["titles", "称号"]] as const;
const expressionTabs = [["sprays", "喷漆"], ["flexes", "盘盘"]] as const;

type LoadoutView = "home" | "select" | "card" | "expression";

type StoredLoadout = {
  playerName?: string;
  playerLevel?: string;
  equipped?: Record<string, Equipped>;
  selectedCardId?: string;
  selectedTitleId?: string;
  selectedSprayId?: string;
  selectedFlexId?: string;
  equippedCardId?: string | null;
  equippedTitleId?: string | null;
  expressionWheel?: Array<ExpressionWheelItem | null>;
};

function createDefaultLoadout(data: LoadoutData): Record<string, Equipped> {
  return Object.fromEntries(data.weapons.map(weapon => {
    const skin = weapon.skins.find(item => item.id === weapon.defaultSkinId)
      ?? weapon.skins.at(-1)!;
    return [weapon.id, {
      skinId: skin.id,
      chromaId: skin.chromas[0]?.id ?? "",
      buddyId: null,
    }];
  }));
}

export function LoadoutBuilder() {
  const router = useRouter();
  const canvasScale = useFixedCanvasScale();
  const share = useShareImage("valorantbuild-loadout.png");
  const gridRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<LoadoutData | null>(null);
  const [cosmetics, setCosmetics] = useState<CosmeticData | null>(null);
  const [view, setView] = useState<LoadoutView>("home");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  const [weaponId, setWeaponId] = useState("");
  const [tab, setTab] = useState<"skin" | "buddy">("skin");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SkinSort>("qualityDesc");
  const [qualities, setQualities] = useState<string[]>([]);
  const [skinId, setSkinId] = useState("");
  const [chromaId, setChromaId] = useState("");
  const [buddyId, setBuddyId] = useState<string | null>(null);
  const [equipped, setEquipped] = useState<Record<string, Equipped>>({});
  const [filterOpen, setFilterOpen] = useState(false);

  const [playerName, setPlayerName] = useState("ValorantBuild");
  const [playerLevel, setPlayerLevel] = useState("100");
  const [cosmeticTab, setCosmeticTab] = useState<CosmeticTab>("cards");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [selectedTitleId, setSelectedTitleId] = useState("");
  const [selectedSprayId, setSelectedSprayId] = useState("");
  const [selectedFlexId, setSelectedFlexId] = useState("");
  const [equippedCardId, setEquippedCardId] = useState<string | null>(null);
  const [equippedTitleId, setEquippedTitleId] = useState<string | null>(null);
  const [expressionWheel, setExpressionWheel] = useState<Array<ExpressionWheelItem | null>>([]);
  const [wheelPickerOpen, setWheelPickerOpen] = useState(false);

  const [listScroll, setListScroll] = useState(0);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([loadLoadoutData(), loadCosmeticData()])
      .then(([loadoutData, cosmeticData]) => {
        if (!active) return;
        const stored = readStorage<StoredLoadout>(storageKey);
        setData(loadoutData);
        setCosmetics(cosmeticData);
        setEquipped({
          ...createDefaultLoadout(loadoutData),
          ...(stored?.equipped ?? {}),
        });
        if (stored?.playerName) setPlayerName(stored.playerName);
        if (stored?.playerLevel) setPlayerLevel(stored.playerLevel);
        setSelectedCardId(stored?.selectedCardId ?? cosmeticData.cards[0]?.id ?? "");
        setSelectedTitleId(stored?.selectedTitleId ?? cosmeticData.titles[0]?.id ?? "");
        setSelectedSprayId(stored?.selectedSprayId ?? cosmeticData.sprays[0]?.id ?? "");
        setSelectedFlexId(stored?.selectedFlexId ?? cosmeticData.flexes[0]?.id ?? "");
        setEquippedCardId(stored?.equippedCardId ?? null);
        setEquippedTitleId(stored?.equippedTitleId ?? null);
        setExpressionWheel(stored?.expressionWheel ?? []);
        setStorageReady(true);
      })
      .catch(error => {
        if (active) setLoadError(error instanceof Error ? error.message : "数据加载失败");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const timer = window.setTimeout(() => {
      writeStorage(storageKey, {
        version: 1,
        playerName,
        playerLevel,
        equipped,
        selectedCardId,
        selectedTitleId,
        selectedSprayId,
        selectedFlexId,
        equippedCardId,
        equippedTitleId,
        expressionWheel,
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    equipped,
    equippedCardId,
    equippedTitleId,
    expressionWheel,
    playerLevel,
    playerName,
    selectedCardId,
    selectedFlexId,
    selectedSprayId,
    selectedTitleId,
    storageReady,
  ]);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (grid) {
      grid.scrollTop = 0;
      setScrollable(grid.scrollHeight > grid.clientHeight);
    } else {
      setScrollable(false);
    }
    setListScroll(0);
  }, [weaponId, tab, view, cosmeticTab, query, qualities, sort]);

  const weapon = data?.weapons.find(item => item.id === weaponId);
  const selectedSkin = weapon?.skins.find(item => item.id === skinId);
  const selectedChroma = selectedSkin?.chromas.find(item => item.id === chromaId)
    ?? selectedSkin?.chromas[0];
  const selectedBuddy = weapon?.category === "Melee"
    ? undefined
    : data?.buddies.find(item => item.id === buddyId);
  const selectionIsEquipped = !!(
    weapon
    && selectedSkin
    && selectedChroma
    && equipped[weapon.id]?.skinId === selectedSkin.id
    && equipped[weapon.id]?.chromaId === selectedChroma.id
    && equipped[weapon.id]?.buddyId === buddyId
  );

  const normalizedQuery = query.toLowerCase();
  const visibleSkins = useMemo(() => {
    const currentWeapon = data?.weapons.find(item => item.id === weaponId);
    if (!currentWeapon) return [];
    let list = currentWeapon.skins.filter(skin =>
      skin.name.toLowerCase().includes(normalizedQuery)
      && (!qualities.length || qualities.includes(skin.rarity ?? ""))
    );
    if (sort === "qualityAsc") list = [...list].sort((a, b) => a.rarityRank - b.rarityRank);
    if (sort === "qualityDesc") list = [...list].sort((a, b) => b.rarityRank - a.rarityRank);
    return list;
  }, [data, normalizedQuery, qualities, sort, weaponId]);
  const visibleBuddies = useMemo(
    () => data?.buddies.filter(item => item.name.toLowerCase().includes(normalizedQuery)) ?? [],
    [data, normalizedQuery],
  );
  const selectedCard = cosmetics?.cards.find(item => item.id === selectedCardId);
  const selectedTitle = cosmetics?.titles.find(item => item.id === selectedTitleId);
  const selectedSpray = cosmetics?.sprays.find(item => item.id === selectedSprayId);
  const selectedFlex = cosmetics?.flexes.find(item => item.id === selectedFlexId);
  const equippedCard = cosmetics?.cards.find(item => item.id === equippedCardId);
  const equippedTitle = cosmetics?.titles.find(item => item.id === equippedTitleId);
  const cosmeticItems = useMemo(() => {
    if (!cosmetics) return [];
    const source = cosmeticTab === "cards"
      ? cosmetics.cards
      : cosmeticTab === "titles"
        ? cosmetics.titles
        : cosmeticTab === "sprays"
          ? cosmetics.sprays
          : cosmetics.flexes;
    return source.filter(item => item.name.toLowerCase().includes(normalizedQuery));
  }, [cosmeticTab, cosmetics, normalizedQuery]);

  function openWeapon(nextWeapon: Weapon) {
    const loadout = equipped[nextWeapon.id];
    const skin = nextWeapon.skins.find(item => item.id === loadout?.skinId)
      ?? nextWeapon.skins.at(-1)!;
    setWeaponId(nextWeapon.id);
    setSkinId(skin.id);
    setChromaId(loadout?.chromaId ?? skin.chromas[0]?.id);
    setBuddyId(nextWeapon.category === "Melee" ? null : loadout?.buddyId ?? null);
    setTab("skin");
    setQuery("");
    setView("select");
  }

  function chooseSkin(skin: Skin) {
    setSkinId(skin.id);
    setChromaId(skin.chromas[0]?.id);
  }

  function toggleWeaponEquip() {
    if (!weapon || !selectedSkin || !selectedChroma) return;
    if (selectionIsEquipped) {
      const defaultSkin = weapon.skins.find(item => item.id === weapon.defaultSkinId)
        ?? weapon.skins.at(-1)!;
      setEquipped(current => ({
        ...current,
        [weapon.id]: {
          skinId: defaultSkin.id,
          chromaId: defaultSkin.chromas[0]?.id,
          buddyId: null,
        },
      }));
      return;
    }
    setEquipped(current => ({
      ...current,
      [weapon.id]: {
        skinId: selectedSkin.id,
        chromaId: selectedChroma.id,
        buddyId: weapon.category === "Melee" ? null : buddyId,
      },
    }));
  }

  function getWeaponDisplay(nextWeapon: Weapon) {
    const loadout = equipped[nextWeapon.id];
    const skin = nextWeapon.skins.find(item => item.id === loadout?.skinId)
      ?? nextWeapon.skins.at(-1)!;
    return skin.chromas.find(item => item.id === loadout?.chromaId)?.render
      ?? skin.chromas[0]?.render
      ?? nextWeapon.icon;
  }

  function toggleQuality(quality: string) {
    setQualities(current =>
      current.includes(quality)
        ? current.filter(item => item !== quality)
        : [...current, quality],
    );
  }

  function updateListScroll(element: HTMLDivElement) {
    setListScroll(element.scrollTop / Math.max(1, element.scrollHeight - element.clientHeight));
  }

  function moveCustomScroll(event: React.PointerEvent<HTMLDivElement>) {
    const rail = event.currentTarget;
    const list = rail.previousElementSibling as HTMLElement | null;
    if (!list) return;
    if (event.type === "pointerdown") rail.setPointerCapture(event.pointerId);
    if (event.type === "pointermove" && !rail.hasPointerCapture(event.pointerId)) return;
    const rect = rail.getBoundingClientRect();
    const thumbHeight = 160 * canvasScale;
    const ratio = Math.max(
      0,
      Math.min(1, (event.clientY - rect.top - thumbHeight / 2) / Math.max(1, rect.height - thumbHeight)),
    );
    list.scrollTop = ratio * Math.max(0, list.scrollHeight - list.clientHeight);
  }

  function openCosmetics(nextView: "card" | "expression") {
    setCosmeticTab(nextView === "card" ? "cards" : "sprays");
    setQuery("");
    setView(nextView);
  }

  function selectCosmeticItem(id: string) {
    if (cosmeticTab === "cards") setSelectedCardId(id);
    else if (cosmeticTab === "titles") setSelectedTitleId(id);
    else if (cosmeticTab === "sprays") setSelectedSprayId(id);
    else setSelectedFlexId(id);
  }

  const selectedExpressionType: ExpressionType = cosmeticTab === "flexes" ? "flexes" : "sprays";
  const selectedExpressionId = selectedExpressionType === "sprays"
    ? selectedSprayId
    : selectedFlexId;
  const cosmeticIsEquipped = cosmeticTab === "cards"
    ? equippedCardId === selectedCardId
    : cosmeticTab === "titles"
      ? equippedTitleId === selectedTitleId
      : expressionWheel.some(item =>
          item?.type === selectedExpressionType && item.id === selectedExpressionId
        );

  function toggleCosmeticEquip() {
    if (cosmeticTab === "cards") {
      setEquippedCardId(cosmeticIsEquipped ? null : selectedCardId);
    } else if (cosmeticTab === "titles") {
      setEquippedTitleId(cosmeticIsEquipped ? null : selectedTitleId);
    } else if (cosmeticIsEquipped) {
      setExpressionWheel(current => current.map(item =>
        item?.type === selectedExpressionType && item.id === selectedExpressionId
          ? null
          : item
      ));
    } else {
      setWheelPickerOpen(true);
    }
  }

  function equipExpressionAt(slot: number) {
    setExpressionWheel(current => {
      const next = [...current];
      while (next.length < 4) next.push(null);
      next[slot] = { type: selectedExpressionType, id: selectedExpressionId };
      return next;
    });
    setWheelPickerOpen(false);
  }

  async function shareHome() {
    if (share.generating) return;
    share.setGenerating(true);
    if (view !== "home") {
      setView("home");
      await new Promise(resolve => window.setTimeout(resolve, 80));
    }
    const stage = document.querySelector(".fixed-stage") as HTMLElement | null;
    const background = document.querySelector(".background-layer");
    if (!stage) {
      share.setGenerating(false);
      return;
    }
    const clone = stage.cloneNode(true) as HTMLElement;
    clone.querySelector(".shared-topbar")?.remove();
    clone.querySelector(".home-foot")?.remove();
    if (background) {
      const backgroundClone = background.cloneNode(true) as HTMLElement;
      backgroundClone.style.position = "absolute";
      backgroundClone.style.inset = "0";
      backgroundClone.style.zIndex = "0";
      const glow = backgroundClone.querySelector<HTMLElement>(".center-glow");
      if (glow) glow.style.opacity = "1";
      clone.insertBefore(backgroundClone, clone.firstChild);
    }
    clone.style.setProperty("--canvas-scale", "1");
    clone.style.cssText += ";transform:none;position:relative;left:0;top:0;width:1920px;height:1022px;overflow:hidden;background-color:#061521;color:#edf3f1;font-family:\"Noto Sans SC\",\"Microsoft YaHei\",sans-serif;font-weight:900";
    await embedCloneImages(stage, clone);
    const card = clone.querySelector<HTMLElement>(".player-card");
    if (card && equippedCard) {
      card.style.setProperty("--card-art", `url(${await asDataUrl(equippedCard.icon)})`);
    }
    try {
      share.showBlob(await renderElementToPng(clone, 1920, 1022));
    } catch {
      window.alert("图片生成失败，请重试");
    } finally {
      share.setGenerating(false);
    }
  }

  if (loadError) return <LoadingState error message={`${loadError}，请刷新重试。`} />;
  if (!data || !cosmetics) {
    return (
      <LoadingState
        message={`正在装载 ${valorantStats.skinCount.toLocaleString("zh-CN")} 款皮肤资源…`}
      />
    );
  }

  const overlay = (
    <>
      {share.generating && (
        <div className="share-generating" role="status">
          <img src="/omen-cat-loader.gif" alt="" aria-hidden="true" />
          正在生成分享图片…
        </div>
      )}
      {share.imageUrl && (
        <SharePreview
          imageUrl={share.imageUrl}
          onClose={share.close}
          onSave={share.save}
        />
      )}
    </>
  );

  if (view === "home") {
    return (
      <GameCanvas scale={canvasScale} overlay={overlay}>
        <TopBrandBar onShare={shareHome} onRank={() => router.push("/ranking")} />
        <section className="loadout-layout">
          <WeaponBoard
            data={data}
            equipped={equipped}
            getWeaponImage={getWeaponDisplay}
            onSelect={openWeapon}
          />

          <aside className="profile-panel">
            <h2>玩家卡面</h2>
            <div
              className="player-card"
              role="button"
              tabIndex={0}
              onClick={event => {
                if ((event.target as HTMLElement).tagName !== "INPUT") openCosmetics("card");
              }}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openCosmetics("card");
                }
              }}
              style={equippedCard
                ? { "--card-art": `url(${equippedCard.icon})` } as React.CSSProperties
                : undefined}
            >
              <div className="card-energy">
                <input
                  aria-label="玩家等级"
                  value={playerLevel}
                  maxLength={3}
                  onChange={event => setPlayerLevel(event.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="player-card-inner">
                {!equippedCard && <div className="v-shape">V</div>}
                <input
                  className="card-id"
                  aria-label="玩家 ID"
                  value={playerName}
                  maxLength={20}
                  onChange={event => setPlayerName(event.target.value)}
                />
                {equippedTitle && <small>{equippedTitle.name}</small>}
              </div>
            </div>

            <h2>个性表达</h2>
            <button
              className="spray-wheel"
              onClick={() => openCosmetics("expression")}
              aria-label="选择个性表达"
            >
              <b className="wheel-ring" />
              <u className="inner-spokes" />
              {[0, 1, 2, 3].map(index => {
                const item = expressionWheel[index];
                const expression = item && (
                  item.type === "sprays" ? cosmetics.sprays : cosmetics.flexes
                ).find(entry => entry.id === item.id);
                return (
                  <i key={`${item?.type ?? "empty"}-${item?.id ?? index}-${index}`}>
                    {expression ? <img src={expression.icon} alt="" /> : <em>+</em>}
                  </i>
                );
              })}
              <span />
            </button>
          </aside>
        </section>
        <div className="home-foot">
          <span>{data.weapons.length.toLocaleString("zh-CN")} 种武器</span>
          <span>{data.weapons.reduce((sum, weapon) => sum + weapon.skins.length, 0).toLocaleString("zh-CN")} 款可用皮肤</span>
          <span>{data.buddies.length.toLocaleString("zh-CN")} 个挂饰</span>
        </div>
      </GameCanvas>
    );
  }

  if (view === "card" || view === "expression") {
    const isCardView = view === "card";
    const currentName = cosmeticTab === "cards"
      ? selectedCard?.name
      : cosmeticTab === "titles"
        ? selectedTitle?.name
        : cosmeticTab === "sprays"
          ? selectedSpray?.name
          : selectedFlex?.name;
    const selectedItemId = cosmeticTab === "cards"
      ? selectedCardId
      : cosmeticTab === "titles"
        ? selectedTitleId
        : cosmeticTab === "sprays"
          ? selectedSprayId
          : selectedFlexId;
    const tabs = isCardView ? cardTabs : expressionTabs;
    const activeLabel = tabs.find(([id]) => id === cosmeticTab)?.[1] ?? "";

    return (
      <GameCanvas scale={canvasScale} overlay={overlay}>
        <TopBrandBar
          onBack={() => setView("home")}
          weaponName={isCardView ? "玩家卡面" : "个性表达"}
          onShare={shareHome}
          onRank={() => router.push("/ranking")}
        />
        <nav className="selector-subnav">
          <div className="selector-tabs cosmetic-tabs">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                className={cosmeticTab === id ? "active" : ""}
                onClick={() => {
                  setCosmeticTab(id);
                  setQuery("");
                  setListScroll(0);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        <div className="selector-layout cosmetic-layout">
          <aside className="item-browser cosmetic-browser">
            <div className="browser-tools buddy-tools">
              <label>
                ⌕
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder={`搜索${activeLabel}`}
                />
              </label>
            </div>
            <div
              ref={gridRef}
              className={`cosmetic-grid ${cosmeticTab === "titles" ? "title-grid" : ""}`}
              onScroll={event => updateListScroll(event.currentTarget)}
            >
              {cosmeticItems.map(item => (
                <button
                  key={item.id}
                  className={selectedItemId === item.id ? "selected" : ""}
                  onClick={() => selectCosmeticItem(item.id)}
                >
                  {"icon" in item && typeof item.icon === "string" && (
                    <img src={item.icon} alt="" />
                  )}
                  <strong>{item.name}</strong>
                </button>
              ))}
            </div>
            <div
              className={`custom-scrollbar${scrollable ? "" : " hidden"}`}
              onPointerDown={moveCustomScroll}
              onPointerMove={moveCustomScroll}
            >
              <span style={{ top: `${listScroll * 648}px` }} />
            </div>
          </aside>

          <section className="weapon-preview cosmetic-preview">
            <div className="preview-title"><h1>{currentName}</h1></div>
            {cosmeticTab === "cards" && (
              <div className="card-preview">
                {selectedCard && <img src={selectedCard.icon} alt={selectedCard.name} />}
              </div>
            )}
            {cosmeticTab === "titles" && (
              <div className="title-preview">
                <span>{playerName}</span><strong>{selectedTitle?.name}</strong>
              </div>
            )}
            {cosmeticTab === "sprays" && (
              <div className="spray-preview">
                {selectedSpray && <img src={selectedSpray.icon} alt={selectedSpray.name} />}
              </div>
            )}
            {cosmeticTab === "flexes" && (
              <div className="spray-preview">
                {selectedFlex && <img src={selectedFlex.icon} alt={selectedFlex.name} />}
              </div>
            )}
            <div className="selection-meta">
              <div className="equip-row">
                <button
                  className={cosmeticIsEquipped ? "equip-button equipped" : "equip-button"}
                  onClick={toggleCosmeticEquip}
                >
                  {cosmeticIsEquipped ? "取消装备" : "装备"}
                </button>
              </div>
            </div>
          </section>
        </div>

        {wheelPickerOpen && (
          <div
            className="filter-modal wheel-picker"
            role="dialog"
            aria-modal="true"
            aria-label="选择个性表达装备位置"
          >
            <div className="wheel-picker-panel">
              <h2>选择装备位置</h2>
              <button
                className="picker-close"
                onClick={() => setWheelPickerOpen(false)}
                aria-label="关闭装备位置选择"
              >
                ×
              </button>
              <div className="picker-wheel">
                <b className="wheel-ring" /><u className="inner-spokes" />
                {[0, 1, 2, 3].map(slot => {
                  const item = expressionWheel[slot];
                  const expression = item && (
                    item.type === "sprays" ? cosmetics.sprays : cosmetics.flexes
                  ).find(entry => entry.id === item.id);
                  return (
                    <button
                      className={`picker-slot slot-${slot}`}
                      key={slot}
                      aria-label={`装备到位置 ${slot + 1}`}
                      onClick={() => equipExpressionAt(slot)}
                    >
                      {expression
                        ? <img src={expression.icon} alt={expression.name} />
                        : <em>+</em>}
                    </button>
                  );
                })}
                <span />
              </div>
            </div>
          </div>
        )}
      </GameCanvas>
    );
  }

  return (
    <GameCanvas scale={canvasScale} overlay={overlay}>
      <TopBrandBar
        onBack={() => setView("home")}
        weaponName={weapon?.name}
        onShare={shareHome}
        onRank={() => router.push("/ranking")}
      />
      <nav className="selector-subnav">
        <div className={`selector-tabs ${weapon?.category === "Melee" ? "single-tab" : ""}`}>
          <button
            className={tab === "skin" ? "active" : ""}
            onClick={() => {
              setTab("skin");
              setQuery("");
            }}
          >
            皮肤
          </button>
          {weapon?.category !== "Melee" && (
            <button
              className={tab === "buddy" ? "active" : ""}
              onClick={() => {
                setTab("buddy");
                setQuery("");
              }}
            >
              挂饰
            </button>
          )}
        </div>
      </nav>

      <div className="selector-layout">
        <aside className="item-browser">
          <div className={`browser-tools ${tab === "buddy" ? "buddy-tools" : ""}`}>
            <label>
              ⌕
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={tab === "skin" ? "搜索皮肤" : "搜索挂饰"}
              />
            </label>
            {tab === "skin" && (
              <button
                className={`filter-trigger ${filterOpen ? "on" : ""}`}
                aria-label="打开筛选与排序"
                onClick={() => setFilterOpen(true)}
              >
                <span /><span /><span />
              </button>
            )}
          </div>

          <div
            ref={gridRef}
            className={tab === "skin" ? "skin-grid" : "buddy-grid"}
            onScroll={event => updateListScroll(event.currentTarget)}
          >
            {tab === "skin" ? visibleSkins.map(skin => (
              <button
                key={skin.id}
                className={selectedSkin?.id === skin.id ? "selected" : ""}
                onClick={() => chooseSkin(skin)}
                style={{ "--rarity": skin.rarityColor } as React.CSSProperties}
              >
                <img src={skin.chromas[0]?.render ?? skin.icon} alt="" />
                <strong>{skin.name.replace(` ${weapon?.name}`, "")}</strong>
              </button>
            )) : (
              <>
                <button
                  className={buddyId === null ? "selected" : ""}
                  onClick={() => setBuddyId(null)}
                  aria-label="不使用挂饰"
                >
                  <span className="no-buddy">×</span>
                </button>
                {visibleBuddies.map(buddy => (
                  <button
                    key={buddy.id}
                    className={buddyId === buddy.id ? "selected" : ""}
                    onClick={() => setBuddyId(buddy.id)}
                  >
                    <img src={buddy.icon} alt="" /><strong>{buddy.name}</strong>
                  </button>
                ))}
              </>
            )}
          </div>
          <div
            className={`custom-scrollbar${scrollable ? "" : " hidden"}`}
            onPointerDown={moveCustomScroll}
            onPointerMove={moveCustomScroll}
          >
            <span style={{ top: `${listScroll * 648}px` }} />
          </div>
        </aside>

        <section className="weapon-preview">
          <div className="preview-title">
            {selectedSkin?.rarityIcon && (
              <img src={selectedSkin.rarityIcon} alt={selectedSkin.rarityName} />
            )}
            <h1>{selectedSkin?.name ?? weapon?.name}</h1>
          </div>
          <div className="gun-stage">
            <img className="main-gun" src={selectedChroma?.render ?? weapon?.icon} alt="" />
            {selectedBuddy && (
              <img className="gun-buddy" src={selectedBuddy.icon} alt={selectedBuddy.name} />
            )}
          </div>
          <div className="selection-meta">
            {tab === "skin" && selectedSkin && selectedSkin.chromas.length > 1 && (
              <div className="chroma-row">
                {selectedSkin.chromas.map(chroma => (
                  <button
                    key={chroma.id}
                    className={selectedChroma?.id === chroma.id ? "selected" : ""}
                    onClick={() => setChromaId(chroma.id)}
                    title={chroma.name}
                  >
                    <img src={chroma.swatch ?? chroma.render} alt="" />
                  </button>
                ))}
              </div>
            )}
            {tab === "buddy" && (
              <div className="buddy-summary">
                <strong>{selectedBuddy?.name ?? "无挂饰"}</strong>
              </div>
            )}
            <div className="equip-row">
              <button
                className={selectionIsEquipped ? "equip-button equipped" : "equip-button"}
                onClick={toggleWeaponEquip}
              >
                {selectionIsEquipped ? "已装备" : "装备"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {filterOpen && tab === "skin" && (
        <SkinFilterDialog
          qualities={qualities}
          sort={sort}
          radioGroupName="skin-sort"
          onToggleQuality={toggleQuality}
          onSortChange={setSort}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </GameCanvas>
  );
}
