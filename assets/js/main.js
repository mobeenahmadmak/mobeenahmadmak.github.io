const loader=document.getElementById('maLoader');
const loaderStart=performance.now();
const dismissLoader=()=>{const remaining=Math.max(0,500-(performance.now()-loaderStart));setTimeout(()=>loader?.classList.add('is-hidden'),remaining);};
if(loader){window.addEventListener('load',dismissLoader,{once:true});setTimeout(dismissLoader,500);}
const menu=document.getElementById('menu'),links=document.getElementById('links');
menu.setAttribute('aria-controls','links');
const closeMenu=()=>{links.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰'};
menu.addEventListener('click',()=>{const open=links.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'×':'☰'});
links.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
window.addEventListener('resize',()=>{if(window.innerWidth>760)closeMenu()});
document.getElementById('year').textContent=new Date().getFullYear();
const scrollTopButton=document.getElementById('scrollTop');
const toggleScrollTop=()=>scrollTopButton.classList.toggle('visible',window.scrollY>400);
window.addEventListener('scroll',toggleScrollTop,{passive:true});
toggleScrollTop();
scrollTopButton.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
const root=document.documentElement,reduceMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;

// Dates and durations
const toMonth=value=>{if(value==='now'){const d=new Date();return d.getFullYear()*12+d.getMonth()}const [y,m]=value.split('-').map(Number);return y*12+m-1};
const span=(a,b)=>toMonth(b)-toMonth(a)+1;
const plural=(n,word)=>`${n} ${word}${n===1?'':'s'}`;
const formatMonths=total=>{const y=Math.floor(total/12),m=total%12;return [y&&plural(y,'yr'),m&&plural(m,'mo')].filter(Boolean).join(' ')};

// Career chart
const firstMonth=toMonth('2009-04'),lastMonth=toMonth('now')+1,monthRange=lastMonth-firstMonth;
const position=month=>(month-firstMonth)/monthRange*100;
const tickYears=[2010,2013,2016,2019,2022,2025];
document.querySelectorAll('.g-row').forEach((row,index,rows)=>{
 const bar=row.querySelector('.g-bar'),start=bar.dataset.start,end=bar.dataset.end,track=row.querySelector('.g-track');
 bar.style.left=position(toMonth(start))+'%';
 bar.style.width=(position(toMonth(end)+1)-position(toMonth(start)))+'%';
 bar.style.setProperty('--d',(rows.length-1-index)*120+'ms');
 row.querySelector('.g-dur').textContent=formatMonths(span(start,end));
 tickYears.forEach(year=>{const line=document.createElement('i');line.style.left=position(year*12)+'%';track.prepend(line)});
});
const ticks=document.querySelector('.g-ticks');
if(ticks)tickYears.forEach(year=>{const label=document.createElement('span');label.textContent=year;label.style.left=position(year*12)+'%';ticks.append(label)});

// Sector chart
document.querySelectorAll('[data-ranges]').forEach(item=>{
 const months=item.dataset.ranges.split(',').reduce((sum,range)=>{const [a,b]=range.split(':');return sum+span(a,b)},0);
 item.querySelector('.val').textContent=formatMonths(months);
 document.querySelector(`.seg[data-sector="${item.dataset.sector}"]`).style.setProperty('--w',months);
});

// Collapsible responsibilities
document.querySelectorAll('.job ul:not(.chips)').forEach((list,index)=>{
 const items=list.children.length;
 if(items<=3)return;
 list.classList.add('collapsed');
 list.id=list.id||`job-duties-${index}`;
 const button=document.createElement('button');
 button.type='button';button.className='job-more';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',list.id);
 const setLabel=open=>{button.innerHTML=`<span>${open?'Show fewer':`Show all ${items} responsibilities`}</span><svg class="ico" aria-hidden="true"><use href="#i-chevron"/></svg>`};
 setLabel(false);
 button.addEventListener('click',()=>{const open=list.classList.toggle('collapsed')===false;list.classList.toggle('opened',open);button.setAttribute('aria-expanded',String(open));setLabel(open);scheduleScrollUpdate()});
 list.after(button);
});

// Scroll reveal
const revealTargets=document.querySelectorAll('.section-head,.about-copy,.sector-card,.bring,.skill,.flow,.gantt,.job,.project,.edu,.contact');
const showCounters=el=>el.querySelectorAll('[data-count]').forEach(animateCount);
if(reduceMotion||!('IntersectionObserver' in window)){
 revealTargets.forEach(el=>el.classList.add('in'));
}else{
 const finish=el=>setTimeout(()=>el.classList.remove('reveal'),1400);
 const revealObserver=new IntersectionObserver((entries,observer)=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;
  entry.target.classList.add('in');finish(entry.target);observer.unobserve(entry.target);
 }),{threshold:.1,rootMargin:'0px 0px -6% 0px'});
 revealTargets.forEach(el=>{
  const siblings=[...el.parentElement.children].filter(child=>child.matches('.skill,.project,.edu'));
  if(siblings.length)el.style.setProperty('--d',siblings.indexOf(el)%3*80+'ms');
  el.classList.add('reveal');revealObserver.observe(el);
 });
}

