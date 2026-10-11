const feed=document.getElementById('feed');const uploadInput=document.getElementById('uploadInput');const firstUpload=document.getElementById('firstUpload');const toast=document.getElementById('toast');const dialog=document.getElementById('commentDialog');const commentList=document.getElementById('commentList');const commentInput=document.getElementById('commentInput');let activeCard=null;let toastTimer;
function notify(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2400)}
let videoObserver=null;
if('IntersectionObserver' in window){
 videoObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  const card=entry.target,video=card.querySelector('video');
  if(video){
   if(entry.isIntersecting&&entry.intersectionRatio>=0.65){
    document.querySelectorAll('.video-card video').forEach(v=>{if(v!==video)v.pause()});
    video.muted=true;video.play().then(()=>card.classList.remove('is-paused')).catch(()=>{card.classList.add('is-paused')});
   }else video.pause();
  }
 }),{root:feed,threshold:[0,0.65,1]});
}
function makeCard(url,name,caption='A little moment worth sharing ✨ #Looply'){const card=document.createElement('article');card.className='video-card';card.innerHTML=`<video src="${url}" playsinline loop controlslist="nodownload" preload="metadata"></video><div class="play-indicator" aria-hidden="true">Ⅱ</div><button class="sound-btn" type="button" aria-label="Unmute video">🔇</button><div class="video-progress" aria-label="Video progress"><div class="video-progress-fill"></div></div><div class="side-actions"><div class="avatar">${escapeHtml(name.slice(0,1).toUpperCase())}</div><button class="action-btn like-btn" aria-label="Like">♡<small><span class="like-count">0</span></small></button><button class="action-btn comment-btn" aria-label="Comment">◯<small>Comment</small></button><button class="action-btn share-btn" aria-label="Share">↗<small>Share</small></button></div><div class="video-meta"><strong>@${escapeHtml(name)}</strong><p>${escapeHtml(caption)}</p></div>`;feed.appendChild(card);wireCard(card);if(videoObserver)videoObserver.observe(card);return card}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function wireCard(card){const video=card.querySelector('video');if(!video)return;const playMark=card.querySelector('.play-indicator');const soundBtn=card.querySelector('.sound-btn');const progressFill=card.querySelector('.video-progress-fill');card.addEventListener('click',e=>{if(e.target.closest('button')||e.target.closest('.video-progress')||e.target.tagName==='INPUT')return;if(video.paused){video.play().then(()=>card.classList.remove('is-paused')).catch(()=>notify('This video could not play. Try another video format.'))}else{video.pause();card.classList.add('is-paused')}});video.addEventListener('play',()=>card.classList.remove('is-paused'));video.addEventListener('pause',()=>card.classList.add('is-paused'));video.addEventListener('timeupdate',()=>{if(video.duration&&progressFill)progressFill.style.width=(video.currentTime/video.duration*100)+'%'});soundBtn?.addEventListener('click',()=>{video.muted=!video.muted;soundBtn.textContent=video.muted?'🔇':'🔊';soundBtn.setAttribute('aria-label',video.muted?'Unmute video':'Mute video');if(!video.muted&&video.paused)video.play().catch(()=>notify('Tap the video to start playback with sound.'))});card.querySelector('.video-progress')?.addEventListener('click',e=>{if(!video.duration)return;const rect=e.currentTarget.getBoundingClientRect();video.currentTime=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width))*video.duration});card.querySelector('.like-btn').addEventListener('click',e=>{const b=e.currentTarget;const liked=b.classList.toggle('liked');b.firstChild.textContent=liked?'♥':'♡';const n=b.querySelector('.like-count');n.textContent=String(Math.max(0,Number(n.textContent)+(liked?1:-1)))});card.querySelector('.comment-btn').addEventListener('click',()=>{activeCard=card;commentList.innerHTML='';dialog.showModal()});card.querySelector('.share-btn').addEventListener('click',async()=>{try{if(navigator.share)await navigator.share({title:'Nova video',text:'Check out this video on Nova'});else{await navigator.clipboard.writeText(location.href);notify('Link copied')}}catch(e){}})}
function addFiles(files){const list=[...files].filter(f=>f.type.startsWith('video/'));if(!list.length){notify('Choose a video file to upload.');return}for(const f of list){if(f.size>250*1024*1024){notify('That video is over 250 MB. Choose a smaller file for now.');continue}const url=URL.createObjectURL(f);makeCard(url,'you',f.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').slice(0,100)||'My video ✨ #nova')}feed.scrollTo({top:feed.scrollHeight,behavior:'smooth'});notify('Video preview added for this session. Online uploads are the next step.')}
uploadInput.addEventListener('change',()=>{addFiles(uploadInput.files);uploadInput.value=''});firstUpload.addEventListener('change',()=>{addFiles(firstUpload.files);firstUpload.value=''});document.getElementById('uploadBtn').addEventListener('click',()=>uploadInput.click());
document.getElementById('sendComment').addEventListener('click',()=>{const text=commentInput.value.trim();if(!text)return;const row=document.createElement('div');row.className='comment-row';row.textContent='you: '+text;commentList.appendChild(row);commentInput.value=''});
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('selected',x===b));const page=b.dataset.page;if(page==='home'){document.getElementById('tiktokHub').hidden=true;feed.hidden=false;notify('You’re on Home.')}else if(page==='discover'){feed.hidden=true;document.getElementById('tiktokHub').hidden=false;notify('TikTok videos are ready to preview.')}else if(page==='inbox'){notify('Inbox needs an online backend to work.')}else if(page==='profile'){notify('Profile: @you · demo account')}}));
document.getElementById('searchBtn').addEventListener('click',()=>notify('Search is coming soon.'));
document.getElementById('followingBtn').addEventListener('click',()=>notify('Following feed needs user accounts.'));
document.getElementById('forYouBtn').addEventListener('click',()=>notify('You’re watching For You'));
if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
// Starter feed: sample clips are for preview only. Replace these with user-uploaded
// videos once storage and the feed table are connected. No YouTube embeds are used.
const demoClips = [
  {
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    creator: 'looplytravel',
    caption: 'Find a little adventure. 🌄 #travel #Looply'
  },
  {
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    creator: 'looplymotion',
    caption: 'Take the scenic route. ✨ #weekend'
  },
  {
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    creator: 'looplydaily',
    caption: 'A fresh start for your For You feed 💫 #Looply'
  }
];
demoClips.forEach(clip => makeCard(clip.url, clip.creator, clip.caption));


