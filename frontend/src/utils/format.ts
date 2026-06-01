import type { GameEntity } from '../types/save.types';

/** Display label for an entity: the player's custom name if set, else the type. */
export function displayName(entity: GameEntity): string {
  const custom = entity.customName?.trim();
  return custom ? custom : cleanName(entity.name);
}

/** Strip engine prefixes from an entity name (e.g. "DA_BaseCore" -> "BaseCore"). */
export function cleanName(name: string): string {
  let s = name;
  s = s.replace(/^DA_/, '');
  s = s.replace(/^Foundable_/, '');
  return s || name;
}

/**
 * Reduce a recipe blueprint path to a readable label, e.g.
 * "/Game/Chimera/Crafting/MechanicalDrill/CR_CalciumOre_MechanicalDrill.CR_..."
 * -> "CalciumOre_MechanicalDrill".
 */
export function cleanRecipe(recipe: string | null): string | null {
  if (!recipe) return recipe;
  let s = recipe;
  const dot = s.indexOf('.');
  if (dot > 0) s = s.substring(0, dot);
  const slash = s.lastIndexOf('/');
  if (slash >= 0 && slash < s.length - 1) s = s.substring(slash + 1);
  s = s.replace(/^CR_/, '');
  return s || recipe;
}
