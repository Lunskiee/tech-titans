// Asks the browser's password manager (Google Password Manager in Chrome, Edge) to save or
// update a password right away, instead of waiting for the browser to guess that a form was
// submitted. Browsers without the Credential Management API (Firefox, Safari) simply skip this.
export const rememberPassword = async ({ email, password, name = '' }) => {
  try {
    if (!email || !password) return false
    if (!window.PasswordCredential || !navigator.credentials?.store) return false

    const credential = new window.PasswordCredential({ id: email, password, name })
    await navigator.credentials.store(credential)
    return true
  } catch {
    return false
  }
}