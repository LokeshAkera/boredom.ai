const el = id => document.getElementById(id);
const randomFrom = arr => arr[Math.floor(Math.random() * arr.length)];
const safeText = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };

// ----- Feature Tabs -----
const tabs = document.querySelectorAll('.tab-btn');
const features = document.querySelectorAll('.feature');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.target;
    features.forEach(f => f.id === target ? f.classList.add('active') : f.classList.remove('active'));
  });
});

// ---------- IDEA STORAGE ----------
let LOCAL_ACTIVITIES = [];
let SIM_PROMPTS = [];
let BOOSTS = [];

// ---------- Load Ideas from ideas.json ----------
async function loadIdeas() {
  try {
    const res = await fetch('newideas.json');
    const ideas = await res.json();

    // Separate ideas by type
    ideas.forEach(i => {
      const type = i.type.toLowerCase();
      if (type.includes('random')) LOCAL_ACTIVITIES.push(i.content);
      if (type.includes('situation')) SIM_PROMPTS.push(i.content);
      if (type.includes('quick')) BOOSTS.push(i.content);
    });

    console.log(`✅ Loaded ${ideas.length} ideas from ideas.json`);
  } catch (err) {
    console.error('❌ Failed to load ideas.json', err);
  }
}

// ---------- Random Activity ----------
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
    if (LOCAL_ACTIVITIES.length === 0) {
      out.textContent = 'No local ideas loaded yet 😕';
    } else {
      const local = randomFrom(LOCAL_ACTIVITIES);
      out.textContent = local;
      typeTag.textContent = 'local';
      participants.textContent = '1';
      price.textContent = 'free';
    }
  }
}
el('getActivityBtn').addEventListener('click', fetchRandomActivity);

// ---------- Quiz ----------
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

// ---------- Simulator ----------
el('simBtn').onclick = () => {
  el('simResult').textContent = randomFrom(SIM_PROMPTS.length ? SIM_PROMPTS : ['No simulation ideas yet 😕']);
};
el('copySim').onclick = () => {
  navigator.clipboard.writeText(el('simResult').textContent);
};
el('shareSim').onclick = () => {
  navigator.share?.({ text: el('simResult').textContent });
};

// ---------- Quick Boost ----------
el('surpriseBtn').onclick = () => {
  el('boostResult').textContent = randomFrom(BOOSTS.length ? BOOSTS : ['No quick boosts yet 😕']);
};

// ---------- Meme Generator ----------
async function fetchMeme() {
  const img = el('memeImg'), source = el('memeSource');
  img.alt = 'Loading...';
  img.src = '';
  try {
    const res = await fetch('https://meme-api.com/gimme');
    const data = await res.json();
    img.src = data.url;
    img.alt = data.title;
    img.dataset.title = data.title.replace(/[^\w\d-_]+/g, '_');
    source.textContent = `source: r/${data.subreddit}`;
  } catch {
    img.alt = 'Error loading meme';
    source.textContent = 'source: —';
  }
}
el('memeBtn').addEventListener('click', fetchMeme);
// Meme download
el('downloadMeme').addEventListener('click', async () => {
  const img = el('memeImg');
  if (!img.src) return alert('No meme yet!');
  try {
    const res = await fetch(img.src);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = img.dataset.title || 'meme';
    a.href = url;
    a.download = fileName + '.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Download failed:', e);
    alert('Failed to download meme.');
  }
});

// Meme popup on long press
let longPressTimer;
const memeImg = el('memeImg');
memeImg.addEventListener('mousedown', () => {
  longPressTimer = setTimeout(() => showMemePopup(), 500);
});
memeImg.addEventListener('mouseup', () => clearTimeout(longPressTimer));
memeImg.addEventListener('mouseleave', () => clearTimeout(longPressTimer));

function showMemePopup() {
  const popup = document.createElement('div');
  popup.className = 'meme-popup';
  popup.innerHTML = `
    <div class="meme-popup-content">
      <img src="${memeImg.src}" alt="Meme" class="popup-img">
      <button id="closePopup">✖</button>
      <button id="downloadPopupMeme">⬇️ Download</button>
    </div>
  `;
  document.body.appendChild(popup);

  el('closePopup').onclick = () => popup.remove();
  el('downloadPopupMeme').onclick = () => el('downloadMeme').click();
}

// ---------- Contribute ----------
el('contributeBtn').onclick = () => {
  window.location.href = 'contribute.html';
};

// ---------- Initialize ----------
(async function init() {
  await loadIdeas();
  fetchRandomActivity();
  fetchMeme();
})();

