const dot = document.querySelector('.cursor-dot');
const outline = document.querySelector('.cursor-outline');
const title = document.querySelector('h1');
const subtitle = document.querySelectorAll('h2')[0]; // Erstes h2 (Untertitel)
const scrollArrow = document.querySelector('.scroll-arrow');
const projectsTitle = document.querySelector('.projects-title');
const projectCards = document.querySelectorAll('.project-card');
const videoText = document.querySelector('.video-text h2');

// AUDIO PLAYER (Smart Nachttisch)
const audioEl = document.getElementById('smartdesk-audio');
const audioPlayBtn = document.getElementById('audio-play');
const audioProgressWrap = document.getElementById('audio-progress-wrap');
const audioProgress = document.getElementById('audio-progress');
const audioCurrent = document.getElementById('audio-current');
const audioDuration = document.getElementById('audio-duration');

function formatTime(t) {
    if (isNaN(t) || !isFinite(t)) return '0:00';
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// Play / Pause toggle
if (audioPlayBtn && audioEl) {
    audioPlayBtn.addEventListener('click', () => {
        if (audioEl.paused) {
            audioEl.play();
        } else {
            audioEl.pause();
        }
    });

    // Instead of replacing text, toggle a `.playing` class so CSS renders thin pause bars
    audioEl.addEventListener('play', () => {
        audioPlayBtn.classList.add('playing');
        audioPlayBtn.setAttribute('aria-label', 'Pause');
        audioPlayBtn.title = 'Pause';
    });

    audioEl.addEventListener('pause', () => {
        audioPlayBtn.classList.remove('playing');
        audioPlayBtn.setAttribute('aria-label', 'Play');
        audioPlayBtn.title = 'Play';
    });

    audioEl.addEventListener('loadedmetadata', () => {
        audioDuration.textContent = formatTime(audioEl.duration);
    });

    audioEl.addEventListener('timeupdate', () => {
        const pct = (audioEl.currentTime / (audioEl.duration || 1)) * 100;
        audioProgress.style.width = pct + '%';
        audioCurrent.textContent = formatTime(audioEl.currentTime);
    });

    // Seek by clicking on progress track
    audioProgressWrap.addEventListener('click', (e) => {
        const rect = audioProgressWrap.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        audioEl.currentTime = pct * (audioEl.duration || 0);
    });

    // allow dragging (basic)
    let seeking = false;
    audioProgressWrap.addEventListener('mousedown', () => { seeking = true; });
    window.addEventListener('mouseup', () => { seeking = false; });
    window.addEventListener('mousemove', (e) => {
        if (!seeking) return;
        const rect = audioProgressWrap.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        audioEl.currentTime = pct * (audioEl.duration || 0);
    });

    // Reset UI when audio ended
    audioEl.addEventListener('ended', () => {
        audioPlayBtn.classList.remove('playing');
        audioPlayBtn.setAttribute('aria-label', 'Play');
        audioPlayBtn.title = 'Play';
        audioProgress.style.width = '0%';
        audioCurrent.textContent = formatTime(0);
    });
}

let mouseX = 0;
let mouseY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let lastMouseTime = performance.now();
let mouseSpeed = 0; // px/ms
let outlineX = 0;
let outlineY = 0;
let idleTimer;
let isMagnifying = false;

// Alle interaktiven Text-Elemente
const textElements = [title, subtitle, projectsTitle];
if (videoText) {
    textElements.push(videoText);
}

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Dot folgt direkt der Maus
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
    
    // Entferne Fade-out bei Bewegung
    outline.classList.remove('idle');
    
    // Setze Timer zurück
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        if (!isMagnifying) {
            outline.classList.add('idle');
        }
    }, 500);
    // compute simple mouse speed (px per millisecond)
    const now = performance.now();
    const dt = Math.max(1, now - lastMouseTime);
    const dx = mouseX - lastMouseX;
    const dy = mouseY - lastMouseY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    // small smoothing for speed
    const instSpeed = dist / dt;
    mouseSpeed = mouseSpeed * 0.8 + instSpeed * 0.2;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    lastMouseTime = now;
});

// Funktion für Text-Hover (Lupe-Effekt)
function handleTextEnter(element) {
    isMagnifying = true;
    
    // Aktiviere Lupe-Effekt
    dot.classList.add('magnify');
    outline.classList.add('magnify');
    outline.classList.remove('idle');
}