// Headline numbers
function animateCount(el){
 const target=Number(el.dataset.count),suffix=el.dataset.suffix||'',started=performance.now(),duration=1300;
 const step=now=>{const t=Math.min((now-started)/duration,1),eased=1-Math.pow(1-t,3);el.textContent=Math.round(target*eased)+suffix;if(t<1)requestAnimationFrame(step)};
 requestAnimationFrame(step);
}
if(!reduceMotion)setTimeout(()=>showCounters(document.querySelector('.stats')),500);

// Scroll progress, header state and timeline rail
const progress=document.getElementById('progress'),topbar=document.querySelector('.topbar'),timeline=document.querySelector('.timeline'),railFill=document.querySelector('.rail-fill');
let scrollQueued=false;
function updateScroll(){
 scrollQueued=false;
 const max=root.scrollHeight-innerHeight;
 progress.style.transform=`scaleX(${max>0?Math.min(scrollY/max,1):0})`;
 topbar.classList.toggle('scrolled',scrollY>12);
 const box=timeline.getBoundingClientRect();
 const done=(innerHeight*.65-box.top)/box.height;
 railFill.style.transform=`scaleY(${Math.max(0,Math.min(done,1))})`;
 // Highlight the role nearest the active reading position, not permanently the first role.
 const jobs=[...timeline.querySelectorAll('.job')];
 const focusY=innerHeight*.42;
 let active=jobs.find(job=>{
  const rect=job.getBoundingClientRect();
  return rect.top<=focusY&&rect.bottom>focusY;
 });
 if(!active&&jobs.length){
  active=jobs.reduce((nearest,job)=>{
   const rect=job.getBoundingClientRect();
   const distance=focusY<rect.top?rect.top-focusY:focusY>rect.bottom?focusY-rect.bottom:0;
   if(!nearest||distance<nearest.distance)return {job,distance};
   return nearest;
  },null)?.job;
 }
 jobs.forEach(job=>{
  const current=job===active;
  job.classList.toggle('is-active',current);
  if(current)job.setAttribute('aria-current','location');
  else job.removeAttribute('aria-current');
 });
}
function scheduleScrollUpdate(){if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll)}}
addEventListener('scroll',scheduleScrollUpdate,{passive:true});
addEventListener('resize',scheduleScrollUpdate);
updateScroll();

// Active navigation link
const navLinks=[...links.querySelectorAll('a[href^="#"]')];
if('IntersectionObserver' in window){
 const spy=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;
  navLinks.forEach(link=>{const active=link.getAttribute('href')==='#'+entry.target.id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current')});
 }),{rootMargin:'-40% 0px -55% 0px'});
 document.querySelectorAll('main section').forEach(section=>spy.observe(section));
}

/* Project cards remain concise; detailed narratives live in Case Studies. */

/* Lightweight hero depth motion, disabled for touch and reduced-motion users */
if(!reduceMotion&&matchMedia('(hover:hover) and (pointer:fine)').matches){
 const hero=document.querySelector('.hero');
 const depthItems=[...document.querySelectorAll('.hero-layer[data-depth],.hero-portrait [data-depth]')];
 let pointerFrame=0,lastX=0,lastY=0;
 hero?.addEventListener('pointermove',event=>{
  const rect=hero.getBoundingClientRect();
  lastX=(event.clientX-rect.left)/rect.width-.5;
  lastY=(event.clientY-rect.top)/rect.height-.5;
  if(pointerFrame)return;
  pointerFrame=requestAnimationFrame(()=>{
   depthItems.forEach(item=>{
    const depth=Number(item.dataset.depth)||0;
    item.style.transform=`translate3d(${lastX*depth}px,${lastY*depth}px,0)`;
   });
   pointerFrame=0;
  });
 },{passive:true});
 hero?.addEventListener('pointerleave',()=>{
  depthItems.forEach(item=>{item.style.transform=''});
 },{passive:true});
}

/* Reveal hero intro even when a visitor lands on a deep-linked section */
if(!reduceMotion){
 document.querySelectorAll('.hero-content > *').forEach(el=>el.classList.add('hero-intro-item'));
}

