import { EFFLongWordList } from "@bitwarden/common/platform/misc/wordlist";

import { Randomizer } from "./abstractions";
import { WordsRequest } from "./types";

/** Generation algorithms that produce randomized usernames */
export class UsernameRandomizer {
  /** Instantiates the username randomizer
   *  @param random data source for random data
   */
  constructor(private random: Randomizer) {}

  /** Creates a username composed of random words
   *  @param domain the domain part of the generated email address.
   *  @param options.length the number of words to include in the catchall
   *    address. Defaults to 1.
   *  @param options.words selects words from the provided wordlist. Defaults to
   *    the EFF "5-dice" list.
   *  @param options.digits determines the number of random digits to append to the end of the generated
   *    word.
   *  @returns a promise that resolves with the generated username.
   */
  async randomWords(options?: WordsRequest) {
    const length = options?.length ?? 1;
    if (length < 1) {
      return "";
    }

    const digits = Math.max(options?.digits ?? 0, 0);
    let selectCase = (_: number) => false;
    if (options?.casing === "camelCase") {
      selectCase = (i: number) => i !== 0;
    } else if (options?.casing === "TitleCase") {
      selectCase = (_: number) => true;
    }

    const wordList = options?.words ?? EFFLongWordList;
    const parts = [];
    for (let i = 0; i < length; i++) {
      const word = await this.random.pickWord(wordList, { titleCase: selectCase(i) });
      parts.push(word);
    }

    for (let i = 0; i < digits; i++) {
      const digit = await this.random.uniform(0, 9);
      parts.push(digit.toString());
    }

    const result = parts.join("");

    return result;
  }
}
