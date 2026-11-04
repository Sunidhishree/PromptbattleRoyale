/**
 * Prompt Battle Royale — arena controller.
 * Plays a 4-round fight: each round the lower-scoring prompt takes
 * damage proportional to the score gap. Then shows the verdict + Prompt Coach.
 */
(() => {
    const DAMAGE_PER_POINT = 8;
    const $ = id => document.getElementById(id);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pace = ms => (reduceMotion ? ms * 0.5 : ms);

    const battle = getBattle(new URLSearchParams(location.search).get('battle'));

    // Mutable fighter state (prompt/output/scores change on rematch)
    const F = {};
    ['A', 'B'].forEach(side => {
        const src = battle[side];
        F[side] = {
            side,
            name: src.name,
            tag: src.tag,
            palette: src.palette,
            prompt: src.prompt,
            output: src.output,
            scores: { ...src.scores },
            original: true,
            edited: false,
            hp: 100,
            ctrl: createFighter(src.palette),
        };
    });
    const other = s => (s === 'A' ? F.B : F.A);

    let fighting = false;
    let lastResult = null;

    // ---------- render ----------
    function renderStatic() {
        document.title = `${F.A.name} vs ${F.B.name} — Prompt Battle Royale`;
        $('principle').textContent = battle.principle;
        $('task').textContent = battle.task;
        ['A', 'B'].forEach(s => {
            const f = F[s];
            $('name' + s).textContent = f.name;
            $('cardName' + s).textContent = f.name;
            $('th' + s).textContent = f.name;
            $('tag' + s).textContent = f.tag + (f.edited ? ' · edited' : '');
            $('prompt' + s).textContent = f.prompt;
            $('out' + s).textContent = 'Waiting for the bell…';
            $('out' + s).classList.add('waiting');
            document.querySelector('.fcard.' + s.toLowerCase()).classList.toggle('edited', f.edited);
            const fw = $('fw' + s);
            if (!fw.contains(f.ctrl.canvas)) fw.appendChild(f.ctrl.canvas);
        });
        const tbody = $('score').querySelector('tbody');
        tbody.innerHTML = CRITERIA.map(c => `<tr data-c="${c}"><td>${c}</td><td class="a">–</td><td class="b">–</td></tr>`).join('');
        $('totA').textContent = '0';
        $('totB').textContent = '0';
        $('log').innerHTML = '';
    }

    function setHp(side, hp) {
        F[side].hp = Math.max(0, hp);
        const pct = F[side].hp + '%';
        const cls = F[side].hp <= 25 ? 'low' : F[side].hp <= 55 ? 'mid' : '';
        [$('hp' + side), $('miniHp' + side)].forEach(el => {
            el.style.width = pct;
            el.className = 'hp-fill ' + cls;
        });
        $('hp' + side + '-num').textContent = F[side].hp;
    }

    function resetFighters() {
        ['A', 'B'].forEach(s => {
            setHp(s, 100);
            F[s].ctrl.setPose('idle');
            $('fw' + s).className = 'fw ' + s.toLowerCase();
            document.querySelector('.fcard.' + s.toLowerCase()).classList.remove('winner');
        });
        $('banner').className = 'banner';
        $('round-label').textContent = 'READY?';
    }

    async function banner(html, { stay = false } = {}) {
        const el = $('banner');
        el.innerHTML = html;
        el.className = 'banner';
        void el.offsetWidth; // restart animation
        el.className = 'banner ' + (stay ? 'stay' : 'show');
        if (!stay) await sleep(pace(1100));
    }

    function popDamage(side, text, isBlock) {
        const fw = $('fw' + side);
        const stage = $('stage');
        const d = document.createElement('div');
        d.className = 'dmg' + (isBlock ? ' block' : '');
        d.textContent = text;
        d.style.left = (fw.offsetLeft + fw.offsetWidth * 0.35) + 'px';
        d.style.top = (fw.offsetTop - 10) + 'px';
        stage.appendChild(d);
        setTimeout(() => d.remove(), 1000);
    }

    async function typeOutputs() {
        const els = { A: $('outA'), B: $('outB') };
        ['A', 'B'].forEach(s => { els[s].textContent = ''; els[s].classList.remove('waiting'); });
        const steps = 36;
        for (let i = 1; i <= steps; i++) {
            ['A', 'B'].forEach(s => {
                const txt = F[s].output;
                els[s].textContent = txt.slice(0, Math.ceil((txt.length * i) / steps));
            });
            await sleep(reduceMotion ? 5 : 30);
        }
    }

    function logNote(crit, text) {
        const li = document.createElement('li');
        li.innerHTML = `<b>${crit.toUpperCase()}</b>`;
        li.appendChild(document.createTextNode(text));
        $('log').appendChild(li);
    }

    function roundNote(crit, a, b) {
        if (F.A.original && F.B.original) return battle.notes[crit];
        if (a === b) return `Even round: both score ${a}.`;
        const w = a > b ? F.A : F.B;
        return `${w.name} takes ${crit}, ${Math.max(a, b)} to ${Math.min(a, b)}.`;
    }

    // ---------- the fight ----------
    async function fight() {
        if (fighting) return;
        fighting = true;
        $('fight-btn').disabled = true;
        renderStatic();
        resetFighters();

        SFX.play('bell', 0.6);
        await banner('READY…<small>' + escapeHtml(battle.principle) + '</small>');
        await typeOutputs();
        await banner('FIGHT!');

        const totals = { A: 0, B: 0 };
        let ko = null;

        for (let i = 0; i < CRITERIA.length; i++) {
            const crit = CRITERIA[i];
            $('round-label').innerHTML = `ROUND ${i + 1}/4<br>${crit.toUpperCase()}`;
            await banner(`ROUND ${i + 1}<small>${crit.toUpperCase()}</small>`);

            const a = F.A.scores[crit];
            const b = F.B.scores[crit];
            totals.A += a;
            totals.B += b;
            const row = $('score').querySelector(`tr[data-c="${crit}"]`);
            row.querySelector('.a').textContent = a;
            row.querySelector('.b').textContent = b;
            $('totA').textContent = totals.A;
            $('totB').textContent = totals.B;

            if (a === b) {
                F.A.ctrl.setPose('block');
                F.B.ctrl.setPose('block');
                SFX.play('thud', 0.5);
                popDamage('A', 'BLOCK', true);
                popDamage('B', 'BLOCK', true);
                await sleep(pace(900));
            } else {
                const w = a > b ? F.A : F.B;
                const l = other(w.side);
                const dmg = Math.abs(a - b) * DAMAGE_PER_POINT;
                row.querySelector('.' + w.side.toLowerCase()).classList.add('win');

                const fwW = $('fw' + w.side);
                const fwL = $('fw' + l.side);
                fwW.classList.add('lunge');
                w.ctrl.setPose('punch');
                await sleep(pace(170));
                SFX.play(dmg >= 32 ? 'kick' : 'hit', 0.8);
                l.ctrl.setPose('hit');
                fwL.classList.add('hurt', 'shake');
                popDamage(l.side, '-' + dmg);
                setHp(l.side, l.hp - dmg);
                await sleep(pace(140));
                fwL.classList.remove('hurt');
                await sleep(pace(450));
                fwW.classList.remove('lunge');
                fwL.classList.remove('shake');
                w.ctrl.setPose('idle');
                if (l.hp <= 0) {
                    ko = l.side;
                } else {
                    l.ctrl.setPose('idle');
                }
            }
            logNote(crit, roundNote(crit, a, b));
            F.A.ctrl.setPose(ko === 'A' ? 'hit' : 'idle');
            F.B.ctrl.setPose(ko === 'B' ? 'hit' : 'idle');

            if (ko) {
                F[ko].ctrl.setPose('ko');
                $('fw' + ko).classList.add('ko');
                SFX.play('thud', 0.9);
                await banner('K.O.!');
                break;
            }
            await sleep(pace(350));
        }

        // Verdict: more health wins; total points break ties.
        let winner = null;
        if (F.A.hp !== F.B.hp) winner = F.A.hp > F.B.hp ? F.A : F.B;
        else if (totals.A !== totals.B) winner = totals.A > totals.B ? F.A : F.B;

        if (winner) {
            winner.ctrl.setPose('win');
            document.querySelector('.fcard.' + winner.side.toLowerCase()).classList.add('winner');
            SFX.play('win', 0.6);
            $('round-label').textContent = winner.name + ' WINS';
            await banner(`${escapeHtml(winner.name)}<small>WINS!</small>`, { stay: true });
        } else {
            $('round-label').textContent = 'DRAW';
            await banner('DRAW!', { stay: true });
        }

        lastResult = { winner, loser: winner ? other(winner.side) : F.A, totals, ko };
        await sleep(pace(1600));
        showVerdict();
        fighting = false;
        $('fight-btn').disabled = false;
        $('fight-btn').textContent = 'FIGHT AGAIN';
    }

    // ---------- verdict + coach ----------
    let verdictFighter = null;

    function showVerdict() {
        const { winner, loser, totals, ko } = lastResult;
        const vf = $('v-fighter');
        vf.innerHTML = '';
        if (verdictFighter) verdictFighter.stop();
        if (winner) {
            verdictFighter = createFighter(winner.palette);
            verdictFighter.setPose('win');
            vf.appendChild(verdictFighter.canvas);
        }

        $('v-title').textContent = winner ? `${winner.name} WINS${ko ? ' BY K.O.' : ''}!` : 'IT\'S A DRAW!';
        $('v-stats').innerHTML =
            `HEALTH ${F.A.name} ${F.A.hp} · ${F.B.name} ${F.B.hp}<br>POINTS ${F.A.name} ${totals.A} · ${F.B.name} ${totals.B}`;

        const coach = battle.coach;
        let why;
        let rewrite = null;
        const loserIsOriginalA = loser.side === 'A' && loser.original;

        if (!winner) {
            why = 'Dead even on health and points. Edit one prompt to break the tie.';
        } else if (F.A.original && F.B.original) {
            why = coach.why;
            rewrite = coach.rewrite;
        } else if (winner && winner.edited) {
            why = `Your edit flipped the result! ${winner.name} now wins on ${winningCriteria(winner).join(', ') || 'points'}. ` +
                  `That's the point of this battle: ${battle.principle.toLowerCase()} changes what the model gives back.`;
        } else {
            const missing = missingTechniques(loser.prompt);
            why = `${loser.name} still loses. ` + (missing.length
                ? `Try adding: ${missing.join(', ')}.`
                : 'Make the prompt more specific about what a great answer looks like.');
            rewrite = loser.side === 'A' && loser.prompt.trim() !== coach.rewrite.trim() ? coach.rewrite : null;
        }

        $('coach-why').textContent = why;
        $('coach-rewrite-wrap').classList.toggle('hidden', !rewrite);
        if (rewrite) {
            $('coach-loser').textContent = loser.name;
            $('coach-rewrite').textContent = rewrite;
        }
        $('rematch-btn').textContent = loserIsOriginalA || (winner && !winner.edited)
            ? 'REMATCH WITH EDITED PROMPT' : 'EDIT A PROMPT & REMATCH';
        $('verdict').classList.remove('hidden');
        $('rematch-btn').focus();
    }

    function winningCriteria(f) {
        const o = other(f.side);
        return CRITERIA.filter(c => f.scores[c] > o.scores[c]);
    }

    function missingTechniques(prompt) {
        const found = heuristicJudge(prompt).detected;
        const tips = {
            example: 'an example of the output you want',
            format: 'a format rule (length, bullets, headings)',
            role: 'a role ("You are a…")',
            steps: '"think step by step"',
            audience: 'who the answer is for',
        };
        return Object.keys(tips).filter(k => !found.includes(k)).slice(0, 3).map(k => tips[k]);
    }

    // ---------- rematch editor ----------
    let editSide = 'A';

    function openEditor() {
        const loser = lastResult ? lastResult.loser : F.A;
        editSide = loser.side;
        $('e-name').textContent = loser.name;
        const suggest = editSide === 'A' && loser.original ? battle.coach.rewrite : loser.prompt;
        $('e-text').value = suggest;
        $('verdict').classList.add('hidden');
        $('editor').classList.remove('hidden');
        $('e-text').focus();
    }

    function applyEdit() {
        const text = $('e-text').value.trim();
        if (!text) { $('e-text').focus(); return; }
        const f = F[editSide];
        const src = battle[editSide];
        f.prompt = text;
        if (text === src.prompt.trim()) {
            Object.assign(f, { output: src.output, scores: { ...src.scores }, original: true, edited: false });
        } else if (editSide === 'A' && text === battle.coach.rewrite.trim()) {
            Object.assign(f, { output: battle.coach.output, scores: { ...battle.coach.scores }, original: false, edited: true });
        } else {
            const judged = heuristicJudge(text);
            Object.assign(f, {
                output: '[Demo mode] In the live app, the model answers this prompt here.\n' +
                        'Demo judge spotted: ' + (judged.detected.join(', ') || 'no techniques') + '.',
                scores: judged.scores,
                original: false,
                edited: true,
            });
        }
        $('editor').classList.add('hidden');
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        fight();
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    // ---------- wire up ----------
    SFX.bindMuteButton($('mute-btn'));
    $('fight-btn').addEventListener('click', fight);
    $('rematch-btn').addEventListener('click', openEditor);
    $('close-verdict').addEventListener('click', () => $('verdict').classList.add('hidden'));
    $('e-go').addEventListener('click', applyEdit);
    $('e-cancel').addEventListener('click', () => $('editor').classList.add('hidden'));
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            $('verdict').classList.add('hidden');
            $('editor').classList.add('hidden');
        }
    });

    renderStatic();
    resetFighters();
})();
