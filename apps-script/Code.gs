/**
 * The Map, collector.
 *
 * Pairs with index.html in this repo. The two must agree on payload keys, so if
 * you rename a survey key on the site, rename it here in the same commit.
 *
 * Deploy: Extensions > Apps Script > Deploy > Manage deployments > edit the
 * deployment the site posts to > Version: New version > Deploy. Editing rather
 * than creating keeps the URL, and a version-pinned deployment ignores HEAD, so
 * saving alone changes nothing live.
 */

var SHEET = "responses_v2";

/**
 * The survey sends short machine codes. Nobody should have to decode their own
 * research, so the sheet stores the human sentence and keeps the code out of it.
 * This map is the single source of truth: Dashboard.gs counts these same labels,
 * so editing a label here without re-running setupDashboard() will silently
 * strand the chart that counts it.
 */
var LABELS = {
  need: {
    several: "Yes, several times",
    once: "Yes, once",
    no: "No, we were covered"
  },
  did: {
    freelancer: "Hired an external freelancer",
    network: "Asked my own network",
    stationf: "Asked someone at Station F",
    ai: "Muddled through with AI",
    diy: "Did it ourselves, slowly",
    dropped: "Dropped it, never got done"
  },
  found: {
    referral: "Personal referral",
    platform: "A platform (Malt, Comet, Upwork)",
    agency: "An agency",
    cold: "Cold search",
    never: "Never hired one"
  },
  found_time: {
    hours: "A few hours",
    days: "A few days",
    weeks: "Weeks",
    na: "Not applicable"
  },
  list_bench: {
    yes: "Yes, straightforwardly",
    toggle: "Only with the off-season toggle",
    unused: "Only ones I am not using",
    no: "No, my network is my edge"
  },
  vouch: {
    enough: "Yes, a peer vouch is enough",
    whovouched: "Yes, if I can see who vouched",
    signal: "Only with a rating on top",
    vetagain: "No, I would vet from scratch"
  },
  skillmap: {
    all: "Yes, the whole team",
    some: "Only some people",
    approve: "Only with my approval first",
    no: "No"
  },
  friction: {
    competitor: "Advising a competitor",
    confidential: "Confidentiality or IP",
    time: "Nobody has the time",
    signal: "Looks like we have idle staff",
    awkward: "Feels awkward",
    nothing: "Nothing, I would just do it"
  },
  credit_take: {
    take: "I take it, that is the deal",
    credit: "I take it, but only for the credit",
    known: "Only if I already knew them",
    sit: "I would let it sit",
    cash: "I would want money, not credits"
  },
  broke: {
    earn: "Earn them back via the campus",
    pay: "Let me pay cash instead",
    give: "Go give some consultations",
    quit: "Nothing, I would stop using it"
  },
  flat_price: {
    flat: "Yes, flat is simpler",
    vary: "No, seniority should cost more",
    setown: "Let people price themselves",
    dunno: "No idea"
  }
};

/**
 * Column order for SHEET, written once when the sheet is first created.
 * Adding a key later? Append it at the END, never in the middle, or rows
 * written before the change stop lining up with their headers.
 */
var HEADERS = [
  "received_at",
  "need", "skill", "did",
  "found", "found_time",
  "list_bench", "vouch",
  "skillmap", "friction",
  "credit_take", "broke", "flat_price",
  "credits_rejected",
  "open_text", "email",
  "skipped_pitch", "read_to_slide",
  "duration_s", "time_per_q",
  "ua", "viewport", "started_at"
];

function doGet() {
  return ContentService.createTextOutput("The Map collector is live.");
}

function doPost(e) {
  // Serialise writers. Two submissions landing together would otherwise both
  // pass the duplicate check before either had recorded itself.
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (ignored) {}

  try {
    var p = JSON.parse(e.postData.contents);

    // The assistant was removed from the site and /api/ask no longer exists, so
    // nothing should send this. Swallow it rather than let it fall through and
    // append a row of blanks.
    if (p.kind === "question") return ok_();

    // One row per page load. The site's Send button used to stay live while the
    // POST was in flight, so a second press sent the same answers again: one
    // real test arrived three times. The site now blocks that, but this is the
    // backstop, because a retry or a flaky connection can still double-fire and
    // a duplicate is indistinguishable from a real response once it is in the
    // sheet. started_at is minted once per page load, so it is the natural key.
    if (p.started_at && seenBefore_(p.started_at)) return ok_();

    if (isLegacy_(p)) {
      logLegacy_(p);
    } else {
      logResponse_(p);
    }
    return ok_();
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch (ignored2) {}
  }
}

