import { mkdir, writeFile } from 'node:fs/promises';
import { catalog } from '../src/collect.js';
import { collectibleCardSvg, collectibleFrames } from '../src/collect-art.js';
import { animatedCardPayload, png } from '../src/cards.js';

const dir=new URL('../previews/collect/',import.meta.url);
await mkdir(dir,{recursive:true});
const picks={cat:'cosmos',anime:'nova',fox:'ember',relic:'star'};
for(const [category,id] of Object.entries(picks)) {
  const item=catalog[category].find(x=>x.id===id),details={category,item,owner:'Nova.exe',quantity:1};
  const gif=await animatedCardPayload(collectibleFrames(details),`${category}-${id}.gif`);
  await writeFile(new URL(`${category}-${id}.gif`,dir),gif.files[0].attachment);
  await writeFile(new URL(`${category}-${id}.png`,dir),await png(collectibleCardSvg(details)));
}
await writeFile(new URL('GALLERY.md',dir),'# CORE collection previews\n\nEach series has eight original items. These four files are sample encoded GIFs from the same renderer used by `/collect`.\n\n'+Object.entries(picks).map(([category,id])=>`## ${category}\n\n![${category} collectible](${category}-${id}.gif)\n`).join('\n'));
console.log('Rendered four distinct collectible GIFs and still previews.');
