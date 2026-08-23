/**
 * 静止ヒーローの門が、正しい方だけを隠しているかを測る。
 * 本番でログイン後のトップが真っ黒になった事故の再発防止。
 */
import { chromium } from 'playwright'
const BASE='http://localhost:3000'
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']})
let bad=0
const CASES=[
  {name:'PC・通常',           opt:{viewport:{width:1440,height:900}},                                   scrub:true,  gate:false},
  {name:'スマホ縦',           opt:{viewport:{width:390,height:844},isMobile:true,hasTouch:true},         scrub:true,  gate:false},
  {name:'動きが苦手な設定',   opt:{viewport:{width:1440,height:900},reducedMotion:'reduce'},             scrub:false, gate:true},
  {name:'寝かせたスマホ',     opt:{viewport:{width:844,height:390},isMobile:true,hasTouch:true},         scrub:false, gate:true},
]
for(const c of CASES){
  const ctx=await b.newContext(c.opt)
  await ctx.addCookies([{name:'age_ok',value:'1',url:BASE}])
  const p=await ctx.newPage()
  await p.goto(BASE+'/',{waitUntil:'networkidle'}); await p.waitForTimeout(900)
  const r=await p.evaluate(()=>{
    const g=document.querySelector('.still-gate'), s=document.querySelector('.scrub')
    // 単体ヒーロー（ログイン後に出る形）を、その場で作って表示されるか見る
    const probe=document.createElement('section'); probe.className='still'; probe.textContent='probe'
    document.querySelector('main').prepend(probe)
    const solo=getComputedStyle(probe).display
    probe.remove()
    return {gate:g?getComputedStyle(g).display:'なし', scrub:s?getComputedStyle(s).display:'なし', solo}
  })
  const okScrub = c.scrub ? r.scrub==='block' : (r.scrub==='none'||r.scrub==='なし')
  const okGate  = c.gate  ? r.gate==='grid'   : r.gate==='none'
  const okSolo  = r.solo==='grid'   // 単体は必ず出ること
  if(!okScrub||!okGate||!okSolo) bad++
  console.log(`${okScrub&&okGate&&okSolo?'OK ':'NG '} ${c.name.padEnd(18)} scrub=${r.scrub} 控え=${r.gate} 単体=${r.solo}`)
  await ctx.close()
}
console.log(bad?('不合格 '+bad):'\n全部通った（単体ヒーローはどの条件でも表示される）')
await b.close()
process.exit(bad?1:0)
