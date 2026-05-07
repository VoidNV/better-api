let verified = false

export function isAuthSessionVerified() {
  return verified
}

export function markAuthSessionVerified() {
  verified = true
}

export function resetAuthSessionVerified() {
  verified = false
}
