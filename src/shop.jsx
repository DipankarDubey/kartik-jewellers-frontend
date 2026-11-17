import React, {useEffect, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowRight, Package, ShoppingBag, Truck} from 'lucide-react';
import {customerRequest, Message, money, PageIntro, redirectToPaytm, storedToken} from './savings.jsx';
import './shop.css';

const addressFields = [
  ['name', 'Recipient name', 'shipping name', 120],
  ['phone', 'Mobile number', 'shipping tel', 24],
  ['line1', 'House number and street', 'shipping address-line1', 220],
  ['line2', 'Apartment or landmark (optional)', 'shipping address-line2', 160],
  ['city', 'City', 'shipping address-level2', 100],
  ['state', 'State', 'shipping address-level1', 100],
  ['pin', 'PIN code', 'shipping postal-code', 6]
];
const json = (method, body = {}) => ({method, body: JSON.stringify(body)});
const shopRequest = (api, path, options) => customerRequest(api, path, options, '/orders');
const labels = {pending: 'Payment pending', failed: 'Payment failed', paid: 'Paid', delivered: 'Delivered'};
const stateClass = status => status === 'delivered' ? 'paid' : status;
const dateOf = date => date && new Date(date).toLocaleDateString('en-IN', {timeZone:'Asia/Kolkata'});
const cartKey = 'kj_shop_cart';
const validItem = item => /^[a-f0-9]{24}$/i.test(item?.product || '') &&
  Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 10;

export function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(cartKey));
    return Array.isArray(saved) ? saved.filter(validItem).slice(0, 30) : [];
  } catch {return [];}
}

export function saveCart(items) {
  try {localStorage.setItem(cartKey, JSON.stringify(items));} catch { /* Cart remains in this tab. */ }
}

function Totals({subtotalPaise, discountPaise, amountPaise}) {
  return <dl className="kj-order-totals">
    <div><dt>Subtotal</dt><dd>{money(subtotalPaise)}</dd></div>
    {discountPaise > 0 && <div><dt>Offer discount</dt><dd>−{money(discountPaise)}</dd></div>}
    <div><dt>Total</dt><dd>{money(amountPaise)}</dd></div>
  </dl>;
}