function ok_() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/** True if this page load has already been logged. Records it if not. */
function seenBefore_(startedAt) {
  var props = PropertiesService.getScriptProperties();
  var key = "seen:" + startedAt;
  if (props.getProperty(key)) return true;
  props.setProperty(key, String(new Date().getTime()));
  return false;
}

/** code -> sentence. Unknown codes pass through, so nothing is ever swallowed. */
function label_(field, code) {
  if (code === null || code === undefined || code === "") return "";
  var map = LABELS[field];
  if (!map) return String(code);
  return map[code] || String(code);
}

/** Multi-select: an array of codes becomes a readable list. */
function labelList_(field, codes) {
  if (!codes || !codes.length) return "";
  var out = [];
  for (var i = 0; i < codes.length; i++) out.push(label_(field, codes[i]));
  return out.join(", ");
}

/**
 * The old site sent q1_need, q2_action, q4_exchange and friends. A browser tab
 * cached before the rewrite can still submit one of those for days. Route it to
 * the old sheet rather than dropping the response or misfiling it as a v2 row.
 */
function isLegacy_(p) {
  return p.q1_need !== undefined ||
         p.q2_action !== undefined ||
         p.q4_exchange !== undefined ||
         p.q5_list !== undefined;
}

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
  return sh;
}

/** Survey responses, current schema. */
function logResponse_(p) {
  var sh = sheet_(SHEET, HEADERS);

  // The site now computes this, but keep the fallback so a response is never
  // logged without a duration if an older or partial payload arrives.
  var duration = p.duration_s;
  if (!duration && p.completed_at && p.started_at) {
    duration = Math.round((p.completed_at - p.started_at) / 1000);
  }

  // The missing price signal is the one failure mode with no answer, so these
  // two answers are the most valuable thing this sheet collects. Someone asking
  // for cash instead of credits is that objection showing up in real data.
  // Kept as a real column, not just a colour, so you can filter and count it.
  var rejectsCredits = (p.credit_take === "cash") || (p.broke === "pay");

  sh.appendRow([
    new Date(),
    label_("need", p.need), p.skill || "", label_("did", p.did),
    label_("found", p.found), label_("found_time", p.found_time),
    label_("list_bench", p.list_bench), label_("vouch", p.vouch),
    label_("skillmap", p.skillmap), labelList_("friction", p.friction),
    label_("credit_take", p.credit_take), label_("broke", p.broke),
    label_("flat_price", p.flat_price),
    rejectsCredits,
    p.open_text || "", p.email || "",
    // TRUE means they answered before reading the pitch. Those responses are the
    // unprimed control: compare them against the rest before trusting any signal.
    p.skipped_pitch === true,
    p.read_to_slide || "",
    duration || "",
    JSON.stringify(p.step_ms || {}),
    p.ua || "",
    (p.vw || "") + "x" + (p.vh || ""),
    p.started_at ? new Date(p.started_at) : ""
  ]);

  if (rejectsCredits) {
    sh.getRange(sh.getLastRow(), 1, 1, HEADERS.length).setBackground("#FCE8DF");
  }
}

/** Pre-rewrite payloads, kept so a cached tab cannot silently lose a response. */
function logLegacy_(p) {
  var sh = sheet_("responses", [
    "received_at", "q1_need", "q1_skill", "q2_action", "q3_reach", "q3_friction",
    "q4_exchange", "q4_depends", "q5_list", "q5_trust", "q5_why", "open_text",
    "email", "time_total_s", "time_per_step", "ua", "viewport", "started_at"
  ]);
  var total = "";
  if (p.completed_at && p.started_at) {
    total = Math.round((p.completed_at - p.started_at) / 1000);
  }
  sh.appendRow([
    new Date(),
    p.q1_need || "", p.q1_skill || "", p.q2_action || "", p.q3_reach || "",
    (p.q3_friction || []).join(", "),
    p.q4_exchange || "", p.q4_depends || "", p.q5_list || "",
    p.q5_trust || "", p.q5_why || "",
    p.open_text || "", p.email || "",
    total,
    JSON.stringify(p.step_times || {}),
    p.ua || "",
    (p.vw || "") + "x" + (p.vh || ""),
    p.started_at ? new Date(p.started_at) : ""
  ]);
}
