export function toast(msg: string, kind: '' | 'warn' | 'info' = '', ms = 4200) {
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.innerHTML = msg;
  document.getElementById('toasts')!.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
