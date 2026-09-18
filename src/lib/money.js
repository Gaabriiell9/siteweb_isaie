/**
 * Utilitaires de conversion et formatage des montants
 * Tous les montants en base sont stockes en centimes (integer)
 */

/**
 * Formate un montant en centimes vers une chaine en euros
 * @param {number} cents - Montant en centimes
 * @returns {string} Montant formate (ex: "450 EUR" ou "50 EUR")
 */
export function formatEuros(cents) {
  if (cents === null || cents === undefined) return '';
  const euros = cents / 100;
  return euros.toLocaleString('fr-FR', {
    minimumFractionDigits: euros % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }) + ' €';
}

/**
 * Formate un montant en centimes vers une chaine en euros (court, sans symbole)
 * @param {number} cents - Montant en centimes
 * @returns {string} Montant formate (ex: "450" ou "50.50")
 */
export function formatEurosShort(cents) {
  if (cents === null || cents === undefined) return '';
  const euros = cents / 100;
  return euros.toLocaleString('fr-FR', {
    minimumFractionDigits: euros % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Convertit un montant en euros vers des centimes
 * @param {number|string} euros - Montant en euros
 * @returns {number} Montant en centimes (arrondi)
 */
export function eurosVersCents(euros) {
  const num = typeof euros === 'string' ? parseFloat(euros) : euros;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Convertit un montant en centimes vers des euros
 * @param {number} cents - Montant en centimes
 * @returns {number} Montant en euros
 */
export function centsVersEuros(cents) {
  if (cents === null || cents === undefined) return 0;
  return cents / 100;
}
