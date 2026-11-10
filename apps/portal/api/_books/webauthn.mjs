// Passkeys (Face ID, Touch ID, Windows Hello, a security key) as the second step into Books, with Node's own crypto
// only (no extra package). The browser gives the public key itself (getPublicKey(), SPKI) at registration, so no CBOR
// is parsed here; every sign-in proves possession of the private key over a one-time challenge for this site only.
import { createHash, createPublicKey, verify as cverify, randomBytes } from "node:crypto";

export const b64u = buf => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const unb64u = s => Buffer.from(String(s || "").replace(/-/g, "+").replace(/_/g, "/"), "base64");
export const newChallenge = () => b64u(randomBytes(32));
const sha = b => createHash("sha256").update(b).digest();
export const ALGS = { "-7": "ES256", "-257": "RS256", "-8": "EdDSA" };

// flags byte of authenticatorData: bit 0 user present, bit 2 user verified (biometric or PIN)
function checkAuthData(authData, rpId) {
  if (authData.length < 37) throw new Error("passkey: short authenticator data");
  if (!authData.subarray(0, 32).equals(sha(Buffer.from(rpId)))) throw new Error("passkey: made for another site");
  const flags = authData[32];
  if (!(flags & 0x01)) throw new Error("passkey: user not present");
  if (!(flags & 0x04)) throw new Error("passkey: Face ID, fingerprint or PIN was not used");
  return { signCount: authData.readUInt32BE(33) };
}
function checkClient(clientDataJSON, type, challenge, origin) {
  let c; try { c = JSON.parse(Buffer.from(clientDataJSON).toString("utf8")); } catch (e) { throw new Error("passkey: unreadable client data"); }
  if (c.type !== type) throw new Error("passkey: wrong step");
  if (c.challenge !== challenge) throw new Error("passkey: challenge does not match");
  if (c.origin !== origin) throw new Error("passkey: wrong address " + String(c.origin).slice(0, 60));
  if (c.crossOrigin) throw new Error("passkey: cross-origin use refused");
}
// registration: { id, clientDataJSON, authenticatorData, publicKey (SPKI, base64url), alg }
export function verifyRegistration(body, { challenge, origin, rpId }) {
  const cd = unb64u(body.clientDataJSON), ad = unb64u(body.authenticatorData), alg = String(body.alg);
  if (!ALGS[alg]) throw new Error("passkey: key type not supported");
  checkClient(cd, "webauthn.create", challenge, origin);
  checkAuthData(ad, rpId);
  if (!(ad[32] & 0x40)) throw new Error("passkey: no key in the registration");
  const spki = unb64u(body.publicKey); createPublicKey({ key: spki, format: "der", type: "spki" });   // throws on a bad key
  const id = String(body.id || ""); if (!/^[A-Za-z0-9_-]{16,1400}$/.test(id)) throw new Error("passkey: bad id");
  return { id, publicKey: b64u(spki), alg: +alg };
}
// sign-in: { id, clientDataJSON, authenticatorData, signature }
export function verifyAssertion(body, key, { challenge, origin, rpId }) {
  const cd = unb64u(body.clientDataJSON), ad = unb64u(body.authenticatorData), sig = unb64u(body.signature);
  checkClient(cd, "webauthn.get", challenge, origin);
  const { signCount } = checkAuthData(ad, rpId);
  const data = Buffer.concat([ad, sha(cd)]), pub = createPublicKey({ key: unb64u(key.public_key), format: "der", type: "spki" });
  const ok = String(key.alg) === "-8" ? cverify(null, data, pub, sig) : cverify("sha256", data, pub, sig);
  if (!ok) throw new Error("passkey: signature does not match");
  if (signCount && key.sign_count && signCount <= key.sign_count) throw new Error("passkey: counter went back (possible copy of the key)");
  return { signCount };
}
