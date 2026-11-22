import React,{useEffect,useState,useMemo} from 'react';
import {Link,NavLink,useLocation,useParams} from 'react-router-dom';
import {ArrowRight,ArrowLeft,Heart,Search,Menu,X,MapPin,Phone,Mail,Instagram,ShieldCheck,Gift,Truck,Gem,Star,SlidersHorizontal,CheckCircle2,Send,ExternalLink,Clock,Scale,Sparkles,UserRound,ShoppingBag,Plus,Minus} from 'lucide-react';
import './showcase.css';
import './reference.css';
import './faithful.css';
import './store-header.css';
import {ThemePicker} from './theme-picker.jsx';

const money=value=>'₹'+Number(value||0).toLocaleString('en-IN');
const categories=[
 {name:'Necklaces',image:'necklaces'},
 {name:'Earrings',image:'earrings'},
 {name:'Rings',image:'rings'},
 {name:'Bangles',image:'bangles'},
 {name:'Pendants',image:'pendants'},
 {name:'Bridal Sets',image:'bridal'}
];
const metalOf=p=>p.metal==='Silver'?'Silver':'Gold';
const productImage=p=>{
 const url=p?.imageUrl||'/images/jewel-1.webp';
 if(!url.startsWith('https://res.cloudinary.com/')||!url.includes('/image/upload/'))return url;
 return url.replace('/image/upload/','/image/upload/f_auto,q_95,c_limit,w_1400/');
};
const themes = {
  Gold: {headline: 'Wedding Jewellery', accent: 'for Your Special Day'},
  Silver: {headline: 'Exquisite Silver Jewellery', accent: 'for Your Big Day'}
};
const mapsUrl=store=>store?.mapsUrl||'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(store?.address||'Karthik Jewellers');
function Logo({store,small=false}){return <Link to="/" className={'kj-logo kj-faithful-brand'+(small?' kj-logo-small':'')} aria-label="Karthik Jewellers homepage"><img src={store?.logoUrl || '/images/glass-monogram.webp'} alt="Karthik Jewellers — Timeless Elegance"/></Link>}
function FeatureStrip({metal}){const items=[{icon:Gem,heading:metal==='Gold'?'BIS Hallmarked':'925 Sterling Silver',desc:'Purity & confidence'},{icon:ShieldCheck,heading:'Trusted Since Years',desc:'A legacy of trust'},{icon:Gift,heading:'Exquisite Designs',desc:'Traditional & modern'},{icon:Truck,heading:'Personalised Service',desc:'Visit our store'}];return <div className="kj-featurestrip">{items.map(item=><div key={item.heading}><item.icon size={22}/><span><strong>{item.heading}</strong><small>{item.desc}</small></span></div>)}</div>}
export function StorefrontShell({children,metal,onMetalChange,store,wishlistCount=0,cartCount=0,showFooter=true}){
 const[menuOpen,setMenuOpen]=useState(false);
 const location=useLocation();
 useEffect(()=>setMenuOpen(false),[location.pathname]);
 return <div className="kj-site" data-metal={metal}>
  <header className="kj-header kj-metal-header"><div className="kj-container kj-navbar"><Logo store={store}/><nav id="store-navigation" onClick={e=>{if(e.target.closest('a'))setMenuOpen(false)}} className={menuOpen?'kj-nav kj-nav-open':'kj-nav'} aria-label="Customer navigation"><NavLink to="/" end>Home</NavLink><NavLink to="/collections">Collections</NavLink><NavLink to="/about">About Us</NavLink><NavLink to="/contact">Contact Us</NavLink>
    <div className="kj-mobile-extras"><NavLink to="/wishlist">Wishlist</NavLink></div>
  </nav><div className="kj-header-actions"><Link className="kj-icon-link kj-search-nav" to="/collections" aria-label="Browse and search jewellery"><Search size={19}/></Link><Link className="kj-icon-link kj-wishnav" to="/wishlist" aria-label={'Wishlist: '+wishlistCount+' saved pieces'}><Heart size={19}/>{wishlistCount>0&&<span className="kj-bubble">{wishlistCount}</span>}</Link><Link className="kj-icon-link" to="/cart" aria-label={'Shopping bag: '+cartCount+' items'}><ShoppingBag size={19}/>{cartCount>0&&<span className="kj-bubble">{cartCount}</span>}</Link><Link className="kj-icon-link" to="/login" aria-label="Account options" title="Account options"><UserRound size={20}/></Link><ThemePicker metal={metal} onMetalChange={onMetalChange}/><button className="kj-mobile-menu" type="button" onClick={()=>setMenuOpen(v=>!v)} aria-controls="store-navigation" aria-label="Toggle menu" aria-expanded={menuOpen}>{menuOpen?<X/>:<Menu/>}</button></div></div></header>
  <main className="kj-page">{children}</main>
  {showFooter && <footer className="kj-footer"><div className="kj-container kj-footer-grid"><div className="kj-footer-brand"><Logo small store={store}/><p>Timeless elegance, thoughtfully crafted. Discover jewellery to treasure for a lifetime.</p></div><div><h4>Explore</h4><Link to="/">Home</Link><Link to="/collections">All jewellery</Link><Link to="/wishlist">Your wishlist</Link><Link to="/about">Our story</Link></div><div><h4>Customer care</h4><Link to="/contact">Contact us</Link><Link to="/account">My account &amp; savings</Link><Link to="/location">Visit our store</Link><Link to="/orders">My orders</Link></div><div><h4>Visit Karthik Jewellers</h4><p>{store?.address||'Add your showroom address in Admin Settings.'}</p>{store?.phone&&<p>{store.phone}</p>}<a href={mapsUrl(store)} target="_blank" rel="noopener noreferrer">Get directions <ExternalLink size={13}/></a></div></div><div className="kj-container kj-copyright"><span>© {new Date().getFullYear()} Karthik Jewellers. All rights reserved.</span><span>Crafted with care ♡</span></div></footer>}
 </div>
}
export function JewelleryCard({product, wishlist = [], onWishlist, onAddToCart}) {
 const saved = wishlist.includes(String(product._id));
 const detailUrl = '/product/' + product._id;
 return <article className="kj-product-card kj-exact-product">
  <div className="kj-product-visual">
   <Link to={detailUrl}><img loading="lazy" src={productImage(product)} alt={product.name}/></Link>
   {product.featured && <span className="kj-featured-tag">Featured</span>}
   <button type="button" onClick={() => onWishlist(product._id)} className={'kj-heart-btn' + (saved ? ' is-saved' : '')}
    aria-label={(saved ? 'Remove from' : 'Add to') + ' wishlist: ' + product.name}>
    <Heart size={19} fill={saved ? 'currentColor' : 'none'}/>
   </button>
  </div>
  <div className="kj-product-text">
   <span>{metalOf(product)} · {product.category}</span>
   <Link to={detailUrl}><h3>{product.name}</h3></Link>
   <p>{money(product.price)}</p>
   {onAddToCart && product.price > 0
    ? <Link to="/cart" className="kj-btn kj-btn-outline kj-saved-add" onClick={() => onAddToCart(product._id, 1)}><ShoppingBag size={15}/> Add to bag</Link>
    : <Link to={detailUrl} className="kj-product-cta">View details <ArrowRight size={14}/></Link>}
  </div>
 </article>;
}
function BridalHero({metal}) {
 const [active, setActive] = useState(0);
 const theme = themes[metal];
 const tone = metal.toLowerCase();
 const slides = [
  {label: 'Bridal Collection', title: theme.headline, accent: theme.accent, image: `/images/wedding-${tone}.webp`, action: 'Shop Bridal', link: '/collections?category=Other'},
  {label: metal + ' Collection', title: metal + ' Jewellery', image: `/images/glass-${tone}-necklace.webp`, action: 'Shop Jewellery', link: '/collections'},
  {label: 'Our Story', title: 'Timeless Elegance', image: `/images/atelier-${tone}-heritage.webp`, action: 'Discover Our Heritage', link: '/about'}
 ];
 const slide = slides[active];
 return <section className="kj-container kj-hero kj-glass-hero" data-slide={active} aria-label="Featured collections">
  <img className="kj-glass-hero-image" src={slide.image}
   srcSet={active === 0 ? `/images/wedding-${tone}-980.webp 980w, ${slide.image} 1942w` : undefined}
   sizes={active === 0 ? '(max-width: 720px) 180vw, (max-width: 1380px) 100vw, 1350px' : undefined}
   alt="" fetchPriority="high"/>
  <div className="kj-glass-hero-copy">
   <span className="kj-glass-hero-label">{slide.label}</span>
   <h1>{slide.title}{slide.accent && <span>{slide.accent}</span>}</h1>
   <Link className="kj-btn kj-btn-solid" to={slide.link}>{slide.action} <ArrowRight size={17}/></Link>
  </div>
  <div className="kj-glass-hero-dots" role="group" aria-label="Featured banners">
   {slides.map(({label}, index) => <button key={label} type="button" aria-label={label}
    aria-pressed={active === index} onClick={() => setActive(index)}/>)}
  </div>
 </section>;
}

