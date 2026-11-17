import React, {useEffect, useState} from 'react';
import {Link, Navigate, useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowRight, CalendarDays, Gem, History, LockKeyhole, Mail, Plus, UserRound, Wallet} from 'lucide-react';
import './savings.css';

const googleProofKey = 'kj_google_login_proof';
const base64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const tokenKey = 'kj_customer_session';
export const storedToken = () => {
  try { return sessionStorage.getItem(tokenKey); } catch { return null; }
};
const currency = new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2});
export const money = paise => currency.format(paise / 100);
const monthLabel = month => new Date(month + '-01T00:00:00Z').toLocaleDateString('en-IN', {
  month: 'short', year: 'numeric', timeZone: 'UTC'
});
const dateLabel = date => date ? new Date(date).toLocaleDateString('en-IN', {timeZone: 'Asia/Kolkata'}) : '—';
const toMonth = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7);
const post = body => ({method: 'POST', body: JSON.stringify(body)});
const statusLabels = {paid: 'Paid', pending: 'Pending', failed: 'Failed', unpaid: 'Unpaid'};

export async function customerRequest(api, path, options = {}, base = '/savings') {
  const token = storedToken();
  const response = await fetch(api + base + path, {
    ...options,
    headers: {'Content-Type': 'application/json', ...(token ? {Authorization: 'Bearer ' + token} : {})}
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = Error(data.error || 'Could not connect. Please try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export function Message({message, type = 'status'}) {
  return message ? <p className={`sv-message sv-${type}`} role={type === 'error' ? 'alert' : 'status'}>{message}</p> : null;
}

export function PageIntro({eyebrow, title, children}) {
  return <header className="sv-intro">
    <div className="sv-eyebrow"><Gem aria-hidden="true" size={15}/> {eyebrow}</div>
    <h1>{title}</h1>
    <p>{children}</p>
  </header>;
}

export function CustomerLogin({api}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const returnTo = next === 'cart' ? '/cart' : next === 'orders' ? '/orders' : null;
  const target = returnTo || (params.get('tab') === 'transactions' ? '/account?tab=transactions' : '/account');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const googleResult = params.get('google');
  const ticket = params.get('ticket');

  useEffect(() => {
    customerRequest(api, '/login/options').then(data => setGoogleAvailable(data.google)).catch(() => {});
  }, [api]);

  useEffect(() => {
    if (!googleResult || storedToken()) return;
    const saved = sessionStorage.getItem(googleProofKey);
    const [proof, destination] = saved?.split(':') || [];
    sessionStorage.removeItem(googleProofKey);
    const showError = message => {
      setError(message);
      navigate('/account/login', {replace: true});
    };
    if (googleResult !== 'complete' || !ticket || !proof) {
      showError(googleResult === 'email'
        ? 'Use an email code to sign in with this address.'
        : 'Google sign-in could not finish. Please try again.');
      return;
    }
    setBusy(true);
    customerRequest(api, '/login/google/complete', post({ticket, verifier: proof}))
      .then(result => {
        sessionStorage.setItem(tokenKey, result.token);
        navigate(destination === '/cart' || destination === '/orders' ? destination : '/account?tab=profile', {replace: true});
      })
      .catch(err => showError(err.message))
      .finally(() => setBusy(false));
  }, [api, googleResult, ticket, navigate]);

  if (storedToken()) return <Navigate to={target} replace/>;

  async function startGoogle() {
    const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
    const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
    sessionStorage.setItem(googleProofKey, verifier + ':' + (returnTo || ''));
    window.location.assign(api + '/savings/login/google/start?' + new URLSearchParams({challenge}));
  }

  async function send() {
    const result = await customerRequest(api, '/login/request', post({email, name}));
    setSent(true);
    setMessage(result.message);
  }

  async function run(action) {
    setBusy(true);
    setError('');
    setMessage('');
    try { await action(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <section className="kj-container sv-page sv-login">
    <PageIntro eyebrow="Karthik Jewellers savings" title="Make something beautiful possible">
      Choose a jewellery plan, pay one installment at a time, and track your progress.
    </PageIntro>
    <form className="sv-panel sv-login-form" onSubmit={event => {
      event.preventDefault();
      run(async () => {
        if (!sent) return send();
        const result = await customerRequest(api, '/login/verify', post({email, code}));
        sessionStorage.setItem(tokenKey, result.token);
        navigate(target, {replace: true});
      });
    }}>
      <Mail size={25} aria-hidden="true"/>
      <h2>{sent ? 'Enter your sign-in code' : 'Sign in with email'}</h2>
      {!sent && googleAvailable && <>
        <button type="button" className="kj-btn sv-google" disabled={busy} onClick={() => run(startGoogle)}>
          <img src="/google-g.svg" alt="" width="18" height="18"/> Sign in with Google
        </button>
        <p className="sv-google-info">Google shares your name and verified email to create or access your account. <a href="/privacy.html">Privacy notice</a></p>
        <div className="sv-divider"><span>or use an email code</span></div>
      </>}
      {!sent && <label>Name <small>(optional)</small><input value={name} onChange={e => setName(e.target.value)} maxLength={120} autoComplete="name"/></label>}
      <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} readOnly={sent} required maxLength={254} autoComplete="email"/></label>
      {sent && <label>Six-digit code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value)} required autoFocus/></label>}
      <button className="kj-btn kj-btn-solid" disabled={busy}>{busy ? 'Please wait…' : sent ? 'Verify and sign in' : 'Email me a code'}<ArrowRight aria-hidden="true" size={17}/></button>
      {sent && <div className="sv-actions">
        <button type="button" className="sv-text-btn" onClick={() => run(send)} disabled={busy}>Resend code</button>
        <button type="button" className="sv-text-btn" onClick={() => {setSent(false);setCode('');setMessage('');setError('');}} disabled={busy}>Change email</button>
      </div>}
      <Message message={message}/><Message message={error} type="error"/>
    </form>
  </section>;
}

function PlanFacts({plan}) {
  return <>
    <p className="sv-price">{money(plan.amountPaise)} <small>/ month</small></p>
    <dl className="sv-facts">
      <div><dt>Paid installments</dt><dd>{plan.months}</dd></div>
      <div><dt>Bonus on completion</dt><dd>{plan.bonusMonths ? money(plan.amountPaise * plan.bonusMonths) + ' jewellery credit' : 'None'}</dd></div>
    </dl>
  </>;
}

export function redirectToPaytm({url, fields}) {
  const target = new URL(url);
  if (!['https://secure.paytmpayments.com', 'https://securestage.paytmpayments.com'].includes(target.origin) ||
      target.pathname !== '/theia/api/v1/showPaymentPage') throw Error('Invalid checkout destination');
  const form = document.createElement('form');
  form.action = target.href;
  form.method = 'POST';
  for (const key of ['mid', 'orderId', 'txnToken']) {
    const field = document.createElement('input');
    field.type = 'hidden'; field.name = key; field.value = fields[key];
    form.append(field);
  }
  document.body.append(form);
  form.submit();
}

function ProfileForm({account, busy, onSave}) {
  const [name, setName] = useState(account.name);
  const [phone, setPhone] = useState(account.phone || '');
  const [marketingConsent, setMarketingConsent] = useState(Boolean(account.marketingConsent));
  return <form className="sv-panel sv-profile" onSubmit={event => {
    event.preventDefault();
    onSave({name, phone, marketingConsent});
  }}>
    <h2>Contact details</h2>
    <label>Name<input required maxLength={120} autoComplete="name" value={name} onChange={event => setName(event.target.value)}/></label>
    <label>Email <small>(verified)</small><input type="email" readOnly value={account.email}/></label>
    <label>Phone <small>(optional)</small><input type="tel" maxLength={24} autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)}/></label>
    <label className="sv-profile-consent"><input type="checkbox" checked={marketingConsent}
      onChange={event => setMarketingConsent(event.target.checked)}/>
      <span>Email me jewellery offers and promotions from Karthik Jewellers. I can unsubscribe at any time.</span>
    </label>
    <button className="kj-btn kj-btn-solid" disabled={busy}>Save profile</button>
  </form>;
}

function TransactionList({data, checkPayment, busy}) {
  const enrollmentNames = Object.fromEntries(data.enrollments.map(e => [e._id, e.name]));
  if (!data.payments.length) return <p className="sv-empty">Your online and offline payments will appear here.</p>;
  return <div className="sv-table-wrap" tabIndex={0} aria-label="Transaction history table">
    <table className="sv-table">
      <thead><tr><th>Date</th><th>Plan</th><th>Installment</th><th>Amount</th><th>Method</th><th>Status</th><th>Reference</th></tr></thead>
      <tbody>{data.payments.map(p => <tr key={p._id}>
        <td>{dateLabel(p.paidAt || p.createdAt)}</td><td>{enrollmentNames[p.enrollment]}</td>
        <td>{p.installment}</td><td>{money(p.amountPaise)}</td><td>{p.channel === 'paytm' ? 'Paytm' : 'Offline'}</td>
        <td><span className={`sv-badge sv-${p.status}`}>{statusLabels[p.status]}</span>
          {p.status === 'pending' && data.paytm && <button className="sv-text-btn" type="button" disabled={busy} onClick={() => checkPayment(p._id)}>Check status</button>}
        </td><td>{p.reference || '—'}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function CustomerAccount({api}) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);
  const tab = ['plans', 'transactions', 'profile'].includes(params.get('tab')) ? params.get('tab') : 'enrolled';
  const login = tab === 'transactions' ? '/account/login?tab=transactions' : '/account/login';
  const request = (path, opts) => customerRequest(api, path, opts);
  const signOut = () => {sessionStorage.removeItem(tokenKey); navigate(login, {replace: true});};
  const load = async () => setData(await request('/account'));
  const handleError = err => err.status === 401 ? signOut() : setError(err.message);

  useEffect(() => {
    if (storedToken()) load().catch(handleError);
  }, [api]);

  if (!storedToken()) return <Navigate to={login} replace/>;
  async function action(fn) {
    setBusy(true); setError(''); setMessage('');
    try { await fn(); } catch (err) { handleError(err); } finally { setBusy(false); }
  }

  return <section className="kj-container sv-page">
    <PageIntro eyebrow="Your jewellery savings" title={data ? `Welcome, ${data.account.name}` : 'My account'}>
      Manage your plans, monthly installments and payment history in one place.
    </PageIntro>
    <div className="sv-toolbar">
      <nav aria-label="Savings dashboard" className="sv-tabs">
        {[['enrolled', 'My plans', Wallet], ['plans', 'Available plans', CalendarDays], ['transactions', 'Transactions', History], ['profile', 'Profile', UserRound]].map(([key, label, Icon]) =>
          <button key={key} type="button" aria-current={tab === key ? 'page' : undefined} onClick={() => {setSelected(null);setParams({tab: key});}}><Icon size={16} aria-hidden="true"/>{label}</button>)}
      </nav>
      <div className="sv-actions"><Link className="sv-text-btn" to="/orders">My orders</Link><button type="button" className="sv-text-btn" onClick={signOut}>Sign out</button></div>
    </div>
    <Message message={error} type="error"/><Message message={message}/>
    {!data && !error && <p role="status">Loading your account…</p>}
    {data && tab === 'profile' && <ProfileForm account={data.account} busy={busy} onSave={profile => action(async () => {
      await request('/account/profile', {...post(profile), method: 'PUT'});
      await load();
      setMessage('Profile saved.');
    })}/>}
    {data && tab === 'plans' && <>
      <div className="sv-grid">{data.plans.map(p => {
        const enrolled = data.enrollments.some(e => e.plan === p._id);
        return <article className="sv-panel sv-card" key={p._id}>
          <div className="sv-plan-icon"><Gem size={22} aria-hidden="true"/></div>
          <h2>{p.name}</h2>{p.description && <p>{p.description}</p>}
          <PlanFacts plan={p}/>
          {selected === p._id ? <div className="sv-confirm">
            <p>Enroll in {p.name} for {p.months} monthly installments of {money(p.amountPaise)}?</p>
            <div className="sv-actions">
              <button className="kj-btn kj-btn-solid" disabled={busy} onClick={() => action(async () => {
                await request('/enrollments', post({planId: p._id})); await load();
                setSelected(null); setParams({tab: 'enrolled'}); setMessage('You’re enrolled.');
              })}>Confirm enrollment</button>
              <button type="button" className="sv-text-btn" onClick={() => setSelected(null)} disabled={busy}>Cancel</button>
            </div>
          </div> : <button className="kj-btn kj-btn-solid" onClick={() => setSelected(p._id)} disabled={enrolled || busy}>{enrolled ? 'Already enrolled' : 'Choose plan'}</button>}
        </article>;
      })}</div>
      {!data.plans.length && <p className="sv-empty">No plans are open for enrollment right now.</p>}
    </>}
    {data && tab === 'enrolled' && <>
      {!data.paytm && <Message message="Online Paytm payments are currently unavailable. Contact the showroom for offline payment."/>}
      <div className="sv-grid">{data.enrollments.map(e => {
        const payment = data.payments.find(p => p.enrollment === e._id && p.installment === e.nextInstallment);
        return <article className="sv-panel sv-card" key={e._id}>
          <div className="sv-eyebrow">Enrolled {monthLabel(e.startMonth)}</div>
          <h2>{e.name}</h2><PlanFacts plan={e}/>
          <label className="sv-progress">{e.paidCount} of {e.months} installments paid<progress value={e.paidCount} max={e.months}/></label>
          <p>{money(e.paidCount * e.amountPaise)} paid{e.paidCount === e.months && e.bonusMonths ? ` · ${money(e.bonusMonths * e.amountPaise)} bonus earned` : ''}</p>
          {e.nextInstallment ? <>
            <p>Installment {e.nextInstallment} · {monthLabel(e.dueMonth)}{payment?.status === 'pending' ? ' · Payment pending' : ''}</p>
            <button className="kj-btn kj-btn-solid" disabled={busy || !data.paytm || e.dueMonth > data.todayMonth}
              onClick={() => action(async () => redirectToPaytm(await request('/enrollments/' + e._id + '/checkout', post({}))))}>
              <LockKeyhole size={15} aria-hidden="true"/>{payment?.status === 'pending' ? 'Resume Paytm checkout' : 'Pay ' + money(e.amountPaise) + ' with Paytm'}
            </button>
          </> : <span className="sv-badge sv-paid">Plan completed</span>}
        </article>;
      })}</div>
      {!data.enrollments.length && <div className="sv-empty">
        <p>You haven’t joined a plan yet.</p><button className="kj-btn kj-btn-solid" onClick={() => setParams({tab: 'plans'})}>Browse available plans</button>
      </div>}
    </>}
    {data && tab === 'transactions' && <TransactionList data={data} busy={busy} checkPayment={id => action(async () => {
      const result = await request('/payments/' + id + '/check', post({})); await load();
      setMessage(result.status === 'pending' ? 'Paytm has not confirmed this payment yet.' : `Payment status: ${statusLabels[result.status]}.`);
    })}/>}
  </section>;
}

const blankPlan = {name: '', description: '', amount: '', months: '11', bonusMonths: '1'};

function OfflineForm({row, today, busy, save, cancel}) {
  const eligible = row.installments.filter(x => ['unpaid', 'failed'].includes(x.status));
  const [form, setForm] = useState({installment: String(eligible[0]?.installment || ''), amount: (row.amountPaise / 100).toFixed(2), date: today, reference: ''});
  const change = key => e => setForm({...form, [key]: e.target.value});
  return <form className="sv-panel sv-form sv-offline" onSubmit={e => {e.preventDefault();save(form);}}>
    <h3>Record offline payment</h3>
    <p>{row.account?.name} · {row.name}</p>
    <div className="sv-form-grid">
      <label>Installment<select required value={form.installment} onChange={change('installment')}>{eligible.map(x => <option key={x.installment} value={x.installment}>{x.installment} · {monthLabel(x.month)}</option>)}</select></label>
      <label>Amount (₹)<input value={form.amount} readOnly/></label>
      <label>Payment date<input type="date" required max={today} value={form.date} onChange={change('date')}/></label>
      <label>Receipt reference<input required maxLength={160} value={form.reference} onChange={change('reference')}/></label>
    </div>
    <div className="sv-actions">
      <button className="btn btn-primary" disabled={busy || !eligible.length}>Save offline payment</button>
      <button type="button" className="sv-text-btn" disabled={busy} onClick={cancel}>Cancel</button>
    </div>
  </form>;
}

export function AdminSavings({request}) {
  const [params, setParams] = useSearchParams();
  const initialMonth = params.get('month') || toMonth();
  const [form, setForm] = useState(blankPlan);
  const [plans, setPlans] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [month, setMonth] = useState(initialMonth);
  const [page, setPage] = useState(1);
  const [version, refresh] = useState(0);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const account = params.get('account');
  const tab = params.get('tab') === 'ledger' ? 'ledger' : 'plans';
  const api = (path, opts) => request('/savings/admin' + path, opts);

  useEffect(() => {
    let current = true;
    const query = new URLSearchParams({month, page: String(page)});
    if (account) query.set('account', account);
    const result = tab === 'ledger' ? api('/ledger?' + query) : api('/plans');
    result.then(data => {
      if (!current) return;
      if (tab === 'ledger') setLedger(data); else setPlans(data);
    }).catch(err => { if (current) setError(err.message); });
    return () => { current = false; };
  }, [tab, month, page, account, version]);

  async function action(fn, success) {
    setBusy(true); setError(''); setMessage('');
    try { const result = await fn(); refresh(v => v + 1); setMessage(typeof success === 'function' ? success(result) : success); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  const change = key => e => setForm({...form, [key]: e.target.value});

  return <section className="sv-page sv-admin">
    <PageIntro eyebrow="Customer savings" title="Jewellery plans">
      Create plans, check what each customer paid this month, and record offline receipts.
    </PageIntro>
    <nav className="sv-tabs" aria-label="Admin savings">
      <Link to="/admin/savings" aria-current={tab === 'plans' ? 'page' : undefined}>Manage plans</Link>
      <Link to="/admin/savings?tab=ledger" aria-current={tab === 'ledger' ? 'page' : undefined}>Monthly payments</Link>
    </nav>
    <Message message={error} type="error"/><Message message={message}/>
    {tab === 'plans' ? <>
      <form className="sv-panel sv-form" onSubmit={e => {
        e.preventDefault();
        action(async () => {await api('/plans', post(form)); setForm(blankPlan);}, 'Plan created.');
      }}>
        <h2>Create a plan</h2>
        <div className="sv-form-grid">
          <label>Plan name<input required maxLength={120} value={form.name} onChange={change('name')}/></label>
          <label>Monthly amount (₹)<input required type="number" inputMode="decimal" min=".01" step=".01" value={form.amount} onChange={change('amount')}/></label>
          <label>Paid months<input required type="number" min="1" max="36" value={form.months} onChange={change('months')}/></label>
          <label>Bonus months<input required type="number" min="0" max="3" value={form.bonusMonths} onChange={change('bonusMonths')}/></label>
        </div>
        <label>Plan details<textarea maxLength={1000} rows={3} value={form.description} onChange={change('description')} placeholder="Explain which jewellery is eligible and any redemption terms."/></label>
        <button className="btn btn-primary" disabled={busy}><Plus size={16} aria-hidden="true"/>Create plan</button>
      </form>
      <div className="sv-grid">{plans.map(p => <article className="sv-panel sv-card" key={p._id}>
        <div className={`sv-badge ${p.active ? 'sv-paid' : ''}`}>{p.active ? 'Open for enrollment' : 'Closed'}</div>
        <h2>{p.name}</h2><PlanFacts plan={p}/>
        <button type="button" className="btn btn-muted" disabled={busy} onClick={() => action(
          () => api('/plans/' + p._id, {method: 'PATCH', body: JSON.stringify({active: !p.active})}), 'Plan status updated.'
        )}>{p.active ? 'Close enrollment' : 'Reopen enrollment'}</button>
      </article>)}</div>
    </> : <>
      <div className="sv-toolbar">
        <label>Payment month<input aria-label="Payment month" type="month" value={month} onChange={e => {
          if (e.target.value) {setLedger(null);setMonth(e.target.value);setPage(1);setSelected(null);}
        }}/></label>
        {account && <Link className="sv-text-btn" to="/admin/savings?tab=ledger" onClick={() => {setPage(1);setSelected(null);}}>Show all customers</Link>}
      </div>
      <div className="sv-grid">{ledger?.rows.map(row => <article className="sv-panel sv-card" key={row._id}>
        <div className="sv-eyebrow">{row.account?.name || 'Customer'} · {row.account?.email}</div>
        <h2>{row.name}</h2>
        <p><strong>{money(row.monthTotalPaise)}</strong> paid in {monthLabel(ledger.month)} · {money(row.amountPaise)} per installment</p>
        {row.paid.length > 0 && <ul className="sv-receipts">{row.paid.map(p => <li key={p._id}>
          #{p.installment} · {dateLabel(p.paidAt)} · {p.channel === 'offline' ? 'Offline' : 'Paytm'} · {money(p.amountPaise)}{p.reference ? ' · ' + p.reference : ''}
        </li>)}</ul>}
        {row.pending.map(p => <div className="sv-actions" key={p._id}>
          <span>Installment {p.installment}: Paytm pending</span>
          {ledger.paytm && <button type="button" className="sv-text-btn" disabled={busy} onClick={() => action(
            () => api('/payments/' + p._id + '/check', post({})), result => `Payment status: ${statusLabels[result.status]}.`
          )}>Check status</button>}
        </div>)}
        {selected === row._id ? <OfflineForm key={row._id} row={row} today={ledger.today} busy={busy}
          cancel={() => setSelected(null)} save={f => action(async () => {
            await api('/enrollments/' + row._id + '/offline', post(f)); setSelected(null);
          }, 'Payment saved to the customer’s history.')}/> :
          <button className="btn btn-muted" type="button" disabled={busy || row.installments.every(i => ['paid', 'pending'].includes(i.status))}
            onClick={() => setSelected(row._id)}>Record offline payment</button>}
      </article>)}</div>
      {!ledger && !error && <p role="status">Loading payment records…</p>}
      {ledger && !ledger.rows.length && <p className="sv-empty">No customer enrollments found.</p>}
      {ledger?.total > 50 && <div className="sv-actions">
        <button type="button" className="sv-text-btn" disabled={page <= 1} onClick={() => {setPage(v => v - 1);setSelected(null);}}>Previous</button>
        <span>Page {page} of {Math.ceil(ledger.total / 50)}</span>
        <button type="button" className="sv-text-btn" disabled={page * 50 >= ledger.total} onClick={() => {setPage(v => v + 1);setSelected(null);}}>Next</button>
      </div>}
    </>}
  </section>;
}
