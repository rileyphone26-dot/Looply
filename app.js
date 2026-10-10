const feed=document.getElementById('feed');const uploadInput=document.getElementById('uploadInput');const firstUpload=document.getElementById('firstUpload');const toast=document.getElementById('toast');const dialog=document.getElementById('commentDialog');const commentList=document.getElementById('commentList');const commentInput=document.getElementById('commentInput');let activeCard=null;let toastTimer;
function notify(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2400)}
let videoObserver=null;
if('IntersectionObserver' in window){videoObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{const video=entry.target.querySelector('video');if(!video)return;if(entry.isIntersecting&&entry.intersectionRatio>=0.65){document.querySelectorAll('.video-card video').forEach(other=>{if(other!==video)other.pause()});video.muted=false;video.play().then(()=>entry.target.classList.remove('is-paused')).catch(()=>{entry.target.classList.add('is-paused');notify('Tap the video once to allow sound playback in Chrome.')})}else{video.pause()}})},{root:feed,threshold:[0,0.65,1]})}
function makeCard(url,name,caption='My video ✨ #nova'){const card=document.createElement('article');card.className='video-card';card.innerHTML=`<video src="${url}" playsinline loop controlslist="nodownload" preload="metadata"></video><div class="play-indicator" aria-hidden="true">Ⅱ</div><button class="sound-btn" type="button" aria-label="Mute video">🔊</button><div class="video-progress" aria-label="Video progress"><div class="video-progress-fill"></div></div><div class="side-actions"><div class="avatar">${escapeHtml(name.slice(0,1).toUpperCase())}</div><button class="action-btn like-btn" aria-label="Like">♡<small><span class="like-count">0</span></small></button><button class="action-btn comment-btn" aria-label="Comment">◯<small>Comment</small></button><button class="action-btn share-btn" aria-label="Share">↗<small>Share</small></button></div><div class="video-meta"><strong>@${escapeHtml(name)}</strong><p>${escapeHtml(caption)}</p></div>`;feed.appendChild(card);wireCard(card);if(videoObserver)videoObserver.observe(card);return card}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function wireCard(card){const video=card.querySelector('video');if(!video)return;const playMark=card.querySelector('.play-indicator');const soundBtn=card.querySelector('.sound-btn');const progressFill=card.querySelector('.video-progress-fill');card.addEventListener('click',e=>{if(e.target.closest('button')||e.target.closest('.video-progress')||e.target.tagName==='INPUT')return;if(video.paused){video.play().then(()=>card.classList.remove('is-paused')).catch(()=>notify('This video could not play. Try another video format.'))}else{video.pause();card.classList.add('is-paused')}});video.addEventListener('play',()=>card.classList.remove('is-paused'));video.addEventListener('pause',()=>card.classList.add('is-paused'));video.addEventListener('timeupdate',()=>{if(video.duration&&progressFill)progressFill.style.width=(video.currentTime/video.duration*100)+'%'});soundBtn?.addEventListener('click',()=>{video.muted=!video.muted;soundBtn.textContent=video.muted?'🔇':'🔊';soundBtn.setAttribute('aria-label',video.muted?'Unmute video':'Mute video');if(!video.muted&&video.paused)video.play().catch(()=>notify('Tap the video to start playback with sound.'))});card.querySelector('.video-progress')?.addEventListener('click',e=>{if(!video.duration)return;const rect=e.currentTarget.getBoundingClientRect();video.currentTime=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width))*video.duration});card.querySelector('.like-btn').addEventListener('click',e=>{const b=e.currentTarget;const liked=b.classList.toggle('liked');b.firstChild.textContent=liked?'♥':'♡';const n=b.querySelector('.like-count');n.textContent=String(Math.max(0,Number(n.textContent)+(liked?1:-1)))});card.querySelector('.comment-btn').addEventListener('click',()=>{activeCard=card;commentList.innerHTML='';dialog.showModal()});card.querySelector('.share-btn').addEventListener('click',async()=>{try{if(navigator.share)await navigator.share({title:'Nova video',text:'Check out this video on Nova'});else{await navigator.clipboard.writeText(location.href);notify('Link copied (demo)')}}catch(e){}})}
function addFiles(files){const list=[...files].filter(f=>f.type.startsWith('video/'));if(!list.length){notify('Choose a video file to upload.');return}for(const f of list){if(f.size>250*1024*1024){notify('That video is over 250 MB. Choose a smaller file for now.');continue}const url=URL.createObjectURL(f);makeCard(url,'you',f.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').slice(0,100)||'My video ✨ #nova')}feed.scrollTo({top:feed.scrollHeight,behavior:'smooth'});notify('Video preview added for this session. Online uploads are the next step.')}
uploadInput.addEventListener('change',()=>{addFiles(uploadInput.files);uploadInput.value=''});firstUpload.addEventListener('change',()=>{addFiles(firstUpload.files);firstUpload.value=''});document.getElementById('uploadBtn').addEventListener('click',()=>uploadInput.click());
document.getElementById('sendComment').addEventListener('click',()=>{const text=commentInput.value.trim();if(!text)return;const row=document.createElement('div');row.className='comment-row';row.textContent='you: '+text;commentList.appendChild(row);commentInput.value=''});
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('selected',x===b));const page=b.dataset.page;if(page==='home'){notify('You’re on Home.')}else if(page==='discover'){notify('Discover is a demo screen in this starter.')}else if(page==='inbox'){notify('Inbox needs an online backend to work.')}else if(page==='profile'){notify('Profile: @you · demo account')}}));
document.getElementById('searchBtn').addEventListener('click',()=>{const q=prompt('Search Looply (demo):');if(q)notify('Search needs a connected online backend in this starter.')});
document.getElementById('followingBtn').addEventListener('click',()=>notify('Following feed needs user accounts.'));
document.getElementById('forYouBtn').addEventListener('click',()=>notify('Showing For You'));
if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
// Welcome screen has no video; uploaded video cards are observed for autoplay.


