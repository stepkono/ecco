(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class{n;cos;sin;rev;constructor(e){if(e&e-1)throw Error(`FFT size must be a power of two`);this.n=e,this.cos=new Float64Array(e/2),this.sin=new Float64Array(e/2);for(let t=0;t<e/2;t++)this.cos[t]=Math.cos(-2*Math.PI*t/e),this.sin[t]=Math.sin(-2*Math.PI*t/e);this.rev=new Uint32Array(e);let t=Math.log2(e);for(let n=0;n<e;n++){let e=0;for(let r=0;r<t;r++)e|=(n>>r&1)<<t-1-r;this.rev[n]=e}}forward(e,t){let n=this.n,r=this.rev;for(let i=0;i<n;i++){let n=r[i];if(n>i){let r=e[i];e[i]=e[n],e[n]=r,r=t[i],t[i]=t[n],t[n]=r}}for(let r=2;r<=n;r<<=1){let i=r>>1,a=n/r;for(let o=0;o<n;o+=r)for(let n=0;n<i;n++){let r=this.cos[n*a],s=this.sin[n*a],c=o+n,l=c+i,u=e[l]*r-t[l]*s,d=e[l]*s+t[l]*r;e[l]=e[c]-u,t[l]=t[c]-d,e[c]+=u,t[c]+=d}}}inverse(e,t){let n=this.n;for(let e=0;e<n;e++)t[e]=-t[e];this.forward(e,t);for(let r=0;r<n;r++)e[r]/=n,t[r]=-t[r]/n}},t=16e3,n=t*5,r=t/512,i=e=>Math.floor(e/128)+1;i(n);var a=128/t,o=new e(512),s=new Float64Array(512);for(let e=0;e<512;e++)s[e]=.5-.5*Math.cos(2*Math.PI*e/512);var c=(e,t)=>{if(t===1)return 0;let n=2*(t-1);return e=(e%n+n)%n,e<t?e:n-e};function l(e){let t=i(e.length),n=new Float32Array(t*257),r=new Float32Array(t*257),a=new Float32Array(t*257),l=new Float64Array(512),u=new Float64Array(512);for(let i=0;i<t;i++){let t=i*128-256;for(let n=0;n<512;n++)l[n]=e[c(t+n,e.length)]*s[n],u[n]=0;o.forward(l,u);let d=i*257;for(let e=0;e<257;e++)n[d+e]=l[e],r[d+e]=u[e],a[d+e]=Math.hypot(l[e],u[e])}return{re:n,im:r,mag:a,frames:t}}function u(e,t,n){let r=new Float64Array(n+512),i=new Float64Array(n+512),a=new Float64Array(512),c=new Float64Array(512);for(let n=0;n<e.frames;n++){let l=n*257;for(let n=0;n<257;n++){let r=t?t[l+n]:1;a[n]=e.re[l+n]*r,c[n]=e.im[l+n]*r}for(let e=257;e<512;e++)a[e]=a[512-e],c[e]=-c[512-e];o.inverse(a,c);let u=n*128;for(let e=0;e<512;e++){let t=u+e;r[t]+=a[e]*s[e],i[t]+=s[e]*s[e]}}let l=new Float32Array(n);for(let e=0;e<n;e++){let t=e+256;l[e]=i[t]>1e-8?r[t]/i[t]:0}return l}function d(e){let t=new Float32Array(e.length);for(let n=0;n<e.length;n++)t[n]=20*Math.log10(e[n]+1e-6);return t}function f(e,t,n=.2){let r=new Float32Array(257),i=new Float32Array(t);for(let a=0;a<257;a++){for(let n=0;n<t;n++)i[n]=e[n*257+a];i.sort(),r[a]=i[Math.floor(t*n)]}return r}var p=e=>2595*Math.log10(1+e/700),m=e=>700*(10**(e/2595)-1);function h(e=32,n=50,r=t/2){let i=new Float32Array(e*257),a=p(n),o=p(r),s=[];for(let t=0;t<e+2;t++)s.push(m(a+(o-a)*t/(e+1)));for(let n=0;n<e;n++){let[e,r,a]=[s[n],s[n+1],s[n+2]];for(let o=0;o<257;o++){let s=o*t/512,c=0;s>=e&&s<=r?c=(s-e)/(r-e||1):s>r&&s<=a&&(c=(a-s)/(a-r||1)),i[n*257+o]=Math.max(0,c)}}return i}function g(e,t,n,r=32){let i=new Float32Array(t*r);for(let a=0;a<t;a++)for(let t=0;t<r;t++){let o=0,s=t*257,c=a*257;for(let t=0;t<257;t++){let r=n[s+t];r>0&&(o+=r*e[c+t]*e[c+t])}i[a*r+t]=10*Math.log10(o+1e-10)}return i}function _(e,t,n,r,i=32){let a=new Float32Array(n*i);for(let o=0;o<n;o++)for(let n=0;n<i;n++){let s=0,c=0;for(let i=0;i<257;i++){let a=r[n*257+i];if(a<=0)continue;let l=a*t[o*257+i]*t[o*257+i]+1e-12;s+=l*e[o*257+i],c+=l}a[o*i+n]=s/c}return a}function v(e,t,n,r=32){let i=new Float32Array(t*257),a=new Float32Array(257);for(let e=0;e<r;e++)for(let t=0;t<257;t++)a[t]+=n[e*257+t];for(let o=0;o<t;o++)for(let t=0;t<257;t++){let s=0;if(a[t]>0){for(let i=0;i<r;i++){let a=n[i*257+t];a>0&&(s+=a*e[o*r+i])}s/=a[t]}else s=e[o*r];i[o*257+t]=s}return i}function y(e,t){let n=0,r=0,i=0,a=0,o=Math.min(e.length,t.length);for(let n=0;n<o;n++)i+=e[n],a+=t[n];i/=o,a/=o;for(let s=0;s<o;s++)n+=(e[s]-i)*(t[s]-a),r+=(t[s]-a)**2;let s=n/(r+1e-12),c=0,l=0;for(let n=0;n<o;n++){let r=s*(t[n]-a),o=e[n]-i-r;c+=r*r,l+=o*o}return 10*Math.log10((c+1e-12)/(l+1e-12))}function b(e){let t=0;for(let n=0;n<e.length;n++)t+=e[n]*e[n];return Math.sqrt(t/e.length)}var x={frog:{label:`Frog call`,color:`#9be15d`,target:!0,hint:`Pulsed harmonic strands, 0.4 to 4 kHz, repeating rhythm`},hornet:{label:`Hornet wing-beat`,color:`#ffb020`,target:!0,hint:`Dense harmonic comb, ~110 Hz fundamental, slow Doppler bend`},chainsaw:{label:`Chainsaw`,color:`#ff5a5a`,target:!0,hint:`Engine harmonics that rise and fall with RPM`},cicada:{label:`Cicada`,color:`#c58cff`,target:!0,hint:`Broadband buzz, 3 to 8 kHz, very regular`},rain:{label:`Rain`,color:`#6f7dff`,target:!1,hint:`Vertical streaks: short broadband drop impacts`},wind:{label:`Wind`,color:`#d6b98c`,target:!1,hint:`Low rumble below 500 Hz that swells in gusts`},unknown:{label:`Unknown`,color:`#ff7ac8`,target:!1,hint:`Something you cannot name yet`}},S=[`frog`,`hornet`,`chainsaw`,`cicada`],C={hyla:{cls:`frog`,file:`frog_hyla_cinerea.wav`,species:`Hyla cinerea`,common:`Green treefrog`,credit:`Fredlyfish4`,license:`CC BY-SA 3.0`,url:`https://commons.wikimedia.org/wiki/File:Hyla_cinerea_call_audio.ogg`},pelophylax:{cls:`frog`,file:`frog_pelophylax.wav`,species:`Pelophylax ridibundus`,common:`Marsh frog`,credit:`Llivermore`,license:`CC BY-SA 4.0`,url:`https://commons.wikimedia.org/wiki/File:Marsh_frog_(Pelophylax_ridibundus)_call.ogg`},litoria:{cls:`frog`,file:`frog_litoria_fallax.wav`,species:`Litoria fallax`,common:`Eastern sedge frog`,credit:`Aviceda`,license:`CC BY-SA 3.0`,url:`https://commons.wikimedia.org/wiki/File:Litoria_fallax_jul08.ogg`},cicada:{cls:`cicada`,file:`cicada_orni.wav`,species:`Cicada orni`,common:`Grey cicada`,credit:`DavidDelon`,license:`Public domain`,url:`https://commons.wikimedia.org/wiki/File:Cicada_orni.ogg`},chainsaw_a:{cls:`chainsaw`,file:`chainsaw_a.wav`,common:`Chainsaw (idle and cut)`,credit:`ezwa`,license:`Public domain`,url:`https://commons.wikimedia.org/wiki/File:Chainsaw_3.ogg`},chainsaw_b:{cls:`chainsaw`,file:`chainsaw_b.wav`,common:`Chainsaw (felling)`,credit:`ezwa`,license:`Public domain`,url:`https://commons.wikimedia.org/wiki/File:Chainsaw_1.ogg`},rain_drops:{cls:`rain`,file:`rain_drops.wav`,common:`Heavy rain drops`,credit:`Gravity Sound`,license:`CC BY 4.0`,url:`https://commons.wikimedia.org/wiki/File:Rain_drops_(Gravity_Sound).wav`},rain_light:{cls:`rain`,file:`rain_light.wav`,common:`Light rain`,credit:`Effib`,license:`CC BY-SA 3.0`,url:`https://commons.wikimedia.org/wiki/File:Sound_of_rain.ogg`},wind:{cls:`wind`,common:`Gusty wind on microphone`,credit:`Procedural synthesis (BioSpectra)`,license:`CC0`},hornet:{cls:`hornet`,species:`Vespa velutina`,common:`Yellow-legged hornet (invasive)`,credit:`Physics-inspired synthesis (BioSpectra)`,license:`CC0`}},w=[{src:`hyla`,role:`native`},{src:`pelophylax`,role:`native`},{src:`litoria`,role:`rare`},{src:`cicada`,role:`native`},{src:`hornet`,role:`invasive`},{src:`chainsaw_b`,role:`threat`}];function T(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function E(e){let t=Math.max(1e-12,e());return Math.sqrt(-2*Math.log(t))*Math.cos(2*Math.PI*e())}function D(e,n,r,i,a=4){let o=new Float32Array(n),s=Array.from({length:a},()=>({f:r+(i-r)*e(),p:e()*Math.PI*2,a:.5+e()})),c=s.reduce((e,t)=>e+t.a,0);for(let e=0;e<n;e++){let n=0;for(let r of s)n+=r.a*Math.sin(2*Math.PI*r.f*e/t+r.p);o[e]=n/c}return o}function O(e,n,r={}){let i=T(n),a=r.f0??105+i()*20,o=r.closest??.4,s=r.speed??1.4,c=r.tc??e/16e3*(.35+i()*.3),l=D(i,e,.2,1.2,3),u=Array.from({length:40},(e,t)=>{let n=t+1,r=1/n**.85;return n===2&&(r*=1.6),n===3&&(r*=1.2),r*(.7+.6*i())}),d=Array.from({length:40},()=>i()*Math.PI*2),f=new Float32Array(e),p=0,m=0;for(let n=0;n<e;n++){let e=s*(n/t-c),r=Math.sqrt(e*e+o*o),h=343/(343+s*e/r);m=.995*m+.002*E(i);let g=a*(1+.035*l[n]+m)*h;p+=2*Math.PI*g/t;let _=0;for(let e=1;e<=40&&!(e*g>7600);e++)_+=u[e-1]*Math.sin(e*p+d[e-1]);let v=1+.15*Math.sin(p*.5);f[n]=_*v*o/r}return f}function k(e,n){let r=T(n),i=D(r,e,.08,.6,5),a=new Float32Array(e),o=0,s=0,c=0;for(let n=0;n<e;n++){let e=.25+.75*(.5+.5*i[n])**2,l=120+900*e,u=1-Math.exp(-2*Math.PI*l/t),d=E(r);o+=u*(d-o),s+=u*(o-s),c+=.004*(E(r)-c),a[n]=e*(s*1.2+c*6)}return a}var A=[{id:`l1`,node:`W-03`,site:`Wetland edge, dusk`,difficulty:1,title:`Treefrog in drizzle`,brief:`A green treefrog calls through light rain. Carve its pulsed calls out of the rain streaks.`,stems:[{src:`hyla`,gainDb:0,offset:1.2},{src:`rain_light`,gainDb:0,offset:.5}],targets:[`frog`]},{id:`l2`,node:`O-11`,site:`Orchard hedge, noon`,difficulty:2,title:`Hornet patrol`,brief:`An invasive hornet hawks along the hedge while cicadas buzz and wind hits the mic. Use the tuning fork on its wing-beat comb.`,stems:[{src:`hornet`,gainDb:-2,seed:7},{src:`cicada`,gainDb:-6,offset:2},{src:`wind`,gainDb:0,seed:3}],targets:[`hornet`,`cicada`]},{id:`l3`,node:`F-07`,site:`Old-growth margin, morning`,difficulty:3,title:`Saw in the marsh`,brief:`A marsh frog chorus, and far away someone starts a chainsaw. Rain on the housing. Separate both: one is a species, one is a threat.`,stems:[{src:`pelophylax`,gainDb:0,offset:0},{src:`chainsaw_b`,gainDb:-6,offset:1},{src:`rain_drops`,gainDb:-5,offset:2}],targets:[`frog`,`chainsaw`]},{id:`l4`,node:`S-01`,site:`Storm front, night`,difficulty:4,title:`Storm chorus`,brief:`Everything at once: treefrog, hornet, chainsaw, heavy rain and wind. Standard CNNs on the node fail here. Can you untangle it?`,stems:[{src:`hyla`,gainDb:-3,offset:4},{src:`hornet`,gainDb:-5,seed:21},{src:`chainsaw_a`,gainDb:-8,offset:3},{src:`rain_drops`,gainDb:0,offset:5},{src:`wind`,gainDb:-2,seed:9}],targets:[`frog`,`hornet`,`chainsaw`]},{id:`l5`,node:`R-22`,site:`Sedge pond, rain`,difficulty:5,title:`Whisper of the sedge frog`,brief:`A rare sedge frog clicks a few times, barely above the rain. Low SNR: the real edge case the sensor misses.`,stems:[{src:`litoria`,gainDb:4,offset:3.4},{src:`rain_light`,gainDb:-2,offset:4},{src:`wind`,gainDb:-4,seed:12}],targets:[`frog`]}],j=new Map;function ee(e){let t=new DataView(e),n=12,r=16,i=1;for(;n<t.byteLength-8;){let e=String.fromCharCode(t.getUint8(n),t.getUint8(n+1),t.getUint8(n+2),t.getUint8(n+3)),a=t.getUint32(n+4,!0);if(e===`fmt `)i=t.getUint16(n+10,!0),r=t.getUint16(n+22,!0);else if(e===`data`){if(r!==16)throw Error(`only 16-bit PCM supported`);let e=Math.floor(a/2/i),o=new Float32Array(e);for(let r=0;r<e;r++)o[r]=t.getInt16(n+8+r*2*i,!0)/32768;return o}n+=8+a+(a&1)}throw Error(`no data chunk`)}async function M(e,t=1){let r=C[e];if(!r.file)return e===`hornet`?O(n,t):k(n,t);let i=j.get(e);if(i)return i;let a=ee(await(await fetch(`./audio/${r.file}`)).arrayBuffer());return j.set(e,a),a}async function te(){let e={};for(let t of Object.keys(C))C[t].file&&(e[t]=await M(t));return e}var ne=.1;function re(e,r){let i=new Float32Array(n),a=Math.round((r.at??0)*t),o=Math.round((r.dur??5)*t),s=Math.round((r.offset??0)*t),c=Math.round(.03*t);for(let t=0;t<o&&a+t<8e4;t++){let n=(s+t)%e.length,l=1;r.at&&t<c&&(l=t/c),r.dur&&o-t<c&&(l=(o-t)/c),i[a+t]=e[n]*l}let l=ne/(b(i.subarray(a,Math.min(8e4,a+o)))||1e-6)*10**(r.gainDb/20);for(let e=0;e<n;e++)i[e]*=l;return i}function ie(e){let t=new Float32Array(n),r=e.map(e=>({spec:e.spec,cls:C[e.spec.src].cls,audio:re(e.audio,e.spec)}));for(let e of r)for(let r=0;r<n;r++)t[r]+=e.audio[r];let i=0;for(let e=0;e<n;e++)i=Math.max(i,Math.abs(t[e]));let a=i>.95?.95/i:1;if(a!==1){for(let e=0;e<n;e++)t[e]*=a;for(let e of r)for(let t=0;t<n;t++)e.audio[t]*=a}let o={};for(let e of r){let t=o[e.cls]??(o[e.cls]=new Float32Array(8e4));for(let r=0;r<n;r++)t[r]+=e.audio[r]}return{mix:t,stems:r,refs:o}}async function ae(e){return ie(await Promise.all(e.stems.map(async e=>({spec:e,audio:await M(e.src,e.seed??1)}))))}async function oe(e,r=0){let i=await e.arrayBuffer(),a=new AudioContext,o=await a.decodeAudioData(i);await a.close();let s=new OfflineAudioContext(1,Math.ceil(o.duration*t),t),c=s.createBufferSource();c.buffer=o,c.connect(s.destination),c.start();let l=(await s.startRendering()).getChannelData(0),u=new Float32Array(n),d=Math.min(Math.max(0,Math.round(r*t)),Math.max(0,l.length-n));u.set(l.subarray(d,d+n));let f=0;for(let e=0;e<n;e++)f=Math.max(f,Math.abs(u[e]));if(f>0)for(let e=0;e<n;e++)u[e]*=.8/f;return u}var se={l1:{place:`Nuuksio National Park`,region:`Espoo, Uusimaa`,lat:60.315,lon:24.502,recorded:new Date(2026,10,14,16,48),views:412,disagreement:.12},l2:{place:`Ruissalo`,region:`Turku, Southwest Finland`,lat:60.43,lon:22.16,recorded:new Date(2026,10,13,12,5),views:1240,disagreement:.21},l3:{place:`Patvinsuo National Park`,region:`Lieksa, North Karelia`,lat:63.12,lon:30.7,recorded:new Date(2026,10,14,7,22),views:860,disagreement:.34},l4:{place:`Oulanka National Park`,region:`Kuusamo, North Ostrobothnia`,lat:66.37,lon:29.33,recorded:new Date(2026,10,12,23,41),views:2310,disagreement:.47},l5:{place:`Linnansaari National Park`,region:`Saimaa, South Savo`,lat:62.13,lon:28.5,recorded:new Date(2026,10,14,21,10),views:96,disagreement:.28}},ce=A.map((e,t)=>({kind:`practice`,id:e.id,title:e.title,durationS:5,labels:0,difficulty:e.difficulty,levelIndex:t,...se[e.id]}));function le(e){return e.startsWith(`noise:`)?`${ue(e.slice(6))} noise`:e===`noise`?`Background noise`:ue(e.replace(/_/g,` `))}var ue=e=>e.charAt(0).toUpperCase()+e.slice(1);function de(e){let t=e.device_guess?le(e.device_guess):null;return{kind:`live`,id:e.clip_id,title:t?`${t}?`:`Unknown sound`,guess:t?`The post's guess: ${t.toLowerCase()} (${Math.round((e.device_score??0)*100)}%)`:void 0,place:e.post,region:e.region,lat:e.lat??60.315,lon:e.lon??24.502,recorded:new Date(e.recorded_at*1e3),durationS:e.duration_s??5,views:e.views,disagreement:e.disagreement,labels:e.labels}}var fe=[{id:`newest`,label:`Newest`,help:`The most recent recordings`},{id:`hottest`,label:`Hottest`,help:`Recordings where people disagree the most about what they hear`},{id:`most`,label:`Most viewed`,help:`Recordings many people have looked at`},{id:`least`,label:`Least viewed`,help:`Recordings that still need fresh ears`}];function pe(e,t){let n=[...e],r=(e,t)=>t.recorded.getTime()-e.recorded.getTime();return t===`newest`&&n.sort((e,t)=>Number(t.kind===`live`)-Number(e.kind===`live`)||r(e,t)),t===`hottest`&&n.sort((e,t)=>t.disagreement-e.disagreement||t.labels-e.labels||r(e,t)),t===`most`&&n.sort((e,t)=>t.views-e.views||r(e,t)),t===`least`&&n.sort((e,t)=>e.views-t.views||r(e,t)),n}var me=[``,`Easy`,`Easy`,`Medium`,`Hard`,`Hard`],he=e=>e.toLocaleTimeString(`en-GB`,{hour:`2-digit`,minute:`2-digit`});function ge(e,t=new Date){let n=e=>new Date(e.getFullYear(),e.getMonth(),e.getDate()).getTime(),r=Math.round((n(t)-n(e))/864e5);return r===0?`Today, ${he(e)}`:r===1?`Yesterday, ${he(e)}`:`${e.toLocaleDateString(`en-GB`,{day:`numeric`,month:`short`})}, ${he(e)}`}function _e(e){let t=e.getHours();return t<5?`Night`:t<10?`Morning`:t<16?`Midday`:t<20?`Evening`:`Night`}var ve=e=>`${e.lat.toFixed(2)}° N, ${e.lon.toFixed(2)}° E`,ye=`biospectra.backend.player`,be=!new URLSearchParams(location.search).get(`backend`);function xe(){let e=new URLSearchParams(location.search).get(`backend`);return e?e.replace(/\/$/,``):`${location.protocol}//${location.hostname}:8000`}async function Se(e){if(!e.ok)throw Error(`${e.status} ${await e.text().catch(()=>``)}`.trim());return await e.json()}var Ce=class{base=xe();playerId=null;async stats(){return Se(await fetch(`${this.base}/stats`))}async player(e=`3d-player`){if(this.playerId)return this.playerId;let t=null;try{t=localStorage.getItem(ye)}catch{}if(t&&(await fetch(`${this.base}/puzzles/next?player_id=${encodeURIComponent(t)}`)).status===404&&(t=null),!t){t=(await Se(await fetch(`${this.base}/players`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({nickname:e})}))).player_id;try{localStorage.setItem(ye,t)}catch{}}return this.playerId=t,t}async nextPuzzle(){let e=await this.player(),t=await fetch(`${this.base}/puzzles/next?player_id=${encodeURIComponent(e)}`);return t.status===204?null:Se(t)}async nextPuzzleExcept(e){let t=await this.nextPuzzle();if(!t||!e.has(t.clip_id))return t;let n=await Se(await fetch(`${this.base}/events?limit=500`)),r=[...new Set(n.filter(e=>e.type===`clip_received`&&e.clip_id).map(e=>e.clip_id).reverse())];for(let n of r){if(e.has(n))continue;let r=await fetch(`${this.base}/clips/${encodeURIComponent(n)}`);if(!r.ok)continue;let i=await r.json();if(i.status===`open`)return{clip_id:n,duration_s:i.duration_s,labels:t.labels,audio_url:`/clips/${n}/audio`,spectrogram_url:`/clips/${n}/spectrogram`}}return null}async audio(e){let n=await(await fetch(this.base+e.audio_url)).arrayBuffer(),r=new AudioContext,i=await r.decodeAudioData(n);await r.close();let a=new OfflineAudioContext(1,Math.max(1,Math.ceil(i.duration*t)),t),o=a.createBufferSource();return o.buffer=i,o.connect(a.destination),o.start(),(await a.startRendering()).getChannelData(0).slice()}async grid(e){let t=await Se(await fetch(this.base+e.spectrogram_url));return delete t.db,t}async submit(e,t,n){let r=await this.player();return Se(await fetch(`${this.base}/clips/${encodeURIComponent(e)}/labels`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({player_id:r,label:t,mask:n?{grid:n}:null})}))}listen(e){let t=new EventSource(`${this.base}/events/stream`);return t.onmessage=t=>{try{e(JSON.parse(t.data))}catch{}},t}},we=1,Te=class{level;mixture;spec;db;floor;maxDb;layers=[];activeLayer=-1;frames;oracle={};oracleScore={};baselineScore={};constructor(e,t){this.level=e,this.mixture=t,this.spec=l(t.mix),this.frames=this.spec.frames,this.db=d(this.spec.mag),this.floor=f(this.db,this.frames),this.maxDb=-1/0;for(let e=0;e<this.db.length;e++)this.maxDb=Math.max(this.maxDb,this.db[e]);this.computeOracle()}get hasTruth(){return Object.keys(this.mixture.refs).length>0}computeOracle(){let e=Object.keys(this.mixture.refs);if(!e.length)return;let t=e.map(e=>l(this.mixture.refs[e]).mag),r=this.spec.mag.length,i=new Float32Array(r);for(let e of t)for(let t=0;t<r;t++)i[t]+=e[t];e.forEach((e,a)=>{let o=new Float32Array(r);for(let e=0;e<r;e++)o[e]=t[a][e]/(i[e]+1e-9);this.oracle[e]=o;let s=this.mixture.refs[e];this.oracleScore[e]=y(u(this.spec,o,n),s),this.baselineScore[e]=y(this.mixture.mix,s)})}addLayer(e,t=`player`,n){let r=this.layers.filter(t=>t.cls===e).length,i={id:we++,name:n??`${x[e].label}${r?` `+(r+1):``}`,cls:e,color:x[e].color,mask:new Float32Array(this.frames*257),visible:!0,origin:t};return this.layers.push(i),this.activeLayer=this.layers.length-1,i}removeLayer(e){this.layers.splice(e,1),this.activeLayer=Math.min(this.activeLayer,this.layers.length-1)}get active(){return this.layers[this.activeLayer]??null}classMasks(e=()=>!0){let t=this.spec.mag.length,n=this.layers.filter(e),r=new Float32Array(t);for(let e of n)for(let n=0;n<t;n++)r[n]+=e.mask[n];let i={};for(let e of n){let n=i[e.cls]??(i[e.cls]=new Float32Array(t));for(let i=0;i<t;i++)n[i]+=e.mask[i]/Math.max(1,r[i])}return i}layerMask(e){let t=this.spec.mag.length,n=new Float32Array(t);for(let e of this.layers)for(let r=0;r<t;r++)n[r]+=e.mask[r];let r=new Float32Array(t);for(let i=0;i<t;i++)r[i]=e.mask[i]/Math.max(1,n[i]);return r}residualMask(){let e=this.spec.mag.length,t=new Float32Array(e).fill(1);for(let n of this.layers)for(let r=0;r<e;r++)t[r]-=n.mask[r];for(let n=0;n<e;n++)t[n]=Math.max(0,t[n]);return t}bgMask=null;backgroundMask(){if(this.bgMask)return this.bgMask;let e=this.db.length,t=new Float32Array(e);for(let e=0;e<this.frames;e++)for(let n=0;n<257;n++){let r=e*257+n,i=(this.db[r]-this.floor[n]-3)/9;t[r]=i<=0?.03:i>=1?1:.03+.97*i*i*(3-2*i)}return this.bgMask=t}maskedAudio(e){return u(this.spec,e,n)}layerAudio(e){return this.maskedAudio(this.layerMask(e))}residualAudio(){return this.maskedAudio(this.residualMask())}scores(e=e=>e.origin!==`ai`){if(!this.hasTruth||!this.level)return[];let t=this.classMasks(e);return this.level.targets.map(e=>{let r=this.mixture.refs[e],i=this.baselineScore[e],a=this.oracleScore[e],o=t[e],s=null;o&&o.some(e=>e>.01)&&(s=y(u(this.spec,o,n),r));let c=s===null?0:Math.max(0,Math.min(1,(s-i)/Math.max(.5,a-i)));return{cls:e,baseline:i,player:s,oracle:a,progress:c}})}},N=e=>e>=.8?3:e>=.6?2:+(e>=.4);function Ee(e,t,n,r){let i=(e.db[t]-e.floor[n]-r)/6+.5;return i<=0?0:i>=1?1:i*i*(3-2*i)}function De(e,t,n,r,i,a){let o=e.layers[t];if(a.erase){o.mask[n]*=1-i;return}let s=i*Ee(e,n,r,a.grip);if(!(s<=0)&&(o.mask[n]+=s*(1-o.mask[n]),a.exclusive))for(let r=0;r<e.layers.length;r++)r!==t&&(e.layers[r].mask[n]*=1-s)}function Oe(e,t,n,r,i){let a=i*i;for(let o=0;o<e.frames;o++){let s=t.xOfFrame(o)-n;if(!(Math.abs(s)>i))for(let n=0;n<257;n++){let i=t.zOfBin[n]-r,c=Math.sqrt((s*s+i*i)/a);if(c>=1)continue;let l=c<.85?0:(c-.85)/.15,u=o*257+n;for(let t of e.layers)t.mask[u]*=l}}}function P(e,t,n,r,i,a,o){let s=a*a;for(let c=0;c<e.frames;c++){let l=t.xOfFrame(c)-r;if(!(Math.abs(l)>a))for(let r=0;r<257;r++){let a=t.zOfBin[r]-i,u=(l*l+a*a)/s;if(u>=1)continue;let d=(1-u)*(1-u)*o.strength;De(e,n,c*257+r,r,d,o)}}}function ke(e,t,n){let i=n/r,a=Math.floor(i);if(a<0||a>=256)return 0;let o=i-a,s=t*257+a,c=e.db[s]*(1-o)+e.db[s+1]*o,l=e.floor[a]*(1-o)+e.floor[a+1]*o;return Math.max(0,c-l)}function F(e,t,n){let i=n/r,a=Math.floor(i);if(a<0||a>=256)return-120;let o=i-a,s=t*257+a;return e.db[s]*(1-o)+e.db[s+1]*o}function I(e,t,n,r=6){let i=0,a=0,o=0;for(let s=1;s<=r&&!((s+.5)*n>=7900);s++){let r=Math.max(F(e,t,s*n),F(e,t,s*n*.985),F(e,t,s*n*1.015)),c=.5*(F(e,t,(s-.5)*n)+F(e,t,(s+.5)*n)),l=1/Math.sqrt(s);i+=l*Math.max(0,r-c),o+=l*ke(e,t,s*n),a+=l}return a?Math.min(i/a,o/a+6):0}function Ae(e,t,n,r){let i=n,a=-1,o=n*(1-r),s=n*(1+r),c=Math.max(.5,(s-o)/24);for(let n=o;n<=s;n+=c){let r=I(e,t,n);r>a&&(a=r,i=n)}return[i,a]}function je(e,t,n,r){let i=new Map;if(t=Math.max(0,Math.min(e.frames-1,Math.round(t))),r.steady){let[a]=Ae(e,t,n,.04);for(let t=0;t<e.frames;t++)I(e,t,a)>=r.minSalience&&i.set(t,a);return i}let[a]=Ae(e,t,n,.05);i.set(t,a);for(let n of[1,-1]){let o=a,s=0;for(let a=t+n;a>=0&&a<e.frames;a+=n){let[t,n]=Ae(e,a,o,r.tolerance);if(n>=r.minSalience)o=t,s=0,i.set(a,o);else if(++s>r.persistence)break}}return i}function Me(e,t,n,i,a=60){for(let[o,s]of n)for(let n=1;n<=a&&n*s<7950;n++){let a=n*s/r,c=1.3+n*s*.012/r,l=Math.max(0,Math.floor(a-c)),u=Math.min(256,Math.ceil(a+c));for(let n=l;n<=u;n++){let r=(n-a)/c;Math.abs(r)>=1||De(e,t,o*257+n,n,(1-r*r)*i.strength,{...i,grip:i.grip-10})}}}function Ne(e,t,n,r,i,o,s,c=.5){let l=Math.max(0,Math.round(Math.min(n,r))),u=Math.min(e.frames-1,Math.round(Math.max(n,r))),d=Math.max(0,Math.round(Math.min(i,o))),f=Math.min(256,Math.round(Math.max(i,o))),p=u-l+1,m=f-d+1;if(p<3||m<2)return{matches:[],periodSec:null};let h=e.layers[t],g=(t,n)=>Math.max(0,e.db[t*257+n]-e.floor[n]-s*.5),_=new Float32Array(p*m),v=!1;for(let e=0;e<p;e++)for(let t=0;t<m;t++){let n=(l+e)*257+d+t;h.mask[n]>.2&&(v=!0)}for(let e=0;e<p;e++)for(let t=0;t<m;t++){let n=(l+e)*257+d+t;_[e*m+t]=g(l+e,d+t)*(v?h.mask[n]:1)}let y=_.reduce((e,t)=>e+t,0)/_.length,b=0;for(let e=0;e<_.length;e++)_[e]-=y,b+=_[e]*_[e];b=Math.sqrt(b)||1;let x=new Float32Array(e.frames-p+1);for(let e=0;e<x.length;e++){let t=0;for(let n=0;n<p;n++)for(let r=0;r<m;r++)t+=g(e+n,d+r);t/=p*m;let n=0,r=0;for(let i=0;i<p;i++)for(let a=0;a<m;a++){let o=g(e+i,d+a)-t;n+=o*_[i*m+a],r+=o*o}x[e]=n/(Math.sqrt(r)*b+1e-9)}let S=Math.max(2,Math.floor(p*.7)),C=[];for(let e=0;e<x.length;e++){if(x[e]<c)continue;let t=!0;for(let n=-S;n<=S&&t;n++){let r=e+n;n!==0&&r>=0&&r<x.length&&x[r]>x[e]&&(t=!1)}t&&C.push({t:e,corr:x[e]})}let w=new Float32Array(p*m);for(let t=0;t<p;t++)for(let n=0;n<m;n++){let r=(l+t)*257+d+n;w[t*m+n]=v?h.mask[r]:Ee(e,r,d+n,s)}!v&&!C.some(e=>Math.abs(e.t-l)<S)&&C.push({t:l,corr:1}),C.sort((e,t)=>e.t-t.t);for(let n of C)if(!(v&&Math.abs(n.t-l)<S))for(let r=0;r<p;r++)for(let i=0;i<m;i++){let a=(n.t+r)*257+d+i,o=w[r*m+i]*Ee(e,a,d+i,s*.5);if(o>h.mask[a]){let n=o-h.mask[a];h.mask[a]=o;for(let r=0;r<e.layers.length;r++)r!==t&&(e.layers[r].mask[a]*=1-n)}}let T=null;if(C.length>=3){let e=C.slice(1).map((e,t)=>e.t-C[t].t).sort((e,t)=>e-t);T=e[Math.floor(e.length/2)]*a}return{matches:C,periodSec:T}}var Pe={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Fe={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Ie=1e3,Le=1001,Re=1002,ze=1003,Be=1004,Ve=1005,He=1006,Ue=1007,We=1008,Ge=1009,Ke=1010,qe=1011,Je=1012,Ye=1013,Xe=1014,Ze=1015,Qe=1016,$e=1017,et=1018,tt=1020,nt=35902,rt=35899,it=1021,at=1022,ot=1023,st=1026,ct=1027,lt=1028,ut=1029,dt=1030,ft=1031,pt=1033,mt=33776,ht=33777,gt=33778,_t=33779,vt=35840,yt=35841,bt=35842,xt=35843,St=36196,Ct=37492,wt=37496,Tt=37488,Et=37489,Dt=37490,Ot=37491,kt=37808,At=37809,jt=37810,Mt=37811,Nt=37812,Pt=37813,Ft=37814,It=37815,Lt=37816,Rt=37817,zt=37818,Bt=37819,Vt=37820,Ht=37821,Ut=36492,Wt=36494,Gt=36495,Kt=36283,qt=36284,Jt=36285,Yt=36286,Xt=2300,Zt=2301,Qt=2302,$t=2303,en=2400,tn=2401,nn=2402,rn=3200,an=`srgb`,on=`srgb-linear`,sn=`linear`,cn=`srgb`,ln=7680,un=35044,dn=2e3;function fn(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function pn(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function mn(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function hn(){let e=mn(`canvas`);return e.style.display=`block`,e}var gn={};function _n(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function vn(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function L(...e){e=vn(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function R(...e){e=vn(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function yn(...e){let t=e.join(` `);t in gn||(gn[t]=!0,L(...e))}function bn(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var xn={0:0,2:6,4:4,3:5,1:1,6:2,7:7,5:3},Sn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},Cn=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),wn=1234567,Tn=Math.PI/180,En=180/Math.PI;function Dn(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(Cn[e&255]+Cn[e>>8&255]+Cn[e>>16&255]+Cn[e>>24&255]+`-`+Cn[t&255]+Cn[t>>8&255]+`-`+Cn[t>>16&15|64]+Cn[t>>24&255]+`-`+Cn[n&63|128]+Cn[n>>8&255]+`-`+Cn[n>>16&255]+Cn[n>>24&255]+Cn[r&255]+Cn[r>>8&255]+Cn[r>>16&255]+Cn[r>>24&255]).toLowerCase()}function z(e,t,n){return Math.max(t,Math.min(n,e))}function On(e,t){return(e%t+t)%t}function kn(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function An(e,t,n){return e===t?0:(n-e)/(t-e)}function jn(e,t,n){return(1-n)*e+n*t}function Mn(e,t,n,r){return jn(e,t,1-Math.exp(-n*r))}function Nn(e,t=1){return t-Math.abs(On(e,t*2)-t)}function Pn(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function Fn(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function In(e,t){return e+Math.floor(Math.random()*(t-e+1))}function Ln(e,t){return e+Math.random()*(t-e)}function Rn(e){return e*(.5-Math.random())}function zn(e){e!==void 0&&(wn=e);let t=wn+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Bn(e){return e*Tn}function Vn(e){return e*En}function Hn(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function Un(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function Wn(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function Gn(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:L(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function Kn(e){switch(e.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function qn(e,t){if(t.constructor===Float32Array)return e;let n=Kn(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.max(e/n,-1)}function Jn(e,t){if(t.constructor===Float32Array)return e;let n=Kn(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.round(e*n)}var Yn={DEG2RAD:Tn,RAD2DEG:En,generateUUID:Dn,clamp:z,euclideanModulo:On,mapLinear:kn,inverseLerp:An,lerp:jn,damp:Mn,pingpong:Nn,smoothstep:Pn,smootherstep:Fn,randInt:In,randFloat:Ln,randFloatSpread:Rn,seededRandom:zn,degToRad:Bn,radToDeg:Vn,isPowerOfTwo:Hn,ceilPowerOfTwo:Un,floorPowerOfTwo:Wn,setQuaternionFromProperEuler:Gn,normalize:Jn,denormalize:qn},B=class{static{this.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=z(this.x,e.x,t.x),this.y=z(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=z(this.x,e,t),this.y=z(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(z(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(z(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Xn=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:L(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(z(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},V=class{static{this.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Qn.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Qn.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=z(this.x,e.x,t.x),this.y=z(this.y,e.y,t.y),this.z=z(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=z(this.x,e,t),this.y=z(this.y,e,t),this.z=z(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(z(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Zn.copy(this).projectOnVector(e),this.sub(Zn)}reflect(e){return this.sub(Zn.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(z(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Zn=new V,Qn=new Xn,H=class{static{this.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return yn(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply($n.makeScale(e,t)),this}rotate(e){return yn(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply($n.makeRotation(-e)),this}translate(e,t){return yn(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply($n.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},$n=new H,er=new H().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),tr=new H().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function nr(){let e={enabled:!0,workingColorSpace:on,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n||(this.spaces[t].transfer===`srgb`&&(e.r=rr(e.r),e.g=rr(e.g),e.b=rr(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=ir(e.r),e.g=ir(e.g),e.b=ir(e.b))),e},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?sn:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[n].fromXYZ).multiply(this.spaces[t].toXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[on]:{primaries:t,whitePoint:r,transfer:sn,toXYZ:er,fromXYZ:tr,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:an},outputColorSpaceConfig:{drawingBufferColorSpace:an}},[an]:{primaries:t,whitePoint:r,transfer:cn,toXYZ:er,fromXYZ:tr,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:an}}}),e}var U=nr();function rr(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function ir(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var ar,or=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{ar===void 0&&(ar=mn(`canvas`)),ar.width=e.width,ar.height=e.height;let t=ar.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=ar}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=mn(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=rr(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(rr(t[e]/255)*255):t[e]=rr(t[e]);return{data:t,width:e.width,height:e.height}}return L(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},sr=0,cr=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:sr++}),this.uuid=Dn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width||0,t.height||0,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(lr(r[t].image)):e.push(lr(r[t]))}else e=lr(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function lr(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?or.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(L(`Texture: Unable to serialize Texture.`),{})}var ur=0,dr=new V,fr=class e extends Sn{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=Le,i=Le,a=He,o=We,s=ot,c=Ge,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:ur++}),this.uuid=Dn(),this.name=``,this.source=new cr(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new B(0,0),this.repeat=new B(1,1),this.center=new B(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new H,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(dr).x}get height(){return this.source.getSize(dr).y}get depth(){return this.source.getSize(dr).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){L(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?L(`Texture.setValues(): property '${t}' does not exist.`):r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Ie:e.x-=Math.floor(e.x);break;case Le:e.x=e.x<0?0:1;break;case Re:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case Ie:e.y-=Math.floor(e.y);break;case Le:e.y=e.y<0?0:1;break;case Re:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};fr.DEFAULT_IMAGE=null,fr.DEFAULT_MAPPING=300,fr.DEFAULT_ANISOTROPY=1;var pr=class{static{this.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=z(this.x,e.x,t.x),this.y=z(this.y,e.y,t.y),this.z=z(this.z,e.z,t.z),this.w=z(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=z(this.x,e,t),this.y=z(this.y,e,t),this.z=z(this.z,e,t),this.w=z(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(z(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},mr=class extends Sn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:He,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new pr(0,0,e,t),this.scissorTest=!1,this.viewport=new pr(0,0,e,t),this.textures=[];let r=n.count;for(let i=0;i<r;i++)this.textures[i]=new fr({width:e,height:t,depth:n.depth}),this.textures[i].isRenderTargetTexture=!0,this.textures[i].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:He,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new cr(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},hr=class extends mr{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},gr=class extends fr{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=ze,this.minFilter=ze,this.wrapR=Le,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},_r=class extends fr{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=ze,this.minFilter=ze,this.wrapR=Le,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},vr=class e{static{this.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/yr.setFromMatrixColumn(e,0).length(),i=1/yr.setFromMatrixColumn(e,1).length(),a=1/yr.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(xr,e,Sr)}lookAt(e,t,n){let r=this.elements;return Tr.subVectors(e,t),Tr.lengthSq()===0&&(Tr.z=1),Tr.normalize(),Cr.crossVectors(n,Tr),Cr.lengthSq()===0&&(Math.abs(n.z)===1?Tr.x+=1e-4:Tr.z+=1e-4,Tr.normalize(),Cr.crossVectors(n,Tr)),Cr.normalize(),wr.crossVectors(Tr,Cr),r[0]=Cr.x,r[4]=wr.x,r[8]=Tr.x,r[1]=Cr.y,r[5]=wr.y,r[9]=Tr.y,r[2]=Cr.z,r[6]=wr.z,r[10]=Tr.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],ee=r[14],M=r[3],te=r[7],ne=r[11],re=r[15];return i[0]=a*x+o*T+s*k+c*M,i[4]=a*S+o*E+s*A+c*te,i[8]=a*C+o*D+s*j+c*ne,i[12]=a*w+o*O+s*ee+c*re,i[1]=l*x+u*T+d*k+f*M,i[5]=l*S+u*E+d*A+f*te,i[9]=l*C+u*D+d*j+f*ne,i[13]=l*w+u*O+d*ee+f*re,i[2]=p*x+m*T+h*k+g*M,i[6]=p*S+m*E+h*A+g*te,i[10]=p*C+m*D+h*j+g*ne,i[14]=p*w+m*O+h*ee+g*re,i[3]=_*x+v*T+y*k+b*M,i[7]=_*S+v*E+y*A+b*te,i[11]=_*C+v*D+y*j+b*ne,i[15]=_*w+v*O+y*ee+b*re,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=yr.set(r[0],r[1],r[2]).length(),o=yr.set(r[4],r[5],r[6]).length(),s=yr.set(r[8],r[9],r[10]).length();i<0&&(a=-a),br.copy(this);let c=1/a,l=1/o,u=1/s;return br.elements[0]*=c,br.elements[1]*=c,br.elements[2]*=c,br.elements[4]*=l,br.elements[5]*=l,br.elements[6]*=l,br.elements[8]*=u,br.elements[9]*=u,br.elements[10]*=u,t.setFromRotationMatrix(br),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=dn,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=dn,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},yr=new V,br=new vr,xr=new V(0,0,0),Sr=new V(1,1,1),Cr=new V,wr=new V,Tr=new V,Er=new vr,Dr=new Xn,Or=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(z(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-z(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(z(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-z(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(z(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-z(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:L(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Er.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Er,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Dr.setFromEuler(this),this.setFromQuaternion(Dr,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Or.DEFAULT_ORDER=`XYZ`;var kr=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},Ar=0,jr=new V,Mr=new Xn,Nr=new vr,Pr=new V,Fr=new V,Ir=new V,Lr=new Xn,Rr=new V(1,0,0),zr=new V(0,1,0),Br=new V(0,0,1),Vr={type:`added`},Hr={type:`removed`},Ur={type:`childadded`,child:null},Wr={type:`childremoved`,child:null},Gr=class e extends Sn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ar++}),this.uuid=Dn(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new V,n=new Or,r=new Xn,i=new V(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new vr},normalMatrix:{value:new H}}),this.matrix=new vr,this.matrixWorld=new vr,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new kr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Mr.setFromAxisAngle(e,t),this.quaternion.multiply(Mr),this}rotateOnWorldAxis(e,t){return Mr.setFromAxisAngle(e,t),this.quaternion.premultiply(Mr),this}rotateX(e){return this.rotateOnAxis(Rr,e)}rotateY(e){return this.rotateOnAxis(zr,e)}rotateZ(e){return this.rotateOnAxis(Br,e)}translateOnAxis(e,t){return jr.copy(e).applyQuaternion(this.quaternion),this.position.add(jr.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Rr,e)}translateY(e){return this.translateOnAxis(zr,e)}translateZ(e){return this.translateOnAxis(Br,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Nr.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Pr.copy(e):Pr.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),Fr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Nr.lookAt(Fr,Pr,this.up):Nr.lookAt(Pr,Fr,this.up),this.quaternion.setFromRotationMatrix(Nr),r&&(Nr.extractRotation(r.matrixWorld),Mr.setFromRotationMatrix(Nr),this.quaternion.premultiply(Mr.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(R(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Vr),Ur.child=e,this.dispatchEvent(Ur),Ur.child=null):R(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Hr),Wr.child=e,this.dispatchEvent(Wr),Wr.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Nr.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Nr.multiply(e.parent.matrixWorld)),e.applyMatrix4(Nr),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Vr),Ur.child=e,this.dispatchEvent(Ur),Ur.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fr,e,Ir),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fr,Lr,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};Gr.DEFAULT_UP=new V(0,1,0),Gr.DEFAULT_MATRIX_AUTO_UPDATE=!0,Gr.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Kr=class extends Gr{constructor(){super(),this.isGroup=!0,this.type=`Group`}},qr={type:`move`},Jr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Kr,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Kr,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new V,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new V),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Kr,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new V,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new V,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.quaternion,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.quaternion,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(qr)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Kr;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Yr={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Xr={h:0,s:0,l:0},Zr={h:0,s:0,l:0};function Qr(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var W=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=an){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,U.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=U.workingColorSpace){return this.r=e,this.g=t,this.b=n,U.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=U.workingColorSpace){if(e=On(e,1),t=z(t,0,1),n=z(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=Qr(i,r,e+1/3),this.g=Qr(i,r,e),this.b=Qr(i,r,e-1/3)}return U.colorSpaceToWorking(this,r),this}setStyle(e,t=an){function n(t){t!==void 0&&parseFloat(t)<1&&L(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseFloat(i[1]))/100,Math.min(100,parseFloat(i[2]))/100,Math.min(100,parseFloat(i[3]))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:L(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);L(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=an){let n=Yr[e.toLowerCase()];return n===void 0?L(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=rr(e.r),this.g=rr(e.g),this.b=rr(e.b),this}copyLinearToSRGB(e){return this.r=ir(e.r),this.g=ir(e.g),this.b=ir(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=an){return U.workingToColorSpace($r.copy(this),e),Math.round(z($r.r*255,0,255))*65536+Math.round(z($r.g*255,0,255))*256+Math.round(z($r.b*255,0,255))}getHexString(e=an){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=U.workingColorSpace){U.workingToColorSpace($r.copy(this),t);let n=$r.r,r=$r.g,i=$r.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=U.workingColorSpace){return U.workingToColorSpace($r.copy(this),t),e.r=$r.r,e.g=$r.g,e.b=$r.b,e}getStyle(e=an){U.workingToColorSpace($r.copy(this),e);let t=$r.r,n=$r.g,r=$r.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(Xr),this.setHSL(Xr.h+e,Xr.s+t,Xr.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Xr),e.getHSL(Zr);let n=jn(Xr.h,Zr.h,t),r=jn(Xr.s,Zr.s,t),i=jn(Xr.l,Zr.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},$r=new W;W.NAMES=Yr;var ei=class e{constructor(e,t=1,n=1e3){this.isFog=!0,this.name=``,this.color=new W(e),this.near=t,this.far=n}clone(){return new e(this.color,this.near,this.far)}toJSON(){return{type:`Fog`,name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},ti=class extends Gr{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Or,this.environmentIntensity=1,this.environmentRotation=new Or,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background===null?null:e.background.clone(),this.environment=e.environment===null?null:e.environment.clone(),this.fog=e.fog===null?null:e.fog.clone(),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial===null?null:e.overrideMaterial.clone(),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},ni=new V,ri=new V,ii=new V,ai=new V,oi=new V,si=new V,ci=new V,li=new V,ui=new V,di=new V,fi=new pr,pi=new pr,mi=new pr,hi=class e{constructor(e=new V,t=new V,n=new V){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),ni.subVectors(e,t),r.cross(ni);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){ni.subVectors(r,t),ri.subVectors(n,t),ii.subVectors(e,t);let a=ni.dot(ni),o=ni.dot(ri),s=ni.dot(ii),c=ri.dot(ri),l=ri.dot(ii),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,ai)!==null&&ai.x>=0&&ai.y>=0&&ai.x+ai.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,ai)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,ai.x),s.addScaledVector(a,ai.y),s.addScaledVector(o,ai.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return fi.setScalar(0),pi.setScalar(0),mi.setScalar(0),fi.fromBufferAttribute(e,t),pi.fromBufferAttribute(e,n),mi.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(fi,i.x),a.addScaledVector(pi,i.y),a.addScaledVector(mi,i.z),a}static isFrontFacing(e,t,n,r){return ni.subVectors(n,t),ri.subVectors(e,t),ni.cross(ri).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return ni.subVectors(this.c,this.b),ri.subVectors(this.a,this.b),ni.cross(ri).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;oi.subVectors(r,n),si.subVectors(i,n),li.subVectors(e,n);let s=oi.dot(li),c=si.dot(li);if(s<=0&&c<=0)return t.copy(n);ui.subVectors(e,r);let l=oi.dot(ui),u=si.dot(ui);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0&&s-l>0)return a=s/(s-l),t.copy(n).addScaledVector(oi,a);di.subVectors(e,i);let f=oi.dot(di),p=si.dot(di);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(si,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return ci.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(ci,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(oi,a).addScaledVector(si,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},gi=class{constructor(e=new V(1/0,1/0,1/0),t=new V(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(vi.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(vi.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=vi.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,vi):vi.fromBufferAttribute(r,t),vi.applyMatrix4(e.matrixWorld),this.expandByPoint(vi);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),yi.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),yi.copy(e.boundingBox)),yi.applyMatrix4(e.matrixWorld),this.union(yi)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,vi),vi.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ei),Di.subVectors(this.max,Ei),bi.subVectors(e.a,Ei),xi.subVectors(e.b,Ei),Si.subVectors(e.c,Ei),Ci.subVectors(xi,bi),wi.subVectors(Si,xi),Ti.subVectors(bi,Si);let t=[0,-Ci.z,Ci.y,0,-wi.z,wi.y,0,-Ti.z,Ti.y,Ci.z,0,-Ci.x,wi.z,0,-wi.x,Ti.z,0,-Ti.x,-Ci.y,Ci.x,0,-wi.y,wi.x,0,-Ti.y,Ti.x,0];return!Ai(t,bi,xi,Si,Di)||(t=[1,0,0,0,1,0,0,0,1],!Ai(t,bi,xi,Si,Di))?!1:(Oi.crossVectors(Ci,wi),t=[Oi.x,Oi.y,Oi.z],Ai(t,bi,xi,Si,Di))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,vi).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(vi).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(_i[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),_i[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),_i[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),_i[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),_i[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),_i[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),_i[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),_i[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(_i)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},_i=[new V,new V,new V,new V,new V,new V,new V,new V],vi=new V,yi=new gi,bi=new V,xi=new V,Si=new V,Ci=new V,wi=new V,Ti=new V,Ei=new V,Di=new V,Oi=new V,ki=new V;function Ai(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){ki.fromArray(e,a);let o=i.x*Math.abs(ki.x)+i.y*Math.abs(ki.y)+i.z*Math.abs(ki.z),s=t.dot(ki),c=n.dot(ki),l=r.dot(ki);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var ji=new V,Mi=new B,Ni=0,Pi=class extends Sn{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Ni++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=un,this.updateRanges=[],this.gpuType=Ze,this.version=0,this._normalizationScale=e===void 0?void 0:Kn(e)}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Mi.fromBufferAttribute(this,t),Mi.applyMatrix3(e),this.setXY(t,Mi.x,Mi.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ji.fromBufferAttribute(this,t),ji.applyMatrix3(e),this.setXYZ(t,ji.x,ji.y,ji.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ji.fromBufferAttribute(this,t),ji.applyMatrix4(e),this.setXYZ(t,ji.x,ji.y,ji.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ji.fromBufferAttribute(this,t),ji.applyNormalMatrix(e),this.setXYZ(t,ji.x,ji.y,ji.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ji.fromBufferAttribute(this,t),ji.transformDirection(e),this.setXYZ(t,ji.x,ji.y,ji.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),i=this._normalize(i)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}_denormalize(e){let t=this._normalizationScale;return t===void 0?qn(e,this.array):Math.max(e/t,-1)}_normalize(e){let t=this._normalizationScale;return t===void 0?Jn(e,this.array):Math.round(e*t)}},Fi=class extends Pi{constructor(e,t,n){super(new Uint16Array(e),t,n)}},Ii=class extends Pi{constructor(e,t,n){super(new Uint32Array(e),t,n)}},Li=class extends Pi{constructor(e,t,n){super(new Float32Array(e),t,n)}},Ri=new gi,zi=new V,Bi=new V,Vi=class{constructor(e=new V,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?Ri.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;zi.subVectors(e,this.center);let t=zi.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(zi,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Bi.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(zi.copy(e.center).add(Bi)),this.expandByPoint(zi.copy(e.center).sub(Bi))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Hi=0,Ui=new vr,Wi=new Gr,Gi=new V,Ki=new gi,qi=new gi,Ji=new V,Yi=class e extends Sn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Hi++}),this.uuid=Dn(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(fn(e)?Ii:Fi)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new H().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Ui.makeRotationFromQuaternion(e),this.applyMatrix4(Ui),this}rotateX(e){return Ui.makeRotationX(e),this.applyMatrix4(Ui),this}rotateY(e){return Ui.makeRotationY(e),this.applyMatrix4(Ui),this}rotateZ(e){return Ui.makeRotationZ(e),this.applyMatrix4(Ui),this}translate(e,t,n){return Ui.makeTranslation(e,t,n),this.applyMatrix4(Ui),this}scale(e,t,n){return Ui.makeScale(e,t,n),this.applyMatrix4(Ui),this}lookAt(e){return Wi.lookAt(e),Wi.updateMatrix(),this.applyMatrix4(Wi.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Gi).negate(),this.translate(Gi.x,Gi.y,Gi.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new Li(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&L(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new gi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)R(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new V(-1/0,-1/0,-1/0),new V(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Ki.setFromBufferAttribute(n),this.morphTargetsRelative?(Ji.addVectors(this.boundingBox.min,Ki.min),this.boundingBox.expandByPoint(Ji),Ji.addVectors(this.boundingBox.max,Ki.max),this.boundingBox.expandByPoint(Ji)):(this.boundingBox.expandByPoint(Ki.min),this.boundingBox.expandByPoint(Ki.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&R(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Vi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)R(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new V,1/0);else if(e){let n=this.boundingSphere.center;if(Ki.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];qi.setFromBufferAttribute(n),this.morphTargetsRelative?(Ji.addVectors(Ki.min,qi.min),Ki.expandByPoint(Ji),Ji.addVectors(Ki.max,qi.max),Ki.expandByPoint(Ji)):(Ki.expandByPoint(qi.min),Ki.expandByPoint(qi.max))}Ki.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)Ji.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(Ji));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)Ji.fromBufferAttribute(a,t),o&&(Gi.fromBufferAttribute(e,t),Ji.add(Gi)),r=Math.max(r,n.distanceToSquared(Ji))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&R(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){R(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new Pi(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[],c=new Uint8Array(n.count);for(let e=0;e<n.count;e++)o[e]=new V,s[e]=new V;let l=new V,u=new V,d=new V,f=new B,p=new B,m=new B,h=new V,g=new V;function _(e,t,r){c[e]=c[t]=c[r]=1,l.fromBufferAttribute(n,e),u.fromBufferAttribute(n,t),d.fromBufferAttribute(n,r),f.fromBufferAttribute(i,e),p.fromBufferAttribute(i,t),m.fromBufferAttribute(i,r),u.sub(l),d.sub(l),p.sub(f),m.sub(f);let a=1/(p.x*m.y-m.x*p.y);isFinite(a)&&(h.copy(u).multiplyScalar(m.y).addScaledVector(d,-p.y).multiplyScalar(a),g.copy(d).multiplyScalar(p.x).addScaledVector(u,-m.x).multiplyScalar(a),o[e].add(h),o[t].add(h),o[r].add(h),s[e].add(g),s[t].add(g),s[r].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:e.count}]);for(let t=0,n=v.length;t<n;++t){let n=v[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)_(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let y=new V,b=new V,x=new V,S=new V;function C(e){x.fromBufferAttribute(r,e),S.copy(x);let t=o[e];y.copy(t),y.sub(x.multiplyScalar(x.dot(t))).normalize(),b.crossVectors(S,t);let n=b.dot(s[e])<0?-1:1;a.setXYZW(e,y.x,y.y,y.z,n)}for(let e=0,t=n.count;e<t;++e)c[e]&&C(e);this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new Pi(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new V,i=new V,a=new V,o=new V,s=new V,c=new V,l=new V,u=new V;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Ji.fromBufferAttribute(e,t),Ji.normalize(),e.setXYZ(t,Ji.x,Ji.y,Ji.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new Pi(a,r,i)}if(this.index===null)return L(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},Xi=new V,Zi=new V,Qi=new H,$i=class{constructor(e=new V(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=Xi.subVectors(n,t).cross(Zi.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(Xi),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Qi.getNormalMatrix(e),r=this.coplanarPoint(Xi).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},ea=0,ta=class extends Sn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:ea++}),this.uuid=Dn(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new W(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ln,this.stencilZFail=ln,this.stencilZPass=ln,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){L(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?L(`Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new W().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new $i().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new B().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new B().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},na=new V,ra=new V,ia=new V,aa=new V,oa=class{constructor(e=new V,t=new V(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,na)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=na.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(na.copy(this.origin).addScaledVector(this.direction,t),na.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){ra.copy(e).add(t).multiplyScalar(.5),ia.copy(t).sub(e).normalize(),aa.copy(this.origin).sub(ra);let i=e.distanceTo(t)*.5,a=-this.direction.dot(ia),o=aa.dot(this.direction),s=-aa.dot(ia),c=aa.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(ra).addScaledVector(ia,d),f}intersectSphere(e,t){if(e.radius<0)return null;na.subVectors(e.center,this.origin);let n=na.dot(this.direction),r=na.dot(na)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,na)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,ee,M;if(y>=b&&y>=x?(w=s,D=u,A=p,M=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,ee=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,ee=_)):b>=x?(w=c,D=d,A=m,M=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,ee=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,ee=v)):(w=l,D=f,A=h,M=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,ee=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,ee=g)),w===0)return null;let te=S/w,ne=C/w,re=1/w,ie=T-te*D,ae=E-ne*D,oe=O-te*A,se=k-ne*A,ce=j-te*M,le=ee-ne*M,ue=ce*se-le*oe,de=ie*le-ae*ce,fe=oe*ae-se*ie;if(r){if(ue<0||de<0||fe<0)return null}else if((ue<0||de<0||fe<0)&&(ue>0||de>0||fe>0))return null;let pe=ue+de+fe;if(pe===0)return null;let me=re*(ue*D+de*A+fe*M);return(pe>0?me<0:me>0)?null:this.at(me/pe,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},sa=class extends ta{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new W(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Or,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},ca=new vr,la=new oa,ua=new Vi,da=new V,fa=new V,pa=new V,ma=new V,ha=new V,ga=new V,_a=new V,va=new V,ya=class extends Gr{constructor(e=new Yi,t=new sa){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){ga.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(ha.fromBufferAttribute(s,e),a?ga.addScaledVector(ha,r):ga.addScaledVector(ha.sub(t),r))}t.add(ga)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ua.copy(n.boundingSphere),ua.applyMatrix4(i),la.copy(e.ray).recast(e.near),ua.containsPoint(la.origin)===!1&&(la.intersectSphere(ua,da)===null||la.origin.distanceToSquared(da)>(e.far-e.near)**2)||(ca.copy(i).invert(),la.copy(e.ray).applyMatrix4(ca),(n.boundingBox===null||la.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,la)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=xa(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=xa(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=xa(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=xa(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function ba(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;va.copy(s),va.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(va);return l<n.near||l>n.far?null:{distance:l,point:va.clone(),object:e}}function xa(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,fa),e.getVertexPosition(c,pa),e.getVertexPosition(l,ma);let u=ba(e,t,n,r,fa,pa,ma,_a);if(u){let e=new V;hi.getBarycoord(_a,fa,pa,ma,e),i&&(u.uv=hi.getInterpolatedAttribute(i,s,c,l,e,new B)),a&&(u.uv1=hi.getInterpolatedAttribute(a,s,c,l,e,new B)),o&&(u.normal=hi.getInterpolatedAttribute(o,s,c,l,e,new V),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new V,materialIndex:0};hi.getNormal(fa,pa,ma,t.normal),u.face=t,u.barycoord=e}return u}var Sa=class extends fr{constructor(e=null,t=1,n=1,r,i,a,o,s,c=ze,l=ze,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ca=class extends Pi{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},wa=new vr,Ta=new vr,Ea=[],Da=new gi,Oa=new vr,ka=new ya,Aa=new Vi,ja=class extends ya{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Ca(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,Oa)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new gi),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,wa),Da.copy(e.boundingBox).applyMatrix4(wa),this.boundingBox.union(Da)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Vi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,wa),Aa.copy(e.boundingSphere).applyMatrix4(wa),this.boundingSphere.union(Aa)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),this.morphTexture=e.morphTexture===null?null:e.morphTexture.clone(),this.instanceColor=e.instanceColor===null?null:e.instanceColor.clone(),this.count=e.count,this.boundingBox=e.boundingBox===null?null:e.boundingBox.clone(),this.boundingSphere=e.boundingSphere===null?null:e.boundingSphere.clone(),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(ka.geometry=this.geometry,ka.material=this.material,ka.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Aa.copy(this.boundingSphere),Aa.applyMatrix4(n),e.ray.intersectsSphere(Aa)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,wa),Ta.multiplyMatrices(n,wa),ka.matrixWorld=Ta,ka.raycast(e,Ea);for(let e=0,n=Ea.length;e<n;e++){let n=Ea[e];n.instanceId=i,n.object=this,t.push(n)}Ea.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new Ca(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new Sa(new Float32Array(r*this.count),r,this.count,lt,Ze));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Ma=new Vi,Na=new B(.5,.5),Pa=new V,Fa=class{constructor(e=new $i,t=new $i,n=new $i,r=new $i,i=new $i,a=new $i){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=dn,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ma.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ma.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ma)}intersectsSprite(e){return Ma.center.set(0,0,0),Ma.radius=.7071067811865476+Na.distanceTo(e.center),Ma.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ma)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(Pa.x=r.normal.x>0?e.max.x:e.min.x,Pa.y=r.normal.y>0?e.max.y:e.min.y,Pa.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Pa)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Ia=new vr,La=class e{constructor(){this.coordinateSystem=dn,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,n=this._frustums;for(let e=0;e<t.length;e++){let r=t[e];Ia.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[e]===void 0&&(n[e]=new Fa),n[e].setFromProjectionMatrix(Ia,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,n=e._frustums;for(let r=0;r<e._count;r++)t[r]===void 0&&(t[r]=new Fa),t[r].copy(n[r]);return this._count=e._count,this}clone(){return new e().copy(this)}},Ra=class extends ta{constructor(e){super(),this.isLineBasicMaterial=!0,this.type=`LineBasicMaterial`,this.color=new W(16777215),this.map=null,this.linewidth=1,this.linecap=`round`,this.linejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},za=new V,Ba=new V,Va=new vr,Ha=new oa,Ua=new Vi,Wa=new V,Ga=new V,Ka=class extends Gr{constructor(e=new Yi,t=new Ra){super(),this.isLine=!0,this.type=`Line`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let e=1,r=t.count;e<r;e++)za.fromBufferAttribute(t,e-1),Ba.fromBufferAttribute(t,e),n[e]=n[e-1],n[e]+=za.distanceTo(Ba);e.setAttribute(`lineDistance`,new Li(n,1))}else L(`Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ua.copy(n.boundingSphere),Ua.applyMatrix4(r),Ua.radius+=i,e.ray.intersectsSphere(Ua)===!1)return;Va.copy(r).invert(),Ha.copy(e.ray).applyMatrix4(Va);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=this.isLineSegments?2:1,l=n.index,u=n.attributes.position;if(l!==null){let n=Math.max(0,a.start),r=Math.min(l.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=l.getX(i),r=l.getX(i+1),a=qa(this,e,Ha,s,n,r,i);a&&t.push(a)}if(this.isLineLoop){let i=l.getX(r-1),a=l.getX(n),o=qa(this,e,Ha,s,i,a,r-1);o&&t.push(o)}}else{let n=Math.max(0,a.start),r=Math.min(u.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=qa(this,e,Ha,s,i,i+1,i);n&&t.push(n)}if(this.isLineLoop){let i=qa(this,e,Ha,s,r-1,n,r-1);i&&t.push(i)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function qa(e,t,n,r,i,a,o){let s=e.geometry.attributes.position;if(za.fromBufferAttribute(s,i),Ba.fromBufferAttribute(s,a),n.distanceSqToSegment(za,Ba,Wa,Ga)>r)return;Wa.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(Wa);if(!(c<t.near||c>t.far))return{distance:c,point:Ga.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var Ja=new V,Ya=new V,Xa=class extends Ka{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type=`LineSegments`}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let e=0,r=t.count;e<r;e+=2)Ja.fromBufferAttribute(t,e),Ya.fromBufferAttribute(t,e+1),n[e]=e===0?0:n[e-1],n[e+1]=n[e]+Ja.distanceTo(Ya);e.setAttribute(`lineDistance`,new Li(n,1))}else L(`LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}},Za=class extends ta{constructor(e){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new W(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Qa=new vr,$a=new oa,eo=new Vi,to=new V,no=class extends Gr{constructor(e=new Yi,t=new Za){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),eo.copy(n.boundingSphere),eo.applyMatrix4(r),eo.radius+=i,e.ray.intersectsSphere(eo)===!1)return;Qa.copy(r).invert(),$a.copy(e.ray).applyMatrix4(Qa);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);to.fromBufferAttribute(l,n),ro(to,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)to.fromBufferAttribute(l,a),ro(to,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function ro(e,t,n,r,i,a,o){let s=$a.distanceSqToPoint(e);if(s<n){let n=new V;$a.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var io=class extends fr{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},ao=class extends fr{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},oo=class extends fr{constructor(e,t,n=Xe,r,i,a,o=ze,s=ze,c,l=st,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new cr(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},so=class extends oo{constructor(e,t=Xe,n=301,r,i,a=ze,o=ze,s,c=st){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},co=class extends fr{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},lo=class e extends Yi{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new Li(c,3)),this.setAttribute(`normal`,new Li(l,3)),this.setAttribute(`uv`,new Li(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new V;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},uo=class e extends Yi{constructor(e=1,t=32,n=0,r=Math.PI*2){super(),this.type=`CircleGeometry`,this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:r},t=Math.max(3,t);let i=[],a=[],o=[],s=[],c=new V,l=new B;a.push(0,0,0),o.push(0,0,1),s.push(.5,.5);for(let i=0,u=3;i<=t;i++,u+=3){let d=n+i/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),l.x=(a[u]/e+1)/2,l.y=(a[u+1]/e+1)/2,s.push(l.x,l.y)}for(let e=1;e<=t;e++)i.push(e,e+1,0);this.setIndex(i),this.setAttribute(`position`,new Li(a,3)),this.setAttribute(`normal`,new Li(o,3)),this.setAttribute(`uv`,new Li(s,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.segments,t.thetaStart,t.thetaLength)}},fo=class e extends Yi{constructor(e=[],t=[],n=1,r=0){super(),this.type=`PolyhedronGeometry`,this.parameters={vertices:e,indices:t,radius:n,detail:r};let i=[],a=[];o(r),c(n),l(),this.setAttribute(`position`,new Li(i,3)),this.setAttribute(`normal`,new Li(i.slice(),3)),this.setAttribute(`uv`,new Li(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(e){let n=new V,r=new V,i=new V;for(let a=0;a<t.length;a+=3)f(t[a+0],n),f(t[a+1],r),f(t[a+2],i),s(n,r,i,e)}function s(e,t,n,r){let i=r+1,a=[];for(let r=0;r<=i;r++){a[r]=[];let o=e.clone().lerp(n,r/i),s=t.clone().lerp(n,r/i),c=i-r;for(let e=0;e<=c;e++)e===0&&r===i?a[r][e]=o:a[r][e]=o.clone().lerp(s,e/c)}for(let e=0;e<i;e++)for(let t=0;t<2*(i-e)-1;t++){let n=Math.floor(t/2);t%2==0?(d(a[e][n+1]),d(a[e+1][n]),d(a[e][n])):(d(a[e][n+1]),d(a[e+1][n+1]),d(a[e+1][n]))}}function c(e){let t=new V;for(let n=0;n<i.length;n+=3)t.x=i[n+0],t.y=i[n+1],t.z=i[n+2],t.normalize().multiplyScalar(e),i[n+0]=t.x,i[n+1]=t.y,i[n+2]=t.z}function l(){let e=new V;for(let t=0;t<i.length;t+=3){e.x=i[t+0],e.y=i[t+1],e.z=i[t+2];let n=h(e)/2/Math.PI+.5,r=g(e)/Math.PI+.5;a.push(n,1-r)}p(),u()}function u(){for(let e=0;e<a.length;e+=6){let t=a[e+0],n=a[e+2],r=a[e+4];Math.max(t,n,r)>.9&&Math.min(t,n,r)<.1&&(t<.2&&(a[e+0]+=1),n<.2&&(a[e+2]+=1),r<.2&&(a[e+4]+=1))}}function d(e){i.push(e.x,e.y,e.z)}function f(t,n){let r=t*3;n.x=e[r+0],n.y=e[r+1],n.z=e[r+2]}function p(){let e=new V,t=new V,n=new V,r=new V,o=new B,s=new B,c=new B;for(let l=0,u=0;l<i.length;l+=9,u+=6){e.set(i[l+0],i[l+1],i[l+2]),t.set(i[l+3],i[l+4],i[l+5]),n.set(i[l+6],i[l+7],i[l+8]),o.set(a[u+0],a[u+1]),s.set(a[u+2],a[u+3]),c.set(a[u+4],a[u+5]),r.copy(e).add(t).add(n).divideScalar(3);let d=h(r);m(o,u+0,e,d),m(s,u+2,t,d),m(c,u+4,n,d)}}function m(e,t,n,r){r<0&&e.x===1&&(a[t]=e.x-1),n.x===0&&n.z===0&&(a[t]=r/2/Math.PI+.5)}function h(e){return Math.atan2(e.z,-e.x)}function g(e){return Math.atan2(-e.y,Math.sqrt(e.x*e.x+e.z*e.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.vertices,t.indices,t.radius,t.detail)}},po=new V,mo=new V,ho=new V,go=new hi,_o=class extends Yi{constructor(e=null,t=1){if(super(),this.type=`EdgesGeometry`,this.parameters={geometry:e,thresholdAngle:t},e!==null){let n=1e4,r=Math.cos(Tn*t),i=e.getIndex(),a=e.getAttribute(`position`),o=i?i.count:a.count,s=[0,0,0],c=[`a`,`b`,`c`],l=[,,,],u=new Map,d=[];for(let e=0;e<o;e+=3){i?(s[0]=i.getX(e),s[1]=i.getX(e+1),s[2]=i.getX(e+2)):(s[0]=e,s[1]=e+1,s[2]=e+2);let{a:t,b:o,c:f}=go;if(t.fromBufferAttribute(a,s[0]),o.fromBufferAttribute(a,s[1]),f.fromBufferAttribute(a,s[2]),go.getNormal(ho),l[0]=`${Math.round(t.x*n)},${Math.round(t.y*n)},${Math.round(t.z*n)}`,l[1]=`${Math.round(o.x*n)},${Math.round(o.y*n)},${Math.round(o.z*n)}`,l[2]=`${Math.round(f.x*n)},${Math.round(f.y*n)},${Math.round(f.z*n)}`,l[0]!==l[1]&&l[1]!==l[2]&&l[2]!==l[0])for(let e=0;e<3;e++){let t=(e+1)%3,n=l[e],i=l[t],a=go[c[e]],o=go[c[t]],f=`${n}_${i}`,p=`${i}_${n}`,m=u.get(p);m?(ho.dot(m.normal)<=r&&(d.push(a.x,a.y,a.z),d.push(o.x,o.y,o.z)),u.set(p,null)):u.has(f)||u.set(f,{index0:s[e],index1:s[t],normal:ho.clone()})}}for(let e of u.values())if(e){let{index0:t,index1:n}=e;po.fromBufferAttribute(a,t),mo.fromBufferAttribute(a,n),d.push(po.x,po.y,po.z),d.push(mo.x,mo.y,mo.z)}this.setAttribute(`position`,new Li(d,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}},vo=class e extends fo{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,r=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1];super(r,[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],e,t),this.type=`IcosahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},yo=class e extends Yi{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new Li(p,3)),this.setAttribute(`normal`,new Li(m,3)),this.setAttribute(`uv`,new Li(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}};function bo(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(So(i))i.isRenderTargetTexture?(L(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(So(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function xo(e){let t={};for(let n=0;n<e.length;n++){let r=bo(e[n]);for(let e in r)t[e]=r[e]}return t}function So(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Co(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function wo(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:U.workingColorSpace}var To={clone:bo,merge:xo},Eo=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Do=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Oo=class extends ta{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Eo,this.fragmentShader=Do,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=bo(e.uniforms),this.uniformsGroups=Co(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new W().setHex(r.value);break;case`v2`:this.uniforms[n].value=new B().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new V().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new pr().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new H().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new vr().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},ko=class extends Oo{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},Ao=class extends ta{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type=`MeshStandardMaterial`,this.defines={STANDARD:``},this.color=new W(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new W(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new B(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Or,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:``},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},jo=class extends ta{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type=`MeshLambertMaterial`,this.color=new W(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new W(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new B(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Or,this.combine=0,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Mo=class extends ta{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=rn,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},No=class extends ta{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Po(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function Fo(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var Io=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},Lo=class extends Io{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:en,endingEnd:en}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case tn:i=e,o=2*t-n;break;case nn:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case tn:a=e,s=2*n-t;break;case nn:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},Ro=class extends Io{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},zo=class extends Io{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Bo=class extends Io{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=Uo(n,t,g,y,r);i[p]=Vo(x,o,_,b,m)}return i}};function Vo(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function Ho(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function Uo(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=Vo(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=Ho(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var Wo=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=Po(t,this.TimeBufferType),this.values=Po(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Po(e.times,Array),values:Po(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),Fo(e.settings)&&(n.settings={inTangents:Po(e.settings.inTangents,Array),outTangents:Po(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new zo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ro(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Lo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Bo(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Xt:t=this.InterpolantFactoryMethodDiscrete;break;case Zt:t=this.InterpolantFactoryMethodLinear;break;case Qt:t=this.InterpolantFactoryMethodSmooth;break;case $t:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return L(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Xt;case this.InterpolantFactoryMethodLinear:return Zt;case this.InterpolantFactoryMethodSmooth:return Qt;case this.InterpolantFactoryMethodBezier:return $t}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e;Fo(this.settings)&&(Go(this.settings.inTangents,e),Go(this.settings.outTangents,e))}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;Fo(this.settings)&&(Ko(this.settings.inTangents,e),Ko(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(R(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(R(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){R(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){R(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&pn(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){R(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===Qt,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,Fo(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Go(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]+=t}function Ko(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}Wo.prototype.ValueTypeName=``,Wo.prototype.TimeBufferType=Float32Array,Wo.prototype.ValueBufferType=Float32Array,Wo.prototype.DefaultInterpolation=Zt;var qo=class extends Wo{constructor(e,t,n){super(e,t,n)}};qo.prototype.ValueTypeName=`bool`,qo.prototype.ValueBufferType=Array,qo.prototype.DefaultInterpolation=Xt,qo.prototype.InterpolantFactoryMethodLinear=void 0,qo.prototype.InterpolantFactoryMethodSmooth=void 0;var Jo=class extends Wo{constructor(e,t,n,r){super(e,t,n,r)}};Jo.prototype.ValueTypeName=`color`;var Yo=class extends Wo{constructor(e,t,n,r){super(e,t,n,r)}};Yo.prototype.ValueTypeName=`number`;var Xo=class extends Io{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)Xn.slerpFlat(i,0,a,c-o,a,c,s);return i}},Zo=class extends Wo{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new Xo(this.times,this.values,this.getValueSize(),e)}};Zo.prototype.ValueTypeName=`quaternion`,Zo.prototype.InterpolantFactoryMethodSmooth=void 0;var Qo=class extends Wo{constructor(e,t,n){super(e,t,n)}};Qo.prototype.ValueTypeName=`string`,Qo.prototype.ValueBufferType=Array,Qo.prototype.DefaultInterpolation=Xt,Qo.prototype.InterpolantFactoryMethodLinear=void 0,Qo.prototype.InterpolantFactoryMethodSmooth=void 0;var $o=class extends Wo{constructor(e,t,n,r){super(e,t,n,r)}};$o.prototype.ValueTypeName=`vector`;var es=class extends Gr{static registerNode(e){this.prototype._lightNode=e}constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new W(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},ts=class extends es{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(Gr.DEFAULT_UP),this.updateMatrix(),this.groundColor=new W(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},ns=new vr,rs=new V,is=new V,as=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new B(512,512),this.mapType=Ge,this.map=null,this.mapPass=null,this.matrix=new vr,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Fa,this._frameExtents=new B(1,1),this._viewportCount=1,this._viewports=[new pr(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;rs.setFromMatrixPosition(e.matrixWorld),t.position.copy(rs),is.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(is),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){ns.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(ns,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(ns)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.mapType=e.mapType,this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.mapType=this.mapType,e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},os=new V,ss=new Xn,cs=new V,ls=class extends Gr{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new vr,this.projectionMatrix=new vr,this.projectionMatrixInverse=new vr,this.coordinateSystem=dn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(os,ss,cs),cs.x===1&&cs.y===1&&cs.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(os,ss,cs.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(os,ss,cs),cs.x===1&&cs.y===1&&cs.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(os,ss,cs.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},us=new V,ds=new B,fs=new B,ps=class extends ls{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=En*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Tn*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return En*2*Math.atan(Math.tan(Tn*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){us.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(us.x,us.y).multiplyScalar(-e/us.z),us.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(us.x,us.y).multiplyScalar(-e/us.z)}getViewSize(e,t){return this.getViewBounds(e,ds,fs),t.subVectors(fs,ds)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Tn*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},ms=class extends ls{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},hs=class extends as{constructor(){super(new ms(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},gs=class extends es{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(Gr.DEFAULT_UP),this.updateMatrix(),this.target=new Gr,this.shadow=new hs}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},_s=-90,vs=1,ys=class extends Gr{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new ps(_s,vs,e,t);r.layers=this.layers,this.add(r);let i=new ps(_s,vs,e,t);i.layers=this.layers,this.add(i);let a=new ps(_s,vs,e,t);a.layers=this.layers,this.add(a);let o=new ps(_s,vs,e,t);o.layers=this.layers,this.add(o);let s=new ps(_s,vs,e,t);s.layers=this.layers,this.add(s);let c=new ps(_s,vs,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.mipmapsAutoUpdate=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},bs=class extends ps{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}},xs=`\\[\\]\\.:\\/`,Ss=RegExp(`[\\[\\]\\.:\\/]`,`g`),Cs=`[^\\[\\]\\.:\\/]`,ws=`[^`+xs.replace(`\\.`,``)+`]`,Ts=`((?:WC+[\\/:])*)`.replace(`WC`,Cs),Es=`(WCOD+)?`.replace(`WCOD`,ws),Ds=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,Cs),Os=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,Cs),ks=RegExp(`^`+Ts+Es+Ds+Os+`$`),As=[`material`,`materials`,`bones`,`map`],js=class{constructor(e,t,n){let r=n||Ms.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Ms=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(Ss,``)}static parseTrackName(e){let t=ks.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);As.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){L(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){R(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){R(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){R(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){R(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){R(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){R(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){R(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;R(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){R(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){R(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ms.Composite=js,Ms.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},Ms.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},Ms.prototype.GetterByBindingType=[Ms.prototype._getValue_direct,Ms.prototype._getValue_array,Ms.prototype._getValue_arrayElement,Ms.prototype._getValue_toArray],Ms.prototype.SetterByBindingTypeAndVersioning=[[Ms.prototype._setValue_direct,Ms.prototype._setValue_direct_setNeedsUpdate,Ms.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ms.prototype._setValue_array,Ms.prototype._setValue_array_setNeedsUpdate,Ms.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ms.prototype._setValue_arrayElement,Ms.prototype._setValue_arrayElement_setNeedsUpdate,Ms.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ms.prototype._setValue_fromArray,Ms.prototype._setValue_fromArray_setNeedsUpdate,Ms.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Ns=new vr,Ps=class{constructor(e,t,n=0,r=1/0){this.ray=new oa(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new kr,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):R(`Raycaster: Unsupported camera type: `+t.type)}setFromXRController(e){return Ns.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Ns),this}intersectObject(e,t=!0,n=[]){return Is(e,this,n,t),n.sort(Fs),n}intersectObjects(e,t=!0,n=[]){for(let r=0,i=e.length;r<i;r++)Is(e[r],this,n,t);return n.sort(Fs),n}};function Fs(e,t){return e.distance-t.distance}function Is(e,t,n,r){let i=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(i=!1),i===!0&&r===!0){let r=e.children;for(let e=0,i=r.length;e<i;e++)Is(r[e],t,n,!0)}}var Ls=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1,L(`Clock: This module has been deprecated. Please use THREE.Timer instead.`)}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=performance.now();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}},Rs=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){let e=1e-6;return this.phi=z(this.phi,e,Math.PI-e),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(z(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};(class{static{this.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}});var zs=class extends Xa{constructor(e=10,t=10,n=4473924,r=8947848){n=new W(n),r=new W(r);let i=t/2,a=e/t,o=e/2,s=[],c=[];for(let e=0,l=0,u=-o;e<=t;e++,u+=a){s.push(-o,0,u,o,0,u),s.push(u,0,-o,u,0,o);let t=e===i?n:r;t.toArray(c,l),l+=3,t.toArray(c,l),l+=3,t.toArray(c,l),l+=3,t.toArray(c,l),l+=3}let l=new Yi;l.setAttribute(`position`,new Li(s,3)),l.setAttribute(`color`,new Li(c,3));let u=new Ra({vertexColors:!0,toneMapped:!1});super(l,u),this.type=`GridHelper`}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}},Bs=class extends Sn{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function Vs(e,t,n,r){let i=Hs(r);switch(n){case it:return e*t;case lt:return e*t/i.components*i.byteLength;case ut:return e*t/i.components*i.byteLength;case dt:return e*t*2/i.components*i.byteLength;case ft:return e*t*2/i.components*i.byteLength;case at:return e*t*3/i.components*i.byteLength;case ot:return e*t*4/i.components*i.byteLength;case pt:return e*t*4/i.components*i.byteLength;case mt:case ht:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case gt:case _t:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case yt:case xt:return Math.max(e,16)*Math.max(t,8)/4;case vt:case bt:return Math.max(e,8)*Math.max(t,8)/2;case St:case Ct:case Tt:case Et:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case wt:case Dt:case Ot:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case kt:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case At:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case jt:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case Mt:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case Nt:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case Pt:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Ft:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case It:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case Lt:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case Rt:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case zt:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Bt:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Vt:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Ht:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Ut:case Wt:case Gt:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Kt:case qt:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Jt:case Yt:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function Hs(e){switch(e){case Ge:case Ke:return{byteLength:1,components:1};case Je:case qe:case Qe:return{byteLength:2,components:1};case $e:case et:return{byteLength:2,components:4};case Xe:case Ye:case Ze:return{byteLength:4,components:1};case nt:case rt:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`187`}})),typeof window<`u`&&(window.__THREE__?L(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`187`);function Us(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function Ws(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var G={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},K={common:{diffuse:{value:new W(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new H},alphaMap:{value:null},alphaMapTransform:{value:new H},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new H}},envmap:{envMap:{value:null},envMapRotation:{value:new H},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new H}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new H}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new H},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new H},normalScale:{value:new B(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new H},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new H}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new H}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new H}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new W(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new W(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new H},alphaTest:{value:0},uvTransform:{value:new H}},sprite:{diffuse:{value:new W(16777215)},opacity:{value:1},center:{value:new B(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new H},alphaMap:{value:null},alphaMapTransform:{value:new H},alphaTest:{value:0}}},Gs={basic:{uniforms:xo([K.common,K.specularmap,K.envmap,K.aomap,K.lightmap,K.fog]),vertexShader:G.meshbasic_vert,fragmentShader:G.meshbasic_frag},lambert:{uniforms:xo([K.common,K.specularmap,K.envmap,K.aomap,K.lightmap,K.emissivemap,K.bumpmap,K.normalmap,K.displacementmap,K.fog,K.lights,{emissive:{value:new W(0)},envMapIntensity:{value:1}}]),vertexShader:G.meshlambert_vert,fragmentShader:G.meshlambert_frag},phong:{uniforms:xo([K.common,K.specularmap,K.envmap,K.aomap,K.lightmap,K.emissivemap,K.bumpmap,K.normalmap,K.displacementmap,K.fog,K.lights,{emissive:{value:new W(0)},specular:{value:new W(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:G.meshphong_vert,fragmentShader:G.meshphong_frag},standard:{uniforms:xo([K.common,K.envmap,K.aomap,K.lightmap,K.emissivemap,K.bumpmap,K.normalmap,K.displacementmap,K.roughnessmap,K.metalnessmap,K.fog,K.lights,{emissive:{value:new W(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:G.meshphysical_vert,fragmentShader:G.meshphysical_frag},toon:{uniforms:xo([K.common,K.aomap,K.lightmap,K.emissivemap,K.bumpmap,K.normalmap,K.displacementmap,K.gradientmap,K.fog,K.lights,{emissive:{value:new W(0)}}]),vertexShader:G.meshtoon_vert,fragmentShader:G.meshtoon_frag},matcap:{uniforms:xo([K.common,K.bumpmap,K.normalmap,K.displacementmap,K.fog,{matcap:{value:null}}]),vertexShader:G.meshmatcap_vert,fragmentShader:G.meshmatcap_frag},points:{uniforms:xo([K.points,K.fog]),vertexShader:G.points_vert,fragmentShader:G.points_frag},dashed:{uniforms:xo([K.common,K.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:G.linedashed_vert,fragmentShader:G.linedashed_frag},depth:{uniforms:xo([K.common,K.displacementmap]),vertexShader:G.depth_vert,fragmentShader:G.depth_frag},normal:{uniforms:xo([K.common,K.bumpmap,K.normalmap,K.displacementmap,{opacity:{value:1}}]),vertexShader:G.meshnormal_vert,fragmentShader:G.meshnormal_frag},sprite:{uniforms:xo([K.sprite,K.fog]),vertexShader:G.sprite_vert,fragmentShader:G.sprite_frag},background:{uniforms:{uvTransform:{value:new H},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:G.background_vert,fragmentShader:G.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new H}},vertexShader:G.backgroundCube_vert,fragmentShader:G.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:G.cube_vert,fragmentShader:G.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:G.equirect_vert,fragmentShader:G.equirect_frag},distance:{uniforms:xo([K.common,K.displacementmap,{referencePosition:{value:new V},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:G.distance_vert,fragmentShader:G.distance_frag},shadow:{uniforms:xo([K.lights,K.fog,{color:{value:new W(0)},opacity:{value:1}}]),vertexShader:G.shadow_vert,fragmentShader:G.shadow_frag}};Gs.physical={uniforms:xo([Gs.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new H},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new H},clearcoatNormalScale:{value:new B(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new H},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new H},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new H},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new H},sheen:{value:0},sheenColor:{value:new W(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new H},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new H},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new H},transmissionSamplerSize:{value:new B},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new H},attenuationDistance:{value:0},attenuationColor:{value:new W(0)},specularColor:{value:new W(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new H},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new H},anisotropyVector:{value:new B},anisotropyMap:{value:null},anisotropyMapTransform:{value:new H}}]),vertexShader:G.meshphysical_vert,fragmentShader:G.meshphysical_frag};var Ks={r:0,b:0,g:0},qs=new vr,Js=new H;Js.set(-1,0,0,0,1,0,0,0,1);function Ys(e,t,n,r,i,a){let o=new W(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&i.isCubeTexture?(l===void 0&&(l=new ya(new lo(1,1,1),new Oo({name:`BackgroundCubeMaterial`,uniforms:bo(Gs.backgroundCube.uniforms),vertexShader:Gs.backgroundCube.vertexShader,fragmentShader:Gs.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(qs.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Js),l.material.toneMapped=U.getTransfer(i.colorSpace)!==cn,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new ya(new yo(2,2),new Oo({name:`BackgroundMaterial`,uniforms:bo(Gs.background.uniforms),vertexShader:Gs.background.vertexShader,fragmentShader:Gs.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=U.getTransfer(i.colorSpace)!==cn,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(Ks,wo(e)),n.buffers.color.setClear(Ks.r,Ks.g,Ks.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function Xs(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.isInterleavedBuffer===!0?t.stride:t.itemSize,p=s.offset;if(t.isInstancedInterleavedBuffer||t.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function Zs(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function Qs(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(L(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`),f=n.logarithmicDepthBuffer===!0&&d===!1;n.reversedDepthBuffer===!0&&d===!1&&L(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`),n.logarithmicDepthBuffer===!0&&d===!0&&L(`WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:d,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function $s(e){let t=this,n=null,r=0,i=!1,a=!1,o=new $i,s=new H,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var ec=class extends hr{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new io(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new lo(5,5,5),i=new Oo({name:`CubemapFromEquirect`,uniforms:bo(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new ya(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=He),new ys(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}},tc=256,nc=3,rc=20,ic=256,ac=16,oc=3,sc=new V,cc=new W,lc=class e{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new ys(1,10,null),this._boxMesh=new ya(new lo(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=sc}=i,s=this._renderer;this._setSize(a);let c=this._allocateTarget(),l=this._getSourceTarget(!0);t>0&&(l.texture.mipmapsAutoUpdate=!1);let u=s.autoClear,d=s.autoClearColor,f=s.autoClearDepth,p=s.autoClearStencil,m=e.background;s.autoClear=!0,s.autoClearColor=!0,s.autoClearDepth=!0,s.autoClearStencil=!0,m===null&&(e.background=s.getClearColor(cc));let h=new ys(n,r,l);return h.position.copy(o),h.update(s,e),s.autoClear=u,s.autoClearColor=d,s.autoClearDepth=f,s.autoClearStencil=p,e.background=m,t>0&&(l.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=gc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=hc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(tc,Wn(e))}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?tc:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);let n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){let e=this._cubeSize,t=uc(e,!1,!1),n=Math.log2(e)-nc;for(let r=0;r<=n;r++)t.texture.mipmaps.push({width:e>>r,height:e>>r});return t.texture.name=`PMREM`,t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){let t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=uc(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){let r=this._boxMesh,i=this._cubeCamera;r.material=n,i.renderTarget=e,i.activeMipmapLevel=t;let a=e.width>>t;e.viewport.set(0,0,a,a),i.update(this._renderer,r),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===301||e.mapping===302?(this._cubemapMaterial===null&&(this._cubemapMaterial=gc()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=hc()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=fc(),this._integrationMaterial=pc());let n=this._cubeSize,r=t.texture.mipmaps.length-1,i=this._ggxMaterial.uniforms;i.envMap.value=this._sourceTarget.texture;let a=this._integrationMaterial.uniforms;a.envMap.value=this._sourceTarget.texture,a.sourceLod.value=Math.log2(n/ac);for(let o=0;o<=r;o++){let s=e.lodToRoughness(o,r);if(o>r-oc)a.roughness.value=s,this._renderCube(t,o,this._integrationMaterial);else{let e=s>0?Math.log2(n)+.5*Math.log2(6/(ic*s**4))+.5:0;i.roughness.value=s,i.lodBias.value=e,this._renderCube(t,o,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=mc());let n=this._blurMaterial,r=n.uniforms,i=this._sourceTarget;r.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,r.envMap.value=i.texture,this._renderCube(e,0,n),r.envMap.value=e.texture,this._renderCube(i,0,n)}};function uc(e,t,n){return new ec(e,{minFilter:We,generateMipmaps:t,type:Qe,colorSpace:on,depthBuffer:n})}function dc(e,t,n){return new Oo({name:e,uniforms:t,vertexShader:G.cube_vert,fragmentShader:n,side:1,blending:0,depthTest:!1,depthWrite:!1})}function fc(){return dc(`PMREMGGXConvolution`,{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${ic}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function pc(){return dc(`PMREMGGXIntegration`,{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:ac}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function mc(){return dc(`PMREMSphericalGaussianBlur`,{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${rc}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function hc(){return dc(`PMREMEquirectangularToCubemap`,{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function gc(){return dc(`PMREMCubemapToCubemap`,{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function _c(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new ec(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture&&t.isPMREMTexture!==!0){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new lc(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new lc(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function vc(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&yn(`WebGLRenderer: `+e+` extension not supported.`),t}}}function yc(e,t,n,r){let i={},a=new WeakMap,o=new FinalizationRegistry(e=>delete i[e]);function s(e){c(e.target)}function c(e){e.index!==null&&t.remove(e.index);for(let n in e.attributes)t.remove(e.attributes[n]);e.removeEventListener(`dispose`,s),delete i[e.id],o.unregister(e);let c=a.get(e);c&&(t.remove(c),a.delete(e)),r.releaseStatesOfGeometry(e),e.isInstancedBufferGeometry===!0&&delete e._maxInstanceCount,n.memory.geometries--}function l(e,t){return i[t.id]===void 0&&(t.addEventListener(`dispose`,s),i[t.id]=new WeakRef(t),o.register(t,t.id,t),n.memory.geometries++),t}function u(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function d(e){let n=e.index,r=e.attributes.position,i=0;if(r===void 0)return;let o=n===null?r.array.length/3-1:n.array.length,s=new(r.count>=65535?Ii:Fi)(Math.ceil(o/3)*6,1),c=s.array;if(n!==null){let e=n.array;i=n.version;for(let t=0,n=0;t<o;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];c[n++]=r,c[n++]=i,c[n++]=i,c[n++]=a,c[n++]=a,c[n++]=r}}else{i=r.version;for(let e=0,t=0;e<o;e+=3){let n=e+0,r=e+1,i=e+2;c[t++]=n,c[t++]=r,c[t++]=r,c[t++]=i,c[t++]=i,c[t++]=n}}s.version=i;let l=a.get(e);l&&t.remove(l),a.set(e,s)}function f(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&d(e)}else d(e);return a.get(e)}function p(){for(let e in i){let t=i[e].deref();t!==void 0&&c(t)}}return{get:l,update:u,getWireframeAttribute:f,dispose:p}}function bc(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function xc(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:R(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function Sc(e,t,n){let r=new WeakMap,i=new pr;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new gr(h,p,m,u);g.type=Ze,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new B(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function Cc(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var wc={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function Tc(e,t,n,r,i,a){let o=new hr(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=null,u=new Yi;u.setAttribute(`position`,new Li([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute(`uv`,new Li([0,2,0,0,2,0],2));let d=new ko({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new ya(u,d),p=new ms(-1,1,1,-1,0,1),m=null,h=null,g=!1,_,v=null,y=[],b=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<y.length;n++){let r=y[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){y=e,b=y.length>0&&y[0].isRenderPass===!0;let t=o.width,n=o.height;y.length>0&&s===null&&(s=new hr(t,n,{type:Qe,depthBuffer:!1,stencilBuffer:!1}),c=new hr(t,n,{type:Qe,depthBuffer:!1,stencilBuffer:!1}));let r=i===!0&&y.some(e=>e.needsDepthTexture===!0);r!==(o.depthTexture!==null)&&(r===!0&&l===null&&(l=new oo(t,n),a===!0&&(l.format=ct,l.type=tt)),o.dispose(),o.depthTexture=r?l:null,o.resolveDepthBuffer=r,o.storeMultisampledDepthBuffer=r);for(let e=0;e<y.length;e++){let i=y[e];i.setSize&&i.setSize(t,n),r&&i.needsDepthTexture===!0&&i.setDepthTexture&&i.setDepthTexture(l)}},this.begin=function(e,t){if(g||e.toneMapping===0&&y.length===0)return!1;if(v=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return b===!1&&e.setRenderTarget(o),_=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return b},this.end=function(e,t){e.toneMapping=_,g=!0;let n=o,r=s;for(let i=0;i<y.length;i++){let a=y[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(m!==e.outputColorSpace||h!==e.toneMapping){m=e.outputColorSpace,h=e.toneMapping,d.defines={},U.getTransfer(m)===`srgb`&&(d.defines.SRGB_TRANSFER=``);let t=wc[h];t&&(d.defines[t]=``),d.needsUpdate=!0}d.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(v),e.render(f,p),v=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),u.dispose(),d.dispose()}}var Ec=new fr,Dc=new oo(1,1),Oc=new so(1),kc=new gr,Ac=new _r,jc=new io,Mc=[],Nc=[],Pc=new Float32Array(16),Fc=new Float32Array(9),Ic=new Float32Array(4);function Lc(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=Mc[i];if(a===void 0&&(a=new Float32Array(i),Mc[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function Rc(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function zc(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function Bc(e,t){let n=Nc[t];n===void 0&&(n=new Int32Array(t),Nc[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function Vc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function Hc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Rc(n,t))return;e.uniform2fv(this.addr,t),zc(n,t)}}function Uc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(Rc(n,t))return;e.uniform3fv(this.addr,t),zc(n,t)}}function Wc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Rc(n,t))return;e.uniform4fv(this.addr,t),zc(n,t)}}function Gc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Rc(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),zc(n,t)}else{if(Rc(n,r))return;Ic.set(r),e.uniformMatrix2fv(this.addr,!1,Ic),zc(n,r)}}function Kc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Rc(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),zc(n,t)}else{if(Rc(n,r))return;Fc.set(r),e.uniformMatrix3fv(this.addr,!1,Fc),zc(n,r)}}function qc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Rc(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),zc(n,t)}else{if(Rc(n,r))return;Pc.set(r),e.uniformMatrix4fv(this.addr,!1,Pc),zc(n,r)}}function Jc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function Yc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Rc(n,t))return;e.uniform2iv(this.addr,t),zc(n,t)}}function Xc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Rc(n,t))return;e.uniform3iv(this.addr,t),zc(n,t)}}function Zc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Rc(n,t))return;e.uniform4iv(this.addr,t),zc(n,t)}}function Qc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function $c(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Rc(n,t))return;e.uniform2uiv(this.addr,t),zc(n,t)}}function el(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Rc(n,t))return;e.uniform3uiv(this.addr,t),zc(n,t)}}function tl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Rc(n,t))return;e.uniform4uiv(this.addr,t),zc(n,t)}}function nl(e){return e.version===0&&(e.compareFunction=519,e.needsUpdate=!0),e}function rl(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_2D_SHADOW?nl(Dc):Ec,n.setTexture2D(t||a,i)}function il(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||Ac,i)}function al(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_CUBE_SHADOW?nl(Oc):jc,n.setTextureCube(t||a,i)}function ol(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||kc,i)}function sl(e){switch(e){case 5126:return Vc;case 35664:return Hc;case 35665:return Uc;case 35666:return Wc;case 35674:return Gc;case 35675:return Kc;case 35676:return qc;case 5124:case 35670:return Jc;case 35667:case 35671:return Yc;case 35668:case 35672:return Xc;case 35669:case 35673:return Zc;case 5125:return Qc;case 36294:return $c;case 36295:return el;case 36296:return tl;case 35678:case 36198:case 36298:case 36306:case 35682:return rl;case 35679:case 36299:case 36307:return il;case 35680:case 36300:case 36308:case 36293:return al;case 36289:case 36303:case 36311:case 36292:return ol}}function cl(e,t){e.uniform1fv(this.addr,t)}function ll(e,t){let n=Lc(t,this.size,2);e.uniform2fv(this.addr,n)}function ul(e,t){let n=Lc(t,this.size,3);e.uniform3fv(this.addr,n)}function dl(e,t){let n=Lc(t,this.size,4);e.uniform4fv(this.addr,n)}function fl(e,t){let n=Lc(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function pl(e,t){let n=Lc(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function ml(e,t){let n=Lc(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function hl(e,t){e.uniform1iv(this.addr,t)}function gl(e,t){e.uniform2iv(this.addr,t)}function _l(e,t){e.uniform3iv(this.addr,t)}function vl(e,t){e.uniform4iv(this.addr,t)}function yl(e,t){e.uniform1uiv(this.addr,t)}function bl(e,t){e.uniform2uiv(this.addr,t)}function xl(e,t){e.uniform3uiv(this.addr,t)}function Sl(e,t){e.uniform4uiv(this.addr,t)}function Cl(e,t,n){let r=this.cache,i=t.length,a=Bc(n,i);Rc(r,a)||(e.uniform1iv(this.addr,a),zc(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?nl(Dc):Ec;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function wl(e,t,n){let r=this.cache,i=t.length,a=Bc(n,i);Rc(r,a)||(e.uniform1iv(this.addr,a),zc(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||Ac,a[e])}function Tl(e,t,n){let r=this.cache,i=t.length,a=Bc(n,i);Rc(r,a)||(e.uniform1iv(this.addr,a),zc(r,a));let o;o=this.type===e.SAMPLER_CUBE_SHADOW?nl(Oc):jc;for(let e=0;e!==i;++e)n.setTextureCube(t[e]||o,a[e])}function El(e,t,n){let r=this.cache,i=t.length,a=Bc(n,i);Rc(r,a)||(e.uniform1iv(this.addr,a),zc(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||kc,a[e])}function Dl(e){switch(e){case 5126:return cl;case 35664:return ll;case 35665:return ul;case 35666:return dl;case 35674:return fl;case 35675:return pl;case 35676:return ml;case 5124:case 35670:return hl;case 35667:case 35671:return gl;case 35668:case 35672:return _l;case 35669:case 35673:return vl;case 5125:return yl;case 36294:return bl;case 36295:return xl;case 36296:return Sl;case 35678:case 36198:case 36298:case 36306:case 35682:return Cl;case 35679:case 36299:case 36307:return wl;case 35680:case 36300:case 36308:case 36293:return Tl;case 36289:case 36303:case 36311:case 36292:return El}}var Ol=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=sl(t.type)}},kl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Dl(t.type)}},Al=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},jl=/(\w+)(\])?(\[|\.)?/g;function Ml(e,t){e.seq.push(t),e.map[t.id]=t}function Nl(e,t,n){let r=e.name,i=r.length;for(jl.lastIndex=0;;){let a=jl.exec(r),o=jl.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){Ml(n,l===void 0?new Ol(s,e,t):new kl(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new Al(s),Ml(n,e)),n=e}}}var Pl=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);Nl(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function Fl(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var Il=37297,Ll=0;function Rl(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var zl=new H;function Bl(e){U._getMatrix(zl,U.workingColorSpace,e);let t=`mat3( ${zl.elements.map(e=>e.toFixed(4))} )`;switch(U.getTransfer(e)){case sn:return[t,`LinearTransferOETF`];case cn:return[t,`sRGBTransferOETF`];default:return L(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function Vl(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+Rl(e.getShaderSource(t),r)}return i}function Hl(e,t){let n=Bl(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( ${n[0]} * value.rgb, value.a ) );`,`}`].join(`
`)}var Ul={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function Wl(e,t){let n=Ul[t];return n===void 0?(L(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var Gl=new V;function Kl(){return U.getLuminanceCoefficients(Gl),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${Gl.x.toFixed(4)}, ${Gl.y.toFixed(4)}, ${Gl.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function ql(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(Xl).join(`
`)}function Jl(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function Yl(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function Xl(e){return e!==``}function Zl(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function Ql(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var $l=/^[ \t]*#include +<([\w\d./]+)>/gm;function eu(e){return e.replace($l,tu)}function tu(e,t){let n=G[t];if(n===void 0)throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`);return eu(n)}var nu=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ru(e){return e.replace(nu,iu)}function iu(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function au(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var ou={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function su(e){return ou[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var cu={302:`ENVMAP_MODE_REFRACTION`};function lu(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:cu[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var uu={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function du(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:uu[e.combine]||`ENVMAP_BLENDING_NONE`}function fu(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=su(n),l=n.envMapPMREM===!0?`ENVMAP_TYPE_PMREM`:`ENVMAP_TYPE_CUBE`,u=lu(n),d=du(n),f=ql(n),p=Jl(a),m=i.createProgram(),h,g,_=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(h=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(Xl).join(`
`),h.length>0&&(h+=`
`),g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(Xl).join(`
`),g.length>0&&(g+=`
`)):(h=[au(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.diffuseRoughnessMapUv?`#define DIFFUSE_ROUGHNESSMAP_UV `+n.diffuseRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(Xl).join(`
`),g=[au(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,n.envMapPMREM?`#define ENVMAP_MAX_LOD `+n.envMapMaxLod+`.0`:``,n.envMapPMREM?`#define ENVMAP_SIZE `+n.envMapSize+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughness?`#define USE_DIFFUSE_ROUGHNESS`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:G.tonemapping_pars_fragment,n.toneMapping===0?``:Wl(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,G.colorspace_pars_fragment,Hl(`linearToOutputTexel`,n.outputColorSpace),Kl(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(Xl).join(`
`)),o=eu(o),o=Zl(o,n),o=Ql(o,n),s=eu(s),s=Zl(s,n),s=Ql(s,n),o=ru(o),s=ru(s),n.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,h=[f,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+h,g=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+g);let v=_+h+o,y=_+g+s,b=Fl(i,i.VERTEX_SHADER,v),x=Fl(i,i.FRAGMENT_SHADER,y);i.attachShader(m,b),i.attachShader(m,x),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(m,0,`position`):i.bindAttribLocation(m,0,n.index0AttributeName),i.linkProgram(m);function S(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(m)||``,r=i.getShaderInfoLog(b)||``,a=i.getShaderInfoLog(x)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(m,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,m,b,x);else{let e=Vl(i,b,`vertex`),n=Vl(i,x,`fragment`);R(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(m,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):L(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:h},fragmentShader:{log:c,prefix:g}})}i.deleteShader(b),i.deleteShader(x),C=new Pl(i,m),w=Yl(i,m)}let C;this.getUniforms=function(){return C===void 0&&S(this),C};let w;this.getAttributes=function(){return w===void 0&&S(this),w};let T=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=i.getProgramParameter(m,Il)),T},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=Ll++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=x,this}var pu=0,mu=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new hu(e),t.set(e,n)),n}},hu=class{constructor(e){this.id=pu++,this.code=e,this.usedTimes=0}};function gu(e){return e===1030||e===37490||e===36285}function _u(e,t,n,r,i,a){let o=new kr,s=new mu,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function p(e){return c.add(e),e===0?`uv`:`uv${e}`}function m(i,o,l,u,m,h){let g=u.fog,_=m.geometry,v=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,b=t.get(i.envMap||v,y),x=f[i.type],S=r.precision;i.precision!==null&&(S=r.getMaxPrecision(i.precision),S!==i.precision&&L(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,S,`instead.`));let C=_.morphAttributes.position||_.morphAttributes.normal||_.morphAttributes.color,w=C===void 0?0:C.length,T=0;_.morphAttributes.position!==void 0&&(T=1),_.morphAttributes.normal!==void 0&&(T=2),_.morphAttributes.color!==void 0&&(T=3);let E,D,O,k;if(x){let e=Gs[x];E=e.vertexShader,D=e.fragmentShader}else{E=i.vertexShader,D=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),O=e.id,k=t.id}let A=e.getRenderTarget(),j=e.state.buffers.depth.getReversed(),ee=m.isInstancedMesh===!0,M=m.isBatchedMesh===!0,te=!!i.map,ne=!!i.matcap,re=!!b,ie=re&&b.isPMREMTexture===!0,ae=!!i.aoMap,oe=!!i.lightMap,se=!!i.bumpMap&&i.wireframe===!1,ce=!!i.normalMap,le=!!i.displacementMap,ue=!!i.emissiveMap,de=!!i.metalnessMap,fe=!!i.roughnessMap,pe=i.anisotropy>0,me=i.clearcoat>0,he=i.diffuseRoughness>0,ge=i.dispersion>0,_e=i.retroreflectivity>0,ve=i.iridescence>0,ye=i.sheen>0,be=i.transmission>0,xe=pe&&!!i.anisotropyMap,Se=me&&!!i.clearcoatMap,Ce=me&&!!i.clearcoatNormalMap,we=me&&!!i.clearcoatRoughnessMap,Te=he&&!!i.diffuseRoughnessMap,N=ve&&!!i.iridescenceMap,Ee=ve&&!!i.iridescenceThicknessMap,De=ye&&!!i.sheenColorMap,Oe=ye&&!!i.sheenRoughnessMap,P=!!i.specularMap,ke=!!i.specularColorMap,F=!!i.specularIntensityMap,I=be&&!!i.transmissionMap,Ae=be&&!!i.thicknessMap,je=!!i.gradientMap,Me=!!i.alphaMap,Ne=i.alphaTest>0,Pe=!!i.alphaHash,Fe=!!i.extensions,Ie=0;i.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(Ie=e.toneMapping);let Le=ie?b.isCompressedCubeTexture?b.image[0].mipmaps:b.mipmaps:null,Re={shaderID:x,shaderType:i.type,shaderName:i.name,vertexShader:E,fragmentShader:D,defines:i.defines,customVertexShaderID:O,customFragmentShaderID:k,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:S,batching:M,batchingColor:M&&m._colorsTexture!==null,instancing:ee,instancingColor:ee&&m.instanceColor!==null,instancingMorph:ee&&m.morphTexture!==null,outputColorSpace:A===null?e.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:U.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:te,matcap:ne,envMap:re,envMapMode:re&&b.mapping,envMapPMREM:ie,envMapMaxLod:ie?Le.length-1:null,envMapSize:ie?Le[0].width:null,aoMap:ae,lightMap:oe,bumpMap:se,normalMap:ce,displacementMap:le,emissiveMap:ue,normalMapObjectSpace:ce&&i.normalMapType===1,normalMapTangentSpace:ce&&i.normalMapType===0,packedNormalMap:ce&&i.normalMapType===0&&gu(i.normalMap.format),metalnessMap:de,roughnessMap:fe,anisotropy:pe,anisotropyMap:xe,clearcoat:me,clearcoatMap:Se,clearcoatNormalMap:Ce,clearcoatRoughnessMap:we,diffuseRoughness:he,diffuseRoughnessMap:Te,dispersion:ge,retroreflection:_e,iridescence:ve,iridescenceMap:N,iridescenceThicknessMap:Ee,sheen:ye,sheenColorMap:De,sheenRoughnessMap:Oe,specularMap:P,specularColorMap:ke,specularIntensityMap:F,transmission:be,transmissionMap:I,thicknessMap:Ae,gradientMap:je,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:Me,alphaTest:Ne,alphaHash:Pe,combine:i.combine,mapUv:te&&p(i.map.channel),aoMapUv:ae&&p(i.aoMap.channel),lightMapUv:oe&&p(i.lightMap.channel),bumpMapUv:se&&p(i.bumpMap.channel),normalMapUv:ce&&p(i.normalMap.channel),displacementMapUv:le&&p(i.displacementMap.channel),emissiveMapUv:ue&&p(i.emissiveMap.channel),metalnessMapUv:de&&p(i.metalnessMap.channel),roughnessMapUv:fe&&p(i.roughnessMap.channel),anisotropyMapUv:xe&&p(i.anisotropyMap.channel),clearcoatMapUv:Se&&p(i.clearcoatMap.channel),clearcoatNormalMapUv:Ce&&p(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:we&&p(i.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:Te&&p(i.diffuseRoughnessMap.channel),iridescenceMapUv:N&&p(i.iridescenceMap.channel),iridescenceThicknessMapUv:Ee&&p(i.iridescenceThicknessMap.channel),sheenColorMapUv:De&&p(i.sheenColorMap.channel),sheenRoughnessMapUv:Oe&&p(i.sheenRoughnessMap.channel),specularMapUv:P&&p(i.specularMap.channel),specularColorMapUv:ke&&p(i.specularColorMap.channel),specularIntensityMapUv:F&&p(i.specularIntensityMap.channel),transmissionMapUv:I&&p(i.transmissionMap.channel),thicknessMapUv:Ae&&p(i.thicknessMap.channel),alphaMapUv:Me&&p(i.alphaMap.channel),vertexTangents:!!_.attributes.tangent&&(ce||pe),vertexNormals:!!_.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!_.attributes.color&&_.attributes.color.itemSize===4,pointsUvs:m.isPoints===!0&&!!_.attributes.uv&&(te||Me),fog:!!g,useFog:i.fog===!0,fogExp2:!!g&&g.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||_.attributes.normal===void 0&&ce===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:j,skinning:m.isSkinnedMesh===!0,hasPositionAttribute:_.attributes.position!==void 0,morphTargets:_.morphAttributes.position!==void 0,morphNormals:_.morphAttributes.normal!==void 0,morphColors:_.morphAttributes.color!==void 0,morphTargetsCount:w,morphTextureStride:T,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:h.filter(e=>e.texture!==null).length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:Ie,decodeVideoTexture:te&&i.map.isVideoTexture===!0&&U.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:ue&&i.emissiveMap.isVideoTexture===!0&&U.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Fe&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Fe&&i.extensions.multiDraw===!0||M)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Re.vertexUv1s=c.has(1),Re.vertexUv2s=c.has(2),Re.vertexUv3s=c.has(3),c.clear(),Re}function h(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(g(n,t),_(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function g(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapPMREM),e.push(t.envMapMaxLod),e.push(t.envMapSize),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.diffuseRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.numLightProbeGrids),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function _(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.diffuseRoughness&&o.enable(25),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function v(e){let t=f[e.type],n;if(t){let e=Gs[t];n=To.clone(e.uniforms)}else n=e.uniforms;return n}function y(t,n){let r=u.get(n);return r===void 0?(r=new fu(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function b(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function x(e){s.remove(e)}function S(){s.dispose()}return{getParameters:m,getProgramCacheKey:h,getUniforms:v,acquireProgram:y,releaseProgram:b,releaseShaderCache:x,programs:l,dispose:S}}function vu(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function yu(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function bu(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function xu(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||yu),r.length>1&&r.sort(t||bu),i.length>1&&i.sort(t||bu)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function Su(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new xu,e.set(t,[i])):n>=r.length?(i=new xu,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function Cu(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new V,color:new W};break;case`SpotLight`:n={position:new V,direction:new V,color:new W,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new V,color:new W,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new V,skyColor:new W,groundColor:new W};break;case`RectAreaLight`:n={color:new W,position:new V,halfWidth:new V,halfHeight:new V}}return e[t.id]=n,n}}}function wu(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new B};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new B};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new B,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var Tu=0;function Eu(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function Du(e){let t=new Cu,n=wu(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new V);let i=new V,a=new vr,o=new vr;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(Eu);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=K.LTC_FLOAT_1,r.rectAreaLTC2=K.LTC_FLOAT_2):(r.rectAreaLTC1=K.LTC_HALF_1,r.rectAreaLTC2=K.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=Tu++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function Ou(e){let t=new Du(e),n=[],r=[],i=[];function a(e){u.camera=e,n.length=0,r.length=0,i.length=0}function o(e){e.isLightProbeGrid?i.push(e):n.push(e)}function s(e){r.push(e)}function c(){t.setup(n),i.sort((e,t)=>e.priority-t.priority||e.id-t.id)}function l(e){t.setupView(n,e)}let u={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:u,setupLights:c,setupLightsView:l,pushLight:o,pushShadow:s}}function ku(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new Ou(e),t.set(n,[a])):r>=i.length?(a=new Ou(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var Au=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,ju=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Mu=[new V(1,0,0),new V(-1,0,0),new V(0,1,0),new V(0,-1,0),new V(0,0,1),new V(0,0,-1)],Nu=[new V(0,-1,0),new V(0,-1,0),new V(0,0,1),new V(0,0,-1),new V(0,-1,0),new V(0,-1,0)],Pu=new vr,Fu=new V,Iu=new V;function Lu(e,t,n){let r=new Fa,i=new B,a=new B,o=new pr,s=new Mo,c=new No,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new Oo({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new B},radius:{value:4}},vertexShader:Au,fragmentShader:ju}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new Yi;m.setAttribute(`position`,new Pi(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new ya(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(L(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){L(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){L(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new hr(i.x,i.y,{format:dt,type:Qe,minFilter:He,magFilter:He,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new oo(i.x,i.y,Ze),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=st,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=ze,d.map.depthTexture.magFilter=ze}else l.isPointLight?(d.map=new ec(i.x),d.map.depthTexture=new so(i.x,Xe)):(d.map=new hr(i.x,i.y),d.map.depthTexture=new oo(i.x,i.y,Xe)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=st,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=He,d.map.depthTexture.magFilter=He):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=ze,d.map.depthTexture.magFilter=ze);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);let _=d.camera.layers.mask&4294967294?d.camera.layers:s.layers;for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),Fu.setFromMatrixPosition(l.matrixWorld),e.position.copy(Fu),Iu.copy(e.position),Iu.add(Mu[t]),e.up.copy(Nu[t]),e.lookAt(Iu),e.updateMatrixWorld(),n.makeTranslation(-Fu.x,-Fu.y,-Fu.z),Pu.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(Pu,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,_,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new hr(i.x,i.y,{format:dt,type:Qe}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s,c){if(n.visible===!1)return;if(n.layers.test(s)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&c===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),s=n.material;if(Array.isArray(s)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=s[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,c);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(s.visible){let t=y(n,s,o,c);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let l=n.children;for(let e=0,t=l.length;e<t;e++)b(l[e],i,a,o,s,c)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function Ru(e,t){function n(){let t=!1,n=new pr,r=null,i=new pr(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?de(e.DEPTH_TEST):fe(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=xn[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?de(e.STENCIL_TEST):fe(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c={},l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new W(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ee=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),M=!1,te=0,ne=e.getParameter(e.VERSION);ne.indexOf(`WebGL`)===-1?ne.indexOf(`OpenGL ES`)!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(ne)[1]),M=te>=2):(te=parseFloat(/^WebGL (\d)/.exec(ne)[1]),M=te>=1);let re=null,ie={},ae=e.getParameter(e.SCISSOR_BOX),oe=e.getParameter(e.VIEWPORT),se=new pr().fromArray(ae),ce=new pr().fromArray(oe);function le(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let ue={};ue[e.TEXTURE_2D]=le(e.TEXTURE_2D,e.TEXTURE_2D,1),ue[e.TEXTURE_CUBE_MAP]=le(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),ue[e.TEXTURE_2D_ARRAY]=le(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),ue[e.TEXTURE_3D]=le(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),de(e.DEPTH_TEST),o.setFunc(3),be(!1),xe(1),de(e.CULL_FACE),ve(0);function de(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function fe(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function pe(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function me(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function he(t){return h!==t&&(e.useProgram(t),h=t,!0)}let ge={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};ge[103]=e.MIN,ge[104]=e.MAX;let _e={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function ve(t,n,r,i,a,o,s,c,l,u){if(t===0)g===!0&&(fe(e.BLEND),g=!1);else if(g===!1&&(de(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:R(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:R(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:R(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:R(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}}else a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(ge[n],ge[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(_e[r],_e[i],_e[o],_e[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function ye(t,n){t.side===2?fe(e.CULL_FACE):de(e.CULL_FACE);let r=t.side===1;n&&(r=!r),be(r),t.blending===1&&t.transparent===!1?ve(0):ve(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),Ce(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?de(e.SAMPLE_ALPHA_TO_COVERAGE):fe(e.SAMPLE_ALPHA_TO_COVERAGE)}function be(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function xe(t){t===0?fe(e.CULL_FACE):(de(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function Se(t){t!==k&&(M&&e.lineWidth(t),k=t)}function Ce(t,n,r){t?(de(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n,r=-r),e.polygonOffset(n,r))):fe(e.POLYGON_OFFSET_FILL)}function we(t){t?de(e.SCISSOR_TEST):fe(e.SCISSOR_TEST)}function Te(t){t===void 0&&(t=e.TEXTURE0+ee-1),re!==t&&(e.activeTexture(t),re=t)}function N(t,n,r){r===void 0&&(r=re===null?e.TEXTURE0+ee-1:re);let i=ie[r];i===void 0&&(i={type:void 0,texture:void 0},ie[r]=i),(i.type!==t||i.texture!==n)&&(re!==r&&(e.activeTexture(r),re=r),e.bindTexture(t,n||ue[t]),i.type=t,i.texture=n)}function Ee(){let t=ie[re];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function De(){try{e.compressedTexImage2D(...arguments)}catch(e){R(`WebGLState:`,e)}}function Oe(){try{e.compressedTexImage3D(...arguments)}catch(e){R(`WebGLState:`,e)}}function P(){try{e.texSubImage2D(...arguments)}catch(e){R(`WebGLState:`,e)}}function ke(){try{e.texSubImage3D(...arguments)}catch(e){R(`WebGLState:`,e)}}function F(){try{e.compressedTexSubImage2D(...arguments)}catch(e){R(`WebGLState:`,e)}}function I(){try{e.compressedTexSubImage3D(...arguments)}catch(e){R(`WebGLState:`,e)}}function Ae(){try{e.texStorage2D(...arguments)}catch(e){R(`WebGLState:`,e)}}function je(){try{e.texStorage3D(...arguments)}catch(e){R(`WebGLState:`,e)}}function Me(){try{e.texImage2D(...arguments)}catch(e){R(`WebGLState:`,e)}}function Ne(){try{e.texImage3D(...arguments)}catch(e){R(`WebGLState:`,e)}}function Pe(t){return d[t]===void 0?e.getParameter(t):d[t]}function Fe(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function Ie(t){se.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),se.copy(t))}function Le(t){ce.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),ce.copy(t))}function Re(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),e.uniformBlockBinding(n,i,i),r.set(t,i))}function ze(t,n,r){let i=l.get(n).get(t);c[i]!==r&&(e.bindBufferBase(e.UNIFORM_BUFFER,i,r),c[i]=r)}function Be(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},re=null,ie={},f={},c={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new W(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,se.set(0,0,e.canvas.width,e.canvas.height),ce.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:de,disable:fe,bindFramebuffer:pe,drawBuffers:me,useProgram:he,setBlending:ve,setMaterial:ye,setFlipSided:be,setCullFace:xe,setLineWidth:Se,setPolygonOffset:Ce,setScissorTest:we,activeTexture:Te,bindTexture:N,unbindTexture:Ee,compressedTexImage2D:De,compressedTexImage3D:Oe,texImage2D:Me,texImage3D:Ne,pixelStorei:Fe,getParameter:Pe,updateUBOMapping:Re,uniformBlockBinding:ze,texStorage2D:Ae,texStorage3D:je,texSubImage2D:P,texSubImage3D:ke,compressedTexSubImage2D:F,compressedTexSubImage3D:I,scissor:Ie,viewport:Le,reset:Be}}function zu(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new B,u=new WeakMap,d=new Set,f,p=new WeakMap,m=new Set,h=new FinalizationRegistry(e=>m.delete(e)),g=!1;try{g=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function _(e,t){return g?new OffscreenCanvas(e,t):mn(`canvas`)}function v(e,t,n){let r=1,i=Ae(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=_(n,a));let o=t?_(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),L(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&L(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function y(e){return e.generateMipmaps}function b(t){e.generateMipmap(t)}function x(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function S(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];L(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||L(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?sn:U.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function C(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,L(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function w(e,t){return y(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function T(e){let t=new WeakRef(e);r.get(e).__ref=t,m.add(t),h.register(e,t,t)}function E(e){let t=r.get(e).__ref;t!==void 0&&(m.delete(t),h.unregister(t))}function D(e){k(e.target)}function O(e){A(e.target)}function k(e){e.removeEventListener(`dispose`,D),E(e),ee(e),e.isVideoTexture&&u.delete(e),e.isHTMLTexture&&d.delete(e)}function A(e){e.removeEventListener(`dispose`,O),E(e),te(e)}function j(){for(let e of m){let t=e.deref();t!==void 0&&(t.isRenderTarget===!0?A(t):k(t))}m.clear(),d.clear()}function ee(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&M(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function M(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function te(t){let n=r.get(t);n.__depthDisposeCallback&&n.__depthDisposeCallback();let i=t.depthTexture;if(i&&i.renderTarget===t&&k(i),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let a=t.textures;for(let t=0,n=a.length;t<n;t++){let n=r.get(a[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(a[t])}r.remove(t)}let ne=0;function re(){ne=0}function ie(){return ne}function ae(e){ne=e}function oe(){let e=ne;return e>=i.maxTextures&&L(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),ne+=1,e}function se(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.mipmapsAutoUpdate),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function ce(t,i){let a=r.get(t);if(t.isVideoTexture&&F(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)L(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)L(`WebGLRenderer: Texture marked for update but image is incomplete`);else{ye(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function le(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?ye(a,t,i):(t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i))}function ue(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?ye(a,t,i):n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function de(t,i){let a=r.get(t);t.version>0&&a.__version!==t.version?be(a,t,i):n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let fe={[Ie]:e.REPEAT,[Le]:e.CLAMP_TO_EDGE,[Re]:e.MIRRORED_REPEAT},pe={[ze]:e.NEAREST,[Be]:e.NEAREST_MIPMAP_NEAREST,[Ve]:e.NEAREST_MIPMAP_LINEAR,[He]:e.LINEAR,[Ue]:e.LINEAR_MIPMAP_NEAREST,[We]:e.LINEAR_MIPMAP_LINEAR},me={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function he(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&L(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,fe[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,fe[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,fe[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,pe[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,pe[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,me[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function ge(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,D),T(n));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=se(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&M(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function _e(e,t,n){return Math.floor(Math.floor(e/n)/t)}function ve(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=_e(n.start,r.width,4),c=_e(t.start,r.width,4);n.start<=i+1&&a===c&&_e(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function ye(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=ge(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=U.getPrimaries(U.workingColorSpace),r=o.colorSpace===``?null:U.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=v(o.image,!1,i.maxTextureSize);t=I(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=S(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);he(c,o);let h,g=o.mipmaps,_=o.isVideoTexture!==!0,x=f.__version===void 0||l===!0,T=u.dataReady,E=w(o,t);if(o.isDepthTexture)m=C(o.format===ct,o.type),x&&(_?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(g.length>0){_&&x&&n.texStorage2D(e.TEXTURE_2D,E,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else _?(x&&n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height),T&&ve(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){_&&x&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,g[0].width,g[0].height,t.depth);for(let i=0,a=g.length;i<a;i++)if(h=g[i],o.format!==1023){if(r!==null){if(_){if(T){if(o.layerUpdates.size>0){let t=Vs(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else L(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else _?T&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{_&&x&&n.texStorage2D(e.TEXTURE_2D,E,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],o.format===1023?_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?L(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):_?T&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(_){if(x&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,t.width,t.height,t.depth),T){if(o.layerUpdates.size>0){let i=Vs(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)_?(x&&n.texStorage3D(e.TEXTURE_3D,E,m,t.width,t.height,t.depth),T&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(x){if(_)n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<E;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(g.length>0){if(_&&x){let t=Ae(g[0]);n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height)}for(let t=0,i=g.length;t<i;t++)h=g[t],_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(_){if(x){let r=Ae(t);n.texStorage2D(e.TEXTURE_2D,E,m,r.width,r.height)}T&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);y(o)&&o.mipmapsAutoUpdate===!0&&b(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function be(t,o,s){if(o.image.length!==6)return;let c=ge(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=U.getPrimaries(U.workingColorSpace),r=o.colorSpace===``?null:U.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=v(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=I(o,m[e]);let h=m[0],g=a.convert(o.format,o.colorSpace),_=a.convert(o.type),x=S(o.internalFormat,g,_,o.normalized,o.colorSpace),T=o.isVideoTexture!==!0,E=u.__version===void 0||c===!0,D=l.dataReady,O=w(o,h);he(e.TEXTURE_CUBE_MAP,o);let k;if(o.isDepthTexture){if(x=C(o.format===ct,o.type),E){if(T)n.texStorage2D(e.TEXTURE_CUBE_MAP,1,x,h.width,h.height);else for(let t=0;t<6;t++)n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,h.width,h.height,0,g,_,null)}}else if(f){T&&E&&n.texStorage2D(e.TEXTURE_CUBE_MAP,O,x,h.width,h.height);for(let t=0;t<6;t++){k=m[t].mipmaps;for(let r=0;r<k.length;r++){let i=k[r];o.format===1023?T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,x,i.width,i.height,0,g,_,i.data):g===null?L(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):T?D&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,x,i.width,i.height,0,i.data)}}}else{if(k=o.mipmaps,T&&E){k.length>0&&O++;let t=Ae(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,O,x,t.width,t.height)}for(let t=0;t<6;t++)if(p){T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,g,_,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,m[t].width,m[t].height,0,g,_,m[t].data);for(let r=0;r<k.length;r++){let i=k[r].image[t].image;T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,x,i.width,i.height,0,g,_,i.data)}}else{T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,g,_,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,g,_,m[t]);for(let r=0;r<k.length;r++){let i=k[r];T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,g,_,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,x,g,_,i.image[t])}}}y(o)&&o.mipmapsAutoUpdate===!0&&b(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function xe(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=S(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),ke(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,P(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function Se(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=C(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;ke(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,P(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,P(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=S(o.internalFormat,c,l,o.normalized,o.colorSpace);ke(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,P(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,P(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Ce(t,i,a){let o=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let c=r.get(i.depthTexture);c.__renderTarget=i;let l=o?i.depthTexture.image[0]:i.depthTexture.image;c.__webglTexture&&l.width===i.width&&l.height===i.height||(l.width=i.width,l.height=i.height,i.depthTexture.needsUpdate=!0),o?de(i.depthTexture,0):ce(i.depthTexture,0);let u=c.__webglTexture,d=P(i),f=o?e.TEXTURE_CUBE_MAP_POSITIVE_X+a:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)ke(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)ke(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function we(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)Ce(i.__webglFramebuffer[e],t,e);else t.texture.mipmaps.length>0?Ce(i.__webglFramebuffer[0],t,0):Ce(i.__webglFramebuffer,t,0)}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),Se(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else if(t.texture.mipmaps.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),Se(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}n.bindFramebuffer(e.FRAMEBUFFER,null)}function Te(t,n,i){let a=r.get(t);n!==void 0&&xe(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&we(t)}function N(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,O),T(t);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&ke(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=S(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=P(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),Se(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),he(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)xe(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else xe(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);y(i)?b(e.TEXTURE_CUBE_MAP):i.mipmaps.length>0&&e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),he(c,a),xe(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),y(a)&&b(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),he(r,i),i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)xe(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else xe(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);y(i)?b(r):i.mipmaps.length>0&&e.texParameteri(r,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}t.depthBuffer&&we(t)}function Ee(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(y(a)&&a.mipmapsAutoUpdate===!0){let t=x(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),b(t),n.unbindTexture()}}}let De=[];function Oe(t){if(t.samples>0){if(ke(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer),t.texture.mipmaps.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(De.length=0,De.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&De.push(l),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,De))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function P(e){return Math.min(i.maxSamples,e.samples)}function ke(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function F(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function I(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(U.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&L(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):R(`WebGLTextures: Unsupported texture color space:`,n)),t}function Ae(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=oe,this.resetTextureUnits=re,this.getTextureUnits=ie,this.setTextureUnits=ae,this.setTexture2D=ce,this.setTexture2DArray=le,this.setTexture3D=ue,this.setTextureCube=de,this.rebindTextures=Te,this.setupRenderTarget=N,this.updateRenderTargetMipmap=Ee,this.updateMultisampleRenderTarget=Oe,this.setupDepthRenderbuffer=we,this.setupFrameBufferTexture=xe,this.useMultisampledRTT=ke,this.dispose=j}function Bu(e,t){function n(n,r=``){let i,a=U.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var Vu=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Hu=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Uu=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new co(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Oo({vertexShader:Vu,fragmentShader:Hu,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ya(new yo(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Wu=class extends Sn{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new Uu,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new B,C=null,w=null,T=new ps;T.viewport=new pr;let E=new ps;E.viewport=new pr;let D=[T,E],O=new bs,k=null,A=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new Jr,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new Jr,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new Jr,b[e]=t),t.getHandSpace()};function j(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function ee(){r.removeEventListener(`select`,j),r.removeEventListener(`selectstart`,j),r.removeEventListener(`selectend`,j),r.removeEventListener(`squeeze`,j),r.removeEventListener(`squeezestart`,j),r.removeEventListener(`squeezeend`,j),r.removeEventListener(`end`,ee),r.removeEventListener(`inputsourceschange`,M);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}k=null,A=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,ae.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&L(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&L(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,j),r.addEventListener(`selectstart`,j),r.addEventListener(`selectend`,j),r.addEventListener(`squeeze`,j),r.addEventListener(`squeezestart`,j),r.addEventListener(`squeezeend`,j),r.addEventListener(`end`,ee),r.addEventListener(`inputsourceschange`,M),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?ct:st,a=_.stencil?tt:Xe);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new hr(d.textureWidth,d.textureHeight,{format:ot,type:Ge,depthTexture:new oo(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new hr(f.framebufferWidth,f.framebufferHeight,{format:ot,type:Ge,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),ae.setContext(r),ae.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function M(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}function te(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(k!==O.near||A!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,A=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;te(O,i);for(let e=0;e<a.length;e++)te(a[e],i);O.projectionMatrix.copy(T.projectionMatrix),O.projectionMatrixInverse.copy(T.projectionMatrixInverse),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),ne(e,O,i)};function ne(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=En*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let re=null;function ie(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new ps,o.layers.enable(n),o.viewport=new pr,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new co,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}re&&re(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let ae=new Us;ae.setAnimationLoop(ie),this.setAnimationLoop=function(e){re=e},this.dispose=function(){}}},Gu=new vr,Ku=new H;Ku.set(-1,0,0,0,1,0,0,0,1);function qu(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,wo(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(Gu.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(Ku),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.diffuseRoughness>0&&(e.diffuseRoughness.value=t.diffuseRoughness,t.diffuseRoughnessMap&&(e.diffuseRoughnessMap.value=t.diffuseRoughnessMap,n(t.diffuseRoughnessMap,e.diffuseRoughnessMapTransform))),t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessMinimum,e.iridescenceThicknessMaximum.value=t.iridescenceThicknessMaximum,t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Ju(e,t,n,r){let i={},a={};function o(e,t){let n=t.program;r.uniformBlockBinding(e,n,i[e.id])}function s(e,n){let o=i[e.id];o===void 0&&(m(e),o=c(e),i[e.id]=o,e.addEventListener(`dispose`,g));let s=n.program;r.updateUBOMapping(e,s);let u=t.render.frame;a[e.id]!==u&&(l(e),a[e.id]=u)}function c(t){let n=e.createBuffer(),r=t.__size,i=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,n),e.bufferData(e.UNIFORM_BUFFER,r,i),e.bindBuffer(e.UNIFORM_BUFFER,null),n}function l(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)u(t[n],e,n,a);else u(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function u(t,n,r,i){if(f(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=h(i,!0);d(i,t.__data,e),e+=a.storage/Float32Array.BYTES_PER_ELEMENT}}else d(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function d(e,t,n){typeof e==`number`||typeof e==`boolean`?t[n]=e:e.isMatrix3?(t[n]=e.elements[0],t[n+1]=e.elements[1],t[n+2]=e.elements[2],t[n+3]=0,t[n+4]=e.elements[3],t[n+5]=e.elements[4],t[n+6]=e.elements[5],t[n+7]=0,t[n+8]=e.elements[6],t[n+9]=e.elements[7],t[n+10]=e.elements[8],t[n+11]=0):ArrayBuffer.isView(e)?t.set(e.subarray(0,t.length-n),n):e.toArray(t,n)}function f(e,t,n,r){let i=e.value,a=t+`_`+n;if(Array.isArray(i)){r[a]===void 0&&(r[a]=[]);let e=r[a],t=!1;for(let n=0;n<i.length;n++)p(i[n],e,n)===!0&&(t=!0);return t}return p(i,r,a)}function p(e,t,n){if(t[n]===void 0)return t[n]=typeof e==`number`||typeof e==`boolean`?e:ArrayBuffer.isView(e)?e.slice():e.clone(),!0;{let r=t[n];if(typeof e==`number`||typeof e==`boolean`){if(r!==e)return t[n]=e,!0}else if(ArrayBuffer.isView(e))return!0;else if(r.equals(e)===!1)return r.copy(e),!0}return!1}function m(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let i=0,a=r.length;i<a;i++){let a=r[i],o=Array.isArray(a.value)?a.value:[a.value],s=Array.isArray(t[e])||Array.isArray(a.value),c=n;for(let e=0,t=o.length;e<t;e++){let t=o[e],r=h(t,s),i=n%16,a=i%r.boundary,l=i+a;n+=a,l!==0&&16-l<r.storage&&(n+=16-l),e===0&&(c=n),n+=r.storage}a.__data=new(a.type===`int`?Int32Array:a.type===`uint`?Uint32Array:Float32Array)((n-c)/Float32Array.BYTES_PER_ELEMENT),a.__offset=c}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function h(e,t){let n={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(n.boundary=4,n.storage=4):e.isVector2?(n.boundary=8,n.storage=8):e.isVector3||e.isColor?(n.boundary=16,n.storage=12):e.isVector4?(n.boundary=16,n.storage=16):e.isMatrix3?(n.boundary=16,n.storage=48):e.isMatrix4?(n.boundary=16,n.storage=64):e.isTexture?L(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(n.boundary=16,n.storage=e.byteLength):L(`WebGLRenderer: Unsupported uniform value type.`,e),t===!0&&(n.boundary=16,n.storage=Math.ceil(n.storage/16)*16),n}function g(t){let n=t.target;n.removeEventListener(`dispose`,g),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function _(){for(let t in i)e.deleteBuffer(i[t]);i={},a={}}return{bind:o,update:s,dispose:_}}var Yu=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Xu=null;function Zu(){return Xu===null&&(Xu=new Sa(Yu,16,16,dt,Qe),Xu.name=`DFG_LUT`,Xu.minFilter=He,Xu.magFilter=He,Xu.wrapS=Le,Xu.wrapT=Le,Xu.generateMipmaps=!1,Xu.needsUpdate=!0),Xu}var Qu=class{constructor(e={}){let{canvas:t=hn(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=Ge}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([pt,ft,ut]),g=new Set([Ge,Xe,Je,tt,$e,et]),_=new Uint32Array(4),v=new Int32Array(4),y={textures:[],min:[],max:[],resolution:[]},b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,O=null,k=null,A=null;this._outputColorSpace=an;let j=0,ee=0,M=null,te=-1,ne=null,re=new pr,ie=new pr,ae=null,oe=new W(0),se=0,ce=t.width,le=t.height,ue=1,de=null,fe=null,pe=new pr(0,0,ce,le),me=new pr(0,0,ce,le),he=!1,ge=new Fa,_e=new La,ve=!1,ye=!1,be=new vr,xe=new V,Se=new pr,Ce={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},we=!1;function Te(){return M===null?ue:1}let N=n;function Ee(e,n){return t.getContext(e,n)}let De,Oe,P,ke,F,I,Ae,je,Me,Ne,Pe,Fe,Ie,Le,Re,ze,Be,Ve,He,Ue,Ke,qe,Ye;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r187`),t.addEventListener(`webglcontextlost`,rt,!1),t.addEventListener(`webglcontextrestored`,it,!1),t.addEventListener(`webglcontextcreationerror`,at,!1),N===null){let t=`webgl2`;if(N=Ee(t,e),N===null)throw Ee(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}Ze()}catch(e){throw t.removeEventListener(`webglcontextlost`,rt,!1),t.removeEventListener(`webglcontextrestored`,it,!1),t.removeEventListener(`webglcontextcreationerror`,at,!1),R(`WebGLRenderer: `+e.message),e}function Ze(){De=new vc(N),De.init(),Ke=new Bu(N,De),Oe=new Qs(N,De,e,Ke),P=new Ru(N,De),Oe.reversedDepthBuffer&&d&&P.buffers.depth.setReversed(!0),O=N.createFramebuffer(),k=N.createFramebuffer(),A=N.createFramebuffer(),ke=new xc(N),F=new vu,I=new zu(N,De,P,F,Oe,Ke,ke),Ae=new _c(T),je=new Ws(N),qe=new Xs(N,je),Me=new yc(N,je,ke,qe),Ne=new Cc(N,Me,je,qe,ke),Ve=new Sc(N,Oe,I),Re=new $s(F),Pe=new _u(T,Ae,De,Oe,qe,Re),Fe=new qu(T,F),Ie=new Su,Le=new ku(De),Be=new Ys(T,Ae,P,Ne,p,s),ze=new Lu(T,Ne,Oe),Ye=new Ju(N,ke,Oe,P),He=new Zs(N,De,ke),Ue=new bc(N,De,ke),ke.programs=Pe.programs,T.capabilities=Oe,T.extensions=De,T.properties=F,T.renderLists=Ie,T.shadowMap=ze,T.state=P,T.info=ke}m!==1009&&(w=new Tc(m,t.width,t.height,o,r,i));let nt=new Wu(T,N);this.xr=nt,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){let e=De.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=De.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return ue},this.setPixelRatio=function(e){e!==void 0&&(ue=e,this.setSize(ce,le,!1))},this.getSize=function(e){return e.set(ce,le)},this.setSize=function(e,n,r=!0){nt.isPresenting?L(`WebGLRenderer: Can't change size while VR device is presenting.`):(ce=e,le=n,t.width=Math.floor(e*ue),t.height=Math.floor(n*ue),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(ce*ue,le*ue).floor()},this.setDrawingBufferSize=function(e,n,r){ce=e,le=n,ue=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009)R(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){L(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(re)},this.getViewport=function(e){return e.copy(pe)},this.setViewport=function(e,t,n,r){e.isVector4?pe.set(e.x,e.y,e.z,e.w):pe.set(e,t,n,r),P.viewport(re.copy(pe).multiplyScalar(Te()).round())},this.getScissor=function(e){return e.copy(me)},this.setScissor=function(e,t,n,r){e.isVector4?me.set(e.x,e.y,e.z,e.w):me.set(e,t,n,r),P.scissor(ie.copy(me).multiplyScalar(Te()).round())},this.getScissorTest=function(){return he},this.setScissorTest=function(e){P.setScissorTest(he=e)},this.setOpaqueSort=function(e){de=e},this.setTransparentSort=function(e){fe=e},this.getClearColor=function(e){return e.copy(Be.getClearColor())},this.setClearColor=function(){Be.setClearColor(...arguments)},this.getClearAlpha=function(){return Be.getClearAlpha()},this.setClearAlpha=function(){Be.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(M!==null){let t=M.texture.format;e=h.has(t)}if(e){let e=M.texture.type,t=g.has(e),n=Be.getClearColor(),r=Be.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,N.clearBufferuiv(N.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,N.clearBufferiv(N.COLOR,0,v))}else r|=N.COLOR_BUFFER_BIT}t&&(r|=N.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&N.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,rt,!1),t.removeEventListener(`webglcontextrestored`,it,!1),t.removeEventListener(`webglcontextcreationerror`,at,!1),Be.dispose(),Ie.dispose(),Le.dispose(),I.dispose(),F.dispose(),Ae.dispose(),Ne.dispose(),Me.dispose(),qe.dispose(),Ye.dispose(),Pe.dispose(),nt.dispose(),nt.removeEventListener(`sessionstart`,ht),nt.removeEventListener(`sessionend`,gt),_t.stop()};function rt(e){e.preventDefault(),_n(`WebGLRenderer: Context Lost.`),E=!0}function it(){_n(`WebGLRenderer: Context Restored.`),E=!1;let e=ke.autoReset,t=ze.enabled,n=ze.autoUpdate,r=ze.needsUpdate,i=ze.type;Ze(),ke.autoReset=e,ze.enabled=t,ze.autoUpdate=n,ze.needsUpdate=r,ze.type=i}function at(e){R(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function ot(e){let t=e.target;t.removeEventListener(`dispose`,ot),st(t)}function st(e){ct(e),F.remove(e)}function ct(e){let t=F.get(e).programs;t!==void 0&&(t.forEach(function(e){Pe.releaseProgram(e)}),e.isShaderMaterial&&Pe.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=Ce);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=Ot(e,t,n,r,i);P.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=Me.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;qe.setup(i,r,s,n,c);let h,g=He;if(c!==null&&(h=je.get(c),g=Ue,g.setIndex(h)),i.isMesh)r.wireframe===!0?(P.setLineWidth(r.wireframeLinewidth*Te()),g.setMode(N.LINES)):g.setMode(N.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),P.setLineWidth(e*Te()),i.isLineSegments?g.setMode(N.LINES):i.isLineLoop?g.setMode(N.LINE_LOOP):g.setMode(N.LINE_STRIP)}else i.isPoints?g.setMode(N.POINTS):i.isSprite&&g.setMode(N.TRIANGLES);if(i.isBatchedMesh){if(De.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?je.get(c).bytesPerElement:1,o=F.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(N,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function lt(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),ve===!0&&Re.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,wt(e,t,r),e.side=0,e.needsUpdate=!0,wt(e,t,r),e.side=2):wt(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=Le.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),ye=this.localClippingEnabled,ve=Re.init(this.clippingPlanes,ye),ve===!0&&Re.setGlobalState(this.clippingPlanes,t),D!==null&&ze.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];lt(o,n,t,e),r.add(o)}else lt(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=F.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}De.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let dt=null;function mt(e){dt&&dt(e)}function ht(){_t.stop()}function gt(){_t.start()}let _t=new Us;_t.setAnimationLoop(mt),typeof self<`u`&&_t.setContext(self),this.setAnimationLoop=function(e){dt=e,nt.setAnimationLoop(e),e===null?_t.stop():_t.start()},nt.addEventListener(`sessionstart`,ht),nt.addEventListener(`sessionend`,gt),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){R(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=nt.enabled===!0&&nt.isPresenting===!0,r=w!==null&&(M===null||n)&&w.begin(T,M);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),nt.enabled===!0&&nt.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(nt.cameraAutoUpdate===!0&&nt.updateCamera(t),t=nt.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,M),x=Le.get(e,C.length),x.init(t),x.state.textureUnits=I.getTextureUnits(),C.push(x),be.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),t.isArrayCamera?_e.setFromArrayCamera(t):ge.setFromProjectionMatrix(be,dn,t.reversedDepth),ye=this.localClippingEnabled,ve=Re.init(this.clippingPlanes,ye),b=Ie.get(e,S.length),b.init(),S.push(b),this.info.render.frame++,nt.enabled===!0&&nt.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&vt(e,t,-1/0,T.sortObjects)}vt(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(de,fe),we=nt.enabled===!1||nt.isPresenting===!1||nt.hasDepthSensing()===!1,we&&Be.addToRenderList(b,e),this.info.autoReset===!0&&this.info.reset(),ve===!0&&Re.beginShadows();let i=x.state.shadowsArray;if(ze.render(i,e,t),ve===!0&&Re.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];bt(n,r,e,a)}we&&Be.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];yt(b,e,n,n.viewport)}}else r.length>0&&bt(n,r,e,t),we&&Be.render(e),yt(b,e,t)}M!==null&&ee===0&&(I.updateMultisampleRenderTarget(M),I.updateRenderTargetMipmap(M)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),qe.resetDefaultState(),te=-1,ne=null,C.pop(),C.length>0?(x=C[C.length-1],I.setTextureUnits(x.state.textureUnits),ve===!0&&Re.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function vt(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){let i=t.isArrayCamera?_e:ge;if(!e.frustumCulled||e.intersectsFrustum(i)){r&&Se.setFromMatrixPosition(e.matrixWorld).applyMatrix4(be);let i=Ne.update(e),a=e.material;a.visible&&b.push(e,i,a,n,Se.z,null,t)}}else if(e.isMesh||e.isLine||e.isPoints){let i=t.isArrayCamera?_e:ge;if(!e.frustumCulled||e.intersectsFrustum(i)){let i=Ne.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),Se.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),Se.copy(e.boundingSphere.center)),Se.applyMatrix4(e.matrixWorld).applyMatrix4(be)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,Se.z,s,t)}}else a.visible&&b.push(e,i,a,n,Se.z,null,t)}}}let i=e.children;for(let e=0,a=i.length;e<a;e++)vt(i[e],t,n,r)}function yt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),ve===!0&&Re.setGlobalState(T.clippingPlanes,n),r&&P.viewport(re.copy(r)),i.length>0&&xt(i,t,n),a.length>0&&xt(a,t,n),o.length>0&&xt(o,t,n),P.buffers.depth.setTest(!0),P.buffers.depth.setMask(!0),P.buffers.color.setMask(!0),P.setPolygonOffset(!1)}function bt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=De.has(`EXT_color_buffer_half_float`)||De.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new hr(1,1,{generateMipmaps:!0,type:e?Qe:Ge,minFilter:We,samples:Math.max(4,Oe.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:U.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||re;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(oe),se=T.getClearAlpha(),se<1&&T.setClearColor(16777215,.5),T.clear(),we&&Be.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),ve===!0&&Re.setGlobalState(T.clippingPlanes,r),xt(e,n,r),I.updateMultisampleRenderTarget(a),I.updateRenderTargetMipmap(a),De.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,St(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(I.updateMultisampleRenderTarget(a),I.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(oe,se),d!==void 0&&(r.viewport=d),T.toneMapping=u}function xt(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&St(o,t,n,s,l,c)}}function St(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function Ct(e){let t=0;for(let n of e)n.texture!==null&&t++;return t}function wt(e,t,n){t.isScene!==!0&&(t=Ce);let r=F.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=Pe.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=Pe.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Ae.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,ot),l=new Map,r.programs=l,r.programVariants=new Map);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return Dt(e,s),d}else s.uniforms=Pe.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=Pe.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Re.uniform),Dt(e,s),r.needsLights=At(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.numLightProbeGrids=Ct(x.state.lightProbeGridArray),r.currentProgram=d,r.uniformsList=null,d}function Tt(e,t,n,r,i){let a=F.get(e),o=a.currentProgram.id+`,`+r+`,`+i,s=a.programVariants.get(o);return s===void 0?(s=wt(e,t,n),a.programVariants.set(o,s)):(a.currentProgram=s,a.uniformsList=null,a.outputColorSpace=r,a.toneMapping=i),s}function Et(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=Pl.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function Dt(e,t){let n=F.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function Ot(e,t,n,r,i){t.isScene!==!0&&(t=Ce),I.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=M===null?T.outputColorSpace:M.isXRRenderTarget===!0?M.texture.colorSpace:U.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Ae.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(M===null||M.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=F.get(r),b=x.state.lights;if(ve===!0&&(ye===!0||e!==ne)){let t=e===ne&&r.id===te;Re.setState(r,e,t)}let S=!1,C=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==b.state.version||i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?S=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Re.numPlanes||v.numIntersection!==Re.numIntersection)?S=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.morphTargetsCount===_&&v.numLightProbeGrids===Ct(x.state.lightProbeGridArray)?(v.outputColorSpace!==s||v.toneMapping!==h)&&(C=!0):S=!0:S=!0:(S=!0,v.__version=r.version);let w=v.currentProgram;(S===!0||C===!0)&&(w=C===!0?Tt(r,t,i,s,h):wt(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,w,v));let E=!1,O=!1,k=!1,A=w.getUniforms(),j=v.uniforms;if(P.useProgram(w.program)&&(E=!0,O=!0,k=!0),r.id!==te&&(te=r.id,O=!0),E||ne!==e){P.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),A.setValue(N,`projectionMatrix`,e.projectionMatrix),A.setValue(N,`viewMatrix`,e.matrixWorldInverse);let t=A.map.cameraPosition;t!==void 0&&t.setValue(N,xe.setFromMatrixPosition(e.matrixWorld)),Oe.logarithmicDepthBuffer&&A.setValue(N,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&A.setValue(N,`isOrthographic`,e.isOrthographicCamera===!0),ne!==e&&(ne=e,O=!0,k=!0)}if(v.needsLights&&(b.state.sunShadowMap.length>0&&A.setValue(N,`sunShadowMap`,b.state.sunShadowMap,I),b.state.directionalShadowMap.length>0&&A.setValue(N,`directionalShadowMap`,b.state.directionalShadowMap,I),b.state.spotShadowMap.length>0&&A.setValue(N,`spotShadowMap`,b.state.spotShadowMap,I),b.state.pointShadowMap.length>0&&A.setValue(N,`pointShadowMap`,b.state.pointShadowMap,I)),i.isSkinnedMesh){A.setOptional(N,i,`bindMatrix`),A.setOptional(N,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),A.setValue(N,`boneTexture`,e.boneTexture,I))}i.isBatchedMesh&&(A.setOptional(N,i,`batchingTexture`),A.setValue(N,`batchingTexture`,i._matricesTexture,I),A.setOptional(N,i,`batchingIdTexture`),A.setValue(N,`batchingIdTexture`,i._indirectTexture,I),A.setOptional(N,i,`batchingColorTexture`),i._colorsTexture!==null&&A.setValue(N,`batchingColorTexture`,i._colorsTexture,I));let ee=n.morphAttributes;if((ee.position!==void 0||ee.normal!==void 0||ee.color!==void 0)&&Ve.update(i,n,w),(O||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,A.setValue(N,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(j.envMapIntensity.value=t.environmentIntensity),j.dfgLUT!==void 0&&(j.dfgLUT.value=Zu()),O){if(A.setValue(N,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&kt(j,k),a&&r.fog===!0&&Fe.refreshFogUniforms(j,a),Fe.refreshMaterialUniforms(j,r,ue,le,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.numLightProbeGrids>0){let e=y,t=0;for(let n of x.state.lightProbeGridArray)n.texture!==null&&(e.textures[t]=n.texture,e.min[t]=n.boundingBox.min,e.max[t]=n.boundingBox.max,e.resolution[t]=n.resolution,t++);for(let n in e)e[n].length=t;j.probesSH.value=e.textures,j.probesMin.value=e.min,j.probesMax.value=e.max,j.probesResolution.value=e.resolution}Pl.upload(N,Et(v),j,I)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(Pl.upload(N,Et(v),j,I),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&A.setValue(N,`center`,i.center),A.setValue(N,`modelViewMatrix`,i.modelViewMatrix),A.setValue(N,`normalMatrix`,i.normalMatrix),A.setValue(N,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];Ye.update(n,w),Ye.bind(n,w)}}return w}function kt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function At(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return j},this.getActiveMipmapLevel=function(){return ee},this.getRenderTarget=function(){return M},this.setRenderTargetTextures=function(e,t,n){let r=F.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),F.get(e.texture).__webglTexture=t,F.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=F.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){M=e,j=t,ee=n;let r=null,i=!1,a=!1;if(e){let o=F.get(e);if(o.__useDefaultFramebuffer!==void 0){P.bindFramebuffer(N.FRAMEBUFFER,o.__webglFramebuffer),re.copy(e.viewport),ie.copy(e.scissor),ae=e.scissorTest,P.viewport(re),P.scissor(ie),P.setScissorTest(ae),te=-1;return}if(o.__webglFramebuffer===void 0)I.setupRenderTarget(e);else if(o.__hasExternalTextures)I.rebindTextures(e,F.get(e.texture).__webglTexture,F.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&F.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);I.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=F.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&I.useMultisampledRTT(e)===!1?F.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,re.copy(e.viewport),ie.copy(e.scissor),ae=e.scissorTest}else re.copy(pe).multiplyScalar(ue).floor(),ie.copy(me).multiplyScalar(ue).floor(),ae=he;if(n!==0&&(r=O),P.bindFramebuffer(N.FRAMEBUFFER,r)&&P.drawBuffers(e,r),P.viewport(re),P.scissor(ie),P.setScissorTest(ae),i){let r=F.get(e.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=F.get(e.textures[t]);N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=F.get(e.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,t.__webglTexture,n)}te=-1};function jt(e){let t=F.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=Oe.textureFormatReadable(e.format),t.__typeReadable=Oe.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){R(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=F.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){P.bindFramebuffer(N.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+s);let u=jt(o);if(u.__formatReadable===!1){R(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){R(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&N.readPixels(t,n,r,i,Ke.convert(c),Ke.convert(l),a)}finally{let e=M===null?null:F.get(M).__webglFramebuffer;P.bindFramebuffer(N.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=F.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){P.bindFramebuffer(N.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+s);let d=jt(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,f),N.bufferData(N.PIXEL_PACK_BUFFER,a.byteLength,N.STREAM_READ),N.readPixels(t,n,r,i,Ke.convert(l),Ke.convert(u),0),N.bindBuffer(N.PIXEL_PACK_BUFFER,null);let p=M===null?null:F.get(M).__webglFramebuffer;P.bindFramebuffer(N.FRAMEBUFFER,p);let m=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await bn(N,m,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,f),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,a),N.bindBuffer(N.PIXEL_PACK_BUFFER,null),N.deleteBuffer(f),N.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;I.setTexture2D(e,0),N.copyTexSubImage2D(N.TEXTURE_2D,n,0,0,o,s,i,a),P.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=Ke.convert(t.format),_=Ke.convert(t.type),v;t.isData3DTexture?(I.setTexture3D(t,0),v=N.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(I.setTexture2DArray(t,0),v=N.TEXTURE_2D_ARRAY):(I.setTexture2D(t,0),v=N.TEXTURE_2D),P.activeTexture(N.TEXTURE0),P.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,t.flipY),P.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),P.pixelStorei(N.UNPACK_ALIGNMENT,t.unpackAlignment);let y=P.getParameter(N.UNPACK_ROW_LENGTH),b=P.getParameter(N.UNPACK_IMAGE_HEIGHT),x=P.getParameter(N.UNPACK_SKIP_PIXELS),S=P.getParameter(N.UNPACK_SKIP_ROWS),C=P.getParameter(N.UNPACK_SKIP_IMAGES);P.pixelStorei(N.UNPACK_ROW_LENGTH,h.width),P.pixelStorei(N.UNPACK_IMAGE_HEIGHT,h.height),P.pixelStorei(N.UNPACK_SKIP_PIXELS,l),P.pixelStorei(N.UNPACK_SKIP_ROWS,u),P.pixelStorei(N.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=F.get(e),r=F.get(t),h=F.get(n.__renderTarget),g=F.get(r.__renderTarget);P.bindFramebuffer(N.READ_FRAMEBUFFER,h.__webglFramebuffer),P.bindFramebuffer(N.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,F.get(e).__webglTexture,i,d+n),N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,F.get(t).__webglTexture,a,m+n)),N.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,N.DEPTH_BUFFER_BIT,N.NEAREST);P.bindFramebuffer(N.READ_FRAMEBUFFER,null),P.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||F.has(e)){let n=F.get(e),r=F.get(t);P.bindFramebuffer(N.READ_FRAMEBUFFER,k),P.bindFramebuffer(N.DRAW_FRAMEBUFFER,A);for(let e=0;e<c;e++)w?N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):N.framebufferTexture2D(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,n.__webglTexture,i),T?N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):N.framebufferTexture2D(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,r.__webglTexture,a),i===0?T?N.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):N.copyTexSubImage2D(v,a,f,p,l,u,o,s):N.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,N.COLOR_BUFFER_BIT,N.NEAREST);P.bindFramebuffer(N.READ_FRAMEBUFFER,null),P.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?N.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?N.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):N.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):N.texSubImage2D(N.TEXTURE_2D,a,f,p,o,s,g,_,h);P.pixelStorei(N.UNPACK_ROW_LENGTH,y),P.pixelStorei(N.UNPACK_IMAGE_HEIGHT,b),P.pixelStorei(N.UNPACK_SKIP_PIXELS,x),P.pixelStorei(N.UNPACK_SKIP_ROWS,S),P.pixelStorei(N.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps===!0&&t.mipmapsAutoUpdate===!0&&N.generateMipmap(v),P.unbindTexture()},this.initRenderTarget=function(e){F.get(e).__webglFramebuffer===void 0&&I.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?I.setTextureCube(e,0):e.isData3DTexture?I.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?I.setTexture2DArray(e,0):I.setTexture2D(e,0),P.unbindTexture()},this.resetState=function(){j=0,ee=0,M=null,P.reset(),qe.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return dn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=U._getDrawingBufferColorSpace(e),t.unpackColorSpace=U._getUnpackColorSpace()}},$u={type:`change`},ed={type:`start`},td={type:`end`},nd=new oa,rd=new $i,id=Math.cos(70*Yn.DEG2RAD),ad=new V,od=2*Math.PI,q={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},sd=1e-6,cd=class extends Bs{constructor(e,t=null){super(e,t),this.state=q.NONE,this.target=new V,this.cursor=new V,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:`ArrowLeft`,UP:`ArrowUp`,RIGHT:`ArrowRight`,BOTTOM:`ArrowDown`},this.mouseButtons={LEFT:Pe.ROTATE,MIDDLE:Pe.DOLLY,RIGHT:Pe.PAN},this.touches={ONE:Fe.ROTATE,TWO:Fe.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle=`auto`,this._domElementKeyEvents=null,this._lastPosition=new V,this._lastQuaternion=new Xn,this._lastTargetPosition=new V,this._quat=new Xn().setFromUnitVectors(e.up,new V(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Rs,this._sphericalDelta=new Rs,this._scale=1,this._panOffset=new V,this._rotateStart=new B,this._rotateEnd=new B,this._rotateDelta=new B,this._panStart=new B,this._panEnd=new B,this._panDelta=new B,this._dollyStart=new B,this._dollyEnd=new B,this._dollyDelta=new B,this._dollyDirection=new V,this._mouse=new B,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=ud.bind(this),this._onPointerDown=ld.bind(this),this._onPointerUp=dd.bind(this),this._onContextMenu=vd.bind(this),this._onMouseWheel=md.bind(this),this._onKeyDown=hd.bind(this),this._onTouchStart=gd.bind(this),this._onTouchMove=_d.bind(this),this._onMouseDown=fd.bind(this),this._onMouseMove=pd.bind(this),this._interceptControlDown=yd.bind(this),this._interceptControlUp=bd.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e===`grab`?this.domElement.style.cursor=`grab`:this.domElement.style.cursor=`auto`}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener(`pointerdown`,this._onPointerDown),this.domElement.addEventListener(`pointercancel`,this._onPointerUp),this.domElement.addEventListener(`contextmenu`,this._onContextMenu),this.domElement.addEventListener(`wheel`,this._onMouseWheel,{passive:!1}),this.domElement.ownerDocument.addEventListener(`keydown`,this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction=`none`}disconnect(){this.state=q.NONE,this.domElement.removeEventListener(`pointerdown`,this._onPointerDown),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.domElement.removeEventListener(`pointercancel`,this._onPointerUp),this.domElement.removeEventListener(`wheel`,this._onMouseWheel),this.domElement.removeEventListener(`contextmenu`,this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.ownerDocument.removeEventListener(`keydown`,this._interceptControlDown,{capture:!0}),this.domElement.ownerDocument.removeEventListener(`keyup`,this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction=``,this.domElement.style.cursor=`auto`}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent($u),this.update(),this.state=q.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;ad.copy(t).sub(this.target),ad.applyQuaternion(this._quat),this._spherical.setFromVector3(ad),this.autoRotate&&this.state===q.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(n)&&isFinite(r)&&(n<-Math.PI?n+=od:n>Math.PI&&(n-=od),r<-Math.PI?r+=od:r>Math.PI&&(r-=od),n<=r?this._spherical.theta=Math.max(n,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+r)/2?Math.max(n,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let i=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let e=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),i=e!=this._spherical.radius}if(ad.setFromSpherical(this._spherical),ad.applyQuaternion(this._quatInverse),t.copy(this.target).add(ad),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let e=null;if(this.object.isPerspectiveCamera){let t=ad.length();e=this._clampDistance(t*this._scale);let n=t-e;this.object.position.addScaledVector(this._dollyDirection,n),this.object.updateMatrixWorld(),i=!!n}else if(this.object.isOrthographicCamera){let t=new V(this._mouse.x,this._mouse.y,0);t.unproject(this.object);let n=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),i=n!==this.object.zoom;let r=new V(this._mouse.x,this._mouse.y,0);r.unproject(this.object),this.object.position.sub(r).add(t),this.object.updateMatrixWorld(),e=ad.length()}else console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.`),this.zoomToCursor=!1;e!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(e).add(this.object.position):(nd.origin.copy(this.object.position),nd.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(nd.direction))<id?this.object.lookAt(this.target):(rd.setFromNormalAndCoplanarPoint(this.object.up,this.target),nd.intersectPlane(rd,this.target))))}else if(this.object.isOrthographicCamera){let e=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),e!==this.object.zoom&&(this.object.updateProjectionMatrix(),i=!0)}return this._scale=1,this._performCursorZoom=!1,i||this._lastPosition.distanceToSquared(this.object.position)>sd||8*(1-this._lastQuaternion.dot(this.object.quaternion))>sd||this._lastTargetPosition.distanceToSquared(this.target)>sd?(this.dispatchEvent($u),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e===null?od/60/60*this.autoRotateSpeed:od/60*this.autoRotateSpeed*e}_getZoomScale(e){let t=Math.abs(e*.01);return .95**(this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){ad.setFromMatrixColumn(t,0),ad.multiplyScalar(-e),this._panOffset.add(ad)}_panUp(e,t){this.screenSpacePanning===!0?ad.setFromMatrixColumn(t,1):(ad.setFromMatrixColumn(t,0),ad.crossVectors(this.object.up,ad)),ad.multiplyScalar(e),this._panOffset.add(ad)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;ad.copy(r).sub(this.target);let i=ad.length();i*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*i/n.clientHeight,this.object.matrix),this._panUp(2*t*i/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.`),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),r=e-n.left,i=t-n.top,a=n.width,o=n.height;this._mouse.x=r/a*2-1,this._mouse.y=-(i/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientY),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(od*this._rotateDelta.x/t.clientHeight),this._rotateUp(od*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.zoomToCursor&&(this._performCursorZoom=!0,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(od*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-od*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(od*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-od*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(n,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(n,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyStart.set(0,i)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateEnd.set(n,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(od*this._rotateDelta.x/t.clientHeight),this._rotateUp(od*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(n,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyEnd.set(0,i),this._dollyDelta.set(0,(this._dollyEnd.y/this._dollyStart.y)**+this.zoomSpeed),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new B,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function ld(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.addEventListener(`pointerup`,this._onPointerUp)),this._isTrackingPointer(e)||(this._addPointer(e),e.pointerType===`touch`?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grabbing`)))}function ud(e){this.enabled!==!1&&(e.pointerType===`touch`?this._onTouchMove(e):this._onMouseMove(e))}function dd(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.dispatchEvent(td),this.state=q.NONE,this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grab`);break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y})}}function fd(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Pe.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=q.DOLLY;break;case Pe.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=q.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=q.ROTATE}break;case Pe.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=q.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=q.PAN}break;default:this.state=q.NONE}this.state!==q.NONE&&this.dispatchEvent(ed)}function pd(e){switch(this.state){case q.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case q.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case q.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e)}}function md(e){this.enabled!==!1&&this.enableZoom!==!1&&this.state===q.NONE&&(e.preventDefault(),this.dispatchEvent(ed),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(td))}function hd(e){this.enabled!==!1&&this._handleKeyDown(e)}function gd(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case Fe.ROTATE:if(this.enableRotate===!1){this.state=q.NONE;break}this._handleTouchStartRotate(e),this.state=q.TOUCH_ROTATE;break;case Fe.PAN:if(this.enablePan===!1){this.state=q.NONE;break}this._handleTouchStartPan(e),this.state=q.TOUCH_PAN;break;default:this.state=q.NONE}break;case 2:switch(this.touches.TWO){case Fe.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=q.TOUCH_DOLLY_PAN;break;case Fe.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=q.TOUCH_DOLLY_ROTATE;break;default:this.state=q.NONE}break;default:this.state=q.NONE}this.state!==q.NONE&&this.dispatchEvent(ed)}function _d(e){switch(this._trackPointer(e),this.state){case q.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case q.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case q.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case q.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=q.NONE}}function vd(e){this.enabled!==!1&&e.preventDefault()}function yd(e){e.key===`Control`&&(this._controlActive=!0,this.domElement.ownerDocument.addEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}function bd(e){e.key===`Control`&&(this._controlActive=!1,this.domElement.ownerDocument.removeEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}var xd=class extends Gr{constructor(e=document.createElement(`div`)){super(),this.isCSS2DObject=!0,this.element=e,this.element.style.position=`absolute`,this.element.style.userSelect=`none`,this.element.setAttribute(`draggable`,!1),this.center=new B(.5,.5),this.rotation2D=0,this.addEventListener(`removed`,function(){this.traverse(function(e){e.element&&e.element instanceof e.element.ownerDocument.defaultView.Element&&e.element.parentNode!==null&&e.element.remove()})})}copy(e,t){return super.copy(e,t),this.element=e.element.cloneNode(!0),this.center=e.center,this.rotation2D=e.rotation2D,this}},Sd=new V,Cd=new vr,wd=new vr,Td=new V,Ed=new V,Dd=class{constructor(e={}){let t=this,n,r,i,a,o={objects:new WeakMap},s=e.element===void 0?document.createElement(`div`):e.element;s.style.overflow=`hidden`,this.domElement=s,this.sortObjects=!0,this.getSize=function(){return{width:n,height:r}},this.render=function(e,t){e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),Cd.copy(t.matrixWorldInverse),wd.multiplyMatrices(t.projectionMatrix,Cd),l(e,e,t),this.sortObjects&&f(e)},this.setSize=function(e,t){n=e,r=t,i=n/2,a=r/2,s.style.width=e+`px`,s.style.height=t+`px`};function c(e){e.isCSS2DObject&&(e.element.style.display=`none`);for(let t=0,n=e.children.length;t<n;t++)c(e.children[t])}function l(e,n,r){if(e.visible===!1)c(e);else{if(e.isCSS2DObject){Sd.setFromMatrixPosition(e.matrixWorld),Sd.applyMatrix4(wd);let c=Sd.z>=-1&&Sd.z<=1&&e.layers.test(r.layers)===!0,l=e.element;if(l.style.display=c===!0?``:`none`,c===!0){e.onBeforeRender(t,n,r);let o=100*e.center.x,c=100*e.center.y;l.style.transformOrigin=`${o}% ${c}%`;let u=-e.rotation2D,d=Sd.x*i+i,f=-Sd.y*a+a;l.style.transform=`translate(${-o}%, ${-c}%) translate(${d}px, ${f}px) rotate(${u}rad)`,l.parentNode!==s&&s.appendChild(l),e.onAfterRender(t,n,r)}let d={distanceToCameraSquared:u(r,e)};o.objects.set(e,d)}for(let t=0,i=e.children.length;t<i;t++)l(e.children[t],n,r)}}function u(e,t){return Td.setFromMatrixPosition(e.matrixWorld),Ed.setFromMatrixPosition(t.matrixWorld),Td.distanceToSquared(Ed)}function d(e){let t=[];return e.traverseVisible(function(e){e.isCSS2DObject&&t.push(e)}),t}function f(e){let t=d(e).sort(function(e,t){return e.renderOrder===t.renderOrder?o.objects.get(e).distanceToCameraSquared-o.objects.get(t).distanceToCameraSquared:t.renderOrder-e.renderOrder}),n=t.length;for(let e=0,r=t.length;e<r;e++)t[e].element.style.zIndex=n-e}}},J={time:{value:0},hfog:{value:new pr(-.05,1,.5,0)},mirror:{value:new V(1.6,3.2,9)},water:{value:new pr(.035,1.2,.5,0)},waterTint:{value:new W(16777215)},reveal:{value:new pr(0,0,1,0)},play:{value:new pr(0,0,0,.12)}};function Od(e,t){let n=e.userData.patches??=[];return n.some(e=>e.key===t.key)||(n.push(t),n.sort((e,t)=>Number(!!e.last)-Number(!!t.last)),e.onBeforeCompile=e=>n.forEach(t=>t.fn(e)),e.customProgramCacheKey=()=>n.map(e=>e.key).join(`+`),e.needsUpdate=!0),e}var kd=`
{
  vec4 wpFog = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
    wpFog = instanceMatrix * wpFog;
  #endif
  vWPos = ( modelMatrix * wpFog ).xyz;
}`;function Ad(e){e.vertexShader.includes(`varying vec3 vWPos;`)||(e.vertexShader=e.vertexShader.replace(`#include <fog_pars_vertex>`,`#include <fog_pars_vertex>
varying vec3 vWPos;`).replace(`#include <fog_vertex>`,`#include <fog_vertex>
`+kd),e.fragmentShader=e.fragmentShader.replace(`#include <fog_pars_fragment>`,`#include <fog_pars_fragment>
varying vec3 vWPos;`))}var jd=`
float fgHash( vec2 p ) {
  vec3 p3 = fract( vec3( p.xyx ) * 0.1031 );
  p3 += dot( p3, p3.yzx + 33.33 );
  return fract( ( p3.x + p3.y ) * p3.z );
}
float fgNoise( vec2 p ) {
  vec2 i = floor( p );
  vec2 f = fract( p );
  vec2 u = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( fgHash( i ), fgHash( i + vec2( 1.0, 0.0 ) ), u.x ),
              mix( fgHash( i + vec2( 0.0, 1.0 ) ), fgHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y );
}
float fgFbm( vec2 p, float ph, float seed ) {
  vec2 o1 = 0.9 * vec2( cos( ph + seed ), sin( ph + seed ) );
  vec2 o2 = 0.7 * vec2( cos( -ph + seed * 1.7 ), sin( -ph + seed * 1.7 ) );
  vec2 o3 = 0.5 * vec2( cos( 2.0 * ph + seed * 2.3 ), sin( 2.0 * ph + seed * 2.3 ) );
  float a = 0.55 * fgNoise( p + o1 + seed * 7.13 );
  a += 0.30 * fgNoise( p * 2.03 + o2 + 3.7 );
  a += 0.15 * fgNoise( p * 4.11 + o3 + 9.2 );
  return a;
}
`;function Md(e){return Od(e,{key:`hfog`,last:!0,fn:e=>{Ad(e),e.uniforms.uHFog=J.hfog,e.uniforms.uFogT=J.time,e.uniforms.uPlay=J.play,e.uniforms.uReveal=J.reveal,e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
uniform vec4 uReveal;`).replace(`#include <project_vertex>`,`vec4 rvW = vec4( transformed, 1.0 );
          #ifdef USE_INSTANCING
            rvW = instanceMatrix * rvW;
          #endif
          rvW = modelMatrix * rvW;
          if ( uReveal.w > 0.5 && uReveal.x < 0.5 ) {
            float rvP = clamp( ( uReveal.y - rvW.x ) / uReveal.z, 0.0, 1.0 );
            float rvS = rvP <= 0.0 ? 0.0 : 1.0 - exp( -5.5 * rvP ) * cos( 10.0 * rvP );
            rvW.y *= rvS;
          }
          vec4 mvPosition = viewMatrix * rvW;
          gl_Position = projectionMatrix * mvPosition;`),e.fragmentShader=e.fragmentShader.replace(`#include <fog_pars_fragment>`,`#include <fog_pars_fragment>
uniform vec4 uHFog;
uniform float uFogT;
uniform vec4 uPlay;
uniform vec4 uReveal;
`+jd).replace(`#include <fog_fragment>`,`// parts of the time axis the reveal front has not reached yet are not there at all
          if ( uReveal.w > 0.5 && ( uReveal.x < 0.5 ? vWPos.x : vWPos.y ) > uReveal.y ) discard;
          // what the playhead has not reached yet is nearly grey, so you see where it came from and where it goes
          if ( uPlay.z > 0.5 ) {
            float plC = uPlay.x < 0.5 ? vWPos.x : vWPos.y;
            float ahead = smoothstep( uPlay.y, uPlay.y + uPlay.w, plC );
            float lum = dot( gl_FragColor.rgb, vec3( 0.299, 0.587, 0.114 ) );
            gl_FragColor.rgb = mix( gl_FragColor.rgb, mix( vec3( lum ), gl_FragColor.rgb, 0.2 ) * 0.9, ahead );
          }
          #ifdef USE_FOG
            #ifdef FOG_EXP2
              float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
            #else
              float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
            #endif
            float fgPh = 6.2831853 * uFogT / ${60 .toFixed(1)};
            float fgN = fgFbm( vWPos.xz * 0.22 + vWPos.y * vec2( 0.45, -0.3 ), fgPh, 0.0 );
            float fgTop = max( uHFog.y * ( 0.7 + 0.7 * fgN ), uHFog.x + 0.02 );
            float hFog = ( 1.0 - smoothstep( uHFog.x, fgTop, vWPos.y ) ) * uHFog.z * ( 0.6 + 0.8 * fgN );
            fogFactor += ( fgN - 0.5 ) * 0.8 * fogFactor * ( 1.0 - fogFactor );
            fogFactor = clamp( max( fogFactor, hFog ), 0.0, 1.0 );
            gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
          #endif`)}}),e}function Nd(e){return e.transparent=!0,Od(e,{key:`mirror`,fn:e=>{Ad(e),e.uniforms.uMirror=J.mirror,e.fragmentShader=e.fragmentShader.replace(`#include <fog_pars_fragment>`,`#include <fog_pars_fragment>
uniform vec3 uMirror;`).replace(`#include <fog_fragment>`,`{
            float dep = max( 0.0, -vWPos.y );
            float k = smoothstep( 0.0, uMirror.x, dep );
            if ( fract( vWPos.x * uMirror.z ) > mix( 1.01, 0.12, k ) ) discard;
            gl_FragColor.a *= ( 1.0 - k ) * 0.85;
          }
          #include <fog_fragment>`)}}),e}function Pd(e){return e.transparent=!0,Od(e,{key:`mirrorLines`,fn:e=>{Ad(e),e.uniforms.uMirror=J.mirror,e.fragmentShader=e.fragmentShader.replace(`#include <fog_pars_fragment>`,`#include <fog_pars_fragment>
uniform vec3 uMirror;`).replace(`#include <fog_fragment>`,`{
            float dep = max( 0.0, -vWPos.y );
            gl_FragColor.a *= smoothstep( 0.0, uMirror.x * 0.6, dep ) * ( 1.0 - smoothstep( uMirror.x * 0.5, uMirror.y, dep ) );
          }
          #include <fog_fragment>`)}}),e}function Fd(e){return Od(e,{key:`water`,fn:e=>{Ad(e),e.uniforms.uTime=J.time,e.uniforms.uWater=J.water,e.uniforms.uWaterTint=J.waterTint;let t=`( 6.2831853 * uTime / ${12 .toFixed(1)} )`;e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
uniform float uTime;
uniform vec4 uWater;`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
          {
            float wPh = ${t};
            transformed.y += uWater.x * 0.45 * ( sin( position.x * 1.7 + wPh ) * cos( position.z * 1.3 - wPh )
                          + 0.4 * sin( ( position.x - position.z ) * 2.6 + 2.0 * wPh ) );
          }`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
          uniform float uTime;
          uniform vec4 uWater;
          uniform vec3 uWaterTint;
          // a soft web of light from warped, overlapping sine ridges, each layer circling once per period
          float caustic( vec2 p, float ph ) {
            float c = 0.0;
            for ( int n = 0; n < 3; n++ ) {
              float fn = float( n );
              float dir = n == 1 ? -1.0 : 1.0;
              vec2 q = p * ( 1.2 + fn * 0.55 ) + 0.6 * vec2( cos( dir * ph + fn * 2.1 ), sin( dir * ph + fn * 2.1 ) );
              q += 0.55 * vec2( sin( q.y * 1.5 + ph ), cos( q.x * 1.2 - ph ) );
              float v = abs( sin( q.x ) + sin( q.y ) );
              c += pow( 1.0 - min( 1.0, v * 0.6 ), 3.0 );
            }
            return c / 3.0;
          }`).replace(`#include <color_fragment>`,`#include <color_fragment>
          {
            // water blues in linear space: deep blue #123f7a in the valleys, light cyan #9fe3ef on the crests
            float crest = smoothstep( 0.0, max( uWater.y, 0.01 ), vWPos.y );
            vec3 wCol = mix( vec3( 0.0065, 0.050, 0.195 ), vec3( 0.347, 0.768, 0.863 ), crest );
            diffuseColor.rgb = mix( diffuseColor.rgb, wCol, clamp( uWater.z, 0.0, 1.0 ) );
          }`).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
          {
            float cs = caustic( vWPos.xz * 1.1, ${t} );
            vec3 cCol = mix( vec3( 0.85, 0.97, 1.0 ), uWaterTint, 0.3 );
            totalEmissiveRadiance += cCol * cs * ( 0.18 + 0.12 * smoothstep( 0.0, max( uWater.y, 0.01 ), vWPos.y ) );
          }`)}}),e}var Id=[{id:`classic`,name:`Classic`,ramp:[`#27404a`,`#3a7686`,`#4bacb0`,`#b4e2d0`,`#fcfced`],bg:`#050b10`,fog:`#0b1e26`,accent:`#a6dcff`,accent2:`#56c8ff`,paint:[`#ffb020`,`#ff6b6b`,`#c58cff`,`#ffe066`,`#ff8fc8`,`#7d8bff`,`#e0b98c`],light:!1},{id:`glacier`,name:`Glacier`,ramp:[`#1f2550`,`#33489a`,`#6f86dc`,`#b9aef2`,`#fadcec`],bg:`#0a0d22`,fog:`#323d73`,accent:`#aebaff`,accent2:`#f7c8e4`,paint:[`#ffc46b`,`#ff7f6e`,`#6fe3f0`,`#ff9ed2`,`#fff0a0`,`#f2a65a`,`#c9a0ff`],light:!1},{id:`lagoon`,name:`Lagoon`,ramp:[`#17304f`,`#1e6782`,`#40a89e`,`#f6c99a`,`#ff7650`],bg:`#081a2a`,fog:`#24546a`,accent:`#ffc7a3`,accent2:`#7fd6e3`,paint:[`#ffd166`,`#ef476f`,`#a78bfa`,`#f7f3e3`,`#ff9f68`,`#5ec8ff`,`#ff8fc8`],light:!1},{id:`plum`,name:`Plum`,ramp:[`#341a44`,`#6e3f7c`,`#b8638f`,`#eea0b2`,`#fbe3ea`],bg:`#1a0c20`,fog:`#3c2148`,accent:`#f6b3c6`,accent2:`#7fdcf0`,paint:[`#6fe4f5`,`#ffe08a`,`#4a8cff`,`#ff4d5e`,`#b9f0ff`,`#ff9b54`,`#c7a6ff`],light:!1},{id:`horizon`,name:`Horizon`,ramp:[`#33377a`,`#454a96`,`#6668b2`,`#cbc6ee`,`#ffffff`],bg:`#4a63ff`,fog:`#ff8c55`,accent:`#ff8a4c`,accent2:`#6f86ff`,sky:[[0,`#4a63ff`],[.3,`#9a78d8`],[.6,`#ff9a6a`],[1,`#ff6b1f`]],paint:[`#3fe0ff`,`#ffd23f`,`#ff4fa0`,`#b6ff5c`,`#b48cff`,`#5cf2c0`,`#ff7a2f`],light:!0},{id:`dawn`,name:`Dawn`,ramp:[`#e9c9a8`,`#c7b3b8`,`#8ea2b8`,`#4f6688`,`#2c3a5c`],bg:`#f4ece2`,fog:`#ecd3bb`,accent:`#f2b27e`,accent2:`#8ea2c8`,paint:[`#e8553f`,`#2a9d8f`,`#f2a516`,`#7b4fbf`,`#d6336c`,`#1d70a2`,`#8c6d46`],light:!0}],Ld={l1:`plum`,l2:`horizon`,l3:`dawn`,l4:`glacier`,l5:`lagoon`},Rd=Id.find(e=>e.id===`glacier`),zd=e=>Id.find(t=>t.id===e)??Rd;function Bd(e){let t=document.documentElement.style;t.setProperty(`--accent`,e.accent),t.setProperty(`--accent-2`,e.accent2)}function Vd(e,t){let n=Object.keys(x),r=[...new Set(t.filter(e=>e in x))];for(let e of n)r.includes(e)||r.push(e);r.forEach((t,n)=>{x[t].color=e.paint[n%e.paint.length]})}function Hd(e,t=4){let n=Math.min(.49,Math.max(0,e)*.45),r=[{half:.5,drop:1/0}];for(let e=0;e<=t;e++){let i=e/t*(Math.PI/2);r.push({half:.5-n*(1-Math.cos(i)),drop:n*(1-Math.sin(i))})}let i=[],a=[],o=[],s=[[-1,-1],[1,-1],[1,1],[-1,1]];for(let e=0;e<4;e++){let[t,n]=s[e],[c,l]=s[(e+1)%4],u=i.length/3;r.forEach(e=>{let r=e.drop===1/0?0:1-e.drop;i.push(t*e.half,r,n*e.half,c*e.half,r,l*e.half);let o=e.drop===1/0?-1:e.drop;a.push(o,o)});for(let e=0;e<r.length-1;e++){let t=u+e*2;o.push(t,t+2,t+1,t+1,t+2,t+3)}}let c=r[r.length-1].half,l=i.length/3;for(let[e,t]of s)i.push(e*c,1,t*c),a.push(0);o.push(l,l+2,l+1,l,l+3,l+2);let u=new Yi;u.setAttribute(`position`,new Li(i,3)),u.setIndex(o),u.computeVertexNormals();let d=u.getAttribute(`normal`);for(let e=0;e<d.count;e++){let t=i[e*3],n=i[e*3+2];d.getX(e)*t+d.getZ(e)*n<-1e-4&&d.getY(e)<.99&&d.setXYZ(e,-d.getX(e),-d.getY(e),-d.getZ(e))}let f=u.getAttribute(`position`);for(let e=0;e<f.count;e++){let t=a[e];f.setY(e,t<0?0:1),a[e]=Math.max(0,t)}return u.setAttribute(`aBevel`,new Li(a,1)),u}function Ud(e){let t=e.onBeforeCompile,n=e.customProgramCacheKey?.bind(e);return e.onBeforeCompile=(n,r)=>{t?.call(e,n,r),n.vertexShader=n.vertexShader.replace(`#include <common>`,`#include <common>
attribute float aBevel;`).replace(`#include <beginnormal_vertex>`,`#include <beginnormal_vertex>
        #ifdef USE_INSTANCING
          // three divides instanced normals by the scale; pre-multiplying keeps the true bevel normal
          objectNormal *= vec3( length( instanceMatrix[0].xyz ), length( instanceMatrix[1].xyz ), length( instanceMatrix[2].xyz ) );
        #endif`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
        #ifdef USE_INSTANCING
          float pW = length( instanceMatrix[0].xyz );
          float pH = max( 1e-4, length( instanceMatrix[1].xyz ) );
          transformed.y = max( 0.0, transformed.y - aBevel * pW / pH );
        #endif`)},e.customProgramCacheKey=()=>(n?n():``)+`+pillar`,e.needsUpdate=!0,e}var Wd={style:`rings`,bowl:.35,radius:7,inner:.6},Gd=2.4,Kd=17e4,qd=256,Jd=Math.sin(21*Math.PI/180),Yd=class{object=new Kr;ctx;style;bowl;radius;inner;T=0;N=0;res=0;sT=1;sK=1;nT=0;nK=0;tc=new Float32Array;kc=new Float32Array;tn=new Float32Array;fn=new Float32Array;h=new Float32Array;col=new Float32Array;A=0;sj=new Int32Array;cs=new Float32Array;sn=new Float32Array;rho=new Float32Array;lut=new Float32Array(qd*3);lutTheme=null;pick={pos:new Float32Array,t:new Float32Array,k:new Float32Array,count:0};geo=null;mesh=null;mat=null;constructor(e){this.ctx=e,this.style=Wd.style,this.bowl=Wd.bowl,this.radius=Wd.radius,this.inner=Wd.inner,this.object.name=`disc`,this.build(e),this.update(e,!0)}get polar(){return this.style!==`ridges`}build(e){this.clearMesh();let t=this.T=e.frames,n=this.N=e.nBins;this.res=e.res;let r=Math.max(.05,Math.min(1,e.res)),i=this.sT=Math.max(1,Math.round(1.2/r)),a=this.nT=Math.ceil(t/i),o=this.style===`dots`?Math.max(1,Math.round(1/r)):1,s=e=>{let t=Math.ceil(n/e),r=this.polar?2*(t-1):t;return a*r*(this.style===`sheets`?2:1)};for(;o<16&&s(o)>Kd;)o++;this.sK=o;let c=this.nK=Math.ceil(n/o);this.tc=new Float32Array(a),this.kc=new Float32Array(c),this.tn=new Float32Array(a),this.fn=new Float32Array(c);let l=e.WORLD_W,u=e.WORLD_D;for(let n=0;n<a;n++)this.tc[n]=Math.min(t-1,n*i+(i-1)/2),this.tn[n]=Qd((e.xOfFrame(this.tc[n])+l/2)/l);for(let t=0;t<c;t++)this.kc[t]=Math.min(n-1,t*o+(o-1)/2),this.fn[t]=Qd((u/2-e.zOfHz(this.kc[t]*e.BIN_HZ))/u);this.h=new Float32Array(a*c),this.col=new Float32Array(a*c*3);let d=this.A=this.polar?Math.max(1,2*(c-1)):c;this.sj=new Int32Array(d),this.cs=new Float32Array(d),this.sn=new Float32Array(d);for(let e=0;e<d;e++){let t=e<c,n=t?e:2*c-2-e;this.sj[e]=n;let r=t?this.fn[n]*Math.PI:2*Math.PI-this.fn[n]*Math.PI;this.cs[e]=Math.cos(r),this.sn[e]=Math.sin(r)}let f=a*d;this.rho=new Float32Array(f);let p=new Float32Array(f),m=new Float32Array(f);for(let e=0;e<a;e++)for(let t=0;t<d;t++)p[e*d+t]=this.tc[e],m[e*d+t]=this.kc[this.sj[t]];this.pick={pos:new Float32Array(f*3),t:p,k:m,count:f};let h=this.style===`sheets`?2*f:f,g=new Yi;g.setAttribute(`position`,new Pi(new Float32Array(h*3),3)),g.setAttribute(`color`,new Pi(new Float32Array(h*3),3));let _,v;if(this.style===`dots`)v=e.fog(new Za({vertexColors:!0,size:2.5,sizeAttenuation:!1})),_=new no(g,v);else if(this.style===`sheets`){let t=new Uint32Array(a*d*6),n=0;for(let e=0;e<a;e++)for(let r=0;r<d;r++){let i=e*d+r,a=e*d+(r+1)%d,o=2*i,s=o+1,c=2*a,l=c+1;t[n++]=o,t[n++]=c,t[n++]=s,t[n++]=s,t[n++]=c,t[n++]=l}g.setIndex(new Pi(t,1)),v=e.fog(new Ao({vertexColors:!0,roughness:.6,metalness:.05,side:2})),_=new ya(g,v)}else{let t=this.style===`rings`?d:d-1,n=new Uint32Array(a*t*2),r=0;for(let e=0;e<a;e++)for(let i=0;i<t;i++)n[r++]=e*d+i,n[r++]=e*d+(i+1)%d;g.setIndex(new Pi(n,1)),v=e.fog(new Ra({vertexColors:!0})),_=new Xa(g,v)}_.frustumCulled=!1,this.object.add(_),this.geo=g,this.mesh=_,this.mat=v}clearMesh(){this.mesh&&this.object.remove(this.mesh),this.geo?.dispose(),this.mat?.dispose(),this.geo=null,this.mesh=null,this.mat=null}pool(e,t){let{heights:n,colors:r}=e,i=this.N;for(let e=0;e<this.nT;e++){let a=e*this.sT,o=Math.min(this.T,a+this.sT);for(let s=0;s<this.nK;s++){let c=s*this.sK,l=Math.min(i,c+this.sK),u=0,d=0,f=0,p=0,m=0;for(let e=a;e<o;e++)for(let t=c;t<l;t++){let a=e*i+t,o=n[a];o>u&&(u=o);let s=o+.05;d+=r[a*3]*s,f+=r[a*3+1]*s,p+=r[a*3+2]*s,m+=s}let h=e*this.nK+s;t&&(this.h[h]=u);let g=m>0?1/m:0;this.col[h*3]=d*g,this.col[h*3+1]=f*g,this.col[h*3+2]=p*g}}}ensureLut(e){if(this.lutTheme===e)return;this.lutTheme=e;let t=e.ramp.map(e=>new W(e));for(let e=0;e<qd;e++){let n=e/255*(t.length-1),r=Math.min(t.length-2,Math.floor(n)),i=n-r,a=t[r],o=t[r+1];this.lut[e*3]=a.r+(o.r-a.r)*i,this.lut[e*3+1]=a.g+(o.g-a.g)*i,this.lut[e*3+2]=a.b+(o.b-a.b)*i}}place(e,t,n,r,i){let a=this.ctx.axis,o=n/this.ctx.WORLD_H*Gd*a.a;if(this.polar){let n=this.inner+e*this.radius*a.t,s=n/(this.inner+this.radius),c=o+this.bowl*this.radius*s*s;if(r>=0)return i.set(n*this.cs[r],c,n*this.sn[r]);let l=t*Math.PI;return i.set(n*Math.cos(l),c,n*Math.sin(l))}let s=2*e-1,c=2*t-1,l=s*Math.sqrt(Math.max(0,1-c*c/2))*this.radius*a.t,u=-c*Math.sqrt(Math.max(0,1-s*s/2))*this.radius*a.f,d=Math.hypot(l,u)/this.radius;return i.set(l,o+this.bowl*this.radius*d*d,u)}update(e,t){if(this.ctx=e,(e.frames!==this.T||e.nBins!==this.N||e.res!==this.res)&&(this.build(e),t=!0),!this.geo)return;this.pool(e,t),this.ensureLut(e.theme);let n=this.A,r=this.nK,i=this.style===`sheets`,a=this.geo.getAttribute(`position`),o=this.geo.getAttribute(`color`),s=a.array,c=o.array,l=this.pick.pos,u=this.rho;if(t){let t=Xd,o=e.axis,c=this.polar?this.inner+this.radius*o.t:this.radius*Math.max(o.t,o.f,.001);for(let e=0;e<this.nT;e++){let a=this.tn[e];for(let o=0;o<n;o++){let d=this.sj[o],f=e*n+o;if(this.place(a,this.fn[d],this.h[e*r+d],this.polar?o:-1,t),l[f*3]=t.x,l[f*3+1]=t.y,l[f*3+2]=t.z,u[f]=this.polar?a:Math.min(1,Math.hypot(t.x,t.z)/c),i){let e=this.place(a,this.fn[d],0,o,Zd).y;s[f*6]=t.x,s[f*6+1]=e,s[f*6+2]=t.z,s[f*6+3]=t.x,s[f*6+4]=t.y,s[f*6+5]=t.z}else s[f*3]=t.x,s[f*3+1]=t.y,s[f*3+2]=t.z}}a.needsUpdate=!0,i&&this.geo.computeVertexNormals()}let d=this.lut,f=i?.22:.3;for(let e=0;e<this.nT;e++)for(let t=0;t<n;t++){let a=e*n+t,o=(e*r+this.sj[t])*3,s=Math.round(Qd(.82-.55*u[a])*255)*3,l=this.col[o]*(1-f)+d[s]*f,p=this.col[o+1]*(1-f)+d[s+1]*f,m=this.col[o+2]*(1-f)+d[s+2]*f;i?(c[a*6]=l*.28,c[a*6+1]=p*.28,c[a*6+2]=m*.28,c[a*6+3]=l,c[a*6+4]=p,c[a*6+5]=m):(c[a*3]=l,c[a*3+1]=p,c[a*3+2]=m)}o.needsUpdate=!0}toDisplay(e,t,n,r){let i=this.ctx,a=Qd((e+i.WORLD_W/2)/i.WORLD_W),o=Qd((i.WORLD_D/2-n)/i.WORLD_D);return this.place(a,o,t,-1,r)}pickCloud(){return this.pick}frame(){let e=this.ctx.axis,t,n;if(this.polar){t=this.inner+this.radius*e.t;let r=t/(this.inner+this.radius);n=this.bowl*this.radius*r*r}else{t=this.radius*Math.max(e.t,e.f);let r=t/this.radius;n=this.bowl*this.radius*r*r}let r=Math.max(n,Gd*e.a*.6)+.2,i=Math.hypot(t,r/2);return{target:new V(0,r*.35,0),distance:i/Jd*.95}}dispose(){this.clearMesh(),this.object.removeFromParent()}},Xd=new V,Zd=new V;function Qd(e){return e<0?0:e>1?1:e}var $d=60,ef=class{object;mat;constructor(e=480){let t=new Float32Array(e*3),n=new Float32Array(e*4),r=12345,i=()=>((r=r*16807%2147483647)-1)/2147483646;for(let r=0;r<e;r++){t[r*3]=i()*2-1,t[r*3+1]=i()**1.8,t[r*3+2]=i()*2-1;for(let e=0;e<4;e++)n[r*4+e]=i()}let a=new Yi;a.setAttribute(`position`,new Pi(t,3)),a.setAttribute(`aSeed`,new Pi(n,4)),this.mat=new Oo({transparent:!0,depthWrite:!1,uniforms:{uColor:{value:new W},uCenter:{value:new V},uHalf:{value:new V(10,2,10)},uBottom:{value:0},uAlpha:{value:.1},uSize:{value:4},uPhase:{value:0},uScale:{value:500}},vertexShader:`
        attribute vec4 aSeed;
        uniform vec3 uCenter;
        uniform vec3 uHalf;
        uniform float uBottom;
        uniform float uSize;
        uniform float uPhase;
        uniform float uScale;
        varying float vAlpha;
        void main() {
          vec3 p = vec3( position.x * uHalf.x, uBottom + position.y * uHalf.y * 2.0, position.z * uHalf.z ) + vec3( uCenter.x, 0.0, uCenter.z );
          // slow drift on closed loops (whole cycles per loop, so the motion repeats seamlessly)
          float a = uPhase * ( 1.0 + floor( aSeed.x * 2.0 ) ) + aSeed.y * 6.2832;
          p += vec3( cos( a ) * 1.6, sin( a * 2.0 ) * 0.15, sin( a ) * 1.6 ) * ( 0.5 + aSeed.z );
          vec4 mv = modelViewMatrix * vec4( p, 1.0 );
          gl_Position = projectionMatrix * mv;
          float dist = -mv.z;
          gl_PointSize = min( 700.0, uSize * ( 0.6 + aSeed.w ) * uScale / max( dist, 0.1 ) );
          // breathe a little, and fade puffs that come too close to the camera
          vAlpha = ( 0.75 + 0.25 * sin( uPhase * 3.0 + aSeed.x * 6.2832 ) ) * smoothstep( 1.5, 6.0, dist );
        }`,fragmentShader:`
        uniform vec3 uColor;
        uniform float uAlpha;
        varying float vAlpha;
        void main() {
          float d = length( gl_PointCoord - 0.5 ) * 2.0;
          if ( d > 1.0 ) discard;
          float soft = ( 1.0 - d * d );
          gl_FragColor = vec4( uColor, soft * soft * uAlpha * vAlpha );
          #include <colorspace_fragment>
        }`}),this.object=new no(a,this.mat),this.object.frustumCulled=!1,this.object.renderOrder=5}update(e){let t=this.mat.uniforms;t.uColor.value.set(e.color),t.uCenter.value.copy(e.center),t.uHalf.value.copy(e.half),t.uBottom.value=e.bottom,t.uAlpha.value=.16*e.density,t.uSize.value=Math.max(e.half.x,e.half.z)*.22,t.uPhase.value=e.time%$d/$d*Math.PI*2,t.uScale.value=e.viewportHeight/(2*Math.tan(e.fovDeg*Math.PI/360)),this.object.visible=e.density>.001}dispose(){this.object.parent?.remove(this.object),this.object.geometry.dispose(),this.mat.dispose()}},tf=2.4,nf=e=>2595*Math.log10(1+e/700),rf=nf(t/2),af=e=>9/2-9*nf(e)/rf,of=[0,.22,.45,.7,1],sf=[];function cf(e){sf=e.ramp.map((e,t)=>{let n=new W(e);return[of[t],[n.r,n.g,n.b]]})}function lf(e,t){for(let n=1;n<sf.length;n++)if(e<=sf[n][0]||n===sf.length-1){let[r,i]=sf[n-1],[a,o]=sf[n],s=Math.min(1,Math.max(0,(e-r)/(a-r)));t[0]=i[0]+(o[0]-i[0])*s,t[1]=i[1]+(o[1]-i[1])*s,t[2]=i[2]+(o[2]-i[2])*s;return}}var uf=[{id:`voxel`,label:`Voxels`},{id:`drops`,label:`Drop lines`},{id:`spiral`,label:`Spiral`},{id:`symmetry`,label:`Symmetry`}],Y={res:{surface:1,rounded:.5,voxel:.3,skyline:.3,drops:.5,disc:.35,spiral:.35,symmetry:1},material:`matte`,atmosphere:{fog:.5,height:.35},rounded:{softness:1,base:.35,sub:3},voxel:{step:0,gap:.08,round:.55},drops:{points:!0,glow:!1,fade:.08},spiral:{layout:`wrap`,style:`rays`,height:12,span:5,turns:.6,offset:1.4,arc:.92,radius:.022},skyline:{depth:.8,merge:.18,gap:.1},symmetry:{fade:.7,lines:!0}},df=e=>Math.max(1,Math.round(1/e)),ff=new vr,pf=new V;function mf(e,t){let n=[];for(let r=0;r<e;r++)n.push(r*t);for(let r=1;r<t;r++)n.push((e-1)*t+r);for(let r=e-2;r>=0;r--)n.push(r*t+t-1);for(let e=t-2;e>=1;e--)n.push(e);return n}function hf(e,t){let n=e*e,r=n*e;t[0]=.5*(-r+2*n-e),t[1]=.5*(3*r-5*n+2),t[2]=.5*(-3*r+4*n+e),t[3]=.5*(r-n)}var gf=class e{renderer;labels;scene=new ti;camera;controls;heights=new Float32Array;colors=new Float32Array;session=null;map;zLut=new Float32Array(2048);playhead;playSec=null;cursor;forkLines;boxLine;markers;axisGroup=new Kr;grid;underLight=new gs(16777215,0);hemi=new ts(13625855,662036,1.6);sun=new gs(16777215,1.6);whiten=!1;unfold=0;dirtyHeights=!0;container;clock=new Ls;hfogDensity=.5;fogVolume=new ef;mode=`voxel`;axis={t:1,f:16/9,a:1};iso=!1;theme;themeChoice=`auto`;onThemeChange=()=>{};world=new Kr;mirror=new Kr;mirrorOverlays=[];mirrorPlayhead;symPlane;surf=null;rnd=null;vox=null;sky=null;disc=null;drops=null;symLines=null;spiral=null;spiralDeco=new Kr;spiralRing;spiralLabels=[];spiralAxis;morph=null;clipTarget=new $i(new V(-1,0,0),0);clipSource=new $i(new V(1,0,0),0);sweep;constructor(e){this.container=e,this.renderer=new Qu({antialias:!0,powerPreference:`high-performance`}),this.renderer.setPixelRatio(Math.min(2,window.devicePixelRatio)),this.renderer.setClearColor(330512,1),this.renderer.localClippingEnabled=!0,e.appendChild(this.renderer.domElement),this.labels=new Dd,this.labels.domElement.className=`labels-layer`,e.appendChild(this.labels.domElement),this.camera=new ps(42,1,.1,900),this.camera.position.set(-2.5,10.5,15.5),this.controls=new cd(this.camera,this.renderer.domElement),this.controls.target.set(0,.4,0),this.controls.enableDamping=!0,this.controls.maxPolarAngle=Math.PI*.49,this.controls.minDistance=4,this.controls.maxDistance=60,this.scene.fog=new ei(330512,22,60),this.scene.add(this.hemi);let t=this.sun;t.position.set(-6,10,6),this.scene.add(t);let n=new gs(6737151,.6);n.position.set(8,4,-10),this.scene.add(n),this.underLight.position.set(-6,-10,6),this.scene.add(this.underLight),this.grid=new zs(40,40,1191994,728614),this.grid.position.y=-.02,this.scene.add(this.grid);let i=new Float32Array(257);for(let e=0;e<257;e++)i[e]=af(e*r);this.map={xOfFrame:e=>-8+16*e/(this.frames()-1),zOfBin:i};for(let e=0;e<this.zLut.length;e++){let t=9/2-9*e/(this.zLut.length-1),n=0;for(;n<256&&i[n+1]>t;)n++;let r=i[n],a=i[Math.min(256,n+1)];this.zLut[e]=n+(r===a?0:(r-t)/(r-a))}this.playhead=new Kr;let a=new ya(new yo(9,3),new sa({color:16777215,transparent:!0,opacity:.07,side:2,depthWrite:!1}));a.rotation.y=Math.PI/2,a.position.y=3/2,this.playhead.add(a);let o=new Ka(new Yi().setFromPoints([new V(0,3,-9/2),new V(0,3,9/2)]),new Ra({color:16777215,transparent:!0,opacity:.6}));this.playhead.add(o),this.playhead.visible=!1;let s=(e,t=1)=>new Ra({color:e,transparent:!0,opacity:t,depthTest:!1});this.cursor=new Ka(new Yi,s(16777215,.9)),this.forkLines=new Xa(new Yi,s(16769162,.85)),this.boxLine=new Ka(new Yi,s(16777215,.9)),this.markers=new Xa(new Yi,s(16743112,.95));for(let e of this.overlays())e.renderOrder=10,e.visible=!1;this.world.add(this.playhead,...this.overlays(),this.axisGroup),this.scene.add(this.world,this.mirror),this.mirrorPlayhead=this.playhead.clone(),this.mirrorOverlays=this.overlays().map(e=>{let t=e instanceof Xa?new Xa(e.geometry,e.material):new Ka(e.geometry,e.material);return t.renderOrder=10,t}),this.mirror.add(this.mirrorPlayhead,...this.mirrorOverlays),this.symPlane=new ya(new yo(1,1),new sa({color:5687551,transparent:!0,opacity:.05,side:2,depthWrite:!1}));let c=new Xa(new _o(new yo(1,1)),new Ra({color:5687551,transparent:!0,opacity:.35}));this.symPlane.add(c),this.scene.add(this.symPlane),this.spiralAxis=new Ka(new Yi,new Ra({color:4877176}));let l=[];for(let e=0;e<=64;e++)l.push(new V(Math.cos(e/64*Math.PI*2),0,Math.sin(e/64*Math.PI*2)));this.spiralRing=new Kr,this.spiralRing.add(new Ka(new Yi().setFromPoints(l),new Ra({color:16777215,transparent:!0,opacity:.6})),new ya(new uo(1,64).rotateX(-Math.PI/2),new sa({color:16777215,transparent:!0,opacity:.06,side:2,depthWrite:!1}))),this.spiralRing.visible=!1,this.spiralDeco.add(this.spiralAxis,this.spiralRing);for(let e=0;e<=5;e++){let t=document.createElement(`div`);t.className=`axis-label`,t.textContent=`${e}s`;let n=new xd(t);this.spiralLabels.push(n),this.spiralDeco.add(n)}this.scene.add(this.spiralDeco),this.sweep=new ya(new yo(1,1).rotateY(Math.PI/2),new sa({color:16777215,transparent:!0,opacity:.18,blending:2,depthWrite:!1,side:2})),this.sweep.visible=!1,this.scene.add(this.sweep),this.scene.add(this.fogVolume.object),this.theme=zd(`lagoon`),new ResizeObserver(()=>this.resize()).observe(e),this.resize(),this.buildAxes(),this.setTheme(`auto`),this.applyLayout(),this.renderer.setAnimationLoop(()=>this.frame())}overlays(){return[this.cursor,this.forkLines,this.boxLine,this.markers]}frames(){return this.session?.frames??626}get currentSession(){return this.session}resize(){let e=this.container.clientWidth,t=this.container.clientHeight;e&&t&&(this.renderer.setSize(e,t),this.labels.setSize(e,t),this.camera.aspect=e/t,this.camera.updateProjectionMatrix())}label(e,t,n=`axis-label`){let r=document.createElement(`div`);r.className=n,r.textContent=e;let i=new xd(r);i.position.copy(t),this.axisGroup.add(i)}buildAxes(){let e=[];for(let t of[100,250,500,1e3,2e3,4e3,8e3]){let n=af(t);this.label(t>=1e3?`${t/1e3} kHz`:`${t} Hz`,new V(-8.8,0,n)),e.push(new V(-8,0,n),new V(-8.25,0,n))}for(let t=0;t<=5;t++){let n=-8+16*t/5;this.label(`${t}s`,new V(n,0,5.1)),e.push(new V(n,0,9/2),new V(n,0,4.75))}let t=new Xa(new Yi().setFromPoints(e),new Ra({color:4877176}));this.axisGroup.add(t),this.label(`time`,new V(0,0,5.8),`axis-title`),this.label(`frequency`,new V(-10.2,0,0),`axis-title`),this.axisGroup.add(this.ampAxis),this.buildAmpAxis()}ampAxis=new Kr;ampAxisWhiten=null;ampTicks=[];ampTitle=null;ampLine=null;ampLean=-1;buildAmpAxis(){if(this.ampAxisWhiten===this.whiten)return;this.ampAxisWhiten=this.whiten;for(let e of[...this.ampAxis.children])this.ampAxis.remove(e),e instanceof xd&&e.element.remove(),e instanceof Xa&&e.geometry.dispose();let e=this.whiten?[0,8,16,24,32].map(e=>[(e+2)/34,e===0?`background`:`+${e} dB`]):[0,12,24,36,48].map(e=>[1-e/66,e===0?`0 dB`:`-${e} dB`]),t=(e,t)=>{let n=document.createElement(`div`);n.className=t,n.textContent=e;let r=new xd(n);return this.ampAxis.add(r),r};this.ampTicks=e.map(([e,n])=>({h:Math.max(0,e)**1.6*tf,label:t(n,`axis-label`)})),this.ampTitle=t(this.whiten?`above background`:`amplitude`,`axis-title`),this.ampLine=new Xa(new Yi,new Ra({color:4877176})),this.ampAxis.add(this.ampLine),this.ampLean=-1,this.placeAmpAxis(this.lastLean)}lastLean=0;placeAmpAxis(e){if(!this.ampLine||Math.abs(e-this.ampLean)<.005)return;this.ampLean=e;let{t,f:n,a:r}=this.axis,i=(e,r)=>new V(e/t,0,r/n),a=i(Math.SQRT1_2,-Math.SQRT1_2),o=t=>new V(8,t*(1-e),-4.5).addScaledVector(a,t*r*e*1.25),s=[o(0),o(tf)],c=i(Math.SQRT1_2,Math.SQRT1_2).multiplyScalar(e).add(i(1-e,0));for(let e of this.ampTicks){let t=o(e.h);s.push(t,t.clone().addScaledVector(c,.25)),e.label.position.copy(t).addScaledVector(c,.85)}this.ampTitle.position.copy(o(tf)).addScaledVector(a,.5).add(new V(0,.45*(1-e),0)),this.ampLine.geometry.setFromPoints(s)}revealStart=-1;static REVEAL_SECONDS=.75;reveal(){this.revealStart=performance.now(),this.stepReveal()}stepReveal(){if(this.revealStart<0)return;let t=(performance.now()-this.revealStart)/1e3/e.REVEAL_SECONDS;if(t>=1){this.revealStart=-1,J.reveal.value.w=0;return}let n=1-(1-t)**2;if(this.mode===`spiral`){let e=Y.spiral.height*this.axis.t;J.reveal.value.set(1,-.5+(e+1)*n,1,1);return}let r=16*this.axis.t/2,i=16*this.axis.t*.3;J.reveal.value.set(0,-r+(2*r+i)*n,i,1)}updateAmpLean(){let e=pf.copy(this.camera.position).sub(this.controls.target).normalize(),t=Yn.smoothstep(e.y,.72,.97);this.lastLean=t,this.placeAmpAxis(t)}setTheme(e){this.themeChoice=e;let t=zd(e===`auto`?Ld[this.session?.level?.id??``]??`glacier`:e);this.theme=t,cf(t),Bd(t),Vd(t,this.session?.level?.targets??[]);for(let e of this.session?.layers??[])e.color=x[e.cls].color;let n=document.createElement(`canvas`);n.width=2,n.height=256;let r=n.getContext(`2d`),i=r.createLinearGradient(0,0,0,256);for(let[e,n]of t.sky??[[0,t.bg],[.55,t.bg],[1,t.fog]])i.addColorStop(e,n);r.fillStyle=i,r.fillRect(0,0,2,256);let a=new ao(n);a.colorSpace=an,this.scene.background?.dispose?.(),this.scene.background=a,this.scene.fog.color.set(t.fog),J.waterTint.value.set(t.accent2),this.hemi.color.set(16777215).lerp(new W(t.accent2),.25),this.hemi.groundColor.set(t.fog),this.sun.color.set(16777215).lerp(new W(t.accent),.15);let o=this.grid.material;o.vertexColors=!1,o.color.set(t.fog).multiplyScalar(t.light?.82:1.4),this.container.classList.toggle(`light-theme`,t.light),o.transparent=!0,o.opacity=.35,this.symPlane.material.color.set(t.accent2),this.symPlane.children[0].material.color.set(t.accent2),this.session&&this.refresh(),this.onThemeChange(),window.dispatchEvent(new Event(`viz-theme`))}setSession(e){this.session=e,this.heights=new Float32Array(e.frames*257),this.colors=new Float32Array(e.frames*257*3),this.disposeModes(),this.dirtyHeights=!0,this.themeChoice===`auto`&&this.setTheme(`auto`),this.applyLayout(),this.refresh(),this.clearOverlays()}base=new Float32Array;shade=new Float32Array;computeBase(){let e=this.session,t=e.frames*257,n=new Float32Array(t);for(let t=0;t<e.frames;t++)for(let r=0;r<257;r++){let i=t*257+r,a=this.whiten?(e.db[i]-e.floor[r]+2)/34:(e.db[i]-(e.maxDb-66))/66;n[i]=a<0?0:a>1?1:a}this.base.length!==t&&(this.base=new Float32Array(t),this.shade=new Float32Array(t));for(let t=0;t<e.frames;t++)for(let r=0;r<257;r++){let i=t*257+r,a=n[Math.max(0,t-1)*257+r],o=n[Math.min(e.frames-1,t+1)*257+r],s=(a+2*n[i]+o)/4;this.shade[i]=s,this.base[i]=s**1.6}let r=new Float32Array(Math.min(t,2e4));for(let e=0;e<r.length;e++)r[e]=this.shade[Math.floor(e*t/r.length)];r.sort();let i=r[Math.floor(r.length*.15)],a=r[Math.floor(r.length*.997)],o=Math.max(.05,a-i);for(let e=0;e<t;e++){let t=(this.shade[e]-i)/o;this.shade[e]=t<0?0:t>1?1:t}}markHeightsDirty(){this.dirtyHeights=!0,this.buildAmpAxis()}refresh(){let e=this.session;if(!e)return;let t=this.colors,n=e.layers.filter(e=>e.visible),r=n.map(e=>new W(e.color)),i=[0,0,0],a=this.unfold>0,o=this.dirtyHeights||a;(this.dirtyHeights||this.base.length!==e.frames*257)&&this.computeBase();for(let s=0;s<e.frames;s++)for(let e=0;e<257;e++){let c=s*257+e,l=this.base[c];lf(this.shade[c],i);let u=i[0],d=i[1],f=i[2],p=0,m=0,h=0,g=0,_=l*tf;for(let e=0;e<n.length;e++){let t=n[e].mask[c];t<=.002||(p+=t,m+=r[e].r*t,h+=r[e].g*t,g+=r[e].b*t,a&&(_+=t*this.unfold*(1.1+e*.9)))}if(p>0){let e=Math.min(1,p),t=.6+.6*l;u=u*(1-e)+m/p*t*e,d=d*(1-e)+h/p*t*e,f=f*(1-e)+g/p*t*e}t[c*3]=u,t[c*3+1]=d,t[c*3+2]=f,o&&(this.heights[c]=_)}o&&(this.dirtyHeights=!1),this.updateMode(o)}binGrid(e,t){let n=this.frames(),r=Math.ceil(n/e),i=Math.ceil(257/t),a=new Float32Array(r),o=new Float32Array(i);for(let t=0;t<r;t++)a[t]=Math.min(n-1,t*e+(e-1)/2);for(let e=0;e<i;e++)o[e]=Math.min(256,e*t+(t-1)/2);return{sT:e,sK:t,nT:r,nK:i,tc:a,kc:o,h:new Float32Array(r*i),col:new Float32Array(r*i*3)}}poolBin(e,t){let n=this.frames(),r=this.heights,i=this.colors;for(let a=0;a<e.nT;a++){let o=a*e.sT,s=Math.min(n,o+e.sT);for(let n=0;n<e.nK;n++){let c=n*e.sK,l=Math.min(257,c+e.sK),u=a*e.nK+n,d=0,f=0,p=0,m=0,h=0;for(let e=o;e<s;e++)for(let t=c;t<l;t++){let n=e*257+t,a=r[n];a>d&&(d=a);let o=a+.05;f+=i[n*3]*o,p+=i[n*3+1]*o,m+=i[n*3+2]*o,h+=o}t&&(e.h[u]=d),e.col[u*3]=f/h,e.col[u*3+1]=p/h,e.col[u*3+2]=m/h}}}binX(e,t){return this.map.xOfFrame(e.tc[t])}binZ(e,t){return af(e.kc[t]*r)}binH(e,t,n){let r=Math.round((this.frameOfX(t)-(e.sT-1)/2)/e.sT),i=Math.round((this.binOfZ(n)-(e.sK-1)/2)/e.sK);return r<0||r>=e.nT||i<0||i>=e.nK?0:e.h[r*e.nK+i]}uniGrid(e){let t=Math.max(8,Math.round(16*this.axis.t/e)),n=Math.max(4,Math.round(9*this.axis.f/e)),r=16/t,i=9/n,a=this.frames(),o=e=>Math.max(0,Math.min(a-1,e)),s=e=>Math.max(0,Math.min(256,e)),c=new Int32Array(t),l=new Int32Array(t);for(let e=0;e<t;e++){let t=-8+e*r;c[e]=o(Math.round(this.frameOfX(t))),l[e]=Math.max(c[e],o(Math.round(this.frameOfX(t+r))-1))}let u=new Int32Array(n),d=new Int32Array(n);for(let e=0;e<n;e++){let t=9/2-e*i;u[e]=s(Math.round(this.binOfZ(t))),d[e]=Math.max(u[e],s(Math.round(this.binOfZ(t-i))-1))}let f=t*n;return{NX:t,NZ:n,cw:r,cd:i,tLo:c,tHi:l,kLo:u,kHi:d,h:new Float32Array(f),m:new Float32Array(f),col:new Float32Array(f*3)}}poolUni(e,t){let n=this.heights,r=this.colors;for(let i=0;i<e.NX;i++)for(let a=0;a<e.NZ;a++){let o=0,s=0,c=0,l=0,u=0,d=0,f=0;for(let t=e.tLo[i];t<=e.tHi[i];t++)for(let i=e.kLo[a];i<=e.kHi[a];i++){let e=t*257+i,a=n[e];a>o&&(o=a),s+=a,f++;let p=a+.05;c+=r[e*3]*p,l+=r[e*3+1]*p,u+=r[e*3+2]*p,d+=p}let p=i*e.NZ+a;t&&(e.h[p]=o,e.m[p]=s/f),e.col[p*3]=c/d,e.col[p*3+1]=l/d,e.col[p*3+2]=u/d}}setMode(e,t=!1){this.endMorph(),e!==this.mode&&(this.mode=e,this.applyLayout(),this.updateMode(!0),t||this.resetCamera(`perspective`))}setAxis(e,t,n){this.ampLean=-1;let r=e!==this.axis.t||t!==this.axis.f;this.axis.t=e,this.axis.f=t,this.axis.a=n,r&&(this.mode===`voxel`||this.mode===`rounded`||this.mode===`skyline`)&&this.disposeModes(),this.disc&&this.disposeDisc(),this.applyLayout(),(this.mode===`spiral`||this.mode===`disc`||r)&&this.updateMode(!0)}rebuildViz(){this.disposeModes(),this.applyLayout(),this.updateMode(!0)}disposeObj(e){e&&(e.parent?.remove(e),e.traverse(e=>{let t=e;t.geometry&&t.geometry.dispose(),e.isInstancedMesh&&e.dispose()}))}disposeModes(){this.endMorph(),this.surf&&=(this.disposeObj(this.surf.mesh),this.mirror.remove(this.surf.mirror),null),this.rnd&&this.disposeObj(this.rnd.mesh),this.rnd=null,this.vox&&this.disposeObj(this.vox.body),this.vox=null,this.drops&&(this.disposeObj(this.drops.lines),this.disposeObj(this.drops.points)),this.drops=null,this.symLines&&this.disposeObj(this.symLines.lines),this.symLines=null,this.spiral&&this.disposeObj(this.spiral.obj),this.spiral=null,this.sky&&this.disposeObj(this.sky.mesh),this.sky=null,this.disposeDisc()}disposeDisc(){this.disc?.dispose(),this.disc=null}copies(){let{t:e,a:t,f:n}=this.axis;return this.mode===`spiral`||this.mode===`disc`?[{ox:0,ax:1,ay:1,az:1}]:this.mode===`symmetry`?[{ox:0,ax:e,ay:t,az:n},{ox:0,ax:e,ay:-t,az:n}]:[{ox:0,ax:e,ay:t,az:n}]}toDisplay(e,t,n){let r=this.copies()[0];return new V(r.ox+e*r.ax,t*r.ay,n*r.az)}toCanonical(e,t){let n=this.copies()[0];return{x:(e-n.ox)/n.ax,z:t/n.az}}applyLayout(){let e=this.mode,t=this.copies(),n=(e,t)=>{e.position.set(t.ox,0,0),e.scale.set(t.ax,t.ay,t.az)};n(this.world,t[0]),this.mirror.visible=t.length>1,t.length>1&&n(this.mirror,t[1]),this.axisGroup.visible=e!==`spiral`&&e!==`disc`,this.spiralDeco.visible=e===`spiral`,this.playhead.visible=e!==`spiral`&&e!==`disc`&&this.playSec!==null;let{t:r,a:i,f:a}=this.axis;this.symPlane.visible=e===`symmetry`,this.grid.position.y=-.02,this.grid.visible=e!==`rounded`,this.controls.maxPolarAngle=Math.PI*.49,this.underLight.intensity=0;let o=Y.atmosphere;if(J.hfog.value.set(-.05,Math.max(.05,o.height*tf*i),o.fog,0),J.water.value.y=.5*tf*i,e===`spiral`&&(J.hfog.value.z=0),e===`rounded`&&(J.hfog.value.x=-Y.rounded.base*i),e===`skyline`&&J.hfog.value.set(-Y.skyline.depth*tf*i,.15*tf*i,Math.max(o.fog,.85),0),e===`symmetry`){let e=Y.symmetry.fade*tf*i;J.mirror.value.set(e,e*2.2,6/r),J.hfog.value.set(-e*2,.05*tf*i,Math.max(o.fog,.6),0),this.symPlane.rotation.set(-Math.PI/2,0,0),this.symPlane.scale.set(16*r+.6,9*a+.6,1),this.symPlane.position.set(0,0,0),this.grid.position.y=-(tf+this.unfold*3)*i*2-.8,this.controls.maxPolarAngle=Math.PI*.95,this.underLight.intensity=1.2}if(this.hfogDensity=J.hfog.value.z,e===`spiral`){let e=Y.spiral,t=e.height*r;this.spiralAxis.geometry.dispose(),this.spiralAxis.geometry=new Yi().setFromPoints([new V(0,0,0),new V(0,t,0)]),this.spiralLabels.forEach((e,n)=>e.position.set(.25,t*n/5,0));let n=e.layout===`wrap`?e.offset*a+e.span*.8*i+.3:e.offset+e.span/2*Math.max(a,i)+.3;this.spiralRing.scale.set(n,1,n),this.spiralRing.visible=this.playSec!==null,this.playSec!==null&&(this.spiralRing.position.y=t*this.playSec/5)}}updateMode(e){if(!this.session)return;let t=this.mode,n=this.morph?.from;this.surf&&(this.surf.mesh.visible=t===`surface`||t===`symmetry`),this.surf&&(this.surf.mirror.visible=t===`symmetry`),this.rnd&&(this.rnd.mesh.visible=t===`rounded`),this.vox&&(this.vox.body.visible=t===`voxel`),this.drops&&(this.drops.lines.visible=this.drops.points.visible=t===`drops`||n===`drops`),this.symLines&&(this.symLines.lines.visible=t===`symmetry`&&Y.symmetry.lines),this.spiral&&(this.spiral.obj.visible=t===`spiral`),this.sky&&(this.sky.mesh.visible=t===`skyline`),this.disc&&(this.disc.object.visible=t===`disc`),(t===`surface`||t===`symmetry`)&&this.updateSurface(e),t===`skyline`&&this.updateSkyline(e),t===`disc`&&this.updateDisc(e),t===`symmetry`&&Y.symmetry.lines&&this.updateSymLines(e),t===`rounded`&&this.updateRounded(e),t===`voxel`&&this.updateVoxel(e),(t===`drops`||n===`drops`)&&this.updateDrops(e),t===`spiral`&&this.updateSpiral(e)}surfaceMaterials(){return{matte:Md(new Ao({vertexColors:!0,roughness:.55,metalness:.05,side:2})),water:Md(Fd(new Ao({vertexColors:!0,roughness:.6,metalness:0,side:2,transparent:!0,opacity:.94,emissive:0})))}}updateSurface(e){let t=df(Y.res[this.mode]);if(this.surf&&this.surf.s!==t&&(this.disposeObj(this.surf.mesh),this.mirror.remove(this.surf.mirror),this.surf=null),!this.surf){let n=this.binGrid(t,t),r=n.nT*n.nK,i=Int32Array.from(mf(n.nT,n.nK)),a=i.length,o=new Float32Array((r+a*2)*3);for(let e=0;e<n.nT;e++)for(let t=0;t<n.nK;t++){let r=e*n.nK+t;o[r*3]=this.binX(n,e),o[r*3+2]=this.binZ(n,t)}let s=new Uint32Array((n.nT-1)*(n.nK-1)*6+a*6),c=0;for(let e=0;e<n.nT-1;e++)for(let t=0;t<n.nK-1;t++){let r=e*n.nK+t,i=(e+1)*n.nK+t;s[c++]=r,s[c++]=i,s[c++]=r+1,s[c++]=i,s[c++]=i+1,s[c++]=r+1}for(let e=0;e<a;e++){let t=r+e*2,n=r+(e+1)%a*2;s[c++]=t,s[c++]=t+1,s[c++]=n,s[c++]=n,s[c++]=t+1,s[c++]=n+1}for(let e=0;e<a;e++){let t=i[e];for(let n of[r+e*2,r+e*2+1])o[n*3]=o[t*3],o[n*3+2]=o[t*3+2]}let l=new Yi;l.setAttribute(`position`,new Pi(o,3)),l.setAttribute(`color`,new Pi(new Float32Array((r+a*2)*3),3)),l.setIndex(new Pi(s,1));let{matte:u,water:d}=this.surfaceMaterials(),f=new ya(l,Y.material===`water`?d:u),p=new ya(l,Md(Nd(new Ao({vertexColors:!0,roughness:.6,metalness:.05,side:2,depthWrite:!1}))));p.renderOrder=2,this.world.add(f),this.mirror.add(p),this.surf={s:t,g:n,geo:l,mesh:f,mirror:p,matte:u,water:d,skirt:i},e=!0}let n=this.surf;n.mesh.material=Y.material===`water`?n.water:n.matte,this.poolBin(n.g,e);let r=n.geo.getAttribute(`color`),i=r.array;i.set(n.g.col);let a=n.g.h.length;for(let e=0;e<n.skirt.length;e++){let t=n.skirt[e];for(let[r,o]of[[a+e*2,.75],[a+e*2+1,.3]])i[r*3]=n.g.col[t*3]*o,i[r*3+1]=n.g.col[t*3+1]*o,i[r*3+2]=n.g.col[t*3+2]*o}if(r.needsUpdate=!0,e){let e=n.geo.getAttribute(`position`),t=e.array;for(let e=0;e<a;e++)t[e*3+1]=n.g.h[e];for(let e=0;e<n.skirt.length;e++)t[(a+e*2)*3+1]=n.g.h[n.skirt[e]],t[(a+e*2+1)*3+1]=0;e.needsUpdate=!0,n.geo.computeVertexNormals(),n.geo.computeBoundingSphere()}n.mesh.visible=!0,n.mirror.visible=this.mode===`symmetry`}updateRounded(e){if(!this.rnd){let t=this.uniGrid(.07/Y.res.rounded),n=Math.max(1,Math.round(Y.rounded.sub)),r=(t.NX-1)*n+1,i=(t.NZ-1)*n+1,a=r*i,o=[];for(let e=0;e<r;e++)o.push(e*i);for(let e=1;e<i;e++)o.push((r-1)*i+e);for(let e=r-2;e>=0;e--)o.push(e*i+i-1);for(let e=i-2;e>=1;e--)o.push(e);let s=o.length,c=a+s*2+4,l=new Float32Array(c*3),u=new Float32Array(c*3),d=-8+t.cw/2,f=9/2-t.cd/2;for(let e=0;e<r;e++)for(let r=0;r<i;r++){let a=e*i+r;l[a*3]=d+e/n*t.cw,l[a*3+2]=f-r/n*t.cd}let p=[];for(let e=0;e<r-1;e++)for(let t=0;t<i-1;t++){let n=e*i+t,r=(e+1)*i+t;p.push(n,r,n+1,r,r+1,n+1)}for(let e=0;e<s;e++){let t=a+e*2,n=a+(e+1)%s*2;p.push(t,t+1,n,n,t+1,n+1)}let m=a+s*2,h=[d,d+(r-1)/n*t.cw],g=[f,f-(i-1)/n*t.cd];[[0,0],[1,0],[1,1],[0,1]].forEach(([e,t],n)=>{l[(m+n)*3]=h[e],l[(m+n)*3+2]=g[t]}),p.push(m,m+1,m+2,m,m+2,m+3);let _=new Yi;_.setAttribute(`position`,new Pi(l,3)),_.setAttribute(`color`,new Pi(u,3)),_.setIndex(p);let{matte:v,water:y}=this.surfaceMaterials();v.roughness=.78;let b=new ya(_,Y.material===`water`?y:v);this.world.add(b),this.rnd={g:t,nx:r,nz:i,G:new Float32Array(t.NX*t.NZ),GC:new Float32Array(t.NX*t.NZ*3),geo:_,mesh:b,matte:v,water:y,nTop:a,skirt:Int32Array.from(o)},e=!0}let t=this.rnd;t.mesh.material=Y.material===`water`?t.water:t.matte;let n=t.g;this.poolUni(n,e);let r=n.NX,i=n.NZ;if(e){let e=t.G;for(let t=0;t<e.length;t++)e[t]=.5*n.h[t]+.5*n.m[t];let a=new Float32Array(e.length);for(let t=0;t<Y.rounded.softness;t++){for(let t=0;t<r;t++)for(let n=0;n<i;n++){let o=e[Math.max(0,t-1)*i+n],s=e[Math.min(r-1,t+1)*i+n];a[t*i+n]=(o+2*e[t*i+n]+s)/4}for(let t=0;t<r;t++)for(let n=0;n<i;n++){let r=a[t*i+Math.max(0,n-1)],o=a[t*i+Math.min(i-1,n+1)];e[t*i+n]=(r+2*a[t*i+n]+o)/4}}}t.GC.set(n.col);let a=(t.nx-1)/(r-1),o=Array.from({length:a+1},(e,t)=>{let n=new Float32Array(4);return hf(t/a,n),n}),s=t.geo.getAttribute(`position`),c=t.geo.getAttribute(`color`),l=s.array,u=c.array,d=t.G,f=t.GC;for(let n=0;n<t.nx;n++){let s=Math.floor(n/a),c=n-s*a;s>=r-1&&(s=r-2,c=a);let p=o[c];for(let c=0;c<t.nz;c++){let m=Math.floor(c/a),h=c-m*a;m>=i-1&&(m=i-2,h=a);let g=o[h],_=0,v=0,y=0,b=0;for(let e=0;e<4;e++){let t=Math.min(r-1,Math.max(0,s+e-1));for(let n=0;n<4;n++){let r=Math.min(i-1,Math.max(0,m+n-1)),a=p[e]*g[n],o=t*i+r;_+=a*d[o],v+=a*f[o*3],y+=a*f[o*3+1],b+=a*f[o*3+2]}}let x=n*t.nz+c;e&&(l[x*3+1]=Math.max(0,_)),u[x*3]=Math.max(0,v),u[x*3+1]=Math.max(0,y),u[x*3+2]=Math.max(0,b)}}let p=-Y.rounded.base;for(let e=0;e<t.skirt.length;e++){let n=t.skirt[e],r=t.nTop+e*2;for(let[e,t,i]of[[r,l[n*3+1],.78],[r+1,p,.32]])l[e*3]=l[n*3],l[e*3+1]=t,l[e*3+2]=l[n*3+2],u[e*3]=u[n*3]*i,u[e*3+1]=u[n*3+1]*i,u[e*3+2]=u[n*3+2]*i}let m=t.nTop+t.skirt.length*2;for(let e=0;e<4;e++)l[(m+e)*3+1]=p;c.needsUpdate=!0,e&&(s.needsUpdate=!0,t.geo.computeVertexNormals(),t.geo.computeBoundingSphere()),t.mesh.visible=!0}roundedH(e,t){let n=this.rnd;if(!n)return 0;let{NX:r,NZ:i,cw:a,cd:o}=n.g,s=(e-(-8+a/2))/a,c=(9/2-o/2-t)/o,l=Math.min(r-2,Math.max(0,Math.floor(s))),u=Math.min(i-2,Math.max(0,Math.floor(c))),d=new Float32Array(4),f=new Float32Array(4);hf(Math.min(1,Math.max(0,s-l)),d),hf(Math.min(1,Math.max(0,c-u)),f);let p=0;for(let e=0;e<4;e++){let t=Math.min(r-1,Math.max(0,l+e-1));for(let r=0;r<4;r++){let a=Math.min(i-1,Math.max(0,u+r-1));p+=d[e]*f[r]*n.G[t*i+a]}}return Math.max(0,p)}updateVoxel(e){if(!this.vox){let t=this.uniGrid(.05/Y.res.voxel),n=t.NX*t.NZ,r=Ud(Md(new Ao({roughness:.55,metalness:.05,side:2}))),i=new ja(Hd(Y.voxel.round),r,n);i.setColorAt(0,new W),i.frustumCulled=!1,this.world.add(i),this.vox={g:t,body:i,top:new Float32Array(n)},e=!0}let t=this.vox,n=t.g;this.poolUni(n,e);let{step:r,gap:i}=Y.voxel,a=t.body.instanceColor.array,o=n.cw*(1-i),s=n.cd*(1-i);for(let i=0;i<n.NX;i++){let c=-8+(i+.5)*n.cw;for(let l=0;l<n.NZ;l++){let u=9/2-(l+.5)*n.cd,d=i*n.NZ+l;if(e){let e=Math.max(.03,r>0?Math.round(n.h[d]/r)*r:n.h[d]);t.top[d]=e,ff.makeScale(o,e,s).setPosition(c,0,u),t.body.setMatrixAt(d,ff)}a[d*3]=n.col[d*3],a[d*3+1]=n.col[d*3+1],a[d*3+2]=n.col[d*3+2]}}t.body.count=n.NX*n.NZ,e&&(t.body.instanceMatrix.needsUpdate=!0),t.body.instanceColor.needsUpdate=!0,t.body.visible=!0}voxelH(e,t){let n=this.vox;if(!n)return 0;let r=Math.floor((e+8)/n.g.cw),i=Math.floor((9/2-t)/n.g.cd);return r<0||r>=n.g.NX||i<0||i>=n.g.NZ?0:n.top[r*n.g.NZ+i]}updateSkyline(e){if(!this.sky){let t=this.uniGrid(.05/Y.res.skyline),n=t.NX*t.NZ,r=new ja(new lo(1,1,1).translate(0,.5,0),Md(new Ao({roughness:.7,metalness:.05,flatShading:!0})),n);r.setColorAt(0,new W),r.frustumCulled=!1,this.world.add(r),this.sky={g:t,mesh:r,top:new Float32Array(n)},e=!0}let t=this.sky,n=t.g;this.poolUni(n,e);let{NX:r,NZ:i,cw:a,cd:o}=n,s=Y.skyline,c=(e,t)=>{let n=Math.sin(e*127.1+t*311.7)*43758.5453;return n-Math.floor(n)},l=new Int32Array(r*i).fill(-1),u=[],d=(e,t,a,o)=>{if(e+a>r||t+a>i)return!1;let s=1/0,c=-1/0;for(let r=e;r<e+a;r++)for(let e=t;e<t+a;e++){if(l[r*i+e]>=0)return!1;let t=n.h[r*i+e];s=Math.min(s,t),c=Math.max(c,t)}return c-s<o},f=(e,t,n)=>{let r=u.length;u.push({i:e,j:t,s:n});for(let a=e;a<e+n;a++)for(let e=t;e<t+n;e++)l[a*i+e]=r};for(let e=0;e<r;e+=4)for(let t=0;t<i;t+=4)if(c(e,t)>.35&&d(e,t,4,s.merge*.6))f(e,t,4);else for(let n=e;n<e+4;n+=2)for(let e=t;e<t+4;e+=2)if(c(n,e)>.3&&d(n,e,2,s.merge))f(n,e,2);else for(let t=n;t<Math.min(r,n+2);t++)for(let n=e;n<Math.min(i,e+2);n++)l[t*i+n]<0&&f(t,n,1);let p=t.mesh.instanceColor.array,m=1-s.gap,h=s.depth*tf;u.forEach((e,r)=>{let s=0,l=0,u=0,d=0,f=0;for(let t=e.i;t<e.i+e.s;t++)for(let r=e.j;r<e.j+e.s;r++){let e=t*i+r;s=Math.max(s,n.h[e]);let a=n.h[e]+.05;l+=n.col[e*3]*a,u+=n.col[e*3+1]*a,d+=n.col[e*3+2]*a,f+=a}s=Math.max(.04,s);for(let n=e.i;n<e.i+e.s;n++)for(let r=e.j;r<e.j+e.s;r++)t.top[n*i+r]=s;let g=h*(.25+.75*c(e.i+.5,e.j+.5))*(.4+s/tf),_=-8+(e.i+e.s/2)*a,v=9/2-(e.j+e.s/2)*o;ff.makeScale(e.s*a*m,s+g,e.s*o*m).setPosition(_,-g,v),t.mesh.setMatrixAt(r,ff),p[r*3]=l/f,p[r*3+1]=u/f,p[r*3+2]=d/f}),t.mesh.count=u.length,t.mesh.instanceMatrix.needsUpdate=!0,t.mesh.instanceColor.needsUpdate=!0,t.mesh.visible=!0}skylineH(e,t){let n=this.sky;if(!n)return 0;let r=Math.floor((e+8)/n.g.cw),i=Math.floor((9/2-t)/n.g.cd);return r<0||r>=n.g.NX||i<0||i>=n.g.NZ?0:n.top[r*n.g.NZ+i]}modeCtx(){return{frames:this.frames(),nBins:257,BIN_HZ:r,WORLD_W:16,WORLD_D:9,WORLD_H:tf,heights:this.heights,colors:this.colors,xOfFrame:e=>this.map.xOfFrame(e),zOfHz:af,axis:this.axis,res:Y.res[this.mode],theme:this.theme,fog:e=>Md(e)}}updateDisc(e){let t=this.modeCtx(),n=this.disc;n||(n=new Yd(t),this.disc=n,this.scene.add(n.object),e=!0),n.update(t,e),n.object.visible=!0}dropLines(e,t){let n=e.nT*e.nK,r=new Yi;r.setAttribute(`position`,new Pi(new Float32Array(n*6),3)),r.setAttribute(`color`,new Pi(new Float32Array(n*6),3));let i=Y.drops.glow&&!t,a=new Ra({vertexColors:!0,transparent:!0,opacity:i?.16:.85,blending:i?2:1,depthWrite:!i});a=Md(t?Pd(a):a);let o=new Xa(r,a);return o.frustumCulled=!1,o}fillDrops(e,t,n,r,i){this.poolBin(e,r);let a=t.geometry.getAttribute(`position`),o=t.geometry.getAttribute(`color`),s=a.array,c=o.array,l=n?.geometry.getAttribute(`position`),u=n?.geometry.getAttribute(`color`),d=l?.array,f=u?.array;for(let t=0;t<e.nT;t++){let n=this.binX(e,t);for(let a=0;a<e.nK;a++){let o=t*e.nK+a,l=e.col[o*3],u=e.col[o*3+1],p=e.col[o*3+2];if(r){let t=this.binZ(e,a),r=e.h[o];s.set([n,0,t,n,r,t],o*6),d?.set([n,r,t],o*3)}c.set([l*i,u*i,p*i,l,u,p],o*6),f?.set([l,u,p],o*3)}}r&&(a.needsUpdate=!0,l&&(l.needsUpdate=!0)),o.needsUpdate=!0,u&&(u.needsUpdate=!0)}updateDrops(e){if(!this.drops){let t=df(Y.res.drops),n=this.binGrid(t,t),r=this.dropLines(n,!1),i=n.nT*n.nK,a=new Yi;a.setAttribute(`position`,new Pi(new Float32Array(i*3),3)),a.setAttribute(`color`,new Pi(new Float32Array(i*3),3));let o=Y.drops.glow,s=new no(a,Md(new Za({vertexColors:!0,size:2.2,sizeAttenuation:!1,transparent:!0,opacity:o?.5:.95,blending:o?2:1,depthWrite:!o})));s.frustumCulled=!1,this.world.add(r,s),this.drops={g:n,lines:r,points:s},e=!0}let t=this.drops;this.fillDrops(t.g,t.lines,t.points,e,Y.drops.fade),t.lines.visible=!0,t.points.visible=Y.drops.points}updateSymLines(e){if(!this.symLines){let t=Math.max(2,df(Y.res.symmetry)*2),n=this.binGrid(t,t),r=this.dropLines(n,!0);this.mirror.add(r),this.symLines={g:n,lines:r},e=!0}this.fillDrops(this.symLines.g,this.symLines.lines,null,e,.25)}morphTo(e,t=3.2){this.session&&(this.mode!==`drops`&&this.setMode(`drops`),this.endMorph(),this.mode=e,this.morph={from:`drops`,to:e,t0:performance.now(),dur:t*1e3},this.applyLayout(),this.updateMode(!0),this.setClipping(!0))}setClipping(e){let t=[];this.vox&&t.push(this.vox.body.material),this.rnd&&t.push(this.rnd.matte,this.rnd.water);for(let n of t)n.clippingPlanes=e?[this.clipTarget]:[];if(this.drops)for(let t of[this.drops.lines.material,this.drops.points.material])t.clippingPlanes=e?[this.clipSource]:[];this.sweep.visible=e}endMorph(){this.morph&&(this.morph=null,this.setClipping(!1),this.drops&&(this.drops.lines.visible=this.drops.points.visible=this.mode===`drops`))}stepMorph(){let e=this.morph;if(!e)return;let t=Math.min(1,(performance.now()-e.t0)/e.dur),n=t<.5?2*t*t:1-(-2*t+2)**2/2,{t:r,a:i,f:a}=this.axis,o=(-8.3+16.6*n)*r;this.clipTarget.constant=o,this.clipSource.constant=-o,this.sweep.position.set(o,3*i/2,0),this.sweep.scale.set(1,3*i,9*a),this.sweep.material.color.set(this.theme.accent2),t>=1&&this.endMorph()}spiralPos(e,t,n,r){let i=Y.spiral,{t:a,a:o,f:s}=this.axis,c=(e+8)/16,l=(9/2-n)/9,u=t/tf*i.span*o,d=c*i.height*a;if(i.layout===`wrap`){let e=l*i.arc*Math.PI*2+c*i.turns*Math.PI*2,t=i.offset*s+u*.8;return r.set(t*Math.cos(e),d,t*Math.sin(e))}let f=(l-.5)*i.span*s,p=c*i.turns*Math.PI*2,m=Math.cos(p),h=Math.sin(p),g=i.offset+f;return r.set(g*m-u*h,d,g*h+u*m)}updateSpiral(e){let t=Y.spiral;if(!this.spiral){let n=Y.res.spiral,r=this.binGrid(Math.max(1,Math.round(1.4/n)),Math.max(1,Math.round(1/n))),i=r.nT*r.nK,a;if(t.style===`dots`){let e=new ja(new vo(t.radius,1),Md(new jo),i);e.setColorAt(0,new W),a=e}else if(t.style===`rays`){let e=new Yi;e.setAttribute(`position`,new Pi(new Float32Array(i*6),3)),e.setAttribute(`color`,new Pi(new Float32Array(i*6),3)),a=new Xa(e,Md(new Ra({vertexColors:!0,transparent:!0,opacity:.7})))}else{let e=new Yi;e.setAttribute(`position`,new Pi(new Float32Array(i*3),3)),e.setAttribute(`color`,new Pi(new Float32Array(i*3),3));let t=[];for(let e=0;e<r.nT-1;e++)for(let n=0;n<r.nK-1;n++){let i=e*r.nK+n,a=(e+1)*r.nK+n;t.push(i,a,i+1,a,a+1,i+1)}e.setIndex(t),a=new ya(e,Md(new Ao({vertexColors:!0,roughness:.6,metalness:.05,side:2,transparent:!0,opacity:.45,depthWrite:!1})))}a.frustumCulled=!1,this.world.add(a),this.spiral={g:r,pos:new Float32Array(i*3),obj:a},e=!0}let n=this.spiral,r=n.g;this.poolBin(r,e);let i=new W(this.theme.accent),a=new W(this.theme.accent2),o=new Float32Array(r.nT*r.nK*3);for(let e=0;e<r.nT;e++){let t=e/Math.max(1,r.nT-1),n=i.r+(a.r-i.r)*t,s=i.g+(a.g-i.g)*t,c=i.b+(a.b-i.b)*t;for(let t=0;t<r.nK;t++){let i=e*r.nK+t,a=r.col[i*3],l=r.col[i*3+1],u=r.col[i*3+2],d=Math.min(1,.3*a+.55*l+.15*u+.15);o[i*3]=a*.6+n*d*.55,o[i*3+1]=l*.6+s*d*.55,o[i*3+2]=u*.6+c*d*.55}}if(e)for(let e=0;e<r.nT;e++){let t=this.binX(r,e);for(let i=0;i<r.nK;i++){let a=e*r.nK+i;this.spiralPos(t,r.h[a],this.binZ(r,i),pf),n.pos[a*3]=pf.x,n.pos[a*3+1]=pf.y,n.pos[a*3+2]=pf.z}}let s=r.nT*r.nK;if(n.obj instanceof ja){if(n.obj.instanceColor.array.set(o),e){for(let e=0;e<s;e++)ff.makeTranslation(n.pos[e*3],n.pos[e*3+1],n.pos[e*3+2]),n.obj.setMatrixAt(e,ff);n.obj.instanceMatrix.needsUpdate=!0}n.obj.instanceColor.needsUpdate=!0}else if(n.obj instanceof Xa){let t=n.obj.geometry.getAttribute(`position`),r=n.obj.geometry.getAttribute(`color`),i=t.array,a=r.array;for(let t=0;t<s;t++)e&&i.set([0,n.pos[t*3+1],0,n.pos[t*3],n.pos[t*3+1],n.pos[t*3+2]],t*6),a.set([o[t*3]*.05,o[t*3+1]*.05,o[t*3+2]*.05,o[t*3],o[t*3+1],o[t*3+2]],t*6);e&&(t.needsUpdate=!0),r.needsUpdate=!0}else{let t=n.obj,r=t.geometry.getAttribute(`position`),i=t.geometry.getAttribute(`color`);i.array.set(o),i.needsUpdate=!0,e&&(r.array.set(n.pos),r.needsUpdate=!0,t.geometry.computeVertexNormals())}n.obj.visible=!0}binOfZ(e){let t=(9/2-e)/9*(this.zLut.length-1),n=Math.max(0,Math.min(this.zLut.length-1,Math.round(t)));return this.zLut[n]}frameOfX(e){return(e+8)/16*(this.frames()-1)}heightAt(e,t){if(!this.session)return 0;let n=Math.round(this.frameOfX(e)),r=Math.round(this.binOfZ(t));return n<0||n>=this.session.frames||r<0||r>=257?0:this.heights[n*257+r]}dispH(e,t){switch(this.mode){case`rounded`:return this.roundedH(e,t);case`voxel`:return this.voxelH(e,t);case`skyline`:return this.skylineH(e,t);case`drops`:return this.drops?this.binH(this.drops.g,e,t):this.heightAt(e,t);case`surface`:case`symmetry`:return this.surf&&this.surf.s>1?this.binH(this.surf.g,e,t):this.heightAt(e,t);default:return this.heightAt(e,t)}}ray=new Ps;pick(e,t){if(!this.session)return null;let n=this.renderer.domElement.getBoundingClientRect(),r=new B((e-n.left)/n.width*2-1,-((t-n.top)/n.height)*2+1);this.ray.setFromCamera(r,this.camera);let i=this.ray.ray.origin,a=this.ray.ray.direction;if(this.mode===`spiral`)return this.pickSpiral(i,a);if(this.mode===`disc`)return this.pickDisc(i,a);let o=null,s=1/0;for(let e of this.copies()){let t=new V((i.x-e.ox)/e.ax,i.y/e.ay,i.z/e.az),n=new V(a.x/e.ax,a.y/e.ay,a.z/e.az).normalize(),r=this.marchCanonical(t,n);if(!r)continue;let c=pf.set(e.ox+r.x*e.ax,r.y*e.ay,r.z*e.az).distanceTo(i);c<s&&(s=c,o=r)}return o}marchCanonical(e,t){let n=tf+this.unfold*6+.1,r=new gi(new V(-8,-.01,-9/2),new V(8,n,9/2)),i=new oa(e,t),a=new V,o=r.containsPoint(e);if(!o&&!i.intersectBox(r,a))return null;let s=o?0:a.distanceTo(e),c=.03,l=null;for(let n=0;n<2e3;n++){let n=e.clone().addScaledVector(t,s);if((n.x<-8.01||n.x>8.01||n.z<-9/2-.01||n.z>4.51||n.y<-.05)&&l)break;let r=this.dispH(n.x,n.z);if(n.y<=r||n.y<=0){let n=s-c,r=s;for(let i=0;i<8;i++){let i=(n+r)/2,a=e.clone().addScaledVector(t,i);a.y<=this.dispH(a.x,a.z)?r=i:n=i}let i=e.clone().addScaledVector(t,r),a=Math.max(-8,Math.min(8,i.x)),o=Math.max(-9/2,Math.min(9/2,i.z));return{x:a,z:o,y:i.y,t:this.frameOfX(a),k:this.binOfZ(o)}}l=n,s+=c}return null}pickSpiral(e,t){let n=this.spiral;if(!n)return null;let i=(Y.spiral.style===`dots`?Y.spiral.radius*1.6:.07)**2,a=.3**2,o=-1,s=1/0,c=-1,l=1/0,u=n.pos,d=n.g.nT*n.g.nK;for(let n=0;n<d;n++){let r=u[n*3]-e.x,d=u[n*3+1]-e.y,f=u[n*3+2]-e.z,p=r*t.x+d*t.y+f*t.z;if(p<=0)continue;let m=r*r+d*d+f*f-p*p;m<i&&p<s?(s=p,o=n):m<a&&m<l&&(l=m,c=n)}let f=o>=0?o:c;if(f<0)return null;let p=n.g,m=p.tc[Math.floor(f/p.nK)],h=p.kc[f%p.nK],g=this.map.xOfFrame(m),_=af(h*r);return{x:g,z:_,y:this.heightAt(g,_),t:m,k:h}}pickDisc(e,t){if(!this.disc)return null;let n=this.disc.pickCloud(),i=.06**2,a=.3**2,o=-1,s=1/0,c=-1,l=1/0;for(let r=0;r<n.count;r++){let u=n.pos[r*3]-e.x,d=n.pos[r*3+1]-e.y,f=n.pos[r*3+2]-e.z,p=u*t.x+d*t.y+f*t.z;if(p<=0)continue;let m=u*u+d*d+f*f-p*p;m<i&&p<s?(s=p,o=r):m<a&&m<l&&(l=m,c=r)}let u=o>=0?o:c;if(u<0)return null;let d=this.map.xOfFrame(n.t[u]),f=af(n.k[u]*r);return{x:d,z:f,y:this.heightAt(d,f),t:n.t[u],k:n.k[u]}}ov(e,t,n){let r=new V(e,t,n);return this.mode===`disc`&&this.disc?this.disc.toDisplay(e,t,n,r):this.mode===`spiral`?this.spiralPos(e,t,n,r):r}ovH(e,t){return this.mode===`spiral`||this.mode===`disc`?this.heightAt(e,t):this.dispH(e,t)}setLine(e,t){let n=e.geometry.getAttribute(`position`);(!n||n.count<t.length)&&(e.geometry.dispose(),e.geometry=new Yi,n=new Pi(new Float32Array(Math.max(t.length,64)*3),3),e.geometry.setAttribute(`position`,n));let r=n.array;t.forEach((e,t)=>r.set([e.x,e.y,e.z],t*3)),n.needsUpdate=!0,e.geometry.setDrawRange(0,t.length),e.geometry.computeBoundingSphere()}showCursor(e,t){if(!e){this.cursor.visible=!1;return}let n=[];for(let r=0;r<=48;r++){let i=r/48*Math.PI*2,a=e.x+Math.cos(i)*t,o=e.z+Math.sin(i)*t;n.push(this.ov(a,this.ovH(a,o)+.04,o))}this.setLine(this.cursor,n),this.cursor.visible=!0}showFork(e,t,n){if(!e||!this.session){this.forkLines.visible=!1;return}let r=[],i=[];if(n&&n.size)for(let[e,t]of[...n.entries()].sort((e,t)=>e[0]-t[0]))i.push([e,t]);else{let n=Math.round(e.t);for(let e=Math.max(0,n-30);e<=Math.min(this.session.frames-1,n+30);e++)i.push([e,t])}for(let e=1;e<=40;e++)for(let t=0;t<i.length-1;t++){let[n,a]=i[t],[o,s]=i[t+1];if(o-n>3||e*a>7900)continue;let c=this.map.xOfFrame(n),l=this.map.xOfFrame(o),u=af(e*a),d=af(e*s);r.push(this.ov(c,this.ovH(c,u)+.05,u),this.ov(l,this.ovH(l,d)+.05,d))}this.setLine(this.forkLines,r),this.forkLines.visible=r.length>0}showBox(e,t,n=16777215){if(!e||!t){this.boxLine.visible=!1;return}this.boxLine.material.color.set(n);let r=[[e.x,e.z],[t.x,e.z],[t.x,t.z],[e.x,t.z],[e.x,e.z]],i=[];for(let e=0;e<4;e++){let[t,n]=r[e],[a,o]=r[e+1];for(let e=0;e<=30;e++){let r=t+(a-t)*e/30,s=n+(o-n)*e/30;i.push(this.ov(r,this.ovH(r,s)+.05,s))}}this.setLine(this.boxLine,i),this.boxLine.visible=!0}showMarkers(e,t,n){let r=[],i=this.map.zOfBin[Math.round(t)],a=this.map.zOfBin[Math.round(n)];for(let t of e){let e=this.map.xOfFrame(t);r.push(this.ov(e,2.6999999999999997,i),this.ov(e,2.6999999999999997,a)),r.push(this.ov(e,0,i),this.ov(e,2.6999999999999997,i))}this.setLine(this.markers,r),this.markers.visible=r.length>0}clearOverlays(){this.cursor.visible=!1,this.forkLines.visible=!1,this.boxLine.visible=!1,this.markers.visible=!1}setPlayhead(e){this.playSec=e,e===null?(this.playhead.visible=!1,this.spiralRing.visible=!1,J.play.value.z=0):this.mode===`spiral`?(this.spiralRing.visible=!0,this.spiralRing.position.y=Y.spiral.height*this.axis.t*e/5,this.spiralRing.getWorldPosition(pf),J.play.value.set(1,pf.y,1,.15)):(this.playhead.visible=!0,this.playhead.position.x=-8+16*e/5,this.playhead.getWorldPosition(pf),J.play.value.set(0,pf.x,this.mode===`disc`?0:1,.12))}setViewMode(e){this.controls.mouseButtons={LEFT:e?Pe.ROTATE:null,MIDDLE:Pe.PAN,RIGHT:Pe.ROTATE}}worldPerPixel(){return 2*this.camera.position.distanceTo(this.controls.target)*Math.tan(this.camera.fov*Math.PI/360)/Math.max(1,this.renderer.domElement.clientHeight)}moveBy(e){this.camera.position.add(e),this.controls.target.add(e)}panGround(e,t){let n=this.worldPerPixel(),r=new V;this.camera.getWorldDirection(r),r.y=0,r.lengthSq()<1e-6&&r.set(0,0,-1),r.normalize();let i=new V().crossVectors(r,new V(0,1,0)).normalize();this.moveBy(i.multiplyScalar(-e*n).addScaledVector(r,t*n*1.4))}panVertical(e){this.moveBy(new V(0,e*this.worldPerPixel(),0))}orbitBy(e,t){let n=this.camera.position.clone().sub(this.controls.target),r=new Rs().setFromVector3(n);r.theta-=e,r.phi=Math.min(this.controls.maxPolarAngle,Math.max(.05,r.phi-t)),n.setFromSpherical(r),this.camera.position.copy(this.controls.target).add(n)}keys=new Set;stepKeys(e){if(!this.keys.size)return;let t=.9*this.renderer.domElement.clientHeight*e,n=0,r=0;this.keys.has(`a`)&&(n+=t),this.keys.has(`d`)&&(n-=t),this.keys.has(`w`)&&(r+=t),this.keys.has(`s`)&&(r-=t),(n||r)&&this.panGround(n,r);let i=1.4*e;this.keys.has(`arrowleft`)&&this.orbitBy(-i,0),this.keys.has(`arrowright`)&&this.orbitBy(i,0),this.keys.has(`arrowup`)&&this.orbitBy(0,i*.6),this.keys.has(`arrowdown`)&&this.orbitBy(0,-i*.6)}setIso(e){this.iso=e,this.camera.fov=e?9:42,this.camera.updateProjectionMatrix(),this.controls.maxDistance=e?400:60,this.resetCamera(`perspective`)}resetCamera(e=`perspective`){let{t,a:n,f:r}=this.axis,i=new V,a=new V;if(this.mode===`spiral`){let n=Y.spiral.height*t,r=Math.max(18,n*1.9);i.set(0,n/2,0),e===`top`?a.set(0,n+r,.01):e===`side`?a.set(0,n/2,r):a.set(r*.7,n/2+r*.25,r*.7)}else if(this.mode===`disc`&&this.disc){let t=this.disc.frame();i.copy(t.target);let n=t.distance;e===`top`?a.set(0,n,.01).add(i):e===`side`?a.set(0,n*.25,n).add(i):a.set(-n*.25,n*.6,n*.75).add(i)}else{let o=this.mode===`symmetry`,s=o?-.3*n:.4*n;i.set(0,s,0);let c=Math.max(1,t*.85,r*9*1.25/16);e===`top`?a.set(0,21*c,.01):e===`side`?a.set(0,s+3,15*c):o?a.set(-4*c,3.5,17*c):a.set(-2.5*c,10.5*c,15.5*c)}if(this.iso){let t=a.distanceTo(i)*(Math.tan(21*Math.PI/180)/Math.tan(3.9*Math.PI/180))*1.2,n=e===`perspective`?new V(-1,.85,1).normalize():a.clone().sub(i).normalize();a.copy(i).addScaledVector(n,t)}this.controls.target.copy(i),this.camera.position.copy(a)}topSnapshot(e=360,t=.8){let n=this.renderer,r=this.camera,i=this.scene.fog,a={pos:r.position.clone(),target:this.controls.target.clone(),aspect:r.aspect,size:n.getSize(new B),ratio:n.getPixelRatio(),play:J.play.value.clone(),reveal:J.reveal.value.clone(),near:i.near,far:i.far},o=[this.playhead,...this.overlays(),...this.mirrorOverlays,this.mirrorPlayhead,this.axisGroup,this.grid,this.fogVolume.object,this.sweep,this.spiralRing],s=o.map(e=>e.visible);if(o.forEach(e=>e.visible=!1),J.play.value.z=0,J.reveal.value.w=0,i.near=1e4,i.far=1e5,r.aspect=1,this.mode===`spiral`||this.mode===`disc`)this.resetCamera(`top`);else{let{t:e,a:t,f:n}=this.axis,i=Math.max(16*e,9*n)/2*1.02,a=this.mode===`symmetry`?0:.2*t,o=i/Math.tan(r.fov*Math.PI/360)+tf*t;this.controls.target.set(0,a,0),r.position.set(0,a+o,.001)}r.lookAt(this.controls.target),r.updateProjectionMatrix(),n.setPixelRatio(1),n.setSize(e,e,!1),n.render(this.scene,r);let c=document.createElement(`canvas`);return c.width=c.height=e,c.getContext(`2d`).drawImage(n.domElement,0,0),o.forEach((e,t)=>e.visible=s[t]),J.play.value.copy(a.play),J.reveal.value.copy(a.reveal),i.near=a.near,i.far=a.far,n.setPixelRatio(a.ratio),n.setSize(a.size.x,a.size.y,!1),r.aspect=a.aspect,r.position.copy(a.pos),this.controls.target.copy(a.target),r.lookAt(a.target),r.updateProjectionMatrix(),n.render(this.scene,r),c.toDataURL(`image/jpeg`,t)}frame(){let e=Math.min(.1,this.clock.getDelta());J.time.value+=e,this.stepMorph(),this.mirror.visible&&(this.overlays().forEach((e,t)=>{let n=this.mirrorOverlays[t];n.geometry=e.geometry,n.visible=e.visible}),this.mirrorPlayhead.visible=this.playhead.visible,this.mirrorPlayhead.position.copy(this.playhead.position));let t=this.scene.fog;this.stepKeys(e),this.updateAmpLean(),this.stepReveal(),J.hfog.value.z=this.hfogDensity,this.controls.update();let n=this.camera.position.distanceTo(this.controls.target);t.near=n*.75,t.far=n*2.6;let r=this.axis.a,i=Y.atmosphere,a=new V,o=-.3;if(this.mode===`spiral`){let e=Y.spiral.offset*this.axis.f+Y.spiral.span*.8*r+3;a.set(e+4,Y.spiral.height*this.axis.t*.5+1,e+4),o=-.5}else if(this.mode===`disc`){let e=Wd.radius*this.axis.t+Wd.inner+4;a.set(e,1.2+Wd.bowl*Wd.radius*.5,e)}else a.set(16*this.axis.t/2+5,Math.max(.8,i.height*tf*r*1.5),9*this.axis.f/2+5),this.mode===`symmetry`&&(o=-2.4*r*1.2),this.mode===`skyline`&&(o=-Y.skyline.depth*tf*r),a.y+=-o/2;this.fogVolume.update({color:this.theme.fog,center:new V,half:a,bottom:o,density:i.fog,time:J.time.value,viewportHeight:this.renderer.domElement.height,fovDeg:this.camera.fov}),this.renderer.render(this.scene,this.camera),this.labels.render(this.scene,this.camera)}},_f=`
class ScrubHead extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = null; this.pos = 0; this.speed = 0; this.target = 0;
    // clean: play and pause change only the volume (short fade), never the speed
    // glide: the speed glides to its target (after a throw)
    // follow: the head chases the hand on the timeline
    this.mode = 'clean';
    this.followPos = 0;
    this.gain = 0; this.gainTarget = 0;
    this.pausing = false; this.pendingSeek = -1; this.n = 0;
    this.port.onmessage = (e) => {
      const m = e.data;
      if (m.buf) { this.buf = m.buf; this.pos = Math.min(this.pos, this.buf.length - 1); }
      if (m.play) { this.mode = 'clean'; this.speed = 1; this.target = 1; this.gainTarget = 1; this.pausing = false; }
      if (m.pause) { this.gainTarget = 0; this.pausing = true; }
      if (m.seek !== undefined) {
        // jump while silent, so a seek never clicks
        if (this.gain > 0.001 && this.speed !== 0) { this.pendingSeek = m.seek; this.gainTarget = 0; }
        else this.pos = m.seek;
      }
      if (m.rate !== undefined) { this.mode = 'glide'; this.target = m.rate; this.gainTarget = 1; this.pausing = false; }
      if (m.follow !== undefined) { this.mode = 'follow'; this.followPos = m.follow; this.gainTarget = 1; this.pausing = false; }
      if (m.jump !== undefined) this.speed = m.jump;
    };
  }
  process(_in, outs) {
    const out = outs[0][0];
    const b = this.buf;
    if (!b) { out.fill(0); return true; }
    const ratio = ${t} / sampleRate;
    const last = b.length - 1;
    const fade = 1 - Math.exp(-1 / (0.006 * sampleRate)); // about 6 ms
    let goal = this.target;
    if (this.mode === 'follow') {
      // reach the hand's position in about 40 ms, never faster than 12x
      goal = Math.max(-12, Math.min(12, (this.followPos - this.pos) / (${t} * 0.04)));
      if (Math.abs(this.followPos - this.pos) < 1) goal = 0;
    }
    const glide = this.mode === 'follow' ? 0.004 : 0.0016;
    let ended = false;
    for (let i = 0; i < out.length; i++) {
      this.gain += (this.gainTarget - this.gain) * fade;
      if (this.gain < 0.0005 && this.gainTarget === 0) {
        this.gain = 0;
        if (this.pendingSeek >= 0) { this.pos = this.pendingSeek; this.pendingSeek = -1; if (!this.pausing) this.gainTarget = 1; }
        if (this.pausing) { this.speed = 0; this.target = 0; this.pausing = false; }
      }
      if (this.mode !== 'clean') this.speed += (goal - this.speed) * glide;
      this.pos += this.speed * ratio;
      if (this.pos >= last) { this.pos = last; if (this.speed > 0) { this.speed = 0; this.gain = 0; this.gainTarget = 0; if (this.target > 0 && this.mode !== 'follow') ended = true; } }
      if (this.pos <= 0) { this.pos = 0; if (this.speed < 0) this.speed = 0; }
      const i0 = Math.floor(this.pos), f = this.pos - i0;
      const v = b[i0] + (b[Math.min(last, i0 + 1)] - b[i0]) * f;
      // while scrubbing, a resting head is silent
      const scrubGain = this.mode === 'clean' ? 1 : Math.min(1, Math.abs(this.speed) * 6);
      out[i] = v * this.gain * scrubGain * 0.9;
    }
    if (ended) { this.target = 0; this.port.postMessage({ ended: true }); }
    if ((this.n++ & 1) === 0) this.port.postMessage({ pos: this.pos / ${t}, speed: this.pausing ? 0 : this.speed });
    return true;
  }
}
registerProcessor('scrub-head', ScrubHead);
`,vf=class{ctx=null;node=null;ready=null;buf=new Float32Array(t);rep={pos:0,speed:0,at:0};playing=!1;holding=!1;holdPos=0;inertia=null;onChange=()=>{};get duration(){return this.buf.length/t}get position(){if(this.holding)return this.holdPos;let e=this.ctx?this.ctx.currentTime-this.rep.at:0;return Math.max(0,Math.min(this.duration,this.rep.pos+this.rep.speed*Math.max(0,Math.min(.05,e))))}async init(){return this.ready||=(async()=>{this.ctx=new AudioContext;let e=URL.createObjectURL(new Blob([_f],{type:`application/javascript`}));await this.ctx.audioWorklet.addModule(e),URL.revokeObjectURL(e),this.node=new AudioWorkletNode(this.ctx,`scrub-head`,{numberOfInputs:0,outputChannelCount:[1]}),this.node.connect(this.ctx.destination),this.node.port.onmessage=e=>{let t=e.data;t.ended&&(this.playing=!1,this.onChange()),t.pos!==void 0&&(this.rep={pos:t.pos,speed:t.speed,at:this.ctx.currentTime})},this.node.port.postMessage({buf:this.buf,seek:this.rep.pos*t})})(),this.ready}send(e){this.node?.port.postMessage(e)}setBuffer(e,t=!1){this.buf=e,this.send({buf:e}),t&&this.seek(0)}async play(){await this.init(),this.ctx.resume(),this.position>=this.duration-.02&&this.seek(0),this.stopInertia(),this.playing=!0,this.send({play:!0}),this.onChange()}pause(){this.stopInertia(),this.playing=!1,this.send({pause:!0}),this.onChange()}toggle(){this.playing?this.pause():this.play()}seek(e){let n=Math.max(0,Math.min(this.duration,e));this.rep={pos:n,speed:0,at:this.ctx?.currentTime??0},this.send({seek:n*t}),this.onChange()}hold(){this.stopInertia(),this.holdPos=this.position,this.holding=!0,this.init().then(()=>{this.ctx.resume(),this.send({follow:this.holdPos*t})})}drag(e){this.holdPos=Math.max(0,Math.min(this.duration,e)),this.send({follow:this.holdPos*t})}release(e){this.holding=!1,this.rep={pos:this.holdPos,speed:0,at:this.ctx?.currentTime??0};let t=+!!this.playing;if(Math.abs(e-t)<.3){this.send(this.playing?{play:!0}:{pause:!0});return}let n=Math.max(-10,Math.min(10,e));this.send({rate:n,jump:n}),this.inertia={v:n,t0:performance.now(),raf:0};let r=.55,i=()=>{if(!this.inertia)return;let e=(performance.now()-this.inertia.t0)/1e3,t=+!!this.playing+(this.inertia.v-+!!this.playing)*Math.exp(-e/r);this.send({rate:t}),e>r*5?(this.send(this.playing?{play:!0}:{pause:!0}),this.inertia=null):this.inertia.raf=requestAnimationFrame(i)};this.inertia.raf=requestAnimationFrame(i)}stopInertia(){this.inertia&&cancelAnimationFrame(this.inertia.raf),this.inertia=null}},yf=160,bf=128;function xf(e,t){let n=new Float32Array(e.length),r=new Float32Array(t);for(let i=0;i<32;i++){for(let n=0;n<t;n++)r[n]=e[n*32+i];r.sort();let a=r[t>>1];for(let r=0;r<t;r++)n[r*32+i]=(e[r*32+i]-a)/20}return n}function Sf(e,t,n,r){let i=0;for(let a=-2;a<=2;a++){let o=Math.min(t-1,Math.max(0,n+a));for(let t=0;t<32;t++)r[i++]=e[o*32+t]}}var Cf=e=>1/(1+Math.exp(-e));function wf(e,t,n,r){for(let r=0;r<64;r++){let i=e.b1[r],a=r*yf;for(let n=0;n<yf;n++)i+=e.W1[a+n]*t[n];n[r]=i>0?i:0}for(let t=0;t<bf;t++){let i=e.b2[t],a=t*64;for(let t=0;t<64;t++)i+=e.W2[a+t]*n[t];r[t]=Cf(i)}}function Tf(e,t,n,r=new Int8Array(yf),i=new Int8Array(64)){for(let n=0;n<yf;n++)r[n]=Math.max(-127,Math.min(127,Math.round(t[n]/e.sx)));let a=e.sx*e.sw1;for(let t=0;t<64;t++){let n=e.b1[t],o=t*yf;for(let t=0;t<yf;t++)n+=e.W1[o+t]*r[t];let s=n*a;i[t]=s<=0?0:Math.min(127,Math.round(s/e.sh))}let o=e.sh*e.sw2;for(let t=0;t<bf;t++){let r=e.b2[t],a=t*64;for(let t=0;t<64;t++)r+=e.W2[a+t]*i[t];n[t]=Cf(r*o)}}function Ef(e,t,n){let r=xf(e,t),i=new Float32Array(4*t*32),a=new Float32Array(yf),o=new Float32Array(bf),s=new Float32Array(64);for(let e=0;e<t;e++){Sf(r,t,e,a),n.q?Tf(n.q,a,o):wf(n.f,a,s,o);for(let n=0;n<4;n++)for(let r=0;r<32;r++)i[n*t*32+e*32+r]=o[n*32+r]}return i}var Df=yf*64+64*bf,Of=yf*64+64+64*bf+bf,kf=yf*64+64*bf+4*(64+bf);function Af(e,t,n){let r=(e,t=24)=>{let n=[];for(let r=0;r<e.length;r+=t)n.push(`  `+Array.from({length:Math.min(t,e.length-r)},(t,n)=>e[r+n]).join(`, `));return n.join(`,
`)};return`// biospectra_model.h
// Generated by BioSpectra from ${n.clips} human-untangled spectrograms (${n.samples} frames).
// Mask estimator: ${yf} -> 64 (ReLU) -> ${bf} (sigmoid), int8 weights, int32 accumulators.
// Front-end expected on the node (16 kHz PDM mic):
//   512-pt Hann STFT, hop 128, 32 triangular mel bands 50 Hz..8 kHz, 10*log10(power),
//   per-band running median subtracted, divided by 20, 5-frame context (t-2..t+2).
// Output: per class, a 32-band mask in [0,1]. Classes: ${t.join(`, `)}.
#pragma once
#include <stdint.h>
#include <math.h>

#define BS_N_IN ${yf}
#define BS_N_HID 64
#define BS_N_OUT ${bf}
#define BS_N_CLS 4
#define BS_N_MELS 32

static const float bs_sx = ${e.sx.toExponential(8)}f;
static const float bs_sw1 = ${e.sw1.toExponential(8)}f;
static const float bs_sh = ${e.sh.toExponential(8)}f;
static const float bs_sw2 = ${e.sw2.toExponential(8)}f;

static const int8_t bs_w1[BS_N_HID * BS_N_IN] = {
${r(e.W1)}
};
static const int32_t bs_b1[BS_N_HID] = {
${r(e.b1,12)}
};
static const int8_t bs_w2[BS_N_OUT * BS_N_HID] = {
${r(e.W2)}
};
static const int32_t bs_b2[BS_N_OUT] = {
${r(e.b2,12)}
};

static inline int8_t bs_clamp8(float v, float lo) {
  long r = lroundf(v);
  if (r < (long)lo) r = (long)lo;
  if (r > 127) r = 127;
  return (int8_t)r;
}

// x: BS_N_IN normalised features, y: BS_N_OUT mask values in [0,1]
static inline void bs_infer(const float *x, float *y) {
  int8_t xq[BS_N_IN];
  int8_t hq[BS_N_HID];
  for (int i = 0; i < BS_N_IN; i++) xq[i] = bs_clamp8(x[i] / bs_sx, -127);
  const float m1 = bs_sx * bs_sw1;
  for (int j = 0; j < BS_N_HID; j++) {
    int32_t acc = bs_b1[j];
    const int8_t *w = &bs_w1[j * BS_N_IN];
    for (int i = 0; i < BS_N_IN; i++) acc += (int32_t)w[i] * xq[i];
    float h = acc * m1;
    hq[j] = h <= 0 ? 0 : bs_clamp8(h / bs_sh, 0);
  }
  const float m2 = bs_sh * bs_sw2;
  for (int j = 0; j < BS_N_OUT; j++) {
    int32_t acc = bs_b2[j];
    const int8_t *w = &bs_w2[j * BS_N_HID];
    for (int i = 0; i < BS_N_HID; i++) acc += (int32_t)w[i] * hq[i];
    y[j] = 1.0f / (1.0f + expf(-acc * m2));
  }
}
`}var jf=h();function Mf(e,t,n,r,i){let a=g(e,t,jf),o=new Float32Array(4*t*32);return S.forEach((r,i)=>{let a=n[r];a&&o.set(_(a,e,t,jf),i*t*32)}),{feat:a,target:o,frames:t,origin:r,label:i}}var X={session:null,levelIdx:0,dataset:[],model:null,losses:[],evals:[],unlocked:new Set,completed:new Set},Nf=`biospectra.v1`,Pf=e=>{let t=``;for(let n=0;n<e.length;n+=32768)t+=String.fromCharCode(...e.subarray(n,n+32768));return btoa(t)},Ff=e=>Uint8Array.from(atob(e),e=>e.charCodeAt(0));function If(e){let t=Uint8Array.from(e.feat,e=>Math.max(0,Math.min(255,Math.round(e+140)))),n=Uint8Array.from(e.target,e=>Math.round(e*255));return{f:Pf(t),t:Pf(n),n:e.frames,l:e.label}}function Lf(e){return{feat:Float32Array.from(Ff(e.f),e=>e-140),target:Float32Array.from(Ff(e.t),e=>e/255),frames:e.n,origin:`player`,label:e.l}}function Rf(){try{let e=X.dataset.filter(e=>e.origin===`player`).slice(-25).map(If);localStorage.setItem(Nf,JSON.stringify({unlocked:[...X.unlocked],completed:[...X.completed],human:e}))}catch{}}function zf(){try{let e=localStorage.getItem(Nf);if(!e)return!1;let t=JSON.parse(e);return X.unlocked=new Set(t.unlocked??[]),X.completed=new Set(t.completed??[]),X.dataset=(t.human??[]).map(Lf),!0}catch{return!1}}var Bf=new Worker(new URL(new URL(`worker-BcKV-rpn.js`,import.meta.url).href,``+import.meta.url),{type:`module`}),Vf=new Map,Hf=1;Bf.onmessage=e=>{let t=e.data,n=Vf.get(t.id);n&&(t.error?(Vf.delete(t.id),n.reject(Error(t.error))):`result`in t?(Vf.delete(t.id),n.resolve(t.result)):n.onProgress?.(t))};function Uf(e,t){let n=Hf++;return new Promise((r,i)=>{Vf.set(n,{resolve:r,reject:i,onProgress:t}),Bf.postMessage({...e,id:n})})}function Wf(e,t=``,n=4200){let r=document.createElement(`div`);r.className=`toast ${t}`,r.innerHTML=e,document.getElementById(`toasts`).appendChild(r),setTimeout(()=>r.remove(),n)}var Gf={deploy:()=>{},refresh:()=>{}},Kf=e=>Gf=e,qf=null,Jf=0,Yf=!1,Xf=12,Zf=new Map,Qf=()=>document.getElementById(`lab`);function $f(){Qf().hidden=!1,np()}function ep(){Qf().hidden||np()}function tp(){let e=X.dataset.filter(e=>e.origin===`player`),t=X.dataset.filter(e=>e.origin===`sim`),n=X.dataset.reduce((e,t)=>e+t.frames,0),r=S.map((e,t)=>X.dataset.filter(e=>{let n=t*e.frames*32;for(let t=0;t<e.frames*32;t++)if(e.target[n+t]>.5)return!0;return!1}).length);return{human:e.length,sim:t.length,frames:n,perClass:r}}function np(){let e=tp(),t=X.model,n=[[`Edge node`,`Nano 33 BLE Sense records 5 s at 16 kHz`,!0],[`3D spectrogram`,`STFT 512 / hop 128, beamed to the game`,!0],[`Human untangling`,`${e.human} clips separated by players`,e.human>0],[`Training set`,`${e.human+e.sim} clips · ${e.frames.toLocaleString()} frames`,e.human+e.sim>0],[`Train + int8`,t?`round ${t.round} · ${(kf/1024).toFixed(1)} KB`:`not trained yet`,!!t],[`OTA to sensors`,Yf?`model listening on the node`:`waiting for a model`,Yf]],r=[...new Set(X.evals.map(e=>e.round))].sort((e,t)=>e-t).slice(-3),i=[...new Set(X.evals.map(e=>`${e.level}|${e.cls}`))].map(e=>{let[t,n]=e.split(`|`),i=X.evals.filter(e=>e.level===t&&e.cls===n),a=i[0],o=r.map(e=>{let t=i.find(t=>t.round===e);if(!t)return`<td class="num">–</td>`;let n=t.ai-t.baseline;return`<td class="num ${n>0?`pos`:`neg`}">${t.ai.toFixed(1)} <span class="muted">(${n>=0?`+`:``}${n.toFixed(1)})</span></td>`}).join(``);return`<tr><td>${t}</td><td><span style="color:${x[n].color}">●</span> ${x[n].label}</td><td class="num">${a.baseline.toFixed(1)}</td>${o}<td class="num">${a.oracle.toFixed(1)}</td></tr>`}).join(``);Qf().innerHTML=`<div class="sheet">
    <button class="btn ghost close" id="lab-close">Close ✕</button>
    <h2>Edge AI Lab</h2>
    <p class="lead">Every untangled spectrogram becomes a ground-truth source-separation mask. Here those masks train a tiny mask-estimation network, which is quantised to int8 and pushed back to the Arduino nodes. The sensor learns to hear rare species through rain and wind.</p>
    <div class="pipeline">${n.map(([e,t,n])=>`<div class="pipe-step ${n?`on`:``}"><b>${e}</b><span class="muted">${t}</span></div>`).join(``)}</div>
    <div class="lab-grid">
      <div class="card">
        <h4>Training set</h4>
        <div class="kv">
          <span>Human-untangled clips (weight 2x)</span><span>${e.human}</span>
          <span>Simulated community clips</span><span>${e.sim}</span>
          <span>Frames (8 ms each)</span><span>${e.frames.toLocaleString()}</span>
          ${S.map((t,n)=>`<span>Clips with ${x[t].label.toLowerCase()}</span><span>${e.perClass[n]}</span>`).join(``)}
        </div>
        <div class="lab-actions">
          <button class="btn" id="lab-sim" ${qf?`disabled`:``}>+ 40 simulated community clips</button>
          <button class="btn ghost" id="lab-export" ${X.dataset.length?``:`disabled`}>Export dataset (.json)</button>
        </div>
        <p class="muted small">Simulated clips stand in for a crowd of players: random re-mixes of the stems, labelled with imperfect human-like masks (soft-thresholded ideal masks with missed regions).</p>
      </div>
      <div class="card">
        <h4>TinyML model</h4>
        <div class="kv">
          <span>Input</span><span>5 frames × 32 log-mel = ${yf}</span>
          <span>Hidden</span><span>64 ReLU</span>
          <span>Output</span><span>4 classes × 32 mel masks = ${bf}</span>
          <span>Parameters</span><span>${Of.toLocaleString()}</span>
          <span>int8 footprint</span><span>${(kf/1024).toFixed(1)} KB of 1 MB flash</span>
          <span>MACs per 8 ms frame</span><span>${Df.toLocaleString()}</span>
          <span>Trained on</span><span>${t?`${t.trainedOn.human} human + ${t.trainedOn.sim} sim`:`–`}</span>
        </div>
        <div class="lab-actions">
          <label class="slider">Epochs <input type="range" id="lab-epochs" min="4" max="30" step="1" value="${Xf}"><span class="mono">${Xf}</span></label>
          <button class="btn primary" id="lab-train" ${qf||!X.dataset.length?`disabled`:``}>${t?`Retrain`:`Train`} edge model</button>
        </div>
        <canvas class="loss" id="lab-loss" width="600" height="160"></canvas>
        ${qf?`<div class="muted small" style="margin-top:6px">${qf}</div><div class="progress"><div style="width:${Jf*100}%"></div></div>`:``}
      </div>
    </div>
    <div class="card" style="margin-top:14px">
      <div class="card-head"><h4>Does the sensor hear better? SI-SDR (dB) of the int8 model's masks on every node</h4>
        <div class="lab-actions" style="margin:0">
          <button class="btn" id="lab-eval" ${qf||!t?`disabled`:``}>Evaluate on all nodes</button>
          <button class="btn primary" id="lab-deploy" ${t?``:`disabled`}>Push to current node</button>
          <button class="btn ghost" id="lab-header" ${t?``:`disabled`}>Download Arduino header</button>
        </div>
      </div>
      ${i?`<table class="eval"><thead><tr><th>Node</th><th>Target</th><th class="num">Raw mix</th>${r.map(e=>`<th class="num">Model round ${e}</th>`).join(``)}<th class="num">STFT ceiling</th></tr></thead><tbody>${i}</tbody></table>
             <p class="muted small">Positive numbers in brackets = dB improvement over the raw mixture. The ceiling is the ideal ratio mask at full STFT resolution. The model works on 32 mel bands, so it trades some ceiling for a 19 KB footprint.</p>`:`<p class="muted small">Train a model, then evaluate it. Each retraining round adds a column, so you can watch the sensor improve as players contribute.</p>`}
    </div>
  </div>`,rp();let a=e=>document.getElementById(e);a(`lab-close`).onclick=()=>Qf().hidden=!0,a(`lab-sim`).onclick=ip,a(`lab-export`).onclick=dp,a(`lab-train`).onclick=ap,a(`lab-eval`).onclick=cp,a(`lab-deploy`).onclick=()=>{Yf=!0,Qf().hidden=!0,Gf.deploy()},a(`lab-header`).onclick=up;let o=document.getElementById(`lab-epochs`);o.oninput=()=>{Xf=+o.value,o.nextElementSibling.textContent=o.value}}Qf().addEventListener(`click`,e=>{e.target===Qf()&&(Qf().hidden=!0)});function rp(){let e=document.getElementById(`lab-loss`);if(!e)return;let t=e.getContext(`2d`);t.clearRect(0,0,e.width,e.height),t.fillStyle=`#4a6b78`,t.font=`12px JetBrains Mono, monospace`;let n=X.losses;if(!n.length){t.fillText(`training loss (binary cross-entropy) appears here`,14,24);return}let r=Math.max(...n),i=Math.min(...n);t.fillText(`BCE loss ${n[n.length-1].toFixed(4)}`,14,20),t.strokeStyle=`#9be15d`,t.lineWidth=2,t.beginPath(),n.forEach((a,o)=>{let s=14+(e.width-28)*o/Math.max(1,n.length-1),c=34+(e.height-48)*(1-(a-i)/(r-i||1));o?t.lineTo(s,c):t.moveTo(s,c)}),t.stroke()}async function ip(){qf=`Mixing stems and labelling 40 community clips…`,Jf=0,np();try{let e=await Uf({type:`simulate`,sources:await te(),n:40,seed:(Date.now()&65535)+X.dataset.length},e=>{Jf=e.progress,np()});X.dataset.push(...e),Wf(`Added ${e.length} simulated community clips.`,`info`)}catch(e){Wf(`Simulation failed: `+String(e),`warn`)}qf=null,Gf.refresh(),np()}async function ap(){qf=`Training in a Web Worker…`,Jf=0,X.losses=[],np();try{let e=X.dataset.filter(e=>e.origin===`player`).length,t=X.dataset.length-e,n=await Uf({type:`train`,items:X.dataset,epochs:Xf},e=>{Jf=e.progress,e.loss!==void 0&&X.losses.push(e.loss),qf=`Epoch ${e.epoch}/${Xf}`,np()}),r=(X.model?.round??0)+1;X.model={f:n.model,q:n.quant,round:r,trainedOn:{human:e,sim:t}},qf=null,Wf(`Model round ${r} trained and quantised to int8. Evaluating on all nodes…`,`info`),await cp()}catch(e){qf=null,Wf(`Training failed: `+String(e),`warn`)}np()}async function op(e){let t=Zf.get(e);if(!t){let n=A.find(t=>t.id===e);t=new Te(n,await ae(n)),Zf.set(e,t)}return t}function sp(e,t){let n=h(),r=Mf(e.spec.mag,e.frames,{},`player`,``).feat,i=Ef(r,e.frames,{q:t}),a=S.map((t,r)=>v(i.subarray(r*e.frames*32,(r+1)*e.frames*32),e.frames,n)),o=a[0].length;for(let e=0;e<o;e++){let t=0;for(let n of a)t+=n[e];if(t>1)for(let n of a)n[e]/=t}return a}async function cp(){let e=X.model;if(e){qf=`Evaluating on every node…`,np(),X.evals=X.evals.filter(t=>t.round!==e.round);for(let t of A){let r=await op(t.id),i=sp(r,e.q),a=r.scores(()=>!1);for(let o of a){let a=S.indexOf(o.cls);if(a<0)continue;let s=u(r.spec,i[a],n),c={round:e.round,level:`${t.node} ${t.title}`,cls:o.cls,baseline:o.baseline,ai:y(s,r.mixture.refs[o.cls]),oracle:o.oracle};X.evals.push(c)}await new Promise(e=>setTimeout(e,0))}qf=null,np()}}function lp(e,t,n=`text/plain`){let r=document.createElement(`a`);r.href=URL.createObjectURL(new Blob([t],{type:n})),r.download=e,r.click(),setTimeout(()=>URL.revokeObjectURL(r.href),1e3)}function up(){let e=X.model;if(!e)return;let t=X.dataset.reduce((e,t)=>e+t.frames,0);lp(`biospectra_model.h`,Af(e.q,S,{samples:t,clips:X.dataset.length}))}function dp(){let e=(e,t,n)=>{let r=Uint8Array.from(e,e=>Math.max(0,Math.min(255,Math.round((e+n)*t)))),i=``;for(let e=0;e<r.length;e+=32768)i+=String.fromCharCode(...r.subarray(e,e+32768));return btoa(i)},t={format:`biospectra-masks/1`,sample_rate:16e3,stft:{n_fft:512,hop:128,window:`hann`},mel:{n_mels:32,fmin:50,fmax:8e3},classes:S,encoding:{features:`uint8 = round(dB + 140)`,masks:`uint8 = round(mask * 255), class-major [class][frame][mel]`},items:X.dataset.map(t=>({label:t.label,origin:t.origin,frames:t.frames,features:e(t.feat,1,140),masks:e(t.target,255,0)}))};lp(`biospectra_dataset.json`,JSON.stringify(t),`application/json`)}var fp={native:`#9be15d`,invasive:`#ffb020`,threat:`#ff5a5a`,rare:`#56c8ff`},pp=()=>`${w.filter(e=>X.unlocked.has(e.src)).length}/${w.length}`;function mp(e,t){let n=`M0 40`;for(let e=0;e<=160;e+=8)n+=` L${e} ${40-Math.abs(Math.sin(e*.11+t)*18*Math.sin(e*.02+t*2))}`;return`<svg class="wave" width="160" height="50" viewBox="0 0 160 50"><path d="${n}" fill="none" stroke="${e}" stroke-width="2"/></svg>`}function hp(){let e=document.getElementById(`eco`);e.innerHTML=`<div class="sheet">
    <button class="btn ghost close" id="eco-close">Close ✕</button>
    <h2>Your ecosystem</h2>
    <p class="lead">Each species you isolate cleanly (one star or more) appears here. Threats count too: a chainsaw separated from a frog chorus is an illegal-logging alert the sensor can learn to raise on its own.</p>
    <div class="eco-grid">${w.map((e,t)=>{let n=C[e.src],r=X.unlocked.has(e.src),i=fp[e.role],a=n.cls===`chainsaw`?`Illegal logging`:n.common;return`<div class="species ${r?``:`locked`}">
      <span class="role" style="color:${i}">${e.role}</span>
      <h4>${r?a:`???`}</h4>
      <i>${r?n.species??x[n.cls].label:`Untangle its call to reveal it`}</i>
      ${r?`<div class="credit">Recording: ${n.credit} · ${n.license}${n.url?` · <a href="${n.url}" target="_blank" rel="noopener">source</a>`:``}</div>`:``}
      ${mp(i,t*1.7+1)}
    </div>`}).join(``)}</div>
  </div>`,e.hidden=!1,document.getElementById(`eco-close`).onclick=()=>e.hidden=!0,e.onclick=t=>{t.target===e&&(e.hidden=!0)}}var gp=`M46.7305 44.7295L52.2305 50.2295M42.7605 47.7295L47.6905 56.5695M38.1205 49.5195L40.0705 57.7995M33.1705 49.9795L32.6805 60.4495M28.2805 49.0695L25.1305 58.4795M23.8305 46.8495L18.6005 54.4795M20.1505 43.4995L11.6205 50.5895M17.5305 39.2695L10.0405 42.5795M16.1705 34.4895L6.73047 35.7995M16.1705 29.5095L8.94047 28.4995M17.5305 24.7295L8.78047 20.8595M20.1505 20.4995L14.4805 15.7895M23.8305 17.1495L18.2605 9.02953M28.2805 14.9295L25.7105 7.24953M33.1705 14.0195L32.8105 6.21953M38.1205 14.4795L40.8205 3.01953M42.7605 16.2695L47.8505 7.12953M46.7305 19.2695L52.0005 13.9995`,_p=`M36.4998 36.3302L39.6998 41.8702M33.9998 37.0002V44.7002M31.4998 36.3302L28.3598 41.7702M29.6698 34.5002L23.0498 38.3202M28.9998 32.0002H21.5498M29.6698 29.5002L23.2798 25.8102M31.4998 27.6702L28.2398 22.0202M33.9998 27.0002V19.1602M36.4998 27.6702L39.6298 22.2502`,vp=`M84.16 49.64C80.6187 49.64 77.5467 48.9147 74.944 47.464C72.3413 45.9707 70.3147 43.944 68.864 41.384C67.456 38.7813 66.752 35.816 66.752 32.488C66.752 28.7333 67.4987 25.5333 68.992 22.888C70.528 20.2 72.512 18.152 74.944 16.744C77.376 15.2933 79.9573 14.568 82.688 14.568C84.7787 14.568 86.7627 14.9947 88.64 15.848C90.5173 16.6587 92.1813 17.8107 93.632 19.304C95.1253 20.7547 96.2987 22.4827 97.152 24.488C98.0053 26.4507 98.4533 28.6053 98.496 30.952C98.4533 31.8053 98.112 32.5093 97.472 33.064C96.832 33.6187 96.0853 33.896 95.232 33.896H70.336L68.8 28.456H92.864L91.648 29.608V28.008C91.5627 26.5147 91.072 25.2133 90.176 24.104C89.28 22.952 88.1707 22.0773 86.848 21.48C85.5253 20.84 84.1387 20.52 82.688 20.52C81.408 20.52 80.1707 20.7333 78.976 21.16C77.824 21.544 76.7787 22.184 75.84 23.08C74.944 23.976 74.2187 25.1707 73.664 26.664C73.152 28.1147 72.896 29.928 72.896 32.104C72.896 34.4507 73.3867 36.4987 74.368 38.248C75.3493 39.9973 76.672 41.3627 78.336 42.344C80 43.2827 81.8347 43.752 83.84 43.752C85.4187 43.752 86.72 43.6027 87.744 43.304C88.768 42.9627 89.6213 42.5573 90.304 42.088C90.9867 41.6187 91.584 41.1707 92.096 40.744C92.736 40.36 93.376 40.168 94.016 40.168C94.784 40.168 95.424 40.4453 95.936 41C96.448 41.512 96.704 42.1307 96.704 42.856C96.704 43.7947 96.2347 44.648 95.296 45.416C94.144 46.5253 92.544 47.5067 90.496 48.36C88.4907 49.2133 86.3787 49.64 84.16 49.64ZM120.642 14.568C122.946 14.568 124.994 14.824 126.786 15.336C128.578 15.8053 129.965 16.488 130.946 17.384C131.97 18.2373 132.482 19.24 132.482 20.392C132.482 21.1173 132.269 21.8 131.842 22.44C131.415 23.0373 130.775 23.336 129.922 23.336C129.325 23.336 128.813 23.2293 128.386 23.016C128.002 22.8027 127.639 22.5467 127.298 22.248C126.957 21.9493 126.53 21.6507 126.018 21.352C125.549 21.096 124.845 20.8827 123.906 20.712C123.01 20.5413 122.199 20.456 121.474 20.456C119.213 20.456 117.25 20.968 115.586 21.992C113.965 23.016 112.685 24.4027 111.746 26.152C110.85 27.9013 110.402 29.8853 110.402 32.104C110.402 34.3227 110.85 36.3067 111.746 38.056C112.685 39.8053 113.943 41.192 115.522 42.216C117.143 43.24 119.021 43.752 121.154 43.752C122.434 43.752 123.479 43.6667 124.29 43.496C125.101 43.2827 125.805 43.0267 126.402 42.728C127.042 42.344 127.575 41.96 128.002 41.576C128.471 41.1493 129.111 40.936 129.922 40.936C130.861 40.936 131.565 41.2347 132.034 41.832C132.546 42.3867 132.802 43.0907 132.802 43.944C132.802 44.8827 132.226 45.8 131.074 46.696C129.965 47.5493 128.471 48.2533 126.594 48.808C124.717 49.3627 122.647 49.64 120.386 49.64C117.058 49.64 114.157 48.872 111.682 47.336C109.25 45.8 107.351 43.7093 105.986 41.064C104.663 38.4187 104.002 35.432 104.002 32.104C104.002 28.7333 104.706 25.7467 106.114 23.144C107.522 20.4987 109.485 18.408 112.002 16.872C114.519 15.336 117.399 14.568 120.642 14.568ZM153.829 14.568C156.133 14.568 158.182 14.824 159.974 15.336C161.766 15.8053 163.152 16.488 164.133 17.384C165.158 18.2373 165.67 19.24 165.67 20.392C165.67 21.1173 165.456 21.8 165.03 22.44C164.603 23.0373 163.963 23.336 163.109 23.336C162.512 23.336 162 23.2293 161.574 23.016C161.189 22.8027 160.827 22.5467 160.486 22.248C160.144 21.9493 159.717 21.6507 159.206 21.352C158.736 21.096 158.032 20.8827 157.093 20.712C156.198 20.5413 155.387 20.456 154.661 20.456C152.4 20.456 150.438 20.968 148.773 21.992C147.152 23.016 145.872 24.4027 144.934 26.152C144.037 27.9013 143.59 29.8853 143.59 32.104C143.59 34.3227 144.037 36.3067 144.934 38.056C145.872 39.8053 147.131 41.192 148.71 42.216C150.331 43.24 152.208 43.752 154.341 43.752C155.621 43.752 156.667 43.6667 157.478 43.496C158.288 43.2827 158.992 43.0267 159.59 42.728C160.229 42.344 160.763 41.96 161.189 41.576C161.659 41.1493 162.299 40.936 163.109 40.936C164.048 40.936 164.752 41.2347 165.222 41.832C165.734 42.3867 165.99 43.0907 165.99 43.944C165.99 44.8827 165.413 45.8 164.262 46.696C163.152 47.5493 161.659 48.2533 159.782 48.808C157.904 49.3627 155.835 49.64 153.574 49.64C150.245 49.64 147.344 48.872 144.869 47.336C142.438 45.8 140.539 43.7093 139.174 41.064C137.851 38.4187 137.189 35.432 137.189 32.104C137.189 28.7333 137.894 25.7467 139.301 23.144C140.71 20.4987 142.672 18.408 145.189 16.872C147.707 15.336 150.587 14.568 153.829 14.568ZM204.361 32.168C204.361 35.5813 203.614 38.6107 202.121 41.256C200.628 43.8587 198.601 45.9067 196.041 47.4C193.481 48.8933 190.601 49.64 187.401 49.64C184.201 49.64 181.321 48.8933 178.761 47.4C176.201 45.9067 174.153 43.8587 172.617 41.256C171.124 38.6107 170.377 35.5813 170.377 32.168C170.377 28.712 171.124 25.6827 172.617 23.08C174.153 20.4347 176.201 18.3653 178.761 16.872C181.321 15.336 184.201 14.568 187.401 14.568C190.601 14.568 193.481 15.336 196.041 16.872C198.601 18.3653 200.628 20.4347 202.121 23.08C203.614 25.6827 204.361 28.712 204.361 32.168ZM197.961 32.168C197.961 29.8213 197.492 27.7947 196.553 26.088C195.614 24.3387 194.334 22.9733 192.713 21.992C191.134 20.968 189.364 20.456 187.401 20.456C185.438 20.456 183.646 20.968 182.025 21.992C180.404 22.9733 179.124 24.3387 178.185 26.088C177.246 27.7947 176.777 29.8213 176.777 32.168C176.777 34.4293 177.246 36.4347 178.185 38.184C179.124 39.9333 180.404 41.2987 182.025 42.28C183.646 43.2613 185.438 43.752 187.401 43.752C189.364 43.752 191.134 43.2613 192.713 42.28C194.334 41.2987 195.614 39.9333 196.553 38.184C197.492 36.4347 197.961 34.4293 197.961 32.168Z`,yp=`<path d="${gp}" /><path d="${_p}" />`;function bp(e=`ecco`){return`<svg class="brand-logo" viewBox="0 0 215 64" role="img" aria-label="${e}"><g class="brand-rays">${yp}</g><path class="brand-word" d="${vp}" /></svg>`}var xp=`ecco.archive.v1`;function Sp(){try{return JSON.parse(localStorage.getItem(xp)||`[]`)}catch{return[]}}function Cp(e){try{localStorage.setItem(xp,JSON.stringify(e))}catch{try{localStorage.setItem(xp,JSON.stringify(e.slice(0,Math.ceil(e.length/2))))}catch{}}}function wp(e,t={}){if(t.local!==!1||be){let t=Sp().filter(t=>t.id!==e.id);t.unshift(e),Cp(t.slice(0,200)),window.dispatchEvent(new Event(`archive-changed`))}return be?Promise.resolve(void 0):fetch(`${xe()}/archive`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)}).then(()=>window.dispatchEvent(new Event(`archive-changed`))).catch(()=>void 0)}async function Tp(){if(be)return{list:Sp(),online:!0};try{let e=await fetch(`${xe()}/archive`);if(!e.ok)throw Error(String(e.status));return{list:await e.json(),online:!0}}catch{return{list:Sp(),online:!1}}}function Ep(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return Math.abs(t)%360}var Dp=e=>e.replace(/[&<>"]/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`})[e]),Op=e=>e.startsWith(`noise:`)?`${e.slice(6)} noise`:e.replace(/_/g,` `),kp=e=>new Date(e).toLocaleString(`en-GB`,{day:`numeric`,month:`short`,hour:`2-digit`,minute:`2-digit`});function Ap(e,t){let n=[],r=`all`;e.classList.add(`archive-page`);async function i(){let{list:a,online:s}=await Tp();n=a;let c=new Set(Sp().filter(e=>e.player!==`ecco team`).map(e=>e.id)),l=a.filter(e=>c.has(e.id)).length,u=[...new Set(a.map(e=>e.label))];r!==`all`&&r!==`mine`&&!u.includes(r)&&(r=`all`);let d=a.filter(e=>r===`all`?!0:r===`mine`?c.has(e.id):e.label===r),f=(e,t,n)=>`<button class="ar-chip" data-filter="${Dp(e)}" aria-pressed="${r===e}">${Dp(t)} <span>${n}</span></button>`;e.innerHTML=`<header class="ar-top">
        <button class="btn ghost" id="ar-close">← Back</button>
        <div class="ar-title">
          <h1>Community archive</h1>
          <p>${a.length?`<b>${a.length}</b> landscape${a.length===1?``:`s`} solved by the community, <b>${u.length}</b> kind${u.length===1?``:`s`} of sound${l?`, <b>${l}</b> by you`:``}. Every stamp is the landscape seen from above. Open one to explore it again.`:`Every solved landscape lands here as a stamp, seen from above.`}${s?``:` <span class="muted">The server is not reachable, so only your own stamps are shown.</span>`}</p>
        </div>
      </header>
      ${a.length?`<nav class="ar-chips" aria-label="Filter stamps">${f(`all`,`All`,a.length)}${l?f(`mine`,`Yours`,l):``}${u.map(e=>f(e,Op(e),a.filter(t=>t.label===e).length)).join(``)}</nav>
        <div class="stamps">${d.map((e,t)=>`<button class="stamp" data-id="${Dp(e.id)}" style="--i:${Math.min(t,16)}" title="Open this landscape again">
            <span class="st-img"><img src="${e.stamp}" alt="Top view of ${Dp(e.title)}" loading="lazy"></span>
            <span class="st-body">
              <span class="st-label" style="--h:${e.hue}">${Dp(Op(e.label))}</span>
              <b>${Dp(e.title)}</b>
              <small>${Dp(e.place)} · ${kp(e.recorded)}</small>
              <small class="st-kind">${c.has(e.id)?`<span class="st-mine">yours</span> · `:``}${e.kind===`live`?`Live recording`:`Challenge`} · solved ${kp(e.labelled)}</small>
            </span>
          </button>`).join(``)}</div>`:`<div class="ar-empty">No stamps yet. Label a recording with “Send label”, or contribute a challenge, and its landscape lands here.
              ${s?`<br><button class="btn ghost" id="ar-seed">Add the practice landscapes as examples</button>`:``}</div>`}`,e.querySelector(`#ar-close`).onclick=o;let p=e.querySelector(`#ar-seed`);p&&(p.onclick=async()=>{p.disabled=!0,p.textContent=`Drawing the stamps…`,await t.seed(),i()}),p&&be&&p.click(),e.querySelectorAll(`.ar-chip`).forEach(e=>{e.onclick=()=>{r=e.dataset.filter,i()}}),e.querySelectorAll(`.stamp`).forEach(e=>{e.onclick=()=>{let r=n.find(t=>t.id===e.dataset.id);r&&(o(),t.open(r))}})}function a(){e.innerHTML=`<header class="ar-top"><div class="ar-title"><h1>Community archive</h1><p>Loading the stamps…</p></div></header>`,e.hidden=!1,e.scrollTop=0,i()}function o(){e.hidden=!0}return window.addEventListener(`archive-changed`,()=>{e.hidden||i()}),{show:a,hide:o,count:async()=>(await Tp()).list.length}}var jp=`M88.8,179.8L86.9,172.4L84.5,166.1L81.8,164.4L80.9,161.9L80.5,156.8L81.0,152.8L83.8,148.9L84.3,143.7L85.9,139.6L85.1,136.9L80.5,129.3L79.9,126.8L79.7,122.6L82.2,118.9L81.5,115.1L76.7,113.6L76.9,111.3L78.2,107.4L77.5,104.2L77.5,97.0L79.8,94.7L79.9,93.8L77.0,91.3L74.4,86.8L72.0,86.5L70.6,81.7L66.4,77.3L65.1,76.4L57.9,73.4L55.0,72.9L51.6,71.2L42.5,64.4L37.6,58.8L33.0,55.7L32.6,52.8L27.9,50.5L28.9,49.2L32.5,49.1L35.6,50.3L36.6,48.8L35.3,44.5L35.6,43.4L39.0,41.1L44.7,41.1L56.8,57.8L58.7,63.2L70.1,65.0L71.4,66.3L74.5,66.0L81.1,63.4L83.6,59.8L86.1,60.1L91.8,63.5L98.2,65.9L99.9,67.7L102.3,68.3L104.8,66.4L106.3,61.4L107.6,59.1L109.5,57.5L113.2,56.5L116.2,52.4L116.5,40.7L118.0,37.3L120.7,25.9L125.9,20.7L129.6,15.4L133.3,14.7L140.0,15.7L143.8,13.6L148.0,10.3L150.6,9.4L153.1,9.5L155.8,13.1L162.1,19.1L168.8,22.7L174.6,25.1L177.9,33.1L176.3,36.2L169.6,44.9L169.3,47.2L171.6,51.1L162.1,55.8L162.8,57.1L167.8,57.7L168.4,59.4L163.2,70.5L163.1,72.5L166.8,84.4L178.1,89.5L181.2,94.8L186.4,101.8L189.1,104.5L189.2,105.3L188.4,110.1L176.4,128.1L173.7,133.2L173.3,136.3L180.2,150.7L183.8,161.0L187.8,168.4L190.9,180.5L191.1,184.7L187.4,185.5L184.5,187.0L186.3,189.3L184.7,193.1L184.5,198.5L182.7,202.1L183.0,203.0L186.2,203.8L186.4,206.2L186.2,207.7L182.9,210.4L182.6,213.3L184.3,218.2L185.7,219.8L190.7,221.4L191.3,222.7L191.5,226.2L189.2,229.7L189.2,231.0L191.3,237.4L196.2,240.7L197.8,242.5L198.5,248.9L198.1,251.2L193.0,259.9L189.3,262.6L196.6,271.8L206.2,280.0L209.8,283.7L212.4,289.3L215.4,293.8L215.8,296.6L211.6,309.3L209.9,312.7L205.5,319.0L199.2,326.9L184.1,350.2L176.5,360.5L162.0,376.1L151.5,390.6L149.3,392.0L146.8,392.4L145.7,393.4L141.3,390.3L139.1,391.0L136.9,393.1L133.0,393.8L129.8,395.5L129.5,393.1L130.9,388.2L131.0,386.9L130.3,387.0L129.1,389.9L128.4,393.3L127.0,395.0L124.1,395.7L121.2,393.0L119.8,393.0L121.2,397.1L121.2,398.3L119.6,398.1L116.4,401.3L115.6,401.3L114.6,398.7L111.2,401.6L107.9,402.1L106.0,404.2L96.4,407.4L95.0,410.1L93.8,411.1L92.0,410.3L81.3,413.4L76.9,412.6L72.0,418.2L69.2,419.4L68.3,418.9L72.1,413.1L72.3,411.1L70.3,410.1L68.8,408.1L67.4,403.6L66.6,403.4L65.8,407.9L64.6,409.7L62.8,410.9L59.6,410.8L59.2,408.4L59.8,406.1L59.3,405.7L59.8,403.9L61.4,403.8L61.8,402.9L61.8,401.8L60.6,401.5L60.5,400.7L61.7,396.8L56.1,396.0L50.5,392.0L49.2,391.8L48.3,388.2L47.0,388.7L45.0,390.8L41.9,388.1L40.6,373.3L40.9,369.6L42.7,365.2L43.3,360.8L43.2,352.6L44.2,352.6L43.0,349.9L43.4,349.3L44.6,349.3L44.9,348.3L41.1,335.4L38.8,332.4L40.5,323.0L40.4,320.9L40.0,318.3L37.3,315.4L36.2,307.1L36.9,302.4L42.3,294.0L42.6,290.7L45.7,290.4L44.2,287.5L43.8,283.8L48.2,282.5L49.9,283.6L53.7,282.2L57.2,279.6L55.9,274.5L56.4,273.8L57.6,274.3L57.1,271.8L58.5,272.4L60.7,268.8L60.8,266.1L64.7,264.7L69.1,259.1L73.2,256.2L77.4,250.6L79.2,250.4L80.1,246.6L83.7,241.7L84.8,241.0L86.5,236.6L90.9,231.4L93.7,224.8L95.2,222.5L95.7,220.0L97.4,219.7L99.0,217.9L102.3,216.6L105.6,217.0L107.0,217.9L108.3,217.6L108.2,215.3L107.2,214.0L108.0,212.6L109.7,211.6L109.2,208.1L107.7,206.3L109.3,192.8L107.5,190.1L100.6,185.6L97.7,185.2L96.1,181.7L96.9,177.6L96.3,177.7L93.1,180.8L90.2,179.5L88.8,179.8ZM51.6,398.5L50.3,398.7L48.5,396.7L48.3,396.0L49.0,395.5L48.7,393.2L50.1,394.5L50.8,395.9L50.1,396.3L51.6,398.5ZM38.2,282.3L38.4,283.1L39.4,282.9L40.7,281.5L41.7,282.2L41.6,284.1L40.8,283.7L39.8,285.5L38.8,285.9L37.0,284.0L35.9,280.9L38.5,280.9L38.2,282.3ZM54.7,397.2L56.9,398.1L57.8,397.8L58.8,399.9L57.0,401.2L56.9,402.9L57.9,405.4L56.1,405.4L54.9,402.5L53.0,400.5L53.8,397.8L54.7,397.2ZM42.2,390.8L42.0,392.7L39.6,392.8L38.6,391.0L38.1,387.8L39.1,386.5L39.6,388.2L42.2,390.8ZM48.8,406.4L47.1,407.8L46.4,407.4L46.6,405.1L47.6,404.0L49.3,403.9L48.8,406.4ZM45.3,407.7L43.8,408.1L42.8,406.9L44.2,405.1L45.4,405.2L45.3,407.7ZM100.7,212.4L98.1,213.7L96.1,212.9L96.0,210.3L97.3,209.0L99.6,208.5L102.8,209.8L103.3,210.5L101.5,210.9L100.7,212.4Z`,Mp=`M-20.0,450.5L-20.0,87.8L-18.7,93.4L-15.1,86.7L-14.2,84.0L-14.4,70.9L-12.0,69.8L-10.7,69.5L-4.0,72.0L0.9,72.3L16.7,77.7L21.4,72.9L16.7,70.3L21.4,65.1L23.2,58.1L23.0,56.0L19.2,51.2L27.9,50.5L32.6,52.8L33.0,55.7L37.6,58.8L42.5,64.4L51.6,71.2L66.4,77.3L70.6,81.7L72.0,86.5L74.4,86.8L77.0,91.3L79.9,93.8L77.5,97.0L78.2,107.4L76.7,113.6L81.5,115.1L82.2,118.9L79.7,122.6L79.9,126.8L85.9,139.6L84.3,143.7L83.8,148.9L81.0,152.8L80.9,161.9L81.8,164.4L84.5,166.1L88.8,179.8L84.2,180.7L80.8,178.9L72.7,180.6L70.6,182.6L64.5,177.2L60.9,180.2L58.6,177.5L56.6,182.0L56.0,188.1L53.1,187.6L54.2,189.9L53.2,190.8L50.3,190.7L50.8,193.2L49.6,195.0L44.2,195.7L43.5,197.7L44.9,201.5L44.2,201.8L41.5,199.3L43.8,203.7L44.3,207.0L36.8,219.7L39.3,223.0L41.2,230.2L43.4,233.5L42.4,236.8L34.8,244.9L30.4,257.3L20.7,265.5L15.7,267.6L12.4,273.5L11.3,273.7L8.7,271.6L8.5,275.0L6.1,272.9L4.1,278.1L0.6,282.5L-3.2,281.7L-3.6,282.5L-2.4,283.7L-6.8,284.9L-8.1,289.5L-11.3,290.7L-11.8,292.1L-8.6,292.4L-9.2,296.2L-12.9,298.0L-14.3,300.4L-15.9,300.4L-15.6,298.6L-18.1,298.6L-18.8,296.5L-19.3,297.1L-17.7,303.2L-18.9,305.6L-16.6,308.0L-20.0,311.9L-20.0,314.0L-20.0,311.7L-20.0,390.6L-19.4,388.8L-18.0,388.4L-14.4,395.7L-12.9,397.5L-10.3,398.5L-7.6,401.9L-8.0,405.9L-3.7,408.8L-0.2,418.9L-0.5,421.7L-4.8,425.7L-7.3,429.4L-12.5,434.5L-14.4,434.8L-17.8,437.6L-17.6,438.8L-14.9,439.4L-12.6,437.3L-10.4,437.3L-8.5,435.7L-6.6,438.9L-10.1,440.4L-10.8,444.8L-12.3,447.6L-20.0,453.4L-20.0,460.0L-20.0,450.5ZM-10.1,450.8L-11.2,451.1L-10.7,449.2L-9.2,447.7L-10.1,450.8ZM-7.0,433.2L-7.4,434.5L-7.8,432.9L-6.5,430.1L-5.2,431.0L-7.0,433.2ZM260.0,460.0L143.8,460.0L151.2,460.0L145.1,460.0L150.8,449.9L153.2,440.9L155.3,439.9L157.6,437.0L155.2,432.6L156.1,429.8L155.2,423.0L156.0,420.7L157.2,420.5L158.6,423.0L160.7,424.3L162.3,422.6L163.9,418.0L167.9,419.7L171.3,418.8L174.7,412.0L183.7,413.8L191.5,417.1L192.1,415.8L192.4,413.7L189.0,410.9L184.6,404.2L178.6,405.0L173.4,404.3L169.0,398.7L166.1,397.0L163.4,390.4L165.7,392.3L166.2,387.6L163.8,384.9L158.1,389.2L151.5,390.6L162.0,376.1L176.5,360.5L199.2,326.9L209.9,312.7L215.8,296.6L215.4,293.8L209.8,283.7L196.6,271.8L189.3,262.6L193.0,259.9L198.1,251.2L198.5,248.9L197.8,242.5L191.3,237.4L189.2,231.0L191.5,226.2L191.3,222.7L190.7,221.4L185.7,219.8L182.6,213.3L182.9,210.4L186.2,207.7L186.4,206.2L186.2,203.8L183.0,203.0L182.7,202.1L184.5,198.5L184.7,193.1L186.3,189.3L184.5,187.0L191.1,184.7L190.9,180.5L187.8,168.4L183.8,161.0L180.2,150.7L173.3,136.3L173.7,133.2L176.4,128.1L188.4,110.1L189.2,105.3L178.1,89.5L166.8,84.4L163.1,72.5L163.2,70.5L167.9,61.1L168.3,58.4L167.1,57.4L162.8,57.1L162.1,55.8L174.2,50.0L175.8,48.1L178.9,40.1L189.3,36.3L192.2,31.9L192.8,28.8L192.2,26.8L193.3,26.6L200.0,30.7L204.2,30.5L205.3,27.8L204.4,20.7L214.4,24.4L216.1,24.1L218.1,23.2L220.2,19.4L221.8,18.7L223.8,19.6L224.4,18.6L223.6,13.9L241.2,23.1L241.0,27.0L239.6,27.9L226.9,25.0L225.4,26.7L229.6,29.8L230.4,32.8L241.1,33.2L241.4,34.2L240.1,36.7L240.7,37.3L247.7,34.2L248.9,34.9L246.7,45.9L244.5,47.3L243.5,49.3L248.6,46.8L252.9,39.6L260.0,39.5L260.0,169.4L260.0,143.9L256.5,143.7L251.3,140.6L249.4,141.4L243.7,138.2L238.5,131.1L239.9,128.5L230.8,125.9L222.1,125.5L223.6,126.8L227.3,127.5L232.5,131.8L231.9,135.3L238.6,142.1L238.7,143.1L244.2,144.8L244.8,150.7L252.4,154.3L251.3,156.6L247.3,158.8L250.8,159.2L260.0,163.0L260.0,259.5L260.0,-20.0L260.0,460.0ZM143.8,460.0L77.6,460.0L76.3,455.2L77.8,452.0L76.9,450.7L77.8,447.7L77.4,444.2L82.4,441.0L87.5,440.3L87.0,437.1L89.1,437.0L92.7,433.1L96.2,433.8L101.2,431.1L111.0,431.2L112.3,429.6L112.1,426.4L117.0,426.6L128.5,429.8L131.3,429.8L137.3,434.0L153.1,435.4L155.2,432.6L157.6,437.0L155.3,439.9L153.2,440.9L150.8,449.9L145.1,460.0L151.2,460.0L143.8,460.0ZM67.6,458.9L66.2,460.0L64.9,459.2L59.8,460.0L58.7,457.5L57.0,456.2L54.4,456.1L52.6,454.3L59.6,453.0L61.8,448.8L62.8,448.5L63.8,449.0L64.2,451.4L67.3,452.4L69.0,458.6L67.6,458.9Z`,Np=`M186.6,363.0L187.6,360.2L188.6,360.4L190.8,362.3L191.0,360.0L192.7,358.9L192.5,357.1L193.8,353.7L193.5,351.4L197.5,352.5L198.3,351.0L199.9,350.3L199.7,347.8L202.5,342.7L204.1,341.0L205.0,342.3L207.1,343.4L208.3,347.2L209.4,347.3L210.7,346.3L212.0,347.8L212.4,346.9L212.9,346.9L215.0,350.0L217.0,355.1L217.6,353.5L218.7,355.4L222.1,359.0L232.9,367.3L234.1,372.1L237.0,376.6L238.4,383.5L239.4,384.3L240.1,386.3L237.9,392.7L236.3,391.2L234.2,390.7L235.5,396.3L234.1,397.8L234.4,402.2L233.9,403.6L230.1,406.1L228.3,405.8L227.2,404.2L224.8,402.9L221.2,402.1L218.7,402.6L217.0,405.2L217.1,406.7L216.0,410.6L216.4,413.3L215.4,415.2L214.5,415.7L211.4,414.5L208.5,414.9L207.4,414.0L209.1,411.8L208.3,408.7L208.5,406.1L207.0,404.3L205.9,401.5L204.0,394.3L203.5,393.6L202.8,394.1L201.9,389.5L198.6,386.8L198.1,383.9L198.5,379.5L198.1,378.3L197.3,377.6L196.5,374.9L194.5,371.8L187.0,364.5L186.6,363.0ZM162.7,39.0L165.9,37.4L168.1,35.2L167.9,36.2L164.5,40.1L164.2,41.7L164.7,43.1L162.7,45.9L161.9,48.7L159.3,49.4L156.6,51.7L156.6,52.8L160.7,56.3L161.1,57.1L160.8,57.7L154.8,56.8L153.1,57.6L153.6,58.9L154.6,59.3L154.9,60.5L152.7,62.3L152.2,62.0L152.2,60.7L151.2,60.3L149.0,62.7L145.8,61.6L144.1,62.0L142.6,63.4L142.2,62.5L145.1,59.9L144.9,58.4L143.4,56.7L140.7,55.8L140.5,55.1L146.1,51.8L147.4,49.5L150.6,46.8L154.0,44.9L154.7,45.5L156.5,45.5L156.4,44.4L154.8,41.8L155.5,40.5L156.7,40.0L157.4,42.5L159.0,42.1L160.9,39.1L162.7,39.0ZM134.0,236.4L134.9,234.4L134.8,231.8L135.5,230.8L139.7,231.1L141.4,232.1L141.5,235.4L142.3,237.2L144.1,238.8L145.8,238.4L147.7,236.8L150.3,236.1L153.7,236.7L153.8,239.7L151.5,239.8L150.5,240.7L150.9,242.2L157.7,245.6L158.2,246.8L156.2,247.2L153.8,246.2L149.0,243.0L147.4,241.0L146.5,241.2L145.0,242.8L143.3,243.6L142.6,245.1L142.7,246.8L142.2,247.2L141.2,245.7L136.8,242.5L134.0,236.4ZM147.0,374.5L143.7,372.0L143.6,371.1L144.1,370.7L145.5,372.2L147.7,372.6L149.7,371.5L150.2,368.9L151.1,369.3L152.4,372.6L150.6,374.0L147.0,374.5ZM180.3,297.2L181.2,298.7L181.9,298.7L182.2,296.5L180.7,290.8L181.2,289.9L186.4,300.2L186.2,302.7L185.0,304.1L183.7,304.7L182.9,302.4L180.1,298.7L179.5,296.7L179.8,296.3L180.3,297.2ZM176.2,303.8L176.0,301.1L177.2,299.8L178.9,303.2L180.2,302.6L181.2,303.8L180.0,306.4L178.0,305.7L176.0,306.0L175.4,304.6L176.2,303.8ZM199.8,296.9L199.5,294.5L200.0,293.4L201.1,293.1L202.4,290.0L203.7,290.9L204.0,293.8L202.2,297.4L201.3,298.1L200.8,301.3L197.7,300.5L199.8,296.9ZM189.3,280.3L189.5,281.2L188.8,281.4L188.7,282.9L189.3,286.4L191.8,293.1L195.1,298.8L194.9,299.6L193.4,299.8L191.9,303.1L191.0,302.8L193.1,297.3L191.8,294.8L190.0,293.6L186.9,288.5L186.2,286.2L179.0,284.7L172.9,273.0L173.8,269.1L177.5,273.6L185.7,280.2L186.5,280.4L188.0,279.4L189.3,280.3ZM209.6,167.7L211.4,173.8L212.4,175.3L211.7,175.8L209.3,175.4L200.6,169.9L201.9,164.5L203.0,162.8L204.9,161.5L207.2,161.2L208.4,162.2L209.6,167.7ZM204.4,333.0L204.1,328.7L205.4,328.7L206.1,329.4L207.6,333.2L207.0,334.8L205.6,335.1L204.7,334.4L204.4,333.0ZM138.4,345.5L134.2,343.9L133.3,344.2L133.8,345.3L135.7,347.0L135.9,349.2L134.9,349.1L134.3,349.7L133.6,347.5L130.1,341.7L125.5,337.8L125.8,336.0L127.6,333.0L128.1,333.5L127.0,337.2L127.7,337.5L129.6,336.0L129.7,334.4L130.5,334.5L132.0,337.3L132.5,336.5L133.9,337.6L134.3,337.2L134.5,335.9L132.6,334.8L130.7,330.5L134.7,334.1L135.6,335.9L136.0,341.9L136.5,342.8L138.2,343.8L138.4,345.5ZM131.4,287.5L130.7,288.4L131.7,293.6L131.4,293.9L129.8,292.7L128.5,291.4L127.9,287.1L124.6,282.1L124.5,281.4L125.0,281.6L126.7,284.5L127.9,285.4L130.3,284.2L130.6,282.6L127.8,278.8L127.8,277.8L128.5,277.4L131.3,279.2L132.9,279.4L131.7,280.3L133.2,281.7L133.3,282.9L131.4,287.5ZM202.7,258.7L203.2,255.1L204.5,255.9L204.8,257.3L209.5,259.4L209.9,261.0L208.4,260.4L208.0,260.8L209.0,263.6L208.6,264.8L208.9,267.5L205.1,263.7L205.2,261.3L204.6,260.4L202.3,259.8L201.9,259.0L202.7,258.7ZM169.9,159.5L173.7,160.0L172.3,162.3L168.6,165.5L165.8,169.5L161.3,170.7L156.2,170.6L155.4,167.2L153.0,165.3L155.5,165.5L156.5,166.2L157.4,169.0L158.0,169.1L163.7,166.5L164.6,164.6L169.3,162.7L169.4,161.5L167.5,158.8L168.9,158.6L169.9,159.5ZM73.0,355.3L68.6,357.2L63.7,361.5L63.0,363.2L62.2,363.9L61.6,363.6L64.0,360.0L69.8,354.8L73.4,353.6L73.9,353.9L73.0,355.3ZM181.1,327.1L180.3,328.8L180.7,330.2L182.8,332.7L183.2,331.8L184.0,331.9L185.2,334.0L185.6,336.4L184.8,337.0L184.7,338.1L179.5,342.6L176.8,347.4L174.2,348.0L173.9,348.9L167.6,345.2L165.8,346.3L165.5,347.3L168.1,347.6L168.6,348.4L166.7,349.7L166.9,352.6L165.0,353.1L164.8,354.4L160.9,358.0L161.2,358.7L163.2,358.7L166.0,357.9L166.4,357.3L167.3,357.9L169.1,360.1L169.9,362.1L168.6,363.8L160.0,368.8L154.8,368.8L154.1,369.3L152.9,365.7L154.4,364.5L156.4,364.9L158.0,365.9L158.4,365.5L156.2,362.7L152.6,361.9L149.4,362.7L148.5,363.4L144.8,361.6L145.3,360.2L144.1,359.0L142.4,359.0L142.3,356.9L142.9,354.7L142.5,353.3L142.9,352.7L142.5,345.9L143.4,344.3L143.9,350.8L145.7,351.1L146.2,347.3L146.6,348.9L148.0,348.7L149.2,347.7L149.4,346.5L150.8,345.7L151.1,344.6L148.5,341.4L148.5,340.0L152.7,344.1L155.9,351.6L156.8,351.1L157.2,350.0L158.2,350.2L159.5,342.2L162.6,341.3L164.3,338.4L168.9,338.9L169.4,337.5L167.7,336.4L165.0,332.3L161.9,329.2L160.1,328.1L156.5,328.0L153.7,326.7L153.2,325.7L152.9,318.8L151.5,314.8L149.5,315.5L147.2,315.5L145.0,312.2L142.9,312.9L140.8,309.9L140.5,308.9L141.1,309.1L142.9,311.3L143.6,311.2L144.6,309.0L148.1,312.2L149.3,311.5L148.2,308.0L149.5,295.5L149.0,295.0L147.9,296.0L147.4,298.0L146.3,297.5L144.9,295.9L143.4,291.9L140.8,288.7L141.3,287.1L141.1,280.4L141.4,279.6L142.0,279.7L141.9,278.7L140.1,272.2L138.9,271.1L138.1,272.0L137.1,271.0L136.0,268.6L139.7,270.1L140.9,271.3L141.8,273.7L141.4,275.3L144.0,279.4L143.6,283.5L142.3,286.2L145.3,291.1L147.4,292.0L148.2,291.4L151.0,294.2L150.4,289.7L151.0,288.0L152.4,289.2L152.4,290.7L153.1,291.2L155.1,290.4L156.8,291.6L161.0,290.4L157.6,294.7L158.2,297.7L157.6,299.9L159.6,304.4L159.5,305.5L166.2,310.9L170.4,316.4L168.9,316.7L166.3,315.2L163.5,311.9L164.7,312.1L164.5,311.1L161.3,308.5L159.7,309.4L157.9,314.7L156.8,314.3L157.4,310.5L156.0,304.4L154.6,302.7L152.4,303.2L150.9,304.8L150.8,305.9L151.6,306.9L150.8,308.7L152.3,311.1L153.5,314.8L155.7,315.6L155.7,316.8L154.3,320.1L154.5,321.6L156.1,322.2L159.7,321.8L159.8,321.0L160.6,320.5L162.0,322.5L164.7,323.1L165.5,320.8L167.0,318.9L166.4,316.5L168.2,318.1L170.0,322.6L169.4,324.6L168.5,324.9L169.2,326.6L175.6,324.9L177.9,325.4L178.3,323.3L177.3,321.0L176.8,316.3L177.3,314.9L176.7,310.0L177.0,308.1L178.0,308.0L178.5,310.8L179.5,311.1L183.0,315.3L183.4,314.9L182.4,310.9L183.1,308.1L184.2,307.6L185.6,308.9L188.2,314.7L186.6,316.5L185.4,319.5L183.2,319.6L182.5,321.2L183.4,323.1L188.7,325.4L189.1,326.7L187.9,327.4L184.4,326.0L184.0,326.5L182.7,326.2L181.1,327.1ZM152.4,293.9L153.0,298.6L156.2,302.2L156.9,301.8L156.9,300.5L156.1,293.0L153.3,293.1L152.4,293.9ZM148.7,361.1L149.4,359.6L148.6,356.7L145.0,354.5L144.0,355.1L143.4,356.0L144.1,357.2L147.9,361.3L148.7,361.1ZM154.3,352.8L154.1,350.9L152.5,351.2L150.4,350.1L149.8,352.5L146.7,352.6L147.5,353.7L150.7,355.9L153.5,354.3L154.3,352.8ZM163.5,352.9L162.6,351.4L163.5,347.9L164.2,347.1L163.9,344.1L163.2,343.1L161.7,343.5L160.6,342.8L159.8,343.6L160.3,348.7L159.2,350.4L159.1,356.2L162.2,355.3L163.5,354.2L163.5,352.9ZM180.4,333.3L179.8,330.5L177.8,326.8L172.5,327.0L168.9,328.7L167.1,328.7L167.3,332.2L169.2,333.5L171.2,337.1L172.0,339.9L174.6,341.0L176.6,339.7L177.5,337.2L178.1,333.2L179.1,333.0L179.9,334.1L180.4,333.3ZM136.9,297.9L139.4,298.3L138.1,298.7L138.1,300.0L135.7,300.2L137.5,304.5L136.9,305.9L137.7,307.5L137.5,307.9L136.0,307.0L134.6,309.4L135.2,312.1L136.6,312.7L136.2,313.7L133.2,312.2L132.4,308.2L130.5,315.5L127.9,317.4L127.8,319.3L127.1,318.2L127.6,315.3L129.3,315.0L130.1,312.4L129.6,310.4L127.1,309.3L125.3,310.0L124.6,312.7L125.9,317.3L125.3,318.4L123.5,317.7L122.7,318.8L122.8,320.8L121.4,318.1L120.4,317.1L119.8,317.8L120.6,320.9L119.6,323.6L119.7,326.2L119.2,326.0L118.4,323.8L117.6,326.1L117.5,329.1L118.4,331.2L118.1,331.9L116.9,332.3L116.7,333.3L114.4,334.0L114.2,335.4L115.4,336.6L113.9,338.3L113.5,340.3L114.0,341.1L115.7,339.5L115.0,343.5L115.5,348.0L113.4,348.4L113.2,352.2L114.4,353.3L112.7,355.1L112.7,358.6L113.3,359.7L120.2,361.8L121.0,363.5L121.9,364.2L122.6,363.6L122.4,362.2L123.3,359.6L125.3,357.0L124.6,359.3L125.0,362.1L124.6,362.3L123.5,361.2L123.1,361.8L123.9,365.0L123.7,366.1L124.7,367.9L122.2,373.4L121.0,373.5L121.8,371.8L122.3,367.9L121.0,365.2L119.9,364.4L118.3,365.3L114.9,361.1L114.0,361.5L114.6,363.8L112.5,367.4L113.7,369.8L113.5,371.0L112.8,370.9L111.6,368.5L110.3,369.7L109.4,369.0L111.2,365.7L111.9,362.8L111.3,360.8L110.3,362.0L109.4,359.4L108.0,357.9L106.7,353.0L106.6,350.7L108.0,349.3L110.2,348.6L110.5,347.0L110.3,345.2L107.2,341.6L106.9,340.3L108.6,340.9L110.0,340.3L111.0,338.2L110.1,337.1L108.7,336.9L108.8,335.9L112.1,334.8L112.7,332.4L114.1,331.8L114.9,329.6L113.4,327.9L111.9,327.6L111.5,326.3L114.8,326.6L115.6,325.5L116.0,323.2L118.5,320.3L119.2,316.6L118.8,314.4L117.8,314.7L116.5,310.6L115.2,310.3L114.2,306.9L116.8,305.9L117.6,303.0L118.7,303.2L118.6,301.8L117.4,300.2L118.2,297.0L119.4,295.5L118.3,292.5L116.0,290.2L114.0,289.2L112.6,290.8L112.3,293.4L111.9,293.7L109.7,291.7L111.0,289.9L110.9,286.9L112.0,286.2L113.5,283.6L114.0,283.4L114.0,284.7L115.1,286.5L117.0,288.3L117.7,286.8L118.9,287.6L122.0,292.3L121.9,292.7L120.8,292.4L120.8,293.1L126.8,301.3L126.9,303.0L125.7,302.8L122.3,298.9L121.7,299.2L120.7,303.6L120.2,303.8L121.0,306.7L119.0,306.1L117.5,307.5L117.7,310.6L119.5,313.5L121.0,312.9L121.5,311.2L122.2,311.2L122.0,315.2L123.3,316.5L123.6,310.0L126.4,307.7L126.7,306.7L128.3,306.7L128.6,303.8L126.7,298.9L126.7,297.9L130.2,303.7L132.4,306.5L134.1,307.7L134.5,307.1L134.7,304.1L130.3,296.0L133.1,298.6L133.1,293.7L133.7,293.6L133.7,292.8L137.7,290.8L138.3,291.2L137.4,292.1L136.6,294.4L136.9,295.4L135.9,295.3L135.8,296.2L136.9,297.9ZM195.7,206.0L196.3,205.7L200.5,209.0L205.0,207.1L206.2,204.7L212.6,204.8L216.6,206.5L218.0,210.7L222.9,216.1L223.1,217.5L219.6,214.6L218.1,214.2L216.0,211.9L214.9,208.2L213.1,207.4L210.9,207.3L209.9,207.9L209.8,208.9L207.0,208.3L205.0,209.0L203.9,210.3L203.4,212.7L202.2,214.3L198.7,214.7L199.9,212.9L201.8,212.2L201.6,211.2L198.6,209.5L196.4,207.5L195.7,206.0ZM130.4,347.1L129.9,347.6L128.7,347.5L123.7,342.8L121.9,343.8L122.0,345.7L122.3,346.1L123.0,345.2L123.7,346.8L123.1,350.2L121.6,349.8L118.8,346.1L118.7,345.0L120.0,342.3L119.6,340.2L121.1,341.1L122.7,341.3L124.6,338.4L125.6,343.4L127.5,343.3L128.6,342.6L129.9,344.5L130.4,347.1ZM96.6,345.8L93.9,348.4L94.8,349.9L94.2,350.9L92.0,351.2L89.4,353.7L88.3,358.2L90.9,360.3L88.9,360.8L86.5,362.1L86.3,362.8L87.7,364.6L90.3,364.2L92.2,365.5L92.5,366.2L91.8,366.4L91.9,367.2L93.7,370.8L92.2,369.1L82.3,363.4L82.2,360.7L83.4,362.9L84.7,363.6L85.3,363.0L86.7,359.5L86.4,357.2L86.8,355.1L92.3,348.5L91.6,346.7L93.9,347.0L94.6,344.8L98.0,343.1L97.5,345.8L96.6,345.8ZM77.7,355.2L78.0,357.2L81.1,359.3L81.2,361.5L78.7,360.2L76.5,357.1L74.9,356.4L81.1,351.6L78.7,346.3L79.8,345.9L79.3,344.5L80.4,342.9L81.4,338.6L81.1,337.4L81.8,336.9L83.3,337.2L83.8,335.6L86.6,333.0L86.2,329.0L85.7,328.4L80.6,327.3L80.0,323.4L80.9,322.9L81.0,325.5L83.6,326.4L84.5,325.8L84.9,323.1L86.1,322.7L85.3,325.6L89.2,325.7L88.2,327.1L88.3,329.7L89.9,330.2L91.3,327.2L91.9,327.9L91.3,330.3L91.7,330.8L94.7,330.9L95.8,330.2L95.1,328.8L92.7,327.2L92.0,326.2L92.3,325.8L93.6,326.4L96.3,328.4L96.2,324.1L96.7,323.8L96.6,322.0L97.5,321.4L97.8,324.3L98.5,324.1L98.6,324.8L97.0,330.3L97.0,332.6L98.3,335.1L95.6,332.3L94.4,331.9L93.3,332.5L87.7,331.2L87.9,334.0L81.9,340.6L82.4,342.8L81.6,346.0L83.2,346.5L82.2,347.3L82.6,348.0L82.3,351.2L77.7,355.2ZM216.0,234.6L212.6,233.4L213.0,232.0L214.8,232.7L219.4,232.9L220.3,232.2L219.8,229.7L224.1,232.2L224.6,233.6L223.9,235.8L216.0,234.6Z`;function Pp(e,t){return[(t-19)*.430511*40,(70.3-e)*40]}var Fp=e=>e.replace(/[&<>"]/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`})[e]),Ip=e=>e>=1e3?`${(e/1e3).toFixed(1)}k`:String(e);function Lp(e,t){let n=`newest`,r=null,i=null,a=null;e.innerHTML=`
    <div class="wl-inner">
      <section class="wl-hero">
        <div class="wl-brand">${bp()}</div>
        <p class="eyebrow">Community sound labeling</p>
        <h1>Help the forest listen.</h1>
        <p class="lead">Listening posts in Finnish forests hear sounds they cannot name yet. You explore each sound as a 3D landscape, paint what you hear and give it a name. Every label teaches a post in the field.</p>
        <ol class="wl-steps">
          <li><span class="n">1</span><div><b>Listen</b><small>Play the recording and find the sound</small></div></li>
          <li><span class="n">2</span><div><b>Paint</b><small>Brush over it in the landscape</small></div></li>
          <li><span class="n">3</span><div><b>Label</b><small>Name it and send it to the post</small></div></li>
        </ol>
        <div class="wl-cta">
          <button class="btn primary big" id="wl-start">Start the first challenge</button>
          <button class="btn ghost big" id="wl-archive">Community archive</button>
          <p class="wl-status" id="wl-status"></p>
        </div>
      </section>
      <section class="wl-board glass" aria-labelledby="wl-h">
        <header class="wl-head">
          <h2 id="wl-h">Challenges</h2>
          <div class="seg cats" role="tablist" aria-label="Sort challenges">
            ${fe.map(e=>`<button role="tab" data-cat="${e.id}" title="${e.help}" aria-selected="${e.id===n}">${e.label}</button>`).join(``)}
            <span class="seg-pill" aria-hidden="true"></span>
          </div>
        </header>
        <div class="wl-helprow"><p class="wl-help" id="wl-help"></p><button class="btn ghost tiny" id="wl-del-all" hidden title="Delete every waiting recording from the server">Delete all</button></div>
        <div class="wl-body">
          <ul class="wl-list" id="wl-list"></ul>
          <figure class="wl-map">
            <svg viewBox="-6 -6 252 452" role="img" aria-label="Map of Finland with the recording places">
              <defs>
                <clipPath id="wl-clip"><rect x="-6" y="-6" width="252" height="452" rx="6" /></clipPath>
              </defs>
              <g clip-path="url(#wl-clip)">
                ${Rp()}
                <path class="m-nb" d="${Mp}" />
                <path class="m-fi" d="${jp}" />
                <path class="m-lake" d="${Np}" />
                <g id="wl-pins"></g>
              </g>
              <g class="m-north" transform="translate(222 22)"><path d="M0 -10 L5 4 L0 1 L-5 4 Z" /><text y="17" text-anchor="middle">N</text></g>
              <g class="m-scale" transform="translate(14 426)"><line x1="0" x2="${100/111*40}" /><text x="0" y="-5">100 km</text></g>
            </svg>
            <figcaption id="wl-cap"></figcaption>
          </figure>
        </div>
      </section>
    </div>`;let o=t=>e.querySelector(t),s=o(`#wl-list`),c=o(`#wl-pins`),l=o(`#wl-cap`),u=o(`#wl-help`),d=o(`.seg-pill`),f=o(`#wl-status`),p=o(`#wl-start`),m=new Map,h=[],g=()=>n===`newest`?[...r??[],...ce]:ce,_=e=>`${e.lat.toFixed(3)},${e.lon.toFixed(3)}`,v=e=>n===`hottest`?e.labels?`${Math.round(e.disagreement*100)}% disagree`:`No answers yet`:n===`newest`?ge(e.recorded):`${Ip(e.views)} view${e.views===1?``:`s`}`;function y(e){let t=e.kind===`practice`?`<span class="ch-diff" title="Difficulty: ${me[e.difficulty]}"><span class="bars">${[1,2,3,4,5].map(t=>`<i class="${t<=e.difficulty?`on`:``}"></i>`).join(``)}</span>${me[e.difficulty]}</span>`:`<span class="ch-diff">${Math.round(e.durationS)} s</span>`;return`<div class="ch-main">
        <b class="ch-title">${e.kind===`live`?`<span class="live-dot" title="Live recording"></span>`:``}${Fp(e.title)}</b>
        <span class="ch-place">${Fp(e.place)}${e.region?` · ${Fp(e.region)}`:``}</span>
        ${e.guess?`<span class="ch-guess">${Fp(e.guess)}</span>`:``}
      </div>
      <div class="ch-meta"><span class="ch-metric">${v(e)}</span>${t}</div>
      ${e.kind===`live`?`<button class="ch-del" data-del="${e.id}" title="Delete this recording from the server" aria-label="Delete this recording"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg></button>`:``}
      <svg class="ch-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>`}function b(e){let t=m.get(e.id);return t||(t=document.createElement(`li`),t.className=`ch-card`,t.tabIndex=0,t.setAttribute(`role`,`button`),t.onclick=e=>{let n=e.target.closest(`[data-del]`);if(n)return void x([n.dataset.del]);S(t.dataset.id)},t.onkeydown=e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),S(t.dataset.id))},t.onmouseenter=t.onfocus=()=>w(t.dataset.id),m.set(e.id,t)),t.dataset.id=e.id,t.setAttribute(`aria-label`,`${e.title}, ${e.place}, ${ge(e.recorded)}`),t.innerHTML=y(e),t}async function x(e){let n=e?e.length:r?.length??0;if(!n)return;let i=e?`this recording`:`all ${n} waiting recordings`;if(confirm(`Delete ${i} from the server? This cannot be undone.`))try{await t.remove(e);let n=new Set(e??r.map(e=>e.id));r=(r??[]).filter(e=>!n.has(e.id));for(let e of n)m.get(e)?.remove(),m.delete(e);E(),T(!0)}catch(e){console.warn(`delete failed`,e),alert(`The recording could not be deleted. Is the server running?`)}}function S(e){let n=h.find(t=>t.id===e);n&&t.pick(n,h)}function C(){c.innerHTML=``;let e=new Map;for(let t of h)e.set(_(t),[...e.get(_(t))??[],t]);for(let[t,n]of e){let e=n[0],[r,i]=Pp(e.lat,e.lon),a=document.createElementNS(`http://www.w3.org/2000/svg`,`g`);a.setAttribute(`class`,`m-pin`),a.setAttribute(`transform`,`translate(${r.toFixed(1)} ${i.toFixed(1)})`),a.dataset.key=t;let o=Fp(e.place.replace(` National Park`,``))+(n.length>1?` · ${n.length}`:``);a.innerHTML=`<circle class="halo" r="11" /><circle class="dot" r="${n.length>1?6:4.5}" />${n.length>1?`<text class="count" text-anchor="middle" y="3">${n.length}</text>`:``}<text class="name" ${r>144?`x="-10" text-anchor="end"`:`x="10"`} y="4">${o}</text>`,a.addEventListener(`mouseenter`,()=>w(n[0].id)),a.addEventListener(`click`,()=>S(n[0].id)),c.appendChild(a)}}function w(e){i=e;let t=h.find(t=>t.id===e)??h[0];for(let[e,n]of m)n.classList.toggle(`focus`,e===t?.id);c.querySelectorAll(`.m-pin`).forEach(e=>{let n=!!t&&e.dataset.key===_(t);e.classList.toggle(`focus`,n),n&&c.appendChild(e)}),l.innerHTML=t?`<b>${Fp(t.place)}</b>${t.region?`<span>${Fp(t.region)}</span>`:``}<span class="mono">${ve(t)}</span><span>${_e(t.recorded)} · ${ge(t.recorded)}</span>`:``}function T(t){let a=new Map([...m.values()].map(e=>[e,e.isConnected?e.getBoundingClientRect().top:NaN]));h=pe(g(),n);let c=new Set(h.map(e=>e.id));for(let[e,t]of m)c.has(e)||t.remove();if(h.forEach((e,t)=>{let n=b(e);n.style.setProperty(`--i`,String(t)),s.appendChild(n)}),s.querySelector(`.ch-empty`)?.remove(),t)for(let e of h){let t=m.get(e.id),n=a.get(t);if(n===void 0||Number.isNaN(n))continue;let r=n-t.getBoundingClientRect().top;r&&t.animate([{transform:`translateY(${r}px)`},{transform:`translateY(0)`}],{duration:420,easing:`cubic-bezier(.2,.8,.2,1)`})}e.querySelectorAll(`[data-cat]`).forEach(e=>{let t=e.dataset.cat===n;e.setAttribute(`aria-selected`,String(t)),t&&(d.style.width=`${e.offsetWidth}px`,d.style.transform=`translateX(${e.offsetLeft-3}px)`)}),u.textContent=n===`newest`?r===null?`The listening posts cannot be reached right now. The most recent challenges.`:r.length?`Live recordings from the listening posts first, then the most recent challenges.`:`No live recordings are waiting right now. The most recent challenges.`:fe.find(e=>e.id===n).help+`.`,o(`#wl-del-all`).hidden=!(n===`newest`&&r&&r.length),p.disabled=!h.length,p.textContent=h.length?`Start: ${h[0].title}`:`Nothing to start`,C(),w(h.some(e=>e.id===i)?i:h[0]?.id??null)}e.querySelectorAll(`[data-cat]`).forEach(e=>{e.onclick=()=>{n=e.dataset.cat,i=null,T(!0)}}),p.onclick=()=>h[0]&&t.pick(h[0],h);function E(){let e=r?.length??0;f.innerHTML=r===null?`The listening posts cannot be reached right now.`:e?`<span class="live-dot"></span>${e} live recording${e===1?``:`s`} need${e===1?`s`:``} your ears`:`Every live recording has a name. The challenges are ready for you.`}async function D(){r=await t.live().catch(()=>null);let e=a&&r?r.filter(e=>!a.has(e.id)).map(e=>e.id):[];r&&(a=new Set(r.map(e=>e.id))),E(),T(!0);for(let t of e){let e=m.get(t);e&&(e.classList.remove(`fresh`),e.offsetWidth,e.classList.add(`fresh`))}}let O=0;t.subscribe(()=>{clearTimeout(O),O=window.setTimeout(()=>void D(),300)}),o(`#wl-del-all`).onclick=()=>void x(null);let k=o(`#wl-archive`);k.onclick=()=>t.archive();let A=async()=>{let e=await t.archiveCount();k.textContent=e?`Community archive · ${e} stamp${e===1?``:`s`}`:`Community archive`};window.addEventListener(`archive-changed`,A);function j(){A(),e.hidden=!1,document.body.classList.add(`welcoming`),T(!1),requestAnimationFrame(()=>{e.classList.add(`open`),T(!1)}),D()}function ee(){e.classList.remove(`open`),document.body.classList.remove(`welcoming`),setTimeout(()=>{e.classList.contains(`open`)||(e.hidden=!0)},450)}return window.addEventListener(`resize`,()=>!e.hidden&&T(!1)),{show:j,hide:ee,get visible(){return!e.hidden&&e.classList.contains(`open`)}}}function Rp(){let e=``;for(let t=60;t<=70;t+=2){let[,n]=Pp(t,25);e+=`<line class="m-grid" x1="-6" x2="246" y1="${n}" y2="${n}" /><text class="m-gl" x="2" y="${n-3}">${t}°</text>`}for(let t=20;t<=32;t+=4){let[n]=Pp(65,t);e+=`<line class="m-grid" y1="-6" y2="446" x1="${n}" x2="${n}" />`}return e}function zp(e,t){let n=document.createElement(`div`);n.className=`viz-panel`,t.appendChild(n);let r=!0,i=(e,t,n,r,i,a,o)=>`<label title="${o}"><span class="lbl">${t}</span><input type="range" id="${e}" min="${n}" max="${r}" step="${i}" value="${a}"><span class="val" id="${e}-v">${a}</span></label>`,a=(e,t,n,r)=>`<label class="chk" title="${r}"><input type="checkbox" id="${e}" ${n?`checked`:``}> ${t}</label>`,o=(e,t,n)=>`<div class="seg small">${n.map(([n,r,i])=>`<button data-${e}="${n}" class="${n===t?`on`:``}" title="${i}">${r}</button>`).join(``)}</div>`;function s(e){let t=``;return e===`drops`&&(t+=i(`vd-fade`,`Line foot`,0,.6,.02,Y.drops.fade,`Brightness at the bottom of each line`)+a(`vd-points`,`Dots on top`,Y.drops.points,`A dot at the top of each line`)+a(`vd-glow`,`Glow`,Y.drops.glow,`Additive light. Bright, but hides detail where lines overlap`)+`<div class="seg small"><button id="vd-morph-vox" title="Sweep the drop lines into voxels, like the model being built">Build into voxels</button></div>`),e===`spiral`&&(t+=o(`sl`,Y.spiral.layout,[[`wrap`,`Wrap`,`Frequency goes around the time axis, loudness pushes points outward`],[`ribbon`,`Ribbon`,`A twisted ribbon`]])+o(`ss`,Y.spiral.style,[[`rays`,`Rays`,`A line from the time axis to every point`],[`surface`,`Surface`,`A surface through all points`],[`dots`,`Dots`,`Points only`]])+i(`vs-turns`,`Turns`,0,3,.05,Y.spiral.turns,`Full rotations over the clip`)+i(`vs-offset`,`Inner radius`,0,4,.05,Y.spiral.offset,`Distance between the time axis and the quietest points`)+(Y.spiral.style===`dots`?i(`vs-radius`,`Dot size`,.015,.12,.005,Y.spiral.radius,`Radius of every dot`):``)),e===`symmetry`&&(t+=i(`vy-fade`,`Fade depth`,.2,2,.05,Y.symmetry.fade,`How deep the reflection reaches before it is gone`)+a(`vy-lines`,`Break into lines`,Y.symmetry.lines,`Thin lines take over where the reflection fades`)),t}function c(){let t=e.mode;n.innerHTML=`
      <div class="viz-head"><b>View lab</b><button class="btn ghost tiny" id="viz-toggle" title="${r?`Collapse`:`Expand`}">${r?`–`:`+`}</button></div>
      ${r?`<div class="seg">${uf.map((e,n)=>`<button data-mode="${e.id}" class="${e.id===t?`on`:``}" title="${e.label} (Alt+${n+1})">${n+1} ${e.label}</button>`).join(``)}</div>
      <label class="theme-row" title="Colour theme. Auto gives every level its own"><span class="lbl">Theme</span><select id="v-theme">
        <option value="auto" ${e.themeChoice===`auto`?`selected`:``}>Auto (${e.theme.name})</option>
        ${Id.map(t=>`<option value="${t.id}" ${e.themeChoice===t.id?`selected`:``}>${t.name}</option>`).join(``)}
      </select></label>
      <div class="viz-group">
        ${i(`va-a`,`Amplitude`,.1,4,.05,e.axis.a,`Height of the landscape`)}
        ${i(`va-res`,`Resolution`,.1,1,.05,Y.res[t],`How much of the data is drawn. Lower = fewer, bigger cells. Picks still hit the exact frame and bin`)}
        ${a(`v-iso`,`Isometric camera`,e.iso,`A very narrow lens from far away, close to an isometric drawing`)}
      </div>
      ${s(t)?`<div class="viz-group">${s(t)}</div>`:``}`:``}`,l()}function l(){let t=e=>n.querySelector(`#`+e);if(t(`viz-toggle`).onclick=()=>{r=!r,c()},!r)return;n.querySelectorAll(`[data-mode]`).forEach(t=>{t.onclick=()=>{e.setMode(t.dataset.mode),c()}});let i=(t,r)=>n.querySelectorAll(`[data-${t}]`).forEach(n=>{n.onclick=()=>{r(n.dataset[t]),e.rebuildViz(),c()}});i(`sl`,e=>{Y.spiral.layout=e,Y.spiral.offset=e===`wrap`?1.4:1.2,Y.spiral.turns=e===`wrap`?.6:1.25}),i(`ss`,e=>Y.spiral.style=e),t(`v-theme`).onchange=t=>{e.setTheme(t.target.value),c()};let a=t(`va-a`);a.oninput=()=>{e.setAxis(e.axis.t,e.axis.f,parseFloat(a.value)),t(`va-a-v`).textContent=a.value};let o=[[`va-res`,Y.res,e.mode,!0],[`vd-fade`,Y.drops,`fade`,!0],[`vd-points`,Y.drops,`points`,!0],[`vd-glow`,Y.drops,`glow`,!0],[`vs-turns`,Y.spiral,`turns`,!0],[`vs-offset`,Y.spiral,`offset`,!0],[`vs-radius`,Y.spiral,`radius`,!0],[`vy-fade`,Y.symmetry,`fade`,!1],[`vy-lines`,Y.symmetry,`lines`,!0]];for(let[n,r,i,a]of o){let o=t(n);o&&(o.oninput=()=>{r[i]=o.type===`checkbox`?o.checked:parseFloat(o.value);let s=t(n+`-v`);s&&(s.textContent=o.value),a?e.rebuildViz():e.setAxis(e.axis.t,e.axis.f,e.axis.a)})}let s=t(`vd-morph-vox`);s&&(s.onclick=()=>{e.morphTo(`voxel`),c()});let l=t(`v-iso`);l&&(l.onchange=()=>e.setIso(l.checked))}return e.onThemeChange=()=>c(),window.addEventListener(`keydown`,t=>{if(!t.altKey)return;let n=parseInt(t.code.replace(`Digit`,``),10)-1;n>=0&&n<uf.length&&(t.preventDefault(),e.setMode(uf[n].id),c())}),c(),{render:c}}function Bp(e,i){let o=new Ce;e.classList.add(`puzzle-card`);let s=!1,c=!1,l=null,u=null,d=[],f=0,p=``,m=``,h=null,g=null,_=e=>{m=e,y()},v=e=>e.layers.some(e=>e.mask.some(e=>e>.05));function y(){let t,n=`Labeling`;if(h!==null&&!l)n=`Challenge`,t=`<p class="muted small">This challenge has a known answer. Paint each sound into its own layer, then contribute it. The score below shows how clean your separation is.</p>
        <button class="btn primary wide" id="pz-contrib" title="Your painted layers become training examples for the model">Contribute to training set</button>
        <button class="btn wide" id="pz-next-ch">Next challenge →</button>`;else if(!l)t=`<p class="muted small">${c?`Loading the recording…`:m||`Pick a recording on the challenges page.`}</p>`;else{let e=d.map((e,t)=>`<button class="pz-win ${t===f?`on`:``}" data-win="${t}" title="Show seconds ${e.start.toFixed(0)} to ${(e.start+5).toFixed(0)} of the recording. Each part keeps its own painting.">${v(e.session)?`● `:``}Part ${t+1} · ${e.start.toFixed(0)}–${(e.start+5).toFixed(0)} s</button>`).join(``),n=l.duration_s;t=`${d.length>1?`<p class="muted small">This recording is ${n.toFixed(0)} s long. The landscape shows ${5 .toFixed(0)} s at a time, so it comes in ${d.length} parts.</p><div class="pz-wins">${e}</div>`:``}
        <div class="pz-row"><span>Label</span><select id="pz-label" aria-label="Label">${l.labels.map(e=>`<option ${e===p?`selected`:``}>${e}</option>`).join(``)}</select>
</div>
        <p class="muted small">Paint the sound with any tool. Unpainted means the whole recording.</p>
        <button class="btn primary wide" id="pz-send" ${c?`disabled`:``} title="Send the painted part of all parts with this label">Send label</button>
        <button class="btn wide" id="pz-skip" ${c?`disabled`:``} title="Leave this one without an answer and open the next in your list">Next recording →</button>`}e.innerHTML=`<div class="card-head"><h3>${n}</h3></div>${t}`,b()}function b(){let t=t=>e.querySelector(`#`+t),n=t(`pz-skip`);n&&(n.onclick=()=>i.next());let r=t(`pz-next-ch`);r&&(r.onclick=()=>i.next());let a=t(`pz-contrib`);a&&(a.onclick=()=>i.contribute());let o=t(`pz-send`);o&&(o.onclick=()=>void w());let s=t(`pz-label`);s&&(s.onchange=()=>p=s.value),e.querySelectorAll(`[data-win]`).forEach(e=>{e.onclick=()=>x(+e.dataset.win)})}function x(e){f=e;let t=d[e];i.start(t.session,`${t.start.toFixed(0)}–${(t.start+5).toFixed(0)} s`),y()}async function S(e){h=null,l=null,d=[],c=!0,y();try{g||=(await o.stats()).label_options??[`other`];let r=await(await fetch(`${o.base}/clips/${encodeURIComponent(e)}`)).json(),i=[...g.filter(e=>e!==`other`),`noise`,`other`].filter((e,t,n)=>n.indexOf(e)===t),a={clip_id:e,duration_s:r.duration_s??5,labels:i,audio_url:`/clips/${e}/audio`,spectrogram_url:`/clips/${e}/spectrogram`},[s,c]=await Promise.all([o.audio(a),o.grid(a)]);l=a,u=c,p=a.labels[0];let f=s.length/t,h=Math.max(1,Math.ceil(f/5-.05));d=Array.from({length:h},(e,t)=>t===h-1?Math.max(0,f-5):t*5).map(e=>{let r=new Float32Array(n),i=Math.round(e*t);r.set(s.subarray(i,Math.min(s.length,i+n)));let a=0;for(let e=0;e<r.length;e++)a=Math.max(a,Math.abs(r[e]));if(a>0)for(let e=0;e<r.length;e++)r[e]*=.8/a;return{start:e,session:new Te(null,{mix:r,stems:[],refs:{}})}});let _=0,v=-1;d.forEach((e,t)=>{let n=0,r=e.session.mixture.mix;for(let e=0;e<r.length;e+=4)n+=r[e]*r[e];n>v&&(v=n,_=t)}),m=``,x(_)}catch(e){console.warn(`recording load failed`,e),_(`This recording could not be loaded. Try the next one.`)}finally{c=!1,y()}}function C(){if(!u)return null;let e=u,t=Array.from({length:e.rows},()=>Array(e.cols).fill(0)),n=(e,t)=>{let n=0,r=e.length;for(;n<r;){let i=n+r>>1;e[i]<=t?n=i+1:r=i}return n-1},i=Int32Array.from({length:257},(t,i)=>n(e.freqs,i*r)),o=!1;for(let r of d){let s=r.session;for(let c=0;c<s.frames;c++){let l=r.start+c*a;if(l>e.duration_s)break;let u=n(e.times,l);if(!(u<0))for(let e=0;e<257;e++){let n=i[e];if(n<0)continue;let r=0;for(let t of s.layers)r=Math.max(r,t.mask[c*257+e]);r>t[n][u]&&(t[n][u]=r,r>.05&&(o=!0))}}}return o?t.map(e=>e.map(e=>Math.round(e*100)/100)):null}async function w(){if(l){c=!0,y();try{let e=C(),t=await o.submit(l.clip_id,p,e);d[f]&&i.labelled(l.clip_id,p,d[f].session),t.gold?Wf(t.correct?`Well done. It was <b>${t.true_label}</b>.`:`Good try. This one was <b>${t.true_label}</b>.`,`info`):t.accepted&&t.learning_paused?Wf(`Thank you. Your label <b>${p}</b> was saved. Learning is paused on the server.`,`info`):t.accepted?Wf(`Thank you. Your label <b>${p}</b> was accepted.`,`info`):Wf(`Thank you. Your label counts once a few more people agree.`,`info`),e||Wf(`No painting found, so the whole event was sent.`,`info`),l=null,d=[],i.next()}catch(e){console.warn(`label submit failed`,e),Wf(`Your label could not be sent. Please try again.`,`warn`)}finally{c=!1,y()}}}let T=async()=>{try{await o.stats(),s||(s=!0,y(),o.listen(e=>{e.type===`device_updated`&&Wf(`A listening post just learned from your labels.`,`info`,6e3),e.type===`clip_received`&&Wf(`A listening post sent a new recording. You find it on the challenges page.`,`info`)}))}catch{s=!1,y(),setTimeout(T,5e3)}};return y(),be||T(),{open:e=>void S(e),practice(e){h=e,l=null,d=[],y()}}}var Vp=3,Hp=class{cv;ctx;peaks=new Float32Array;peaksPerSec=200;drag=null;colors={wave:`#56c8ff`,played:`#9be15d`,needle:`#ffffff`,tick:`rgba(255,255,255,0.14)`,bg:`rgba(255,255,255,0.03)`};transport;constructor(e,t){this.transport=t,this.cv=document.createElement(`canvas`),this.cv.className=`timeline-canvas`,this.cv.title=`Hold to stop. Drag the waveform left to play forward, right to rewind. Flick to throw.`,e.appendChild(this.cv),this.ctx=this.cv.getContext(`2d`),this.cv.addEventListener(`pointerdown`,e=>this.down(e)),this.cv.addEventListener(`pointermove`,e=>this.move(e)),this.cv.addEventListener(`pointerup`,e=>this.up(e)),this.cv.addEventListener(`pointercancel`,e=>this.up(e));let n=()=>{this.draw(),requestAnimationFrame(n)};requestAnimationFrame(n)}setAudio(e){let n=Math.round(t/this.peaksPerSec),r=Math.ceil(e.length/n),i=new Float32Array(r),a=1e-6;for(let t=0;t<r;t++){let r=0;for(let i=t*n;i<Math.min(e.length,(t+1)*n);i++)r=Math.max(r,Math.abs(e[i]));i[t]=r,a=Math.max(a,r)}for(let e=0;e<r;e++)i[e]=Math.sqrt(i[e]/a);this.peaks=i}setColors(e){Object.assign(this.colors,e)}pxPerSec(){return this.cv.clientWidth/Vp}down(e){if(e.button!==0)return;try{this.cv.setPointerCapture(e.pointerId)}catch{}this.transport.hold();let t=this.transport.position;this.drag={x:e.clientX,pos:t,samples:[{t:performance.now(),pos:t}]},this.cv.classList.add(`held`)}move(e){if(!this.drag)return;let t=this.drag.pos+-1*(e.clientX-this.drag.x)/this.pxPerSec();this.transport.drag(t);let n=this.drag.samples;for(n.push({t:performance.now(),pos:this.transport.position});n.length>2&&n[n.length-1].t-n[0].t>90;)n.shift()}up(e){if(!this.drag)return;this.move(e);let t=this.drag.samples,n=t[0],r=t[t.length-1],i=(r.t-n.t)/1e3,a=i>.012&&performance.now()-r.t<80?(r.pos-n.pos)/i:+!!this.transport.playing;this.drag=null,this.cv.classList.remove(`held`),this.transport.release(a)}draw(){let e=this.cv,t=Math.min(2,window.devicePixelRatio||1),n=e.clientWidth,r=e.clientHeight;if(!n||!r)return;(e.width!==Math.round(n*t)||e.height!==Math.round(r*t))&&(e.width=Math.round(n*t),e.height=Math.round(r*t));let i=this.ctx;i.setTransform(t,0,0,t,0,0),i.clearRect(0,0,n,r);let a=this.colors,o=this.transport.position,s=this.transport.duration,c=this.pxPerSec(),l=n/2,u=r-12,d=u/2+2,f=l+(0-o)*c,p=l+(s-o)*c;i.fillStyle=a.bg,i.fillRect(Math.max(0,f),2,Math.min(n,p)-Math.max(0,f),u);for(let e=0;e<n;e+=2){let t=o+(e-l)/c;if(t<0||t>s)continue;let n=this.peaks[Math.min(this.peaks.length-1,Math.floor(t*this.peaksPerSec))]??0,r=Math.max(1,n*(u/2-2));i.fillStyle=e<l?a.played:a.wave,i.globalAlpha=e<l?.55:.9,i.fillRect(e,d-r,1.4,r*2)}i.globalAlpha=1,i.fillStyle=`rgba(255,255,255,0.35)`,i.font=`10px JetBrains Mono, monospace`;for(let e=Math.ceil(o-Vp);e<=o+Vp;e++){if(e<0||e>s)continue;let t=l+(e-o)*c;i.fillRect(t,2,1,5),i.fillText(`${e}s`,t+3,11)}let m=(-1*o*c%14+14)%14;i.fillStyle=a.tick;for(let e=m-14;e<n;e+=14)i.fillRect(e,r-8,2,6);i.fillStyle=a.needle,i.fillRect(l-1,0,2,r),i.beginPath(),i.moveTo(l-5,0),i.lineTo(l+5,0),i.lineTo(l,6),i.fill()}},Z=e=>document.querySelector(e);document.documentElement.classList.add(`ready`);var Up=(e,t=1)=>{let n=e.toFixed(t);return(n.startsWith(`-`)&&+n!=0?``:`+`)+(+n==0?0 .toFixed(t):n)},Q=new gf(Z(`#canvas-wrap`)),Wp=zp(Q,Z(`.dock-left`)),Gp=new vf,Kp=new Hp(Z(`#timeline`),Gp),$={tool:`brush`,radius:.45,strength:.6,grip:6,exclusive:!0,forkSalience:5,forkPersistence:6,forkSteady:!1,echoThreshold:.5},qp=null,Jp=!1,Yp=[];function Xp(){let e=X.session;e&&(Yp.push({layers:e.layers.map(e=>({...e,mask:e.mask.slice()})),active:e.activeLayer}),Yp.length>12&&Yp.shift())}function Zp(){let e=X.session,t=Yp.pop();e&&t&&(e.layers=t.layers,e.activeLayer=t.active,lm(!0))}async function Qp(e){X.levelIdx=e,qp=null;let t=A[e];em(new Te(t,await ae(t)))}function $p(e,t){Z(`#crumb-title`).textContent=e,Z(`#crumb-place`).textContent=t}function em(e){X.session=e,Jp=!1,Yp.length=0,e.layers.length||e.addLayer(e.level?.targets[0]??`unknown`),Q.setSession(e),Q.reveal(),Gp.pause(),Om(!0),tm(),nm(),im(),pm()}function tm(){Z(`#eco-count`).textContent=pp(),Z(`#ds-count`).textContent=String(X.dataset.length)}function nm(){let e=X.session,t=Z(`#layer-filter`),n=e.level?[...new Set([...e.level.targets,...e.level.stems.map(e=>C[e.src].cls)])]:Object.keys(x),r=e.layers.map((t,n)=>{let r=t.origin===`ai`?`<button class="icon-btn" data-a="adopt" title="Accept this layer from the model and correct it">✓</button>`:``;return`<li class="${n===e.activeLayer?`active`:``}" data-i="${n}" title="Click to paint into this layer (${n+1})">
        <span class="sw" style="background:${t.color};opacity:${t.visible?1:.3}"></span>
        <span class="name">${t.name}${t.origin===`ai`?` <small>model</small>`:``}</span>
        ${r}
        <button class="icon-btn" data-a="listen" title="Listen to this layer only">
          <svg viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></svg></button>
        <button class="icon-btn" data-a="vis" title="${t.visible?`Hide`:`Show`}">${t.visible?`◉`:`○`}</button>
        <button class="icon-btn" data-a="del" title="Delete layer">✕</button>
      </li>`}).join(``);t.innerHTML=`<div class="lf-head"><h6>Layers</h6>
      <select id="lf-add" title="Add a layer for another sound" aria-label="Add layer"><option value="">+ Add</option>
        ${n.map(e=>`<option value="${e}">${x[e].label}</option>`).join(``)}</select></div>
    <ul>${r||`<li class="empty">No layers yet</li>`}</ul>`;let i=t.querySelector(`#lf-add`);i.onchange=()=>{i.value&&(Xp(),e.addLayer(i.value),lm())},t.querySelectorAll(`li[data-i]`).forEach(t=>{t.onclick=n=>{let r=+t.dataset.i,i=e.layers[r],a=n.target.closest(`[data-a]`)?.getAttribute(`data-a`);a===`listen`?(e.activeLayer=r,km(`layer`),Gp.play()):a===`vis`?i.visible=!i.visible:a===`del`?(Xp(),e.removeLayer(r)):a===`adopt`?(i.origin=`player`,i.name+=` (from model)`,Wf(`Layer accepted. Fix what the model got wrong. That correction is the most valuable label.`,`info`)):e.activeLayer=r,lm(a===`vis`||a===`del`||a===`adopt`)}})}function rm(e,t){let n=x[e.cls],r=N(e.progress),i=[0,1,2].map(e=>`<span class="${e<r?``:`off`}">★</span>`).join(``),a=Math.min(e.baseline,e.player??e.baseline)-2,o=e.oracle+2,s=e=>`${100*(e-a)/(o-a)}%`,c=e.player??e.baseline,l=t?.player==null?``:`<div class="score-nums" style="margin-top:3px"><span style="color:#56c8ff">model ${t.player.toFixed(1)} dB (${Up(t.player-t.baseline)} dB)</span></div>`;return`<div class="score">
    <div class="score-head"><span>${n.label}</span><span class="stars">${i}</span></div>
    <div class="bar"><div class="fill" style="width:${s(c)};background:${n.color}"></div>
      <div class="tick" style="left:${s(e.baseline)}" title="raw mixture"></div>
      <div class="tick" style="left:${s(e.oracle)};background:#ffe08a" title="ideal ratio mask ceiling"></div></div>
    <div class="score-nums">
      <span><small>mix</small><b>${e.baseline.toFixed(1)}</b></span>
      <span class="you"><small>you</small><b>${e.player===null?`–`:e.player.toFixed(1)}</b>${e.player===null?``:`<em>${Up(e.player-e.baseline)}</em>`}</span>
      <span class="ceil"><small>ceiling</small><b>${e.oracle.toFixed(1)}</b></span>
    </div>
    ${l}
  </div>`}function im(){let e=X.session,t=Z(`#scores`);if(!e.hasTruth){t.innerHTML=`<p class="muted small">Real recordings have no clean reference, so they cannot be scored. They still make great training labels.</p>`;return}let n=e.scores(),r=e.layers.some(e=>e.origin===`ai`)?e.scores(e=>e.origin===`ai`):[];t.innerHTML=n.map((e,t)=>rm(e,r[t])).join(``)+`<p class="score-note">Ceiling: the best result any painting can reach on this clip.</p>`,om(n)}function am(e){return e.startsWith(`chainsaw`)?`chainsaw_b`:e}function om(e){let t=X.session;if(!t.level)return;let n=!1;for(let r of e)if(!(N(r.progress)<1))for(let e of t.level.stems){if(C[e.src].cls!==r.cls)continue;let t=am(e.src);if(!X.unlocked.has(t)){X.unlocked.add(t),n=!0;let e=C[t];Wf(`<b>${e.cls===`chainsaw`?`Threat identified`:`Species unlocked`}:</b> ${e.common}${e.species?` <i>(${e.species})</i>`:``}`)}}e.length&&e.every(e=>N(e.progress)>=1)&&!X.completed.has(t.level.id)&&(X.completed.add(t.level.id),n=!0,Wf(`Node ${t.level.node} untangled. Contribute it to the training set to teach the sensor.`,`info`,6e3)),n&&(Rf(),tm())}var sm=0,cm=0;function lm(e=!1){(e||Q.unfold>0)&&Q.markHeightsDirty(),Q.refresh(),nm(),clearTimeout(sm),sm=window.setTimeout(im,180),(Em!==`mix`||Q.unfold>0||Q.whiten)&&(clearTimeout(cm),cm=window.setTimeout(()=>Om(),250))}function um(){let e=X.session;return(e.activeLayer<0||!e.layers.length)&&e.addLayer(e.level?.targets[0]??`unknown`),e.activeLayer}var dm=(e=!1)=>({strength:$.strength,grip:$.grip,erase:e,exclusive:$.exclusive});function fm(e){Oe(X.session,Q.map,e.x,e.z,$.radius)}function pm(){let e=Z(`#tool-options`),t=(e,t,n,r,i,a,o=``,s=t)=>`<label title="${s}">${t} <input type="range" id="${e}" min="${n}" max="${r}" step="${i}" value="${a}"><span class="val" id="${e}-v">${a}${o}</span></label>`,n=t(`o-grip`,`Grip`,-10,25,1,$.grip,` dB`,`How far above the quiet background a cell must be to get painted`),r=``;$.tool===`brush`?r=t(`o-radius`,`Size`,.1,1.5,.05,$.radius)+t(`o-strength`,`Flow`,.1,1,.05,$.strength)+n:$.tool===`eraser`?r=t(`o-radius`,`Size`,.1,1.5,.05,$.radius):$.tool===`fork`?r=t(`o-sal`,`Salience`,1,15,.5,$.forkSalience,` dB`,`How much the line must stand out to be followed`)+t(`o-pers`,`Persistence`,0,30,1,$.forkPersistence,``,`How many quiet frames the fork bridges`)+n+`<label title="Select the same pitch across the whole clip"><input type="checkbox" id="o-steady" ${$.forkSteady?`checked`:``}> Steady</label>`:$.tool===`echo`&&(r=t(`o-thr`,`Match`,.2,.9,.05,$.echoThreshold,``,`How similar a repeat must be`)+n),($.tool===`brush`||$.tool===`echo`||$.tool===`fork`)&&(r+=`<label title="Painting a cell into one layer removes it from the others"><input type="checkbox" id="o-excl" ${$.exclusive?`checked`:``}> Exclusive</label>`),e.innerHTML=r,e.hidden=!r;let i=(e,t)=>{let n=document.getElementById(e);n&&(n.oninput=()=>{$[t]=n.type===`checkbox`?n.checked:parseFloat(n.value);let r=document.getElementById(e+`-v`);r&&(r.textContent=n.value+(e===`o-grip`||e===`o-sal`?` dB`:``))})};i(`o-radius`,`radius`),i(`o-strength`,`strength`),i(`o-grip`,`grip`),i(`o-sal`,`forkSalience`),i(`o-pers`,`forkPersistence`),i(`o-steady`,`forkSteady`),i(`o-thr`,`echoThreshold`),i(`o-excl`,`exclusive`),document.querySelectorAll(`.tool[data-tool]`).forEach(t=>{let n=t.getAttribute(`data-tool`)===$.tool;t.classList.toggle(`active`,n),t.setAttribute(`aria-checked`,String(n)),n&&t.after(e)}),Q.setViewMode($.tool===`view`),Z(`#canvas-wrap`).classList.toggle(`cursor-tool`,$.tool!==`view`),Q.clearOverlays()}function mm(e){$.tool=e,pm(),gm({view:`Drag to rotate. Shift+drag slides, W A S D moves.`,brush:`Paint the sound into the active layer. Grip ignores the quiet background.`,echo:`Drag a box around one call. Echo finds its repeats.`,fork:`Click the lowest line of a call. Fork selects it together with its harmonics.`,eraser:`Paint over cells to bring them back to the untouched recording.`}[e])}var hm=0;function gm(e,t=!1){Z(`#hint`).textContent=e,clearTimeout(hm),t||(hm=window.setTimeout(()=>Z(`#hint`).textContent=``,5e3))}var _m=null;Z(`#canvas-wrap`).addEventListener(`pointerdown`,e=>{e.button===0&&(e.shiftKey||e.altKey)&&(e.stopPropagation(),e.preventDefault(),_m={kind:e.altKey?`orbit`:e.metaKey||e.ctrlKey?`vertical`:`ground`,x:e.clientX,y:e.clientY},Q.controls.enabled=!1,Z(`#canvas-wrap`).classList.add(`navigating`))},!0),window.addEventListener(`pointermove`,e=>{if(!_m)return;let t=e.clientX-_m.x,n=e.clientY-_m.y;_m.x=e.clientX,_m.y=e.clientY,_m.kind===`ground`?Q.panGround(t,n):_m.kind===`vertical`?Q.panVertical(n):Q.orbitBy(t*.008,n*.006)}),window.addEventListener(`pointerup`,()=>{_m&&(_m=null,Q.controls.enabled=!0,Z(`#canvas-wrap`).classList.remove(`navigating`))});var vm=Q.renderer.domElement,ym=!1,bm=null,xm=null,Sm=!1,Cm=null;function wm(e){let t=X.session,n=Math.round(e.t),i=Math.round(e.k),o=n*257+i,s=e.k*r,c=t.db[o]-t.floor[i];return`${(n*a).toFixed(2)} s · ${s>=1e3?(s/1e3).toFixed(2)+` kHz`:s.toFixed(0)+` Hz`} · ${c>=0?`+`:``}${c.toFixed(0)} dB over background`}function Tm(e){let t=X.session;if(!t||_m)return;let n=Q.pick(e.clientX,e.clientY);xm=n,n?(gm(wm(n),!0),$.tool===`brush`||$.tool===`eraser`?(Q.showCursor(n,$.radius),ym&&($.tool===`brush`?P(t,Q.map,um(),n.x,n.z,$.radius,dm()):fm(n),Q.refresh())):$.tool===`fork`?Q.showFork(n,n.k*r):$.tool===`echo`&&ym&&bm&&Q.showBox(bm,n,16743112)):(Q.showCursor(null,0),$.tool===`fork`&&Q.showFork(null,0))}vm.addEventListener(`pointermove`,e=>{Cm=e,Sm||(Sm=!0,requestAnimationFrame(()=>{Sm=!1,Cm&&Tm(Cm)}))}),vm.addEventListener(`pointerdown`,e=>{if(e.button!==0||$.tool===`view`||!X.session)return;let t=X.session,n=Q.pick(e.clientX,e.clientY);if(n){try{vm.setPointerCapture(e.pointerId)}catch{}if(Xp(),$.tool===`brush`)ym=!0,P(t,Q.map,um(),n.x,n.z,$.radius,dm()),Q.refresh();else if($.tool===`eraser`)ym=!0,fm(n),Q.refresh();else if($.tool===`fork`){let e=um(),i=je(t,n.t,n.k*r,{minSalience:$.forkSalience,persistence:$.forkPersistence,tolerance:.04,steady:$.forkSteady});if(i.size<3){Wf(`The fork found no clear line here. Lower the salience or click the lowest bright line of a call.`,`warn`),Yp.pop();return}Me(t,e,i,dm()),Q.showFork(n,n.k*r,i);let o=[...i.values()],s=o.reduce((e,t)=>e+t,0)/o.length;gm(`Fork: ${(i.size*a).toFixed(2)} s of a call at ${s.toFixed(0)} Hz and its harmonics`),lm()}else ym=!0,bm=n}}),vm.addEventListener(`pointerup`,e=>{if(!ym)return;ym=!1;let t=X.session,n=Q.pick(e.clientX,e.clientY)??xm;if($.tool===`echo`&&bm&&n){let e=Ne(t,um(),bm.t,n.t,bm.k,n.k,$.grip,$.echoThreshold);Q.showMarkers(e.matches.map(e=>e.t),Math.min(bm.k,n.k),Math.max(bm.k,n.k)),e.matches.length<=1?Wf(`No repeats found. Box exactly one call, or lower the match value.`,`warn`):Wf(`Echo found <b>${e.matches.length}</b> repeats${e.periodSec?`, one every <b>${e.periodSec.toFixed(2)} s</b>`:``}`,`info`),setTimeout(()=>Q.showBox(null,null),600)}bm=null,lm($.tool===`eraser`)}),vm.addEventListener(`pointerleave`,()=>{Q.showCursor(null,0),Z(`#hint`).textContent=``}),vm.addEventListener(`contextmenu`,e=>e.preventDefault());var Em=`mix`;function Dm(){let e=X.session,t=Q.unfold,n=Q.whiten,r=null;if(Em===`layer`&&e.active?r=e.layerMask(e.active):Em===`res`&&(r=e.residualMask()),!r&&!n&&t<=0)return e.mixture.mix;let i=e.spec.mag.length;if(r||=new Float32Array(i).fill(1),Em===`mix`&&t>0){let n=1+3*t;for(let t of e.layers)if(t.visible)for(let e=0;e<i;e++)t.mask[e]>0&&(r[e]*=1+(n-1)*Math.min(1,t.mask[e]))}if(n){let t=e.backgroundMask();for(let e=0;e<i;e++)r[e]*=t[e]}let a=e.maskedAudio(r),o=0;for(let e=0;e<a.length;e++)o=Math.max(o,Math.abs(a[e]));if(o>.95)for(let e=0;e<a.length;e++)a[e]*=.95/o;return a}function Om(e=!1){if(!X.session)return;let t=Dm();Gp.setBuffer(t,e),Kp.setAudio(t)}function km(e){if(e===`layer`&&!X.session?.active)return Wf(`Pick a layer first.`,`warn`);Em=e,document.querySelectorAll(`[data-pm]`).forEach(t=>t.classList.toggle(`on`,t.dataset.pm===e)),Om()}Gp.onChange=()=>Z(`#play`).classList.toggle(`playing`,Gp.playing),Z(`#play`).onclick=()=>Gp.toggle(),Z(`#to-start`).onclick=()=>Gp.seek(0),document.querySelectorAll(`[data-pm]`).forEach(e=>e.onclick=()=>km(e.dataset.pm)),(function e(){let t=Gp.position,n=Gp.playing||Gp.holding||t>.005;Q.setPlayhead(n?t:null),Z(`#time`).textContent=`${t.toFixed(2)} s`,requestAnimationFrame(e)})(),Z(`#whiten`).onchange=e=>{Q.whiten=e.target.checked,Q.markHeightsDirty(),Q.refresh(),Om()},Z(`#unfold`).oninput=e=>{Q.unfold=parseFloat(e.target.value),Q.markHeightsDirty(),Q.refresh(),clearTimeout(cm),cm=window.setTimeout(()=>Om(),150)};var Am=document.querySelectorAll(`[data-cam]`);function jm(e){Q.resetCamera(e),Am.forEach(t=>t.classList.toggle(`on`,t.dataset.cam===e))}Am.forEach(e=>e.onclick=()=>jm(e.dataset.cam)),Am[0].classList.add(`on`),document.querySelectorAll(`.tool[data-tool]`).forEach(e=>e.onclick=()=>mm(e.dataset.tool)),Z(`#btn-undo`).onclick=Zp;function Mm(){let e=X.session,t=e.classMasks(e=>e.origin!==`ai`),n=S.filter(e=>t[e]?.some(e=>e>.3));if(!n.length)return Wf(`Nothing to contribute yet: paint at least one frog, hornet, chainsaw or cicada layer.`,`warn`);let r=e.level?`${e.level.node} · ${e.level.title}`:`Field · ${qp}`;if(Jp){let e=X.dataset.findIndex(e=>e.origin===`player`&&e.label===r);e>=0&&X.dataset.splice(e,1)}X.dataset.push(Mf(e.spec.mag,e.frames,t,`player`,r)),Jp=!0,Rf(),tm(),ep(),Wf(`Contributed <b>${n.map(e=>x[e].label).join(`, `)}</b>. Its stamp is in your archive.`);let i=Rm[zm],a=e.level?.id??`upload-${qp}`,o=Ep(a);wp({id:a,kind:`challenge`,title:e.level?.title??qp??`Your recording`,label:n.map(e=>x[e].label.toLowerCase()).join(` + `),place:i?.kind===`practice`?i.place:`Your upload`,recorded:i?.recorded.getTime()??Date.now(),labelled:Date.now(),stamp:Q.topSnapshot(),hue:o,levelIndex:e.level?A.indexOf(e.level):void 0})}function Nm(){let e=X.session;if(!e||!X.model)return;Xp(),e.layers=e.layers.filter(e=>e.origin!==`ai`);let t=h(),n=Mf(e.spec.mag,e.frames,{},`player`,``).feat,r=Ef(n,e.frames,{q:X.model.q}),i=0;for(let t=0;t<e.spec.mag.length;t++)i+=e.spec.mag[t]*e.spec.mag[t];for(let n=0;n<4;n++){let a=S[n],o=v(r.subarray(n*e.frames*32,(n+1)*e.frames*32),e.frames,t),s=0;for(let t=0;t<o.length;t++)s+=o[t]*e.spec.mag[t]*e.spec.mag[t];if(s/i<.04)continue;let c=e.activeLayer;e.addLayer(a,`ai`,x[a].label).mask.set(o),e.activeLayer=c>=0?c:e.layers.length-1}lm(!0),Wf(`The model now listens to this clip. Layers marked "model" show what it hears. Accept and correct them.`,`info`,6e3)}Z(`#upload`).onchange=async e=>{let t=e.target.files?.[0];if(t){try{let e=await oe(t);qp=t.name,em(new Te(null,{mix:e,stems:[],refs:{}})),$p(`Your recording`,t.name),Wf(`Loaded ${t.name}: the first 5 s.`,`info`)}catch(e){Wf(`Could not decode that file: `+String(e),`warn`)}e.target.value=``}},Kf({deploy:Nm,refresh:()=>tm()}),Z(`#btn-lab`).onclick=()=>$f(),Z(`#btn-eco`).onclick=()=>hp();var Pm=Bp(Z(`#labeling`),{start:(e,t)=>{qp=t,em(e);let n=Rm[zm];n?.kind===`live`&&$p(n.title,`${n.place} · ${ge(n.recorded)} · ${t}`)},next:()=>Vm(),contribute:Mm,labelled:(e,t)=>{let n=Rm[zm]?.id===e?Rm[zm]:null,r=Ep(e);wp({id:e,kind:`live`,title:n?.title??`Live recording`,label:t,place:n?.place??`Listening post`,recorded:n?.recorded.getTime()??Date.now(),labelled:Date.now(),stamp:Q.topSnapshot(),hue:r})}}),Fm=Ap(Z(`#archive`),{open:e=>{Wm(),Rm=[],zm=-1,$p(e.title,`from your archive · ${e.place}`),e.kind===`live`?Pm.open(e.id):e.levelIndex!==void 0&&e.levelIndex>=0&&(Pm.practice(e.title),Qp(e.levelIndex))},seed:Im});async function Im(){for(let[e,t]of A.entries()){let n=new Te(t,await ae(t));Q.setSession(n);let r=Ep(t.id),i=ce[e];await wp({id:t.id,kind:`challenge`,title:t.title,label:t.targets.map(e=>x[e].label.toLowerCase()).join(` + `),place:i.place,recorded:i.recorded.getTime(),labelled:Date.now()-(A.length-e)*6e5,stamp:Q.topSnapshot(),hue:r,levelIndex:e,player:`ecco team`},{local:!1}).catch(()=>void 0)}X.session&&Q.setSession(X.session),window.dispatchEvent(new Event(`archive-changed`))}var Lm=async()=>Z(`#archive-count`).textContent=String(await Fm.count());Lm(),window.addEventListener(`archive-changed`,Lm),Z(`#btn-archive`).onclick=()=>Fm.show();var Rm=[],zm=-1;function Bm(e){zm=e;let t=Rm[e];$p(t.title,`${t.place} · ${ge(t.recorded)}`),t.kind===`practice`?(Pm.practice(t.title),Qp(t.levelIndex)):Pm.open(t.id)}function Vm(){if(zm+1<Rm.length)return Bm(zm+1);Wf(`That was the last one in this list. Pick the next list on the challenges page.`,`info`),Gm()}Z(`#brand-logo`).innerHTML=bp();var Hm=new Ce,Um=Lp(Z(`#welcome`),{pick:(e,t)=>{Wm(),Rm=t,Bm(t.indexOf(e))},live:async()=>{if(be)return[];let e=await fetch(`${Hm.base}/clips`);return e.ok?(await e.json()).map(de):null},subscribe:e=>{be||Hm.listen(t=>{(t.type===`clip_received`||t.type===`clips_deleted`||t.type===`label_accepted`)&&e(),(t.type===`stamp_added`||t.type===`stamps_cleared`)&&window.dispatchEvent(new Event(`archive-changed`))})},archive:()=>Fm.show(),archiveCount:()=>Fm.count(),remove:async e=>{let t=e?e.map(e=>`${Hm.base}/clips/${encodeURIComponent(e)}`):[`${Hm.base}/clips`];for(let e of t){let t=await fetch(e,{method:`DELETE`});if(!t.ok&&t.status!==404)throw Error(`delete failed: ${t.status}`)}}});function Wm(){Um.hide(),Q.controls.autoRotate=!1}function Gm(){Gp.pause(),Q.controls.autoRotate=!0,Q.controls.autoRotateSpeed=.35,Um.show()}Z(`#btn-home`).onclick=Gm,Z(`#crumb-home`).onclick=Gm;function Km(){Kp.setColors({wave:Q.theme.accent2,played:Q.theme.accent,needle:`#ffffff`})}window.addEventListener(`viz-theme`,()=>{Km(),X.session&&(nm(),im())});var qm=new Set([`w`,`a`,`s`,`d`,`arrowleft`,`arrowright`,`arrowup`,`arrowdown`]);function Jm(e){let t=e.target;return t.tagName===`SELECT`||t.tagName===`TEXTAREA`||t.tagName===`INPUT`&&![`range`,`checkbox`].includes(t.type)}window.addEventListener(`keydown`,e=>{if(Jm(e))return;if(!Z(`#lab`).hidden||!Z(`#eco`).hidden||!Z(`#archive`).hidden){e.key===`Escape`&&[`#lab`,`#eco`,`#archive`].forEach(e=>Z(e).hidden=!0);return}if(Um.visible)return;let t=X.session;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()===`z`)return e.preventDefault(),Zp();if(e.ctrlKey||e.metaKey||e.altKey)return;let n=e.key.toLowerCase();qm.has(n)?(e.preventDefault(),Q.keys.add(n)):n===`v`?mm(`view`):n===`b`?mm(`brush`):n===`e`?mm(`echo`):n===`f`?mm(`fork`):n===`x`?mm(`eraser`):n===` `?(e.preventDefault(),Gp.toggle()):n===`home`?Gp.seek(0):n===`l`?km(Em===`layer`?`mix`:`layer`):n===`r`?km(Em===`res`?`mix`:`res`):n===`[`?($.radius=Math.max(.1,$.radius-.05),pm()):n===`]`?($.radius=Math.min(1.5,$.radius+.05),pm()):t&&/^[1-9]$/.test(n)&&+n<=t.layers.length&&(t.activeLayer=n-1,nm(),Em===`layer`&&Om())}),window.addEventListener(`keyup`,e=>Q.keys.delete(e.key.toLowerCase())),window.addEventListener(`blur`,()=>Q.keys.clear());async function Ym(){zf(),Gm(),await Qp(0),mm(`brush`),Q.setIso(!0),Wp.render(),Km()}Ym().catch(e=>{console.error(e),Wf(`Failed to start: `+String(e),`warn`,1e4)});