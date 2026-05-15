'use client';

import { useState } from 'react';
import { soundManager } from '@/lib/sounds';

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  function toggle() {
    soundManager.toggle();
    setEnabled(soundManager.isEnabled());
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={enabled ? 'サウンドをオフ' : 'サウンドをオン'}
      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70
                 hover:text-white transition-all text-lg leading-none"
      aria-label={enabled ? 'サウンドをオフ' : 'サウンドをオン'}
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  );
}
