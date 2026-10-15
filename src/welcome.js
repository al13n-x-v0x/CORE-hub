import { escapeXml } from './cards.js';

const W=960,H=480,FRAMES=20;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>1-(1-clamp(x))**3;
const fmt=x=>Number(x).toFixed(2);
const cut=(value,length)=>Array.from(String(value??'')).slice(0,length).join('');

// A short intro, readable hold, and quick exit let Discord replay the card cleanly.
export function welcomeSvg({name='new player',server='CORE',count=0,inviter=null}={},index=12) {
  const frame=Math.max(0,Math.min(FRAMES-1,index));
  const i=frame*32/FRAMES;
  const exit=1-ease((i-27)/5);
  const heading=ease((i-2)/7)*exit;
  const second=ease((i-5)/7)*exit;
  const identity=ease((i-8)/6)*exit;
  const chrome=ease((i-1)/5)*exit;
  const beam=ease((i-1)/8)*exit;
  const spin=frame/FRAMES*360;
  const orbitX=750+109*Math.cos(frame/FRAMES*Math.PI*2);
  const orbitY=243+109*Math.sin(frame/FRAMES*Math.PI*2);
  const safeName=cut(name,29);
  const nameSize=Math.max(22,Math.min(42,450/(Math.max(safeName.length,8)*.6)));
  const safeServer=cut(server,43);
  const inviterLabel=inviter?`INVITED BY ${cut(inviter,27).toUpperCase()}`:'GOOD TO HAVE YOU HERE';
  const memberCount=Number.isFinite(Number(count))?Math.max(0,Math.floor(Number(count))):0;
  const glints=Array.from({length:11},(_,n)=>{
    const a=n*2.399+i*.012,r=56+n*15,x=750+Math.cos(a)*r,y=243+Math.sin(a)*r*.75;
    return `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${n%3===0?2.3:1.2}" fill="#b5fff0" opacity="${fmt((.12+.18*Math.sin(i*.19+n)**2)*chrome)}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#12232c"/><stop offset=".55" stop-color="#09141c"/><stop offset="1" stop-color="#061016"/></linearGradient>
      <radialGradient id="halo"><stop stop-color="#3ee3c4" stop-opacity=".2"/><stop offset=".55" stop-color="#2bbda9" stop-opacity=".06"/><stop offset="1" stop-color="#2bbda9" stop-opacity="0"/></radialGradient>
      <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#99ffdf"/><stop offset=".45" stop-color="#42d6c0"/><stop offset="1" stop-color="#15515a"/></linearGradient>
      <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="#91d6c9" stroke-opacity=".055"/></pattern>
      <clipPath id="card"><rect width="960" height="480" rx="28"/></clipPath>
      <clipPath id="headline"><rect x="54" y="123" width="570" height="169"/></clipPath>
    </defs>
    <g clip-path="url(#card)">
      <rect width="960" height="480" fill="url(#bg)"/>
      <rect width="960" height="480" fill="url(#grid)"/>
      <path d="M-40 397L373 0M29 480L511 0M703 480L960 223" stroke="#70c8bb" stroke-width="1" opacity=".07"/>
      <circle cx="750" cy="243" r="227" fill="url(#halo)" opacity="${fmt(chrome)}"/>
      <text x="685" y="346" fill="#c6fff3" opacity=".045" font-family="Arial,sans-serif" font-size="190" font-weight="900">C</text>
      <path d="M0 73H${fmt(960*chrome)}" stroke="#81ccb9" opacity=".25"/>
      <rect x="55" y="42" width="34" height="7" rx="3" fill="#5be5c9" opacity="${fmt(chrome)}"/>
      <text x="101" y="52" fill="#e6faf4" opacity="${fmt(chrome)}" font-size="19" font-weight="800" font-family="Arial,sans-serif" letter-spacing="5">CORE</text>
      <text x="579" y="52" fill="#9ab7b7" opacity="${fmt(chrome*.9)}" font-size="13" font-family="Arial,sans-serif" letter-spacing="3">COMMUNITY / WELCOME</text>
      <g transform="rotate(${fmt(spin)} 750 243)" opacity="${fmt(chrome)}">
        <circle cx="750" cy="243" r="117" fill="none" stroke="#32756f" stroke-width="1" stroke-dasharray="4 10"/>
        <circle cx="750" cy="243" r="101" fill="none" stroke="url(#ring)" stroke-width="6" stroke-linecap="round" stroke-dasharray="171 29 89 346"/>
        <circle cx="750" cy="243" r="83" fill="none" stroke="#b1f7e9" stroke-opacity=".26" stroke-width="1" stroke-dasharray="1 7"/>
      </g>
      <circle cx="750" cy="243" r="69" fill="#0d222a" stroke="#58b7ad" stroke-opacity=".33" stroke-width="2" opacity="${fmt(chrome)}"/>
      <path d="M711 243L738 270L791 217" fill="none" stroke="#8bf6d9" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="${fmt(identity)}"/>
      <circle cx="${fmt(orbitX)}" cy="${fmt(orbitY)}" r="7" fill="#c2fff0" opacity="${fmt(chrome)}"/>
      ${glints}
      <path d="M55 107H${fmt(55+488*beam)}" stroke="#60ddc3" stroke-width="3" opacity=".9"/>
      <g clip-path="url(#headline)">
        <text x="54" y="205" transform="translate(0 ${fmt((1-heading)*36)})" fill="#f4faf7" opacity="${fmt(heading)}" font-size="78" font-weight="900" font-family="Arial,sans-serif" letter-spacing="-3">WELCOME</text>
        <text x="57" y="271" transform="translate(0 ${fmt((1-second)*29)})" fill="#68e9cf" opacity="${fmt(second)}" font-size="64" font-weight="900" font-family="Arial,sans-serif" letter-spacing="-2">TO CORE</text>
      </g>
      <rect x="55" y="300" width="${fmt(512*identity)}" height="77" rx="12" fill="#193038" stroke="#44776f" stroke-opacity=".65" opacity="${fmt(identity)}"/>
      <text x="74" y="331" fill="#9dc1bc" opacity="${fmt(identity)}" font-size="14" font-weight="700" font-family="Arial,sans-serif" letter-spacing="2">${escapeXml(inviterLabel)}</text>
      <text x="73" y="362" fill="#effaf6" opacity="${fmt(identity)}" font-size="${fmt(nameSize)}" font-weight="800" font-family="Arial,sans-serif">${escapeXml(safeName)}</text>
      <path d="M55 419H905" stroke="#8ecbbd" opacity="${fmt(.22*chrome)}"/>
      <text x="55" y="446" fill="#abc6c0" opacity="${fmt(chrome)}" font-size="17" font-family="Arial,sans-serif">${escapeXml(safeServer)}</text>
      <text x="905" y="446" text-anchor="end" fill="#64ddc5" opacity="${fmt(chrome)}" font-size="15" font-weight="700" font-family="Arial,sans-serif">MEMBER ${memberCount.toLocaleString('en-US')}</text>
      <rect x="0" y="0" width="960" height="480" fill="#041015" opacity=".035"/>
      <path d="M0 0H960V480H0Z" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="22"/>
    </g>
  </svg>`;
}

export function welcomeFrames(details) {
  return Array.from({length:FRAMES},(_,i)=>welcomeSvg(details,i));
}