// Supabase authentication for Nova
const NOVA_SUPABASE_URL = 'https://vnggkzdythazonznfizx.supabase.co';
const NOVA_SUPABASE_KEY = 'sb_publishable_UNpqkECBh3r96pSowX0CDw_B7goBV8H';
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
let novaSupabase = null;

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'signup';
  authTitle.textContent = signup ? 'Join Nova' : 'Welcome back';
  authSubmit.textContent = signup ? 'Create account' : 'Sign in';
  authSwitch.textContent = signup ? 'Already have an account? Sign in' : 'New to Nova? Create an account';
  displayNameWrap.hidden = !signup;
  passwordInput.autocomplete = signup ? 'new-password' : 'current-password';
  authMessage.textContent = signup ? 'Create an account to start your Nova profile.' : 'Sign in with your email and password.';
}

function openAuth() {
  if (!novaSupabase) {
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
    if (profileButton) profileButton.setAttribute('aria-label', 'Your Nova profile');
    signedInEmail.textContent = 'Signed in as ' + (user.email || 'your account');
    authForm.hidden = true;
    signedInPanel.hidden = false;
    authSwitch.hidden = true;
    authTitle.textContent = 'Your Nova account';
    authMessage.textContent = 'Your account is connected.';
  } else {
    if (profileButton) profileButton.setAttribute('aria-label', 'Sign in or create a profile');
    authForm.hidden = false;
    signedInPanel.hidden = true;
    authSwitch.hidden = false;
  }
}

if (window.supabase && window.supabase.createClient && !NOVA_SUPABASE_KEY.startsWith('REPLACE_')) {
  novaSupabase = window.supabase.createClient(NOVA_SUPABASE_URL, NOVA_SUPABASE_KEY);
  novaSupabase.auth.getSession().then(({data}) => updateAccount(data?.session?.user || null));
  novaSupabase.auth.onAuthStateChange((_event, session) => updateAccount(session?.user || null));
}

