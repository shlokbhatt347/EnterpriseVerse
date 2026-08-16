"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BusinessStructure } from "@enterpriseverse/types";
import { useSimulation } from "../lib/simulation/useSimulation";
import "./founder.css";

const industries = ["Food & Beverage", "Retail", "Technology", "Services", "Manufacturing", "Creative", "Other"];
const structures: { id: BusinessStructure; name: string; description: string; capital: string }[] = [
  { id: "sole_trader", name: "Sole trader", description: "Maximum control. You carry the risk.", capital: "₹20,000" },
  { id: "partnership", name: "Partnership", description: "Share ownership, capital and decisions.", capital: "₹35,000" },
  { id: "trio", name: "Trio", description: "Three founders. More capability, more coordination.", capital: "₹50,000" },
  { id: "team", name: "Company", description: "A larger founding team with broader capacity.", capital: "₹75,000" },
];

export default function FounderPage() {
  const router = useRouter();
  const { start, status, error } = useSimulation();
  const [step, setStep] = useState(0);
  const [founder, setFounder] = useState("");
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState(industries[0]);
  const [structure, setStructure] = useState<BusinessStructure>("sole_trader");
  const [partners, setPartners] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selected = structures.find((item) => item.id === structure)!;
  const valid = step === 0 ? founder.trim().length > 1 : step === 1 ? name.trim().length > 1 && idea.trim().length > 8 : true;

  async function launch() {
    setErrorMessage(null);
    try {
      const max = structure === "sole_trader" ? 1 : structure === "partnership" ? 2 : structure === "trio" ? 3 : 6;
      await start({ name: name.trim(), idea: idea.trim(), industry, structure, founderNames: [founder.trim(), ...partners.split(",").map((v) => v.trim()).filter(Boolean)].slice(0, max) });
      router.push("/day1");
    } catch { setErrorMessage("The enterprise could not be created. Please try again."); }
  }

  return <main className="ev-founder"><header><a href="/" className="ev-founder-brand"><span>EV</span> EnterpriseVerse</a><span>FOUNDER ONBOARDING · {step + 1}/4</span></header><div className="ev-founder-progress"><i style={{ width: `${((step + 1) / 4) * 100}%` }} /></div><div className="ev-founder-layout"><section className="ev-founder-main">
    {step === 0 && <><span className="ev-kicker">01 · FOUNDER</span><h1>Start with the person making the calls.</h1><p>This identity becomes part of your company history.</p><label>Your name<input autoFocus value={founder} onChange={(e) => setFounder(e.target.value)} placeholder="e.g. Shlok" /></label></>}
    {step === 1 && <><span className="ev-kicker">02 · BUSINESS</span><h1>Give the enterprise a reason to exist.</h1><p>Describe the problem you want to solve. The simulation will determine what happens next.</p><label>Business name<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nova Foods" /></label><label>Business idea<textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="What are you building, and for whom?" /></label><label>Industry<select value={industry} onChange={(e) => setIndustry(e.target.value)}>{industries.map((item) => <option key={item}>{item}</option>)}</select></label></>}
    {step === 2 && <><span className="ev-kicker">03 · STRUCTURE</span><h1>Choose your starting conditions.</h1><p>Your structure changes capital, control and coordination.</p><div className="ev-founder-structures">{structures.map((item) => <button type="button" className={structure === item.id ? "selected" : ""} key={item.id} onClick={() => setStructure(item.id)}><strong>{item.name}</strong><small>{item.capital} starting capital</small><span>{item.description}</span></button>)}</div>{structure !== "sole_trader" && <label>Co-founders, separated by commas<input value={partners} onChange={(e) => setPartners(e.target.value)} placeholder="e.g. Aarav, Mira" /></label>}</>}
    {step === 3 && <><span className="ev-kicker">04 · CONFIRMATION</span><h1>This is your company.</h1><p>Next comes Day 1. The world will move and your first situation will arrive through the simulation.</p><div className="ev-founder-confirm"><div><small>FOUNDER</small><strong>{founder}</strong></div><div><small>ENTERPRISE</small><strong>{name}</strong></div><div><small>INDUSTRY</small><strong>{industry}</strong></div><div><small>STRUCTURE</small><strong>{selected.name}</strong></div><div><small>STARTING CAPITAL</small><strong>{selected.capital}</strong></div></div></>}
    {(errorMessage || error) && <p className="ev-founder-error" role="alert">{errorMessage ?? error}</p>}<div className="ev-founder-actions"><button type="button" className="ev-secondary" onClick={() => step ? setStep((v) => v - 1) : router.push("/")}>Back</button>{step < 3 ? <button type="button" className="ev-primary" disabled={!valid} onClick={() => setStep((v) => v + 1)}>Continue →</button> : <button type="button" className="ev-primary" disabled={status === "saving"} onClick={() => void launch()}>{status === "saving" ? "Creating…" : "Enter Day 1 →"}</button>}</div>
  </section><aside className="ev-founder-aside"><span>YOUR FIRST SESSION</span><strong>Founder</strong><i>↓</i><strong>Company</strong><i>↓</i><strong>World</strong><i>↓</i><strong>First signal</strong><i>↓</i><strong>First decision</strong><p>The interface teaches itself through gameplay. No tutorial deck required.</p></aside></div></main>;
}
