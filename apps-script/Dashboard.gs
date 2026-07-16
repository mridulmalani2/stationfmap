/**
 * The Map, dashboard builder.
 *
 * Run setupDashboard() once from the Apps Script editor. It is safe to re-run:
 * it rebuilds Dashboard and _tallies from scratch every time and never touches
 * responses_v2.
 *
 * Reads LABELS and HEADERS from Code.gs. Apps Script shares one global scope
 * across files, so Code.gs must be saved in this project first or this throws
 * on LABELS being undefined.
 *
 * Everything is written as live formulas rather than computed values, so the
 * dashboard keeps counting as responses arrive. It never needs re-running
 * except after a schema change.
 */

var DASH = "Dashboard";
var TALLY = "_tallies";

var INK = "#1A1A1E";
var ACCENT = "#A8481B";
var MUTED = "#74747E";
var PAPER = "#FAF9F7";
var RAISE = "#F3F1ED";
var LINE = "#E4E1DA";

/** Charted questions, in the order a reader should meet them. */
var CHARTS = [
  { field: "did",         title: "What they actually did when stuck",        type: "BAR" },
  { field: "found",       title: "How they found their last freelancer",     type: "BAR" },
  { field: "list_bench",  title: "Would you pool a freelancer you trust?",   type: "COLUMN" },
  { field: "vouch",       title: "Would you hire on a peer's vouch?",        type: "COLUMN" },
  { field: "skillmap",    title: "Would you skill-map your team?",           type: "COLUMN" },
  { field: "friction",    title: "What would stop you (multi-select)",       type: "BAR" },
  { field: "credit_take", title: "The credits test: a stranger books you",   type: "BAR" },
  { field: "broke",       title: "Out of credits, what then?",               type: "BAR" },
  { field: "flat_price",  title: "Should twenty minutes always cost the same?", type: "PIE" },
  { field: "need",        title: "Hit something you lacked in-house?",       type: "PIE" }
];

function setupDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (typeof LABELS === "undefined" || typeof HEADERS === "undefined") {
    throw new Error("Code.gs must be saved in this project first: LABELS and HEADERS come from it.");
  }
  if (!ss.getSheetByName(SHEET)) {
    // Create it empty so the formulas resolve instead of showing #REF while you
    // wait for the first response.
    sheet_(SHEET, HEADERS);
  }

  var tally = rebuild_(ss, TALLY);
  var dash = rebuild_(ss, DASH);

  var index = writeTallies_(tally);
  writeDashboard_(dash, tally, index);

  tally.hideSheet();
  ss.setActiveSheet(dash);
  ss.moveActiveSheet(1);
  return "Dashboard built. It updates itself as responses arrive.";
}

/** Drop and recreate, so re-running never doubles up charts or stale rows. */
function rebuild_(ss, name) {
  var old = ss.getSheetByName(name);
  if (old) ss.deleteSheet(old);
  return ss.insertSheet(name);
}