function handleTextLeave(element) {
    isMagnifying = false;
    
    // Deaktiviere Lupe-Effekt
    dot.classList.remove('magnify');
    outline.classList.remove('magnify');
}

// Event Listener für alle Text-Elemente
textElements.forEach(element => {
    element.addEventListener('mouseenter', () => handleTextEnter(element));
    element.addEventListener('mouseleave', () => handleTextLeave(element));
});

// Scroll-Arrow Hover
scrollArrow.addEventListener('mouseenter', () => {
    scrollArrow.classList.add('cursor-hover');
});

scrollArrow.addEventListener('mouseleave', () => {
    scrollArrow.classList.remove('cursor-hover');
});

// Scroll-Funktion
scrollArrow.addEventListener('click', () => {
    const videoSection = document.querySelector('.video-section');
    if (videoSection) {
        videoSection.scrollIntoView({
            behavior: 'smooth'
        });
    }
});

// Cursor-Outline Animation
function animateOutline() {
    const distX = mouseX - outlineX;
    const distY = mouseY - outlineY;
    
    // Bei Lupe langsamer, sonst schneller und responsiver
    const speed = isMagnifying ? 0.08 : 0.25;
    
    outlineX += distX * speed;
    outlineY += distY * speed;
    
    outline.style.left = outlineX + 'px';
    outline.style.top = outlineY + 'px';
    
    requestAnimationFrame(animateOutline);
}

// Initialisiere die Position beim Start
outlineX = window.innerWidth / 2;
outlineY = window.innerHeight / 2;

animateOutline();

