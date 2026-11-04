/**
 * Prompt Battle Royale — demo matchups.
 * One matchup per prompting principle. Outputs and judge scores are
 * pre-written for the demo; in live mode they come from the model + AI judge.
 *
 * scores: 1–10 per criterion. `rematch` is the Prompt Coach's rewrite of the
 * loser's prompt, with the output/scores it gets if the user keeps it as-is.
 */
const CRITERIA = ['accuracy', 'clarity', 'tone', 'format'];

const BATTLES = [
    {
        id: 'shot',
        principle: 'Zero-shot vs One-shot',
        blurb: 'Does one example beat no example?',
        task: 'Write a tagline for a reusable water bottle.',
        A: {
            name: 'ZERO-SHOT', tag: 'zero-shot', palette: 'red',
            prompt: 'Write a tagline for a reusable water bottle.',
            output: 'Stay hydrated with our reusable water bottle — good for you and good for the planet.',
            scores: { accuracy: 8, clarity: 8, tone: 5, format: 4 },
        },
        B: {
            name: 'ONE-SHOT', tag: 'one-shot example', palette: 'pink',
            prompt: 'Write a tagline for a reusable water bottle. Match the style of this example:\nProduct: Running shoes → "Your streets. Your pace. Zero excuses."\nProduct: Reusable water bottle →',
            output: '"Your sip. Your planet. Zero waste."',
            scores: { accuracy: 9, clarity: 7, tone: 9, format: 10 },
        },
        notes: {
            accuracy: 'Both are valid taglines; B nails the punchy brand style the task implies.',
            clarity: 'A says exactly what the product does. B is catchier but more abstract.',
            tone: 'A reads like a product label. B sounds like a real brand.',
            format: 'B copies the example\'s short, three-beat, quoted pattern. A is a long sentence.',
        },
        coach: {
            why: 'One example showed the model the length, rhythm and punctuation you wanted. The zero-shot prompt never said any of that, so it got a generic sentence.',
            rewrite: 'Write a tagline for a reusable water bottle in this style:\nProduct: Coffee grinder → "Fresh beans. Bold mornings. No compromise."\nProduct: Reusable water bottle →',
            output: '"Refill. Rethink. Rehydrate."',
            scores: { accuracy: 9, clarity: 8, tone: 9, format: 10 },
        },
    },
    {
        id: 'format',
        principle: 'No format vs Specified format',
        blurb: 'Does telling it the shape help?',
        task: 'Summarize the pros and cons of remote work.',
        A: {
            name: 'FREESTYLE', tag: 'no format', palette: 'gold',
            prompt: 'Summarize the pros and cons of remote work.',
            output: 'Remote work offers flexibility, no commute and often better focus, which many people find improves work-life balance. However, it can also lead to isolation, blurred boundaries between work and home, and communication challenges with teammates. Whether it works well depends on the person, the role and how the team is set up.',
            scores: { accuracy: 8, clarity: 6, tone: 8, format: 3 },
        },
        B: {
            name: 'FORMATTER', tag: 'format rule', palette: 'blue',
            prompt: 'Summarize the pros and cons of remote work.\nFormat: two lists titled "PROS" and "CONS", 3 bullets each, max 10 words per bullet.',
            output: 'PROS\n• No commute saves hours every week\n• Flexible schedule fits personal life\n• Fewer office distractions for deep work\n\nCONS\n• Isolation from teammates and culture\n• Work and home blur together\n• Slower, more fragmented communication',
            scores: { accuracy: 8, clarity: 9, tone: 6, format: 10 },
        },
        notes: {
            accuracy: 'Both cover the main trade-offs. Even round.',
            clarity: 'B can be scanned in seconds. A buries the points in a paragraph.',
            tone: 'A reads naturally and adds nuance. B is clipped.',
            format: 'B follows every rule: 2 titled lists, 3 bullets each, under 10 words.',
        },
        coach: {
            why: 'Stating the exact shape (titled lists, bullet count, word limit) removed the guesswork. The model can\'t read your mind about layout.',
            rewrite: 'Summarize the pros and cons of remote work as two lists titled "PROS" and "CONS", 3 bullets each, under 12 words per bullet. End with one sentence on who it suits best.',
            output: 'PROS\n• Skip the commute and reclaim hours each week\n• Set a schedule around your life\n• Quieter space for focused work\n\nCONS\n• Easy to feel cut off from the team\n• Work hours creep into evenings\n• Quick questions become slow threads\n\nBest for self-driven people with a clear home workspace.',
            scores: { accuracy: 9, clarity: 9, tone: 8, format: 10 },
        },
    },
    {
        id: 'specific',
        principle: 'Vague vs Specific',
        blurb: 'Audience + analogy + length rule.',
        task: 'Explain what an API is.',
        A: {
            name: 'PLAIN JANE', tag: 'plain prompt', palette: 'gold',
            prompt: 'Explain what an API is.',
            output: 'An API (Application Programming Interface) is a set of rules and protocols that allows different software applications to communicate with each other. It defines the methods and data formats that programs can use to request and exchange information.',
            scores: { accuracy: 8, clarity: 5, tone: 8, format: 4 },
        },
        B: {
            name: 'SPECIFIC', tag: 'analogy + format', palette: 'pink',
            prompt: 'Explain what an API is to a 12-year-old. Use a restaurant analogy. Keep it to 3 short sentences.',
            output: 'An API is like a waiter in a restaurant. You tell the waiter what you want from the menu, and they carry your order to the kitchen. Then they bring your food back, and you never have to go into the kitchen yourself!',
            scores: { accuracy: 9, clarity: 10, tone: 6, format: 10 },
        },
        notes: {
            accuracy: 'Both are correct. B\'s analogy maps request → response cleanly.',
            clarity: 'A is jargon-heavy ("protocols", "methods"). B lands instantly.',
            tone: 'A is neutral and professional. B is a bit cutesy for an adult reader.',
            format: 'B follows the 3-sentence rule exactly. A had no rule to follow.',
        },
        coach: {
            why: 'Naming an audience, an analogy and a length turned a textbook definition into something anyone gets.',
            rewrite: 'Explain what an API is to a new developer in 3 sentences. Use one real-world analogy, then give one concrete example of an API call.',
            output: 'An API is like a waiter: it takes your request to a system and brings back the result, so you never touch the kitchen. Apps use APIs to ask other services for data or actions in an agreed format. For example, a weather app calls GET /forecast?city=Delhi and gets back JSON with tomorrow\'s temperature.',
            scores: { accuracy: 10, clarity: 9, tone: 9, format: 10 },
        },
    },
    {
        id: 'role',
        principle: 'No role vs Role / persona',
        blurb: 'Does "You are an expert…" matter?',
        task: 'Give feedback on this story opening: "Once upon a time there was a dog."',
        A: {
            name: 'NOBODY', tag: 'no role', palette: 'blue',
            prompt: 'Give feedback on this story opening: "Once upon a time there was a dog."',
            output: 'This opening is simple and clear, but it is quite generic. Consider adding more detail about the dog or the setting to make it more engaging for readers.',
            scores: { accuracy: 7, clarity: 9, tone: 5, format: 6 },
        },
        B: {
            name: 'THE EDITOR', tag: 'role / persona', palette: 'red',
            prompt: 'You are a children\'s picture-book editor with 20 years of experience. Give feedback on this story opening: "Once upon a time there was a dog."',
            output: 'Lovely, classic rhythm, and kids know exactly where they are. But "a dog" gives them nothing to hold onto. Give the dog a name and one quirk ("a dog named Biscuit who was scared of puddles") and you\'ve got a hook a 5-year-old will want to follow. Keep it short enough to read aloud.',
            scores: { accuracy: 9, clarity: 8, tone: 10, format: 8 },
        },
        notes: {
            accuracy: 'Both give valid notes. B\'s are specific to picture books.',
            clarity: 'A is short and direct. B is longer.',
            tone: 'B sounds like a real editor: warm first, then honest.',
            format: 'B shows the fix with a sample line instead of just describing it.',
        },
        coach: {
            why: 'A role sets expertise and voice. The model drew on what a picture-book editor actually cares about: read-aloud rhythm and a hook for kids.',
            rewrite: 'You are a children\'s book editor. Give 3 bullet points of feedback on this opening for a picture book aimed at 4–6 year olds: "Once upon a time there was a dog." Include one rewritten example line.',
            output: '• Great read-aloud rhythm, so keep the classic start.\n• "A dog" is too vague: give a name and a quirk kids can picture.\n• Hint at a problem right away to create a hook.\nTry: "Once upon a time there was a dog named Biscuit, and Biscuit was scared of puddles."',
            scores: { accuracy: 10, clarity: 10, tone: 9, format: 10 },
        },
    },
    {
        id: 'cot',
        principle: 'Direct vs Step-by-step',
        blurb: 'Does asking it to think help?',
        task: 'A jacket costs $60 after a 25% discount. What was the original price?',
        A: {
            name: 'SPEEDRUN', tag: 'direct answer', palette: 'red',
            prompt: 'A jacket costs $60 after a 25% discount. What was the original price? Answer with just the number.',
            output: '$75',
            scores: { accuracy: 1, clarity: 4, tone: 7, format: 9 },
        },
        B: {
            name: 'THINKER', tag: 'step-by-step', palette: 'gold',
            prompt: 'A jacket costs $60 after a 25% discount. What was the original price? Think step by step, then give the final answer on its own line.',
            output: 'After a 25% discount you pay 75% of the original.\n0.75 × original = $60\noriginal = 60 ÷ 0.75 = $80\n\nFinal answer: $80',
            scores: { accuracy: 10, clarity: 9, tone: 7, format: 7 },
        },
        notes: {
            accuracy: 'A added 25% to $60, which is wrong. B sets up the equation and gets $80.',
            clarity: 'B shows its working, so you can trust it. A is a bare (wrong) number.',
            tone: 'Both neutral. Even round.',
            format: 'A followed "just the number" exactly. B is longer than needed.',
        },
        coach: {
            why: 'Asking for reasoning made the model set up the equation instead of guessing. Percent-off problems are a classic trap for "just answer" prompts.',
            rewrite: 'A jacket costs $60 after a 25% discount. Work out the original price step by step, check your answer by applying the discount, then give the final number on its own line.',
            output: 'Paying 75% of the original: 0.75 × P = 60\nP = 60 ÷ 0.75 = 80\nCheck: 80 − 25% (20) = 60 ✓\n\n$80',
            scores: { accuracy: 10, clarity: 9, tone: 7, format: 9 },
        },
    },
];

