"use client";

import { useMemo, useState } from "react";

type Chroma = { id: string; label: string; rp: number; swatch?: boolean };
type Skin = {
  id: string; name: string; series: string; price: number; tier: string;
  tierColor: string; levels: number; chromas: Chroma[];
};

const skins: Skin[] = [
  { id:"rgx", name:"RGX 11z Pro 狂徒", series:"RGX 11z Pro", price:2175, tier:"传奇", tierColor:"#f5955b", levels:5, chromas:[
    {id:"742740d0-4e50-57e1-af32-f991c7c640f8",label:"默认",rp:0,swatch:true},{id:"700f04e0-41dd-7e10-4103-ab9af60d3447",label:"红色",rp:15,swatch:true},{id:"4df3ba9f-4f72-dea8-c8d3-05a0dc1b7b58",label:"蓝色",rp:15,swatch:true},{id:"038c6a4d-4fc5-5886-492c-ff8269661bf9",label:"黄色",rp:15,swatch:true}]},
  { id:"wing", name:"狂翼掠空 狂徒", series:"狂翼掠空", price:1275, tier:"豪华", tierColor:"#46c7bd", levels:1, chromas:[{id:"97873b03-4586-fe14-5790-daa15d064da0",label:"默认",rp:0}]},
  { id:"vision", name:"光荣异象 狂徒", series:"光荣异象", price:2175, tier:"传奇", tierColor:"#f5955b", levels:4, chromas:[
    {id:"eeace112-4611-db5c-d784-d9bd0797ff3c",label:"默认",rp:0},{id:"b8a2c73c-4c28-958f-9e01-51b6637ab566",label:"紫色",rp:15,swatch:true},{id:"57954d38-4399-5520-2365-26a6e6fa8f12",label:"蓝色",rp:15,swatch:true},{id:"f989bd12-44ba-9f42-439b-949c68060569",label:"绿色",rp:15,swatch:true}]},
  { id:"zero", name:"归零者 狂徒", series:"归零者", price:2175, tier:"传奇", tierColor:"#f5955b", levels:4, chromas:[
    {id:"a09f9850-4cb9-d0aa-63c7-6dbb5a64f27e",label:"默认",rp:0},{id:"03d3ef6f-42b9-234d-d89e-fd938511ed31",label:"紫色",rp:15,swatch:true},{id:"e3fca4fe-4617-8367-6738-9f92a89c3ba1",label:"黑色",rp:15,swatch:true},{id:"6610c5f5-490b-e3a6-dca3-a8b21dcb3196",label:"银色",rp:15,swatch:true}]},
  { id:"gaia", name:"盖亚的复仇 狂徒", series:"盖亚的复仇", price:1775, tier:"卓越", tierColor:"#d978ad", levels:4, chromas:[
    {id:"c9d93000-4133-3f68-20ea-81a307ef0540",label:"默认",rp:0},{id:"ee020712-4e21-2d01-8ec7-5281fbc3489a",label:"蓝色",rp:15,swatch:true},{id:"947f3bf8-4187-b89f-01ab-be97f949ac72",label:"绿色",rp:15,swatch:true},{id:"c12e2ea7-49b3-1871-99ac-8f8385d78ed5",label:"橙色",rp:15,swatch:true}]},
  { id:"origin", name:"起源 狂徒", series:"起源", price:1775, tier:"卓越", tierColor:"#d978ad", levels:4, chromas:[
    {id:"de2a2b29-4a65-459e-a822-ccacbff53d46",label:"默认",rp:0},{id:"11406ee3-472c-dc1a-98f7-bfa8f2e3658b",label:"绿色",rp:15,swatch:true},{id:"6153bc01-4807-c705-e576-63beb9c8e930",label:"红色",rp:15,swatch:true},{id:"0e16ba9e-48d4-85fd-3b76-84abc19932a0",label:"白色",rp:15,swatch:true}]},
  { id:"chrono", name:"超时空卫队 狂徒", series:"超时空卫队", price:2475, tier:"终极", tierColor:"#f7d86b", levels:4, chromas:[
    {id:"1f8aaf7a-4f41-c8c2-9d7d-1ba3cf469e70",label:"默认",rp:0},{id:"c92a448c-4a1a-949f-3c6f-af94c48bf06a",label:"蓝色",rp:15,swatch:true},{id:"a62999c9-4d91-76cf-8564-f39805afe67b",label:"黑色",rp:15,swatch:true},{id:"37834c1c-4293-7248-47ba-1fad41f59c87",label:"金色",rp:15,swatch:true}]},
  { id:"star", name:"星航勇进 狂徒", series:"星航勇进", price:875, tier:"精选", tierColor:"#71b9ef", levels:1, chromas:[{id:"28fdbafd-4c12-be54-a3ab-5eaae7a1979a",label:"默认",rp:0}]},
];

