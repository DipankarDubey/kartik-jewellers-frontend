import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1365,height:860}});
const products=[
 {_id:'0123456789abcdef01234561',name:'Royal Gold Necklace',metal:'Gold',category:'Necklaces',price:125000,active:true,featured:true,imageUrl:'https://res.cloudinary.com/qu6byvci/image/upload/v1794605450/royal-gold-necklace.webp'},
 {_id:'0123456789abcdef01234562',name:'Classic Diamond Ring',metal:'Gold',category:'Rings',price:95000,active:true,featured:false,imageUrl:'https://res.cloudinary.com/qu6byvci/image/upload/v1794605498/classic-diamond-ring.webp'}
];
let sentUpload=false;let newProduct=null;let contactSent=false;let verificationRequests=0;
const api='https://kartik-jewellers-api.onrender.com/api';
await page.route(api+'/**',async route=>{
 const req=route.request();const url=new URL(req.url());const path=url.pathname.slice(4);const method=req.method();
 const ok=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(path==='/products' && method==='GET')return ok(products);
 if(path==='/orders/admin/orders')return ok({orders:[],total:0,page:1});
 if(path==='/orders/availability')return ok({paytm:false});
 if(path==='/savings/register' && method==='POST'){
   const body=req.postDataJSON();
   assert.equal(body.password,'RegistrationTest123!');
   return body.email==='existing@example.test' ? ok({verificationRequired:true}) : ok({token:'mock-customer-token'},201);
 }
 if(path==='/savings/password/request' && method==='POST'){
   verificationRequests++;
   assert.equal(req.postDataJSON().password,undefined);
   return ok({message:'Check your email for a verification code.'});
 }
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
 await page.getByRole('link',{name:'Account options'}).click();
 await page.getByRole('heading',{name:'Welcome back',exact:true}).waitFor();
 await page.setViewportSize({width:320,height:740});
 const customerRole = await page.getByRole('link',{name:'Customer',exact:true}).boundingBox();
 const adminRole = await page.getByRole('link',{name:'Admin',exact:true}).boundingBox();
 assert.equal(customerRole.y,adminRole.y,'Roles stay on one row on narrow phones');
 await page.setViewportSize({width:1365,height:860});
 await page.getByLabel('Username',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Forgot password?'}).click();
 await page.getByRole('heading',{name:'Reset password'}).waitFor();
 await page.getByRole('button',{name:'Back to sign in'}).click();
 await page.getByRole('button',{name:'Create account'}).waitFor();
 await page.getByRole('link',{name:'Admin',exact:true}).click();
 await page.waitForURL('**/#/admin/login');
 await page.getByLabel('Admin username').waitFor();
 await page.getByRole('link',{name:'Customer',exact:true}).click();
 await page.getByLabel('Username',{exact:true}).waitFor();
 await page.getByRole('link',{name:'Back to home'}).click();
 console.log('PASS: shared sign-in, role switching, and password reset entry');
 await page.getByRole('link',{name:'Collections',exact:true}).first().click();
 await page.getByRole('heading',{name:'Gold Collections'}).waitFor();
 await page.getByRole('radio',{name:'Rings',exact:true}).check();
 await page.getByText('Classic Diamond Ring').waitFor();
 assert.equal(await page.getByText('Royal Gold Necklace').count(),0);
 console.log('PASS: collection category filter');
 await page.getByRole('heading',{name:'Classic Diamond Ring'}).click();
 await page.getByRole('link',{name:'Add to bag'}).click();
 await page.getByRole('heading',{name:'Your shopping bag'}).waitFor();
 await page.getByRole('combobox',{name:'Quantity'}).selectOption('2');
 await page.getByRole('link',{name:'Sign in to checkout'}).click();
 await page.getByRole('heading',{name:'Welcome back'}).waitFor();
 assert.match(page.url(), /next=cart/);
 await page.getByRole('button',{name:'Create account',exact:true}).click();
 await page.getByLabel('Name',{exact:true}).fill('Test Customer');
 await page.getByLabel('Mobile number',{exact:true}).fill('9876543210');
 await page.getByLabel('Email',{exact:true}).fill('existing@example.test');
 await page.getByLabel('Password',{exact:true}).fill('RegistrationTest123!');
 await page.getByRole('button',{name:'Create account',exact:true}).click();
 await page.getByRole('button',{name:'Email me a verification code'}).waitFor();
 assert.equal(verificationRequests,0);
 await page.getByRole('button',{name:'Email me a verification code'}).click();
 await page.getByLabel('Email verification code',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('Password',{exact:true}).inputValue(),'RegistrationTest123!');
 await page.getByRole('button',{name:'Edit contact details',exact:true}).click();
 await page.getByLabel('Email',{exact:true}).fill('tester@example.test');
 await page.getByRole('button',{name:'Create account',exact:true}).click();
 await page.getByRole('heading',{name:'Your shopping bag'}).waitFor();
 assert.equal(await page.evaluate(() => sessionStorage.getItem('kj_customer_session')),'mock-customer-token');
 await page.evaluate(() => sessionStorage.removeItem('kj_customer_session'));
 assert.equal(verificationRequests,1);
 console.log('PASS: new customers sign in without verification and older accounts only request a code when asked');
 await page.getByRole('link',{name:'Shopping bag: 2 items'}).click();
 await page.getByRole('heading',{name:'Your shopping bag'}).waitFor();
 assert.equal(await page.getByRole('combobox',{name:'Quantity'}).inputValue(),'2');
 console.log('PASS: shopping bag quantity and customer checkout sign-in');
 await page.goto(base+'/#/contact');
 await page.getByPlaceholder('Your full name').fill('Test Customer');
 await page.getByPlaceholder('you@example.com').fill('tester@example.test');
 await page.locator('textarea').last().fill('Product enquiry for test');
 await page.locator('form').last().getByRole('button',{name:/send/i}).click();
 await page.getByText('Message received').waitFor();assert.equal(contactSent,true);
 console.log('PASS: contact form submits via UI (mock API)');
 await page.goto(base+'/#/admin/login');
 await page.getByLabel('Admin username').fill('test-admin');
 await page.getByLabel('Password',{exact:true}).fill('TestOnlyPassword123!');
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.getByRole('link',{name:'Orders & Offers',exact:true}).click();
 await page.getByRole('heading',{name:'Orders and offers',exact:true}).waitFor();
 await page.getByText('No orders found.').waitFor();
 console.log('PASS: browser admin login (mock token)');
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

