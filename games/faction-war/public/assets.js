// A URL has one Image and one pending decode across the 2D/3D/UI renderers.
const images=new Map(),pending=new Map();
export function assetImage(url){let image=images.get(url);if(!image){image=new Image();images.set(url,image);image.src=url;}return image;}
export function loadImage(url){if(!pending.has(url)){const image=assetImage(url);pending.set(url,image.complete&&image.naturalWidth?Promise.resolve(image):new Promise((resolve,reject)=>{image.addEventListener('load',()=>resolve(image),{once:true});image.addEventListener('error',()=>{pending.delete(url);images.delete(url);reject(Error('Image unavailable: '+url));},{once:true});}));}return pending.get(url);}
