/**
 * SoundManager - Utilitaire pour la gestion des effets sonores de l'application
 * Gère les sons de "Glissement" (Navigation) et "Télégraphe" (Documents)
 */

// URLs des sons (Placeholders à remplacer par les vrais fichiers)
// Note: L'utilisateur doit placer les fichiers .mp3/.wav dans public/sounds/
const SOUND_URLS = {
    SLIDING: "/sounds/sliding.mp3",   // Son de glissement (iPhone style)
    TELEGRAPH: "/sounds/telegraph.mp3" // Son de télégraphe (iPhone style)
};

class SoundManager {
    private static instance: SoundManager;
    private audioContext: AudioContext | null = null;
    private buffers: Map<string, AudioBuffer> = new Map();

    private constructor() {
        // Initialisation paresseuse de l'AudioContext pour éviter les problèmes d'autoplay
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    /**
     * Initialise le contexte audio et précharge les sons si nécessaire
     */
    private async initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Charge un fichier audio depuis une URL
     */
    private async loadSound(url: string): Promise<AudioBuffer | null> {
        if (this.buffers.has(url)) {
            return this.buffers.get(url)!;
        }

        try {
            await this.initAudioContext();
            if (!this.audioContext) return null;

            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            this.buffers.set(url, audioBuffer);
            return audioBuffer;
        } catch (error) {
            console.warn(`[SoundManager] Impossible de charger le son: ${url}`, error);
            return null;
        }
    }

    /**
     * Joue un son depuis un buffer
     */
    private async playBuffer(url: string, volume: number = 1.0) {
        try {
            await this.initAudioContext();
            if (!this.audioContext) return;

            // Essayer de charger si pas encore en cache
            let buffer = this.buffers.get(url);
            if (!buffer) {
                buffer = await this.loadSound(url);
            }

            if (buffer) {
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;

                const gainNode = this.audioContext.createGain();
                gainNode.gain.value = volume;

                source.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                source.start(0);
            }
        } catch (error) {
            console.error("[SoundManager] Erreur lors de la lecture:", error);
        }
    }

    /**
     * Joue le son de "Glissement" (Navigation)
     */
    public async playSlidingSound() {
        // Fallback silencieux si le fichier n'existe pas encore, ou log pour debug
        console.log("🔊 [SoundManager] Playing Sliding Sound");
        await this.playBuffer(SOUND_URLS.SLIDING, 0.6);
    }

    /**
     * Joue le son de "Télégraphe" (Documents)
     */
    public async playTelegraphSound() {
        console.log("🔊 [SoundManager] Playing Telegraph Sound");
        await this.playBuffer(SOUND_URLS.TELEGRAPH, 0.7);
    }
}

export const soundManager = SoundManager.getInstance();
