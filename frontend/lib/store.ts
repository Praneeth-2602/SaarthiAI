import type { Session } from "@/lib/types";

const SESSION_KEY = "saarthi.session";
const CURRENT_CASE_KEY = "saarthi.currentCase";
const PENDING_PHONE_KEY = "saarthi.pendingPhone";
const PENDING_OTP_KEY = "saarthi.pendingOtp";

export const getSession = (): Session | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
};

export const saveSession = (session: Session) => {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(CURRENT_CASE_KEY);
};

export const getCurrentCaseId = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem(CURRENT_CASE_KEY);

export const setCurrentCaseId = (caseId: string) => {
  window.localStorage.setItem(CURRENT_CASE_KEY, caseId);
};

export const setPendingPhone = (phone: string) => {
  window.sessionStorage.setItem(PENDING_PHONE_KEY, phone);
};

export const getPendingPhone = () =>
  typeof window === "undefined" ? null : window.sessionStorage.getItem(PENDING_PHONE_KEY);

export const setPendingOtp = (otp: string) => {
  window.sessionStorage.setItem(PENDING_OTP_KEY, otp);
};

export const getPendingOtp = () =>
  typeof window === "undefined" ? null : window.sessionStorage.getItem(PENDING_OTP_KEY);
