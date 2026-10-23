"""Puts the Archē Broker Academy (internal edition) on the portal sign-in: apps/portal/academy.html.
Same address as the portal, so whoever is signed in to the portal is signed in to the academy, and progress
is saved in the database (migration 0007). Run after rebuilding the academy:  python3 make_academy.py
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "academy", "dist", "arche-broker-academy.html")
PLATFORM = ('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>\n'
            '<script src="config.js"></script>\n<script src="platform.js"></script>\n')
BACK = ('<a href="./" style="position:fixed;right:12px;bottom:12px;z-index:50;font:600 12px/1 system-ui,sans-serif;letter-spacing:.06em;'
        'text-transform:uppercase;background:#2b2e33;color:#f3f5f8;padding:10px 14px;border-radius:4px;text-decoration:none">Back to the portal</a>\n')

def build():
    s = open(SRC, encoding="utf-8").read()
    i = s.index("<script")
    s = '<meta charset="utf-8">\n<meta name="robots" content="noindex,nofollow">\n' + s[:i] + PLATFORM + s[i:]
    j = s.rindex("</body>") if "</body>" in s else len(s)
    s = s[:j] + BACK + s[j:]
    open(os.path.join(HERE, "academy.html"), "w", encoding="utf-8").write(s)
    print("academy.html", len(s))

if __name__ == "__main__":
    build()