const weapons = ["标配","狂徒","幻影","冥驹","骇灵","正义","雄鹿","近战武器"];
const img = (id:string) => `/demo/${id}.png`;

export function LoadoutDemo() {
  const [selected, setSelected] = useState(skins[0]);
  const [chroma, setChroma] = useState(skins[0].chromas[0]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("推荐");
  const [owned, setOwned] = useState(false);
  const [view, setView] = useState<"builder"|"analysis">("builder");
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => {
    const list = skins.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    if(sort==="价格 ↑") return [...list].sort((a,b)=>a.price-b.price);
    if(sort==="价格 ↓") return [...list].sort((a,b)=>b.price-a.price);
    if(sort==="品质") return [...list].sort((a,b)=>b.levels-a.levels);
    return list;
  },[query,sort]);

  function pickSkin(s:Skin){ setSelected(s); setChroma(s.chromas[0]); }
  function flash(s:string){ setToast(s); window.setTimeout(()=>setToast(""),2400); }

  async function makeCard() {
    const canvas=document.createElement("canvas"); canvas.width=1080; canvas.height=1440;
    const c=canvas.getContext("2d")!;
    const g=c.createLinearGradient(0,0,1080,1440); g.addColorStop(0,"#071923");g.addColorStop(.55,"#0b4051");g.addColorStop(1,"#07151e"); c.fillStyle=g;c.fillRect(0,0,1080,1440);
    c.fillStyle="#ff4655";c.fillRect(0,0,18,1440); c.fillRect(72,108,150,8);
    c.fillStyle="#fff";c.font="700 38px Arial";c.fillText("VALO // LOADOUT",72,82);
    c.font="900 70px Arial";c.fillText(selected.series,72,205); c.font="700 32px Arial";c.fillStyle="#9db1ba";c.fillText("狂徒 · "+chroma.label,76,257);
    const image=new Image(); image.crossOrigin="anonymous"; image.src=img(chroma.id); await image.decode();
    c.drawImage(image,70,360,940,290);
    c.fillStyle="#102d38";c.fillRect(72,730,936,330); c.strokeStyle="#43606a";c.strokeRect(72,730,936,330);
    c.fillStyle=selected.tierColor;c.fillRect(72,730,12,330);
    c.fillStyle="#91a8b1";c.font="28px Arial";c.fillText("品质",120,805);c.fillText("皮肤价格",120,900);c.fillText("升级等级",570,805);c.fillText("当前炫彩",570,900);
    c.fillStyle="#fff";c.font="700 42px Arial";c.fillText(selected.tier,120,855);c.fillText(selected.price.toLocaleString()+" VP",120,950);c.fillText(selected.levels+" 级",570,855);c.fillText(chroma.rp+" RP",570,950);
    c.fillStyle="#ff4655";c.fillRect(72,1140,936,112);c.fillStyle="#fff";c.font="800 35px Arial";c.fillText("我的无畏契约装备分析",132,1208);
    c.font="24px Arial";c.fillStyle="#78919b";c.fillText("由 VALO LOADOUT 生成 · DEMO",72,1340);
    return await new Promise<Blob>((resolve)=>canvas.toBlob(b=>resolve(b!),"image/png"));
  }

  async function exportCard(platform?:string) {
    const blob=await makeCard(); const file=new File([blob],"valo-loadout.png",{type:"image/png"});
    if(platform && navigator.share && navigator.canShare?.({files:[file]})){
      await navigator.share({title:"我的无畏契约装备",text:`${selected.name} · ${selected.tier}`,files:[file]}); return;
    }
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="valo-loadout-analysis.png";a.click();URL.revokeObjectURL(a.href);
    flash(platform ? `分析图已下载，请在${platform}中发布` : "分析图已导出");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <button className="brand" onClick={()=>setView("builder")}><span>V</span> VALO LOADOUT <em>DEMO</em></button>
        <nav><button className="active">装备构建</button><button onClick={()=>setView("analysis")}>分析图</button><button>数据图鉴</button></nav>
        <div className="top-actions"><span>1,092 VP</span><button onClick={()=>setView("analysis")} className="export-small">↗ 导出</button></div>
      </header>

      {view==="builder" ? <div className="workspace">
        <aside className="weapon-rail">
          <p>武器</p>{weapons.map((w,i)=><button key={w} className={i===1?"chosen":""}><span>{["◈","⌁","⌁","⌁","⌁","⌁","⌁","╱"][i]}</span>{w}</button>)}
        </aside>
        <section className="catalog">
          <div className="mobile-title"><span>步枪 /</span><strong>狂徒</strong></div>
          <div className="catalog-head"><label>⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索皮肤"/></label><select value={sort} onChange={e=>setSort(e.target.value)}><option>推荐</option><option>价格 ↑</option><option>价格 ↓</option><option>品质</option></select></div>
          <div className="skin-list">
            {filtered.map(s=><button key={s.id} className={`skin-card ${selected.id===s.id?"selected":""}`} onClick={()=>pickSkin(s)} style={{"--tier":s.tierColor} as React.CSSProperties}>
              <span className="rarity">{s.tier}</span><img src={img(s.chromas[0].id)} alt=""/><strong>{s.series}</strong><small>◆ {s.price.toLocaleString()}</small>
            </button>)}
          </div>
        </section>
        <section className="preview">
          <div className="crumb">收藏 &nbsp;/&nbsp; 步枪 &nbsp;/&nbsp; 狂徒</div>
          <div className="skin-meta"><span style={{color:selected.tierColor}}>{selected.tier} // {selected.levels} LEVELS</span><h1>{selected.series}</h1><p>狂徒 · {chroma.label}</p></div>
          <div className="hero-gun"><div className="halo"/><img key={chroma.id} src={img(chroma.id)} alt={selected.name}/></div>
          <div className="chroma-panel">
            <div><span>炫彩</span><small>{selected.chromas.length===1?"该皮肤仅有默认外观":`${selected.chromas.length} 种外观可选`}</small></div>
            <div className="swatches">{selected.chromas.map(c=><button key={c.id} className={chroma.id===c.id?"on":""} onClick={()=>setChroma(c)} title={c.label}>{c.swatch?<img src={`/demo/${c.id}_swatch.png`} alt={c.label}/>:<img src={img(c.id)} alt={c.label}/>}<i>{c.rp?`${c.rp}`:"✓"}</i></button>)}</div>
          </div>
          <div className="purchase">
            <button className="favorite" onClick={()=>setOwned(!owned)}>{owned?"★":"☆"}</button>
            <div><small>皮肤价值</small><strong>◆ {selected.price.toLocaleString()} VP</strong></div>
            <button className={owned?"equip equipped":"equip"} onClick={()=>{setOwned(!owned);flash(owned?"已取消装备":"已装备至狂徒")}}>{owned?"已装备":"装备皮肤"}</button>
          </div>
        </section>
      </div> : <section className="analysis-page">
        <div className="analysis-copy"><span className="eyebrow">SHARE YOUR BUILD</span><h1>把你的装备，<br/>做成一张好看的分析图。</h1><p>自动整理品质、VP 价格、升级等级和当前炫彩。手机端支持调用系统分享面板，桌面端会下载高清图片。</p>
          <button className="export-main" onClick={()=>exportCard()}>↓ 一键导出分析图</button>
          <div className="platforms"><span>快捷分享</span>{["微信","QQ","哔哩哔哩","抖音","小红书"].map(p=><button key={p} onClick={()=>exportCard(p)}>{p.slice(0,2)}</button>)}</div>
          <small className="share-note">社交平台不开放统一网页直发接口；移动端将使用系统分享，其他情况自动下载图片。</small>
        </div>
        <div className="poster">
          <div className="poster-brand">VALO // LOADOUT</div><span className="poster-line"/><h2>{selected.series}</h2><p>狂徒 · {chroma.label}</p><img src={img(chroma.id)} alt=""/>
          <div className="poster-stats"><div><small>品质</small><strong style={{color:selected.tierColor}}>{selected.tier}</strong></div><div><small>皮肤价格</small><strong>{selected.price.toLocaleString()} VP</strong></div><div><small>升级等级</small><strong>{selected.levels} 级</strong></div><div><small>当前炫彩</small><strong>{chroma.rp} RP</strong></div></div>
          <b>我的无畏契约装备分析</b>
        </div>
      </section>}
      <footer><span>数据版本 2026.07.28</span><span>当前为功能演示 · 非 Riot Games 官方产品</span></footer>
      {toast&&<div className="toast">{toast}</div>}
    </main>
  );
}
