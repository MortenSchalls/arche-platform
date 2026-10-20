// Shared start-up for every job: check the secrets first, and report any failure as a GitHub
// annotation (shown on the run's summary page) in plain words.
export async function main(name, needs, fn) {
  const missing = needs.filter(k => !process.env[k]);
  if (missing.length) {
    console.log(`::error title=${name}::Missing GitHub secret(s): ${missing.join(", ")}. Add them under Settings → Secrets and variables → Actions.`);
    process.exit(1);
  }
  if (process.env.SUPABASE_URL && !/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(process.env.SUPABASE_URL))
    console.log(`::warning title=${name}::SUPABASE_URL looks unusual; expected https://<project>.supabase.co`);
  try {
    const out = await fn();
    const note = out && out.note ? " " + String(out.note).replace(/\n/g, " ").slice(0, 900) : "";
    console.log(`::notice title=${name}::Finished.${note}`);
    return out;
  } catch (e) {
    const cause = e && e.cause ? " (cause: " + (e.cause.code || "") + " " + (e.cause.message || "") + ")" : "";
    const msg = (String(e && e.message || e) + cause).replace(/sb_secret_[A-Za-z0-9_-]+|sk-ant-[A-Za-z0-9_-]+/g, "[key]").replace(/\n/g, " ").slice(0, 500);
    console.log(`::error title=${name} failed::${msg}`);
    console.error(e);
    process.exit(1);
  }
}
