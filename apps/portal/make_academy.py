"""Puts the Archē Broker Academy (internal edition) on the portal sign-in: apps/portal/academy.html.
Same address as the portal, so whoever is signed in to the portal is signed in to the academy, and progress
is saved in the database (migration 0007). Run after rebuilding the academy:  python3 make_academy.py
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "academy", "dist", "arche-broker-academy.html")
PLATFORM = ('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>\n'
            '<script src="config.js"></script>\n<script src="platform.js"></script>\n')
# "Back to the portal" sits in the header bar, not floating over the lesson (Morten, 7 Nov 2026)
BACK = ('<script>(function(){var b=document.querySelector(".bar");if(!b)return;var a=document.createElement("a");a.href="./";'
        'a.className="portal-link";a.textContent="Portal";a.title="Back to the portal";var s=b.querySelector(".sp");b.insertBefore(a,s?s.nextSibling:null);})();</script>\n')

# sign-in tracking on the academy page (Morten, 4 Nov 2026): when someone opens the academy signed in, the portal keeps
# the first and last time and how many times (train/<uid>/runs/academy), plus how many password sign-ins failed on this
# device before that (counted here, saved only once they are signed in: nothing is written for someone not signed in).
# The joining log in Team > Invitations shows it. It also fills in the trainee's name from the login on the start form.
TRACK = r"""<script>
(function(){
  var sb = window.__sb; if (!sb) return; var K = "arche.acadFails";
  var pw = sb.auth.signInWithPassword && sb.auth.signInWithPassword.bind(sb.auth);
  if (pw) sb.auth.signInWithPassword = function(a){ return pw(a).then(function(r){ try { if (r && r.error) { localStorage.setItem(K, String((+localStorage.getItem(K) || 0) + 1)); localStorage.setItem(K + "At", new Date().toISOString()); } } catch(e) {} return r; }); };
  sb.auth.getSession().then(function(x){
    var s = x && x.data && x.data.session; if (!s) return;
    var name = (s.user.user_metadata || {}).name || "";
    var fill = function(n){ var el = document.getElementById("nm"); if (el && !el.value && name) el.value = name; if (n > 0) setTimeout(function(){ fill(n - 1); }, 400); }; fill(15);
    window.claude.use("db").then(function(db){
      if (!db) return; var ref = db.doc("train/" + s.user.id + "/runs/academy"), t = new Date().toISOString(), f = 0, fa = null;
      try { f = +localStorage.getItem(K) || 0; fa = localStorage.getItem(K + "At"); } catch(e) {}
      return ref.get().then(function(d){
        var o = d.exists ? d.data() : {}, fails = (o.fails || 0) + f;
        return ref.set({kind: "academy-visit", first: o.first || t, last: t, count: (o.count || 0) + 1, fails: fails, lastFailAt: f ? fa : (o.lastFailAt || null)});
      }).then(function(){ try { localStorage.removeItem(K); localStorage.removeItem(K + "At"); } catch(e) {} });
    }).catch(function(){});
  });
})();
</script>
"""

def build():
    s = open(SRC, encoding="utf-8").read()
    i = s.index("<script")
    s = '<meta charset="utf-8">\n<meta name="robots" content="noindex,nofollow">\n' + s[:i] + PLATFORM + s[i:]
    j = s.rindex("</body>") if "</body>" in s else len(s)
    s = s[:j] + BACK + TRACK + s[j:]
    open(os.path.join(HERE, "academy.html"), "w", encoding="utf-8").write(s)
    print("academy.html", len(s))

if __name__ == "__main__":
    build()
