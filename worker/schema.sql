CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,          -- game ID
  data TEXT NOT NULL,           -- JSON { disciples, expelled }
  rev INTEGER NOT NULL,         -- tăng 1 sau mỗi lần ghi, dùng để phát hiện xung đột
  updated_at TEXT NOT NULL
);
