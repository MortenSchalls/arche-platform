(function(){
const store = Object.assign({}, window.__SEED || {}); const subs = [];
const snapDoc = p => ({id:p.split("/").pop(), exists: p in store, data: () => store[p], metadata:{fromCache:false,hasPendingWrites:false}});
const colDocs = c => Object.keys(store).filter(k => k.startsWith(c + "/") && k.slice(c.length + 1).indexOf("/") < 0).sort().map(snapDoc);
const fire = () => setTimeout(() => subs.forEach(s => s()), 0);
function doc(p){ return {id:p.split("/").pop(), path:p, get: async () => snapDoc(p), set: async d => { store[p] = JSON.parse(JSON.stringify(d)); fire(); }, update: async d => { store[p] = Object.assign({}, store[p], d); fire(); }, delete: async () => { delete store[p]; fire(); },
  onSnapshot(fn){ const s = () => fn(snapDoc(p)); subs.push(s); setTimeout(s, 0); return () => {}; }, collection: c => col(p + "/" + c)}; }
function col(c){ return {path:c, doc: id => doc(c + "/" + (id || "x" + Math.random().toString(36).slice(2))), onSnapshot(fn){ const s = () => { const docs = colDocs(c); fn({docs, size:docs.length, empty:!docs.length, docChanges:()=>[], metadata:{}}); }; subs.push(s); setTimeout(s, 0); return () => {}; }, get: async () => { const docs = colDocs(c); return {docs, size:docs.length, empty:!docs.length}; }}; }
const db = {doc, collection: col};
const user = {id: async () => window.__UID || "u_owner", isOwner: async () => !!window.__OWNER, canEdit: async () => !!window.__EDIT, can: async () => true,
  profiles: async ids => Object.fromEntries([].concat(ids).map(i => [i, {id:i, name: i === "u_owner" ? "Morten" : "", avatarUrl:"", color:"#888", email:null, isMe:false, guest:false}])), me: async () => ({name: window.__UID === 'u_owner' ? 'Morten' : 'Example Broker', id: window.__UID})};
window.claude = {use: async n => n === "db" ? db : n === "user" ? user : n === "sample" ? Object.assign(async (inp, o) => { const t = "AI ANSWER for: " + String(typeof inp === "string" ? inp : inp[inp.length-1].content).slice(-60); if (o && o.onText) o.onText({text:t, delta:t}); window.__lastPrompt = inp; return {text:t, truncated:false}; }, {json: async () => ({})}) : n === "assets" ? {upload: async f => ({id:"a1", url:"#"})} : null};
window.__store = store;
})();
