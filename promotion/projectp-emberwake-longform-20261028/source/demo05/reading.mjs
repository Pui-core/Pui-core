// Display text stays unchanged. Explicit game-term readings affect speech only.
export const queryInputText=text=>text.replaceAll('鐘楼','しょうろう');
export const readingCacheMatches=(cached,text)=>cached.text===text&&(cached.spokenText||cached.text)===queryInputText(text);
