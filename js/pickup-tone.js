(function () {
    'use strict';

    const PICKUP_URL = 'assets/audio/pick-up.wav';
    let player = null;
    let loadPromise = null;

    function primeAudioContext() {
        if (typeof Tone === 'undefined') return;
        Tone.start().catch(function () {});
    }

    ['click', 'keydown', 'touchstart'].forEach(function (ev) {
        window.addEventListener(ev, primeAudioContext, { once: true, passive: true });
    });

    function ensurePlayer() {
        if (typeof Tone === 'undefined') return Promise.resolve(null);
        if (player) return Promise.resolve(player);
        if (loadPromise) return loadPromise;

        loadPromise = Tone.start()
            .then(function () {
                player = new Tone.Player({ url: PICKUP_URL }).toDestination();
                var done = Tone.loaded().then(function () { return player; });
                var timeout = new Promise(function (_, reject) {
                    setTimeout(function () {
                        reject(new Error('timeout'));
                    }, 20000);
                });
                return Promise.race([done, timeout]);
            })
            .catch(function (e) {
                console.warn('[pickup-tone] failed to load', PICKUP_URL, e);
                loadPromise = null;
                player = null;
                return null;
            });

        return loadPromise;
    }

    window.playIconPickupSound = function () {
        ensurePlayer().then(function (p) {
            if (!p) return;
            try {
                p.stop();
                p.start();
            } catch (e) {
                /* ignore */
            }
        });
    };
})();
