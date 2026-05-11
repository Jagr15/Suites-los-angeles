import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { AUTH_SALT } from "./common/hashing";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      // Configuración de hashing manual para compatibilidad con el Admin del Seed
      crypto: {
        async hashSecret(password) {
          const encoder = new TextEncoder();
          const saltData = encoder.encode(password + AUTH_SALT);
          const hashBuffer = await crypto.subtle.digest("SHA-512", saltData);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
          return `${AUTH_SALT}:${hashHex}`;
        },
        async verifySecret(password, secret) {
          if (!secret || !secret.includes(":")) {
            console.error("Invalid secret format in database:", secret);
            return false;
          }
          const [salt, hash] = secret.split(":");
          const encoder = new TextEncoder();
          const saltData = encoder.encode(password + salt);
          const hashBuffer = await crypto.subtle.digest("SHA-512", saltData);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
          
          if (hashHex !== hash) {
            console.warn("Contraseña incorrecta para el usuario");
            return false; 
          }
          return true; // Éxito
        },
      },
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
  ],
});