/* Smooth section navigation with a small focus handoff for keyboard users */
document.querySelectorAll('a[href^="#"]').forEach(anchor=>{
 anchor.addEventListener('click',()=>{
  const target=document.querySelector(anchor.getAttribute('href'));
  if(target&&target.matches('section')) {
   if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');
   window.setTimeout(()=>target.focus({preventScroll:true}),450);
  }
 });
});

// Interactive finance capability panels. Visual bars are illustrative, not company results.
const financeContent={reporting:{index:'01 / FINANCIAL REPORTING',title:'Clarity, accuracy and timely close.',copy:'Monthly, quarterly and annual closing, IFRS financial statements, reconciliations and management reporting.',tags:['IFRS','Period close','Management reports']},planning:{index:'02 / FP&A',title:'Forward-looking financial insight.',copy:'Budgeting, forecasting, variance analysis and performance monitoring to support informed business decisions.',tags:['Budgeting','Forecasting','Variance analysis']},treasury:{index:'03 / TREASURY',title:'Visibility over cash and liquidity.',copy:'Cash flow forecasting, liquidity planning, banking operations and working capital management.',tags:['Cash flow','Liquidity','Working capital']},controls:{index:'04 / FINANCIAL CONTROL',title:'Reliable processes and accountability.',copy:'Internal controls, account reconciliations, audit coordination, VAT reporting and ZATCA compliance.',tags:['Internal controls','Audit','VAT & ZATCA']}};
const financeTabs=[...document.querySelectorAll('[data-finance-tab]')],financePanel=document.getElementById('finance-panel');
financeTabs.forEach(tab=>tab.addEventListener('click',()=>{const item=financeContent[tab.dataset.financeTab];if(!item||!financePanel)return;financeTabs.forEach(btn=>{const active=btn===tab;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',String(active));});financePanel.querySelector('.finance-panel-index').textContent=item.index;financePanel.querySelector('h4').textContent=item.title;financePanel.querySelector('.finance-panel-copy>p').textContent=item.copy;financePanel.querySelector('.finance-tags').replaceChildren(...item.tags.map(label=>{const span=document.createElement('span');span.textContent=label;return span;}));financePanel.querySelector('.finance-bars').animate([{opacity:.45,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});}));
// Highlight the career milestone currently in view.
const careerRows=[...document.querySelectorAll('.g-row')];
if('IntersectionObserver' in window&&careerRows.length){const careerSpy=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){careerRows.forEach(row=>row.removeAttribute('aria-current'));const match=careerRows.find(row=>row.hash===`#${entry.target.id}`);match?.setAttribute('aria-current','true');}}),{rootMargin:'-35% 0px -55% 0px'});careerRows.forEach(row=>{const target=document.querySelector(row.hash);if(target)careerSpy.observe(target);});}


/* Open portfolio case studies in an accessible, responsive modal */
(()=>{
 const modal=document.getElementById('caseStudyModal');
 if(!modal)return;
 const frame=modal.querySelector('.case-study-modal-frame');
 const title=modal.querySelector('#caseStudyModalTitle');
 const close=modal.querySelector('.case-study-modal-close');
 let lastTrigger=null;
 const pageStyle=`
  html{scroll-behavior:auto!important;scrollbar-width:thin;scrollbar-color:#C49A45 #182333}\n  html::-webkit-scrollbar,body::-webkit-scrollbar{width:6px;height:6px}\n  html::-webkit-scrollbar-track,body::-webkit-scrollbar-track{background:#182333;border-radius:999px}\n  html::-webkit-scrollbar-thumb,body::-webkit-scrollbar-thumb{background:#C49A45;border:1px solid #182333;border-radius:999px}\n  html::-webkit-scrollbar-thumb:hover,body::-webkit-scrollbar-thumb:hover{background:#EAD7B2}
  body{min-height:100%;overflow-x:hidden}
  header,footer{display:none!important}
  main{padding-bottom:28px}
  .hero.wrap,.section .wrap{width:min(100% - 44px,1000px)}
  @media(max-width:600px){.hero.wrap,.section .wrap{width:calc(100% - 34px)}.hero{padding-top:30px}.section{padding-top:30px;padding-bottom:30px}h1{font-size:clamp(30px,8vw,42px)!important}}
 `;
 document.querySelectorAll('.case-study-card[href$=".html"]').forEach(card=>{
  card.addEventListener('click',event=>{
   if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();
   lastTrigger=card;
   const heading=card.querySelector('h3');
   title.textContent=heading?heading.textContent.trim():'Case Study';
   frame.src=card.href;
   if(!modal.open)modal.showModal();
   close.focus();
  });
 });
 frame.addEventListener('load',()=>{
  try{
   const doc=frame.contentDocument;
   if(!doc)return;
   const style=doc.createElement('style');
   style.textContent=pageStyle;
   doc.head.appendChild(style);
   doc.documentElement.style.overflowY='auto';
  }catch(error){/* The standalone case study link remains available as a fallback. */}
 });
 const closeModal=()=>{
  if(modal.open)modal.close();
  frame.src='about:blank';
  if(lastTrigger)lastTrigger.focus();
 };
 close.addEventListener('click',closeModal);
 modal.addEventListener('click',event=>{if(event.target===modal)closeModal();});
 modal.addEventListener('close',()=>{if(lastTrigger)lastTrigger.focus();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal.open)closeModal();});
})();


