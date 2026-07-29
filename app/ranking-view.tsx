"use client";
/* ranking-view v2 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Data, Weapon } from "./loadout";
import { TacticalBackground, homeColumns, qualityOrder } from "./loadout";

const rankingStorageKey = "valorantbuild.ranking.v1";
const tierLabelStorageKey = "valorantbuild.ranking.labels.v1";

const tiers = [
  { id: "s", label: "T0", color: "#ff4655" },
  { id: "a", label: "T1", color: "#f5955b" },
  { id: "b", label: "T2", color: "#fad663" },
  { id: "c", label: "T3", color: "#5a9fe2" },
  { id: "d", label: "T4", color: "#78909a" },
] as const;

type TierEntry = { skinId: string; chromaId: string };
type TierData = Record<string, TierEntry[]>;

function RankingSharePreview({imageUrl,onClose,onSave}:{imageUrl:string;onClose:()=>void;onSave:()=>void}) {
  return <div className="share-preview-modal" role="dialog" aria-modal="true" aria-label="排行榜图片预览" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div className="share-preview-dialog">
      <div className="share-preview-heading">
        <div><span>RANKING</span><h2>排行榜图片预览</h2></div>
        <button type="button" onClick={onClose} aria-label="关闭排行榜图片预览">×</button>
      </div>
      <div className="share-preview-image"><img src={imageUrl} alt="ValorantBuild 排行榜导出图"/></div>
      <button className="share-save-button" type="button" onClick={onSave}>保存图片</button>
    </div>
  </div>;
}

function displayFor(w: Weapon): string {
  const skin = w.skins.find(s => s.id === w.defaultSkinId) ?? w.skins.at(-1)!;
  return skin.chromas[0]?.render ?? w.icon;
}

function skinDisplayName(skinName:string,weaponName:string) {
  return skinName.endsWith(weaponName)
    ? skinName.slice(0,-weaponName.length).trim()
    : skinName;
}

export function RankingView() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"qualityAsc" | "qualityDesc">("qualityDesc");
  const [qualities, setQualities] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [tierData, setTierData] = useState<TierData>({});
  const [canvasScale, setCanvasScale] = useState(1);
  const dragData = useRef<{ skinId: string; chromaId: string; source: string } | null>(null);
  const [dragOverTier, setDragOverTier] = useState<string | null>(null);
  const [tierLabels, setTierLabels] = useState<Record<string, string>>({});
  const [hoveredTooltip, setHoveredTooltip] = useState<{x:number;y:number;rarityIcon:string|null;name:string}|null>(null);
  const [shareImageUrl,setShareImageUrl]=useState<string|null>(null);
  const [shareGenerating,setShareGenerating]=useState(false);
  const [poolCollapsed,setPoolCollapsed]=useState(false);
  const [rankingBoardHeight,setRankingBoardHeight]=useState(626);
  const [tierScroll,setTierScroll]=useState({top:0,height:160,visible:false});
  const [poolScroll,setPoolScroll]=useState({top:0,height:80,visible:false});
  const tierListRef=useRef<HTMLDivElement>(null);
  const poolGridRef=useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/loadout-data.json").then(r => r.json() as Promise<Data>).then(d => {
      setData(d);
      try {
        const stored = JSON.parse(window.localStorage.getItem(rankingStorageKey) ?? "null");
        if (stored && typeof stored === "object") setTierData(stored);
        const storedLabels = JSON.parse(window.localStorage.getItem(tierLabelStorageKey) ?? "null");
        if (storedLabels && typeof storedLabels === "object") setTierLabels(storedLabels);
      } catch {}
    });
  }, []);

  useEffect(() => {
    if (!data) return;
    try {
      window.localStorage.setItem(rankingStorageKey, JSON.stringify(tierData));
    } catch {}
  }, [tierData, data]);

  useEffect(() => {
    try {
      window.localStorage.setItem(tierLabelStorageKey, JSON.stringify(tierLabels));
    } catch {}
  }, [tierLabels]);

  useEffect(() => {
    const fit = () => setCanvasScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(()=>()=>{if(shareImageUrl)URL.revokeObjectURL(shareImageUrl)},[shareImageUrl]);

  const weapon = data?.weapons.find(w => w.id === selectedWeaponId);

  const visibleSkins = useMemo(() => {
    if (!weapon) return [];
    let list = weapon.skins.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) &&
      (!qualities.length || qualities.includes(s.rarity ?? ""))
    );
    if (sort === "qualityAsc") list = [...list].sort((a, b) => a.rarityRank - b.rarityRank);
    if (sort === "qualityDesc") list = [...list].sort((a, b) => b.rarityRank - a.rarityRank);
    return list;
  }, [weapon, query, qualities, sort]);

  const placedSkinIds = useMemo(() => {
    const set = new Set<string>();
    if (weapon) {
      for (const items of Object.values(tierData)) {
        for (const item of items) {
          if (weapon.skins.some(s => s.id === item.skinId)) set.add(item.skinId);
        }
      }
    }
    return set;
  }, [tierData, weapon]);

  const poolSkins = useMemo(() => {
    return visibleSkins.filter(s => !placedSkinIds.has(s.id));
  }, [visibleSkins, placedSkinIds]);

  useEffect(()=>{
    const frame=window.requestAnimationFrame(()=>{
      updateScrollIndicator(tierListRef.current,setTierScroll);
      updateScrollIndicator(poolGridRef.current,setPoolScroll);
      const list=tierListRef.current;
      if(list){
        const rows=Array.from(list.querySelectorAll<HTMLElement>(".ranking-tier"));
        const topPadding=parseFloat(getComputedStyle(list).paddingTop);
        setRankingBoardHeight(Math.ceil(rows.reduce((height,row)=>height+row.offsetHeight,topPadding)));
      }
    });
    return()=>window.cancelAnimationFrame(frame);
  },[tierData,poolSkins.length,poolCollapsed,selectedWeaponId]);

  function toggleQuality(q: string) {
    setQualities(v => v.includes(q) ? v.filter(x => x !== q) : [...v, q]);
  }

  function handleDragStart(e: React.DragEvent, skinId: string, chromaId: string, source: string) {
    dragData.current = { skinId, chromaId, source };
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, targetTier: string) {
    e.preventDefault();
    if (!dragData.current) return;
    const { skinId, chromaId } = dragData.current;
    setTierData(prev => {
      const next: TierData = {};
      for (const [tierId, items] of Object.entries(prev)) {
        next[tierId] = items.filter(item => !(item.skinId === skinId && item.chromaId === chromaId));
      }
      if (targetTier !== "pool") {
        if (!next[targetTier]) next[targetTier] = [];
        if (!next[targetTier].some(item => item.skinId === skinId && item.chromaId === chromaId)) {
          next[targetTier] = [...next[targetTier], { skinId, chromaId }];
        }
      }
      return next;
    });
    dragData.current = null;
    setDragOverTier(null);
  }

  function removeFromTier(skinId: string, chromaId: string) {
    setTierData(prev => {
      const next: TierData = {};
      for (const [tierId, items] of Object.entries(prev)) {
        next[tierId] = items.filter(item => !(item.skinId === skinId && item.chromaId === chromaId));
      }
      return next;
    });
  }

  function clearWeaponRanking() {
    if (!weapon) return;
    setTierData(prev => {
      const next: TierData = {};
      for (const [tierId, items] of Object.entries(prev)) {
        next[tierId] = items.filter(item => !weapon.skins.some(s => s.id === item.skinId));
      }
      return next;
    });
  }

  function handleSkinEnter(e: React.MouseEvent, rarityIcon: string | null, name: string) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const stage = target.closest('.fixed-stage') as HTMLElement | null;
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

  function handleSkinLeave() {
    setHoveredTooltip(null);
  }

  function updateScrollIndicator(
    element:HTMLElement|null,
    setter:React.Dispatch<React.SetStateAction<{top:number;height:number;visible:boolean}>>
  ) {
    if(!element||element.clientHeight===0){setter({top:0,height:80,visible:false});return}
    const visible=element.scrollHeight>element.clientHeight+1;
    const height=Math.max(64,element.clientHeight*element.clientHeight/Math.max(element.clientHeight,element.scrollHeight));
    const top=visible
      ? element.scrollTop/Math.max(1,element.scrollHeight-element.clientHeight)*Math.max(0,element.clientHeight-height)
      : 0;
    setter({top,height,visible});
  }

  function moveRankingScroll(e:React.PointerEvent<HTMLDivElement>,target:HTMLElement|null) {
    if(!target)return;
    if(e.type==="pointerdown")e.currentTarget.setPointerCapture(e.pointerId);
    if(e.type==="pointermove"&&!e.currentTarget.hasPointerCapture(e.pointerId))return;
    const rail=e.currentTarget;
    const thumb=rail.querySelector("span");
    const rect=rail.getBoundingClientRect();
    const thumbHeight=thumb?.getBoundingClientRect().height??64;
    const ratio=Math.max(0,Math.min(1,(e.clientY-rect.top-thumbHeight/2)/Math.max(1,rect.height-thumbHeight)));
    target.scrollTop=ratio*Math.max(0,target.scrollHeight-target.clientHeight);
  }

  async function exportRanking() {
    const tierList=tierListRef.current;
    const background=document.querySelector(".background-layer");
    if(!tierList||shareGenerating)return;
    setHoveredTooltip(null);
    setShareGenerating(true);
    const exportHeight=Math.max(720,tierList.scrollHeight);
    const root=document.createElement("div");
    root.className="fixed-stage ranking-export-stage";
    root.style.cssText=`position:relative;left:0;top:0;transform:none;width:1920px;height:${exportHeight}px;overflow:hidden;background:#061521;color:#edf3f1;font-family:"Noto Sans SC","Microsoft YaHei",sans-serif;font-weight:900;`;
    if(background){
      const bgClone=background.cloneNode(true) as HTMLElement;
      bgClone.style.position="absolute";
      bgClone.style.inset="0";
      bgClone.style.zIndex="0";
      root.appendChild(bgClone);
    }
    const listClone=tierList.cloneNode(true) as HTMLElement;
    listClone.style.position="relative";
    listClone.style.zIndex="1";
    listClone.style.width="1920px";
    listClone.style.height=`${exportHeight}px`;
    listClone.style.overflow="visible";
    listClone.style.boxSizing="border-box";
    root.appendChild(listClone);
    const asDataUrl=async(src:string)=>{
      try{
        const response=await fetch(new URL(src,window.location.href).href,{mode:"cors"});
        if(!response.ok)throw new Error("image");
        const blob=await response.blob();
        return await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(blob)});
      }catch{return "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}
    };
    const sourceImages=Array.from(tierList.querySelectorAll("img"));
    const clonedImages=Array.from(listClone.querySelectorAll("img"));
    const embedded=await Promise.all(sourceImages.map(img=>asDataUrl(img.currentSrc||img.src)));
    clonedImages.forEach((img,index)=>img.src=embedded[index]);
    let fontFaceCss="";
    try{fontFaceCss=`@font-face{font-family:"Noto Sans SC";src:url(${await asDataUrl("/fonts/NotoSansSC-subset.ttf")}) format("truetype");font-weight:normal;font-style:normal;font-display:swap;}`}catch{}
    const css=Array.from(document.styleSheets).flatMap(sheet=>{try{return Array.from(sheet.cssRules).filter(rule=>!rule.cssText.startsWith("@font-face")).map(rule=>rule.cssText)}catch{return[]}}).join("\n").replaceAll("url(/",`url(${window.location.origin}/`);
    const markup=new XMLSerializer().serializeToString(root).replaceAll("url(/",`url(${window.location.origin}/`);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="${exportHeight}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>${fontFaceCss}\n${css}</style>${markup}</div></foreignObject></svg>`;
    const image=new Image();
    image.onload=()=>{try{const canvas=document.createElement("canvas");canvas.width=1920;canvas.height=exportHeight;canvas.getContext("2d")?.drawImage(image,0,0);canvas.toBlob(blob=>{setShareGenerating(false);if(!blob){window.alert("图片生成失败，请重试");return}setShareImageUrl(previous=>{if(previous)URL.revokeObjectURL(previous);return URL.createObjectURL(blob)})},"image/png")}catch{setShareGenerating(false);window.alert("图片生成失败，请重试")}};
    image.onerror=()=>{setShareGenerating(false);window.alert("图片生成失败，请重试")};
    image.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  }

  function closeSharePreview(){setShareImageUrl(previous=>{if(previous)URL.revokeObjectURL(previous);return null})}
  function saveShareImage(){
    if(!shareImageUrl)return;
    const anchor=document.createElement("a");
    anchor.href=shareImageUrl;
    anchor.download=`ValorantBuild-Ranking-${weapon?.name??"ranking"}-${Date.now()}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  if (!data) return <main className="loading"><span suppressHydrationWarning>V</span><p suppressHydrationWarning>正在装载排行资源…</p></main>;

  /* ---- View 1: Weapon Selection ---- */
  if (!weapon) {
    return <main className="game-shell">
      <TacticalBackground/>
      <div className="fixed-stage" style={{"--canvas-scale":canvasScale} as React.CSSProperties}>
        <header className="ranking-topbar">
          <button className="ranking-back" onClick={() => router.push("/")}><span>&lt;</span> 返回</button>
          <h1 className="ranking-title">选择枪械</h1>
        </header>
        <section className="ranking-select-layout">
          <div className="weapon-board">
            {homeColumns.map(column =>
              <section className="weapon-column" key={column.title}><h2>{column.title}</h2><div className="weapon-column-grid">
                {"subtitles" in column && column.subtitles.map(([label,row]) => <h3 key={label} style={{gridRow:row}}>{label}</h3>)}
                {column.items.map(([name,row]) => {const w=data.weapons.find(x=>x.name===name)!;
                  return <button className="weapon-tile" style={{gridRow:row}} key={w.id} onClick={()=>{setSelectedWeaponId(w.id);setQuery("");setQualities([]);setSort("qualityDesc");}}>
                    <img src={displayFor(w)} alt={w.name}/>
                  </button>})}
              </div></section>
            )}
          </div>
        </section>
      </div>
    </main>;
  }

  /* ---- View 2: Ranking Builder ---- */
  return <main className="game-shell">
    <TacticalBackground/>
    <div className="fixed-stage" style={{"--canvas-scale":canvasScale} as React.CSSProperties}>
      <header className="ranking-topbar">
        <button className="ranking-back" onClick={()=>setSelectedWeaponId(null)}><span>&lt;</span> 返回</button>
        <span className="ranking-weapon-name">// {weapon.name}</span>
        <button className="ranking-export" onClick={exportRanking}>导出排行</button>
        <button className="ranking-clear" onClick={clearWeaponRanking}>清空排行</button>
      </header>
      <section className="ranking-builder">
        <div className="ranking-tier-region">
          <div className="ranking-tier-list" ref={tierListRef} onScroll={e=>updateScrollIndicator(e.currentTarget,setTierScroll)}>
            {tiers.map(tier => {
            const entries = (tierData[tier.id] || []).filter(entry => weapon.skins.some(s => s.id === entry.skinId));
            return (
              <div
                key={tier.id}
                className={`ranking-tier${dragOverTier===tier.id?" drag-over":""}`}
                onDragOver={handleDragOver}
                onDragEnter={()=>setDragOverTier(tier.id)}
                onDragLeave={e=>{const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>=r.right||e.clientY<r.top||e.clientY>=r.bottom)setDragOverTier(prev=>prev===tier.id?null:prev)}}
                onDrop={e=>handleDrop(e,tier.id)}
              >
                <div className="tier-label" style={{background:tier.color}}>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    title="点击修改文字"
                    onBlur={e=>{const t=e.currentTarget.textContent?.trim()||tier.label;setTierLabels(p=>({...p,[tier.id]:t}));}}
                    onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();e.currentTarget.blur();}}}
                  >{tierLabels[tier.id]??tier.label}</span>
                </div>
                <div className="tier-items">
                  {entries.map(entry => {
                    const skin = weapon.skins.find(s => s.id === entry.skinId);
                    if (!skin) return null;
                    const chroma = skin.chromas.find(c => c.id === entry.chromaId) ?? skin.chromas[0];
                    return (
                      <div
                        key={`${entry.skinId}-${entry.chromaId}`}
                        className="tier-skin-item"
                        draggable
                        onDragStart={e=>handleDragStart(e,entry.skinId,entry.chromaId,tier.id)}
                        onDragEnd={()=>{dragData.current=null;setDragOverTier(null)}}
                        onDoubleClick={()=>removeFromTier(entry.skinId,entry.chromaId)}
                        onMouseEnter={e=>handleSkinEnter(e,skin.rarityIcon,skinDisplayName(skin.name,weapon.name))}
                        onMouseLeave={handleSkinLeave}
                      >
                        <img src={chroma?.render ?? skin.icon} alt={skin.name}/>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
            })}
          </div>
          <div
            className={`ranking-scrollbar${tierScroll.visible?"":" hidden"}`}
            onPointerDown={e=>moveRankingScroll(e,tierListRef.current)}
            onPointerMove={e=>moveRankingScroll(e,tierListRef.current)}
          ><span style={{top:tierScroll.top,height:tierScroll.height}}/></div>
        </div>
        <div
          className={`ranking-pool${poolCollapsed?" collapsed":""}`}
          style={{height:rankingBoardHeight+16}}
          onDragOver={handleDragOver}
          onDrop={e=>handleDrop(e,"pool")}
        >
          <div className="ranking-pool-tools">
            <label className="ranking-search">⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索皮肤"/></label>
            <button className={`filter-trigger ${filterOpen?"on":""}`} aria-label="打开筛选与排序" onClick={()=>setFilterOpen(true)}><span/><span/><span/></button>
            <span className="ranking-pool-count">{poolSkins.length} 款未排行</span>
            <button className="ranking-pool-toggle" type="button" onClick={()=>setPoolCollapsed(value=>!value)}>{poolCollapsed?"展 开":"收起"}</button>
          </div>
          <div className="ranking-pool-grid-region">
            <div className="ranking-skin-grid" ref={poolGridRef} onScroll={e=>updateScrollIndicator(e.currentTarget,setPoolScroll)}>
              {poolSkins.map(skin => (
                <div
                  key={skin.id}
                  className="pool-skin-item"
                  draggable
                  onDragStart={e=>handleDragStart(e,skin.id,skin.chromas[0]?.id??"","pool")}
                  onDragEnd={()=>{dragData.current=null;setDragOverTier(null)}}
                  style={{"--rarity":skin.rarityColor} as React.CSSProperties}
                  onMouseEnter={e=>handleSkinEnter(e,skin.rarityIcon,skinDisplayName(skin.name,weapon.name))}
                  onMouseLeave={handleSkinLeave}
                >
                  <img src={skin.chromas[0]?.render ?? skin.icon} alt={skin.name}/>
                </div>
              ))}
              {poolSkins.length===0 && <div className="pool-empty">所有皮肤已排行</div>}
            </div>
            <div
              className={`ranking-scrollbar${poolScroll.visible?"":" hidden"}`}
              onPointerDown={e=>moveRankingScroll(e,poolGridRef.current)}
              onPointerMove={e=>moveRankingScroll(e,poolGridRef.current)}
            ><span style={{top:poolScroll.top,height:poolScroll.height}}/></div>
          </div>
        </div>
      </section>
      {hoveredTooltip && (
        <div className="ranking-tooltip" style={{left:hoveredTooltip.x, top:hoveredTooltip.y}}>
          {hoveredTooltip.rarityIcon && <img src={hoveredTooltip.rarityIcon} alt=""/>}
          <span>{hoveredTooltip.name}</span>
        </div>
      )}
      {filterOpen && (
        <div className="filter-modal" role="dialog" aria-modal="true" aria-label="筛选与排序" onMouseDown={e=>{if(e.target===e.currentTarget)setFilterOpen(false)}}>
          <div className="filter-dialog">
            <h2>筛选</h2>
            <div className="filter-divider"><span/></div>
            <div className="filter-columns">
              <section><h3>按稀有度筛选</h3>{qualityOrder.map((q,i)=>
                <label className="filter-option" key={q} style={{"--q":["#5a9fe2","#009587","#d1548d","#f5955b","#fad663"][i]} as React.CSSProperties}>
                  <input type="checkbox" checked={qualities.includes(q)} onChange={()=>toggleQuality(q)}/>
                  <span className="filter-check"/><strong>{["精选","豪华","卓越","传奇","终极"][i]}</strong><i/>
                </label>)}</section>
              <section><h3>排序选择</h3>{[["qualityDesc","品质：高到低"],["qualityAsc","品质：低到高"]].map(([value,label])=>
                <label className="sort-option" key={value}>
                  <input type="radio" name="ranking-sort" checked={sort===value} onChange={()=>setSort(value as typeof sort)}/>
                  <span/><strong>{label}</strong>
                </label>)}</section>
            </div>
            <button className="filter-done" onClick={()=>setFilterOpen(false)}>完成</button>
          </div>
        </div>
      )}
      {shareImageUrl&&<RankingSharePreview imageUrl={shareImageUrl} onClose={closeSharePreview} onSave={saveShareImage}/>}
      {shareGenerating&&<div className="share-generating" role="status"><span/>正在生成排行榜图片...</div>}
    </div>
  </main>;
}
