(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const profile = window.PROFILE || {};
  const projects = (window.PROJECTS || []).filter(p => p && p.id && p.title);
  const fallback = 'assets/images/fallback.svg';
  const text = (tag, content, cls) => { const el = document.createElement(tag); el.textContent = content || ''; if (cls) el.className = cls; return el; };
  const image = (src, alt, eager = false) => { const el = document.createElement('img'); el.alt = alt || 'Project artwork'; el.loading = eager ? 'eager' : 'lazy'; el.src = src || fallback; el.onerror = () => { el.onerror = null; el.src = fallback; }; return el; };
  const safeWeb = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  const setText = (s, value) => { $(s).textContent = value || ''; };
  setText('#brand-alias', profile.nickname || profile.name); setText('#brand-name', profile.name); setText('#footer-name', profile.name); setText('#intro', profile.intro); setText('#bio', profile.bio);
  setText('#year', new Date().getFullYear()); document.title = `${profile.nickname ? profile.nickname + ' — ' : ''}${profile.name || 'Your Name'} — 3D Artist`;
  const portrait = image(profile.image, profile.imageAlt); portrait.id = 'profile-image'; $('#profile-image').replaceWith(portrait);
  for (const [key, selector] of [['skills', '#skills'], ['software', '#software']]) (profile[key] || []).forEach(v => $(selector).append(text('li', v)));
  for (const key of ['education', 'experience']) if (profile[key]) $('#background').append(text('h3', key.toUpperCase()), text('p', profile[key]));
  if (profile.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) { const a = text('a', profile.email + ' ↗', 'email-link'); a.href = 'mailto:' + profile.email; $('#email').append(a); }
  else $('#email').append(text('span', 'Your email goes here', 'placeholder-contact'));
  (profile.socials || []).forEach(s => { const href = safeWeb(s.url); if (href) { const a = text('a', s.label + ' ↗'); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; $('#socials').append(a); } else { const el = text('span', s.label, 'social-placeholder'); el.append(text('small', 'ADD YOUR LINK')); $('#socials').append(el); } });
  const featured = projects.find(p => p.featured) || projects[0];

  let active = 'All work';
  const categories = ['All work', ...new Set(projects.map(p => p.category || 'Other Projects'))];
  function renderGallery() {
    $('#gallery').replaceChildren(); const visible = projects.filter(p => active === 'All work' || (p.category || 'Other Projects') === active);
    visible.forEach(p => {
      const a = document.createElement('a'); a.className = 'card'; a.dataset.category = p.category; a.href = '#project/' + encodeURIComponent(p.id); const wrap = text('div', '', 'card-image'); wrap.append(image(p.thumbnail, p.title)); if (p.placeholder) wrap.append(text('span', 'SAMPLE STUDY', 'card-badge')); const arrow = text('span', p.videos?.length ? '▷' : '↗', 'card-arrow'); arrow.setAttribute('aria-hidden', 'true'); wrap.append(arrow); const title = text('div', '', 'card-title'); const label = document.createElement('div'); label.append(text('h3', p.title), text('small', p.category || 'Other Projects')); title.append(label, text('span', String(projects.indexOf(p) + 1).padStart(2, '0'), 'card-number')); a.append(wrap, title); $('#gallery').append(a); });
    if (!visible.length) $('#gallery').append(text('p', 'New work is on its way.', 'empty'));
    setText('#results', `${visible.length} projects shown`);
    $('#filters').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.category === active)));
  }
  categories.forEach(category => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'category-tile'; b.dataset.category = category;
    b.setAttribute('aria-label', category);
    const preview = category === 'All work' ? featured : projects.find(p => (p.category || 'Other Projects') === category);
    const visual = text('span', '', 'category-visual');
    if (preview) { const img = image(preview.thumbnail, ''); img.alt = ''; visual.append(img); }
    visual.append(text('span', '', 'category-shade'));
    const caption = text('span', '', 'category-caption');
    caption.append(text('span', category, 'category-name'), text('span', '↗', 'category-arrow'));
    visual.append(caption); b.append(visual);
    b.onclick = () => { active = category; renderGallery(); };
    $('#filters').append(b);
  }); renderGallery();
  const dialog = $('#project-dialog'); let previousFocus; let currentId; let viewerPromise;
  function loadViewer() {
    if (customElements.get('model-viewer')) return Promise.resolve();
    if (!viewerPromise) viewerPromise = new Promise((resolve, reject) => { const script = document.createElement('script'); script.type = 'module'; script.src = 'https://unpkg.com/@google/model-viewer@4.1.0/dist/model-viewer.min.js'; script.onerror = () => reject(new Error('Viewer library unavailable')); script.onload = () => customElements.whenDefined('model-viewer').then(resolve); document.head.append(script); setTimeout(() => reject(new Error('Viewer timed out')), 20000); }).catch(e => { viewerPromise = null; throw e; });
    return viewerPromise;
  }
  function stopMedia() { stopSequence(); dialog.querySelectorAll('video').forEach(v => v.pause()); dialog.querySelectorAll('iframe').forEach(f => f.remove()); }

  const zoomDialog = document.createElement('dialog');
  zoomDialog.className = 'image-viewer'; zoomDialog.setAttribute('aria-label', 'Artwork image viewer');
  const zoomToolbar = text('div', '', 'zoom-toolbar');
  const zoomLabel = text('span', 'Image zoom'); zoomLabel.setAttribute('role', 'status');
  const zoomStage = text('div', '', 'zoom-stage'); zoomStage.tabIndex = 0; zoomStage.setAttribute('aria-label', 'Image area. Scroll to inspect enlarged artwork.');
  const zoomImage = document.createElement('img'); zoomImage.draggable = false;
  zoomStage.append(zoomImage);
  let zoom = 1, fitWidth = 1, zoomTrigger;
  function setZoom(value) {
    zoom = Math.max(1, Math.min(4, value));
    zoomImage.style.width = (fitWidth * zoom) + 'px';
    zoomLabel.textContent = Math.round(zoom * 100) + '% of fitted size';
    if (zoom === 1) { zoomStage.scrollTop = 0; zoomStage.scrollLeft = 0; }
  }
  function fitImage() {
    if (!zoomImage.naturalWidth) return;
    fitWidth = Math.min(zoomImage.naturalWidth, Math.max(1, zoomStage.clientWidth - 24), Math.max(1, zoomStage.clientHeight - 24) * zoomImage.naturalWidth / zoomImage.naturalHeight);
    setZoom(1);
  }
  function zoomButton(label, action) { const b = text('button', label); b.type = 'button'; b.onclick = action; return b; }
  const zoomClose = zoomButton('Close ×', () => zoomDialog.close());
  zoomToolbar.append(zoomLabel, zoomButton('−', () => setZoom(zoom - .5)), zoomButton('+', () => setZoom(zoom + .5)), zoomButton('Fit', fitImage), zoomClose);
  zoomToolbar.children[1].setAttribute('aria-label', 'Zoom out');
  zoomToolbar.children[2].setAttribute('aria-label', 'Zoom in');
  zoomDialog.append(zoomToolbar, zoomStage); document.body.append(zoomDialog);
  zoomImage.onload = fitImage;
  zoomImage.onerror = () => { zoomLabel.textContent = 'Image could not load. Close and try again.'; };
  zoomDialog.addEventListener('close', () => { if (zoomTrigger?.isConnected && dialog.open) zoomTrigger.focus({preventScroll:true}); });
  window.addEventListener('resize', () => { if (zoomDialog.open) fitImage(); });
  function openImage(src, alt, trigger) {
    zoomTrigger = trigger; zoomImage.alt = alt || 'Artwork'; zoomLabel.textContent = 'Loading image…';
    zoomImage.style.width = 'auto'; zoomImage.src = src; zoomDialog.showModal(); zoomClose.focus();
    if (zoomImage.complete && zoomImage.naturalWidth) fitImage();
  }

  // One video element plays successive files: no merged or duplicate media downloads.
  const emptyFrameClips = [
    {src:'assets/videos/anim_scene14.mp4',label:'Scene 14'},
    {src:'assets/videos/anim_scene16.mp4',label:'Scene 16'},
    {src:'assets/videos/anim_scene17_v01.mp4',label:'Scene 17'}
  ];
  function buildSequencePlayer(host, clips, poster) {
    if (!host || !Array.isArray(clips) || !clips.length) return;
    const player = text('div','','sequence-player');
    const video = document.createElement('video');
    video.controls = true; video.playsInline = true; video.preload = 'none';
    video.poster = poster || fallback;
    video.setAttribute('aria-label','The Empty Frame animation sequence');
    const row = text('div','','sequence-controls');
    const status = text('span','','sequence-status');
    status.setAttribute('role','status');
    const replay = text('button','Replay from Scene 14 ↺','sequence-replay');
    replay.type='button';
    let index = 0;
    function select(n, play = false) {
      index = n; video.src = clips[index].src; video.load();
      status.textContent = clips[index].label + ' · ' + (index + 1) + ' of ' + clips.length;
      if (play) video.play().catch(() => { status.textContent += ' · Press play to continue'; });
    }
    video.addEventListener('ended',()=> {
      if(index + 1 < clips.length) select(index + 1,true);
      else status.textContent = 'Sequence complete · Replay any time';
    });
    video.addEventListener('error',()=> {
      status.textContent = 'Video unavailable. Choose Replay to retry, or view the original files.';
    });
    replay.onclick=()=>select(0,true);
    row.append(status,replay);
    player.append(video,row);
    host.replaceChildren(player);
    select(0,false);
    return video;
  }
  const mainSequence=buildSequencePlayer($('#empty-frame-player'),emptyFrameClips,'assets/images/previews/echo.webp');
  function stopSequence() { if(mainSequence) mainSequence.pause(); }
  // Stop the homepage player when its section is no longer visible.
  if(mainSequence && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries=>{
      if (!entries[0].isIntersecting && !mainSequence.paused) mainSequence.pause();
    },{threshold:0}).observe($('#empty-frame-player'));
  }
  function showProject(p) {
    if (currentId === p.id && dialog.open) return;
    previousFocus = document.activeElement; currentId = p.id; stopMedia();
    const content = $('#project-content'); content.replaceChildren();
    const head = text('div', '', 'project-head'); head.append(text('p', p.category || 'Other Projects', 'eyebrow')); const title = text('h2', p.title); title.id = 'project-title'; head.append(title);
    if (p.placeholder) head.append(text('p', 'ORIGINAL SAMPLE · Replace with your own artwork', 'sample-note'));
    if (p.description) head.append(text('p', p.description, 'project-description'));
    const dl = text('dl', '', 'project-meta'); [['TOOLS', (p.software || []).join(' / ')], ['PROJECT', p.type], ['YEAR', p.year], ['CREDITS', p.credits]].forEach(([k, v]) => { if (v) { const pair = document.createElement('div'); pair.append(text('dt', k), text('dd', v)); dl.append(pair); } }); if (dl.children.length) head.append(dl); content.append(head);
    const media = text('div', '', 'project-media');
    (p.images || []).filter(i => i.src).forEach(i => { const fig = document.createElement('figure'); const open = text('button', '', 'image-zoom-trigger'); open.type = 'button'; open.setAttribute('aria-label', 'Enlarge ' + (i.alt || p.title)); open.append(image(i.src, i.alt), text('span', 'Click to zoom +', 'zoom-hint')); open.onclick = () => openImage(i.src, i.alt || p.title, open); fig.append(open); if (i.alt) fig.append(text('figcaption', i.alt)); media.append(fig); });
    if (p.playlist?.length) {
      const fig = document.createElement('figure');
      fig.className = 'project-playlist';
      const stage = text('div','','project-sequence');
      fig.append(stage,text('figcaption','Play the complete animation sequence · Scenes 14 → 16 → 17'));
      media.append(fig);
      buildSequencePlayer(stage,p.playlist,p.thumbnail);
    }
    (p.videos || []).filter(v => v.src).forEach(v => { const fig = document.createElement('figure'); const video = document.createElement('video'); video.controls = true; video.playsInline = true; video.preload = 'none'; video.poster = v.poster || p.thumbnail || fallback; video.src = v.src; video.setAttribute('aria-label', v.caption || p.title + ' video'); if (v.captions) { const track = document.createElement('track'); track.kind = 'captions'; track.srclang = 'en'; track.label = 'English'; track.src = v.captions; video.append(track); } video.onerror = () => { video.replaceWith(image(v.poster || p.thumbnail, 'Video preview unavailable')); fig.append(text('p', 'This video could not load. Please try again later.', 'media-status')); }; fig.append(video); if (v.caption) fig.append(text('figcaption', v.caption)); media.append(fig); });
    (p.embeds || []).forEach(e => { const url = safeWeb(e.url); if (!url) return; const u = new URL(url); if (!((['www.youtube.com','www.youtube-nocookie.com'].includes(u.hostname) && u.pathname.startsWith('/embed/')) || (u.hostname === 'player.vimeo.com' && u.pathname.startsWith('/video/')))) return; const fig = document.createElement('figure'); const b = text('button', 'Load external video ↗', 'media-button'); b.onclick = () => { const frame = document.createElement('iframe'); frame.src = url; frame.title = e.title || p.title + ' video'; frame.allowFullscreen = true; frame.allow = 'fullscreen; picture-in-picture'; frame.referrerPolicy = 'strict-origin-when-cross-origin'; b.replaceWith(frame); }; fig.append(b, text('figcaption', e.title || 'External video loads only when selected.')); media.append(fig); });
    if (p.model) {
      const fig = document.createElement('figure'); const stage = text('div', '', 'model-stage'); const poster = p.modelPoster || p.thumbnail || fallback; stage.append(image(poster, p.title + ' model preview'));
      const button = text('button', 'Explore in 3D ↗', 'media-button'); const status = text('p', 'Drag to orbit · scroll or pinch to zoom. Viewer loads on demand.', 'media-status'); status.setAttribute('role','status');
      button.onclick = async () => { button.disabled = true; button.textContent = 'Loading viewer…'; try { await loadViewer(); if (!stage.isConnected || !dialog.open) return; const model = document.createElement('model-viewer'); model.setAttribute('src', p.model); model.setAttribute('poster', poster); model.setAttribute('alt', p.title + ' interactive model'); model.setAttribute('camera-controls',''); model.setAttribute('touch-action','pan-y'); model.setAttribute('shadow-intensity','1'); model.setAttribute('tabindex','0'); model.setAttribute('reveal','auto');
        const failed = () => { stage.replaceChildren(image(poster, p.title + ' fallback preview')); status.textContent = 'Interactive view unavailable. The still preview remains available.'; };
        const timer = setTimeout(failed, 30000); model.addEventListener('load', () => { clearTimeout(timer); status.textContent = 'Drag to rotate · scroll or pinch to zoom. Use arrow keys while focused.'; }); model.addEventListener('error', () => { clearTimeout(timer); failed(); }); stage.replaceChildren(model);
      } catch { button.remove(); status.textContent = 'Interactive viewer unavailable. Check your connection; the still preview remains available.'; } };
      stage.append(button); fig.append(stage,status); media.append(fig);
    }
    if (!media.children.length) media.append(image(p.thumbnail, p.title)); content.append(media);
    if (!dialog.open) dialog.showModal(); document.body.classList.add('modal-open'); dialog.scrollTop = 0; $('#close-project').focus();
  }
  function closeProject(updateHash = true) { if (zoomDialog.open) zoomDialog.close(); stopMedia(); if (dialog.open) dialog.close(); currentId = null; document.body.classList.remove('modal-open'); if (updateHash && location.hash.startsWith('#project/')) history.replaceState(null, '', '#work'); if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true}); }
  function route() { if (location.hash.startsWith('#project/')) { let id; try { id = decodeURIComponent(location.hash.slice(9)); } catch { closeProject(); return; } const p = projects.find(p => p.id === id); if (p) showProject(p); else closeProject(); } else if (dialog.open) closeProject(false); }
  $('#close-project').onclick = () => closeProject(); dialog.addEventListener('cancel', e => { e.preventDefault(); closeProject(); }); dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeProject(); } }); window.addEventListener('hashchange', route); route();
})();