function getBattle(id) {
    return BATTLES.find(b => b.id === id) || BATTLES[0];
}

/**
 * Demo judge for prompts the user edits (no backend yet).
 * Looks for prompting techniques in the text and scores 1–10 per criterion.
 */
function heuristicJudge(prompt) {
    const t = prompt.toLowerCase();
    const words = t.split(/\s+/).filter(Boolean).length;
    const has = {
        example: /example|e\.g\.|for instance|→|->|in this style|input:|output:/.test(t),
        format: /format|bullet|list|json|table|heading|titled|on its own line|\d+\s+(short\s+)?(sentences?|bullets?|points?|lines?|words?)|under \d+|max(imum)? \d+/.test(t),
        role: /\byou are\b|\bact as\b|\bpretend to be\b/.test(t),
        steps: /step[- ]by[- ]step|show your (work|reasoning)|\bthink\b|check your/.test(t),
        audience: /year[- ]old|beginner|audience|aimed at|new developer|kids|children|\bfor an? \w+/.test(t),
        analogy: /analogy|metaphor|like a\b/.test(t),
    };
    const spec = Math.min(2, Math.floor(words / 15)) * 0.5;
    const clamp = n => Math.max(1, Math.min(10, Math.round(n)));
    return {
        scores: {
            accuracy: clamp(5 + (has.steps ? 3 : 0) + (has.example ? 1 : 0) + (has.audience ? 0.5 : 0) + spec),
            clarity: clamp(5 + (has.audience ? 2 : 0) + (has.analogy ? 1 : 0) + (has.format ? 1 : 0) + spec),
            tone: clamp(5 + (has.role ? 3 : 0) + (has.audience ? 1 : 0) + (has.example ? 1 : 0)),
            format: clamp(4 + (has.format ? 4 : 0) + (has.example ? 2 : 0)),
        },
        detected: Object.keys(has).filter(k => has[k]),
    };
}
