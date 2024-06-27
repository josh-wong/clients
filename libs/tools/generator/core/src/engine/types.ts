type CharacterSet = string[];

type CharacterSets = {
  Uppercase: CharacterSet;
  Lowercase: CharacterSet;
  Digit: CharacterSet;
  Special: CharacterSet;
};

type RandomAsciiRequest = {
  all: number;
  uppercase?: number;
  lowercase?: number;
  digits?: number;
  special?: number;
  ambiguous: boolean;
};

type EffWordListRequest = {
  words: number;
  separator: string;
  number: boolean;
  capitalize: boolean;
};

export { CharacterSet, CharacterSets, RandomAsciiRequest, EffWordListRequest };
