#!/usr/bin/env python3
"""
Generate mechanical config JSON from the authoritative AI-Quiz source sheets.

Source of truth = the five docs in the Blue Light Health "AI Quiz" Drive folder:
  https://drive.google.com/drive/u/0/folders/1aouYdVqSbrQgGjASTnfruDSqvI-7kg-4
See config/source/SOURCES.md for the doc -> config mapping.

Inputs  (config/source/, committed for provenance):
  - scoring-rules.md        → tags.json, phenotype-meta.json, rule-weights.json
  - subfeature-questions.md → platforms.json, subfeature-questions.json

Hand-authored config (gates, tie-breakers, severity, params, phenotype prose,
hook→job map, quiz copy) is NOT touched by this script.

To refresh: re-export the changed sheet to its .md in config/source/, then run
this script. Hand-authored JSON is edited directly.

Run:  python3 scripts/generate-config.py
"""
import json
import re
import sys
from pathlib import Path
from collections import OrderedDict

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "config" / "source"
OUT = ROOT / "src" / "config"
OUT.mkdir(parents=True, exist_ok=True)

warnings: list[str] = []


def unescape(s: str) -> str:
    s = s.strip()
    # strip markdown bold/emphasis wrappers and escapes
    s = s.replace("\\_", "_").replace("\\*", "*").replace("\\-", "-")
    s = s.replace("\\<", "<").replace("\\>", ">").replace("\\|", "|")
    s = s.replace("&#10;", " ")
    s = s.replace("**", "").replace("*", "")
    return s.strip()


def slug(s: str) -> str:
    s = unescape(s).lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_")


def norm_display(s: str) -> str:
    """Normalize a hook display name to its tag id form (strip leading 'the')."""
    s = unescape(s).lower()
    s = re.sub(r"^the\s+", "", s)
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_")


def parse_tables(md: str):
    """Yield (header_cells, [row_cells, ...]) for each markdown pipe table."""
    lines = md.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith("|") and i + 1 < len(lines) and re.match(
            r"^\|[\s:\-|]+\|$", lines[i + 1].strip()
        ):
            header = [unescape(c) for c in line.strip("|").split("|")]
            rows = []
            j = i + 2
            while j < len(lines) and lines[j].strip().startswith("|"):
                cells = [c.strip() for c in lines[j].strip().strip("|").split("|")]
                rows.append(cells)
                j += 1
            yield header, rows
            i = j
        else:
            i += 1


def find_table(tables, *required_headers):
    want = [h.lower() for h in required_headers]
    for header, rows in tables:
        hl = [h.lower() for h in header]
        if all(any(w in h for h in hl) for w in want):
            return header, rows
    return None, None


# ── Parse scoring-rules.md ──────────────────────────────────────────────────
scoring_md = (SRC / "scoring-rules.md").read_text()
tables = list(parse_tables(scoring_md))

# 1) Tag dictionary  | Signal Type | Tag ID | Display Name |
_, tag_rows = find_table(tables, "signal type", "tag id", "display name")
tags = []
hook_display_to_id = {}
for r in tag_rows:
    if len(r) < 3:
        continue
    stype, tag_id, display = unescape(r[0]), unescape(r[1]), unescape(r[2])
    if not stype or not tag_id:
        continue
    tags.append({"type": stype, "tag": tag_id, "label": display})
    if stype == "hook":
        hook_display_to_id[norm_display(display)] = tag_id

# 2) Phenotype meta  | Phenotype ID | Phenotype Name | Short Result Label |
_, ph_rows = find_table(tables, "phenotype id", "phenotype name", "short result label")
phenotype_meta = []
for r in ph_rows:
    if len(r) < 3:
        continue
    pid, name, short = unescape(r[0]), unescape(r[1]), unescape(r[2])
    if not pid or pid.lower() == "phenotype id":
        continue
    phenotype_meta.append({"id": pid, "name": name, "shortLabel": short})

# 3) Rule weights  | Phenotype ID | Phenotype Name | Signal Type | Tag ID | Weight | Notes |
_, rw_rows = find_table(
    tables, "phenotype id", "signal type", "tag id", "weight"
)
rule_weights = []
for r in rw_rows:
    if len(r) < 5:
        continue
    pid, stype, tag_id, weight = (
        unescape(r[0]),
        unescape(r[2]),
        unescape(r[3]),
        unescape(r[4]),
    )
    notes = unescape(r[5]) if len(r) > 5 else ""
    if not pid or pid.lower() == "phenotype id":
        continue
    try:
        w = float(weight)
    except ValueError:
        warnings.append(f"rule-weights: non-numeric weight {weight!r} for {pid}/{tag_id}")
        continue
    row = {"phenotype": pid, "type": stype, "tag": tag_id, "weight": w}
    if notes:
        row["notes"] = notes
    rule_weights.append(row)

# ── Parse subfeature-questions.md ───────────────────────────────────────────
sub_md = (SRC / "subfeature-questions.md").read_text()
sub_tables = list(parse_tables(sub_md))
_, sub_rows = find_table(sub_tables, "platform", "sub-feature", "question", "hook", "answer option")

