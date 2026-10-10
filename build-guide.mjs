import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {days,lodgings,sources} from './guide-data.mjs';

const stamps=JSON.parse(readFileSync(new URL('./dist/stamps.json',import.meta.url)));
const facilities=JSON.parse(readFileSync(new URL('./dist/amenities.json',import.meta.url)));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=value=>{assert.equal(new URL(value).protocol,'https:');return escape(value);};
const sourceLinks=ids=>ids.map(id=>{assert.ok(sources[id],`Unknown source ${id}`);return `<a href="${url(sources[id][1])}" target="_blank" rel="noopener">${escape(sources[id][0])}</a>`;}).join('');
assert.deepEqual(days.flatMap(d=>d.stamps).sort((a,b)=>a-b),stamps.map(s=>s.id),'Each of the 41 stamps must be assigned exactly once');
assert.deepEqual(days.map(d=>d.id),[0,1,2,3,4,5]);
assert.equal(days.filter(d=>d.id>0 && d.overnight!==false).length,4);
const stampLinks=day=>day.stamps.map(id=>{const s=stamps.find(s=>s.id===id);return `<a class="guide-stamp" href="./map.html?stamp=${id}&day=${day.id}"><span>${String(id).padStart(2,'0')}</span><span lang="ja">${escape(s.name)}</span></a>`;}).join('');
const lodgingList=day=>day.lodging.map(id=>{const l=lodgings[id];assert.ok(l,`Unknown lodging ${id}`);return `<li><a href="${url(l.url)}" target="_blank" rel="noopener">${escape(l.name)}</a><p>${escape(l.note)}</p></li>`;}).join('');
for(const day of days) if(day.facility) assert.ok(facilities.some(f=>f.id===day.facility));

