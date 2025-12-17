// Toggle navigation for mobile and handle login modal behavior
document.addEventListener('DOMContentLoaded', function(){
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('main-nav');
  const loginBtn = document.getElementById('loginBtn');
  const backdrop = document.getElementById('modalBackdrop');
  const cancelLogin = document.getElementById('cancelLogin');
  const loginForm = document.getElementById('loginForm');
  const accountMenu = document.getElementById('accountMenu');
  const accountProfile = document.getElementById('accountProfile');
  const accountLogout = document.getElementById('accountLogout');
  const noticeBackdrop = document.getElementById('noticeBackdrop');
  const noticeClose = document.getElementById('noticeClose');
  const noticeMessageEl = document.getElementById('noticeMessage');
  const yearSpan = document.getElementById('year');

  yearSpan.textContent = new Date().getFullYear();

  // Authentication demo state and pending order bookkeeping
  let loggedIn = false;
  let pendingOrder = null;
  const toast = document.getElementById('toast');

  function showToast(message, duration = 3200){
    if(!toast) return;
    const inner = toast.querySelector('.toast-inner');
    inner.textContent = message;
    toast.hidden = false;
    // trigger animation
    requestAnimationFrame(()=> toast.classList.add('show'));
    // clear any pending timeout
    if(toast._timeout) clearTimeout(toast._timeout);
    toast._timeout = setTimeout(()=>{
      toast.classList.remove('show');
      // hide after transition
      setTimeout(()=> toast.hidden = true, 260);
    }, duration);
  }

  // Toggle mobile nav
  hamburger.addEventListener('click', function(){
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    if(!expanded){
      nav.style.display = 'block';
      nav.querySelectorAll('a')[0]?.focus();
    } else {
      nav.style.display = '';
    }
  });

  // Header login button behavior:
  // - if not logged in: open dedicated login page in a new window; if popup blocked show toast fallback
  // - if logged in: toggle account menu
  // Header login button: navigate to login page (same tab). If already logged in toggle account menu.
  loginBtn.addEventListener('click', function(e){
    if(loggedIn){
      // toggle account menu
      if(accountMenu){
        const isHidden = accountMenu.hidden;
        accountMenu.hidden = !isHidden;
      }
    } else {
      // navigate to the login page in the same tab
      window.location.href = 'login.html';
    }
  });

  // Menu item click -> require login before ordering
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    const name = item.dataset.name || item.getAttribute('aria-label') || 'item';
    function tryOrder(){
      if(loggedIn){
        // In a real app you'd open an order dialog or add to cart
        alert('Proceed to order: ' + name + ' (demo)');
      } else {
        pendingOrder = name;
        // show friendly toast before opening login modal
        showToast('Oops — looks like you need to log in to order.');
        backdrop.style.display = 'flex';
        backdrop.setAttribute('aria-hidden','false');
        document.getElementById('email')?.focus();
      }
    }
    item.addEventListener('click', tryOrder);
    item.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tryOrder(); } });
  });

  // Cancel / close
  cancelLogin.addEventListener('click', closeModal);
  backdrop.addEventListener('click', function(e){
    if(e.target === backdrop) closeModal();
  });

  function closeModal(){
    backdrop.style.display = 'none';
    backdrop.setAttribute('aria-hidden','true');
    loginBtn.focus();
    // hide toast if visible
    if(toast){
      if(toast._timeout) clearTimeout(toast._timeout);
      toast.classList.remove('show');
      setTimeout(()=> toast.hidden = true, 200);
    }
  }

  function updateAuthUI(email){
    if(loggedIn){
      loginBtn.textContent = 'Account';
      if(accountMenu) accountMenu.hidden = true;
      // optionally show user's short name
      if(email && loginBtn){
        const short = email.split('@')[0];
        loginBtn.title = short;
      }
    } else {
      loginBtn.textContent = 'Log in';
      if(accountMenu) accountMenu.hidden = true;
      loginBtn.removeAttribute('title');
    }
  }

  // Initialize auth state from localStorage (supports same-tab login flow)
  // Only treat as logged in if an explicit flag is set to avoid showing account UI
  (function initAuthFromStorage(){
    try{
      const flag = localStorage.getItem('rr_logged_in');
      const saved = localStorage.getItem('rr_user_email');
      if(flag === '1' && saved){
        loggedIn = true;
        updateAuthUI(saved);
      } else {
        loggedIn = false;
        updateAuthUI();
      }
    }catch(e){ loggedIn = false; updateAuthUI(); }
    // ensure account menu is hidden initially
    if(accountMenu) accountMenu.hidden = true;
  })();

  // submit handler (placeholder)
  loginForm.addEventListener('submit', function(e){
    e.preventDefault();
    // small demo behavior: set logged in state, close modal and continue pending order
    const email = document.getElementById('email').value;
    loggedIn = true;
    // persist login explicitly
    try{ localStorage.setItem('rr_user_email', email); localStorage.setItem('rr_logged_in','1'); }catch(e){}
    closeModal();
    updateAuthUI(email);
    if(pendingOrder){
      alert('Signed in as ' + email + '. You can now order: ' + pendingOrder + ' (demo)');
      pendingOrder = null;
    } else {
      alert('Signed in as ' + email + ' (demo)');
    }
  });

  // keyboard: ESC to close modal
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      if(backdrop.style.display === 'flex') closeModal();
      if(noticeBackdrop && noticeBackdrop.style.display === 'flex') closeNotice();
      // if mobile menu open, close it
      if(hamburger.getAttribute('aria-expanded') === 'true'){
        hamburger.setAttribute('aria-expanded','false');
        nav.style.display = '';
      }
    }
  });

  // Listen for login messages from the popup window (login.html)
  window.addEventListener('message', function(e){
    const data = e.data || {};
    if(data && data.type === 'login'){
      const email = data.email || '';
      loggedIn = true;
      try{ localStorage.setItem('rr_user_email', email); }catch(e){}
      // close modal if open
      closeModal();
      updateAuthUI(email);
      if(pendingOrder){
        alert('Signed in as ' + email + '. You can now order: ' + pendingOrder + ' (demo)');
        pendingOrder = null;
      } else {
        alert('Signed in as ' + email + ' (demo)');
      }
    }
  });

  // account menu actions
  if(accountLogout){
    accountLogout.addEventListener('click', function(){
      loggedIn = false;
      try{ localStorage.removeItem('rr_user_email'); }catch(e){}
      updateAuthUI();
      alert('You have been signed out (demo).');
      if(accountMenu) accountMenu.hidden = true;
    });
  }
  if(accountProfile){
    accountProfile.addEventListener('click', function(){
      // show notice modal that feature is not implemented yet
      const msg = "Oops — we haven't been able to code that yet. Please wait for a future update.";
      showNotice(msg);
      if(accountMenu) accountMenu.hidden = true;
    });
  }

  // Notice modal helpers
  function showNotice(message){
    if(!noticeBackdrop) return alert(message);
    if(noticeMessageEl) noticeMessageEl.textContent = message;
    noticeBackdrop.style.display = 'flex';
    noticeBackdrop.setAttribute('aria-hidden','false');
    // focus close button for accessibility
    noticeClose?.focus();
  }

  function closeNotice(){
    if(!noticeBackdrop) return;
    noticeBackdrop.style.display = 'none';
    noticeBackdrop.setAttribute('aria-hidden','true');
  }

  if(noticeClose){ noticeClose.addEventListener('click', closeNotice); }
  if(noticeBackdrop){ noticeBackdrop.addEventListener('click', function(e){ if(e.target === noticeBackdrop) closeNotice(); }); }

  // click outside account menu to close it
  document.addEventListener('click', function(e){
    if(accountMenu && !accountMenu.hidden){
      const isInside = e.target.closest && e.target.closest('.account-wrap');
      if(!isInside){ accountMenu.hidden = true; }
    }
  });
});
