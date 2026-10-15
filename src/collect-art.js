import { escapeXml } from './cards.js';

const ink='#08131b',paper='#f2f8f6';
const rarityColors={common:'#78c7bc',rare:'#74a9ff',epic:'#bc8bff',legendary:'#ffd078'};
const cut=(value,n)=>Array.from(String(value??'')).slice(0,n).join('');

function portrait(category,item,blink=false) {
  const fur=item.color,light=item.light;
  if(category==='cat')return `
    <path d="M616 173L638 75L706 129Q744 109 786 131L854 75L877 174Q895 203 890 255Q877 342 753 351Q623 345 606 254Q599 207 616 173Z" fill="${fur}" stroke="${light}" stroke-width="5"/>
    <path d="M641 154L650 109L688 143M809 142L842 109L851 154" fill="#f9c0c5" opacity=".78"/>
    <ellipse cx="751" cy="294" rx="62" ry="42" fill="${light}" opacity=".86"/>
    ${blink?'<path d="M666 224Q687 234 707 224M795 224Q815 234 836 224" fill="none" stroke="#192a32" stroke-width="8" stroke-linecap="round"/>':'<path d="M666 226Q686 210 707 226M795 226Q815 210 836 226" fill="none" stroke="#192a32" stroke-width="10" stroke-linecap="round"/>'}
    <path d="M739 267L765 267L752 282Z" fill="#dc778c"/><path d="M752 282Q739 297 726 287M752 282Q765 297 778 287" fill="none" stroke="#192a32" stroke-width="4" stroke-linecap="round"/>
    <path d="M689 278L618 265M689 291L612 295M815 278L886 265M815 291L892 295" stroke="${light}" stroke-width="4" stroke-linecap="round" opacity=".8"/>
    <path d="M734 153L725 185M769 153L780 185" stroke="${light}" stroke-opacity=".38" stroke-width="9" stroke-linecap="round"/>`;
  if(category==='anime')return `
    <path d="M636 393Q647 323 702 316L753 345L806 316Q865 329 873 393Z" fill="${light}"/>
    <path d="M716 303L714 345Q750 370 791 345L788 303Z" fill="#f5c8aa"/>
    <ellipse cx="751" cy="213" rx="93" ry="121" fill="#f5cfb6"/>
    <path d="M654 234Q629 128 683 94Q722 54 791 78Q875 82 851 225L822 194L803 148Q763 172 699 162Q688 200 654 234Z" fill="${fur}"/>
    <path d="M662 209Q677 144 704 112M826 191Q803 130 781 101" fill="none" stroke="${light}" stroke-opacity=".45" stroke-width="16"/>
    ${blink?'<path d="M690 222Q709 233 728 222M773 222Q792 233 811 222" fill="none" stroke="#193247" stroke-width="6" stroke-linecap="round"/>':'<ellipse cx="709" cy="224" rx="16" ry="24" fill="#193247"/><ellipse cx="792" cy="224" rx="16" ry="24" fill="#193247"/><circle cx="714" cy="215" r="5" fill="#fff"/><circle cx="797" cy="215" r="5" fill="#fff"/>'}
    <path d="M688 187Q711 178 731 191M772 191Q794 178 815 187" fill="none" stroke="${fur}" stroke-width="7" stroke-linecap="round"/>
    <path d="M737 281Q752 290 768 281" fill="none" stroke="#aa6b78" stroke-width="4" stroke-linecap="round"/>
    <path d="M651 224Q627 302 666 348M849 225Q879 312 836 353" fill="none" stroke="${fur}" stroke-width="27" stroke-linecap="round"/>`;
  if(category==='fox')return `
    <path d="M616 185L642 66L708 153Q750 133 792 153L858 66L884 185Q905 296 752 365Q600 296 616 185Z" fill="${fur}" stroke="${light}" stroke-width="5"/>
    <path d="M646 145L653 98L694 159M806 159L846 98L857 145" fill="#f6afa8"/>
    <path d="M632 250Q670 277 707 257L752 311L797 257Q835 277 873 250Q860 332 752 365Q643 332 632 250Z" fill="${light}"/>
    ${blink?'<path d="M670 222Q691 235 711 222M791 222Q812 235 832 222" fill="none" stroke="#182b32" stroke-width="8" stroke-linecap="round"/>':'<path d="M670 223Q691 208 711 223M791 223Q812 208 832 223" fill="none" stroke="#182b32" stroke-width="9" stroke-linecap="round"/>'}
    <path d="M733 286L771 286L752 304Z" fill="#172733"/><path d="M752 303V320" stroke="#172733" stroke-width="4"/>`;
  return `
    <circle cx="752" cy="238" r="149" fill="none" stroke="${light}" stroke-width="2" stroke-opacity=".55" stroke-dasharray="5 11"/>
    <circle cx="752" cy="238" r="125" fill="none" stroke="${fur}" stroke-width="5" stroke-opacity=".54"/>
    <path d="M752 66L836 166L813 305L752 389L691 305L668 166Z" fill="${fur}" stroke="${light}" stroke-width="6"/>
    <path d="M752 66L752 389L691 305L668 166ZM752 66L836 166L752 198Z" fill="${light}" opacity=".5"/>
    <path d="M668 166L752 198L836 166M691 305L752 198L813 305" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="3"/>
    <circle cx="752" cy="238" r="37" fill="#fff" opacity=".24"/>`;
}