/** A1 letter for a HEADERS key, so column maths is never hand-counted. */
function col_(key) {
  var i = HEADERS.indexOf(key);
  if (i < 0) throw new Error("Unknown column: " + key);
  var n = i + 1, s = "";
  while (n > 0) {
    var r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * One block per charted question: the label list plus a live COUNTIF against
 * responses_v2. Charts point at these ranges.
 */
function writeTallies_(sh) {
  var index = {};
  var row = 1;

  for (var c = 0; c < CHARTS.length; c++) {
    var field = CHARTS[c].field;
    var map = LABELS[field];
    var labels = Object.keys(map);
    var letter = col_(field);

    sh.getRange(row, 1).setValue(CHARTS[c].title).setFontWeight("bold");
    row++;

    var start = row;
    for (var i = 0; i < labels.length; i++) {
      var text = map[labels[i]];
      sh.getRange(row, 1).setValue(text);
      // friction is a comma-joined multi-select, so a substring match is the
      // only honest count. The rest are exact single answers.
      var formula = field === "friction"
        ? '=COUNTIF(' + SHEET + '!' + letter + '2:' + letter + ',"*"&A' + row + '&"*")'
        : '=COUNTIF(' + SHEET + '!' + letter + '2:' + letter + ',A' + row + ')';
      sh.getRange(row, 2).setFormula(formula);
      row++;
    }

    index[field] = { start: start, end: row - 1 };
    row += 1;
  }
  return index;
}

function writeDashboard_(sh, tally, index) {
  sh.setHiddenGridlines(true);
  sh.setColumnWidth(1, 30);
  for (var c = 2; c <= 9; c++) sh.setColumnWidth(c, 130);

  var R = SHEET + "!";
  var rows = R + col_("received_at") + "2:" + col_("received_at");

  // ---- title
  sh.getRange("B2").setValue("The Map")
    .setFontSize(24).setFontFamily("Georgia").setFontColor(INK);
  sh.getRange("B3").setValue("Concept test at Station F. This sheet updates itself as responses arrive.")
    .setFontSize(10).setFontColor(MUTED);

  // ---- KPI cards
  var kpis = [
    ["Responses", '=COUNTA(' + rows + ')', "Total submitted"],
    ["Unprimed", '=COUNTIF(' + R + col_("skipped_pitch") + '2:' + col_("skipped_pitch") + ',TRUE)',
      "Skipped the pitch: your control group"],
    ["Credits rejected", '=IFERROR(TEXT(COUNTIF(' + R + col_("credits_rejected") + '2:' + col_("credits_rejected") +
      ',TRUE)/COUNTA(' + rows + '),"0%"),"0%")', "Wanted cash, not credits"],
    ["Median minutes", '=IFERROR(ROUND(MEDIAN(' + R + col_("duration_s") + '2:' + col_("duration_s") + ')/60,1),0)',
      "Time to complete"],
    ["Wrote a comment", '=COUNTA(' + R + col_("open_text") + '2:' + col_("open_text") + ')', "Left free text"],
    ["Left an email", '=COUNTA(' + R + col_("email") + '2:' + col_("email") + ')', "Wants to follow it"]
  ];

  var kr = 5;
  for (var k = 0; k < kpis.length; k++) {
    var c2 = 2 + k;
    sh.getRange(kr, c2).setValue(kpis[k][0])
      .setFontSize(9).setFontColor(MUTED).setFontWeight("bold");
    sh.getRange(kr + 1, c2).setFormula(kpis[k][1])
      .setFontSize(22).setFontFamily("Georgia")
      .setFontColor(k === 2 ? ACCENT : INK);
    sh.getRange(kr + 2, c2).setValue(kpis[k][2])
      .setFontSize(8).setFontColor(MUTED).setWrap(true);
  }
  sh.getRange(kr, 2, 3, kpis.length).setBackground(RAISE);
  sh.getRange(kr + 3, 2, 1, kpis.length).setBackground(LINE);
  sh.setRowHeight(kr + 3, 3);

  // ---- the headline finding
  sh.getRange("B10").setValue("The one that decides it")
    .setFontSize(9).setFontColor(ACCENT).setFontWeight("bold");
  sh.getRange("B11").setFormula(
    '=IF(COUNTA(' + rows + ')=0,"No responses yet.",' +
    'IF(COUNTIF(' + R + col_("credits_rejected") + '2:' + col_("credits_rejected") + ',TRUE)=0,' +
    '"Nobody has asked for cash instead of credits yet. The price signal objection is not showing up.",' +
    '"" & COUNTIF(' + R + col_("credits_rejected") + '2:' + col_("credits_rejected") + ',TRUE) & " of " & COUNTA(' + rows +
    ') & " want money rather than credits. That is the missing price signal arriving as data. Those rows are tinted in responses_v2."))')
    .setFontSize(11).setFontColor(INK).setWrap(true);
  sh.getRange("B11:G11").merge();
  sh.setRowHeight(11, 34);

  // ---- charts
  var top = 14;
  for (var i = 0; i < CHARTS.length; i++) {
    var spec = CHARTS[i];
    var pos = index[spec.field];
    var range = tally.getRange(pos.start, 1, pos.end - pos.start + 1, 2);

    var builder = sh.newChart()
      .setChartType(Charts.ChartType[spec.type])
      .addRange(range)
      .setPosition(top + Math.floor(i / 2) * 17, 2 + (i % 2) * 4, 0, 0)
      .setOption("title", spec.title)
      .setOption("titleTextStyle", { color: INK, fontSize: 12, bold: true })
      .setOption("width", 480)
      .setOption("height", 300)
      .setOption("legend", spec.type === "PIE" ? { position: "right" } : { position: "none" })
      .setOption("backgroundColor", PAPER)
      .setOption("colors", [ACCENT])
      .setOption("chartArea", { left: spec.type === "BAR" ? 210 : 60, width: "58%", height: "76%" });

    if (spec.type === "PIE") {
      builder.setOption("colors", [ACCENT, "#C98A6A", "#8FA3BF", "#3F6B4F", "#B9B4A9"])
             .setOption("pieSliceText", "value");
    }
    sh.insertChart(builder.build());
  }

  // ---- verbatims: the most valuable column in the sheet
  var vr = top + Math.ceil(CHARTS.length / 2) * 17 + 1;
  sh.getRange(vr, 2).setValue("What they said")
    .setFontSize(14).setFontFamily("Georgia").setFontColor(INK);
  sh.getRange(vr + 1, 2).setValue("Every free-text answer, newest first. Read these before trusting any chart above.")
    .setFontSize(9).setFontColor(MUTED);
  sh.getRange(vr + 2, 2).setFormula(
    '=IFERROR(QUERY(' + SHEET + '!' + col_("received_at") + '2:' + col_("started_at") +
    ',"select ' + col_("received_at") + ', ' + col_("open_text") +
    ' where ' + col_("open_text") + " is not null order by " + col_("received_at") +
    ' desc",0),"No comments yet.")');
  sh.getRange(vr + 2, 2, 1, 2).setFontWeight("bold");
  sh.setColumnWidth(3, 620);
  sh.getRange(vr + 2, 3, 60, 1).setWrap(true).setVerticalAlignment("top");

  sh.getRange("A1").activate();
}
