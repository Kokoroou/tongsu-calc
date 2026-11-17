/*
 * Lớp lưu trữ. Hiện lưu trong trình duyệt (localStorage).
 * TODO (chưa làm): đồng bộ đa nền tảng. Chỉ cần thay load/save bằng bản gọi máy chủ,
 * phần tính toán trong logic.js không phải sửa.
 */
(function (root) {
  const KEY = 'tlts-truyen-cong-v1';
  const ACTIVE_KEY = 'tlts-truyen-cong-active';
  const PROFILE_PREFIX = KEY + ':';
  const ID_MAX = 40;

  /** Game ID: bỏ khoảng trắng thừa, giới hạn độ dài. Rỗng = hồ sơ cũ/chưa đặt ID. */
  const cleanId = (id) => String(id == null ? '' : id).trim().slice(0, ID_MAX);
  /** Mỗi game ID một khóa riêng; ID rỗng dùng khóa cũ nên dữ liệu trước đây không bị mất. */
  const keyOf = (id) => (id ? PROFILE_PREFIX + id : KEY);

  function getActive() {
    try { return cleanId(root.localStorage.getItem(ACTIVE_KEY)); } catch (e) { return ''; }
  }

  function setActive(id) {
    try { root.localStorage.setItem(ACTIVE_KEY, cleanId(id)); } catch (e) { /* bỏ qua */ }
  }

  function load(id) {
    try {
      const raw = root.localStorage.getItem(keyOf(cleanId(id == null ? getActive() : id)));
      return root.Logic.sanitize(raw ? JSON.parse(raw) : null);
    } catch (e) {
      return root.Logic.emptyData();
    }
  }

  function save(data, id) {
    try {
      root.localStorage.setItem(keyOf(cleanId(id == null ? getActive() : id)), JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Các game ID đã có dữ liệu ('' = chưa đặt ID, nếu có dữ liệu cũ), kèm số đệ tử / chờ trục xuất. */
  function listProfiles() {
    const ids = new Set();
    try {
      const ls = root.localStorage;
      if (ls.getItem(KEY)) ids.add('');
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith(PROFILE_PREFIX)) ids.add(k.slice(PROFILE_PREFIX.length));
      }
    } catch (e) { /* bỏ qua */ }
    ids.add(getActive());
    return [...ids].map((id) => {
      const d = load(id);
      return { id, disciples: d.disciples.length, expelled: d.expelled.length };
    }).sort((a, b) => (a.id === '') - (b.id === '') || a.id.localeCompare(b.id, 'vi'));
  }

  const META_PREFIX = 'tlts-sync-meta:';

  /** Trạng thái đồng bộ của một sổ: rev máy chủ mà bản này dựa vào, và có thay đổi chưa đẩy lên không. */
  function loadMeta(id, nonEmpty) {
    try {
      const m = JSON.parse(root.localStorage.getItem(META_PREFIX + cleanId(id)));
      if (m && Number.isInteger(m.rev) && m.rev >= 0) return { rev: m.rev, dirty: !!m.dirty };
    } catch (e) { /* dùng mặc định */ }
    return { rev: 0, dirty: !!nonEmpty }; // chưa từng đồng bộ: dữ liệu có sẵn coi như chưa đẩy lên
  }

  function saveMeta(id, meta) {
    try { root.localStorage.setItem(META_PREFIX + cleanId(id), JSON.stringify(meta)); } catch (e) { /* bỏ qua */ }
  }

  function removeProfile(id) {
    try {
      root.localStorage.removeItem(keyOf(cleanId(id)));
      root.localStorage.removeItem(META_PREFIX + cleanId(id));
    } catch (e) { /* bỏ qua */ }
  }

  const PREFS_KEY = 'tlts-truyen-cong-plan-v1';
  const PREFS_DEFAULT = { threshold: 250, keepRoles: true };

  /** Thiết lập màn Kế hoạch (ngưỡng, giữ chức vụ). Hỏng thì dùng mặc định. */
  function loadPrefs() {
    try {
      const p = JSON.parse(root.localStorage.getItem(PREFS_KEY));
      const t = p && p.threshold !== null && p.threshold !== '' ? Math.floor(Number(p.threshold)) : NaN;
      return { threshold: Number.isFinite(t) && t >= 0 ? t : PREFS_DEFAULT.threshold, keepRoles: p && typeof p.keepRoles === 'boolean' ? p.keepRoles : PREFS_DEFAULT.keepRoles };
    } catch (e) {
      return { ...PREFS_DEFAULT };
    }
  }

  function savePrefs(p) {
    try { root.localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch (e) { /* bỏ qua */ }
  }

  root.Store = { cleanId, getActive, setActive, load, save, listProfiles, removeProfile, loadMeta, saveMeta, loadPrefs, savePrefs };
})(window);