export function CartPage({api, products, loading, cart, updateQuantity, clearCart}) {
  const navigate = useNavigate();
  const [address, setAddress] = useState({});
  const [offer, setOffer] = useState('');
  const [quote, setQuote] = useState(null);
  const [paymentReady, setPaymentReady] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const signedIn = Boolean(storedToken());
  const items = cart.map(line => ({...line, item: products.find(p => String(p._id) === line.product)}));
  const invalid = items.some(({item}) => !item || !Number.isFinite(item.price) || item.price <= 0);
  const estimated = items.reduce((sum, line) => sum + Math.round((line.item?.price || 0) * 100) * line.quantity, 0);
  const cartRevision = JSON.stringify(cart);

  useEffect(() => {
    shopRequest(api, '/availability').then(data => setPaymentReady(data.paytm)).catch(() => setPaymentReady(false));
  }, [api]);

  useEffect(() => {
    if (!signedIn || !cart.length) return;
    let current = true;
    shopRequest(api, '/quote', json('POST', {items: cart})).then(data => {
      if (current) setQuote({revision: cartRevision, data});
    }).catch(err => {if (current && err.status !== 401) setError(err.message);});
    return () => {current = false;};
  }, [api, cartRevision, signedIn]);

  const displayed = quote?.revision === cartRevision ? quote.data : null;
  const report = err => {
    if (err.status === 401) {
      sessionStorage.removeItem('kj_customer_session');
      navigate('/account/login?next=cart');
    } else setError(err.message);
  };
  async function apply(code) {
    setError('');
    setBusy(true);
    try {
      const data = await shopRequest(api, '/quote', json('POST', {items: cart, offerCode: code}));
      setQuote({revision: cartRevision, data});
    } catch (err) {report(err);}
    finally {setBusy(false);}
  }
  async function pay(event) {
    event.preventDefault();
    if (!displayed || busy) return;
    setError('');
    setBusy(true);
    try {
      const result = await shopRequest(api, '/checkout', json('POST', {items: cart, address,
        offerCode: displayed.offerCode, expectedAmountPaise: displayed.amountPaise}));
      redirectToPaytm(result.checkout);
      clearCart();
    } catch (err) {report(err);}
    finally {setBusy(false);}
  }
  return <section className="kj-container sv-page kj-shop">
    <PageIntro eyebrow="Karthik Jewellers" title="Your shopping bag">Review your jewellery and checkout for delivery in India.</PageIntro>
    <Message message={error} type="error"/>
    {!cart.length ? <div className="sv-empty"><p>Your bag is empty.</p><Link className="kj-btn kj-btn-solid" to="/collections">Browse collections</Link></div> :
      <div className="kj-cart-layout">
        <div className="sv-panel sv-card">
          <h2><ShoppingBag size={19} aria-hidden="true"/> Jewellery in your bag</h2>
          {items.map(({product, quantity, item}) => <article className="kj-cart-line" key={product}>
            <img src={item?.imageUrl || item?.images?.[0] || '/images/jewel-1.webp'} alt="" loading="lazy"/>
            <div><Link to={'/product/' + product}>{item?.name || (loading ? 'Loading design…' : 'Unavailable design')}</Link>
              {item && <p>{item.metal || 'Gold'} · {money(Math.round(item.price * 100))} each</p>}
              <label>Quantity <select value={quantity} disabled={busy} onChange={e => {setError('');updateQuantity(product, Number(e.target.value));}}>
                {Array.from({length:10}, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
              </select></label>
            </div>
            <button type="button" className="sv-text-btn" disabled={busy} onClick={() => {setError('');updateQuantity(product, 0);}}>Remove</button>
          </article>)}
          <Link to="/collections">Continue shopping</Link>
        </div>
        <div className="sv-panel sv-form">
          <h2>Order summary</h2>
          <Totals {...(displayed || {subtotalPaise:estimated, discountPaise:0, amountPaise:estimated})}/>
          {!signedIn ? <Link className="kj-btn kj-btn-solid" to="/account/login?next=cart">Sign in to checkout <ArrowRight size={16}/></Link> : <>
            {paymentReady === false && <Message message="Online checkout is currently unavailable."/>}
            <form className="kj-offer-form" onSubmit={e => {e.preventDefault();apply(offer);}}>
              <label>Offer code<input maxLength={24} value={offer} onChange={e => setOffer(e.target.value.toUpperCase())}/></label>
              <button className="kj-btn kj-btn-outline" disabled={busy || invalid || !offer.trim()}>Apply</button>
            </form>
            {displayed?.offerCode && <div className="sv-actions"><span>Applied {displayed.offerCode}</span><button type="button" className="sv-text-btn" disabled={busy} onClick={() => {setOffer('');apply('');}}>Remove offer</button></div>}
            <form className="sv-form" onSubmit={pay}>
              <h3><Truck size={18} aria-hidden="true"/> Delivery address</h3>
              <div className="sv-form-grid">{addressFields.map(([key, title, autocomplete, maxLength]) =>
                <label key={key} className={key.startsWith('line') ? 'kj-address-wide' : undefined}>{title}
                  <input value={address[key] || ''} required={key !== 'line2'} maxLength={maxLength} autoComplete={autocomplete}
                    type={key === 'phone' ? 'tel' : 'text'} inputMode={key === 'pin' ? 'numeric' : undefined} pattern={key === 'pin' ? '[1-9][0-9]{5}' : undefined}
                    onChange={e => setAddress({...address, [key]: e.target.value})}/></label>)}</div>
              <button className="kj-btn kj-btn-solid" disabled={busy || !paymentReady || invalid || !displayed}>Pay {displayed ? money(displayed.amountPaise) : ''} with Paytm <ArrowRight size={16}/></button>
              <Link to="/orders">My orders</Link>
            </form>
          </>}
        </div>
      </div>}
  </section>;
}

function OrderCard({order, admin, children}) {
  return <article className="sv-panel sv-card kj-order-card">
    <div className="sv-actions"><h2>Order <span>{order.orderId}</span></h2>
      <span className={'sv-badge sv-' + stateClass(order.status)}>{labels[order.status]}</span></div>
    <p>{dateOf(order.createdAt)}</p>
    <ul>{order.items.map(item => <li key={item.product}><span>{item.quantity} × {item.name}</span> <strong>{money(item.unitPaise * item.quantity)}</strong></li>)}</ul>
    <Totals {...order}/>
    {order.offerCode && <p>Offer applied {order.offerCode}</p>}
    <div className="kj-order-details">
      <div><h3>Delivery address</h3>
        <address>{order.address.name}<br/>{order.address.line1}{order.address.line2 && <><br/>{order.address.line2}</>}<br/>
          {order.address.city}, {order.address.state} {order.address.pin}<br/>{order.address.phone}</address>
        {admin && <p>{order.email}</p>}</div>
      <div><h3>Payment proof</h3>{order.gatewayTxn
        ? <p>Paytm reference <strong>{order.gatewayTxn}</strong><br/>Verified payment on {dateOf(order.paidAt)}</p>
        : <p>Waiting for a verified Paytm payment.</p>}
        {order.deliveredAt && <p>Delivered on {dateOf(order.deliveredAt)}</p>}
        {admin && order.status === 'delivered' && <p>Delivery email {order.deliveryEmailState || 'pending'}</p>}
      </div>
    </div>
    {children}
  </article>;
}

export function MyOrdersPage({api, restoreCart}) {
  const [params] = useSearchParams();
  const highlighted = params.get('order');
  const navigate = useNavigate();
  const signedIn = Boolean(storedToken());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const report = err => {
    if (err.status === 401) {
      sessionStorage.removeItem('kj_customer_session');
      navigate('/account/login?next=orders', {replace:true});
    } else setError(err.message);
  };
  const load = () => shopRequest(api, '/mine').then(setData);
  useEffect(() => {if (signedIn) load().catch(report);}, [api, signedIn]);
  async function check(order, resume) {
    setBusy(true);
    setError('');
    try {
      const result = await shopRequest(api, '/mine/' + order.orderId + '/check', json('POST'));
      if (resume && result.checkout) return redirectToPaytm(result.checkout);
      await load();
      if (resume && result.order.status === 'pending') setError('Checkout cannot be resumed yet. Check the payment status again later.');
    } catch (err) {report(err);}
    finally {setBusy(false);}
  }
  return <section className="kj-container sv-page kj-shop">
    <PageIntro eyebrow="Karthik Jewellers" title="My orders">See your jewellery purchases, verified payments, and delivery status.</PageIntro>
    <Message message={error} type="error"/>
    {!signedIn && <Link className="kj-btn kj-btn-solid" to="/account/login?next=orders">Sign in to view orders</Link>}
    {signedIn && !data && !error && <p role="status">Loading orders…</p>}
    {data && !data.orders.length && <p className="sv-empty">You haven’t placed an order. <Link to="/collections">Browse collections</Link></p>}
    {data && <div className="kj-order-list">{[...data.orders].sort((a,b) => Number(b.orderId === highlighted) - Number(a.orderId === highlighted)).map(order =>
      <OrderCard order={order} key={order.orderId}>
        {order.status === 'pending' && data.paytm && <div className="sv-actions">
          <button type="button" className="sv-text-btn" disabled={busy} onClick={() => check(order, false)}>Check payment</button>
          <button type="button" className="kj-btn kj-btn-outline" disabled={busy} onClick={() => check(order, true)}>Resume payment</button>
        </div>}
        {order.status === 'failed' && <button type="button" className="kj-btn kj-btn-outline" onClick={() => {restoreCart(order.items);navigate('/cart');}}>Return items to bag</button>}
      </OrderCard>)}</div>}
  </section>;
}

export function AdminOrders({request}) {
  const [tab, setTab] = useState('orders');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState(null);
  const [offers, setOffers] = useState([]);
  const [offer, setOffer] = useState({code:'',percent:''});
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const api = (path, options) => request('/orders/admin' + path, options);
  const load = () => tab === 'orders'
    ? api('/orders?' + new URLSearchParams({page, ...(status ? {status} : {})})).then(setOrders)
    : api('/offers').then(setOffers);
  useEffect(() => {load().catch(err => setError(err.message));}, [tab, status, page]);

  async function action(task) {
    setBusy(true);setError('');setNotice('');
    try {await task();await load();} catch (err) {setError(err.message);}
    finally {setBusy(false);}
  }

  return <section className="sv-page sv-admin">
    <PageIntro eyebrow="Jewellery shop" title="Orders and offers">Review verified payments and manage deliveries and checkout discounts.</PageIntro>
    <nav className="sv-tabs" aria-label="Order management">{[['orders','Orders',Package],['offers','Offer codes',ShoppingBag]].map(([key,title,Icon]) =>
      <button key={key} type="button" aria-current={tab === key ? 'page' : undefined} onClick={() => {setTab(key);setError('');setNotice('');}}>
        <Icon size={16} aria-hidden="true"/>{title}
      </button>)}</nav>
    <Message message={error} type="error"/><Message message={notice}/>
    {tab === 'orders' ? <>
      <label className="kj-order-filter">Order status<select value={status} onChange={e => {setPage(1);setStatus(e.target.value);}}>
        <option value="">All orders</option>{Object.entries(labels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
      {orders && !orders.orders.length && <p className="sv-empty">No orders found.</p>}
      {orders && <div className="kj-order-list">{orders.orders.map(order => <OrderCard order={order} admin key={order.orderId}>
        {order.status === 'pending' && <button className="btn btn-muted" disabled={busy} onClick={() => action(() => api('/orders/' + order.orderId + '/check', json('POST')))}>Check Paytm payment</button>}
        {order.status === 'paid' && confirm !== order.orderId && <button className="btn btn-primary" disabled={busy} onClick={() => setConfirm(order.orderId)}>Mark delivered</button>}
        {(confirm === order.orderId && order.status === 'paid' || order.status === 'delivered' && order.deliveryEmailState !== 'sent') &&
          <div className="sv-actions">
            <button className="btn btn-primary" disabled={busy} onClick={() => action(async () => {
              const result = await api('/orders/' + order.orderId + '/deliver', json('POST'));
              setConfirm('');
              setNotice(result.order.deliveryEmailState === 'sent' ? 'Delivery confirmed and email sent.' :
                result.order.deliveryEmailState === 'sending' ? 'Delivery confirmed. The email is being sent.' :
                'Delivery confirmed. The email failed to send. You can retry it here.');
            })}>{order.status === 'paid' ? 'Confirm delivery and email customer' : 'Retry delivery email'}</button>
            {order.status === 'paid' && <button type="button" className="sv-text-btn" onClick={() => setConfirm('')}>Cancel</button>}
          </div>}
      </OrderCard>)}</div>}
      {orders?.total > 30 && <div className="sv-actions"><button className="sv-text-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page} of {Math.ceil(orders.total / 30)}</span><button className="sv-text-btn" disabled={page * 30 >= orders.total} onClick={() => setPage(page + 1)}>Next</button></div>}
    </> : <>
      <form className="sv-panel sv-form" onSubmit={e => {e.preventDefault();action(async () => {
        await api('/offers', json('POST', {code:offer.code,percent:Number(offer.percent)}));setOffer({code:'',percent:''});
      });}}>
        <h2>Create an offer code</h2>
        <div className="sv-form-grid">
          <label>Code<input required minLength={3} maxLength={24} pattern="[A-Z0-9](?:[A-Z0-9]|-){2,23}" value={offer.code} onChange={e => setOffer({...offer,code:e.target.value.toUpperCase()})}/></label>
          <label>Discount (%)<input required type="number" min="1" max="95" value={offer.percent} onChange={e => setOffer({...offer,percent:e.target.value})}/></label>
        </div>
        <button className="btn btn-primary" disabled={busy}>Create offer</button>
      </form>
      <div className="sv-grid">{offers.map(item => <article className="sv-panel sv-card" key={item._id}><h2>{item.code}</h2><p>{item.percent}% off · {item.active ? 'Active' : 'Inactive'}</p>
        <button type="button" className="btn btn-muted" disabled={busy} onClick={() => action(() => api('/offers/' + item._id,
          json('PATCH',{active:!item.active})))}>{item.active ? 'Deactivate' : 'Activate'}</button>
      </article>)}</div>
    </>}
  </section>;
}