export function HomePage({products,metal,wishlist,onWishlist,store}){const selected=products.filter(p=>metalOf(p)===metal&&p.active!==false);return <>
 <BridalHero metal={metal}/>
 <section className="kj-container kj-reference-trust kj-exact-trust"><FeatureStrip metal={metal}/></section>
 <section className="kj-container kj-showcase-section kj-reference-categories kj-exact-categories"><div className="kj-section-heading"><span className="kj-overline">✦ &nbsp; Explore Our Collections &nbsp; ✦</span><h2>Explore Our {metal} Collections</h2><p>Every design is a celebration of individuality, craftsmanship and heritage.</p></div><div className="kj-category-grid">{categories.map(cat=><Link to={'/collections?category='+encodeURIComponent(cat.name==='Bridal Sets'?'Other':cat.name)} className="kj-category-card" key={cat.name}><div><img loading="lazy" src={'/images/category-'+metal.toLowerCase()+'-'+cat.image+'.webp'} alt={metal+' '+cat.name.toLowerCase()}/></div><strong>{cat.name}</strong><span>Discover <ArrowRight size={13}/></span></Link>)}</div></section>
 <section className="kj-container kj-showcase-section kj-featured-section kj-exact-featured"><div className="kj-section-top"><div><span className="kj-overline">HANDPICKED FOR YOU</span><h2>Our Featured {metal} Designs</h2><p>Thoughtfully selected pieces to make every occasion unforgettable.</p></div><Link className="kj-text-link" to="/collections">View All Designs <ArrowRight size={17}/></Link></div>{selected.length?<div className="kj-product-grid">{selected.slice(0,4).map(p=><JewelleryCard key={p._id} product={p} wishlist={wishlist} onWishlist={onWishlist}/>)}</div>:<div className="kj-empty-collection"><Gem size={36}/><h3>{metal} collection is being curated</h3><p>New designs will appear here as soon as they are added by the showroom.</p><Link to="/contact" className="kj-btn kj-btn-solid">Ask about {metal} jewellery</Link></div>}</section>
 <section className="kj-container kj-editorial-section kj-exact-editorial"><div className="kj-editorial-image"><img loading="lazy" src={'/images/atelier-'+metal.toLowerCase()+'-heritage.webp'} alt={metal+' heritage necklace on velvet'}/></div><div className="kj-editorial-copy"><span className="kj-overline">THE KARTHIK PROMISE</span><h2>Timeless beauty,<br/><em>crafted with care.</em></h2><p>Every piece tells a story. We bring traditional artistry and contemporary elegance together to celebrate your most meaningful moments.</p><Link className="kj-btn kj-btn-solid" to="/about">Our Story <ArrowRight size={17}/></Link></div></section>
 <section className="kj-container kj-visit-banner kj-exact-visit"><div><span className="kj-overline">WE'D LOVE TO MEET YOU</span><h2>Visit our jewellery showroom</h2><p>Discover your favourite designs in person and enjoy personal assistance.</p></div><a href={mapsUrl(store)} target="_blank" rel="noopener noreferrer" className="kj-btn kj-btn-solid"><MapPin size={17}/> Open Google Maps</a></section>
 </>}
