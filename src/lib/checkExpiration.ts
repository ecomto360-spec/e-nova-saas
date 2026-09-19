import { differenceInHours, differenceInDays } from "date-fns";

export function isTenantExpired(tenantData: any): boolean {
  if (!tenantData) return false;

  let expired = false;

  if (tenantData.planExpiresAt) {
    const expiresAt = new Date(tenantData.planExpiresAt);
    const diffHours = differenceInHours(expiresAt, new Date());
    expired = diffHours <= 0;
  } else if (tenantData.trialStartDate) {
    const start = typeof tenantData.trialStartDate === 'object' && tenantData.trialStartDate.seconds 
      ? new Date(tenantData.trialStartDate.seconds * 1000)
      : new Date(tenantData.trialStartDate);
    const diffHours = differenceInHours(new Date(), start);
    expired = diffHours >= 14 * 24; // 14 days trial
  } else {
    // If neither exists, let's assume it's created now and wait for next login to set it, or default to false to not break existing users
    expired = false;
  }

  // Allow explicit override if active status is false
  if (tenantData.status === 'suspended') {
      expired = true;
  }

  return expired;
}
