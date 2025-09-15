<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Login - Warwick SU</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Flask 静态资源 -->
  <link rel="stylesheet" href="/static/assets/css/style.css">
  <!-- 先加载登录态工具（defer 不阻塞渲染） -->
  <script src="/static/assets/js/auth-mock.js" defer></script>

  <style>
    .auth-wrap{min-height:calc(100vh - var(--nav-h,72px));display:grid;place-items:center;padding:36px 16px;}
    .auth-card{width:min(520px,92vw);background:#fff;border:1px solid #E5E7EB;border-radius:16px;box-shadow:0 14px 40px rgba(0,0,0,.08);padding:26px;}
    .auth-head{text-align:center;margin-bottom:18px;}
    .auth-head h1{margin:.2rem 0;font-size:24px;}
    .auth-head p{color:#6B7280;margin:0;}
    .field{display:grid;gap:6px;margin:12px 0;}
    .field label{font-weight:600;}
    .input{width:100%;padding:.65rem .8rem;border:1px solid #E5E7EB;border-radius:12px;font:inherit;}
    .input:focus{outline:2px solid #C676FF22;border-color:#C676FF;}
    .pw-row{position:relative;}
    .pw-toggle{position:absolute;right:10px;top:50%;transform:translateY(-50%);border:1px solid #E5E7EB;background:#fff;border-radius:10px;padding:4px 8px;cursor:pointer;}
    .row-between{display:flex;justify-content:space-between;align-items:center;gap:10px;}
    .checkbox{display:flex;align-items:center;gap:8px;color:#374151;}
    .btn{display:inline-block;padding:.7rem 1rem;border-radius:12px;border:1px solid #E5E7EB;background:#fff;text-decoration:none;color:#111;font-weight:600;}
    .btn--primary{background:var(--primary,#C676FF);border-color:var(--primary,#C676FF);color:#111;width:100%;}
    .btn--primary:hover{filter:brightness(.96);}
    .muted{color:#6B7280;}
    .actions{display:flex;justify-content:space-between;margin-top:14px;}
    .auth-footer{text-align:center;margin-top:14px;color:#6B7280;}
    .auth-footer a{text-decoration:none;color:#6B21A8;}
    .error{display:none;margin-top:10px;padding:10px 12px;border:1px solid #FCA5A5;border-radius:10px;background:#FEE2E2;color:#991B1B;font-size:14px;}
  </style>
</head>
<body>
  <header class="site-header">
    <div class="container nav">
      <a class="brand" href="/">
        <img src="/static/images/warwick-logo.png" alt="Warwick" width="160">
      </a>
      <nav class="nav-center">
        <a href="/" class="nav-link">Home</a>
        <a href="/rooms" class="nav-link">Room</a>
        <a href="/schedule" class="nav-link">Schedule</a>
        <a href="/bookings" class="nav-link">My Booking</a>
        <a href="/admin" class="nav-link" data-role="admin" style="display:none;">Admin</a>

      </nav>
      <nav class="nav-right">
        <!-- 未登录可见 -->
        <a href="/login" class="nav-link" data-auth="guest">Login</a>
        <a href="/register" class="nav-link" data-auth="guest">Sign Up</a>
        <!-- 登录后可见 -->
        <span class="nav-link" id="navUser" data-auth="user" style="pointer-events:none;"></span>
        <a href="#" class="nav-link" id="logoutBtn" data-auth="user">Logout</a>
      </nav>
    </div>
  </header>

  <main class="auth-wrap">
    <form class="auth-card" id="loginForm" method="post" action="#">
      <div class="auth-head">
        <h1>Welcome back</h1>
        <p class="muted">Sign in to manage your society bookings</p>
      </div>

      <div class="field">
        <label for="email">Email</label>
        <input class="input" type="email" id="email" name="email" placeholder="you@warwick.ac.uk" required>
      </div>

      <div class="field">
        <label for="password">Password</label>
        <div class="pw-row">
          <input class="input" type="password" id="password" name="password" placeholder="••••••••" required minlength="6">
          <button class="pw-toggle" type="button" aria-label="Show password">Show</button>
        </div>
      </div>

      <div class="row-between">
        <label class="checkbox"><input type="checkbox" id="remember"> Remember me</label>
        <a class="muted" href="/forgot">Forgot password?</a>
      </div>

      <div class="error" id="errorBox">Invalid email or password.</div>

      <button class="btn btn--primary" type="submit">Login</button>

      <div class="auth-footer">
        No account? <a href="/register">Create one</a>
      </div>
    </form>
  </main>

  <footer class="container" style="text-align:center;margin:20px auto 40px;">
    <small>© 2025 University of Warwick (demo)</small>
  </footer>

  <!-- 页面脚本：放在末尾 + DOMContentLoaded 确保执行 -->
  <script>
  window.addEventListener('DOMContentLoaded', function () {
    const form   = document.getElementById('loginForm');
    const error  = document.getElementById('errorBox');
    const pwBtn  = document.querySelector('.pw-toggle');
    const pwIn   = document.getElementById('password');

    pwBtn.addEventListener('click', ()=>{
      const t = pwIn.getAttribute('type') === 'password' ? 'text' : 'password';
      pwIn.setAttribute('type', t);
      pwBtn.textContent = (t === 'password') ? 'Show' : 'Hide';
    });

    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      error.style.display = 'none';

      const email = form.email.value.trim();
      const pwd   = form.password.value;

      // 演示账号（密码统一 123456）
      const users = {
        'admin@warwick.ac.uk': {name:'Site Admin', role:'admin', department:'SU Office', club:''},
        'student@warwick.ac.uk': {name:'Jacob Xu', role:'exec',   department:'Digital Media', club:'Photography Society'},
        'member@warwick.ac.uk':  {name:'Abby Liu',  role:'member', department:'Economics',     club:'Debate Society'}
      };
      const u = users[email];

      if (u && pwd === '123456') {
        try {
          if (window.WSU_AUTH && typeof WSU_AUTH.setUser === 'function') {
            WSU_AUTH.setUser({ email, ...u });
          } else {
            localStorage.setItem('WSU_USER', JSON.stringify({ email, ...u }));
          }
        } catch (err) {
          localStorage.setItem('WSU_USER', JSON.stringify({ email, ...u }));
        }

        // 直接路由到 /rooms（Flask 路由）
        try { location.assign('/rooms'); }
        catch { location.replace('/rooms'); }

      } else {
        error.style.display = 'block';
      }
    });

    // 控制台兜底日志，方便排错
    window.addEventListener('error', (ev)=>{
      console.error('[Login Page Error]', ev.message, ev.error);
    });
  });
  </script>
</body>
</html>