const html=`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#153f35">
  <meta name="description" content="熊野古道中边路5天4晚41章集章规划：徒步结合公交与预约车辆，Day 0另列，每日路线、住宿候选、饮水补给及定位地图。接驳与章点访问须事前确认。">
  <title>熊野古道 · 5天4晚41章攻略</title>
  <link rel="stylesheet" href="./style.css">
  <link rel="stylesheet" href="./guide.css">
  <script src="./guide.js" defer></script>
</head>
<body class="guide-page">
  <a class="skip-link" href="#guide-overview">跳到行程</a>
  <header class="topbar">
    <div class="identity"><span class="seal" aria-hidden="true">熊<br>野</span><div><h1>熊野古道</h1><p>中边路 <span>·</span> 41 章</p></div></div>
    <nav class="primary-nav" aria-label="网站主导航"><a href="./" aria-current="page">徒步攻略</a><a href="./map.html">地图与定位</a></nav>
  </header>
  <main class="guide-main">
    <section class="guide-intro" aria-labelledby="guide-title">
      <div><h2 id="guide-title">中边路 41 章<br>5 天 4 晚集章攻略</h2><p class="guide-lead">山路认真走，分散的章点用交通衔接。西部支线、本宫、两段雲取、那智与新宫，按五天安排每天的章、住宿和补给。</p><p class="guide-byline">紧凑规划 · 公交优先，必要时提前预约车辆<br>接驳确认后适用 · 方案更新：2026 年 10 月 10 日</p><a class="guide-primary" href="#guide-overview">查看五天安排</a></div>
      <aside class="trip-note" aria-label="天数与适用范围"><h3>5 天 4 晚，怎么算</h3><p><strong>当地 Day 1–5 · 4 晚住宿</strong><br>Day 5 完成后从新宫离开。</p><p>另加 <strong>Day 0 一晚</strong>田边抵达住宿，整趟共 <strong>5 晚住宿</strong>。不把抵达日塞进五天，也不默认多留一个收尾夜。</p><p>Day 1、2、4 为长日。保留全部 41 章，允许乘车替代部分徒步；这是一套需要接驳配套的紧凑规划。</p><a href="#before-booking">先看五天成立的条件</a></aside>
    </section>

    <section id="before-booking" class="guide-section booking-note" aria-labelledby="booking-title"><h2 id="booking-title">先把接驳确认，再订四晚住宿</h2><ol><li><strong>Day 1 的西部车辆方案尚待确认。</strong>潮见峠的合法下车点、北郡越接近用时及整段车程必须由当地车方确认。若不能及时送达高原，本日不能直接照走；公交不是等价替代。</li><li><strong>Day 3 的第 24 章与往返车。</strong>小雲取之后往返川舟中心，要先确认章箱访问窗口和司机。停航日、冬季能否只盖章，公开资料未给出可靠保证。</li><li><strong>长日与两处关键住宿。</strong>优先落实小口（第 3 晚）、那智山（第 4 晚）。按实际步速、日照、入住截止核算 Day 1、2、4；不把五天版称为适合所有人的轻松路线。</li></ol><p class="guide-small"><strong>当前状态：41 章已分配，整程接驳尚未验证。</strong>五天是规划目标，不是已确认可预订的旅行套餐。以上条件未解决时，应改期或加天；不能靠漏章、代盖或夜行把目标凑齐。${sourceLinks(['taxi','doyukawa','ogumotori','boat'])}</p></section>

    <section id="guide-overview" class="guide-section" aria-labelledby="overview-title"><div class="guide-section-heading"><h2 id="overview-title">一路怎么走、怎么住</h2><a href="./map.html">在地图看全线</a></div><p>章点编号来自官方押印图，行走顺序按地形与住宿编排。第 3 章是独立支线，山地东段从 41 向 37 走。</p>
      <div class="itinerary-table"><div class="itinerary-head"><span>日期</span><span>当天路线</span><span>步行参考</span><span>当晚住宿</span></div>
      ${days.map(d=>`<a class="itinerary-row" href="#day-${d.id}"><span class="itinerary-day">Day ${d.id}</span><span class="itinerary-route">${escape(d.route)}<small>${d.id===0?'抵达准备 · 不计入当地集章天数':`安排 ${d.stamps.length} 枚章 · ${d.stamps.map(id=>String(id).padStart(2,'0')).join(' / ')}`}</small></span><span class="itinerary-time">${escape(d.time)}${d.long?'<strong class="long-day">长日</strong>':''}</span><span class="itinerary-stay${d.overnight===false?' no-overnight':''}">${escape(d.area)}</span></a>`).join('')}
      </div><p class="guide-small">→ 表示步行顺序，⇢／⇄ 表示乘车接驳；西部多点访问详见 Day 1。覆盖校验：41 / 41 枚已分配到五天，不等于已验证所有交通衔接或已完成集章。${sourceLinks(['stamps','stampMap'])}</p>
    </section>

    <div class="day-picker"><label for="day-select">查看哪一天</label><select id="day-select"><option value="">选择每日详情</option>${days.map(d=>`<option value="${d.id}">Day ${d.id} · ${escape(d.area)}${d.long?' · 长日':''}</option>`).join('')}</select><a href="#guide-overview">回到总览</a></div>
    <section class="daily-guide" aria-label="每日行程详情">${days.map(d=>`
      <details class="guide-day" id="day-${d.id}"${d.id===0?' open':''}>
        <summary><span class="day-number">Day ${d.id}</span><span class="day-summary"><strong>${escape(d.title)}</strong><small>${escape(d.distance)} · ${escape(d.time)}</small></span>${d.long?'<span class="long-day">长日</span>':''}<span class="disclosure-mark" aria-hidden="true"></span></summary>
        <div class="day-content"><p class="day-intro">${escape(d.intro)}</p><div class="day-facts"><span>${escape(d.grade)}</span><span>${d.overnight===false?'结束：':'住：'}${escape(d.area)}</span></div>
          ${d.stamps.length?`<section><h3>当天的章 · 点开看地图</h3><div class="guide-stamps">${stampLinks(d)}</div></section>`:''}
          <section><h3>今天怎么走</h3><p>${escape(d.walk)}</p><ol class="day-schedule">${d.schedule.map(([t,v])=>`<li><strong>${escape(t)}</strong><span>${escape(v)}</span></li>`).join('')}</ol><p class="guide-small">以上为规划时段，均使用日本当地时间。以天亮后起步、天黑前到住宿为约束；不是车次或开放时间。</p></section>
          <section><h3>公交与衔接</h3><p>${escape(d.transit)}</p></section>
          <section><h3>哪里休息、喝水、补给</h3><dl class="supply-notes">${d.supplies.map(([name,value])=>`<div><dt>${escape(name)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>${d.facility?`<a class="inline-map-link" href="./map.html?facility=${encodeURIComponent(d.facility)}&day=${d.id}">地图查看当天饮水服务点</a>`:d.stamps.length?`<a class="inline-map-link" href="./map.html?stamp=${d.amenityCenter}&facilities=1&day=${d.id}">查看${escape(stamps.find(s=>s.id===d.amenityCenter).name)}附近设施</a>`:''}</section>
          <section><h3>${d.overnight===false?'当天离开与加住备选':'今晚住哪里'}</h3><p><strong>${escape(d.area)}</strong></p>${d.overnight===false?'<p>四晚方案不包含今晚住宿。以下仅为无法当天离开时的加住候选，增加一晚需另计。</p>':''}<ul class="lodging-list">${lodgingList(d)}</ul><p class="guide-small">以上是具体候选与来源／官网入口，不代表实时有房。餐食、便当、接送和入住截止，以预订确认单为准。可通过<a href="https://www.kumano-travel.com/" target="_blank" rel="noopener">熊野旅游预约平台</a>或旅宿官网查询。</p><p><strong>${d.overnight===false?'若无法当天离开：':'订不到房时：'}</strong>${escape(d.fallback)}</p></section>
          <section class="day-check"><h3>出发前这一项要核对</h3><p>${escape(d.check)}</p></section>
          <details class="day-sources"><summary>本日依据与官方资料</summary><div class="source-links">${sourceLinks(d.sources)}</div><p class="guide-small">编排、建议时段和替代方案为本站推算；官方距离与时间保留原端点或明确标为合计、反向估算。</p></details>
        </div>
      </details>`).join('')}
    </section>

    <section class="guide-section practical" id="practical"><h2>把补给与预订做在出发前</h2><div class="practical-columns"><div><h3>水源有三种，不要混用</h3><p><strong>旅宿／设施服务：</strong>向工作人员询问能否补水，是否收费、限营业时间。<strong>购买饮料：</strong>商店与自动售货机要考虑休息日、库存。<strong>天然水源：</strong>官方说明沿途自然水源未经检测，本攻略不承诺直饮。</p><p>每天离开住宿前带足到下一个<strong>已确认供应点</strong>的饮水，按天气、负重、个人消耗调整；山中几天按全日自备安排。茶屋跡只是遗址。</p>${sourceLinks(['tips'])}</div><div><h3>先订最难替代的夜晚</h3><p>先确认预约车能覆盖 Day 1、3 的接驳，再订四晚：野中 → 汤峰 → 小口 → 那智山。小口与那智山最难替代，优先锁定；Day 0 田边另订，Day 5 不默认住宿。问清两餐、便当、早出发和入住截止。</p><p>地图收录厕所、饮水与补给，但不是完整清单。设施距离是直线距离，跨河、跨山的“附近”不一定走得到。</p>${sourceLinks(['lodging','bus'])}</div></div></section>
    <section class="guide-section guide-faq"><h2>出发前常见问题</h2><details><summary>五天四晚包含抵达日吗？</summary><p>不包含。当地 Day 1–5 共四晚，Day 0 抵达田边另加一晚，因此通常实际订五晚。Day 5 从新宫离开；若加住新宫，须再加一晚，不能仍称总共只有四晚。</p></details><details><summary>能不能只坐公交、不预约车？</summary><p>没有核实到可照搬的纯公交五天 41 章组合。山中章点仍需步行，Day 1 西部串点、Day 3 川舟中心往返尤其依赖接驳。交通预算有限时，应调整天数，不能漏掉山中章点后声称完成全部 41 章。</p><div class="source-links">${sourceLinks(['taxi','bus'])}</div></details><details><summary>为什么乘车之后仍有长日？</summary><p>车辆主要减少分散地点之间的通勤。高原至近露、道湯川桥至本宫、两段雲取仍有连续山路。Day 2 官方步时 6–9 小时、Day 4 为 7–9 小时，参拜、休息和接驳另算。模板不限季节，但短日照、封路或慢步速可能使五天目标不成立。</p></details><details><summary>集齐后如何办理证明？</summary><p>使用和歌山县中边路 41 章押印帐，按现场章箱盖章。办理方法和受理点以世界遗产中心最新说明为准，与“双朝圣者”的条件不同。若章箱遗失或无法访问，向官方询问处理，不自行认定完成。</p><div class="source-links">${sourceLinks(['stamps'])}</div></details><details><summary>地图是否能导航、离线使用或记录走过的路？</summary><p>地图显示当前位置、精度、章点和参考路线，不提供逐弯导航、离线地图、轨迹记录或个人打卡。底图需要网络，进山前另存官方地图。地图上的全线参考步道不表示五天方案会把每一段都走完。</p></details></section>
    <footer class="guide-footer"><p>方案更新与本轮路线／交通核对：2026-10-10 · 住宿来源核对：2026-10-09 · 设施目录核对：2026-10-03<br>住宿来源不是实时房态；线路、章箱与设施未做现场巡检。请在出发前核对更新。</p><div class="source-links">${sourceLinks(['updates','stampMap','bus'])}</div><a href="./map.html">打开地图与定位</a></footer>
  </main>
</body>
</html>`;
writeFileSync(new URL('./dist/index.html',import.meta.url),html);
console.log(`Built guide: Day 0 + ${days.length-1} local days, ${days.flatMap(d=>d.stamps).length} assigned stamps.`);
