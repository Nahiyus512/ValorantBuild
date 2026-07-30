"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GameCanvas } from "@/components/layout/game-canvas";
import { LoadingState } from "@/components/ui/loading-state";
import { SharePreview } from "@/components/ui/share-preview";
import { SkinFilterDialog } from "@/components/ui/skin-filter-dialog";
import { WeaponBoard } from "@/components/valorant/weapon-board";
import { useFixedCanvasScale } from "@/hooks/use-fixed-canvas-scale";
import { useShareImage } from "@/hooks/use-share-image";
import { embedCloneImages, renderElementToPng } from "@/lib/share-image";
import { readStorage, writeStorage } from "@/lib/storage";
import { loadLoadoutData } from "@/lib/valorant-data";
import type { LoadoutData, SkinSort, Weapon } from "@/types/valorant";

const rankingStorageKey = "valorantbuild.ranking.v1";
const tierLabelStorageKey = "valorantbuild.ranking.labels.v1";
const initialScroll = { top: 0, height: 80, visible: false };
const rankingTiers = [
  { id: "s", label: "T0", color: "#ff4655" },
  { id: "a", label: "T1", color: "#f5955b" },
  { id: "b", label: "T2", color: "#fad663" },
  { id: "c", label: "T3", color: "#5a9fe2" },
  { id: "d", label: "T4", color: "#78909a" },
] as const;

type TierData = Record<string, Array<{ skinId: string; chromaId: string }>>;
type ScrollIndicator = { top: number; height: number; visible: boolean };
type SkinTooltip = {
  x: number;
  y: number;
  rarityIcon: string | null;
  name: string;
};

function skinDisplayName(skinName: string, weaponName: string) {
  return skinName.endsWith(weaponName)
    ? skinName.slice(0, -weaponName.length).trim()
    : skinName;
}

function getDefaultWeaponImage(weapon: Weapon): string {
  const skin = weapon.skins.find(item => item.id === weapon.defaultSkinId)
    ?? weapon.skins.at(-1)!;
  return skin.chromas[0]?.render ?? weapon.icon;
}

function calculateScrollIndicator(element: HTMLElement | null): ScrollIndicator {
  if (!element || element.clientHeight === 0) return initialScroll;
  const visible = element.scrollHeight > element.clientHeight + 1;
  const height = Math.max(
    64,
    element.clientHeight * element.clientHeight
      / Math.max(element.clientHeight, element.scrollHeight),
  );
  const top = visible
    ? element.scrollTop
      / Math.max(1, element.scrollHeight - element.clientHeight)
      * Math.max(0, element.clientHeight - height)
    : 0;
  return { top, height, visible };
}

