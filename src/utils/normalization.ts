const leetMap: Record<string,string> = { '0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','@':'a','$':'s','+':'t','6':'g','9':'g','!':'i','|':'i','€':'e' };
const homoglyphMap: Record<string,string> = { 'а':'a','е':'e','р':'p','с':'c','у':'y','х':'x','і':'i','ј':'j','ѕ':'s','ѵ':'v','ɑ':'a','ɡ':'g','ḛ':'e','ℯ':'e','𝒶':'a','𝖺':'a','ԁ':'d','ℓ':'l','ո':'n','հ':'h' };
const arabicNormMap: Record<string,string> = { 'أ':'ا','إ':'ا','آ':'ا','ى':'ي','ة':'ه','ؤ':'و','ئ':'ي','گ':'ك','پ':'ب','چ':'ج','ڤ':'ف','ڨ':'ق' };
export function stripZeroWidth(s:string){ return s.replace(/[\u200B-\u200D\uFEFF\u00AD\u180E\u2060-\u206F]/g,''); }
export function normalizeUnicode(s:string){ return s.normalize('NFKC'); }
export function removeDiacritics(s:string){ return s.normalize('NFD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/\p{M}/gu,''); }
export function mapHomoglyphs(s:string){ let o=''; for(const ch of s) o+= homoglyphMap[ch] ?? ch; return o; }
export function mapLeet(s:string){ let o=''; for(const ch of s.toLowerCase()) o+= leetMap[ch] ?? ch; return o; }
export function normalizeArabic(s:string){ let o=''; for(const ch of s) o+= arabicNormMap[ch] ?? ch; return o; }
export function collapseRepeats(s:string){ return s.replace(/(.)\1{2,}/g,'$1$1'); }
export function stripSymbolsBetweenLetters(s:string){
  return s.replace(/([a-zA-Z\u0600-\u06FF])[^a-zA-Z\u0600-\u06FF0-9\s]{1,3}(?=[a-zA-Z\u0600-\u06FF])/g,'$1');
}
export function normalizeSymbols(s:string){
  return s.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g,' ').replace(/\s+/g,' ').trim();
}
export function transliterationMap(s:string){
  const map: Record<string,string> = { '7':'ح','3':'ع','5':'خ','9':'ق','2':'ء','6':'ط' };
  let o=''; for(const c of s) o+= map[c] ?? c; return o;
}
export interface NormalizeOptions { keepSpaces?: boolean; }
export function fullNormalize(input:string): string {
  let s = input;
  s = stripZeroWidth(s);
  s = normalizeUnicode(s);
  s = removeDiacritics(s);
  s = s.toLowerCase();
  s = mapHomoglyphs(s);
  s = transliterationMap(s);
  s = normalizeArabic(s);
  s = stripSymbolsBetweenLetters(s);
  s = s.replace(/[\s_.\-~]+/g,' ');
  s = collapseRepeats(s);
  s = s.trim();
  return s;
}
export function normalizedVariants(input:string): string[] {
  const base = fullNormalize(input);
  const leeted = mapLeet(base);
  const noSpaces = base.replace(/\s+/g,'');
  const noSpacesLeet = leeted.replace(/\s+/g,'');
  const symbolsStripped = normalizeSymbols(base);
  return [...new Set([base, leeted, noSpaces, noSpacesLeet, symbolsStripped])];
}
export function tokenizeNormalized(s:string): string[] { return fullNormalize(s).split(/\s+/).filter(Boolean); }
