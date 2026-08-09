import { AppNotification } from '../types';

// Play audio chime using Web Audio API for real-time push alerts
export function playAlertChime(type: 'critical' | 'success' | 'info' = 'info') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'critical') {
      // Alarm sound (two high-pitch beeps)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'success') {
      // Pleasant chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      // Gentle notification tap
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn("Audio chime disabled or blocked by browser gesture:", e);
  }
}

// Request Native Web Push Notification Permission
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn("This browser does not support desktop push notifications.");
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Trigger browser push notification
export function sendBrowserPushNotification(title: string, options: NotificationOptions & { sound?: boolean }) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notifOptions: NotificationOptions & { renotify?: boolean } = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'carecueca-notification',
        renotify: true,
        ...options,
      };
      const notif = new Notification(title, notifOptions as NotificationOptions);

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.warn("Could not show browser push notification:", err);
    }
  }

  playAlertChime(options.body?.includes('⚠️') || options.body?.includes('crítica') ? 'critical' : 'info');
}
