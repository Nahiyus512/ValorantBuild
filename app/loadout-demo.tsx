"use client";

import { useEffect, useMemo, useState } from "react";

type Chroma={id:string;name:string;render:string;swatch:string|null;priceRadianite:number|null;isDefault:boolean};
type Skin={id:string;name:string;rarity:string|null;rarityName:string;rarityRank:number;rarityColor:string;rarityIcon:string|null;priceVP:number|null;priceCN:number|null;icon:string;chromas:Chroma[]};
type Weapon={id:string;name:string;category:string;defaultSkinId:string;icon:string;skins:Skin[]};
type Buddy={id:string;name:string;icon:string};
type Data={priceNote:string;weapons:Weapon[];buddies:Buddy[]};
type Card={id:string;name:string;icon:string};
type Title={id:string;name:string};
type Spray={id:string;name:string;icon:string};
type CosmeticData={cards:Card[];titles:Title[];sprays:Spray[]};
type Equipped={skinId:string;chromaId:string;buddyId:string|null};
type SaveState="loading"|"saved"|"saving"|"error";
const localStorageKey="valorantbuild.loadout.v1";

const categoryNames:Record<string,string>={Sidearm:"佩枪",SMG:"冲锋枪",Shotgun:"霰弹枪",Rifle:"步枪",Sniper:"狙击枪",Heavy:"机枪",Melee:"近战武器"};
const categoryOrder=["Sidearm","SMG","Shotgun","Rifle","Sniper","Heavy","Melee"];
const qualityOrder=["Select","Deluxe","Premium","Exclusive","Ultra"];
const homeColumns=[
  {title:"佩枪",items:[["标配",1],["短炮",2],["狂怒",3],["鬼魅",4],["追猎",5],["正义",6]]},
  {title:"冲锋枪",items:[["蜂刺",1],["骇灵",2],["雄鹿",5],["判官",6]],subtitles:[["霰弹枪",4]]},
  {title:"步枪",items:[["獠犬",1],["戍卫",2],["幻影",3],["狂徒",4],["近战武器",6]],subtitles:[["近战武器",5]]},
  {title:"狙击枪",items:[["飞将",1],["莽侠",2],["冥驹",3],["战神",5],["奥丁",6]],subtitles:[["机枪",4]]},
] as const;

