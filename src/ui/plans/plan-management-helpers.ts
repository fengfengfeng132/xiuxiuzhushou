import { currentDateKey, type StudyPlan } from "../../domain/model.js";

export function createManagedPlanOrder(plans: StudyPlan[], dateKey: string): string[] {
  return plans.filter((plan) => plan.status === "pending" && currentDateKey(plan.createdAt) === dateKey).map((plan) => plan.id);
}

export function reorderManagedPlanIds(planIds: string[], draggedId: string, targetId: string): string[] {
  if (draggedId === targetId) {
    return planIds;
  }

  const draggedIndex = planIds.indexOf(draggedId);
  const targetIndex = planIds.indexOf(targetId);
  if (draggedIndex === -1 || targetIndex === -1) {
    return planIds;
  }

  const nextIds = [...planIds];
  const [movedId] = nextIds.splice(draggedIndex, 1);
  nextIds.splice(targetIndex, 0, movedId);
  return nextIds;
}

export function applyManagedPlanOrder(plans: StudyPlan[], dateKey: string, managedPlanIds: string[]): StudyPlan[] {
  const orderedPlanLookup = new Map(plans.map((plan) => [plan.id, plan]));
  const orderedManagedPlans = managedPlanIds
    .map((planId) => orderedPlanLookup.get(planId))
    .filter((plan): plan is StudyPlan => {
      if (!plan) {
        return false;
      }
      return plan.status === "pending" && currentDateKey(plan.createdAt) === dateKey;
    });
  const managedPlanIdSet = new Set(orderedManagedPlans.map((plan) => plan.id));
  const nextPlans: StudyPlan[] = [];
  let insertedManagedPlans = false;

  for (const plan of plans) {
    const isManagedPlan = managedPlanIdSet.has(plan.id);
    if (isManagedPlan) {
      if (!insertedManagedPlans) {
        nextPlans.push(...orderedManagedPlans);
        insertedManagedPlans = true;
      }
      continue;
    }
    nextPlans.push(plan);
  }

  if (!insertedManagedPlans) {
    nextPlans.push(...orderedManagedPlans);
  }

  return nextPlans;
}
