import sharp from 'sharp';
const f='public/cards/cobalt-tidecaller.png';
const {width,height}=await sharp(f).metadata();
const {data,info}=await sharp(f).raw().toBuffer({resolveWithObject:true});
const ch=info.channels;
function colBright(x){let s=0;for(let y=0;y<height;y++){const i=(y*width+x)*ch;s+=(data[i]+data[i+1]+data[i+2])/3;}return s/height;}
const cols=[];for(let x=0;x<width;x++)cols.push(Math.round(colBright(x)));
console.log('size',width,'x',height);
console.log('left 15:',cols.slice(0,15).join(','));
console.log('right 15:',cols.slice(-15).join(','));
console.log('center:',cols[Math.floor(width/2)]);
