// Smoke helper: set content hanya untuk res_scratch, reset cache, cetak state.
const Database = require("better-sqlite3");
const db = new Database("./data/peta-belajar.db");
if (process.argv[2] === "prep") {
  db.prepare("UPDATE resources SET content = NULL").run();
  db.prepare(
    "UPDATE resources SET content = 'Scratch adalah platform dari MIT. Kamu menyusun blok seperti puzzle untuk membuat cerita dan permainan. Blok bergerak memakai perulangan, dan dengan kondisi program bisa mengambil keputusan.' WHERE id = 'res_scratch'",
  ).run();
  db.prepare("DELETE FROM materi_cache").run();
  console.log("prep: content=1 (res_scratch), cache dibersihkan");
} else {
  const rows = db.prepare("SELECT resource_id, learning_style, substr(payload_json,1,80) p FROM materi_cache").all();
  console.log("materi_cache rows:", rows.length);
  for (const r of rows) console.log(" ", r.resource_id, r.learning_style, r.p + "...");
  console.log("http in payload?", rows.some((r) => r.p.includes("http")) ? "CEK LENGSUNG" : "tidak (prefix)");
}
