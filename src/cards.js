import sharp from 'sharp';
import { AttachmentBuilder } from 'discord.js';
sharp.cache(false); sharp.concurrency(1);
export const escapeXml=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
const clip=(s,n)=>Array.from(String(s??'')).slice(0,n).join('');
const t=(x,y,text,size=24,color='#edf7f3',weight=400,maxWidth=914-x)=>{
  // Conservative glyph widths keep long names and unbroken text inside their column.
  const estimate=Array.from(String(text)).reduce((sum,ch)=>sum+(/[MW@]/.test(ch)?1:/[A-Z0-9]/.test(ch)?.75:/[^\x00-\x7f]/.test(ch)?1:.65),0)*size;
  const fittedSize=estimate>maxWidth?size*maxWidth/estimate:size;
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${fittedSize}" font-weight="${weight}" font-family="Arial,DejaVu Sans,sans-serif">${escapeXml(text)}</text>`;
};
const themes={mint:'#53e3c2',sunset:'#ffab87',ice:'#8abaff',gold:'#f3d27b'};
function frame(label,content,{height=480,theme='mint',footer='GAMING  /  CHATTING  /  CODING'}={}) {
  const accent=themes[theme]??themes.mint;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${height}" viewBox="0 0 960 ${height}"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#121d25"/><stop offset="1" stop-color="#080f16"/></linearGradient><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#ffffff" stroke-opacity=".035"/></pattern></defs><rect width="960" height="${height}" rx="24" fill="url(#bg)"/><rect width="960" height="${height}" rx="24" fill="url(#grid)"/><path d="M710 0L960 250M775 0L960 185M840 0L960 120" stroke="${accent}" opacity=".12" stroke-width="28"/><rect x="32" y="30" width="4" height="27" rx="2" fill="${accent}"/>${t(50,52,'>_ C O R E',22,accent,700)}${t(914,51,'',17)}<text x="914" y="51" text-anchor="end" fill="#9bafb9" font-size="15" font-family="Arial,sans-serif" letter-spacing="2">${escapeXml(clip(label.toUpperCase(),38))}</text><path d="M40 78H920" stroke="#2b3941"/>${content}<path d="M40 ${height-57}H920" stroke="#2b3941"/>${t(42,height-29,clip(footer,90),13,'#80939e')}<circle cx="909" cy="${height-34}" r="4" fill="${accent}"/></svg>`;
}
export function wrap(text,width=40,max=5) {
  const chunks=String(text).trim().split(/\s+/).flatMap(word=>Array.from(word).length>width?Array.from({length:Math.ceil(Array.from(word).length/width)},(_,i)=>Array.from(word).slice(i*width,(i+1)*width).join('')):[word]);
  const lines=[];let line='';for(const word of chunks){if(Array.from(line+' '+word).length>width&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);
  if(lines.length>max){lines.length=max;lines[max-1]=clip(lines[max-1],width-1)+'…';}return lines;
}
export function rankSvg({name='Member',xp=0,coins=0,rank='—',theme='mint',nitro=false,bio='Every message is another step forward.'}) {
  if(!nitro)theme='mint';
  const level=Math.floor(Math.sqrt(Math.max(0,xp)/100)),base=level*level*100,next=(level+1)**2*100,ratio=Math.max(0,Math.min(1,(xp-base)/(next-base))),accent=themes[theme]??themes.mint;
  return frame(nitro?'CORE NITRO • COSMETIC':'MEMBER PROFILE',`
    ${t(48,126,'PLAYER / '+String(rank).padStart(2,'0'),14,'#9bafb9',700)}
    ${t(48,187,clip(name,24),46,'#f2f7f4',700,610)}
    ${t(50,225,clip(bio,64),18,'#9bafb9',400,610)}
    <rect x="48" y="269" width="610" height="15" rx="7" fill="#25343c"/><rect x="48" y="269" width="${Math.max(1,610*ratio)}" height="15" rx="7" fill="${accent}"/>
    ${t(48,315,`${xp-base} / ${next-base} XP to level ${level+1}`,19,'#b1c3cc')}
    ${t(48,381,`${Number(coins).toLocaleString('en-US')} COINS`,23,accent,700)}${t(360,381,`${Number(xp).toLocaleString('en-US')} TOTAL XP`,18,'#9bafb9')}
    <circle cx="796" cy="231" r="94" fill="none" stroke="#283a43" stroke-width="9"/><circle cx="796" cy="231" r="94" fill="none" stroke="${accent}" stroke-width="9" stroke-dasharray="${590*ratio} 590" transform="rotate(-90 796 231)"/>
    <text x="796" y="249" text-anchor="middle" font-family="Arial,sans-serif" font-size="78" font-weight="700" fill="#f2f7f4">${level}</text><text x="796" y="282" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" letter-spacing="4" fill="${accent}">LEVEL</text>`,{theme});
}
export function quoteSvg({text,author='CORE original',theme='mint',label='QUOTE OF THE MOMENT'}) {
  const lines=wrap(text,37,5);const size=lines.length>4?32:38;
  return frame(label,`${t(46,154,'“',100,themes[theme]??themes.mint,700)}${lines.map((line,i)=>t(88,175+i*44,line,size,'#edf7f3',600)).join('')}${t(90,395,'— '+clip(author,50),19,'#9bafb9')}`,{theme});
}
export function bannerSvg({label,title,subtitle='',detail='',theme='mint'}) {
  return frame(label,`${t(49,139,'// '+clip(label.toUpperCase(),40),17,themes[theme]??themes.mint,700)}${wrap(title,27,2).map((line,i)=>t(46,215+i*61,line,48,'#edf7f3',700)).join('')}${wrap(subtitle,65,2).map((line,i)=>t(49,331+i*27,line,21,'#a9bdc7')).join('')}${t(49,396,clip(detail,85),16,themes[theme]??themes.mint)}`,{theme});
}
export function leaderboardSvg({rows,title='THE LEADERBOARD',unit='XP'}) {
  const height=230+Math.max(rows.length,1)*48;
  return frame('SERVER RANKINGS',`${t(45,131,title,32,'#edf7f3',700)}${rows.length?rows.slice(0,10).map((r,i)=>`<rect x="40" y="${151+i*48}" width="880" height="41" rx="7" fill="${i===0?'#223d3b':'#14212a'}"/>${t(57,179+i*48,String(i+1).padStart(2,'0'),20,i===0?'#53e3c2':'#829aa6',700)}${t(113,179+i*48,clip(r.name,35),20)}<text x="894" y="${179+i*48}" text-anchor="end" fill="#53e3c2" font-family="Arial,sans-serif" font-size="18">${escapeXml(`${r.score} ${unit}`)}</text>`).join(''):t(48,183,'No scores yet. Your story starts here.',23,'#9bafb9')}`,{height});
}
let queue=Promise.resolve(),pending=0;
const serialize=task=>{
  if(pending>=12)throw new Error('Cards are busy. Try again in a few seconds.');pending++;
  const job=queue.then(task);queue=job.catch(()=>{});
  return job.finally(()=>{pending--;});
};
export async function png(svg) {
  return serialize(()=>sharp(Buffer.from(svg)).png().toBuffer());
}
export async function cardPayload(svg,name='core-card.png',description='CORE card') {
  return {files:[new AttachmentBuilder(await png(svg),{name,description})]};
}
export async function animatedCardPayload(frames,name='core-card.gif',description='Animated CORE card') {
  if(!Array.isArray(frames)||frames.length<2||frames.length>40)throw new Error('Invalid animation length.');
  const buffer=await serialize(async()=>{
    const width=800,height=400;
    const pages=[];
    for(const svg of frames)pages.push(await sharp(Buffer.from(svg)).resize(width,height).removeAlpha().raw().toBuffer());
    const gif=await sharp(Buffer.concat(pages),{raw:{width,height:height*pages.length,channels:3,pageHeight:height}})
      .gif({delay:pages.map(()=>150),loop:0,colors:128,dither:0,effort:2}).toBuffer();
    if(gif.length>8*1024*1024)throw new Error('Animated card exceeds the Discord attachment budget.');
    return gif;
  });
  return {files:[new AttachmentBuilder(buffer,{name,description})]};
}
