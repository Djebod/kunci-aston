-- ============================================================
--  LANGKAH PASANG 1 — BUAT TABEL DI NEON
--  Tempel SELURUH isi file ini ke Neon → SQL Editor → klik RUN.
--
--  PENTING: SQL Editor HANYA untuk perintah SQL (CREATE TABLE, SELECT, dll).
--  JANGAN menempel file .js (JavaScript) ke sini.
--  Error "syntax error at or near const" muncul karena tadi yang
--  tertempel adalah isi skrip migrasi-gatepass-firestore-ke-neon.js
--  (itu JavaScript, dijalankan pakai `node`, BUKAN di SQL Editor).
-- ============================================================

-- ===== TABEL UTAMA GATE PASS =====
CREATE TABLE IF NOT EXISTS gatepass (
  id              BIGSERIAL PRIMARY KEY,
  gp_id           TEXT,
  requester_email TEXT NOT NULL,
  requester_name  TEXT,
  department      TEXT,
  dept_head_emails TEXT[] DEFAULT '{}',
  type            TEXT,
  purpose         TEXT,
  status          TEXT,
  item_status     TEXT DEFAULT '',
  dept_head_name  TEXT DEFAULT '', dept_head_email TEXT DEFAULT '', dept_head_remark TEXT DEFAULT '', dept_head_at TIMESTAMPTZ,
  finance_name    TEXT DEFAULT '', finance_email TEXT DEFAULT '', finance_remark TEXT DEFAULT '', finance_at TIMESTAMPTZ,
  hr_name         TEXT DEFAULT '', hr_email TEXT DEFAULT '', hr_remark TEXT DEFAULT '', hr_at TIMESTAMPTZ,
  rejected_by     TEXT DEFAULT '', rejected_role TEXT DEFAULT '', rejected_reason TEXT DEFAULT '', rejected_at TIMESTAMPTZ,
  arsip           BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ===== BARANG (banyak per gate pass) =====
CREATE TABLE IF NOT EXISTS gatepass_items (
  id          BIGSERIAL PRIMARY KEY,
  gatepass_id BIGINT REFERENCES gatepass(id) ON DELETE CASCADE,
  name        TEXT, qty INT DEFAULT 1, unit TEXT DEFAULT 'pcs',
  description TEXT DEFAULT '', photo_url TEXT DEFAULT ''
);

-- ===== LOG APPROVAL / AKTIVITAS =====
CREATE TABLE IF NOT EXISTS gatepass_log (
  id          BIGSERIAL PRIMARY KEY,
  gatepass_id BIGINT REFERENCES gatepass(id) ON DELETE CASCADE,
  actor       TEXT, actor_email TEXT, role TEXT,
  action      TEXT, note TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ===== INDEX (biar query cepat & hemat) =====
CREATE INDEX IF NOT EXISTS idx_gp_status     ON gatepass(status) WHERE arsip = FALSE;
CREATE INDEX IF NOT EXISTS idx_gp_requester  ON gatepass(requester_email);
CREATE INDEX IF NOT EXISTS idx_gp_itemstatus ON gatepass(item_status) WHERE arsip = FALSE;
CREATE INDEX IF NOT EXISTS idx_gp_created    ON gatepass(created_at DESC);

-- ===== CEK HASIL (opsional, jalankan setelah di atas sukses) =====
-- SELECT COUNT(*) FROM gatepass;
