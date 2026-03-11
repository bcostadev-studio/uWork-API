const CNPJ_LENGTH = 14;
const CNPJ_KNOWN_INVALIDS = [
  '00000000000000',
  '11111111111111',
  '22222222222222',
  '33333333333333',
  '44444444444444',
  '55555555555555',
  '66666666666666',
  '77777777777777',
  '88888888888888',
  '99999999999999',
];

const calcDigit = (cnpj: string, weights: number[]): number => {
  const sum = weights.reduce(
    (acc, weight, index) => acc + parseInt(cnpj[index], 10) * weight,
    0
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
};

const stripMask = (cnpj: string): string => cnpj.replace(/\D/g, '');

/**
 * Validates a Brazilian CNPJ number using the official check-digit algorithm.
 * Accepts both masked (XX.XXX.XXX/XXXX-XX) and unmasked (14-digit) formats.
 *
 * @param cnpj - The CNPJ string to validate
 * @returns `true` if the CNPJ is valid, `false` otherwise
 */
export const isValidCnpj = (cnpj: string): boolean => {
  const stripped = stripMask(cnpj);

  const hasInvalidLength = stripped.length !== CNPJ_LENGTH;
  const isKnownInvalid = CNPJ_KNOWN_INVALIDS.includes(stripped);

  if (hasInvalidLength || isKnownInvalid) return false;

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const firstDigit = calcDigit(stripped, firstWeights);
  const secondDigit = calcDigit(stripped, secondWeights);

  const firstMatch = firstDigit === parseInt(stripped[12], 10);
  const secondMatch = secondDigit === parseInt(stripped[13], 10);

  return firstMatch && secondMatch;
};

/**
 * Strips all non-numeric characters from a CNPJ string.
 *
 * @param cnpj - The CNPJ string to sanitize
 * @returns A string containing only the numeric digits
 */
export const sanitizeCnpj = (cnpj: string): string => stripMask(cnpj);
