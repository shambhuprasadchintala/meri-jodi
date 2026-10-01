import { body } from "express-validator"
import { GENDER, MARITAL_STATUS, HOBBIES_LIST } from "../constants/index.js"

const genderValues = Object.values(GENDER)
const maritalStatusValues = Object.values(MARITAL_STATUS)

export const createOrUpdatePreferences = [
    body("gender")
        .optional({ values: "falsy" })
        .isIn(genderValues)
        .withMessage(`Gender must be one of: ${genderValues.join(", ")}`),
    body("ageMin")
        .optional({ values: "falsy" })
        .isInt({ min: 18, max: 80 })
        .withMessage("Minimum age must be between 18 and 80"),
    body("ageMax")
        .optional({ values: "falsy" })
        .isInt({ min: 18, max: 80 })
        .withMessage("Maximum age must be between 18 and 80"),
    body("religion")
        .optional({ values: "falsy" }),
    body("caste")
        .optional({ values: "falsy" }),
    body("location")
        .optional({ values: "falsy" }),
    body("locations")
        .optional({ values: "falsy" }),
    body("education")
        .optional({ values: "falsy" }),
    body("occupation")
        .optional({ values: "falsy" }),
    body("annualIncome")
        .optional({ values: "falsy" }),
    body("diet")
        .optional({ values: "falsy" }),
    body("heightMinCm")
        .optional({ values: "falsy" })
        .isFloat({ min: 100, max: 250 }),
    body("heightMaxCm")
        .optional({ values: "falsy" })
        .isFloat({ min: 100, max: 250 }),
    body("maritalStatus")
        .optional({ values: "falsy" }),
    body("willingToRelocate")
        .optional({ values: "falsy" }),
    body("hobbiesAndInterests")
        .optional({ values: "falsy" }),
    body("ageRange")
        .optional({ values: "falsy" }),
    body("heightRange")
        .optional({ values: "falsy" }),
]
