import type { Address, Language, LanguageContext, HolochainLanguageDelegate, Interaction } from "@perspect3vism/ad4m";
import ExpressionAdapter from "./adapter";
import { DNA, DNA_NICK } from "./dna";

function interactions(expression: Address): Interaction[] {
  return [];
}

//@ad4m-template-variable
export const name = "group-expression";

export default async function create(context: LanguageContext): Promise<Language> {
  const Holochain = context.Holochain as HolochainLanguageDelegate;
  await Holochain.registerDNAs([{ file: DNA, nick: DNA_NICK }]);

  const expressionAdapter = new ExpressionAdapter(context);

  return {
    name,
    expressionAdapter,
    interactions,
  } as Language;
}
