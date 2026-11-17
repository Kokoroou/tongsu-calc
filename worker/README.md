# API đồng bộ (Cloudflare Worker + D1)

Cho phép nhiều thiết bị dùng chung một sổ theo game ID. Không có mật khẩu: ai biết game ID là đọc/ghi được sổ đó.

```bash
cd worker
npx wrangler d1 create tongsu            # chép database_id vào wrangler.toml
npx wrangler d1 execute tongsu --remote --file=schema.sql
npx wrangler deploy                      # in ra địa chỉ https://tongsu-sync.<tài-khoản>.workers.dev
```

Sau đó đặt địa chỉ đó vào `js/config.js`:

```js
window.SYNC_URL = 'https://tongsu-sync.<tài-khoản>.workers.dev';
```

Nên đổi `ALLOW_ORIGIN` trong `wrangler.toml` thành địa chỉ trang web của app (ví dụ `https://kokoroou.github.io`).
Để `SYNC_URL` trống thì app chỉ lưu trong trình duyệt như trước.

Cách hoạt động: mỗi sổ có số phiên bản `rev`. App kéo bản máy chủ khi mở, khi quay lại tab và mỗi 30 giây,
đẩy lên sau mỗi thay đổi. Nếu hai thiết bị cùng sửa, app hiện hộp chọn "Dùng bản máy chủ" / "Dùng bản máy này".
Lịch sử hoàn tác không đồng bộ, mỗi thiết bị giữ riêng.
