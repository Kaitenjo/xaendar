import { A, a, CR, LF, Z, z } from "../costants/chars.constants";

/**
 * Check if char code is a Line Feed (\n) or Carriage Return (\r)
 * @param char Character to control
 * @returns True if character is LF or CR, false otherwise
 */
export function isNewLine(char: number): boolean {
  return char === LF || char === CR;
}

/**
 * Check if char code is is a lower case letter
 * @param char Character to control
 * @returns True if character is a lowercase letter, false otherwise
 */
export function isLowerCase(char: number): boolean {
  return char >= a && char <= z;
}

/**
 * Check if char code is is a upper  case letter
 * @param char Character to control
 * @returns True if character is a upper case letter, false otherwise
 */
export function isUpperCase(char: number): boolean {
  return char >= A && char <= Z;
}

