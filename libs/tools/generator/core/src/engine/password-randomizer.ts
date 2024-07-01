import { EFFLongWordList } from "@bitwarden/common/platform/misc/wordlist";

import { Randomizer } from "./abstractions";
import { Ascii } from "./data";
import { CharacterSet, EffWordListRequest, RandomAsciiRequest } from "./types";

export class PasswordRandomizer {
  constructor(private randomizer: Randomizer) {}

  async randomAscii(request: RandomAsciiRequest) {
    // randomize character sets
    const sets = toAsciiSets(request);
    const shuffled = await this.randomizer.shuffle(sets);

    // generate password
    const generating = shuffled.flatMap((set) => this.randomizer.pick(set));
    const generated = await Promise.all(generating);
    const result = generated.join("");

    return result;
  }

  async randomEffLongWords(request: EffWordListRequest) {
    // select which word gets the number, if any
    let luckyNumber = -1;
    if (request.number) {
      luckyNumber = await this.randomizer.uniform(0, request.words - 1);
    }

    // generate the passphrase
    const wordList = new Array(request.words);
    for (let i = 0; i < request.words; i++) {
      const word = await this.randomizer.pickWord(EFFLongWordList, {
        titleCase: request.capitalize,
        number: i === luckyNumber,
      });

      wordList[i] = word;
    }

    return wordList.join(request.separator);
  }
}

function toAsciiSets(options: RandomAsciiRequest) {
  function allocate<T>(size: number, value: T) {
    const data = new Array(size > 0 ? size : 0);
    data.fill(value, 0, size);
    return data;
  }

  const allSet: CharacterSet = [];
  const active = options.ambiguous ? Ascii.Full : Ascii.Unmistakable;
  const parts: Array<CharacterSet> = [];

  if (options.uppercase !== undefined) {
    parts.push(...allocate(options.uppercase, active.Uppercase));
    allSet.push(...active.Uppercase);
  }

  if (options.lowercase !== undefined) {
    parts.push(...allocate(options.lowercase, active.Lowercase));
    allSet.push(...active.Lowercase);
  }

  if (options.digits !== undefined) {
    parts.push(...allocate(options.digits, active.Digit));
    allSet.push(...active.Digit);
  }

  if (options.special !== undefined) {
    parts.push(...allocate(options.special, active.Special));
    allSet.push(...active.Special);
  }

  parts.push(...allocate(options.all, allSet));

  return parts;
}
