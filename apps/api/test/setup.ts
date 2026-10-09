import { rmSync } from "node:fs";

// DB tes deterministik: hapus file lama (beserta -wal/-shm) sebelum
// modul apa pun membuka koneksi dan migrasi+seed dijalankan.
for (const suffix of ["", "-wal", "-shm"]) {
  rmSync(`./data/test.db${suffix}`, { force: true });
}
