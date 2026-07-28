"use client";

import { useEffect, useMemo, useState } from "react";

type Chroma={id:string;name:string;render:string;swatch:string|null;priceRadianite:number|null;isDefault:boolean};
type Skin={id:string;name:string;rarity:string|null;rarityName:string;rarityRank:number;rarityColor:string;priceVP:number|null;priceCNY:number|null;icon:string;chromas:Chroma[]};
type Weapon={id:string;name:string;category:string;defaultSkinId:string;icon:string;skins:Skin[]};
type Buddy={id:string;name:string;icon:string};
type Data={priceNote:string;weapons:Weapon[];buddies:Buddy[]};
type Equipped={skinId:string;chromaId:string;buddyId:string|null};

const categoryNames:Record<string,string>={Sidearm:"佩枪",SMG:"冲锋枪",Shotgun:"霰弹枪",Rifle:"步枪",Sniper:"狙击枪",Heavy:"机枪",Melee:"近战武器"};
const categoryOrder=["Sidearm","SMG","Shotgun","Rifle","Sniper","Heavy","Melee"];
const qualityOrder=["Select","Deluxe","Premium","Exclusive","Ultra"];

export function LoadoutDemo(){
  const [data,setData]=useState<Data|null>(null);
  const [page,setPage]=useState<"home"|"select">("home");
  const [weaponId,setWeaponId]=useState("");
  const [tab,setTab]=useState<"skin"|"buddy">("skin");
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState<"default"|"priceAsc"|"priceDesc"|"qualityAsc"|"qualityDesc">("default");
  const [qualities,setQualities]=useState<string[]>([]);
  const [skinId,setSkinId]=useState("");
  const [chromaId,setChromaId]=useState("");
  const [buddyId,setBuddyId]=useState<string|null>(null);
  const [equipped,setEquipped]=useState<Record<string,Equipped>>({});
  const [filterOpen,setFilterOpen]=useState(false);

  useEffect(()=>{fetch("/demo-data.json").then(r=>r.json()).then((d:Data)=>{
    setData(d);
    const initial:Record<string,Equipped>={};
    d.weapons.forEach(w=>{const s=w.skins.find(x=>x.id===w.defaultSkinId)??w.skins.at(-1)!;initial[w.id]={skinId:s.id,chromaId:s.chromas[0]?.id,buddyId:null}});
    setEquipped(initial);
  })},[]);

  const weapon=data?.weapons.find(w=>w.id===weaponId);
  const selectedSkin=weapon?.skins.find(s=>s.id===skinId);
  const selectedChroma=selectedSkin?.chromas.find(c=>c.id===chromaId)??selectedSkin?.chromas[0];
  const selectedBuddy=data?.buddies.find(b=>b.id===buddyId);

  const visibleSkins=useMemo(()=>{
    if(!weapon)return[];
    let list=weapon.skins.filter(s=>s.name.toLowerCase().includes(query.toLowerCase())&&(!qualities.length||qualities.includes(s.rarity??"")));
    if(sort==="priceAsc")list=[...list].sort((a,b)=>(a.priceCNY??1e9)-(b.priceCNY??1e9));
    if(sort==="priceDesc")list=[...list].sort((a,b)=>(b.priceCNY??-1)-(a.priceCNY??-1));
    if(sort==="qualityAsc")list=[...list].sort((a,b)=>a.rarityRank-b.rarityRank);
    if(sort==="qualityDesc")list=[...list].sort((a,b)=>b.rarityRank-a.rarityRank);
    return list;
  },[weapon,query,qualities,sort]);
  const visibleBuddies=useMemo(()=>data?.buddies.filter(b=>b.name.toLowerCase().includes(query.toLowerCase()))??[],[data,query]);

  function openWeapon(w:Weapon){
    const load=equipped[w.id]; const skin=w.skins.find(s=>s.id===load?.skinId)??w.skins.at(-1)!;
    setWeaponId(w.id);setSkinId(skin.id);setChromaId(load?.chromaId??skin.chromas[0]?.id);setBuddyId(load?.buddyId??null);setTab("skin");setQuery("");setPage("select");
  }
  function chooseSkin(s:Skin){setSkinId(s.id);setChromaId(s.chromas[0]?.id)}
  function equip(){if(!weapon||!selectedSkin||!selectedChroma)return;setEquipped(v=>({...v,[weapon.id]:{skinId:selectedSkin.id,chromaId:selectedChroma.id,buddyId}}))}
  function toggleQuality(q:string){setQualities(v=>v.includes(q)?v.filter(x=>x!==q):[...v,q])}
  function displayFor(w:Weapon){const load=equipped[w.id];const s=w.skins.find(x=>x.id===load?.skinId)??w.skins.at(-1)!;return s.chromas.find(c=>c.id===load?.chromaId)?.render??s.chromas[0]?.render??w.icon}

  if(!data)return <main className="loading"><span>V</span><p>正在装载 1,364 款皮肤资源…</p></main>;

  if(page==="home")return <main className="game-shell">
    <div className="game-bg"/>
    <div className="home-bar"><b>‹</b><span>返回</span><i>//</i><strong>收藏</strong><div className="home-mark">V</div><small>装备构建器 · 国服价格</small></div>
    <section className="loadout-layout">
      <div className="weapon-board">
        {categoryOrder.map(category=>{
          const group=data.weapons.filter(w=>w.category===category);
          return <section className={`weapon-group group-${category}`} key={category}><h2>{categoryNames[category]}</h2><div>
            {group.map(w=>{const load=equipped[w.id];const skin=w.skins.find(s=>s.id===load?.skinId);const buddy=data.buddies.find(b=>b.id===load?.buddyId);
              return <button className="weapon-tile" key={w.id} onClick={()=>openWeapon(w)}>
                <img src={displayFor(w)} alt={w.name}/>{buddy&&<img className="tile-buddy" src={buddy.icon} alt=""/>}<span>{w.name}</span><small>{skin?.rarityName??"默认"}</small>
              </button>})}
          </div></section>})}
      </div>
      <aside className="profile-panel"><h2>玩家卡面</h2><div className="player-card"><div className="v-shape">V</div><strong>VALO LOADOUT</strong><small>装备分析师</small></div><h2>个性表达</h2><div className="spray-wheel"><i>V</i><i>V</i><i>V</i><i>V</i><span/></div><p>点击任意武器配置皮肤与挂饰</p></aside>
    </section>
    <div className="home-foot"><span>20 种武器</span><span>1,364 款可用皮肤</span><span>866 个挂饰</span></div>
  </main>;

  return <main className="game-shell">
    <div className="game-bg"/>
    <header className="select-bar"><button onClick={()=>setPage("home")}>‹ 返回</button><i>//</i><strong>{weapon?.name}</strong><div><button className={tab==="skin"?"active":""} onClick={()=>{setTab("skin");setQuery("")}}>皮肤</button><button className={tab==="buddy"?"active":""} onClick={()=>{setTab("buddy");setQuery("")}}>挂饰</button></div><small>{weapon?.skins.length} 款皮肤</small></header>
    <div className="selector-layout">
      <aside className="item-browser">
        <div className="browser-tools"><label>⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={tab==="skin"?"搜索皮肤":"搜索挂饰"}/></label>
          {tab==="skin"&&<><button className={filterOpen?"on":""} onClick={()=>setFilterOpen(!filterOpen)}>筛选 {qualities.length?`(${qualities.length})`:""}</button><select value={sort} onChange={e=>setSort(e.target.value as typeof sort)}><option value="default">默认排序</option><option value="priceAsc">价格：低到高</option><option value="priceDesc">价格：高到低</option><option value="qualityAsc">品质：低到高</option><option value="qualityDesc">品质：高到低</option></select></>}
        </div>
        {filterOpen&&tab==="skin"&&<div className="quality-filter"><div><strong>品质筛选</strong><button onClick={()=>setQualities([])}>清除</button></div>{qualityOrder.map((q,i)=><label key={q} style={{"--q": ["#5a9fe2","#009587","#d1548d","#f5955b","#fad663"][i]} as React.CSSProperties}><input type="checkbox" checked={qualities.includes(q)} onChange={()=>toggleQuality(q)}/><span/>{["精选","豪华","卓越","传奇","终极"][i]}</label>)}</div>}
        <div className={tab==="skin"?"skin-grid":"buddy-grid"}>
          {tab==="skin"?visibleSkins.map(s=><button key={s.id} className={skinId===s.id?"selected":""} onClick={()=>chooseSkin(s)} style={{"--rarity":s.rarityColor} as React.CSSProperties}><img src={s.chromas[0]?.render??s.icon} alt=""/><strong>{s.name.replace(` ${weapon?.name}`,"")}</strong><small>{s.priceCNY==null?"非直接售卖":`¥ ${s.priceCNY.toFixed(1)}`}</small></button>):
          <><button className={buddyId===null?"selected":""} onClick={()=>setBuddyId(null)}><span className="no-buddy">×</span><strong>不使用挂饰</strong></button>{visibleBuddies.map(b=><button key={b.id} className={buddyId===b.id?"selected":""} onClick={()=>setBuddyId(b.id)}><img src={b.icon} alt=""/><strong>{b.name}</strong></button>)}</>}
        </div>
      </aside>
      <section className="weapon-preview">
        <div className="preview-title"><span style={{color:selectedSkin?.rarityColor}}>{selectedSkin?.rarityName} // {selectedSkin?.priceCNY==null?"非直接售卖":`国服估算 ¥${selectedSkin.priceCNY.toFixed(1)}`}</span><h1>{selectedSkin?.name??weapon?.name}</h1></div>
        <div className="gun-stage"><img className="main-gun" src={selectedChroma?.render??weapon?.icon} alt=""/>{selectedBuddy&&<img className="gun-buddy" src={selectedBuddy.icon} alt={selectedBuddy.name}/>}</div>
        <div className="selection-meta">
          {tab==="skin"&&selectedSkin&&<div className="chroma-row"><div><strong>炫彩</strong><small>{selectedSkin.chromas.length===1?"仅默认外观，无额外炫彩":`${selectedSkin.chromas.length} 种外观`}</small></div><div>{selectedSkin.chromas.map(c=><button key={c.id} className={selectedChroma?.id===c.id?"selected":""} onClick={()=>setChromaId(c.id)}>{c.swatch?<img src={c.swatch} alt=""/>:<img src={c.render} alt=""/>}</button>)}</div></div>}
          {tab==="buddy"&&<div className="buddy-summary"><span>当前挂饰</span><strong>{selectedBuddy?.name??"无挂饰"}</strong><small>挂饰会应用在当前武器配置中</small></div>}
          <div className="equip-row"><div><small>国服参考价</small><strong>{selectedSkin?.priceCNY==null?"—":`¥ ${selectedSkin.priceCNY.toFixed(1)}`}</strong><em>按 1 元≈10 点券估算</em></div><button onClick={equip}>装备当前组合</button></div>
        </div>
      </section>
    </div>
  </main>
}
