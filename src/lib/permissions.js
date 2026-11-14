// permissions.js — Plan status, feature access by plan, permission checking
import { FEATURE_CATALOG, CRITICAL_FEATURES, getProfilePlanLevel, isFeatureAvailableForLevel } from './features';

// ── Trial Period ──
const TRIAL_DURATION_DAYS = 30;

// ── Trial Period ──
// دوره آزمایشی و سهمیه برای همهٔ صرافان برداشته شده است؛ استفاده نامحدود است.
// تنها محدودیت باقی‌مانده، سقف ایجاد گروه است (در chat.js).
export function getTrialStartDate(profile) {
  return null;
}

export function isInTrialPeriod(profile) {
  return false;
}

// Returns remaining days in the trial (0 if expired)
export function getTrialDaysRemaining(profile) {
  if (!isInTrialPeriod(profile)) return 0;
  const start = getTrialStartDate(profile);
  if (!start) return 0;
  const trialEnd = new Date(start);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
  const ms = trialEnd - new Date();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// ── Plan Status ──
// Returns: 'free' | 'trial' | 'paid_active' | 'paid_expired'
export function getPlanStatus(profile) {
  if (!profile) return 'free';
  const plan = String(profile.plan || 'free').toLowerCase();
  const paymentStatus = String(profile.payment_status || '').toLowerCase();
  const endDate = profile.paid_end_date || profile.quota_end_date;
  if (endDate) {
    const rawEnd = String(endDate);
    const endTime = /^\d{4}-\d{2}-\d{2}$/.test(rawEnd)
      ? new Date(`${rawEnd}T23:59:59.999`).getTime()
      : new Date(rawEnd).getTime();
    if (Number.isFinite(endTime) && endTime < Date.now()) return 'paid_expired';
  }
  if (paymentStatus === 'expired' || paymentStatus === 'cancelled') return 'paid_expired';
  if (plan !== 'free' && (!paymentStatus || ['paid', 'confirmed', 'active'].includes(paymentStatus))) return 'paid_active';
  return 'free';
}

// ── Is Paid ──
export function isPaidUser(profile) {
  return getPlanStatus(profile) === 'paid_active';
}

// ── Is Trial ──
export function isTrialUser(profile) {
  return getPlanStatus(profile) === 'trial';
}

// ── Plan Display ──
export function getPlanDisplay(profile) {
  const status = getPlanStatus(profile);
  if (status === 'paid_active') {
    const levelLabels = { 1: 'پایه فعال', 2: 'حرفه‌ای فعال', 3: 'ویژه فعال' };
    return { label: levelLabels[getProfilePlanLevel(profile)] || 'اشتراک فعال', color: 'text-green-600', bg: 'bg-green-50', icon: '✓' };
  }
  if (status === 'paid_expired') {
    return { label: 'منقضی‌شده', color: 'text-orange-600', bg: 'bg-orange-50', icon: '!' };
  }
  if (status === 'trial') {
    return { label: 'دوره آزمایشی', color: 'text-purple-600', bg: 'bg-purple-50', icon: '★' };
  }
  return { label: 'رایگان', color: 'text-blue-600', bg: 'bg-blue-50', icon: '○' };
}

// ── Feature Access by Plan ──
// Checks if a feature is accessible for the user's current plan
export function isFeatureAccessible(features, key, profile, paidSystemEnabled = true) {
  // When paid system is disabled, all features are accessible to everyone
  if (paidSystemEnabled === false) return true;
  if (CRITICAL_FEATURES.includes(key)) return true; // critical always accessible

  const level = getProfilePlanLevel(profile);
  return isFeatureAvailableForLevel(features, key, level);
}

// ── Permission Check ──
// Checks if user has a specific permission for a section
// permissions: array of UserPermission records for this user
// section: the feature_key / section name
// action: 'view' | 'create' | 'edit' | 'delete' | 'print' | 'report' | 'settings'
export function hasPermission(permissions, section, action) {
  if (!permissions || permissions.length === 0) return false;
  const perm = permissions.find(p => p.section === section);
  if (!perm) return false;
  const field = `can_${action}`;
  return perm[field] === true;
}

// ── Role Hierarchy ──
export const ROLE_HIERARCHY = {
  creator: 100,
  admin: 80,
  sarraaf: 50,
  employee: 30,
  customer: 10,
};

export function getRoleLevel(role) {
  return ROLE_HIERARCHY[role] || 0;
}

export function canManageRole(myRole, targetRole) {
  return getRoleLevel(myRole) > getRoleLevel(targetRole);
}

// ── Auto-expire check ──
export function shouldExpirePaidPlan(profile) {
  return getPlanStatus(profile) === 'paid_expired' && profile?.plan !== 'free';
}

// ── Read-Only Mode ──
// استفاده نامحدود است — حالت فقط‌خواندنی غیرفعال است.
export function isReadOnlyMode(profile) {
  return false;
}

// ── Quota Check ──
export function checkQuotaStatus(profile, featureKey, planQuotas) {
  const level = getProfilePlanLevel(profile);
  const legacyPlan = level === 1 ? 'free' : 'paid';
  const quota = planQuotas?.find(q => q.plan === `level_${level}` && q.feature_key === featureKey)
    || planQuotas?.find(q => q.plan === legacyPlan && q.feature_key === featureKey);
  if (!quota) return { unlimited: true, used: 0, limit: -1, remaining: Infinity };

  const used = profile?.quota_used || 0;
  const limit = quota.max_transactions ?? quota.max_custom ?? -1;
  if (limit < 0) return { unlimited: true, used, limit, remaining: Infinity };
  return { unlimited: false, used, limit, remaining: Math.max(0, limit - used) };
}