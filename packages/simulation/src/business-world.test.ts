import { describe, expect, it } from "vitest";
import { createRng, createWorld, runLong, runMonteCarlo, stepWorld, validateWorld } from "./business-world";

describe("deep business world",()=>{
 it("is deterministic",()=>{let a=createWorld(42,"retail"),b=createWorld(42,"retail"),ra=createRng(42),rb=createRng(42);for(let i=0;i<30;i++){a=stepWorld(a,{price:96,marketing:40,training:12},ra).state;b=stepWorld(b,{price:96,marketing:40,training:12},rb).state;expect(a).toEqual(b)}});
 it("makes pricing economically consequential",()=>{const a=stepWorld(createWorld(7,"retail"),{price:70},createRng(7)).state;const b=stepWorld(createWorld(7,"retail"),{price:180},createRng(7)).state;expect(a.business.revenue).not.toBe(b.business.revenue)});
 it("survives long seeded horizons",()=>{const w=runLong(createWorld(123,"manufacturing"),500,createRng(123));expect(validateWorld(w)).toEqual([]);expect(w.day).toBeGreaterThanOrEqual(501)});
 it("keeps Monte Carlo repeatable",()=>{expect(runMonteCarlo(20,80,99,"technology")).toEqual(runMonteCarlo(20,80,99,"technology"))});
 it("produces strategic divergence",()=>{let a=createWorld(55,"services"),b=createWorld(55,"services"),ra=createRng(55),rb=createRng(55);for(let i=0;i<60;i++){a=stepWorld(a,{price:105,marketing:5,training:4},ra).state;b=stepWorld(b,{price:82,marketing:100,hiring:8,capacityInvestment:80,borrowing:500},rb).state}expect(a.business.revenue).not.toBe(b.business.revenue)});
});
