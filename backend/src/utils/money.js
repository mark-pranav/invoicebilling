/** Round to 2 decimal places (paise-safe). */
const round2 = (value) => {
  const num = Number(value) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

module.exports = { round2, toNumber };