function signature(category,item) {
  const c=item.light;
  if(category==='relic')return Array.from({length:4+item.variant},(_,i)=>{
    const angle=i*2*Math.PI/(4+item.variant),x1=752+48*Math.cos(angle),y1=238+48*Math.sin(angle),x2=752+67*Math.cos(angle),y2=238+67*Math.sin(angle);
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
  }).join('');
  switch(item.variant){
    case 0:return `<path d="M751 135V174M732 145L739 171M770 145L763 171" stroke="${c}" stroke-width="7" stroke-linecap="round" opacity=".72"/>`;
    case 1:return `<path d="M739 141L710 127L718 153L739 145L752 145L774 153L782 127L753 141Z" fill="${c}"/><circle cx="746" cy="144" r="7" fill="#f9a9bc"/>`;
    case 2:return `<path d="M669 214H832M674 207Q679 253 710 251Q739 250 742 213M760 213Q765 250 792 251Q825 253 829 207" fill="none" stroke="${c}" stroke-width="5"/>`;
    case 3:return `<path d="M751 119L758 139L779 139L762 153L768 173L751 160L734 173L740 153L723 139L744 139Z" fill="${c}"/>`;
    case 4:return `<path d="M758 119A27 27 0 1 0 781 161A23 23 0 1 1 758 119Z" fill="${c}"/>`;
    case 5:return `<circle cx="644" cy="266" r="9" fill="${c}"/><circle cx="860" cy="266" r="9" fill="${c}"/><circle cx="644" cy="266" r="3" fill="#fff"/><circle cx="860" cy="266" r="3" fill="#fff"/>`;
    case 6:return `<path d="M754 112L730 151H749L738 181L777 137H758L771 112Z" fill="${c}"/>`;
    default:return `<path d="M705 148L710 116L731 135L752 104L773 135L794 116L799 148Z" fill="${c}" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>`;
  }
}

