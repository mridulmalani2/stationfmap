/**
 * The Map, collector.
 *
 * Pairs with index.html in this repo. The two must agree on payload keys, so if
 * you rename a survey key on the site, rename it here in the same commit. The
 * previous version of this script drifted out of sync and silently dropped
 * q5_trust on every response, which is the failure this file lives here to stop.
 *
 * Deploy: Extensions > Apps Script > Deploy > Manage deployments > edit >
 * New version. Re-deploy after editing, or the old code keeps serving.
 */

/**
 * New sheet on purpose. sheet_() only writes headers when it creates the sheet,
 * so appending the new schema to the existing "responses" tab would file
 * credit_take under the q3_reach column and misalign every row. Old data stays
 * where it is, untouched and still readable.
 */
var SHEET = "responses_v2";

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
  "duration_s", "time_per_q",
  "ua", "viewport", "started_at"
];

function doGet() {
  return ContentService.createTextOutput("The Map collector is live.");
}

function doPost(e) {
  try {
    var p = JSON.parse(e.postData.contents);

    if (p.kind === "question") {
      // The assistant was removed from the site and /api/ask no longer exists,
      // so nothing should send this any more. Swallow it rather than let it
      // fall through to logResponse_ and append a row of blanks.
      return ok_();
    }

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
  }
}

function ok_() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
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
    p.need || "", p.skill || "", p.did || "",
    p.found || "", p.found_time || "",
    p.list_bench || "", p.vouch || "",
    p.skillmap || "", (p.friction || []).join(", "),
    p.credit_take || "", p.broke || "", p.flat_price || "",
    rejectsCredits,
    p.open_text || "", p.email || "",
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
