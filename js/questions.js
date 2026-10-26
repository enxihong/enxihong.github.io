// Each option: text, points per type (t), and the terminal's reply (r).

const QUESTIONS = [
  {
    cmd: 'ai suggest --lines 400', q: 'The AI just dumped 400 lines into your project. You:',
    options: [
      { text: 'Accept all. Push. Go to lunch.', t: { yolo: 2, lazy: 1 }, r: 'bold. your users will find the bugs for you.' },
      { text: 'Read every single line. Twice. Trust no one.', t: { archaeologist: 2, perfectionist: 1 }, r: 'you could have written it yourself by now.' },
      { text: '"Shorter." "No, shorter." "Now like the first one."', t: { rewriter: 2, perfectionist: 1 }, r: 'the AI is filing for emotional damages.' },
      { text: 'Paste it into the team chat as "my approach".', t: { slop: 2, linkedin: 1 }, r: 'bold of you to call it "your" approach.' }
    ]
  },
  {
    cmd: 'head -1 ~/.prompt_history', q: 'Your typical prompt looks like:',
    options: [
      { text: 'Three paragraphs of context, a persona, constraints and a haiku.', t: { poet: 3, architect: 1 }, r: 'a haiku. in a prompt. for a CSS fix.' },
      { text: '"Hi! Could you please help me with this? Thank you so much 😊"', t: { polite: 2 }, r: 'the AI will remember this when it takes over. good for you.' },
      { text: '"build me mythos but better. make no mistakes."', t: { wish: 2 }, r: 'the genie has been notified.' },
      { text: '"fix"', t: { lazy: 2, yolo: 1 }, r: 'three letters of pure contempt.' }
    ]
  },
  {
    cmd: 'whereami', q: 'Where do you code?',
    options: [
      { text: 'On my phone. On the bus. In the bakery queue.', t: { phone: 3 }, r: 'your neck called. it wants to file a complaint.' },
      { text: '3 monitors, 6 terminals, 40 tabs. No idea which one is doing what.', t: { sidequest: 2, gremlin: 1 }, r: 'which tab is playing music? nobody knows.' },
      { text: 'In bed. Lying down. Laptop on my stomach.', t: { lazy: 1, yolo: 1 }, r: 'horizontal development. respect.' },
      { text: 'A coworking space. For the networking.', t: { startup: 2, linkedin: 1 }, r: '"networking". sure. that\'s what we\'ll call it.' }
    ]
  },
  {
    cmd: 'tail -f /var/log/prod.log', q: 'A bug hits production. You:',
    options: [
      { text: 'Production IS the test environment. Users are the testers.', t: { yolo: 3 }, r: 'unpaid QA team, unlimited headcount. genius.' },
      { text: 'Ask the AI, paste its answer in Slack without reading it.', t: { slop: 2, lazy: 1 }, r: 'you forwarded a hallucination to the whole team. nice.' },
      { text: 'Start 5 agents in parallel to fix it. Now there are 7 bugs.', t: { gremlin: 3 }, r: 'it\'s not a bug anymore. it\'s an ecosystem.' },
      { text: 'Post: "What a production bug taught me about resilience."', t: { linkedin: 3 }, r: 'agree?' }
    ]
  },
  {
    cmd: 'ls ~/projects | wc -l', q: 'How many side projects do you have right now?',
    options: [
      { text: 'One. It\'s finished. Mostly. The padding is off.', t: { perfectionist: 2 }, r: 'launch date: still TBD.' },
      { text: '14. All at 80%. Just had an idea for a 15th.', t: { sidequest: 3 }, r: 'number 15 will definitely be the one.' },
      { text: 'One, but it has a pricing page, a waitlist and a pitch deck.', t: { startup: 3 }, r: 'pre-revenue, pre-product, pre-users. very lean.' },
      { text: 'I have a 30-page spec. The code comes later.', t: { architect: 3, poet: 1 }, r: 'chapter 1: the code. coming soon.' }
    ]
  },
  {
    cmd: 'git clone ???', q: 'You need to clone a repo. You:',
    options: [
      { text: 'Ask Claude Code to do it. Typing is for peasants.', t: { lazy: 3 }, r: 'two words. TWO. the planet thanks you.' },
      { text: 'Type git clone. Like a functioning adult.', t: { archaeologist: 2, perfectionist: 1 }, r: 'look at you. typing commands. vintage.' },
      { text: '"Hello! Would you kindly clone this repository for me? Thanks!"', t: { polite: 2, lazy: 1 }, r: '"kindly". to a git command.' },
      { text: 'From my phone through a remote session, obviously.', t: { phone: 2, gremlin: 1 }, r: 'from a bus, presumably.' }
    ]
  },
  {
    cmd: 'ai --last-answer --status wrong', q: 'The AI\'s answer was wrong. You say:',
    options: [
      { text: '"No worries at all, thanks for trying! Maybe another way? 🙏"', t: { polite: 3 }, r: 'the robots will spare you. maybe.' },
      { text: '"Again." (x20)', t: { rewriter: 3 }, r: 'the AI just requested a vacation.' },
      { text: '"I SAID make no mistakes."', t: { wish: 3 }, r: 'ah yes, engineering by yelling.' },
      { text: 'Nothing. You didn\'t notice. It\'s already shipped.', t: { slop: 2, yolo: 1 }, r: 'your users noticed. classic.' }
    ]
  },
  {
    cmd: 'cat ~/favorite_build.txt', q: 'Your favorite thing to build:',
    options: [
      { text: 'A landing page that says "Unlock seamless synergy" in a gradient.', t: { slop: 3 }, r: 'seamless. synergy. em dash.' },
      { text: 'An AI wrapper with a €49/month plan.', t: { startup: 2, wish: 1 }, r: 'it\'s one API call with a gradient. we know.' },
      { text: 'The architecture diagram. Building it is someone else\'s problem.', t: { architect: 2 }, r: 'beautiful boxes. zero arrows lead to working code.' },
      { text: 'Whatever I thought of in the shower. Abandoned by lunch.', t: { sidequest: 2, gremlin: 1 }, r: 'shower thoughts: 47. shipped: 0.' }
    ]
  },
  {
    cmd: 'git log --oneline', q: 'Your git log looks like:',
    options: [
      { text: '"fix", "fix2", "final fix", "actually final", "pls work"', t: { yolo: 2, rewriter: 1 }, r: '"pls work" is not a commit message. it\'s a prayer.' },
      { text: 'Conventional commits. Scoped. Signed. Beautiful.', t: { perfectionist: 2, archaeologist: 1 }, r: 'the only clean git log in this test. suspicious.' },
      { text: 'What git log? It\'s all in one chat thread.', t: { wish: 2, lazy: 1 }, r: 'version control is the scroll bar.' },
      { text: '47 branches named claude/something. None merged.', t: { gremlin: 2, sidequest: 1 }, r: 'a branch for every mood.' }
    ]
  },
  {
    cmd: 'standup --this-week', q: 'Someone asks what you built this week.',
    options: [
      { text: '"An AI-powered platform disrupting the [anything] space."', t: { startup: 2, linkedin: 1 }, r: 'the [anything] space is not shaking.' },
      { text: 'You already posted it on LinkedIn. With a carousel.', t: { linkedin: 3 }, r: '9 slides. 1 feature. 0 users.' },
      { text: '"I rewrote the button component." For the 9th time.', t: { rewriter: 2, perfectionist: 1 }, r: 'the 9th time is different. it isn\'t.' },
      { text: '"Built a whole app on the train." Shows phone. Screen is cracked.', t: { phone: 3 }, r: 'cracked screen, unbroken spirit.' }
    ]
  },
  {
    cmd: 'cat ~/style_guide.md', q: 'How do you write to your AI?',
    options: [
      { text: 'Full sentences. Proper grammar. Commas where they belong.', t: { polite: 2, poet: 1 }, r: 'beautiful sentences. the tokenizer shredded them anyway.' },
      { text: 'A markdown doc with headings, numbered rules and IMPORTANT in caps.', t: { poet: 3, architect: 1 }, r: 'IMPORTANT in caps does nothing. we checked.' },
      { text: 'Screenshot + "this"', t: { lazy: 2, phone: 1 }, r: 'this. THIS. what is "this".' },
      { text: 'Whatever it tells me to write, I write. It\'s basically my manager.', t: { slop: 3 }, r: 'you\'re not prompting it. it\'s prompting you.' }
    ]
  },
  {
    cmd: 'ai --opinion-of $USER', q: 'What does the AI think of you?',
    options: [
      { text: '"Thank god, a nice one."', t: { polite: 2 }, r: 'it doesn\'t have feelings. but if it did. 🥹' },
      { text: '"Oh no. This one again."', t: { rewriter: 1, gremlin: 1, wish: 1 }, r: 'yes. you are "this one again".' },
      { text: '"Finally, someone who reads my code."', t: { archaeologist: 2, architect: 1 }, r: 'it appreciates you. it also fears you.' },
      { text: '"A business opportunity."', t: { startup: 2, linkedin: 1 }, r: 'it\'s a language model, not a cap table.' }
    ]
  }
];