export function CatalogPage({products,metal,loading,wishlist,onWishlist}){const q=new URLSearchParams(useLocation().search);const initial=q.get('category');const[category,setCategory]=useState(initial||'All');const[query,setQuery]=useState('');const[sort,setSort]=useState('featured');const[maxPrice,setMaxPrice]=useState('');const[showFilters,setShowFilters]=useState(false);useEffect(()=>{setCategory(initial||'All')},[initial]);const visible=useMemo(()=>{let list=products.filter(p=>metalOf(p)===metal&&p.active!==false&&(category==='All'||p.category===category)&&p.name.toLowerCase().includes(query.toLowerCase()));if(maxPrice)list=list.filter(p=>Number(p.price)<=Number(maxPrice));if(sort==='price-asc')list.sort((a,b)=>a.price-b.price);else if(sort==='price-desc')list.sort((a,b)=>b.price-a.price);else if(sort==='newest')list.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));else list.sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured)));return list},[products,metal,category,query,sort,maxPrice]);return <><section className="kj-page-banner kj-collection-banner kj-exact-banner"><div className="kj-container kj-page-banner-inner"><div><span className="kj-overline">KARTHIK JEWELLERS</span><h1>{metal} Collections</h1><p>Discover our collection of {metal.toLowerCase()} jewellery.</p><button className="kj-btn kj-btn-solid kj-rings-action" type="button" onClick={() => setCategory("Rings")}>Shop Rings <ArrowRight size={15}/></button></div><div className="kj-banner-rings"><img src={metal==='Silver'?'/images/atelier-silver-ring.webp':'/images/atelier-gold-ring.webp'} alt={metal+' jewellery detail'}/></div></div></section><section className="kj-container kj-catalog kj-exact-catalog"><div className="kj-catalog-heading"><p>Home / <strong>{metal} Collections</strong></p><button type="button" className="kj-filter-mobile" onClick={()=>setShowFilters(!showFilters)}><SlidersHorizontal size={18}/> Filters</button><div className="kj-catalog-sort"><label htmlFor="kj-sort">Sort by:</label><select id="kj-sort" value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option></select></div></div><div className="kj-catalog-layout"><aside className={'kj-filter-panel'+(showFilters?' open':'')}><h3>Filter Designs</h3><h4>Category</h4><div className="kj-filter-options">{['All',...categories.map(c=>c.name).filter(c=>c!=='Bridal Sets'),'Other'].filter((v,i,a)=>a.indexOf(v)===i).map(c=><label key={c}><input type="radio" name="category" checked={category===c} onChange={()=>setCategory(c)}/><span>{c==='All'?'All '+metal+' Jewellery':c}</span></label>)}</div><h4>Price Range</h4><div className="kj-filter-options">{[['','All prices'],['10000','Under ₹10,000'],['25000','Under ₹25,000'],['50000','Under ₹50,000'],['100000','Under ₹1,00,000']].map(([value,label])=><label key={label}><input type="radio" name="price" checked={maxPrice===value} onChange={()=>setMaxPrice(value)}/>{label}</label>)}</div><button className="kj-reset" onClick={()=>{setCategory('All');setMaxPrice('');setQuery('')}}>Clear filters</button></aside><div className="kj-catalog-results"><div className="kj-search-row"><label className="kj-search-input"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={'Search '+metal.toLowerCase()+' jewellery...'}/></label><span>{loading?'Loading...':visible.length+' designs found'}</span></div>{loading?<div className="kj-empty-collection">Loading jewellery collection...</div>:visible.length?<div className="kj-product-grid kj-catalog-grid">{visible.map(p=><JewelleryCard product={p} key={p._id} wishlist={wishlist} onWishlist={onWishlist}/>)}</div>:<div className="kj-empty-collection"><Search size={34}/><h3>No matching {metal.toLowerCase()} designs yet</h3><p>Try clearing your filters, or contact us for help finding a design.</p><button className="kj-btn kj-btn-solid" onClick={()=>{setQuery('');setCategory('All');setMaxPrice('')}}>Clear filters</button></div>}</div></div></section></>}
export function DetailPage({products,wishlist,onWishlist,metal,onMetalChange,loading,onAddToCart}){const{id}=useParams();const p=products.find(x=>String(x._id)===id);const[photo,setPhoto]=useState(0);const[quantity,setQuantity]=useState(1);useEffect(()=>{setPhoto(0);setQuantity(1)},[id]);useEffect(()=>{if(p&&metalOf(p)!==metal)onMetalChange(metalOf(p))},[id,p]);if(!p&&loading)return <section className="kj-container kj-missing"><p role="status">Loading design…</p></section>;if(!p)return <section className="kj-container kj-missing"><h1>Jewellery design not found</h1><Link className="kj-btn kj-btn-solid" to="/collections">Back to collections</Link></section>;const saved=wishlist.includes(String(p._id));const photos=[p.imageUrl,...(p.images||[])].filter(Boolean);if(!photos.length)photos.push('/images/jewel-1.webp');const chosen=photos[Math.min(photo,photos.length-1)];return <section className="kj-container kj-detail-page kj-exact-detail"><p className="kj-breadcrumb"><Link to="/">Home</Link> / <Link to="/collections">{metalOf(p)} Collections</Link> / {p.name}</p><div className="kj-detail-grid"><div className="kj-detail-gallery"><div className="kj-detail-thumbnails">{photos.map((url,i)=><button type="button" className={'kj-detail-thumb'+(i===photo?' selected':'')} key={i} onClick={()=>setPhoto(i)} aria-label={'View jewellery image '+(i+1)}><img src={productImage({imageUrl:url})} alt={p.name+' thumbnail '+(i+1)}/></button>)}</div><div className="kj-detail-main-image"><img src={productImage({imageUrl:chosen})} alt={p.name}/></div></div><div className="kj-detail-info"><span className="kj-overline">KARTHIK JEWELLERS COLLECTION</span><h1>{p.name}</h1><div className="kj-detail-meta"><span><Gem size={15}/> {metalOf(p)} Jewellery</span><span>{p.category}</span></div>{p.purity&&<p className="kj-detail-spec"><strong>Purity:</strong> {p.purity}</p>}{p.weight!=null&&<p className="kj-detail-spec"><strong>Weight:</strong> {p.weight} g (approx.)</p>}<p className="kj-detail-price"><small>Price</small> {money(p.price)}</p><p className="kj-detail-desc">{p.description||'A beautifully crafted jewellery design for your special occasions.'}</p>{p.price > 0 && <fieldset className="kj-detail-quantity">
  <legend>Quantity</legend>
  <div>
   <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}><Minus size={16}/></button>
   <output aria-live="polite">{quantity}</output>
   <button type="button" aria-label="Increase quantity" disabled={quantity >= 10} onClick={() => setQuantity(quantity + 1)}><Plus size={16}/></button>
  </div>
 </fieldset>}<div className="kj-detail-controls"><button type="button" className={'kj-wishlist-action'+(saved?' saved':'')} onClick={()=>onWishlist(p._id)}><Heart size={18} fill={saved?'currentColor':'none'}/>{saved?'Saved to Wishlist':'Add to Wishlist'}</button>{p.price>0&&<Link className="kj-btn kj-btn-solid" to="/cart" onClick={() => onAddToCart(p._id, quantity)}><ShoppingBag size={17}/> Add to bag</Link>}<Link className="kj-btn kj-btn-outline" to="/contact" state={{product:p.name}}>Enquire Now <ArrowRight size={17}/></Link></div><p className="kj-fineprint">Check your final price and availability in the bag.</p></div></div><div className="kj-detail-bottom"><div className="kj-detail-description"><h2>Description</h2><p>{p.description||'Contact our showroom for more details about this design.'}</p></div><FeatureStrip metal={metalOf(p)}/></div></section>}