/* ---------- Animated chart bars (hero) ---------- */
// Build a network of small chart nodes around the headline (positions relative to hero)
(() => {
    const hero = document.querySelector('.hero-section');
    if (!hero) return;

    const nodeConfigs = [
        { x: 20, y: 13, scale: 0.9, bars: 6 }, // top-left
        { x: 80, y: 12, scale: 1.05, bars: 7 }, // top-right
        { x: 9, y: 45, scale: 0.9, bars: 5 },  // left-middle
        { x: 92, y: 45, scale: 1.1, bars: 8 },  // right-middle
        { x: 24, y: 78, scale: 0.8, bars: 5 },  // bottom-left
        { x: 76, y: 78, scale: 0.95, bars: 6 }, // bottom-right
        { x: 50, y: 6, scale: 0.6, bars: 4 },   // top-center small
        { x: 50, y: 86, scale: 0.6, bars: 4 }   // bottom-center small
    ];

    const network = document.createElement('div');
    network.className = 'chart-network';
    network.id = 'chart-network';

    // svg element for connecting lines
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('chart-net-lines');
    svg.setAttribute('aria-hidden', 'true');

    const nodes = [];
    const lines = [];

    // create nodes
    nodeConfigs.forEach((cfg, idx) => {
        const node = document.createElement('div');
        node.className = 'chart-node';
        node.dataset.id = String(idx);
        node.style.left = cfg.x + '%';
        node.style.top = cfg.y + '%';
        node.style.transform = `translate(-50%, -50%) scale(${cfg.scale})`;

        // small cluster of bars
        const barsWrap = document.createElement('div');
        barsWrap.className = 'chart-bars';
        for (let i = 0; i < cfg.bars; i++) {
            const item = document.createElement('div');
            item.className = 'chart-item';
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.dataset.i = String(i);
            const label = document.createElement('div');
            label.className = 'chart-label';
            label.textContent = '·';
            item.appendChild(bar);
            item.appendChild(label);
            barsWrap.appendChild(item);
        }

        node.appendChild(barsWrap);
        network.appendChild(node);

        nodes.push({ el: node, cfg, vx: 0, vy: 0, tx: 0, ty: 0 });
    });

    // add nodes and SVG to hero
    hero.appendChild(svg);
    hero.appendChild(network);

    // create a connected mesh (ring + cross links)
    function makeLine(aIdx, bIdx) {
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('stroke-linecap', 'round');
        svg.appendChild(l);
        lines.push({ el: l, a: aIdx, b: bIdx });
    }

    // connect in sequence
    for (let i = 0; i < nodes.length; i++) {
        makeLine(i, (i + 1) % nodes.length);
    }
    // add some cross-connections for a net look
    for (let i = 0; i < nodes.length; i++) {
        makeLine(i, (i + 3) % nodes.length);
    }

    // store to window scope for the animation loop to reference
    window.__chartNetwork = { nodes, lines, svg, container: network };
})();
const chartItems = Array.from(document.querySelectorAll('.chart-item'));
const chartBars = chartItems.map(item => item.querySelector('.chart-bar'));
const chartLabels = chartItems.map(item => item.querySelector('.chart-label'));
if (chartBars.length) {
    // per-bar state
    const baseScale = 1.0; // relative to base CSS height
    const barState = chartBars.map(() => ({ current: 1, target: 1, offset: Math.random() * 0.6 - 0.3 }));

    // helper: generate random alphanumeric char
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    function randomChar() {
        return charset[Math.floor(Math.random() * charset.length)];
    }

    function updateBarTargets() {
        // map mouseSpeed to a multiplier - tuned small for subtle effect
        // typical mouseSpeed values ~ 0-1.5 px/ms; scale down for gentle motion
        const speedFactor = Math.min(2.0, mouseSpeed * 1.8); // clamp

        for (let i = 0; i < chartBars.length; i++) {
            // create a random target around baseScale influenced by speed and a per-bar offset
            const rand = (Math.random() * 0.9 + 0.6); // base random
            // use stagger by position so bars don't all move together
            const stagger = 0.6 + (i % 5) * 0.08;
            const variance = 0.45 * rand * stagger;
            const target = baseScale + (speedFactor * variance) + barState[i].offset * 0.35;
            barState[i].target = Math.max(0.25, target);
            // update label text when a new target is set — more frequent during active movement
            if (chartLabels[i]) {
                // randomness: more chance to update with higher speed
                const chance = Math.min(0.95, 0.08 + Math.abs(mouseSpeed) * 0.7 + Math.random() * 0.2);
                if (Math.random() < chance) {
                    chartLabels[i].textContent = randomChar();
                }
            }
        }
    }

    function animateBars() {
        // small continuous breathing motion even without movement
        for (let i = 0; i < chartBars.length; i++) {
            // gently move current towards target
            const s = barState[i];
            const lerp = 0.12; // smoothing
            s.current += (s.target - s.current) * lerp;
            // apply transform: scaleY
            const scale = Math.max(0.18, s.current);
            chartBars[i].style.transform = `scaleY(${scale})`;
            // set active class on item to highlight label when bar is lively
            const item = chartItems[i];
            if (item) {
                if (scale > 1.08) item.classList.add('active');
                else item.classList.remove('active');
            }
            // slightly vary opacity with scale for depth
            chartBars[i].style.opacity = (0.55 + Math.min(0.9, scale * 0.5)).toString();
        }

        // move targets slowly for a nice random feel
        if (Math.random() < 0.18) updateBarTargets();

        // network node shove + line updates
        const net = window.__chartNetwork;
        if (net) {
            const { nodes, lines, svg } = net;
            // update node positions with a gentle shove away from mouse
            for (let n = 0; n < nodes.length; n++) {
                const node = nodes[n];
                const el = node.el;
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = cx - mouseX;
                const dy = cy - mouseY;
                const dist = Math.sqrt(dx*dx + dy*dy);

                // shove radius & max displacement
                const radius = Math.max(80, Math.min(220, 160));
                const maxPush = 12; // px max shove
                let push = 0;
                if (dist < radius) {
                    const pct = (radius - dist) / radius; // 0..1
                    const speedEffect = Math.min(2.0, 1 + (mouseSpeed * 3));
                    push = pct * maxPush * speedEffect * 0.7; // small sensitivity
                }

                // target translation away from mouse
                const tx = (dist > 0) ? (dx / dist) * push : 0;
                const ty = (dist > 0) ? (dy / dist) * push : 0;

                // smoothing
                node.vx += (tx - node.vx) * 0.22;
                node.vy += (ty - node.vy) * 0.22;

                // keep base scale in transform; we add translate offsets
                const baseScale = node.cfg && node.cfg.scale ? node.cfg.scale : 1;
                el.style.transform = `translate(-50%, -50%) translate(${node.vx.toFixed(2)}px, ${node.vy.toFixed(2)}px) scale(${baseScale})`;
                // gentle visual emphasis on active nodes
                if (Math.abs(node.vx) > 2 || Math.abs(node.vy) > 2) el.classList.add('active');
                else el.classList.remove('active');
            }

            // update SVG lines based on node centers
            for (let ln of lines) {
                const a = nodes[ln.a].el.getBoundingClientRect();
                const b = nodes[ln.b].el.getBoundingClientRect();
                const ax = a.left + a.width / 2 - svg.getBoundingClientRect().left;
                const ay = a.top + a.height / 2 - svg.getBoundingClientRect().top;
                const bx = b.left + b.width / 2 - svg.getBoundingClientRect().left;
                const by = b.top + b.height / 2 - svg.getBoundingClientRect().top;
                ln.el.setAttribute('x1', String(ax));
                ln.el.setAttribute('y1', String(ay));
                ln.el.setAttribute('x2', String(bx));
                ln.el.setAttribute('y2', String(by));
                // subtle stroke width if either node active
                const activeA = nodes[ln.a].vx || nodes[ln.a].vy;
                const activeB = nodes[ln.b].vx || nodes[ln.b].vy;
                const active = (Math.abs(activeA) > 1 || Math.abs(activeB) > 1);
                ln.el.style.strokeWidth = active ? '1.9' : '1.2';
                ln.el.style.opacity = active ? '0.95' : '0.75';
            }
        }

        requestAnimationFrame(animateBars);
    }

    // update targets periodically and when mouse moves fast
    setInterval(() => {
        // if mouseSpeed high then refresh targets more aggressively
        if (mouseSpeed > 0.25 || Math.random() < 0.05) {
            updateBarTargets();
        }
    }, 200);

    // start targets and animation
    updateBarTargets();
    requestAnimationFrame(animateBars);
}

