// Keep an authored line intact; page turns never choose a response or an ending.
export function dialoguePages(text,limit=210){
 const lines=String(text).split(/\n+/).filter(Boolean),pages=[];let page='';
 for(const line of lines){if(page&&page.length+line.length+1>limit){pages.push(page);page='';}page+=(page?'\n':'')+line;}
 if(page)pages.push(page);return pages.length?pages:[''];
}
export function dialogueMode(actions){return actions.length===0?'locked':actions.length===1?'advance':'choice';}
