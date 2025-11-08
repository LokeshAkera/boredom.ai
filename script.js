const el = id => document.getElementById(id);
const randomFrom = arr => arr[Math.floor(Math.random()*arr.length)];
const safeText = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };

// ----- Feature Tabs -----
const tabs = document.querySelectorAll('.tab-btn');
const features = document.querySelectorAll('.feature');

tabs.forEach(tab=>{
  tab.addEventListener('click', ()=>{
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.target;
    features.forEach(f => f.id === target ? f.classList.add('active') : f.classList.remove('active'));
  });
});

// ----- Base Prompts -----
let LOCAL_ACTIVITIES = [
  "Dance like nobody’s watching—for 60 seconds straight 💃",
  "Write a 6-word story about your last snack 🍕",
  "Draw a doodle of your mood right now 🎨",
  "Try to juggle three random objects in reach 🤹",
  "Invent a silly handshake for your left hand ✋",
  "Sing the chorus of a song in opera style 🎶",
  "Organize one small thing around you—satisfying! 🗂️",
  "Look up the weirdest animal you can find 🐙",
  "Tell a joke to yourself and rate it 1-10 😂",
  "Make up a new tongue twister and try it 3 times 🤪"
];

let SIM_PROMPTS = [
  "You are a pirate trying to teach a cat to sail a ship 🏴‍☠️🐱",
  "You're a barista who only serves invisible coffee ☕️✨",
  "A superhero whose power is turning things fluffy—start your mission 🦸‍♂️🧸",
  "You are a detective interrogating a talking muffin 🕵️‍♀️🧁",
  "You accidentally switched lives with your pet for an hour—describe it 🐶➡️🧑",
  "You're hosting a chat show for plants—interview a cactus 🌵🎤",
  "You just discovered a vending machine that gives life advice—read today's tip 🤖",
  "A ghost auditions for a cooking show—perform your monologue 👻🍳",
  "You're stuck in a tiny time-travel agency—sell a 3-line micro-trip ⏳",
  "You're reviewing jam using only musical metaphors—go! 🍓🎵"
];

let BOOSTS = [
  "Give yourself a big smile in the mirror—hold it for 7 seconds 😄",
  "Name three imaginary planets in 10 seconds 🌍",
  "Stretch your arms, wiggle your fingers, and shake off boredom 💪",
  "Say 'red leather, yellow leather' three times fast without laughing 🤪",
  "Hum your favorite tune and make up a dance move 🎶💃",
  "Invent a secret handshake for your left foot 🦶",
  "Send a silly compliment to a friend via text 💌",
  "Take a deep breath and shout a random positive word 🗣️✨"
];

// ----- Random Activity -----
async function fetchRandomActivity() {
  const out = el('activityResult');
  const typeTag = el('activityType');
  const participants = el('activityParticipants');
  const price = el('activityPrice');

  out.textContent = '🎯 Finding fun ideas...';

  try {
    const r = await fetch('https://www.boredapi.com/api/activity');
    const data = await r.json();
    out.textContent = data.activity;
    typeTag.textContent = data.type;
    participants.textContent = data.participants;
    price.textContent = data.price <= 0.3 ? 'cheap' : 'paid';
  } catch { 
    const local = randomFrom(LOCAL_ACTIVITIES);
    out.textContent = local;
    typeTag.textContent='local';
    participants.textContent='1';
    price.textContent='free';
  }
}

el('getActivityBtn').addEventListener('click', fetchRandomActivity);

// ----- Quiz -----
let currentAnswer = null, quizScore = 0;

async function newQuizQuestion() {
  const categoryId = el('quizCategory').value;
  el('quizQuestion').textContent = 'Loading...';
  el('choicesList').innerHTML = '';

  try {
    const r = await fetch(`https://opentdb.com/api.php?amount=1&type=multiple&category=${categoryId}`);
    const j = await r.json();
    const q = j.results[0];

    const correct = safeText(q.correct_answer);
    const opts = [...q.incorrect_answers.map(safeText), correct].sort(() => Math.random() - 0.5);

    currentAnswer = correct;
    el('quizQuestion').textContent = safeText(q.question);

    opts.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'mini-btn';
      b.textContent = opt;
      b.onclick = () => selectChoice(b, opt);
      el('choicesList').appendChild(b);
    });
  } catch {
    el('quizQuestion').textContent = 'Failed to load question';
  }
}

function selectChoice(btn, opt) {
  [...el('choicesList').children].forEach(b => b.disabled = true);
  if (opt === currentAnswer) {
    btn.classList.add('correct'); 
    quizScore++; 
    el('quizScore').textContent = quizScore;
  } else {
    btn.classList.add('wrong');
    [...el('choicesList').children].forEach(b => {
      if (b.textContent === currentAnswer) b.classList.add('correct');
    });
  }
  el('nextQuestionBtn').disabled = false;
}

el('newQuestionBtn').onclick = () => { 
  newQuizQuestion(); 
  el('nextQuestionBtn').disabled = true; 
};

el('nextQuestionBtn').onclick = () => { 
  newQuizQuestion(); 
  el('nextQuestionBtn').disabled = true; 
};

// ----- Simulator -----
el('simBtn').onclick = () => { 
  el('simResult').textContent = randomFrom(SIM_PROMPTS); 
};
el('copySim').onclick = () => { navigator.clipboard.writeText(el('simResult').textContent); };
el('shareSim').onclick = () => { navigator.share?.({ text: el('simResult').textContent }); };

// ----- Quick Boost -----
el('surpriseBtn').onclick = () => { 
  el('boostResult').textContent = randomFrom(BOOSTS); 
};

// ----- Meme Generator -----
async function fetchMeme(){
  const img = el('memeImg'), source = el('memeSource');
  img.alt='Loading...';
  img.src=''; 

  try {
    const res = await fetch('https://meme-api.com/gimme');
    const data = await res.json();
    img.src = data.url;
    img.alt = data.title;
    img.dataset.title = data.title.replace(/[^\w\d-_]+/g,'_');
    source.textContent = `source: r/${data.subreddit}`;
  } catch {
    img.alt='Error loading meme';
    source.textContent='source: —';
  }
}
el('memeBtn').addEventListener('click', fetchMeme);

// ----- Load Community Ideas & Merge Prompts -----
async function loadCommunityIdeas() {
  try {
    const res = await fetch('/ideas');  // ideas.json served from server
    const ideas = await res.json();

    ideas.forEach(i => {
      if (!i.approved) return; // skip unapproved

      if (i.type.includes('Random')) LOCAL_ACTIVITIES.push(i.content);
      if (i.type.includes('Situation')) SIM_PROMPTS.push(i.content);
      if (i.type.includes('Quick')) BOOSTS.push(i.content);
    });

    console.log(`Loaded ${ideas.length} community ideas 🎉`);
  } catch (err) {
    console.warn('Failed to load community ideas', err);
  }
}

// ----- Contribute -----
el('contributeBtn').onclick = () => { window.location.href='contribute.html'; };

// ----- Auto-load -----
fetchRandomActivity();
fetchMeme();
loadCommunityIdeas();
