
import type { CommentRule, UserProfile } from './types';
export function meetsRules(profile: UserProfile | null, rules: CommentRule = {} as any): boolean {
  if (!profile) return false;
  const tenureMonths = profile.y*12 + profile.m;
  const minT = rules.tenureMin?.noLimit ? 0 : (rules.tenureMin ? rules.tenureMin.y*12 + rules.tenureMin.m : 0);
  const maxT = rules.tenureMax?.noLimit ? Infinity : (rules.tenureMax ? rules.tenureMax.y*12 + rules.tenureMax.m : Infinity);
  const minS = rules.salaryMin?.noLimit ? -Infinity : (rules.salaryMin ? rules.salaryMin.v : -Infinity);
  const maxS = rules.salaryMax?.noLimit ? Infinity : (rules.salaryMax ? rules.salaryMax.v : Infinity);
  return tenureMonths >= minT && tenureMonths <= maxT && profile.salary10k >= minS && profile.salary10k <= maxS;
}
