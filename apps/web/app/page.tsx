"use client";

import Link from "next/link";
import { useState } from "react";
import "./homepage.css";

const moments = [
  { title: "MARKET SIGNAL", body: "Demand is moving. Your company has to notice before it becomes a problem." },
  { title: "DECISION", body: "Choose a response. There is no answer key—only trade-offs." },
  { title: "CONSEQUENCE", body: "The simulation reacts. Customers, cash, competitors and operations move together." },
];

export default function Home() {
  const [moment, setMoment] = useState(0);
  const current = moments[moment];
  return <main className="ev-homepage">
    <nav className="ev-home-nav"><Link href="/" className="ev-home-brand"><span>EV</span> EnterpriseVerse</Link><div className="ev-home-links"><a href="#world">The world</a><a href="#loop">How it works</a><a href="#learn">Learn by doing</a><a href="#compete">Compete</a></div><div className="ev-home-actions"><Link href="/auth/signin" className="ev-home-signin">Sign in</Link><Link href="/start" className="ev-home-start">Start your enterprise</Link></div></nav>

    <section className="ev-home-hero">
      <div className="ev-home-hero-copy"><span className="ev-kicker">A LIVING ENTREPRENEURSHIP SIMULATION</span><h1>Build a company.<br /><em>Change its world.</em></h1><p>EnterpriseVerse puts you inside a living economy where customers, competitors, employees, suppliers and your own decisions interact. You learn business by running one.</p><div className="ev-home-cta"><Link href="/start" className="ev-home-primary">Start your enterprise <span>→</span></Link><Link href="/auth/signin" className="ev-home-secondary">I already have an account</Link></div><div className="ev-home-proof"><span><i />Real simulation engine</span><span><i />Decisions have consequences</span><span><i />Learn through experience</span></div></div>
      <div className="ev-world-preview" aria-label="Interactive simulation preview">
        <div className="ev-preview-top"><span>WORLD STATE</span><span><i />LIVE</span></div>
        <div className="ev-preview-map"><div className="ev-grid" /><div className="ev-node node-a" /><div className="ev-node node-b" /><div className="ev-node node-c" /><div className="ev-route route-a" /><div className="ev-route route-b" /><div className="ev-preview-label label-market"><small>MARKET</small><b>Demand shifting</b></div><div className="ev-preview-label label-company"><small>YOUR ENTERPRISE</small><b>Waiting for a decision</b></div></div>
        <div className="ev-preview-bottom"><div><small>ENTERPRISE</small><strong>YOUR COMPANY</strong></div><div><small>WORLD</small><strong>IN MOTION</strong></div><div><small>PLAYER</small><strong>YOU</strong></div></div>
      </div>
    </section>

    <section id="loop" className="ev-home-section ev-loop-section"><div className="ev-section-intro"><span className="ev-kicker">THE CORE LOOP</span><h2>Notice. Understand. Decide.<br />Then see what you caused.</h2><p>EnterpriseVerse is designed around the actual mental loop of running a business—not a collection of dashboards.</p></div><div className="ev-loop-grid">{moments.map((item, index) => <button key={item.title} type="button" className={moment === index ? "active" : ""} onClick={() => setMoment(index)}><span>0{index + 1}</span><strong>{item.title}</strong><p>{item.body}</p></button>)}</div><div className="ev-loop-result"><span className="ev-kicker">{current.title}</span><p>{current.body}</p><div className="ev-causal-line"><span>YOUR CHOICE</span><i>→</i><span>SIMULATION</span><i>→</i><span>CONSEQUENCE</span></div></div></section>

    <section id="world" className="ev-home-section ev-world-section"><div><span className="ev-kicker">ONE LIVING WORLD</span><h2>Everything is connected.</h2><p>A price change can affect demand. Demand can affect inventory. Inventory can affect cash. Cash can change what you can afford to do next.</p></div><div className="ev-system-diagram"><div><b>MARKET</b><span>Demand · Pricing · Rivals</span></div><i>↓</i><div><b>ENTERPRISE</b><span>People · Operations · Finance</span></div><i>↓</i><div><b>OUTCOME</b><span>Customers · Reputation · Growth</span></div></div></section>

    <section id="learn" className="ev-home-section ev-learn-section"><div className="ev-learn-card"><span className="ev-kicker">LEARN THROUGH PLAY</span><h2>The lesson arrives because something happened.</h2><p>When you face opportunity cost, cash-flow pressure, pricing strategy or competitive risk, EnterpriseVerse explains the concept through your actual company experience—then puts you back in the world.</p><div className="ev-learning-example"><span>YOU JUST EXPERIENCED</span><strong>Opportunity Cost</strong><p>You chose one use for scarce resources. The simulation makes the trade-off visible.</p></div></div></section>

    <section id="compete" className="ev-home-section ev-compete-section"><div className="ev-compete-copy"><span className="ev-kicker">COMPETE & REPLAY</span><h2>Build a company worth remembering.</h2><p>Compete on more than a single score. Explore rival businesses, survive shocks, build reputation, and eventually look back at the decisions that shaped your enterprise.</p><div className="ev-feature-list"><span>Competitive intelligence</span><span>Challenges & seasons</span><span>Company timeline</span><span>Replay important moments</span></div></div><div className="ev-legacy-preview"><div className="ev-legacy-line" /><span>DAY 1</span><span>FIRST CUSTOMER</span><span>MARKET SHOCK</span><span>BREAKTHROUGH</span><span>YOUR LEGACY</span></div></section>

    <section className="ev-home-final"><span className="ev-kicker">YOUR ENTERPRISE IS WAITING</span><h2>The world is already moving.<br /><em>What will you do?</em></h2><Link href="/start" className="ev-home-primary">Enter EnterpriseVerse <span>→</span></Link></section>
    <footer className="ev-home-footer"><span>ENTERPRISEVERSE</span><span>Interactive entrepreneurship simulation</span><span>© 2026</span></footer>
  </main>;
}
