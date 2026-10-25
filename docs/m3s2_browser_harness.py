"""Offline-only browser UI harness; no real Clocked calls. Does not claim live model result."""
import json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'public/index.html').read_text().replace('<script type="module" src="/app.js"></script>','').replace('<link rel="stylesheet" href="/styles.css" />','<style>'+ (root/'public/styles.css').read_text()+'</style>')
scripts=[]
for src in ['src/engine.mjs','src/timeline.mjs','src/semantic-source.mjs','public/app.js']:
 s=(root/src).read_text();s=re.sub(r'^import [^\n]+;\s*\n','',s,flags=re.M);s=re.sub(r'\bexport\s+(?=(?:const|function|class))','',s);scripts.append(s)
fixtures={p.stem:json.loads(p.read_text()) for p in (root/'fixtures').glob('*.json')}
fmap={'/fixtures/F01':fixtures['R7_F01_RECORDED'],'/fixtures/F02':fixtures['R7_F02_RECORDED'],'/fixtures/F03':fixtures['R7_F03_RECORDED'],'/fixtures/M3':fixtures['M3_SEMANTIC_PAIRS']}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html)
 page.evaluate('window.__fixtures='+json.dumps(fmap,ensure_ascii=False))
 page.evaluate("(()=>{window.fetch=async url=>{const x=window.__fixtures[String(url)];if(String(url)==='/api/health')return {ok:true,json:async()=>({liveEnabled:false})};if(x)return {ok:true,json:async()=>x};throw Error('Unexpected network route '+url);};})()")
 page.evaluate('\n'.join(scripts))
 page.get_by_role('button',name='Semantic lens').click()
 page.get_by_role('button',name='SIGNED CONTRAST / M3B').click()
 assert page.get_by_text('No semantic insight yet').count()==1
 assert page.get_by_role('button',name='ANALYZE ALL',exact=False).count()==1
 assert page.locator('#run-sweep').is_disabled()
 assert page.locator('.semantic-choice').count()==4
 assert page.locator('.semantic-choice.selected').count()==1
 assert not errors,errors
 page.screenshot(path=str(root/'docs/M3S2_OFFLINE_BROWSER_HARNESS_NO_MODEL_RESULT.png'),full_page=True)
 print('M3S2_LOCAL_BROWSER_HARNESS=PASS | LIVE_REQUESTS=ZERO | CLAUSES=4 | SWEEP_DISABLED_OFFLINE=YES')
 b.close()
