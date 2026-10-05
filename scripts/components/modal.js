/* ============================================================
   MERIDIAN · components/modal
   原生 dialog：确认框（Promise） + 快捷键帮助
   ============================================================ */
(function (global) {
  'use strict';
  var App = global.App;
  var u = App.utils;

  var confirmDlg, confirmTitle, confirmMsg, okBtn, cancelBtn;
  var helpDlg, helpGrid, helpClose;
  var resolver = null;

  function init() {
    confirmDlg = u.$('#confirm-dialog');
    confirmTitle = u.$('#confirm-title');
    confirmMsg = u.$('#confirm-message');
    okBtn = u.$('#confirm-ok');
    cancelBtn = u.$('#confirm-cancel');

    helpDlg = u.$('#shortcuts-dialog');
    helpGrid = u.$('#shortcut-grid');
    helpClose = u.$('#shortcuts-close');

    okBtn.addEventListener('click', function () { settle(true); });
    cancelBtn.addEventListener('click', function () { settle(false); });
    confirmDlg.addEventListener('cancel', function () { settle(false); });
    confirmDlg.addEventListener('close', function () { if (resolver) settle(false); });

    helpClose.addEventListener('click', closeShortcuts);
    helpDlg.addEventListener('close', function () {});
  }

  /* dialog 不可用时也要能显示/关闭，避免按钮点不动、Promise 永远挂着 */
  function openDialog(dlg) {
    if (!dlg) return;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  }
  function closeDialog(dlg) {
    if (!dlg) return;
    if (typeof dlg.close === 'function' && dlg.open) dlg.close();
    else dlg.removeAttribute('open');
  }

  function settle(result) {
    var r = resolver;
    resolver = null;
    closeDialog(confirmDlg);
    if (r) r(result);
  }

  function confirm(opts) {
    opts = opts || {};
    if (resolver) settle(false);   // 上一次确认未结束就再开一次时，先把它拒绝掉
    confirmTitle.textContent = opts.title || '确认操作';
    confirmMsg.textContent = opts.message || '';
    okBtn.textContent = opts.okLabel || '确认';
    cancelBtn.textContent = opts.cancelLabel || '取消';
    okBtn.className = opts.danger === false ? 'btn btn--primary' : 'btn btn--danger';
    openDialog(confirmDlg);
    return new Promise(function (res) {
      resolver = res;
      requestAnimationFrame(function () { try { okBtn.focus(); } catch (e) {} });
    });
  }

  /* ---------------- 快捷键帮助 ---------------- */
  function renderShortcuts(groups) {
    helpGrid.innerHTML = '';
    groups.forEach(function (g) {
      helpGrid.appendChild(u.h('div', { class: 'sc-head' }, g.name));
      g.rows.forEach(function (row) {
        var keys = row.keys.map(function (k) { return u.h('kbd', {}, k); });
        helpGrid.appendChild(u.h('div', { class: 'sc-row' },
          u.h('span', { class: 'sc-title' }, row.title),
          u.h('span', { class: 'sc-keys' }, keys)
        ));
      });
    });
  }

  function openShortcuts() {
    renderShortcuts(App.keyboard.getShortcutGroups());
    openDialog(helpDlg);
  }
  function closeShortcuts() { closeDialog(helpDlg); }

  App.modal = {
    init: init,
    confirm: confirm,
    openShortcuts: openShortcuts,
    closeShortcuts: closeShortcuts
  };
})(window);