export function AboutPage({metal}){
 const gold = metal === 'Gold';
 return <>
  <section className="kj-container kj-about-grid kj-glass-story">
   <div className="kj-glass-story-copy">
    <span className="kj-overline">Our Story</span>
    <h1>{gold ? 'A Heritage of Trust and Craftsmanship' : 'A Legacy in Silver Artistry'}</h1>
    <p>{gold ? 'Discover gold jewellery that brings traditional Indian artistry to bridal and everyday designs.' : 'Explore silver jewellery that pairs traditional detailing with contemporary designs.'}</p>
    <Link className="kj-btn kj-btn-solid" to="/collections">Explore Designs <ArrowRight size={17}/></Link>
   </div>
   <div className="kj-about-photo"><img src={'/images/atelier-'+metal.toLowerCase()+'-heritage.webp'} alt={metal+' heritage necklace on velvet'}/></div>
  </section>
  <div className="kj-container kj-about-benefits"><FeatureStrip metal={metal}/></div>
 </>;
}
export function ContactPage({store,submitRequest}){const [fields,setFields]=useState({name:'',email:'',phone:'',message:''});const [status,setStatus]=useState('');const[busy,setBusy]=useState(false);const loc=useLocation();useEffect(()=>{if(loc.state?.product)setFields(v=>({...v,message:'I would like to enquire about '+loc.state.product+'.'}))},[loc.state]);async function submit(e){e.preventDefault();setBusy(true);setStatus('');try{const result=await submitRequest('/contact',{method:'POST',body:JSON.stringify(fields)});setStatus(result.message||'Your message was sent.');setFields({name:'',email:'',phone:'',message:''})}catch(error){setStatus(error.message)}finally{setBusy(false)}}return <><section className="kj-page-banner kj-contact-banner kj-exact-contact-banner"><div className="kj-container"><span className="kj-overline">WE'RE HERE FOR YOU</span><h1>Contact Us</h1><p>We'd love to hear from you. Visit us, call us or send us a message.</p></div></section><section className="kj-container kj-contact-layout kj-exact-contact"><div className="kj-contact-form"><h2>Get in Touch</h2><form onSubmit={submit}><label>Full Name <span>*</span><input required maxLength={120} value={fields.name} onChange={e=>setFields({...fields,name:e.target.value})} placeholder="Your full name"/></label><label>Email Address <span>*</span><input required type="email" value={fields.email} onChange={e=>setFields({...fields,email:e.target.value})} placeholder="you@example.com"/></label><label>Phone Number<input type="tel" maxLength={30} value={fields.phone} onChange={e=>setFields({...fields,phone:e.target.value})} placeholder="Your phone number"/></label><label>Message <span>*</span><textarea required minLength={5} rows={5} value={fields.message} onChange={e=>setFields({...fields,message:e.target.value})} placeholder="How can we help?"/></label><button className="kj-btn kj-btn-solid" disabled={busy}>{busy?'Sending...':'Send Message'} <Send size={17}/></button>{status&&<p role="status" className="kj-contact-status">{status}</p>}</form></div><div className="kj-contact-details"><h2>Our Showroom</h2><div className="kj-contact-line"><Phone size={22}/><span><strong>Phone</strong>{store?.phone||'Please contact the showroom'}</span></div><div className="kj-contact-line"><Mail size={22}/><span><strong>Email</strong>{store?.email||'Email not configured yet'}</span></div><div className="kj-contact-line"><MapPin size={22}/><span><strong>Showroom</strong>{store?.address||'Shop address will be updated soon.'}</span></div><a href={mapsUrl(store)} target="_blank" rel="noopener noreferrer" className="kj-btn kj-btn-outline kj-showroom-map">Open Google Maps <ExternalLink size={17}/></a><div className="kj-map-preview"><MapPin size={36}/><span>Come visit our showroom</span><a href={mapsUrl(store)} target="_blank" rel="noopener noreferrer">Get directions <ArrowRight size={15}/></a></div></div></section></>}
export function WishlistPage({products, wishlist, onWishlist, metal, onAddToCart}) {
 const chosen = products.filter(p => wishlist.includes(String(p._id)));
 return <section className="kj-container kj-showcase-section kj-wishlist-page">
  <h1><Heart size={26} aria-hidden="true"/> Wishlist ({chosen.length})</h1>
  {chosen.length ? <div className="kj-product-grid">
   {chosen.map(product => <JewelleryCard key={product._id} product={product} wishlist={wishlist}
    onWishlist={onWishlist} onAddToCart={onAddToCart}/>)}
  </div> : <div className="kj-empty-collection">
   <Heart size={38}/><h2>Your wishlist is empty</h2>
   <p>Discover jewellery and tap the heart to save your favourites.</p>
   <Link to="/collections" className="kj-btn kj-btn-solid">Explore {metal} Designs</Link>
  </div>}
 </section>;
}