export function RankingBuilder() {
  const router = useRouter();
  const canvasScale = useFixedCanvasScale();
  const share = useShareImage("ValorantBuild-Ranking.png");
  const dragData = useRef<{
    skinId: string;
    chromaId: string;
    source: string;
  } | null>(null);
  const tierListRef = useRef<HTMLDivElement>(null);
  const poolGridRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<LoadoutData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SkinSort>("qualityDesc");
  const [qualities, setQualities] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [tierData, setTierData] = useState<TierData>({});
  const [tierLabels, setTierLabels] = useState<Record<string, string>>({});
  const [dragOverTier, setDragOverTier] = useState<string | null>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<SkinTooltip | null>(null);
  const [poolCollapsed, setPoolCollapsed] = useState(false);
  const [rankingBoardHeight, setRankingBoardHeight] = useState(626);
  const [tierScroll, setTierScroll] = useState<ScrollIndicator>(initialScroll);
  const [poolScroll, setPoolScroll] = useState<ScrollIndicator>(initialScroll);

  useEffect(() => {
    let active = true;
    loadLoadoutData()
      .then(loadoutData => {
        if (!active) return;
        setData(loadoutData);
        setTierData(readStorage<TierData>(rankingStorageKey) ?? {});
        setTierLabels(
          readStorage<Record<string, string>>(tierLabelStorageKey) ?? {},
        );
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
    if (storageReady) writeStorage(rankingStorageKey, tierData);
  }, [storageReady, tierData]);

  useEffect(() => {
    if (storageReady) writeStorage(tierLabelStorageKey, tierLabels);
  }, [storageReady, tierLabels]);

  const weapon = data?.weapons.find(item => item.id === selectedWeaponId);
  const skinsById = useMemo(
    () => new Map(weapon?.skins.map(skin => [skin.id, skin]) ?? []),
    [weapon],
  );

  const visibleSkins = useMemo(() => {
    if (!weapon) return [];
    const normalizedQuery = query.toLowerCase();
    let list = weapon.skins.filter(skin =>
      skin.name.toLowerCase().includes(normalizedQuery)
      && (!qualities.length || qualities.includes(skin.rarity ?? ""))
    );
    if (sort === "qualityAsc") list = [...list].sort((a, b) => a.rarityRank - b.rarityRank);
    if (sort === "qualityDesc") list = [...list].sort((a, b) => b.rarityRank - a.rarityRank);
    return list;
  }, [qualities, query, sort, weapon]);

  const placedSkinIds = useMemo(() => {
    const placed = new Set<string>();
    if (!weapon) return placed;
    const weaponSkinIds = new Set(weapon.skins.map(skin => skin.id));
    for (const items of Object.values(tierData)) {
      for (const item of items) {
        if (weaponSkinIds.has(item.skinId)) placed.add(item.skinId);
      }
    }
    return placed;
  }, [tierData, weapon]);

  const poolSkins = useMemo(
    () => visibleSkins.filter(skin => !placedSkinIds.has(skin.id)),
    [placedSkinIds, visibleSkins],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTierScroll(calculateScrollIndicator(tierListRef.current));
      setPoolScroll(calculateScrollIndicator(poolGridRef.current));
      const list = tierListRef.current;
      if (list) {
        const rows = Array.from(list.querySelectorAll<HTMLElement>(".ranking-tier"));
        const topPadding = parseFloat(getComputedStyle(list).paddingTop);
        setRankingBoardHeight(
          Math.ceil(rows.reduce((height, row) => height + row.offsetHeight, topPadding)),
        );
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [poolCollapsed, poolSkins.length, selectedWeaponId, tierData]);

  function selectWeapon(nextWeapon: Weapon) {
    setSelectedWeaponId(nextWeapon.id);
    setQuery("");
    setQualities([]);
    setSort("qualityDesc");
  }

  function toggleQuality(quality: string) {
    setQualities(current =>
      current.includes(quality)
        ? current.filter(item => item !== quality)
        : [...current, quality],
    );
  }

  function handleDragStart(
    event: React.DragEvent,
    skinId: string,
    chromaId: string,
    source: string,
  ) {
    dragData.current = { skinId, chromaId, source };
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: React.DragEvent, targetTier: string) {
    event.preventDefault();
    if (!dragData.current) return;
    const { skinId, chromaId } = dragData.current;
    setTierData(current => {
      const next: TierData = {};
      for (const [tierId, items] of Object.entries(current)) {
        next[tierId] = items.filter(item =>
          !(item.skinId === skinId && item.chromaId === chromaId)
        );
      }
      if (targetTier !== "pool") {
        if (!next[targetTier]) next[targetTier] = [];
        if (!next[targetTier].some(item =>
          item.skinId === skinId && item.chromaId === chromaId
        )) {
          next[targetTier] = [...next[targetTier], { skinId, chromaId }];
        }
      }
      return next;
    });
    finishDrag();
  }

  function finishDrag() {
    dragData.current = null;
    setDragOverTier(null);
  }

  function removeFromTier(skinId: string, chromaId: string) {
    setTierData(current => Object.fromEntries(
      Object.entries(current).map(([tierId, items]) => [
        tierId,
        items.filter(item => !(item.skinId === skinId && item.chromaId === chromaId)),
      ]),
    ));
  }

  function clearWeaponRanking() {
    if (!weapon) return;
    const weaponSkinIds = new Set(weapon.skins.map(skin => skin.id));
    setTierData(current => Object.fromEntries(
      Object.entries(current).map(([tierId, items]) => [
        tierId,
        items.filter(item => !weaponSkinIds.has(item.skinId)),
      ]),
    ));
  }

  function handleSkinEnter(
    event: React.MouseEvent,
    rarityIcon: string | null,
    name: string,
  ) {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const stage = target.closest(".fixed-stage") as HTMLElement | null;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const scale = stageRect.width / 1920;
    setHoveredTooltip({
      x: (rect.left - stageRect.left + rect.width / 2) / scale,
      y: (rect.top - stageRect.top + rect.height / 2) / scale,
      rarityIcon,
      name,
    });
  }

  function handleTierDragLeave(event: React.DragEvent, tierId: string) {
    const rect = event.currentTarget.getBoundingClientRect();
    const outside = event.clientX < rect.left
      || event.clientX >= rect.right
      || event.clientY < rect.top
      || event.clientY >= rect.bottom;
    if (outside) {
      setDragOverTier(current => current === tierId ? null : current);
    }
  }

  function updateTierScroll(element: HTMLDivElement) {
    setTierScroll(calculateScrollIndicator(element));
  }

  function updatePoolScroll(element: HTMLDivElement) {
    setPoolScroll(calculateScrollIndicator(element));
  }

  function moveRankingScroll(
    event: React.PointerEvent<HTMLDivElement>,
    target: HTMLElement | null,
  ) {
    if (!target) return;
    const rail = event.currentTarget;
    if (event.type === "pointerdown") rail.setPointerCapture(event.pointerId);
    if (event.type === "pointermove" && !rail.hasPointerCapture(event.pointerId)) return;
    const thumb = rail.querySelector("span");
    const rect = rail.getBoundingClientRect();
    const thumbHeight = thumb?.getBoundingClientRect().height ?? 64;
    const ratio = Math.max(
      0,
      Math.min(1, (event.clientY - rect.top - thumbHeight / 2) / Math.max(1, rect.height - thumbHeight)),
    );
    target.scrollTop = ratio * Math.max(0, target.scrollHeight - target.clientHeight);
  }

  async function exportRanking() {
    const tierList = tierListRef.current;
    const background = document.querySelector(".background-layer");
    if (!tierList || share.generating) return;
    setHoveredTooltip(null);
    share.setGenerating(true);
    const exportHeight = Math.max(720, tierList.scrollHeight);
    const root = document.createElement("div");
    root.className = "fixed-stage ranking-export-stage";
    root.style.cssText = `position:relative;left:0;top:0;transform:none;width:1920px;height:${exportHeight}px;overflow:hidden;background:#061521;color:#edf3f1;font-family:"Noto Sans SC","Microsoft YaHei",sans-serif;font-weight:900;`;
    if (background) {
      const backgroundClone = background.cloneNode(true) as HTMLElement;
      backgroundClone.style.position = "absolute";
      backgroundClone.style.inset = "0";
      backgroundClone.style.zIndex = "0";
      root.appendChild(backgroundClone);
    }
    const listClone = tierList.cloneNode(true) as HTMLElement;
    listClone.style.cssText += `;position:relative;z-index:1;width:1920px;height:${exportHeight}px;overflow:visible;box-sizing:border-box`;
    root.appendChild(listClone);
    await embedCloneImages(tierList, listClone);
    try {
      share.showBlob(await renderElementToPng(root, 1920, exportHeight));
    } catch {
      window.alert("图片生成失败，请重试");
    } finally {
      share.setGenerating(false);
    }
  }

  if (loadError) return <LoadingState error message={`${loadError}，请刷新重试。`} />;
  if (!data) return <LoadingState message="正在装载排行资源…" />;

  if (!weapon) {
    return (
      <GameCanvas scale={canvasScale}>
        <header className="ranking-topbar">
          <button className="ranking-back" onClick={() => router.push("/")}>
            <span>&lt;</span> 返回
          </button>
          <h1 className="ranking-title">选择枪械</h1>
        </header>
        <section className="ranking-select-layout">
          <WeaponBoard
            data={data}
            getWeaponImage={getDefaultWeaponImage}
            onSelect={selectWeapon}
          />
        </section>
      </GameCanvas>
    );
  }

  return (
    <GameCanvas scale={canvasScale}>
      <header className="ranking-topbar">
        <button className="ranking-back" onClick={() => setSelectedWeaponId(null)}>
          <span>&lt;</span> 返回
        </button>
        <span className="ranking-weapon-name">{"//"} {weapon.name}</span>
        <button className="ranking-export" onClick={exportRanking}>导出排行</button>
        <button className="ranking-clear" onClick={clearWeaponRanking}>清空排行</button>
      </header>

      <section className="ranking-builder">
        <div className="ranking-tier-region">
          <div
            className="ranking-tier-list"
            ref={tierListRef}
            onScroll={event => updateTierScroll(event.currentTarget)}
          >
            {rankingTiers.map(tier => {
              const entries = (tierData[tier.id] || [])
                .filter(entry => skinsById.has(entry.skinId));
              return (
                <div
                  key={tier.id}
                  className={`ranking-tier${dragOverTier === tier.id ? " drag-over" : ""}`}
                  onDragOver={handleDragOver}
                  onDragEnter={() => setDragOverTier(tier.id)}
                  onDragLeave={event => handleTierDragLeave(event, tier.id)}
                  onDrop={event => handleDrop(event, tier.id)}
                >
                  <div className="tier-label" style={{ background: tier.color }}>
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      title="点击修改文字"
                      onBlur={event => {
                        const label = event.currentTarget.textContent?.trim() || tier.label;
                        setTierLabels(current => ({ ...current, [tier.id]: label }));
                      }}
                      onKeyDown={event => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          event.currentTarget.blur();
                        }
                      }}
                    >
                      {tierLabels[tier.id] ?? tier.label}
                    </span>
                  </div>
                  <div className="tier-items">
                    {entries.map(entry => {
                      const skin = skinsById.get(entry.skinId);
                      if (!skin) return null;
                      const chroma = skin.chromas.find(item => item.id === entry.chromaId)
                        ?? skin.chromas[0];
                      return (
                        <div
                          key={`${entry.skinId}-${entry.chromaId}`}
                          className="tier-skin-item"
                          draggable
                          onDragStart={event =>
                            handleDragStart(
                              event,
                              entry.skinId,
                              entry.chromaId,
                              tier.id,
                            )
                          }
                          onDragEnd={finishDrag}
                          onDoubleClick={() =>
                            removeFromTier(entry.skinId, entry.chromaId)
                          }
                          onMouseEnter={event =>
                            handleSkinEnter(
                              event,
                              skin.rarityIcon,
                              skinDisplayName(skin.name, weapon.name),
                            )
                          }
                          onMouseLeave={() => setHoveredTooltip(null)}
                        >
                          <img src={chroma?.render ?? skin.icon} alt={skin.name} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className={`ranking-scrollbar${tierScroll.visible ? "" : " hidden"}`}
            onPointerDown={event => moveRankingScroll(event, tierListRef.current)}
            onPointerMove={event => moveRankingScroll(event, tierListRef.current)}
          >
            <span style={{ top: tierScroll.top, height: tierScroll.height }} />
          </div>
        </div>

        <div
          className={`ranking-pool${poolCollapsed ? " collapsed" : ""}`}
          style={{ height: rankingBoardHeight + 16 }}
          onDragOver={handleDragOver}
          onDrop={event => handleDrop(event, "pool")}
        >
          <div className="ranking-pool-tools">
            <label className="ranking-search">
              ⌕
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="搜索皮肤"
              />
            </label>
            <button
              className={`filter-trigger ${filterOpen ? "on" : ""}`}
              aria-label="打开筛选与排序"
              onClick={() => setFilterOpen(true)}
            >
              <span /><span /><span />
            </button>
            <span className="ranking-pool-count">{poolSkins.length} 款未排行</span>
            <button
              className="ranking-pool-toggle"
              type="button"
              onClick={() => setPoolCollapsed(current => !current)}
            >
              {poolCollapsed ? "展 开" : "收起"}
            </button>
          </div>
          <div className="ranking-pool-grid-region">
            <div
              className="ranking-skin-grid"
              ref={poolGridRef}
              onScroll={event => updatePoolScroll(event.currentTarget)}
            >
              {poolSkins.map(skin => (
                <div
                  key={skin.id}
                  className="pool-skin-item"
                  draggable
                  onDragStart={event =>
                    handleDragStart(
                      event,
                      skin.id,
                      skin.chromas[0]?.id ?? "",
                      "pool",
                    )
                  }
                  onDragEnd={finishDrag}
                  style={{ "--rarity": skin.rarityColor } as React.CSSProperties}
                  onMouseEnter={event =>
                    handleSkinEnter(
                      event,
                      skin.rarityIcon,
                      skinDisplayName(skin.name, weapon.name),
                    )
                  }
                  onMouseLeave={() => setHoveredTooltip(null)}
                >
                  <img src={skin.chromas[0]?.render ?? skin.icon} alt={skin.name} />
                </div>
              ))}
              {poolSkins.length === 0 && (
                <div className="pool-empty">所有皮肤已排行</div>
              )}
            </div>
            <div
              className={`ranking-scrollbar${poolScroll.visible ? "" : " hidden"}`}
              onPointerDown={event => moveRankingScroll(event, poolGridRef.current)}
              onPointerMove={event => moveRankingScroll(event, poolGridRef.current)}
            >
              <span style={{ top: poolScroll.top, height: poolScroll.height }} />
            </div>
          </div>
        </div>
      </section>

      {hoveredTooltip && (
        <div
          className="ranking-tooltip"
          style={{ left: hoveredTooltip.x, top: hoveredTooltip.y }}
        >
          {hoveredTooltip.rarityIcon && <img src={hoveredTooltip.rarityIcon} alt="" />}
          <span>{hoveredTooltip.name}</span>
        </div>
      )}
      {filterOpen && (
        <SkinFilterDialog
          qualities={qualities}
          sort={sort}
          radioGroupName="ranking-sort"
          onToggleQuality={toggleQuality}
          onSortChange={setSort}
          onClose={() => setFilterOpen(false)}
        />
      )}
      {share.imageUrl && (
        <SharePreview
          imageUrl={share.imageUrl}
          onClose={share.close}
          onSave={share.save}
          label="排行榜图片预览"
          eyebrow="RANKING"
        />
      )}
      {share.generating && (
        <div className="share-generating" role="status">
          <span />正在生成排行榜图片...
        </div>
      )}
    </GameCanvas>
  );
}
