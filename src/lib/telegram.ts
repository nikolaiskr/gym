import { useEffect } from 'react';

// ─── Telegram Web App интеграция ──────────────────────────────────
// Доступ к window.Telegram.WebApp напрямую, со стражами:
// вне Telegram (обычный браузер, dev-превью) все вызовы — безопасные no-op,
// и приложение не падает, даже если telegram-web-app.js не загрузился.

interface TgWebApp {
  initData?: string;
  initDataUnsafe?: { user?: { first_name?: string; username?: string; id?: number } };
  themeParams?: {
    bg_color?: string;
    secondary_bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  ready?: () => void;
  expand?: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  onEvent?: (e: string, cb: () => void) => void;
  offEvent?: (e: string, cb: () => void) => void;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred: (type: 'success' | 'warning' | 'error') => void;
    selectionChanged: () => void;
  };
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  MainButton?: {
    setText: (t: string) => void;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
}

function tg(): TgWebApp | null {
  try {
    const w = window as unknown as { Telegram?: { WebApp?: TgWebApp } };
    return w.Telegram?.WebApp ?? null;
  } catch {
    return null;
  }
}

export function isInTelegram(): boolean {
  const app = tg();
  return !!app && (!!app.initDataUnsafe?.user || !!app.initData);
}

export function tgUserName(): string | null {
  try {
    const u = tg()?.initDataUnsafe?.user;
    if (!u) return null;
    return u.first_name || u.username || null;
  } catch {
    return null;
  }
}

export function initTelegram() {
  const app = tg();
  if (!app || !isInTelegram()) return;
  try {
    app.ready?.();
    app.expand?.();
    app.disableVerticalSwipes?.();
  } catch {
    /* ignore */
  }
}

// ─── Тема Telegram → CSS-переменные ───────────────────────────────
export interface TgTheme {
  bg: string;
  secondaryBg: string;
  text: string;
  hint: string;
  link: string;
  button: string;
  buttonText: string;
  isDark: boolean;
}

export function getTgTheme(): TgTheme {
  const p = tg()?.themeParams;
  if (p && (p.bg_color || p.secondary_bg_color)) {
    const bg = p.bg_color || '#ffffff';
    return {
      bg,
      secondaryBg: p.secondary_bg_color || (isDarkColor(bg) ? '#1c1c1e' : '#f4f4f5'),
      text: p.text_color || (isDarkColor(bg) ? '#ffffff' : '#111827'),
      hint: p.hint_color || '#9ca3af',
      link: p.link_color || '#3b82f6',
      button: p.button_color || '#3b82f6',
      buttonText: p.button_text_color || '#ffffff',
      isDark: isDarkColor(bg),
    };
  }
  // Fallback: системная тема браузера
  const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  return dark
    ? { bg: '#0f1115', secondaryBg: '#1a1d24', text: '#f3f4f6', hint: '#9ca3af', link: '#60a5fa', button: '#3b82f6', buttonText: '#ffffff', isDark: true }
    : { bg: '#f6f7f9', secondaryBg: '#ffffff', text: '#111827', hint: '#9ca3af', link: '#2563eb', button: '#2563eb', buttonText: '#ffffff', isDark: false };
}

function isDarkColor(hex: string): boolean {
  const m = hex.replace('#', '');
  if (m.length < 6) return false;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export function applyTgTheme(t: TgTheme) {
  const root = document.documentElement;
  root.style.setProperty('--tg-bg', t.bg);
  root.style.setProperty('--tg-secondary-bg', t.secondaryBg);
  root.style.setProperty('--tg-text', t.text);
  root.style.setProperty('--tg-hint', t.hint);
  root.style.setProperty('--tg-link', t.link);
  root.style.setProperty('--tg-button', t.button);
  root.style.setProperty('--tg-button-text', t.buttonText);
  root.classList.toggle('dark', t.isDark);
  if (isInTelegram()) {
    try {
      tg()?.setHeaderColor?.(t.bg);
      tg()?.setBackgroundColor?.(t.bg);
    } catch {
      /* ignore */
    }
  }
}

// Подписка на смену темы Telegram (themeParams)
export function useTgTheme(): TgTheme {
  useEffect(() => {
    const apply = () => applyTgTheme(getTgTheme());
    apply();
    const app = tg();
    if (!app || !isInTelegram()) return;
    try {
      app.onEvent?.('themeChanged', apply);
      return () => app.offEvent?.('themeChanged', apply);
    } catch {
      return;
    }
  }, []);
  return getTgTheme();
}

// ─── HapticFeedback ───────────────────────────────────────────────
function safe(fn: () => void) {
  if (!isInTelegram()) return;
  try {
    fn();
  } catch {
    /* ignore */
  }
}

export const haptic = {
  light() {
    safe(() => tg()?.HapticFeedback?.impactOccurred('light'));
  },
  medium() {
    safe(() => tg()?.HapticFeedback?.impactOccurred('medium'));
  },
  success() {
    safe(() => tg()?.HapticFeedback?.notificationOccurred('success'));
  },
  warning() {
    safe(() => tg()?.HapticFeedback?.notificationOccurred('warning'));
  },
  selection() {
    safe(() => tg()?.HapticFeedback?.selectionChanged());
  },
};

// ─── BackButton ───────────────────────────────────────────────────
export function useBackButton(visible: boolean, onBack: () => void) {
  useEffect(() => {
    const app = tg();
    if (!app || !isInTelegram() || !app.BackButton) return;
    try {
      if (visible) {
        app.BackButton.show();
        app.BackButton.onClick(onBack);
      } else {
        app.BackButton.hide();
      }
      return () => {
        try {
          app.BackButton?.offClick(onBack);
          app.BackButton?.hide();
        } catch {
          /* ignore */
        }
      };
    } catch {
      return;
    }
  }, [visible, onBack]);
}

// ─── MainButton ───────────────────────────────────────────────────
export function useMainButton(label: string | null, onClick: () => void) {
  useEffect(() => {
    const app = tg();
    if (!app || !isInTelegram() || !app.MainButton) return;
    try {
      if (!label) {
        app.MainButton.hide();
        return;
      }
      app.MainButton.setText(label);
      app.MainButton.show();
      app.MainButton.onClick(onClick);
      return () => {
        try {
          app.MainButton?.offClick(onClick);
          app.MainButton?.hide();
        } catch {
          /* ignore */
        }
      };
    } catch {
      return;
    }
  }, [label, onClick]);
}