function TopBrandBar({onBack,weaponName,onShare}:{onBack?:()=>void;weaponName?:string;onShare:()=>void}){
  return <header className="home-bar shared-topbar">
    {onBack&&<button className="top-return" onClick={onBack}><span>&lt;</span> 返回</button>}
    {weaponName&&<span className="top-weapon">// {weaponName}</span>}
    <button className="top-rank">排行</button>
    <div className="home-mark">ValorantBuild</div>
    <button className="top-export" onClick={onShare}>分享</button>
  </header>
}

function TacticalBackground(){
  return <div className="background-layer" aria-hidden="true">
    <div className="base-gradient"/>
    <div className="center-glow"/>
    <svg className="background-geometry" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
      <g className="large-polygons">
        <polygon className="poly poly-left-back" points="-120,84 548,0 806,236 454,541 -120,704"/>
        <polygon className="poly poly-left-mid" points="-80,344 426,154 706,466 316,774 -80,686"/>
        <polygon className="poly poly-left-cut" points="0,762 344,541 657,846 423,1080 0,1080"/>
        <polygon className="poly poly-right-back" points="1442,-20 2040,100 2040,751 1634,559 1358,223"/>
        <polygon className="poly poly-right-mid" points="1664,293 2040,180 2040,1080 1478,1080 1376,754"/>
        <polygon className="poly poly-right-cut" points="1268,720 1572,484 1920,678 1920,1080 1486,1080"/>
        <polygon className="poly poly-center-plane" points="614,248 1076,118 1371,439 1060,759 677,653"/>
      </g>
      <g className="small-decorations">
        <path d="M246 173l72 42-72 42-72-42z M1613 191l52 90-104 0z M1238 810l78 45-78 45-78-45z"/>
        <path d="M420 875l62-36 62 36v72l-62 36-62-36z M1540 624l54-31 54 31v62l-54 31-54-31z"/>
        <path d="M95 418l181-104 164 95 M1470 104l151 86 173-100 M708 887l128-73 152 88 M1325 348l88-50 62 36"/>
        <path d="M252 742l98-56 M1111 175l112-64 M1685 824l116-67 M567 327l63-36"/>
        <path d="M905 354l28-48 28 48-28 48z M1088 657l19-33 19 33-19 33z"/>
      </g>
    </svg>
    <div className="lower-haze"/>
    <div className="noise-layer"/>
    <div className="vignette"/>
  </div>
}

export function LoadoutDemo(){
  const [data,setData]=useState<Data|null>(null);
  const [page,setPage]=useState<"home"|"select"|"card"|"expression">("home");
  const [cosmetics,setCosmetics]=useState<CosmeticData|null>(null);
  const [weaponId,setWeaponId]=useState("");
  const [tab,setTab]=useState<"skin"|"buddy">("skin");
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState<"default"|"priceAsc"|"priceDesc"|"qualityAsc"|"qualityDesc">("qualityDesc");
  const [qualities,setQualities]=useState<string[]>([]);
  const [skinId,setSkinId]=useState("");
  const [chromaId,setChromaId]=useState("");
  const [buddyId,setBuddyId]=useState<string|null>(null);
  const [equipped,setEquipped]=useState<Record<string,Equipped>>({});
  const [filterOpen,setFilterOpen]=useState(false);
  const [canvasScale,setCanvasScale]=useState(1);
  const [playerName,setPlayerName]=useState("ValorantBuild");
  const [playerLevel,setPlayerLevel]=useState("100");
  const [listScroll,setListScroll]=useState(0);
  const [saveState,setSaveState]=useState<SaveState>("loading");
  const [storageReady,setStorageReady]=useState(false);
  const [cosmeticTab,setCosmeticTab]=useState<"cards"|"titles"|"sprays">("cards");
  const [selectedCardId,setSelectedCardId]=useState("");
  const [selectedTitleId,setSelectedTitleId]=useState("");
  const [selectedSprayId,setSelectedSprayId]=useState("");
  const [equippedCardId,setEquippedCardId]=useState<string|null>(null);
  const [equippedTitleId,setEquippedTitleId]=useState<string|null>(null);
  const [sprayWheel,setSprayWheel]=useState<string[]>([]);
  const [wheelPickerOpen,setWheelPickerOpen]=useState(false);

  useEffect(()=>{fetch("/demo-data.json").then(r=>r.json() as Promise<Data>).then(d=>{
    setData(d);
    const initial:Record<string,Equipped>={};
    d.weapons.forEach(w=>{const s=w.skins.find(x=>x.id===w.defaultSkinId)??w.skins.at(-1)!;initial[w.id]={skinId:s.id,chromaId:s.chromas[0]?.id,buddyId:null}});
    let stored:{playerName?:string;playerLevel?:string;equipped?:Record<string,Equipped>}|null=null;
    try{stored=JSON.parse(window.localStorage.getItem(localStorageKey)??"null")}catch{}
    setEquipped({...initial,...(stored?.equipped??{})});
    if(stored?.playerName)setPlayerName(stored.playerName);
    if(stored?.playerLevel)setPlayerLevel(stored.playerLevel);
    setSaveState("saved");
    setStorageReady(true);
  }).catch(()=>setSaveState("error"))},[]);
  useEffect(()=>{fetch("/cosmetic-data.json").then(r=>r.json() as Promise<CosmeticData>).then(c=>{
    setCosmetics(c);
    let stored:{cosmeticVersion?:number;selectedCardId?:string;selectedTitleId?:string;selectedSprayId?:string;equippedCardId?:string|null;equippedTitleId?:string|null;sprayWheel?:string[]}|null=null;
    try{stored=JSON.parse(window.localStorage.getItem(localStorageKey)??"null")}catch{}
    setSelectedCardId(stored?.selectedCardId??c.cards[0]?.id??"");
    setSelectedTitleId(stored?.selectedTitleId??c.titles[0]?.id??"");
    setSelectedSprayId(stored?.selectedSprayId??c.sprays[0]?.id??"");
    setEquippedCardId(stored?.equippedCardId??null);
    setEquippedTitleId(stored?.equippedTitleId??null);
    setSprayWheel(stored?.cosmeticVersion===2?(stored.sprayWheel??[]):[]);
  })},[]);
  useEffect(()=>{
    if(!storageReady)return;
    setSaveState("saving");
    const timer=window.setTimeout(()=>{
      try{
        window.localStorage.setItem(localStorageKey,JSON.stringify({cosmeticVersion:2,playerName,playerLevel,equipped,selectedCardId,selectedTitleId,selectedSprayId,equippedCardId,equippedTitleId,sprayWheel}));
        setSaveState("saved");
      }catch{setSaveState("error")}
    },250);
    return()=>window.clearTimeout(timer);
  },[storageReady,playerName,playerLevel,equipped,selectedCardId,selectedTitleId,selectedSprayId,equippedCardId,equippedTitleId,sprayWheel]);
  useEffect(()=>{
    const fit=()=>setCanvasScale(Math.min(window.innerWidth/1920,window.innerHeight/1080));
    fit();window.addEventListener("resize",fit);return()=>window.removeEventListener("resize",fit);
  },[]);

  const weapon=data?.weapons.find(w=>w.id===weaponId);
  const selectedSkin=weapon?.skins.find(s=>s.id===skinId);
  const selectedChroma=selectedSkin?.chromas.find(c=>c.id===chromaId)??selectedSkin?.chromas[0];
  const selectedBuddy=weapon?.category==="Melee"?undefined:data?.buddies.find(b=>b.id===buddyId);
  const selectionIsEquipped=!!(weapon&&selectedSkin&&selectedChroma&&equipped[weapon.id]?.skinId===selectedSkin.id&&equipped[weapon.id]?.chromaId===selectedChroma.id&&equipped[weapon.id]?.buddyId===buddyId);

  const visibleSkins=useMemo(()=>{
    if(!weapon)return[];
    let list=weapon.skins.filter(s=>s.name.toLowerCase().includes(query.toLowerCase())&&(!qualities.length||qualities.includes(s.rarity??"")));
    if(sort==="priceAsc")list=[...list].sort((a,b)=>(a.priceCN??1e9)-(b.priceCN??1e9));
    if(sort==="priceDesc")list=[...list].sort((a,b)=>(b.priceCN??-1)-(a.priceCN??-1));
    if(sort==="qualityAsc")list=[...list].sort((a,b)=>a.rarityRank-b.rarityRank);
    if(sort==="qualityDesc")list=[...list].sort((a,b)=>b.rarityRank-a.rarityRank);
    return list;
  },[weapon,query,qualities,sort]);
  const visibleBuddies=useMemo(()=>data?.buddies.filter(b=>b.name.toLowerCase().includes(query.toLowerCase()))??[],[data,query]);
  const selectedCard=cosmetics?.cards.find(c=>c.id===selectedCardId);
  const selectedTitle=cosmetics?.titles.find(t=>t.id===selectedTitleId);
  const selectedSpray=cosmetics?.sprays.find(s=>s.id===selectedSprayId);
  const equippedCard=cosmetics?.cards.find(c=>c.id===equippedCardId);
  const equippedTitle=cosmetics?.titles.find(t=>t.id===equippedTitleId);
  const cosmeticItems=useMemo(()=>{
    if(!cosmetics)return[];
    const source=cosmeticTab==="cards"?cosmetics.cards:cosmeticTab==="titles"?cosmetics.titles:cosmetics.sprays;
    return source.filter(item=>String(item.name??"").toLowerCase().includes(query.toLowerCase()));
  },[cosmetics,cosmeticTab,query]);

  function openWeapon(w:Weapon){
    const load=equipped[w.id]; const skin=w.skins.find(s=>s.id===load?.skinId)??w.skins.at(-1)!;
    setWeaponId(w.id);setSkinId(skin.id);setChromaId(load?.chromaId??skin.chromas[0]?.id);setBuddyId(w.category==="Melee"?null:load?.buddyId??null);setTab("skin");setQuery("");setPage("select");
  }
  function chooseSkin(s:Skin){setSkinId(s.id);setChromaId(s.chromas[0]?.id)}
  function equip(){
    if(!weapon||!selectedSkin||!selectedChroma)return;
    if(selectionIsEquipped){
      const defaultSkin=weapon.skins.find(s=>s.id===weapon.defaultSkinId)??weapon.skins.at(-1)!;
      setEquipped(v=>({...v,[weapon.id]:{skinId:defaultSkin.id,chromaId:defaultSkin.chromas[0]?.id,buddyId:null}}));
      return;
    }
    setEquipped(v=>({...v,[weapon.id]:{skinId:selectedSkin.id,chromaId:selectedChroma.id,buddyId:weapon.category==="Melee"?null:buddyId}}))
  }
  function toggleQuality(q:string){setQualities(v=>v.includes(q)?v.filter(x=>x!==q):[...v,q])}
  function displayFor(w:Weapon){const load=equipped[w.id];const s=w.skins.find(x=>x.id===load?.skinId)??w.skins.at(-1)!;return s.chromas.find(c=>c.id===load?.chromaId)?.render??s.chromas[0]?.render??w.icon}
  async function shareHome(){
    if(page!=="home"){setPage("home");await new Promise(resolve=>window.setTimeout(resolve,80))}
    const stage=document.querySelector(".fixed-stage");
    if(!stage)return;
    const clone=stage.cloneNode(true) as HTMLElement;
    clone.style.setProperty("--canvas-scale","1");
    clone.style.transform="none";clone.style.position="relative";clone.style.left="0";clone.style.top="0";
    const asDataUrl=async(src:string)=>{
      try{
        const response=await fetch(new URL(src,window.location.href).href,{mode:"cors"});
        if(!response.ok)throw new Error("image");
        const blob=await response.blob();
        return await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(blob)});
      }catch{return "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}
    };
    const sourceImages=Array.from(stage.querySelectorAll("img"));
    const clonedImages=Array.from(clone.querySelectorAll("img"));
    const embedded=await Promise.all(sourceImages.map(img=>asDataUrl(img.currentSrc||img.src)));
    clonedImages.forEach((img,index)=>img.src=embedded[index]);
    const card=clone.querySelector<HTMLElement>(".player-card");
    if(card&&equippedCard)card.style.setProperty("--card-art",`url(${await asDataUrl(equippedCard.icon)})`);
    const css=Array.from(document.styleSheets).flatMap(sheet=>{try{return Array.from(sheet.cssRules).filter(rule=>!rule.cssText.startsWith("@font-face")).map(rule=>rule.cssText)}catch{return[]}}).join("\n").replaceAll("url(/",`url(${window.location.origin}/`);
    const markup=new XMLSerializer().serializeToString(clone).replaceAll("url(/",`url(${window.location.origin}/`);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>${css}</style>${markup}</div></foreignObject></svg>`;
    const image=new Image();
    const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml;charset=utf-8"}));
    image.onload=()=>{const canvas=document.createElement("canvas");canvas.width=1920;canvas.height=1080;canvas.getContext("2d")?.drawImage(image,0,0);URL.revokeObjectURL(url);canvas.toBlob(blob=>{if(!blob){window.alert("图片生成失败，请重试");return}const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`ValorantBuild-${Date.now()}.png`;document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(a.href),1000)},"image/png")};
    image.onerror=()=>{URL.revokeObjectURL(url);window.alert("图片生成失败，请重试")};
    image.src=url;
  }

  if(!data)return <main className="loading"><span>V</span><p>正在装载 1,364 款皮肤资源…</p></main>;

  if(page==="home")return <main className="game-shell">
    <TacticalBackground/>
    <div className="fixed-stage" style={{"--canvas-scale":canvasScale} as React.CSSProperties}>
    <TopBrandBar onShare={shareHome}/>
    <section className="loadout-layout">
      <div className="weapon-board">
        {homeColumns.map(column=><section className="weapon-column" key={column.title}><h2>{column.title}</h2><div className="weapon-column-grid">
          {"subtitles" in column&&column.subtitles.map(([label,row])=><h3 key={label} style={{gridRow:row}}>{label}</h3>)}
          {column.items.map(([name,row])=>{const w=data.weapons.find(x=>x.name===name)!;const load=equipped[w.id];const buddy=w.category==="Melee"?undefined:data.buddies.find(b=>b.id===load?.buddyId);
              return <button className="weapon-tile" style={{gridRow:row}} key={w.id} onClick={()=>openWeapon(w)}>
                <img src={displayFor(w)} alt={w.name}/>{buddy&&<img className="tile-buddy" src={buddy.icon} alt=""/>}<span>{w.name}</span>
              </button>})}
          </div></section>)}
      </div>
      <aside className="profile-panel"><h2>玩家卡面</h2><div className="player-card" role="button" tabIndex={0} onClick={e=>{if((e.target as HTMLElement).tagName!=="INPUT"){setCosmeticTab("cards");setQuery("");setPage("card")}}} onKeyDown={e=>{if(e.key==="Enter"){setCosmeticTab("cards");setPage("card")}}} style={equippedCard?{"--card-art":`url(${equippedCard.icon})`} as React.CSSProperties:undefined}><div className="card-energy"><input aria-label="玩家等级" value={playerLevel} maxLength={3} onChange={e=>setPlayerLevel(e.target.value.replace(/\D/g,""))}/></div><div className="player-card-inner">{!equippedCard&&<div className="v-shape">V</div>}<input className="card-id" aria-label="玩家 ID" value={playerName} maxLength={20} onChange={e=>setPlayerName(e.target.value)}/>{equippedTitle&&<small>{equippedTitle.name}</small>}</div></div><h2>个性表达</h2><button className="spray-wheel" onClick={()=>{setCosmeticTab("sprays");setQuery("");setPage("expression")}} aria-label="选择喷漆"><b className="wheel-ring"/><u className="inner-spokes"/>{[0,1,2,3].map(index=>{const id=sprayWheel[index];const spray=cosmetics?.sprays.find(s=>s.id===id);return <i key={`${id??"empty"}-${index}`}>{spray?<img src={spray.icon} alt=""/>:<em>+</em>}</i>})}<span/></button></aside>
    </section>
    <div className="home-foot"><span>20 种武器</span><span>1,364 款可用皮肤</span><span>866 个挂饰</span></div>
    </div>
  </main>;

  if(page==="card"||page==="expression"){
    const isCardPage=page==="card";
    const tabs=isCardPage?[["cards","卡面"],["titles","称号"]] as const:[["sprays","喷漆"]] as const;
    const currentName=cosmeticTab==="cards"?selectedCard?.name:cosmeticTab==="titles"?selectedTitle?.name:selectedSpray?.name;
    const cosmeticIsEquipped=cosmeticTab==="cards"?equippedCardId===selectedCardId:cosmeticTab==="titles"?equippedTitleId===selectedTitleId:sprayWheel.includes(selectedSprayId);
    const toggleCosmetic=()=>{
      if(cosmeticTab==="cards")setEquippedCardId(cosmeticIsEquipped?null:selectedCardId);
      else if(cosmeticTab==="titles")setEquippedTitleId(cosmeticIsEquipped?null:selectedTitleId);
      else if(cosmeticIsEquipped)setSprayWheel(v=>v.map(id=>id===selectedSprayId?"":id));
      else setWheelPickerOpen(true);
    };
    return <main className="game-shell"><TacticalBackground/><div className="fixed-stage" style={{"--canvas-scale":canvasScale} as React.CSSProperties}>
      <TopBrandBar onBack={()=>setPage("home")} weaponName={isCardPage?"玩家卡面":"个性表达"} onShare={shareHome}/>
      <nav className="selector-subnav"><div className={`selector-tabs cosmetic-tabs ${isCardPage?"":"single-tab"}`}>{tabs.map(([id,label])=><button key={id} className={cosmeticTab===id?"active":""} onClick={()=>{setCosmeticTab(id);setQuery("");setListScroll(0)}}>{label}</button>)}</div></nav>
      <div className="selector-layout cosmetic-layout">
        <aside className="item-browser cosmetic-browser">
          <div className="browser-tools buddy-tools"><label>⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`搜索${tabs.find(([id])=>id===cosmeticTab)?.[1]??""}`}/></label></div>
          <div className={`cosmetic-grid ${cosmeticTab==="titles"?"title-grid":""}`}>
            {cosmeticItems.map(item=><button key={item.id} className={(cosmeticTab==="cards"?selectedCardId:cosmeticTab==="titles"?selectedTitleId:selectedSprayId)===item.id?"selected":""} onClick={()=>{
              if(cosmeticTab==="cards")setSelectedCardId(item.id);
              else if(cosmeticTab==="titles")setSelectedTitleId(item.id);
              else setSelectedSprayId(item.id);
            }}>{("icon" in item)&&<img src={item.icon} alt=""/>}<strong>{item.name}</strong></button>)}
          </div>
        </aside>
        <section className="weapon-preview cosmetic-preview">
          <div className="preview-title"><h1>{cosmeticTab==="wheel"?"喷漆盘":currentName}</h1></div>
          {cosmeticTab==="cards"&&<div className="card-preview">{selectedCard&&<img src={selectedCard.icon} alt={selectedCard.name}/>}<strong>{playerName}</strong>{equippedTitle&&<small>{equippedTitle.name}</small>}</div>}
          {cosmeticTab==="titles"&&<div className="title-preview"><span>{playerName}</span><strong>{selectedTitle?.name}</strong></div>}
          {cosmeticTab==="sprays"&&<div className="spray-preview">{selectedSpray&&<img src={selectedSpray.icon} alt={selectedSpray.name}/>}</div>}
          <div className="selection-meta"><div className="equip-row"><button className={cosmeticIsEquipped?"equip-button equipped":"equip-button"} onClick={toggleCosmetic}>{cosmeticIsEquipped?"取消装备":"装备"}</button></div></div>
        </section>
      </div>
      {wheelPickerOpen&&<div className="filter-modal wheel-picker" role="dialog" aria-modal="true" aria-label="选择喷漆盘位置"><div className="wheel-picker-panel"><h2>选择装备位置</h2><button className="picker-close" onClick={()=>setWheelPickerOpen(false)}>×</button><div className="picker-wheel"><b className="wheel-ring"/><u className="inner-spokes"/>{(["上","左","右","下"] as const).map((label,slot)=>{const spray=cosmetics?.sprays.find(s=>s.id===sprayWheel[slot]);return <button className={`picker-slot slot-${slot}`} key={slot} onClick={()=>{setSprayWheel(v=>{const next=[...v];while(next.length<4)next.push("");next[slot]=selectedSprayId;return next});setWheelPickerOpen(false)}}>{spray?<img src={spray.icon} alt={spray.name}/>:<em>+</em>}<span>{label}</span></button>})}<span/></div></div></div>}
    </div></main>
  }

  return <main className="game-shell">
    <TacticalBackground/>
    <div className="fixed-stage" style={{"--canvas-scale":canvasScale} as React.CSSProperties}>
    <TopBrandBar onBack={()=>setPage("home")} weaponName={weapon?.name} onShare={shareHome}/>
    <nav className="selector-subnav">
      <div className="selector-tabs"><button className={tab==="skin"?"active":""} onClick={()=>{setTab("skin");setQuery("")}}>皮肤</button>{weapon?.category!=="Melee"&&<button className={tab==="buddy"?"active":""} onClick={()=>{setTab("buddy");setQuery("")}}>挂饰</button>}</div>
    </nav>
    <div className="selector-layout">
      <aside className="item-browser">
        <div className={`browser-tools ${tab==="buddy"?"buddy-tools":""}`}><label>⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={tab==="skin"?"搜索皮肤":"搜索挂饰"}/></label>
          {tab==="skin"&&<button className={`filter-trigger ${filterOpen?"on":""}`} aria-label="打开筛选与排序" onClick={()=>setFilterOpen(true)}><span/><span/><span/></button>}
        </div>
        <div className={tab==="skin"?"skin-grid":"buddy-grid"}>
          {tab==="skin"?visibleSkins.map(s=><button key={s.id} className={skinId===s.id?"selected":""} onClick={()=>chooseSkin(s)} style={{"--rarity":s.rarityColor} as React.CSSProperties}><img src={s.chromas[0]?.render??s.icon} alt=""/><strong>{s.name.replace(` ${weapon?.name}`,"")}</strong><small>{s.priceCN==null?"非直接售卖":`${s.priceCN} 点券`}</small></button>):
          <><button className={buddyId===null?"selected":""} onClick={()=>setBuddyId(null)} aria-label="不使用挂饰"><span className="no-buddy">×</span></button>{visibleBuddies.map(b=><button key={b.id} className={buddyId===b.id?"selected":""} onClick={()=>setBuddyId(b.id)}><img src={b.icon} alt=""/><strong>{b.name}</strong></button>)}</>}
        </div>
      </aside>
      <section className="weapon-preview">
        <div className="preview-title">{selectedSkin?.rarityIcon&&<img src={selectedSkin.rarityIcon} alt={selectedSkin.rarityName}/>}<h1>{selectedSkin?.name??weapon?.name}</h1></div>
        <div className="gun-stage"><img className="main-gun" src={selectedChroma?.render??weapon?.icon} alt=""/>{selectedBuddy&&<img className="gun-buddy" src={selectedBuddy.icon} alt={selectedBuddy.name}/>}</div>
        <div className="selection-meta">
          {tab==="skin"&&selectedSkin&&selectedSkin.chromas.length>1&&<div className="chroma-row">{selectedSkin.chromas.map(c=><button key={c.id} className={selectedChroma?.id===c.id?"selected":""} onClick={()=>setChromaId(c.id)} title={c.name}>{c.swatch?<img src={c.swatch} alt=""/>:<img src={c.render} alt=""/>}</button>)}</div>}
          {tab==="buddy"&&<div className="buddy-summary"><strong>{selectedBuddy?.name??"无挂饰"}</strong></div>}
          <div className="equip-row"><button className={selectionIsEquipped?"equip-button equipped":"equip-button"} onClick={equip}>{selectionIsEquipped?"已装备":"装备"}</button></div>
        </div>
      </section>
    </div>
    {filterOpen&&tab==="skin"&&<div className="filter-modal" role="dialog" aria-modal="true" aria-label="筛选与排序">
      <div className="filter-dialog">
        <h2>筛选</h2>
        <div className="filter-divider"><span/></div>
        <div className="filter-columns">
          <section><h3>按稀有度筛选</h3>{qualityOrder.map((q,i)=><label className="filter-option" key={q} style={{"--q":["#5a9fe2","#009587","#d1548d","#f5955b","#fad663"][i]} as React.CSSProperties}><input type="checkbox" checked={qualities.includes(q)} onChange={()=>toggleQuality(q)}/><span className="filter-check"/><strong>{["精选","豪华","卓越","传奇","终极"][i]}</strong><i/></label>)}</section>
          <section><h3>排序选择</h3>{[["qualityDesc","品质：高到低"],["qualityAsc","品质：低到高"],["priceDesc","价格：高到低"],["priceAsc","价格：低到高"]].map(([value,label])=><label className="sort-option" key={value}><input type="radio" name="skin-sort" checked={sort===value} onChange={()=>setSort(value as typeof sort)}/><span/><strong>{label}</strong></label>)}</section>
        </div>
        <button className="filter-done" onClick={()=>setFilterOpen(false)}>完成</button>
      </div>
    </div>}
    </div>
  </main>
}
