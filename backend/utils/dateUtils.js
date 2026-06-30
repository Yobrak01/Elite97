const moment = require('moment-timezone');
const ct = require('countries-and-timezones');

// Helper to normalize timezone input, defaulting to Africa/Nairobi (EAT)
function normalizeTimezone(timezone) {
  if (!timezone || timezone === 'UTC' || timezone === 'undefined') {
    return 'Africa/Nairobi';
  }
  return timezone;
}

/**
 * Derives a standard IANA timezone from a country name.
 * Falls back to 'Africa/Nairobi' (EAT) if country is unknown.
 */
function getTimezoneFromCountry(countryName) {
  if (!countryName) return 'Africa/Nairobi';
  // Attempt to find country by name
  const allCountries = ct.getAllCountries();
  const country = Object.values(allCountries).find(c => c.name.toLowerCase() === countryName.toLowerCase());
  
  if (country && country.timezones && country.timezones.length > 0) {
    // Return the first timezone associated with the country
    return country.timezones[0];
  }
  return 'Africa/Nairobi';
}

/**
 * Gets the exact UTC date object that represents 00:00:00 in the given timezone.
 */
function getStartOfDay(timezone = 'Africa/Nairobi', date = new Date()) {
  const tz = normalizeTimezone(timezone);
  return moment(date).tz(tz).startOf('day').toDate();
}

/**
 * Gets the exact UTC date object that represents 23:59:59.999 in the given timezone.
 */
function getEndOfDay(timezone = 'Africa/Nairobi', date = new Date()) {
  const tz = normalizeTimezone(timezone);
  return moment(date).tz(tz).endOf('day').toDate();
}

/**
 * Gets a formatted local date string (YYYY-MM-DD) for the given timezone.
 */
function getLocalDateString(timezone = 'Africa/Nairobi', date = new Date()) {
  const tz = normalizeTimezone(timezone);
  return moment(date).tz(tz).format('YYYY-MM-DD');
}

module.exports = {
  getTimezoneFromCountry,
  getStartOfDay,
  getEndOfDay,
  getLocalDateString
};
