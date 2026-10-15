export async function jsonFetch(url,{fetcher=fetch,maxBytes=2000000,...options}={}) {
  const response=await fetcher(url,{...options,signal:AbortSignal.timeout(12000),redirect:'error',headers:{'User-Agent':'CORE-Community-Bot/1.0',...options.headers}});
  if(!response.ok)throw new Error(`Service temporarily unavailable (HTTP ${response.status}).`);
  if(response.status===204)return null;
  const reader=response.body.getReader();const chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>maxBytes)throw new Error('Service response was too large.');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function publicLink(value,allowedHosts) {
  try{const url=new URL(value);return url.protocol==='https:'&&(!allowedHosts||allowedHosts.some(h=>url.hostname===h||url.hostname.endsWith('.'+h)))?url.href:null;}catch{return null;}
}