export function collectibleCardSvg({category,item,owner='Collector',quantity=1},frame=10) {
  const accent=rarityColors[item.rarity],label=category.toUpperCase(),name=escapeXml(cut(item.name,20));
  const f=Math.max(0,Math.min(15,frame)),ease=x=>1-(1-Math.max(0,Math.min(1,x)))**3;
  const enter=ease((f-1)/4),text=ease((f-3)/4),art=ease((f-2)/5),exit=1-ease((f-13)/2);
  const bob=category==='relic'?0:Math.sin(f/16*Math.PI*2+item.variant)*4;
  const turn=category==='relic'?f/16*360:Math.sin(f/16*Math.PI*2+item.variant)*2;
  const glintX=750+145*Math.cos(f/16*Math.PI*2+item.variant),glintY=235+145*Math.sin(f/16*Math.PI*2+item.variant);
  const blink=(f===8||f===9);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="480" viewBox="0 0 960 480">
    <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#14232e"/><stop offset="1" stop-color="${ink}"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="${accent}" stop-opacity=".31"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
      <pattern id="grid" width="31" height="31" patternUnits="userSpaceOnUse"><path d="M31 0H0V31" fill="none" stroke="#fff" stroke-opacity=".035"/></pattern>
      <clipPath id="round"><rect width="960" height="480" rx="24"/></clipPath></defs>
    <g clip-path="url(#round)"><rect width="960" height="480" fill="url(#bg)"/><rect width="960" height="480" fill="url(#grid)"/>
      <circle cx="750" cy="235" r="270" fill="url(#glow)" opacity="${(.7+.3*Math.sin(f/16*Math.PI*2)**2).toFixed(2)}"/><path d="M529 0V480" stroke="${accent}" stroke-opacity=".28"/>
      <path d="M-50 350L360 0M75 480L515 40" stroke="#fff" stroke-opacity=".05" stroke-width="2"/>
      <circle cx="750" cy="238" r="169" fill="none" stroke="${accent}" stroke-opacity="${(.2*enter*exit).toFixed(2)}" stroke-width="2" stroke-dasharray="2 12" transform="rotate(${f*360/16} 750 238)"/>
      <circle cx="${glintX.toFixed(1)}" cy="${glintY.toFixed(1)}" r="5" fill="#fff" opacity="${(art*exit).toFixed(2)}"/>
      <g opacity="${(enter*exit).toFixed(2)}">
      <rect x="45" y="40" width="6" height="30" rx="3" fill="${accent}"/>
      <text x="66" y="64" fill="${paper}" font-family="Arial,sans-serif" font-size="22" font-weight="800" letter-spacing="4">CORE / COLLECT</text>
      <text x="910" y="62" fill="${accent}" text-anchor="end" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="3">${escapeXml(item.rarity.toUpperCase())}</text>
      <path d="M42 87H918" stroke="#c2e9df" stroke-opacity=".2"/>
      </g>
      <g opacity="${(text*exit).toFixed(2)}" transform="translate(0 ${((1-text)*24).toFixed(1)})">
      <text x="52" y="149" fill="${accent}" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="4">${escapeXml(label)} / ${escapeXml(item.id.toUpperCase())}</text>
      <text x="49" y="237" fill="${paper}" font-family="Arial,sans-serif" font-size="${item.name.length>12?52:69}" font-weight="900">${name}</text>
      <path d="M52 266H465" stroke="${accent}" stroke-opacity=".64" stroke-width="3"/>
      <text x="53" y="308" fill="#b4c9cb" font-family="Arial,sans-serif" font-size="20">${escapeXml(cut(item.tagline,38))}</text>
      <text x="53" y="360" fill="#d4e9e5" font-family="Arial,sans-serif" font-size="18">OWNED BY ${escapeXml(cut(owner,28))}</text>
      <text x="53" y="394" fill="${accent}" font-family="Arial,sans-serif" font-size="17" font-weight="700">COPIES ${Math.max(1,Number(quantity)||1)}</text>
      </g>
      <g opacity="${(art*exit).toFixed(2)}" transform="translate(0 ${bob.toFixed(1)}) rotate(${turn.toFixed(1)} 752 238)">
      ${portrait(category,item,blink)}${signature(category,item)}
      </g>
      <g opacity="${(enter*exit).toFixed(2)}">
      <path d="M42 426H918" stroke="#c2e9df" stroke-opacity=".2"/>
      <text x="52" y="454" fill="#8ea9ae" font-family="Arial,sans-serif" font-size="15" letter-spacing="2">ORIGINAL CORE COLLECTIBLE</text>
      <text x="909" y="454" text-anchor="end" fill="${accent}" font-family="Arial,sans-serif" font-size="15">${escapeXml(label)} SERIES</text>
      </g>
    </g></svg>`;
}

export function collectibleFrames(details) {
  return Array.from({length:16},(_,frame)=>collectibleCardSvg(details,frame));
}
