/** Tiny sound helper with a persistent mute toggle. */
const SFX_FILES = {
    click: 'assets/sounds/click.mp3',
    hit: 'assets/sounds/hit.mp3',
    kick: 'assets/sounds/kick.mp3',
    thud: 'assets/sounds/thud.mp3',
    bell: 'assets/sounds/bell.mp3',
    win: 'assets/sounds/win.mp3',
    start: 'assets/sounds/start.mp3',
};

const SFX = {
    muted: localStorage.getItem('pbr-muted') === '1',
    music: null,

    play(name, volume = 0.7) {
        if (this.muted || !SFX_FILES[name]) return null;
        const a = new Audio(SFX_FILES[name]);
        a.volume = volume;
        a.play().catch(() => {});
        return a;
    },

    /** Loop background music; if autoplay is blocked, start on first interaction. */
    startMusic(name = 'start', volume = 0.5) {
        if (!this.music) {
            this.music = new Audio(SFX_FILES[name]);
            this.music.loop = true;
            this.music.volume = volume;
        }
        if (this.muted) return;
        this.music.play().catch(() => {
            const go = () => { if (!this.muted) this.music.play().catch(() => {}); };
            document.addEventListener('pointerdown', go, { once: true });
            document.addEventListener('keydown', go, { once: true });
        });
    },

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('pbr-muted', this.muted ? '1' : '0');
        if (this.music) this.muted ? this.music.pause() : this.music.play().catch(() => {});
        return this.muted;
    },

    /** Wire a button to toggle mute and show its state. */
    bindMuteButton(btn) {
        const render = () => { btn.textContent = this.muted ? '♪ OFF' : '♪ ON'; btn.setAttribute('aria-pressed', String(!this.muted)); };
        btn.addEventListener('click', () => { this.toggleMute(); render(); });
        render();
    },
};

document.addEventListener('click', e => {
    if (e.target.closest('button')) SFX.play('click', 0.5);
});
