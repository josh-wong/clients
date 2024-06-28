export type CharacterSet = string[];

export type CharacterSets = {
  Uppercase: CharacterSet;
  Lowercase: CharacterSet;
  Digit: CharacterSet;
  Special: CharacterSet;
};

export type RandomAsciiRequest = {
  all: number;
  uppercase?: number;
  lowercase?: number;
  digits?: number;
  special?: number;
  ambiguous: boolean;
};

export type EffWordListRequest = {
  words: number;
  separator: string;
  number: boolean;
  capitalize: boolean;
};

export type WordsRequest = {
  length?: number;
  words?: Array<string>;
  digits?: number;
  casing?: "lowercase" | "TitleCase" | "camelCase";
};
