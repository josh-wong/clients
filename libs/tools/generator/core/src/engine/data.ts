import { CharacterSet, CharacterSets } from "./types";

function toCharacterSet(characters: string) {
  const set = characters.split("");

  return Object.freeze(set as CharacterSet);
}

const SpecialCharacters = toCharacterSet("!@#$%^&*");

export const Ascii = Object.freeze({
  Full: Object.freeze({
    Uppercase: toCharacterSet("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    Lowercase: toCharacterSet("abcdefghijkmnopqrstuvwxyz"),
    Digit: toCharacterSet("0123456789"),
    Special: SpecialCharacters,
  } as CharacterSets),
  Unmistakable: Object.freeze({
    Uppercase: toCharacterSet("ABCDEFGHJKLMNPQRSTUVWXYZ"),
    Lowercase: toCharacterSet("abcdefghijklmnopqrstuvwxyz"),
    Digit: toCharacterSet("23456789"),
    Special: SpecialCharacters,
  } as CharacterSets),
});

export const SUBADDRESS_PARSER = new RegExp(
  "(?<username>[^@+]+)(?<subaddress>\\+.+)?(?<domain>@.+)",
);