# Curated platform-feature tags (platform-level + subfeature-level overrides).
PF_BY_PLATFORM = {
    "betting_trading_gambling": "betting_trading_gambling",
    "adult_content": "adult_or_intimacy_content",
}
PF_BY_SUBFEATURE = {
    ("conversational_chatbots", "companionship"): "ai_chatbot_support",
    ("conversational_chatbots", "therapy_or_emotional_support"): "ai_chatbot_support",
    ("conversational_chatbots", "romantic_intimacy_simulation"): "adult_or_intimacy_content",
    ("conversational_chatbots", "roleplay"): "adult_or_intimacy_content",
    ("ai_chat_gpt_gemini_claude", "ai_tools"): "ai_chatbot_support",
    ("pc_gaming_console_gaming", "competitive_ranked"): "gaming_ranked_progress",
    ("pc_gaming_console_gaming", "multiplayer_social"): "gaming_ranked_progress",
    ("twitch", "livestreams"): "creator_streamer_media",
    ("twitch", "live_chat"): "creator_streamer_media",
    ("tiktok", "following_specific_creators"): "creator_streamer_media",
    ("adult_content", "onlyfans"): "creator_streamer_media",
    ("adult_content", "live_cams"): "creator_streamer_media",
    ("discord", "servers_and_channels"): "community_server_group",
    ("discord", "voice_chat"): "community_server_group",
    ("reddit", "subreddits"): "community_server_group",
    ("meta_facebook", "groups"): "community_server_group",
    ("twitter", "spaces"): "community_server_group",
    ("instagram", "posts"): "posting_metrics",
    ("instagram", "stories"): "posting_metrics",
    ("snapchat", "stories"): "posting_metrics",
    ("youtube", "search"): "news_health_search",
    ("twitter", "trending_and_search"): "news_health_search",
    ("tiktok", "tiktok_shop"): "shopping_deals_marketplace",
    ("meta_facebook", "marketplace"): "shopping_deals_marketplace",
}

platforms = OrderedDict()        # pslug -> {id,label,subfeatures:OrderedDict}
questions = OrderedDict()        # (pslug,sslug) -> {platform,subfeature,question,options[]}
seen_pf_subs = set()

for r in sub_rows:
    if len(r) < 5:
        continue
    plat, sub, q, hook_disp, answer = (unescape(r[0]), unescape(r[1]), unescape(r[2]), r[3], r[4])
    if not plat or plat.lower() == "platform":
        continue
    pslug, sslug = slug(plat), slug(sub)
    hook_id = hook_display_to_id.get(norm_display(hook_disp))
    if hook_id is None:
        warnings.append(f"subfeature: unmapped hook {hook_disp!r} ({plat}/{sub})")
        continue

    plat_entry = platforms.setdefault(pslug, {"id": pslug, "label": plat, "subfeatures": OrderedDict()})
    sub_entry = plat_entry["subfeatures"].setdefault(
        sslug, {"id": sslug, "label": sub, "potentialHooks": []}
    )
    if hook_id not in sub_entry["potentialHooks"]:
        sub_entry["potentialHooks"].append(hook_id)
    pf = PF_BY_SUBFEATURE.get((pslug, sslug)) or PF_BY_PLATFORM.get(pslug)
    if pf:
        sub_entry["platformFeature"] = pf
        seen_pf_subs.add((pslug, sslug))

    qkey = (pslug, sslug)
    qentry = questions.setdefault(
        qkey, {"platform": pslug, "subfeature": sslug, "question": unescape(q), "options": []}
    )
    opt_id = f"{sslug}_{hook_id}"
    n = sum(1 for o in qentry["options"] if o["id"].startswith(opt_id))
    if n:
        opt_id = f"{opt_id}_{n+1}"
    qentry["options"].append({"id": opt_id, "hook": hook_id, "text": unescape(answer)})

# warn on curated keys that never matched a real subfeature (typo guard)
for key in PF_BY_SUBFEATURE:
    if key not in seen_pf_subs:
        warnings.append(f"platform-feature map: unused key {key} (slug mismatch?)")

platforms_out = []
for p in platforms.values():
    subs = []
    for s in p["subfeatures"].values():
        item = {"id": s["id"], "label": s["label"], "potentialHooks": s["potentialHooks"]}
        if "platformFeature" in s:
            item["platformFeature"] = s["platformFeature"]
        subs.append(item)
    entry = {"id": p["id"], "label": p["label"]}
    if p["id"] in PF_BY_PLATFORM:
        entry["platformFeature"] = PF_BY_PLATFORM[p["id"]]
    entry["subfeatures"] = subs
    platforms_out.append(entry)

questions_out = list(questions.values())


def write(name, data):
    (OUT / name).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"  wrote {name:32} ({len(data)} entries)")


print("Generated config:")
write("tags.json", tags)
write("phenotype-meta.json", phenotype_meta)
write("rule-weights.json", rule_weights)
write("platforms.json", platforms_out)
write("subfeature-questions.json", questions_out)

print(f"\nSummary: {len(phenotype_meta)} phenotypes, {len(rule_weights)} rule-weight rows, "
      f"{len(platforms_out)} platforms, "
      f"{sum(len(p['subfeatures']) for p in platforms_out)} sub-features, "
      f"{sum(len(q['options']) for q in questions_out)} answer options, {len(tags)} tags")

if warnings:
    print(f"\n⚠ {len(warnings)} warning(s):")
    for w in warnings:
        print("  -", w)
else:
    print("\n✓ no warnings")
