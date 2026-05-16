'use client';

import React, { useState } from 'react';
import { soundManager } from '@/lib/buta/sounds';

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
      title={enabled ? 'Mute sounds' : 'Unmute sounds'}
      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70
                 hover:text-white transition-all text-lg leading-none"
      aria-label={enabled ? 'Mute sounds' : 'Unmute sounds'}
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  );
}
