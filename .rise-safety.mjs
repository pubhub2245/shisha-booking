/**
 * 「見せるために JS を必要としていないか」を測る。
 * 本文が JS 頼みで消える事故（ログイン後のトップが真っ黒）の再発防止。
 */
import { chromium } from 'playwright'
const BASE='http://localhost:3000'
const PAGES=['/','/guide','/founders','/national','/flavors']
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']})
let bad=0

// 1) JS を切った状態。全部読めなければならない
{
  const ctx=await b.newContext({viewport:{width:1440,height:900}, javaScriptEnabled:false})
  const p=await ctx.newPage()
  for(const path of PAGES){
    await p.goto(BASE+path,{waitUntil:'domcontentloaded'}).catch(()=>{})
    await p.waitForTimeout(500)
    const hidden=await p.evaluate(()=>{
      let n=0
      document.querySelectorAll('[data-rise]').forEach(e=>{
        for(const c of e.children) if(+getComputedStyle(c).opacity < 0.5) n++
      })
      return n
    })
    if(hidden) bad++
    console.log(`${hidden?'NG ':'OK '} JSなし ${path.padEnd(12)} 透明のまま ${hidden} 個`)
  }
  await ctx.close()
}

// 2) 通常。開いた瞬間に見える範囲は、すぐ読めなければならない
{
  const ctx=await b.newContext({viewport:{width:1440,height:900}})
  await ctx.addCookies([{name:'age_ok',value:'1',url:BASE}])
  const p=await ctx.newPage()
  for(const path of PAGES){
    await p.goto(BASE+path,{waitUntil:'networkidle'}).catch(()=>{})
    await p.waitForTimeout(1200)
    const r=await p.evaluate(()=>{
      let hiddenInView=0
      document.querySelectorAll('[data-rise]').forEach(e=>{
        if(e.getBoundingClientRect().top >= innerHeight) return   // 画面の外は対象外
        for(const c of e.children) if(+getComputedStyle(c).opacity < 0.5) hiddenInView++
      })
      return hiddenInView
    })
    if(r) bad++
    console.log(`${r?'NG ':'OK '} 通常   ${path.padEnd(12)} 画面内で透明 ${r} 個`)
  }
  await ctx.close()
}
console.log(bad?('\n不合格 '+bad):'\n全部通った（本文は JS 無しでも読める）')
await b.close()
process.exit(bad?1:0)
