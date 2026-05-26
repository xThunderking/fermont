const parseAllowedEmails = () => {
  const raw = String(import.meta.env.VITE_ALLOWED_EMAILS ?? '')

  if (!raw.trim()) {
    return []
  }

  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

const allowedEmails = parseAllowedEmails()
const allowedEmailSet = new Set(allowedEmails)

export const isAllowlistEnabled = allowedEmailSet.size > 0

export const isEmailAllowed = (email) => {
  if (!isAllowlistEnabled) {
    return true
  }

  return allowedEmailSet.has(String(email ?? '').trim().toLowerCase())
}
