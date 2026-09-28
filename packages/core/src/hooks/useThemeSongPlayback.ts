import { useEffect } from 'react';
import { getAudioStreamUrl } from '../utils/jellyfinUrls';
import { getUserId } from '../utils/localstorageCredentials';
import { useThemeSongs } from './useThemeSongs';

const START_DELAY_MS = 4000;

/**
 * Plays the first Jellyfin theme song for an item and cleans it up with the
 * component lifecycle. If autoplay is blocked, playback is retried once after
 * the next pointer or keyboard interaction.
 */
export function useThemeSongPlayback(itemId: string, enabled: boolean, volumePercent = 25) {
    const userId = getUserId() ?? undefined;
    const { data: themeSongs } = useThemeSongs(itemId, userId, enabled);
    const themeSongId = themeSongs?.[0]?.Id;

    useEffect(() => {
        if (!enabled || !themeSongId) return;

        const audio = new Audio(getAudioStreamUrl(themeSongId, userId));
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = Math.min(1, Math.max(0, volumePercent / 100));

        let disposed = false;
        let awaitingInteraction = false;

        function removeRetryListeners() {
            if (!awaitingInteraction) return;
            window.removeEventListener('pointerdown', retryPlayback);
            window.removeEventListener('keydown', retryPlayback);
            awaitingInteraction = false;
        }

        function retryPlayback() {
            removeRetryListeners();
            if (!disposed) void audio.play().catch(() => {});
        }

        async function tryPlayback() {
            try {
                await audio.play();
            } catch {
                if (disposed) return;
                awaitingInteraction = true;
                window.addEventListener('pointerdown', retryPlayback, { once: true });
                window.addEventListener('keydown', retryPlayback, { once: true });
            }
        }

        const timer = window.setTimeout(() => void tryPlayback(), START_DELAY_MS);

        return () => {
            disposed = true;
            window.clearTimeout(timer);
            removeRetryListeners();
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
        };
    }, [enabled, themeSongId, userId, volumePercent]);
}
