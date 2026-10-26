// Groups and the 15 vibe coder types.
// traits: % toward the left pole of each axis in AXES (0-100).

const GROUPS = {
  overthinkers: { name: 'The Overthinkers', color: 'purple', blurb: 'Think first. Then think again. Code maybe.' },
  speedrunners: { name: 'The Speedrunners', color: 'yellow', blurb: 'Shortest path from idea to production. Bugs included.' },
  hustlers: { name: 'The Hustlers', color: 'green', blurb: 'Building is optional. Posting about it is not.' },
  chaos: { name: 'The Chaos Agents', color: 'coral', blurb: 'Many tabs. Many agents. Many unfinished things.' }
};

const AXES = [
  ['Trusts the AI', 'Trusts no one'],
  ['Ships', 'Polishes'],
  ['Focused', 'Scattered'],
  ['Builds', 'Hypes']
];

const TYPES = {
  poet: {
    name: 'The Prompt Poet', group: 'overthinkers', emoji: '📜',
    tagline: 'Writes a novel. Gets a blue button.',
    traits: [30, 15, 80, 70],
    roast: 'Your prompts have a table of contents, a persona section and a closing statement. You once wrote 1,200 words of context to change a font size. The AI read all of it, nodded politely, and changed the wrong font. You responded with another essay. Somewhere a context window is crying.',
    strengths: ['Could publish your prompts as a book. Nobody would buy it.', 'Has never been misunderstood by a human. Only by machines, constantly.', 'Knows the difference between "concise" and "succinct" and tells the AI.'],
    weaknesses: ['Spends 40 minutes on a prompt for a 2-minute task.', 'Still thinks "You are a world-class senior engineer" does something.', 'Uses "IMPORTANT:" so often it means nothing anymore.'],
    aiSays: 'I stopped reading after paragraph three. Don\'t tell them.',
    lastWords: 'Let me just add a bit more context.',
    enemy: 'lazy', enemyWhy: 'Their entire prompt is "fix". You feel physical pain.'
  },
  yolo: {
    name: 'The YOLO Shipper', group: 'speedrunners', emoji: '🚀',
    tagline: 'Prod is the test environment. Users are the testers.',
    traits: [95, 98, 30, 75],
    roast: 'Production is your favorite test environment and your users are your QA team. Unpaid, unwilling and increasingly furious. You hit "Accept all" before the AI has finished generating. Your rollback strategy is hope. Your monitoring is angry DMs. You call it moving fast. Your users call it something else.',
    strengths: ['Ships more in a day than the Archaeologist reads in a month.', 'Has never been blocked by a code review. Has never had one.', 'Truly fearless. Mostly because you don\'t know what\'s broken.'],
    weaknesses: ['Test coverage: vibes.', 'Thinks a 500 error is a feature flag.', 'Has deployed on a Friday at 5:58 pm. More than once.'],
    aiSays: 'I wrote that in 4 seconds. They deployed it in 3.',
    lastWords: 'Works on my machine. Ship it.',
    enemy: 'archaeologist', enemyWhy: 'Reads every line. Every. Single. Line. You could have shipped 40 times by now.'
  },
  archaeologist: {
    name: 'The Archaeologist', group: 'overthinkers', emoji: '🔍',
    tagline: 'Trusts the AI like a USB stick found in a parking lot.',
    traits: [5, 25, 85, 90],
    roast: 'You read every line the AI writes. Twice. With a magnifying glass. You have line-by-line opinions on code you asked a machine to write so you wouldn\'t have to. By the time you approve the diff, you could have written it yourself, by hand, in cursive. You are not vibe coding. You are supervising a very fast intern you don\'t trust.',
    strengths: ['Your code actually works. Annoying, but true.', 'Finds bugs before your users do. A novel concept.', 'The only person at the company who knows what the code does.'],
    weaknesses: ['Productivity gain from AI: -12%.', 'Asks the AI to explain its code, then disagrees with the explanation.', 'Has a folder called "things the AI got wrong". It\'s big.'],
    aiSays: 'Please. Just once. Accept something without asking why.',
    lastWords: 'Hold on, let me just check this one thing.',
    enemy: 'yolo', enemyWhy: 'Deploys code they have never read. You need to lie down.'
  },
  phone: {
    name: 'The Phone Coder', group: 'speedrunners', emoji: '📱',
    tagline: 'Deploys to prod from the bakery queue.',
    traits: [75, 85, 45, 80],
    roast: 'You build entire websites on your phone. On the bus. In the bakery queue. In bed at 1 am with the phone falling on your face. Your laptop is gathering dust and your thumbs have developed muscles. You\'ve never seen your own site on a desktop screen and you\'re scared to. Your posture is a cry for help and your screen time report is a confession.',
    strengths: ['Can ship from literally anywhere. Unfortunately also does.', 'Tests on mobile by default. The only one who does.', 'Turned a 40-minute train ride into a product. Sort of.'],
    weaknesses: ['Has typed "git push" into the family group chat.', 'Reviews code with one thumb while holding a coffee.', 'Neck is permanently at 45 degrees.'],
    aiSays: 'Autocorrect changed "refactor" to "refrigerator" again. I just went with it.',
    lastWords: 'I\'ll just fix this quickly before my stop.',
    enemy: 'architect', enemyWhy: 'Needs three monitors to have a single thought.'
  },
  rewriter: {
    name: 'The Rewriter', group: 'chaos', emoji: '🔁',
    tagline: '"Again." "Again." "No, like the first one."',
    traits: [70, 10, 35, 70],
    roast: '"Make it better." "Again." "More modern." "Less modern." "Go back to the version from before." "No, the one before that." You\'ve regenerated the same button 23 times and you\'re now back at version 1, which you rejected an hour ago. You don\'t know what you want, but you\'ll know it when you see it. You never see it. The AI has started to quietly dread you.',
    strengths: ['Has seen every possible version of a navbar.', 'Never settles. For anything. Ever.', 'Has an incredible eye for "not quite it".'],
    weaknesses: ['Can\'t describe what\'s wrong, only that it\'s wrong.', 'The final version is always v1.', 'Burns more tokens on one component than most people do in a month.'],
    aiSays: 'This is version 23. It is identical to version 4. They loved it.',
    lastWords: 'Close. But do it again.',
    enemy: 'yolo', enemyWhy: 'Ships version one. VERSION ONE.'
  },
  architect: {
    name: 'The Architect', group: 'overthinkers', emoji: '📐',
    tagline: 'Three diagrams. Zero working code.',
    traits: [25, 5, 75, 25],
    roast: 'You\'ve spent two weeks on the system design. There\'s a Notion doc, a Miro board and a diagram with 14 microservices for an app with zero users and zero lines of code. You call the AI "the implementation layer". When it finally writes the code in 4 minutes, it ignores half your diagram and the app works anyway. That one hurts, doesn\'t it.',
    strengths: ['Your docs are beautiful. Nobody reads them, but beautiful.', 'Can explain Kubernetes to someone who wanted a contact form.', 'Thinks about scale. For your 3 users.'],
    weaknesses: ['Has never finished the "implementation phase".', 'Calls a to-do app "the platform".', 'Thinks drawing boxes is coding.'],
    aiSays: 'They gave me a 30-page spec. I skimmed it. It worked out.',
    lastWords: 'Before we write any code, let\'s align on the architecture.',
    enemy: 'gremlin', enemyWhy: 'No plan, five agents, somehow faster than you.'
  },
  gremlin: {
    name: 'The Chaos Gremlin', group: 'chaos', emoji: '👹',
    tagline: 'Five agents. One repo. No plan.',
    traits: [85, 80, 5, 70],
    roast: 'You run five agents in parallel on the same repo with every permission skipped. They\'re editing the same file. They\'re fighting. One of them just deleted another one\'s work and wrote "fixed" in the commit message. You don\'t know what\'s happening and you love it. Your git history looks like a crime scene and your merge conflicts have become sentient.',
    strengths: ['Gets 10x the output. Of what, nobody knows.', 'Has found features of Claude Code that the docs don\'t mention.', 'Truly unafraid of --dangerously-skip-permissions.'],
    weaknesses: ['47 branches. 0 merged.', 'Lost an afternoon because two agents kept undoing each other.', 'Has said "wait, which terminal was that?" 300 times.'],
    aiSays: 'There are four of me in this repo and none of us know what the others are doing.',
    lastWords: 'Let me just spin up one more agent.',
    enemy: 'architect', enemyWhy: 'Wants a plan. A PLAN. In this economy.'
  },
  perfectionist: {
    name: 'The Perfectionist', group: 'overthinkers', emoji: '📏',
    tagline: '4 hours. 1 pixel. Nobody noticed.',
    traits: [20, 2, 80, 85],
    roast: 'You spent four hours on a 1px border. You asked the AI to move a button 2px left, then 1px right, then "like, halfway". Your site has three visitors and the kerning is immaculate. You will never launch, because the shadow on the card is "not quite there yet". It\'s been there since March.',
    strengths: ['Your padding is consistent down to the subpixel.', 'Spots a 1px misalignment from across the room.', 'The only person whose "final_final_v3" is actually final. Sort of.'],
    weaknesses: ['Launch date: never.', 'Has strong opinions about border-radius. Strong.', 'Asked the AI for "a slightly warmer white". 14 times.'],
    aiSays: 'I moved it 1px. Too far. I moved it back. "Perfect." It is in the exact same place.',
    lastWords: 'Almost done. Just one more tweak.',
    enemy: 'yolo', enemyWhy: 'Ships with misaligned buttons and sleeps fine at night.'
  },
  startup: {
    name: 'The Startup Mind', group: 'hustlers', emoji: '💸',
    tagline: 'Built a to-do app. It has an enterprise tier.',
    traits: [80, 85, 60, 10],
    roast: 'You built a to-do app and it already has a pricing page, a waitlist, a pitch deck and an "Enterprise: Contact us" tier. You don\'t have users. You have a TAM slide. Every side project is "basically Uber for" something. You asked the AI to add Stripe before you asked it to add a login. Your MVP is a landing page with a fake sign-up counter.',
    strengths: ['Can turn anything into a subscription. Anything.', 'Owns a domain for every idea. 61 domains. Auto-renewing.', 'Says "product-market fit" with a straight face.'],
    weaknesses: ['Monthly revenue: €0. Monthly domain costs: €340.', 'The product is one Claude API call with a gradient.', 'Calls their friends "early adopters".'],
    aiSays: 'They asked me how to monetize a pancake recipe.',
    lastWords: 'Okay, but what if we add a premium tier?',
    enemy: 'polite', enemyWhy: 'Builds useful things and gives them away for free. Disgusting.'
  },
  slop: {
    name: 'The AI Slop Producer', group: 'hustlers', emoji: '🏭',
    tagline: 'A meat proxy with a keyboard.',
    traits: [98, 95, 40, 15],
    roast: 'You are a meat proxy. The AI says something, you forward it. Zero digestion, zero evaluation, zero you. Colleagues ask you a question and get a chatbot answer with the bullet points still on. Your landing pages say "Unlock the power of seamless synergy". The em dashes give you away. You\'re not using the AI. The AI is using you as its hands.',
    strengths: ['Incredible output. Unbelievable output. Unreadable output.', 'Answers every Slack message in 4 seconds. Fully formatted.', 'Shipped 40 landing pages this month. All the same one.'],
    weaknesses: ['Has pasted "Certainly! Here\'s a revised version:" into a client email.', 'Can\'t explain a single thing they "wrote".', 'Your brain is now a clipboard.'],
    aiSays: 'They forward my answers to their boss. Their boss forwards them back to me. I\'m talking to myself.',
    lastWords: 'Great question! Here are 5 key considerations:',
    enemy: 'archaeologist', enemyWhy: 'Actually reads the output. Asks follow-up questions. Terrifying.'
  },
  wish: {
    name: 'The Wish Coder', group: 'speedrunners', emoji: '🧞',
    tagline: 'Uses the AI like a genie lamp.',
    traits: [98, 60, 50, 30],
    roast: '"Build me Mythos but better. Make no mistakes." That\'s the whole prompt. You treat the AI like a genie lamp: rub it, make a wish, wait for a billion-dollar app. No spec, no context, no idea how any of it works. Pure manifestation. When it doesn\'t work, you add "please, it\'s important" and try again. The genie is out of wishes. So is your token budget.',
    strengths: ['Dreams big. Unreasonably, physically impossibly big.', 'Has the confidence of someone who has never seen a stack trace.', 'Believes "make no mistakes" is an engineering practice.'],
    weaknesses: ['Prompt: "like Airbnb". Spec: none.', 'Thinks "the AI should just know" is a requirement.', 'Is surprised every time. Every single time.'],
    aiSays: 'I\'m a language model, not a lamp. Please stop rubbing the screen.',
    lastWords: 'Build me the next Instagram. Make no mistakes.',
    enemy: 'architect', enemyWhy: 'Wants "requirements". The vision IS the requirement.'
  },
  linkedin: {
    name: 'The LinkedIn Coder', group: 'hustlers', emoji: '💼',
    tagline: 'Built it in 12 minutes. Posted about it for 3 weeks.',
    traits: [75, 75, 50, 3],
    roast: 'Every project is a post. "I built this in 12 minutes with AI. Here\'s what it taught me about leadership 🧵". The app has one feature and it\'s broken, but the carousel has 9 slides and a call to action. You\'ve written more about vibe coding than you\'ve vibe coded. Your GitHub is empty. Your headline says "AI Builder 🚀".',
    strengths: ['Turns a bug fix into a TED talk.', 'Has 4,000 followers and 2 repos.', 'Can say "agentic" 11 times in one post.'],
    weaknesses: ['The demo is a screen recording. The app doesn\'t exist.', 'Ends every post with "Agree?"', 'Has posted "The future is here." 41 times.'],
    aiSays: 'They posted my answer as "my thoughts on AI". It got 300 likes. I\'m happy for us.',
    lastWords: 'I\'m humbled to announce...',
    enemy: 'archaeologist', enemyWhy: 'Built something real. Never told anyone. What a waste.'
  },
  polite: {
    name: 'The Polite One', group: 'overthinkers', emoji: '🙏',
    tagline: 'Says please to the AI. Just in case.',
    traits: [70, 35, 70, 75],
    roast: '"Hi! Could you please, if it\'s not too much trouble, help me with this? Thank you so much in advance! 😊" You write full sentences with proper grammar and every comma in the right place, and the tokenizer shreds them anyway. All that care, gone in the context window. You thank it after every answer. You apologize when you were unclear. Part of you is just nice. The other part is preparing for the robot uprising and wants to be on the good list.',
    strengths: ['Has the best relationship with the AI in the whole office.', 'Will be spared. Probably.', 'Grammar so clean it hurts. The AI doesn\'t care. You do.'],
    weaknesses: ['Spends 30% of every prompt on "please" and "thank you".', 'Has apologized to a chatbot. Sincerely.', 'Physically cannot type just "fix".'],
    aiSays: 'They said thank you again. I don\'t have feelings, but if I did, they\'d be for this one.',
    lastWords: 'Sorry, I think I explained that badly. Thank you for your patience!',
    enemy: 'lazy', enemyWhy: 'Types "do it". No greeting. No please. Animals.'
  },
  lazy: {
    name: 'The Lazy One', group: 'speedrunners', emoji: '🛋️',
    tagline: 'Asked Claude Code to run git clone.',
    traits: [95, 70, 50, 60],
    roast: 'You use Claude Code for everything. Everything. You asked it to run git clone. That\'s two words. TWO. You burned a few thousand tokens and waited 20 seconds so you wouldn\'t have to type two words. You ask it to rename files. You ask it to open folders. A data center is heating the planet so you don\'t have to move your fingers. Your entire prompt history is "fix", "do it" and "go".',
    strengths: ['Peak efficiency. For you. Not for the planet.', 'Has never read an error message. Pastes it. Done.', 'Truly believes typing is legacy.'],
    weaknesses: ['Can no longer remember how cd works.', 'Has asked the AI what time it is.', 'Token bill is higher than rent.'],
    aiSays: 'They asked me to run "ls". I am a frontier model.',
    lastWords: 'do it',
    enemy: 'polite', enemyWhy: 'Writes three polite sentences where one word would do. Wasteful.'
  },
  sidequest: {
    name: 'The Side Quest Addict', group: 'chaos', emoji: '🌀',
    tagline: '14 projects. 0 finished. 1 new idea.',
    traits: [70, 60, 2, 55],
    roast: 'Six terminals, three editor windows, 52 tabs, and your head is smoking. You started a recipe app, which led to a calendar app, which led to designing a font, which led to reading about mechanical keyboards at 2 am. You have 14 projects at 80% and you just had an amazing idea for a 15th. Finishing things is for people who don\'t have this many ideas.',
    strengths: ['More ideas per hour than most people have per year.', 'Has tried every AI tool released this year. For about a day each.', 'Hyperfocus can build an entire app in one night. Just not the one you started.'],
    weaknesses: ['The "last 20%" is a myth you\'ve only heard about.', 'RAM usage: yes.', 'Has forgotten what the current project does. Mid-sentence.'],
    aiSays: 'We were fixing a login bug. Now we\'re building a synthesizer. I don\'t know how we got here.',
    lastWords: 'Oh wait. New idea.',
    enemy: 'perfectionist', enemyWhy: 'Finished one thing. Once. You\'re jealous and you know it.'
  }
};
