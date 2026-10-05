/* ============================================================
   MERIDIAN · components/toolbar
   筛选 tabs（含方向键） / 搜索 / 操作菜单（清除 / 导出 / 导入）
   ============================================================ */
(function (global) {
  'use strict';
  var App = global.App;
  var u = App.utils;

  var tabsEl, searchEl, moreBtn, menuEl, fileInput;
  var menuOpen = false;
  var menuItems = [];
  var activeItem = 0;

  var MENU = [
    { icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M5 13h14l-6 6"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M5 5h14"/></svg>', label: '导出星图（JSON）', action: 'exportData' },
    { icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M19 11H5l6-6"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M19 19H5"/></svg>', label: '导入星图（JSON）', action: 'importData' },
    { sep: true },
    { icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="m6 6 12 12M18 6L6 18"/></svg>', label: '清除所有已完成', action: 'clearCompleted' },
    { icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13"/></svg>', label: '清空全部任务', action: 'clearAll', danger: true }
  ];

  function init() {
    tabsEl = u.$('.filter-tabs');
    searchEl = u.$('#search-input');
    moreBtn = u.$('#btn-more');
    if (!tabsEl || !searchEl || !moreBtn) return;

    tabsEl.addEventListener('click', function (e) {
      var tab = e.target.closest('.filter-tab');
      if (!tab) return;
      App.store.setUI({ filter: tab.dataset.filter });
    });
    tabsEl.addEventListener('keydown', onTabsKeyDown);

    searchEl.addEventListener('input', u.debounce(function () {
      App.store.setUI({ search: searchEl.value });
    }, 120));

    moreBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    document.addEventListener('click', function (e) {
      if (!menuOpen || !menuEl) return;
      if (!menuEl.contains(e.target) && e.target !== moreBtn) closeMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) { e.stopPropagation(); closeMenu(true); }
    });
    // 菜单用 fixed 定位，页面滚动或窗口缩放后会脱位，直接收起更稳
    global.addEventListener('resize', function () { if (menuOpen) closeMenu(false); });
    document.addEventListener('scroll', function () { if (menuOpen) closeMenu(false); }, true);

    fileInput = u.h('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
    document.body.appendChild(fileInput);
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (file && App.actions) App.actions.importData(file);
      fileInput.value = '';
    });
  }

  /* ---------------- 筛选页签：方向键 + roving tabindex ---------------- */
  function onTabsKeyDown(e) {
    var tabs = u.$$('.filter-tab', tabsEl);
    var i = tabs.indexOf(document.activeElement);
    if (i === -1) return;
    var next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next == null) return;
    e.preventDefault();
    var tab = tabs[next];
    tab.focus();
    App.store.setUI({ filter: tab.dataset.filter });
  }

  /* ---------------- 菜单 ---------------- */
  function buildMenu() {
    menuEl = u.h('div', { class: 'menu', role: 'menu' });
    menuItems = [];
    MENU.forEach(function (m) {
      if (m.sep) { menuEl.appendChild(u.h('div', { class: 'menu__sep', role: 'separator' })); return; }
      var item = u.h('button', {
        class: 'menu__item' + (m.danger ? ' menu__item--danger' : ''),
        type: 'button', role: 'menuitem', tabindex: '-1'
      },
        u.h('span', { html: m.icon }),
        u.h('span', {}, m.label)
      );
      item.addEventListener('click', function () {
        closeMenu(false);
        if (m.action === 'importData') pickFile();
        else if (App.actions && typeof App.actions[m.action] === 'function') App.actions[m.action]();
      });
      menuItems.push(item);
      menuEl.appendChild(item);
    });
    menuEl.addEventListener('keydown', onMenuKeyDown);
    document.body.appendChild(menuEl);
  }

  function focusItem(idx) {
    if (!menuItems.length) return;
    activeItem = ((idx % menuItems.length) + menuItems.length) % menuItems.length;
    menuItems.forEach(function (el, i) { el.tabIndex = i === activeItem ? 0 : -1; });
    try { menuItems[activeItem].focus(); } catch (e) {}
  }

  function onMenuKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); focusItem(activeItem + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusItem(activeItem - 1); }
    else if (e.key === 'Home') { e.preventDefault(); focusItem(0); }
    else if (e.key === 'End') { e.preventDefault(); focusItem(menuItems.length - 1); }
  }

  function openMenu() {
    if (!menuEl) buildMenu();
    var r = moreBtn.getBoundingClientRect();
    menuEl.style.position = 'fixed';
    menuEl.style.top = (r.bottom + 8) + 'px';
    menuEl.style.right = String(Math.max(global.innerWidth - r.right, 12)) + 'px';
    menuEl.style.left = 'auto';
    menuOpen = true;
    moreBtn.setAttribute('aria-expanded', 'true');
    // 菜单展开时挂起单键快捷键（n / t / s 等），避免误触
    if (App.keyboard && App.keyboard.setSuspended) App.keyboard.setSuspended(true);
    activeItem = 0;
    focusItem(0);
  }

  function closeMenu(refocus) {
    if (!menuOpen && !menuEl) return;
    menuOpen = false;
    moreBtn.setAttribute('aria-expanded', 'false');
    if (menuEl) menuEl.remove();
    menuEl = null;
    menuItems = [];
    if (App.keyboard && App.keyboard.setSuspended) App.keyboard.setSuspended(false);
    if (refocus) { try { moreBtn.focus(); } catch (e) {} }
  }

  function toggleMenu() { menuOpen ? closeMenu(false) : openMenu(); }

  /* ---------------- 状态同步 ---------------- */
  function syncTabs(filter) {
    u.$$('.filter-tab', tabsEl).forEach(function (tab) {
      var on = tab.dataset.filter === filter;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
    });
  }

  function syncCounts(c) {
    u.$('#count-all').textContent = c.all;
    u.$('#count-active').textContent = c.active;
    u.$('#count-completed').textContent = c.completed;
  }

  function focusSearch() { try { searchEl.focus(); } catch (e) {} }
  function pickFile() { if (fileInput) fileInput.click(); }

  App.toolbar = {
    init: init,
    syncTabs: syncTabs, syncCounts: syncCounts,
    focusSearch: focusSearch, pickFile: pickFile,
    closeMenu: closeMenu
  };
})(window);
