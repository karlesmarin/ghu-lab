/* Local, reversible translations. Exact values and event listeners stay untouched. */
const UI_ES=/*__UI_ES__*/;
const UI_TEXT=new WeakMap(),UI_ATTRIBUTES=new WeakMap();
function uiCanonical(text){
 const values=[];
 const key=text.trim().replace(/\s+/g,' ').replace(/[+-]?\d+(?:[.,]\d+)*(?:[eE][+-]?\d+)?/g,n=>{values.push(n);return '⟦n'+(values.length-1)+'⟧';});
 return {key,values};
}
function uiTranslate(text,language=GUIDE_LANGUAGE){
 if(language!=='es')return text;
 const {key,values}=uiCanonical(text),translated=UI_ES[key];
 if(translated===undefined)return text;
 return (text.match(/^\s*/)?.[0]||'')+translated.replace(/⟦n(\d+)⟧/g,(_,i)=>values[Number(i)])+(text.match(/\s*$/)?.[0]||'');
}
function uiSourceText(element){
 if(!element)return '';
 const walk=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let text='';
 while(walk.nextNode()){const node=walk.currentNode,record=UI_TEXT.get(node);text+=record&&node.nodeValue===record.translated?record.original:node.nodeValue;}
 return text;
}
function uiLocalize(){
 if(typeof document==='undefined'||typeof document.createTreeWalker!=='function')return;
 const skip='script,style,noscript,metadata,code,pre,textarea,[data-guide-language],[data-guide-set-language],.helppop,#gqRoot,#rx_boundaryresearch,#cdm_box';
 const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walk.nextNode()){
  const node=walk.currentNode;if(node.parentElement?.closest(skip))continue;
  const record=UI_TEXT.get(node),original=record&&node.nodeValue===record.translated?record.original:node.nodeValue;
  const translated=uiTranslate(original);
  UI_TEXT.set(node,{original,translated});if(node.nodeValue!==translated)node.nodeValue=translated;
 }
 for(const element of document.querySelectorAll('[title],[placeholder],[aria-label]')){
  if(element.closest(skip)||element.matches('[data-help],[data-card-guide]'))continue;
  const record=UI_ATTRIBUTES.get(element)||{};
  for(const attr of ['title','placeholder','aria-label'])if(element.hasAttribute(attr)){
   const current=element.getAttribute(attr),old=record[attr],original=old&&current===old.translated?old.original:current;
   const translated=uiTranslate(original);record[attr]={original,translated};
   if(current!==translated)element.setAttribute(attr,translated);
  }
  UI_ATTRIBUTES.set(element,record);
 }
 document.documentElement.lang=GUIDE_LANGUAGE;
}
function mountInterfaceLanguage(){
 if(typeof document==='undefined'||typeof MutationObserver==='undefined'||document.__interfaceLanguageMounted)return;
 document.__interfaceLanguageMounted=true;
 const options={childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label'],subtree:true};
 const observer=new MutationObserver(()=>{
  // Async calculations also update existing text nodes and accessible labels.
  // Disconnect during our own writes so translations cannot feed back forever.
  observer.disconnect();try{uiLocalize();}finally{observer.observe(document.body,options);}
 });observer.observe(document.body,options);
 uiLocalize();
}

/* Canvas labels must use the same language and measurement as HTML/SVG labels.
 * Install before the first section renders. Numeric inputs and plotted points
 * are untouched; measureText sees the exact text that fillText will draw. */
function installCanvasLanguage(){
 if(typeof CanvasRenderingContext2D==='undefined')return;
 const prototype=CanvasRenderingContext2D.prototype;
 for(const name of ['fillText','strokeText','measureText']){
  const original=prototype[name];
  prototype[name]=function(text,...args){return original.call(this,uiTranslate(String(text)),...args);};
 }
}
installCanvasLanguage();
