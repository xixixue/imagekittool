import { hash, verify } from "@node-rs/argon2";

/**
 * Password hashing with Argon2id (SPEC §6.3).
 * @node-rs/argon2 ships prebuilt binaries (no native compilation required).
 *
 * `Algorithm` is exported as a const enum, whose members cannot be accessed
 * under `isolatedModules`. Argon2id is numeric value 2 in that enum, so we set
 * it directly and cast the options to the inferred parameter type.
 */
type Argon2Options = NonNullable<Parameters<typeof hash>[1]>;

const HASH_OPTIONS = {
  algorithm: 2, // Argon2id
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as Argon2Options;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, HASH_OPTIONS);
}

export async function verifyPassword(hashed: string, password: string): Promise<boolean> {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}
