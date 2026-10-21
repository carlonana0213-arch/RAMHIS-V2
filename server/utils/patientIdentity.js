const Patient = require("../models/Patient");

/*
|--------------------------------------------------------------------------
| Patient identity helpers
|--------------------------------------------------------------------------
|
| Two patient records are considered the same person when they share the
| same name (case-insensitive, extra spaces ignored) AND the same
| birthdate.
|
*/

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "  juan   DELA cruz " -> "juan DELA cruz"
const collapseSpaces = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

// Stored birthdates are "YYYY-MM-DD" strings, but tolerate ISO timestamps.
const normalizeBirthdate = (value) => String(value || "").trim().slice(0, 10);

const buildNameRegex = (name) => {
  const tokens = collapseSpaces(name).split(" ").filter(Boolean).map(escapeRegex);

  return new RegExp(`^\\s*${tokens.join("\\s+")}\\s*$`, "i");
};

const buildIdentityQuery = (name, birthdate) => {
  const query = {
    "generalInfo.name": buildNameRegex(name),
  };

  const cleanedBirthdate = normalizeBirthdate(birthdate);

  if (cleanedBirthdate) {
    query["generalInfo.birthdate"] = new RegExp(
      `^${escapeRegex(cleanedBirthdate)}`,
    );
  }

  return query;
};

/**
 * Returns the existing patient with the same name and birthdate,
 * or null. A birthdate is required: a name alone is not enough to
 * decide that two people are the same.
 */
const findDuplicatePatient = async (name, birthdate, excludeId = null) => {
  if (!collapseSpaces(name) || !normalizeBirthdate(birthdate)) {
    return null;
  }

  const query = buildIdentityQuery(name, birthdate);

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Patient.findOne(query).sort({ updatedAt: -1 });
};

module.exports = {
  escapeRegex,
  collapseSpaces,
  normalizeBirthdate,
  buildIdentityQuery,
  findDuplicatePatient,
};
