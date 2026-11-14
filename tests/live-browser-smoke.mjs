import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const base='https://kartik-jewellers.onrender.com';
const api='https://kartik-jewellers-api.onrender.com/api';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1366,height:900}});
const errors=[];
const failed=[];
page.on('pageerror',error=>{errors.push(error.message);console.error('BROWSER PAGE ERROR:',error.stack||error.message)});
page.on('console',msg=>{if(msg.type()==='error')console.error('BROWSER CONSOLE ERROR:',msg.text())});
page.on('requestfailed',req=>{failed.push(req.url()+' :: '+req.failure()?.errorText);console.error('REQUEST FAILED:',req.url(),req.failure()?.errorText)});
try{
 const response=await page.goto(base+'/?diagnostic=20261115#/',{waitUntil:'domcontentloaded',timeout:90000});
 console.log('LIVE STATUS:',response.status(),'URL:',page.url());
 await page.waitForTimeout(6500);
 console.log('TITLE:',await page.title());
 console.log('BODY TEXT:',(await page.locator('body').innerText()).slice(0,2400));
 console.log('ROOT CHILDREN:',await page.locator('#root').locator(':scope > *').count());
 console.log('ROOT HTML:',(await page.locator('#root').innerHTML()).slice(0,2200));
 console.log('SCRIPTS:',JSON.stringify(await page.locator('script[src]').evaluateAll(nodes=>nodes.map(n=>({src:n.src})))));
 console.log('PAGE ERRORS:',JSON.stringify(errors));
 console.log('FAILED REQUESTS:',JSON.stringify(failed));
 assert.ok((await page.locator('#root').innerText()).trim().length>120,'Customer storefront did not render meaningful content');
 assert.equal(errors.length,0,'Unexpected frontend JS runtime error');
 await page.getByRole('heading',{name:/Timeless/i}).first().waitFor({timeout:10000});
 await page.getByRole('button',{name:'Silver',exact:true}).first().click();
 await page.getByRole('heading',{name:/Modern/i}).first().waitFor({timeout:10000});
 console.log('PASS: live Gold and Silver storefront rendering');
 await page.goto(base+'/#/collections',{waitUntil:'domcontentloaded',timeout:90000});
 await page.getByRole('heading',{name:/Silver Collections/i}).waitFor({timeout:15000});
 console.log('PASS: live silver collections');
 await page.goto(base+'/#/admin/login',{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('input[type=password]').waitFor({timeout:15000});
 console.log('PASS: live admin login page');
 const result=await page.request.get(api+'/health');
 console.log('API HEALTH:',result.status(),(await result.text()).slice(0,400));
 assert.equal(result.status(),200);
}finally{await browser.close()}