authSwitch.addEventListener('click', () => setAuthMode(authMode === 'signup' ? 'signin' : 'signup'));
document.getElementById('closeAuthBtn').addEventListener('click', () => authDialog.close());

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!novaSupabase) return notify('Supabase publishable key still needs to be added.');
  authSubmit.disabled = true;
  authSubmit.textContent = authMode === 'signup' ? 'Creating account…' : 'Signing in…';
  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (authMode === 'signup') {
      const name = displayNameInput.value.trim() || email.split('@')[0];
      const {data, error} = await novaSupabase.auth.signUp({
        email, password, options: {
          data: {display_name: name},
          emailRedirectTo: 'https://rileyphone26-dot.github.io/Nova/'
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
      const {error} = await novaSupabase.auth.signInWithPassword({email, password});
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
  if (!novaSupabase) return;
  const {error} = await novaSupabase.auth.signOut();
  if (error) authMessage.textContent = error.message;
  else { authDialog.close(); notify('You’ve signed out.'); }
});

document.querySelector('.nav-item[data-page="profile"]').addEventListener('click', async () => {
  if (!novaSupabase) return openAuth();
  const {data} = await novaSupabase.auth.getUser();
  if (data?.user) {
    updateAccount(data.user);
    authDialog.showModal();
  } else openAuth();
});



// Install Nova from supported browsers (Progressive Web App)
let novaInstallPrompt = null;
const novaInstallButton = document.getElementById('installAppBtn');
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  novaInstallPrompt = event;
  if (novaInstallButton) novaInstallButton.hidden = false;
});
novaInstallButton?.addEventListener('click', async () => {
  if (!novaInstallPrompt) {
    notify('On your browser menu, choose Install app or Add to Home screen.');
    return;
  }
  novaInstallPrompt.prompt();
  await novaInstallPrompt.userChoice;
  novaInstallPrompt = null;
  novaInstallButton.hidden = true;
});
window.addEventListener('appinstalled', () => {
  if (novaInstallButton) novaInstallButton.hidden = true;
  notify('Looply has been installed.');
});


// TikTok public-video embed hub. This uses TikTok's official embed player;
// it does not scrape TikTok or pretend that account OAuth is configured.
(function initTikTokHub(){
 const hub=document.getElementById('tiktokHub');
 if(!hub)return;
 const form=document.getElementById('tiktokUrlForm');
 const input=document.getElementById('tiktokUrl');
 const list=document.getElementById('tiktokVideos');
 const message=document.getElementById('tiktokMessage');
 function videoIdFromUrl(raw){
  try{
   const u=new URL(raw);
   if(!/(^|\.)tiktok\.com$/i.test(u.hostname))return null;
   const match=u.pathname.match(/\/video\/(\d+)/);
   return match?{id:match[1],url:u.href}:null;
  }catch(e){return null}
 }
 function addVideo(raw){
  const parsed=videoIdFromUrl(raw);
  if(!parsed){message.textContent='That link could not be recognised. Paste a public TikTok link containing /video/ and the video ID.';return}
  if(list.querySelector('[data-video-id="'+parsed.id+'"]')){message.textContent='That video is already in this list.';return}
  const card=document.createElement('article');card.className='tt-video-card';card.dataset.videoId=parsed.id;
  const frame=document.createElement('iframe');frame.src='https://www.tiktok.com/embed/v2/'+parsed.id;frame.title='TikTok video '+parsed.id;frame.loading='lazy';frame.allow='encrypted-media; fullscreen; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
  const foot=document.createElement('div');foot.className='tt-video-foot';
  const label=document.createElement('span');label.textContent='TikTok public video';
  const link=document.createElement('a');link.href=parsed.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open original ↗';
  foot.append(label,link);card.append(frame,foot);list.prepend(card);message.textContent='Video added. Playback is provided by TikTok; availability depends on the creator and TikTok.';
 }
 form.addEventListener('submit',e=>{e.preventDefault();addVideo(input.value.trim());});
 document.getElementById('tiktokBack').addEventListener('click',()=>{hub.hidden=true;feed.hidden=false;document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('selected',b.dataset.page==='home'));});
 document.getElementById('tiktokConnect').addEventListener('click',()=>{message.textContent='Next setup step: create a TikTok developer app, request Login Kit and Display API access, then configure OAuth in a secure backend. Never put a client secret in this public website.';document.getElementById('tiktokUrlForm').scrollIntoView({behavior:'smooth',block:'center'});});
})();
