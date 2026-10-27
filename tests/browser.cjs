const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../app/src/main/assets');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript'};
(async()=>{
 const server=http.createServer((req,res)=>{const name=req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0];const target=path.resolve(base,'.'+name);if(!target.startsWith(base+path.sep)){res.writeHead(403).end();return;}fs.readFile(target,(err,bytes)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(target)]||'text/plain'});res.end(err?'missing':bytes);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto(url);await page.locator('#welcome-done').click();
  await page.locator('#search').fill('Chicken Nuggets');assert.match(await page.locator('#results').innerText(),/Chicken Nuggets/);await page.locator('[data-open="nuggets"]').first().click();assert.match(await page.locator('#detail-content').innerText(),/Rezeptur prüfen/);assert.match(await page.locator('#detail-content').innerText(),/Mögliche Zutaten/);await page.locator('#detail-dialog [data-close]').click();
  await page.locator('.bottom-nav a[href="#check"]').click();await page.locator('#ingredient-text').fill('Hähnchenfleisch, Weizenmehl, Pfeffer, Salz. Kann Spuren von Senf enthalten.');await page.locator('#complete-label').check();await page.locator('#analyze').click();assert.match(await page.locator('#check-result').innerText(),/Enthält zu meidende Zutaten/);assert.match(await page.locator('#check-result').innerText(),/Mögliche Spuren/);
  await page.locator('.bottom-nav a[href="#mine"]').click();await page.locator('#add-food').click();await page.locator('#custom-name').fill('Mein Reisprodukt');await page.locator('#custom-group').selectOption('grains');await page.locator('#custom-aliases').fill('Reisliebling');await page.locator('#custom-label').fill('Reis, Wasser, Salz');await page.locator('#food-form button[type="submit"]').click();await page.locator('#observation-status').selectOption('tolerated');await page.locator('#observation-note').fill('Gekocht bisher ohne Beschwerden.');await page.locator('#observation-form button[type="submit"]').click();assert.match(await page.locator('#detail-content').innerText(),/Bisher vertragen/);
  await page.locator('[data-select-prep="raw"]').click();assert.match(await page.locator('#detail-content').innerText(),/Eigener Eintrag – Zutaten prüfen/);assert.equal(await page.locator('#observation-status').inputValue(),'unknown');await page.locator('#favorite').click();await page.locator('#detail-dialog [data-close]').click();
  await page.reload();await page.locator('.bottom-nav a[href="#discover"]').click();await page.locator('#search').fill('Reisliebling');assert.match(await page.locator('#results').innerText(),/Mein Reisprodukt/);
  await page.locator('#search').fill('Pfeffer');await page.locator('[data-open="pfeffer"]').first().click();await page.locator('#observation-status').selectOption('tolerated');await page.locator('#observation-form button[type="submit"]').click();assert.match(await page.locator('#detail-content').innerText(),/Pfeffer ärztlich ausgeschlossen/);await page.locator('#detail-dialog [data-close]').click();
  fs.mkdirSync('test-results',{recursive:true});
  for(const theme of ['light','dark']){
   await page.locator('#open-profile').click();await page.locator('#theme').selectOption(theme);await page.locator('#save-profile').click();await page.locator('#search').fill('');
   for(const width of [320,390,1024]){await page.setViewportSize({width,height:900});const over=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(over,false,'Horizontal overflow '+theme+' '+width);await page.screenshot({path:`test-results/${theme}-${width}.png`,fullPage:true});}
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#search').fill('Sellerie');await page.locator('[data-open="sellerie"]').first().click();await page.screenshot({path:'test-results/detail-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log('UI passed: onboarding, search, dish details, ingredient check, custom entry, per-preparation marking, persistence, medical precedence, responsive light/dark layouts.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
