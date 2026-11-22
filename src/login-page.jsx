import React, {useId, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound} from 'lucide-react';
import './login-choice.css';

export function LoginPage({metal, admin = false, children}) {
  return <section className="kj-login-choice" data-metal={metal} aria-labelledby="login-title">
    <Link to="/" className="kj-login-back" aria-label="Back to home"><ArrowLeft size={20}/></Link>
    <div className="kj-login-card">
      <img className="kj-login-necklace" src={'/images/necklace-'+metal.toLowerCase()+'.webp'} alt={metal+' necklace, shown in full'}/>
      <div className="kj-login-form-panel">
        <div className="kj-login-brand"><img src="/images/glass-monogram.webp" alt="Karthik Jewellers"/></div>
        <h1 id="login-title">Welcome back</h1>
        <nav className="kj-login-actions" aria-label="Sign-in role">
          <Link to="/login" aria-current={admin ? undefined : 'page'} className="kj-login-role"><UserRound size={21} aria-hidden="true"/>Customer</Link>
          <Link to="/admin/login" aria-current={admin ? 'page' : undefined} className="kj-login-role"><ShieldCheck size={21} aria-hidden="true"/>Admin</Link>
        </nav>
        {children}
      </div>
    </div>
  </section>;
}

export function LoginPassword({label = 'Password', action, ...props}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return <div>
    <div className="kj-login-label-row"><label htmlFor={id}>{label}</label>{action}</div>
    <div className="kj-login-password">
      <LockKeyhole size={19} aria-hidden="true"/>
      <input {...props} id={id} type={visible ? 'text' : 'password'}/>
      <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(value => !value)}>
        <Icon size={20} aria-hidden="true"/>
      </button>
    </div>
  </div>;
}
