const moment = require('moment-timezone');
const ct = require('countries-and-timezones');

/**
 * Derives a standard IANA timezone from a country name.
 * Falls back to 'UTC' if country is unknown.
 */
function getTimezoneFromCountry(countryName) {
  if (!countryName) return 'UTC';
  // Attempt to find country by name
  const allCountries = ct.getAllCountries();
  const country = Object.values(allCountries).find(c => c.name.toLowerCase() === countryName.toLowerCase());
  
  if (country && country.timezones && country.timezones.length > 0) {
    // Return the first timezone associated with the country
    return country.timezones[0];
  }
  return 'UTC';
}

/**
 * Gets the exact UTC date object that represents 00:00:00 in the given timezone.
 */
function getStartOfDay(timezone = 'UTC', date = new Date()) {
  return moment(date).tz(timezone).startOf('day').toDate();
}

/**
 * Gets the exact UTC date object that represents 23:59:59.999 in the given timezone.
 */
function getEndOfDay(timezone = 'UTC', date = new Date()) {
  return moment(date).tz(timezone).endOf('day').toDate();
}

/**
 * Gets a formatted local date string (YYYY-MM-DD) for the given timezone.
 */
function getLocalDateString(timezone = 'UTC', date = new Date()) {
  return moment(date).tz(timezone).format('YYYY-MM-DD');
}

module.exports = {
  getTimezoneFromCountry,
  getStartOfDay,
  getEndOfDay,
  getLocalDateString
};