/* Show three key responsibilities in each role and all items in a modal */
(()=>{
 const modal=document.getElementById('responsibilitiesModal');
 if(!modal)return;
 const modalTitle=modal.querySelector('#responsibilitiesModalTitle');
 const list=modal.querySelector('.responsibilities-modal-list');
 const close=modal.querySelector('.responsibilities-modal-close');
 let lastTrigger=null;
 document.querySelectorAll('.job').forEach(job=>{
  const responsibilities=[...job.querySelectorAll(':scope > div > ul:not(.chips)')][0];
  if(!responsibilities)return;
  // Remove any previous or cached action labels so only one control can remain.
  let sibling=responsibilities.nextElementSibling;
  while(sibling&&!sibling.matches('ul,article')){
   if(sibling.matches('button,a')||sibling.classList.contains('responsibilities-trigger'))sibling.remove();
   sibling=sibling.nextElementSibling;
  }
  const items=[...responsibilities.querySelectorAll(':scope > li')];
  items.forEach((item,index)=>{
   item.hidden=index>=3;
   item.style.display=index>=3?'none':'';
  });
  if(items.length<=3)return;
  const heading=job.querySelector('h3')?.textContent.trim()||'Role';
  const company=job.querySelector('.company')?.textContent.trim().replace(/\s+/g,' ')||'';
  const trigger=document.createElement('button');
  trigger.type='button';
  trigger.className='responsibilities-trigger';
  trigger.innerHTML='View all <span aria-hidden="true">↗</span>';
  trigger.setAttribute('aria-label','View all '+items.length+' responsibilities for '+heading);
  responsibilities.insertAdjacentElement('afterend',trigger);
  trigger.addEventListener('click',()=>{
   lastTrigger=trigger;
   modalTitle.textContent=heading;
   list.replaceChildren(...items.map(item=>{
    const li=document.createElement('li');
    li.textContent=item.textContent.trim();
    return li;
   }));
   modal.querySelector('.responsibilities-modal-kicker').textContent=company?company.toUpperCase():'PROFESSIONAL EXPERIENCE';
   modal.showModal();
   close.focus();
  });
 });
 const closeModal=()=>{if(modal.open)modal.close();if(lastTrigger)lastTrigger.focus();};
 close.addEventListener('click',closeModal);
 modal.addEventListener('click',event=>{if(event.target===modal)closeModal();});
 modal.addEventListener('close',()=>{if(lastTrigger)lastTrigger.focus();});
})();

/* Compact Get in Touch dropdowns */
(()=>{
 const menus=[...document.querySelectorAll('.contact-menu')];
 if(!menus.length)return;
 const close=menu=>{
  menu.classList.remove('is-open');
  const trigger=menu.querySelector('.contact-menu-trigger');
  const panel=menu.querySelector('.contact-menu-panel');
  if(trigger)trigger.setAttribute('aria-expanded','false');
  if(panel)panel.hidden=true;
 };
 const closeAll=except=>menus.forEach(menu=>{if(menu!==except)close(menu)});
 menus.forEach(menu=>{
  const trigger=menu.querySelector('.contact-menu-trigger');
  const panel=menu.querySelector('.contact-menu-panel');
  if(!trigger||!panel)return;
  trigger.addEventListener('click',event=>{
   event.preventDefault();
   const opening=panel.hidden;
   closeAll(menu);
   panel.hidden=!opening;
   menu.classList.toggle('is-open',opening);
   trigger.setAttribute('aria-expanded',String(opening));
  });
  panel.addEventListener('click',event=>{
   if(event.target.closest('a'))close(menu);
  });
 });
 document.addEventListener('click',event=>{
  if(!event.target.closest('.contact-menu'))closeAll();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
   const open=menus.find(menu=>menu.classList.contains('is-open'));
   if(open){const trigger=open.querySelector('.contact-menu-trigger');close(open);trigger?.focus();}
  }
 });
})();
