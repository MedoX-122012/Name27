export function checkMentions(content:string, max:number): { blocked:boolean; count:number }{
  const mentionRegex = /<@!?&?\d+>|@everyone|@here/g;
  const m = content.match(mentionRegex) || [];
  const count = m.length;
  // also count plain mentions? if max is for @everyone/here + user mentions
  return { blocked: count > max, count };
}
