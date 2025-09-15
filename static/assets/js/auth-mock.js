// 轻量登录态模拟：本地存储 + 事件通知 + 导航显隐
(function () {
  const KEY = 'WSU_USER';

  function getUser() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch { return null; }
  }
  function setUser(u) {
    localStorage.setItem(KEY, JSON.stringify(u));
    document.dispatchEvent(new CustomEvent('wsu-auth', { detail: u }));
  }
  function clear() {
    localStorage.removeItem(KEY);
    document.dispatchEvent(new Event('wsu-logout'));
  }

// 导航显隐：根据 data-auth="guest"/"user" 切换 + 按角色显隐
function applyNav() {
  const user = getUser();

  // 登录/未登录显隐
  document.querySelectorAll('[data-auth="guest"]').forEach(el => {
    el.style.display = user ? 'none' : '';
  });
  document.querySelectorAll('[data-auth="user"]').forEach(el => {
    el.style.display = user ? '' : 'none';
  });

  // 用户名
  const navUser = document.getElementById('navUser');
  if (navUser) navUser.textContent = user ? (user.name || user.email) : '';

  // 退出
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      clear();
      applyNav();
      const target = new URL('login.html', location.href);
      location.replace(target.href);
    };
  }

  // === 新增：按角色显隐 ===
  // 用法1：data-role="admin"    → 仅 admin 显示
  // 用法2：data-roles="admin,exec" → 两种角色都显示
  // 用法3：data-role-not="member"  → 除 member 以外显示（可选）
  document.querySelectorAll('[data-role], [data-roles], [data-role-not]').forEach(el => {
    const needOne  = (el.getAttribute('data-role')  || '').trim();
    const needMany = (el.getAttribute('data-roles') || '')
                      .split(',').map(s => s.trim()).filter(Boolean);
    const notRole  = (el.getAttribute('data-role-not') || '').trim();

    let show = !!user;

    if (needOne) {
      show = show && user.role === needOne;
    }
    if (needMany.length) {
      show = show && needMany.includes(user.role);
    }
    if (notRole) {
      show = show && user.role !== notRole;
    }
    el.style.display = show ? '' : 'none';
  });
}


  window.WSU_AUTH = { getUser, setUser, clear, applyNav };

  document.addEventListener('DOMContentLoaded', applyNav);
  document.addEventListener('wsu-auth', applyNav);
  document.addEventListener('wsu-logout', applyNav);
})();
