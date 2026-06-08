export interface NumericDelta {
  before: number;
  after: number;
  delta: number;
}

export interface ImportDiff {
  playtime?: NumericDelta;
  totalEntities?: NumericDelta;
  infectedCount?: NumericDelta;
  offCount?: NumericDelta;
  outputFullCount?: NumericDelta;
  missingItemsCount?: NumericDelta;
  recipesUnlocked?: NumericDelta;
  recipesLocked?: NumericDelta;
  byCategory?: Record<string, NumericDelta>;
  newRecipesUnlocked?: string[];
  newEntityTypes?: string[];
  removedEntityTypes?: string[];
}
