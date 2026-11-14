import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1365,height:860}});
const products=[
 {_id:'p1',name:'Royal Gold Necklace',metal:'Gold',category:'Necklaces',price:125000,active:true,featured:true,imageUrl:'https://res.cloudinary.com/qu6byvci/image/upload/v1794605450/royal-gold-necklace.webp'},
 {_id:'p2',name:'Classic Diamond Ring',metal:'Gold',category:'Rings',price:95000,active:true,featured:false,imageUrl:'https://res.cloudinary.com/qu6byvci/image/upload/v1794605498/classic-diamond-ring.webp'}
];
let sentUpload=false;let newProduct=null;let contactSent=false;
const api='https://kartik-jewellers-api.onrender.com/api';
await page.route(api+'/**',async route=>{
 const req=route.request();const url=new URL(req.url());const path=url.pathname.slice(4);const method=req.method();
 const ok=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(path==='/products' && method==='GET')return ok(products);
 if(path==='/store')return ok({name:'Karthik Jewellers',address:'Test location',email:'hello@example.test',phone:'0123456789',mapsUrl:'https://maps.google.com'});
 if(path==='/admin/login' && method==='POST'){const body=req.postDataJSON();return ok(body.username==='test-admin' && body.password==='TestOnlyPassword123!'?{token:'mock-admin-token'}:{error:'Incorrect login'},body.username==='test-admin' && body.password==='TestOnlyPassword123!'?200:401)}
 if(path==='/admin/stats')return ok({products:products.length,customers:0,subscribers:0});
 if(path==='/admin/products' && method==='GET')return ok(products);
 if(path==='/admin/upload' && method==='POST'){
   assert.match(req.headers()['content-type'],/multipart\/form-data/);
   const body=req.postDataBuffer();assert.ok(body.includes(Buffer.from('image/png')));
   assert.ok(body.includes(Buffer.from('e2e-ring.png')));
   sentUpload=true;return ok({imageUrl:'https://res.cloudinary.com/example/image/upload/mock-ring.png'});
 }
 if(path==='/admin/products' && method==='POST'){const v=req.postDataJSON();newProduct={...v,_id:'e2e1'};products.push(newProduct);return ok(newProduct,201)}
 if(path==='/admin/customers' && method==='GET')return ok([]);
 if(path==='/contact' && method==='POST'){contactSent=true;return ok({message:'Message received'})}
 if(path==='/admin/campaigns/send')return ok({sent:0});
 return ok({error:'Test mock missing: '+path},404);
});
const base='http://127.0.0.1:5173';
try{
 await page.goto(base+'/#/');
 await page.getByRole('link',{name:/Admin Login/i}).waitFor({state:'visible'});
 console.log('PASS: visible admin login link');
 await page.getByRole('link',{name:'Collections',exact:true}).first().click();
 await page.getByRole('heading',{name:'Gold Collections'}).waitFor();
 await page.getByRole('radio',{name:'Rings',exact:true}).check();
 await page.getByText('Classic Diamond Ring').waitFor();
 assert.equal(await page.getByText('Royal Gold Necklace').count(),0);
 console.log('PASS: collection category filter');
 await page.goto(base+'/#/contact');
 await page.getByPlaceholder('Your full name').fill('Test Customer');
 await page.getByPlaceholder('you@example.com').fill('tester@example.test');
 await page.locator('textarea').last().fill('Product enquiry for test');
 await page.locator('form').last().getByRole('button',{name:/send/i}).click();
 await page.getByText('Message received').waitFor();assert.equal(contactSent,true);
 console.log('PASS: contact form submits via UI (mock API)');
 await page.goto(base+'/#/admin/login');
 await page.getByLabel('Admin username').fill('test-admin');
 await page.getByLabel('Password').fill('TestOnlyPassword123!');
 await page.getByRole('button',{name:/Sign in securely/i}).click();
 // The sidebar caption is intentionally hidden by the storefront's design CSS.
 // Assert the authenticated admin page and visible navigation instead.
 await page.getByRole('heading',{name:/Welcome Back, Admin/i}).waitFor({state:'visible'});
 await page.getByRole('link',{name:'Jewellery Products'}).waitFor({state:'visible'});
 assert.equal(new URL(page.url()).hash,'#/admin');
 console.log('PASS: browser admin login and visible dashboard (mock token)');
 await page.goto(base+'/#/admin/products');
 await page.getByRole('heading',{name:'Manage jewellery'}).waitFor();
 await page.getByRole('button',{name:'Add product'}).click();
 const modal=page.getByRole('dialog',{name:'Jewellery product form'});
 await modal.getByLabel('Product name').fill('E2E Uploaded Ring');
 await modal.getByLabel('Price (₹)').fill('12345');
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9kPxoAAAAASUVORK5CYII=','base64');
 await modal.locator('input[type=file]').setInputFiles({name:'e2e-ring.png',mimeType:'image/png',buffer:png});
 await modal.locator('img.image-preview').waitFor({state:'visible'});
 assert.equal(sentUpload,true);
 assert.match(await modal.locator('img.image-preview').getAttribute('src'),/cloudinary/);
 console.log('PASS: actual file picker interaction and multipart upload (mock backend)');
 await modal.getByRole('button',{name:'Add product'}).click();
 await page.getByText('E2E Uploaded Ring').waitFor();
 assert.equal(newProduct.imageUrl,'https://res.cloudinary.com/example/image/upload/mock-ring.png');
 console.log('PASS: save product with uploaded image (mock backend)');
}finally{await browser.close()}
