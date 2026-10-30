/**
 * A short window after a successful login during which a 401 must not be
 * treated as an expired session.
 *
 * The login response and its `Set-Cookie` header do not reach the browser at
 * the same instant, and browsers store/attach the cookie at different speeds
 * (mobile Chrome especially). A background query that fires right after the
 * redirect can therefore answer 401 even though the login succeeded. Without
 * this window the global interceptor would clear the session and bounce the
 * user straight back to `/auth/login`.
 *
 * Inside the window the caller is responsible for the 401 (see the single
 * retry in `user-store.fetchUser`) and the session is left alone.
 */
const LOGIN_GRACE_MS = 20_000;

let loginGraceUntil = 0;

export const markLoginGrace = (durationMs: number = LOGIN_GRACE_MS) => {
  loginGraceUntil = Date.now() + durationMs;
};

export const clearLoginGrace = () => {
  loginGraceUntil = 0;
};

export const isInLoginGrace = () => Date.now() < loginGraceUntil;