document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    outline.style.opacity = '0';
});

document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    outline.style.opacity = '1';
});

/* ---------- Scramble animation for 'Statistische Bundesamt' ---------- */
(() => {
    const el = document.getElementById('sb-animated');
    if (!el) return;

    // Create individual character elements so we can animate left-to-right
    const targetText = el.textContent || 'Statistische Bundesamt';
    el.textContent = '';
    const chars = Array.from(targetText).map(ch => {
        const span = document.createElement('span');
        span.className = 'sb-char resolved';
        span.textContent = ch;
        el.appendChild(span);
        return span;
    });

    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let running = false;

    // slower defaults for a gentler, more readable reveal
    function runScramble({ totalDuration = 4000, charDelay = 80 } = {}) {
        if (running) return; // don't overlap
        running = true;

        const n = chars.length;
        const scrambleDuration = Math.max(300, totalDuration - charDelay * (n - 1));
        const start = performance.now();
        // mark parent h2 as scrambling so surrounding text shifts aside
        const parentH2 = el.closest('h2');
        if (parentH2) parentH2.classList.add('scrambling');

        // reset states
        chars.forEach((c) => { c.classList.remove('scramble', 'resolved'); c.classList.add('scramble'); });

        function frame(now) {
            const elapsed = now - start;
            let finishedCount = 0;

            for (let i = 0; i < n; i++) {
                const charEl = chars[i];
                const charStart = i * charDelay;
                const charEnd = charStart + scrambleDuration;

                if (elapsed < charStart) {
                    // not started yet: show original (dim)
                    // do nothing — keep displayed char as original
                } else if (elapsed >= charEnd) {
                    // resolved: ensure correct final character
                    charEl.textContent = targetText[i];
                    charEl.classList.remove('scramble');
                    charEl.classList.add('resolved');
                    finishedCount++;
                } else {
                    // scramble: show random char
                    if (targetText[i] === ' ') {
                        charEl.textContent = ' ';
                        charEl.classList.remove('scramble');
                        charEl.classList.add('resolved');
                        finishedCount++;
                        continue;
                    }
                    // display random char with probability based on time inside the scramble window
                    if (Math.random() < 0.5 || (elapsed - charStart) < (scrambleDuration * 0.6)) {
                        charEl.textContent = charset.charAt(Math.floor(Math.random() * charset.length));
                    } else {
                        // occasionally show correct char early for smoother effect
                        charEl.textContent = targetText[i];
                    }
                }
            }

            if (finishedCount >= n) {
                // finished — clear scrambling state on parent h2
                if (parentH2) parentH2.classList.remove('scrambling');
                running = false;
                return; // done
            }

            requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }

    // start on load after a small delay so it isn't abrupt
    setTimeout(() => runScramble(), 2200);

    // repeat every 20 seconds
    setInterval(() => runScramble(), 20_000);
})();