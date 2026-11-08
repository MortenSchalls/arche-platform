// Sealed hand-over between the research task and the checking job (Morten, 8 Nov 2026). GitHub keeps run inputs and logs,
// and investor names are for the Director only, so the plan and the findings travel encrypted:
//   - the job keeps its own key pair in private storage (bucket "agent"); its public key is printed with the plan
//   - the task makes a key pair for each run and gives its public key to the plan, which seals its answer with it
//   - the task seals its findings with the job's public key; only the job can open them
// RSA-OAEP (SHA-256) wraps a random AES-256-GCM key. No secret has to be set up by hand.
// CLI for the task:  node agentcrypt.mjs keygen <dir>   |   node agentcrypt.mjs open <privkey.pem> <sealed.txt>
//                    node agentcrypt.mjs seal <pubkey.pem or base64> <file.json>   (prints the sealed text)
import { generateKeyPairSync, publicEncrypt, privateDecrypt, randomBytes, createCipheriv, createDecipheriv, constants } from "crypto";
import { gzipSync, gunzipSync } from "zlib";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const pem = k => { const s = String(k || "").trim(); return s.startsWith("-----") ? s : Buffer.from(s, "base64").toString("utf8"); };
export function keygen() {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 3072, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });
  return { publicKey, privateKey };
}
export function seal(obj, publicKey) {
  const key = randomBytes(32), iv = randomBytes(12), c = createCipheriv("aes-256-gcm", key, iv);
  const d = Buffer.concat([c.update(gzipSync(Buffer.from(JSON.stringify(obj)))), c.final()]);
  const k = publicEncrypt({ key: pem(publicKey), padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, key);
  return "S1." + [k, iv, c.getAuthTag(), d].map(b => b.toString("base64")).join(".");
}
export function open(text, privateKey) {
  const [v, k, iv, tag, d] = String(text || "").trim().split(".");
  if (v !== "S1") throw new Error("Not a sealed batch.");
  const key = privateDecrypt({ key: pem(privateKey), padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, Buffer.from(k, "base64"));
  const dc = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64")); dc.setAuthTag(Buffer.from(tag, "base64"));
  return JSON.parse(gunzipSync(Buffer.concat([dc.update(Buffer.from(d, "base64")), dc.final()])).toString("utf8"));
}
// the job's own key pair, kept in the private storage bucket "agent" (created on first use)
export async function jobKeys(db) {
  const st = db.sb.storage;
  const got = await st.from("agent").download("key.json").catch(() => ({ error: true }));
  if (got && !got.error && got.data) return JSON.parse(await got.data.text());
  await st.createBucket("agent", { public: false }).catch(() => {});
  const k = keygen();
  const r = await st.from("agent").upload("key.json", new Blob([JSON.stringify(k)], { type: "application/json" }), { upsert: false, contentType: "application/json" });
  if (r.error) { const again = await st.from("agent").download("key.json"); if (again.error) throw new Error("agent key: " + r.error.message); return JSON.parse(await again.data.text()); }
  return k;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === "keygen") { mkdirSync(a || ".", { recursive: true }); const k = keygen(); writeFileSync((a || ".") + "/task.pub.pem", k.publicKey); writeFileSync((a || ".") + "/task.key.pem", k.privateKey, { mode: 0o600 });
    console.log(Buffer.from(k.publicKey).toString("base64")); }
  else if (cmd === "open") console.log(JSON.stringify(open(readFileSync(b, "utf8"), readFileSync(a, "utf8"))));
  else if (cmd === "seal") console.log(seal(JSON.parse(readFileSync(b, "utf8")), a.endsWith(".pem") ? readFileSync(a, "utf8") : a));
  else { console.error("usage: keygen <dir> | open <key.pem> <sealed.txt> | seal <pub.pem|base64> <file.json>"); process.exit(1); }
}
