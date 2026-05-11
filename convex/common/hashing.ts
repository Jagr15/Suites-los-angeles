/**
 * Utilidades de hashing consistentes con la configuración de Convex Auth y el Seed.
 */

export const AUTH_SALT = "supra-pos-salt-2026";

/**
 * Genera el string de "secreto" (salt:hash) compatible con nuestro Password Provider.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const saltData = encoder.encode(password + AUTH_SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-512", saltData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return `${AUTH_SALT}:${hashHex}`;
}

/**
 * Verifica si una contraseña coincide con el hash almacenado.
 */
export async function verifyPassword(password: string, storedSecret: string): Promise<boolean> {
  const hashedCandidate = await hashPassword(password);
  return hashedCandidate === storedSecret;
}
