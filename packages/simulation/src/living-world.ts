export type ActorKind = "competitor" | "customer" | "supplier" | "employee";
export type RelationshipTrend = "improving" | "stable" | "declining";

export interface LivingWorldActor {
  id: string;
  kind: ActorKind;
  name: string;
  relationship: number;
  trust: number;
  activity: number;
  lastInteractionDay: number;
}

export interface LivingWorldState {
  day: number;
  marketPressure: number;
  actors: LivingWorldActor[];
}

const clamp = (value: number): number => Math.max(0, Math.min(100, value));

export const createLivingWorldState = (day: number, actors: LivingWorldActor[] = []): LivingWorldState => ({
  day,
  marketPressure: 50,
  actors: actors.map((actor) => ({ ...actor, relationship: clamp(actor.relationship), trust: clamp(actor.trust), activity: clamp(actor.activity) })),
});

export const updateLivingWorldActor = (
  actor: LivingWorldActor,
  day: number,
  relationshipDelta = 0,
  trustDelta = 0,
  activityDelta = 0,
): LivingWorldActor => ({
  ...actor,
  relationship: clamp(actor.relationship + relationshipDelta),
  trust: clamp(actor.trust + trustDelta),
  activity: clamp(actor.activity + activityDelta),
  lastInteractionDay: day,
});

export const getRelationshipTrend = (actor: LivingWorldActor): RelationshipTrend =>
  actor.relationship >= 70 ? "improving" : actor.relationship <= 30 ? "declining" : "stable";

export const advanceLivingWorld = (state: LivingWorldState, day: number): LivingWorldState => {
  if (!Number.isInteger(day) || day < state.day) return state;
  const elapsedWeeks = Math.floor((day - state.day) / 7);
  return {
    ...state,
    day,
    marketPressure: clamp(state.marketPressure + (elapsedWeeks % 2 === 0 ? 1 : -1)),
    actors: state.actors.map((actor) => ({
      ...actor,
      activity: clamp(actor.activity - Math.min(5, Math.floor(Math.max(0, day - actor.lastInteractionDay) / 7))),
      relationship: clamp(actor.relationship + (actor.relationship > 50 ? 1 : actor.relationship < 50 ? -1 : 0)),
    })),
  };
};