// Supabase authentication for Looply
const LOOPLY_SUPABASE_URL = 'https://vnggkzdythazonznfizx.supabase.co';
const LOOPLY_SUPABASE_KEY = 'sb_publishable_UNpqkECBh3r96pSowX0CDw_B7goBV8H';
const authDialog = document.getElementById('authDialog');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authMessage = document.getElementById('authMessage');
const authSubmit = document.getElementById('authSubmit');
const authSwitch = document.getElementById('authSwitch');
const displayNameWrap = document.getElementById('displayNameWrap');
const displayNameInput = document.getElementById('displayNameInput');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const signedInPanel = document.getElementById('signedInPanel');
const signedInEmail = document.getElementById('signedInEmail');
const signOutBtn = document.getElementById('signOutBtn');
let authMode = 'signup';
let looplySupabase = null;

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'signup';
  authTitle.textContent = signup ? 'Join Looply' : 'Welcome back';
  authSubmit.textContent = signup ? 'Create account' : 'Sign in';
  authSwitch.textContent = signup ? 'Already have an account? Sign in' : 'New to Looply? Create an account';
  displayNameWrap.hidden = !signup;
  passwordInput.autocomplete = signup ? 'new-password' : 'current-password';
  authMessage.textContent = signup ? 'Create an account to start your Looply profile.' : 'Sign in with your email and password.';
}

function openAuth() {
  if (!looplySupabase) {
    notify('Sign-in is not configured yet. Please refresh and try again.');
    return;
  }
  authForm.hidden = false;
  signedInPanel.hidden = true;
  authSwitch.hidden = false;
  setAuthMode('signup');
  authDialog.showModal();
}

function updateAccount(user) {
  const profileButton = document.querySelector('.nav-item[data-page="profile"]');
  if (user) {
    if (profileButton) profileButton.setAttribute('aria-label', 'Your Looply profile');
    signedInEmail.textContent = 'Signed in as ' + (user.email || 'your account');
    authForm.hidden = true;
    signedInPanel.hidden = false;
    authSwitch.hidden = true;
    authTitle.textContent = 'Your Looply account';
    authMessage.textContent = 'Your account is connected.';
  } else {
    if (profileButton) profileButton.setAttribute('aria-label', 'Sign in or create a profile');
    authForm.hidden = false;
    signedInPanel.hidden = true;
    authSwitch.hidden = false;
  }
}

if (window.supabase && window.supabase.createClient && !LOOPLY_SUPABASE_KEY.startsWith('REPLACE_')) {
  looplySupabase = window.supabase.createClient(LOOPLY_SUPABASE_URL, LOOPLY_SUPABASE_KEY);
  looplySupabase.auth.getSession().then(({data}) => updateAccount(data?.session?.user || null));
  looplySupabase.auth.onAuthStateChange((_event, session) => updateAccount(session?.user || null));
}

authSwitch.addEventListener('click', () => setAuthMode(authMode === 'signup' ? 'signin' : 'signup'));
document.getElementById('closeAuthBtn').addEventListener('click', () => authDialog.close());

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!looplySupabase) return notify('Supabase publishable key still needs to be added.');
  authSubmit.disabled = true;
  authSubmit.textContent = authMode === 'signup' ? 'Creating account…' : 'Signing in…';
  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (authMode === 'signup') {
      const name = displayNameInput.value.trim() || email.split('@')[0];
      const {data, error} = await looplySupabase.auth.signUp({
        email, password, options: {
          data: {display_name: name},
          emailRedirectTo: 'https://rileyphone26-dot.github.io/Looply/'
        }
      });
      if (error) throw error;
      if (data.session) {
        authDialog.close();
        notify('Welcome to Looply!');
      } else {
        setAuthMode('signin');
        authMessage.textContent = 'Check your email for a confirmation link, then sign in.';
        notify('Account created. Check your email to confirm it.');
      }
    } else {
      const {error} = await looplySupabase.auth.signInWithPassword({email, password});
      if (error) throw error;
      authDialog.close();
      notify('You’re signed in to Looply.');
    }
  } catch (error) {
    authMessage.textContent = error.message || 'Something went wrong. Please try again.';
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = authMode === 'signup' ? 'Create account' : 'Sign in';
  }
});

signOutBtn.addEventListener('click', async () => {
  if (!looplySupabase) return;
  const {error} = await looplySupabase.auth.signOut();
  if (error) authMessage.textContent = error.message;
  else { authDialog.close(); notify('You’ve signed out.'); }
});

document.querySelector('.nav-item[data-page="profile"]').addEventListener('click', async () => {
  if (!looplySupabase) return openAuth();
  const {data} = await looplySupabase.auth.getUser();
  if (data?.user) {
    updateAccount(data.user);
    authDialog.showModal();
  } else openAuth();
});
