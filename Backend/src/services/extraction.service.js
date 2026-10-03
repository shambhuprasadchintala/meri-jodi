import { GoogleGenAI, Type } from "@google/genai"

let aiClient = null
const getAI = () => {
    if (!aiClient && process.env.GEMINI_API_KEY) {
        try {
            aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
        } catch (e) {
            console.warn("Failed to initialize GoogleGenAI client:", e.message)
        }
    }
    return aiClient
}

const GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.5-pro",
]

const GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
]

async function generateWithGroq(messages, jsonMode = false, temperature = 0.3) {
    if (!process.env.GROQ_API_KEY) return null
    for (const model of GROQ_MODELS) {
        try {
            const body = {
                model,
                messages,
                temperature,
            }
            if (jsonMode) {
                body.response_format = { type: "json_object" }
            }
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify(body),
            })
            if (res.ok) {
                const data = await res.json()
                const content = data.choices?.[0]?.message?.content?.trim()
                if (content) return { model, content }
            }
        } catch (err) {
            console.warn(`[Groq] Model ${model} failed, trying next:`, err.message || err)
        }
    }
    return null
}

async function generateWithGemini(contents, config = {}) {
    const ai = getAI()
    if (!ai) return null
    for (const model of GEMINI_MODELS) {
        try {
            const req = { model, contents }
            if (config && Object.keys(config).length > 0) req.config = config
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout after 6000ms for ${model}`)), 6000)
            )
            const response = await Promise.race([ai.models.generateContent(req), timeoutPromise])
            if (response?.text) return response.text.trim()
        } catch (err) {
            console.warn(`[Gemini] Model ${model} failed, trying next:`, err.message || err)
        }
    }
    return null
}

const biodataSchema = {
    type: Type.OBJECT,
    properties: {
        personal_details: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                gender: { type: Type.STRING },
                date_of_birth: { type: Type.STRING },
                place_of_birth: { type: Type.STRING },
                time_of_birth: { type: Type.STRING },
                rashi: { type: Type.STRING },
                nakshatra: { type: Type.STRING },
                height: { type: Type.STRING },
                marital_status: { type: Type.STRING },
                manglik: { type: Type.STRING },
                complexion: { type: Type.STRING },
                highest_education: { type: Type.STRING },
                organization_name: { type: Type.STRING },
                annual_income: { type: Type.STRING },
                about_me: { type: Type.STRING },
                mother_tongue: { type: Type.STRING },
                religion: { type: Type.STRING },
                caste: { type: Type.STRING },
                gotra: { type: Type.STRING },
                hobbies: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
        },
        family_details: {
            type: Type.OBJECT,
            properties: {
                fathers_name: { type: Type.STRING },
                fathers_occupation: { type: Type.STRING },
                mothers_name: { type: Type.STRING },
                mothers_occupation: { type: Type.STRING },
            },
        },
        contact_details: {
            type: Type.OBJECT,
            properties: {
                contact_number: { type: Type.STRING },
                email_id: { type: Type.STRING },
                city: { type: Type.STRING },
            },
        },
    },
}

/**
 * Convert any height format (e.g. 5'11", 5' 11", 5’11”, 5 ft 11 in, 180 cm) to standard format (e.g. 5'11")
 */
const normalizeHeight = (rawHeight = "") => {
    if (!rawHeight || typeof rawHeight !== "string") return ""
    const clean = rawHeight.trim().replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')

    // Feet and inches: 5'11", 5'11, 5 ft 11 in, 5.11, 5 11
    const ftInMatch = clean.match(/(\d+)\s*(?:'|ft|feet|\.)\s*(\d+)?\s*(?:"|in|inches)?/i)
    if (ftInMatch) {
        const ft = parseInt(ftInMatch[1], 10)
        const inch = ftInMatch[2] ? parseInt(ftInMatch[2], 10) : 0
        if (ft >= 4 && ft <= 7 && inch >= 0 && inch <= 11) {
            return `${ft}'${inch}"`
        }
    }

    // Direct CM match: 175 cm, 180cm
    const cmMatch = clean.match(/(\d{2,3})\s*cm/i)
    if (cmMatch) {
        const cm = parseInt(cmMatch[1], 10)
        if (cm >= 130 && cm <= 220) {
            const totalInches = Math.round(cm / 2.54)
            const ft = Math.floor(totalInches / 12)
            const inch = totalInches % 12
            return `${ft}'${inch}"`
        }
    }

    return clean
}

/**
 * Convert raw education string to standard dropdown category
 */
const normalizeEducation = (rawEdu = "") => {
    if (!rawEdu || typeof rawEdu !== "string") return "Bachelor's Degree"
    const lower = rawEdu.toLowerCase()
    if (/ph\.?d|doctorate/i.test(lower)) return "PhD"
    if (/m\.?tech|m\.?e\b/i.test(lower)) return "M.Tech"
    if (/mba|pgdm|master of business/i.test(lower)) return "MBA"
    if (/master|m\.sc|mca|m\.com|ma\b|post graduate|ms\b/i.test(lower)) return "Master's Degree"
    if (/b\.?tech|b\.?e\b|bachelor|b\.sc|bca|b\.com|ba\b|bba|degree|graduate/i.test(lower)) return "Bachelor's Degree"
    if (/diploma/i.test(lower)) return "Diploma"
    if (/12th|10th|high school|hsc|ssc|intermediate/i.test(lower)) return "High School"
    return rawEdu
}

/**
 * Convert raw occupation string to standard dropdown category
 */
const normalizeOccupation = (rawOcc = "") => {
    if (!rawOcc || typeof rawOcc !== "string") return "Software Engineer"
    const lower = rawOcc.toLowerCase()
    if (/software|developer|engineer|coder|programmer|it\b|tech|full\s*stack|frontend|backend|devops|data scientist|analyst/i.test(lower)) {
        return "Software Engineer"
    }
    if (/doctor|physician|surgeon|mbbs|dentist|cardiologist|medical|nurse/i.test(lower)) {
        return "Doctor"
    }
    if (/teacher|professor|lecturer|educator|faculty|principal/i.test(lower)) {
        return "Teacher"
    }
    if (/business|businessman|entrepreneur|founder|director|manager|marketing|sales|consultant|executive|hr\b/i.test(lower)) {
        return "Business"
    }
    if (/government|govt|civil|ias|ips|bank|sbi|psu|officer|clerk/i.test(lower)) {
        return "Government Employee"
    }
    if (/lawyer|advocate|judge|legal/i.test(lower)) {
        return "Lawyer"
    }
    if (/student|intern|scholar/i.test(lower)) {
        return "Student"
    }
    if (/self\s*employed|freelanc/i.test(lower)) {
        return "Self Employed"
    }
    return "Other"
}

/**
 * Convert raw income string (e.g. 18 LPA, 15 LPA, 5 Lakhs) to standard dropdown range
 */
const normalizeIncomeRange = (rawIncome = "") => {
    if (!rawIncome || typeof rawIncome !== "string") return "₹10 - ₹20 LPA"
    const clean = rawIncome.replace(/,/g, "")
    const numMatch = clean.match(/(\d+(?:\.\d+)?)/)
    if (!numMatch) return "₹10 - ₹20 LPA"

    let lpa = parseFloat(numMatch[1])
    // If entered as absolute number (e.g. 1800000)
    if (lpa > 10000) {
        lpa = lpa / 100000
    }

    if (lpa < 2) return "Below ₹2 LPA"
    if (lpa <= 5) return "₹2 - ₹5 LPA"
    if (lpa <= 10) return "₹5 - ₹10 LPA"
    if (lpa <= 20) return "₹10 - ₹20 LPA"
    if (lpa <= 35) return "₹20 - ₹35 LPA"
    if (lpa <= 50) return "₹35 - ₹50 LPA"
    return "Above ₹50 LPA"
}

/**
 * Parse any date string into { day, month, year, date_of_birth }
 */
const parseDateDetails = (rawDate = "") => {
    const monthsList = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ]

    if (!rawDate || typeof rawDate !== "string") {
        return { day: "", month: "", year: "", date_of_birth: "" }
    }

    const clean = rawDate.trim()

    // 1. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const dmyMatch = clean.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/)
    if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10).toString()
        const monthIdx = parseInt(dmyMatch[2], 10) - 1
        const year = dmyMatch[3]
        if (monthIdx >= 0 && monthIdx < 12) {
            const month = monthsList[monthIdx]
            const monthPad = String(monthIdx + 1).padStart(2, "0")
            const dayPad = day.padStart(2, "0")
            return { day, month, year, date_of_birth: `${year}-${monthPad}-${dayPad}` }
        }
    }

    // 2. YYYY-MM-DD
    const ymdMatch = clean.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/)
    if (ymdMatch) {
        const year = ymdMatch[1]
        const monthIdx = parseInt(ymdMatch[2], 10) - 1
        const day = parseInt(ymdMatch[3], 10).toString()
        if (monthIdx >= 0 && monthIdx < 12) {
            const month = monthsList[monthIdx]
            const monthPad = String(monthIdx + 1).padStart(2, "0")
            const dayPad = day.padStart(2, "0")
            return { day, month, year, date_of_birth: `${year}-${monthPad}-${dayPad}` }
        }
    }

    // 3. DD Month YYYY (e.g. 15 August 1996, 15 Aug 1996)
    const textDateMatch = clean.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/)
    if (textDateMatch) {
        const day = parseInt(textDateMatch[1], 10).toString()
        const monthStr = textDateMatch[2].toLowerCase()
        const year = textDateMatch[3]
        const monthIdx = monthsList.findIndex((m) => m.toLowerCase().startsWith(monthStr.slice(0, 3)))
        if (monthIdx >= 0) {
            const month = monthsList[monthIdx]
            const monthPad = String(monthIdx + 1).padStart(2, "0")
            const dayPad = day.padStart(2, "0")
            return { day, month, year, date_of_birth: `${year}-${monthPad}-${dayPad}` }
        }
    }

    // 4. Fallback to JS Date
    try {
        const d = new Date(clean)
        if (!isNaN(d.getTime())) {
            const year = d.getFullYear().toString()
            const monthIdx = d.getMonth()
            const month = monthsList[monthIdx]
            const day = d.getDate().toString()
            const monthPad = String(monthIdx + 1).padStart(2, "0")
            const dayPad = day.padStart(2, "0")
            return { day, month, year, date_of_birth: `${year}-${monthPad}-${dayPad}` }
        }
    } catch {
        // ignore
    }

    return { day: "", month: "", year: "", date_of_birth: clean }
}

/**
 * Robust regex & heuristic parser for matrimonial biodata documents
 */
const extractBiodataFromTextHeuristic = (text = "") => {
    if (!text || typeof text !== "string") {
        return createDefaultBiodataStructure()
    }

    // Normalize quotes, spaces, and line endings
    const clean = text
        .replace(/\r\n/g, "\n")
        .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')

    const findMatch = (regexList) => {
        for (const re of regexList) {
            const m = clean.match(re)
            if (m && m[1] && m[1].trim()) {
                return m[1].trim()
            }
        }
        return ""
    }

    const name = findMatch([
        /(?:Full\s*Name|Candidate\s*Name|Name of Candidate|Name)\s*[:\-]\s*([^\n\r]+)/i,
        /^(?:Name)\s*[:\-]?\s*([^\n\r]+)/im,
        /(?:Bio-?\s*Data\s+of|Biodata\s+of)\s+([^\n\r]+)/i,
    ])

    const dateOfBirth = findMatch([
        /(?:Date\s*of\s*Birth|D\.?O\.?B\.?|Birth\s*Date|DOB)\s*[:\-]\s*([0-9]{1,2}[-\/.][0-9]{1,2}[-\/.][0-9]{2,4}|[0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{4}|[A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4})/i,
        /(?:Date\s*of\s*Birth|D\.?O\.?B\.?|Birth\s*Date|DOB)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const placeOfBirth = findMatch([
        /(?:Place\s*of\s*Birth|P\.?O\.?B\.?|Birth\s*Place|Born\s*at)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const timeOfBirth = findMatch([
        /(?:Time\s*of\s*Birth|T\.?O\.?B\.?|Birth\s*Time)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    let gender = findMatch([
        /(?:Gender|Sex)\s*[:\-]\s*(Male|Female|Other)/i,
    ])
    if (!gender) {
        if (/\b(?:bride|female|daughter|girl|woman|she\/her|kumari|ms|miss|mrs|d\/o)\b/i.test(clean)) gender = "female"
        else if (/\b(?:groom|male|son|boy|man|he\/him|shri|mr|s\/o)\b/i.test(clean)) gender = "male"
    }

    const rawHeight = findMatch([
        /(?:Height)\s*[:\-]\s*([0-9]'\s*[0-9]{1,2}"?|[0-9]{2,3}\s*cm|[0-9]\s*ft\s*[0-9]{1,2}\s*in|[0-9]\.[0-9]{1,2}|[^\n\r]+)/i,
    ])
    const height = normalizeHeight(rawHeight)

    const maritalStatus = findMatch([
        /(?:Marital\s*Status|Status)\s*[:\-]\s*(Never\s*Married|Unmarried|Single|Divorced|Widowed|Awaiting\s*Divorce|[^\n\r]+)/i,
    ])

    const religion = findMatch([
        /(?:Religion)\s*[:\-]\s*(Hindu|Muslim|Sikh|Christian|Jain|Buddhist|Parsi|Jewish|[^\n\r]+)/i,
    ])

    const caste = findMatch([
        /(?:Caste|Community)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const gotra = findMatch([
        /(?:Gotra|Gotham|Gothram|Sub-?caste|Subcaste)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const rashi = findMatch([
        /(?:Rashi|Raasi|Moon\s*Sign|Zodiac\s*Sign|Zodiac)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const nakshatra = findMatch([
        /(?:Nakshatra|Nakshtra|Birth\s*Star|Star)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const manglik = findMatch([
        /(?:Manglik|Kuja\s*Dosha|Mangal)\s*[:\-]\s*(Yes|No|Anshik|Partial|Non-?Manglik|Don't\s*Know|[^\n\r]+)/i,
    ])

    const complexion = findMatch([
        /(?:Complexion|Skin\s*Tone)\s*[:\-]\s*(Very\s*Fair|Fair|Wheatish|Medium|Dark|[^\n\r]+)/i,
    ])

    const motherTongue = findMatch([
        /(?:Mother\s*Tongue|Mother-?tongue|Native\s*Language|Language)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const highestEducation = findMatch([
        /(?:Highest\s*Education|Qualification|Education|Degree|Academic\s*Qualification|Educational\s*Background)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const organizationName = findMatch([
        /(?:Company\s*Name|Company|Employer|Working\s*at|Employed\s*at|Organization\s*Name|Organization)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const rawOccupation = findMatch([
        /(?:Occupation|Profession|Designation|Job\s*Title|Job|Working\s*as)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const annualIncome = findMatch([
        /(?:Annual\s*Income|Income|Package|Salary|CTC|Annual\s*CTC)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const city = findMatch([
        /(?:Current\s*City|Current\s*Location|City|Location|Resident\s*of|Native\s*Place|Address)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const fathersName = findMatch([
        /(?:Father['\u2019]?s?\s*Name|Father)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const fathersOccupation = findMatch([
        /(?:Father['\u2019]?s?\s*Occupation|Father['\u2019]?s?\s*Profession)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const mothersName = findMatch([
        /(?:Mother['\u2019]?s?\s*Name|Mother)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const mothersOccupation = findMatch([
        /(?:Mother['\u2019]?s?\s*Occupation|Mother['\u2019]?s?\s*Profession)\s*[:\-]\s*([^\n\r]+)/i,
    ])

    const contactNumber = findMatch([
        /(?:Contact\s*Number|Mobile\s*Number|Phone\s*Number|Mobile|Phone|Contact|Cell)\s*[:\-]\s*([+0-9\s\-()]{10,18})/i,
        /(\+?91[\-\s]?[6-9]\d{9}|[6-9]\d{9})/,
    ])

    const emailId = findMatch([
        /(?:Email\s*ID|Email\s*Address|E-?mail)\s*[:\-]\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
    ])

    const hobbiesMatch = findMatch([
        /(?:Hobbies\s*and\s*Interests|Hobbies|Interests|Passions)\s*[:\-]\s*([^\n\r]+)/i,
    ])
    const hobbies = hobbiesMatch
        ? hobbiesMatch.split(/[,;\/&]/).map((h) => h.trim()).filter(Boolean)
        : []

    let rawAboutMe = findMatch([
        /(?:About\s*Me|About\s*Candidate|Profile\s*Summary|Summary|Introduction)\s*[:\-]\s*([^\n\r]+(?:\n[^\n\r]+){0,4})/i,
    ])

    // Clean up About Me: strip trailing sections if regex grabbed them
    if (rawAboutMe) {
        rawAboutMe = rawAboutMe
            .split(/(?:FAMILY DETAILS|CONTACT DETAILS|PERSONAL DETAILS|HOROSCOPE|PARTNER PREFERENCES)/i)[0]
            .trim()
    }

    return normalizeBiodataResult({
        personal_details: {
            name: name || "Candidate",
            gender: gender ? String(gender).toLowerCase() : "",
            date_of_birth: dateOfBirth || "",
            place_of_birth: placeOfBirth || "",
            time_of_birth: timeOfBirth || "",
            rashi: rashi || "",
            nakshatra: nakshatra || "",
            height: height || "",
            marital_status: maritalStatus || "never_married",
            manglik: manglik || "no",
            complexion: complexion || "",
            highest_education: highestEducation || "",
            organization_name: organizationName || "",
            occupation: rawOccupation || "",
            annual_income: annualIncome || "",
            about_me: rawAboutMe || "",
            mother_tongue: motherTongue || "",
            religion: religion || "Hindu",
            caste: caste || "",
            gotra: gotra || "",
            hobbies: hobbies.length > 0 ? hobbies : ["Reading", "Music", "Traveling"],
        },
        family_details: {
            fathers_name: fathersName || "",
            fathers_occupation: fathersOccupation || "",
            mothers_name: mothersName || "",
            mothers_occupation: mothersOccupation || "",
        },
        contact_details: {
            contact_number: contactNumber || "",
            email_id: emailId || "",
            city: city || "",
        },
    })
}

/**
 * Standardize output structure with both nested and flat properties
 */
const normalizeBiodataResult = (data = {}) => {
    const personal = data.personal_details || {}
    const family = data.family_details || {}
    const contact = data.contact_details || {}

    const rawDob = personal.date_of_birth || data.dateOfBirth || data.date_of_birth || ""
    const { day, month, year, date_of_birth } = parseDateDetails(rawDob)

    const rawHeight = personal.height || data.height || ""
    const normalizedHeight = normalizeHeight(rawHeight)

    const rawEdu = personal.highest_education || personal.education || data.education || ""
    const normalizedEdu = normalizeEducation(rawEdu)

    const rawOcc = personal.occupation || data.occupation || ""
    const rawCompany = personal.organization_name || personal.company || data.company || ""
    const normalizedOcc = normalizeOccupation(rawOcc)

    const rawIncome = personal.annual_income || personal.income || data.income || ""
    const normalizedIncome = normalizeIncomeRange(rawIncome)

    const rawGender = personal.gender || data.gender || ""
    let gender = rawGender ? String(rawGender).toLowerCase().trim() : ""
    if (gender !== "male" && gender !== "female" && gender !== "other") {
        const fullDump = JSON.stringify(data)
        if (/\b(?:bride|female|daughter|girl|woman|she|kumari|mrs|ms|miss)\b/i.test(fullDump)) {
            gender = "female"
        } else if (/\b(?:groom|male|son|boy|man|he|shri|mr)\b/i.test(fullDump)) {
            gender = "male"
        } else {
            gender = "female"
        }
    }
    const ageFromYear = year ? new Date().getFullYear() - parseInt(year, 10) : 26
    const minAge = gender === "male" ? Math.max(18, ageFromYear - 5) : Math.max(18, ageFromYear)
    const maxAge = gender === "male" ? ageFromYear : ageFromYear + 5

    return {
        personal_details: {
            name: personal.name || data.name || "",
            gender,
            date_of_birth: date_of_birth || rawDob,
            place_of_birth: personal.place_of_birth || data.placeOfBirth || data.birthPlace || "",
            time_of_birth: personal.time_of_birth || data.timeOfBirth || data.birthTiming || "",
            rashi: personal.rashi || data.rashi || "",
            nakshatra: personal.nakshatra || personal.nakshtra || data.nakshtra || "",
            height: normalizedHeight,
            marital_status: personal.marital_status || personal.maritalStatus || data.maritalStatus || "never_married",
            manglik: personal.manglik || data.manglik || "no",
            complexion: personal.complexion || data.complexion || "",
            highest_education: rawEdu,
            organization_name: rawCompany,
            occupation: rawOcc,
            annual_income: rawIncome,
            about_me: personal.about_me || personal.about || data.about || "",
            mother_tongue: personal.mother_tongue || personal.motherTongue || data.motherTongue || "",
            religion: personal.religion || data.religion || "Hindu",
            caste: personal.caste || data.caste || "",
            gotra: personal.gotra || personal.gotham || data.gotham || "",
            hobbies: Array.isArray(personal.hobbies) ? personal.hobbies : (Array.isArray(data.hobbies) ? data.hobbies : []),
        },
        family_details: {
            fathers_name: family.fathers_name || data.fathers_name || "",
            fathers_occupation: family.fathers_occupation || data.fathers_occupation || "",
            mothers_name: family.mothers_name || data.mothers_name || "",
            mothers_occupation: family.mothers_occupation || data.mothers_occupation || "",
        },
        contact_details: {
            contact_number: contact.contact_number || data.contact_number || data.phone || "",
            email_id: contact.email_id || data.email_id || data.email || "",
            city: contact.city || data.city || data.location || "",
        },
        // Flat aliases for direct binding to form states
        name: personal.name || data.name || "",
        gender,
        birthPlace: personal.place_of_birth || data.placeOfBirth || data.birthPlace || "",
        timeOfBirth: personal.time_of_birth || data.timeOfBirth || data.birthTime || data.birthTiming || "",
        birthTiming: personal.time_of_birth || data.timeOfBirth || data.birthTime || data.birthTiming || "",
        motherTongue: personal.mother_tongue || personal.motherTongue || data.motherTongue || "",
        about: personal.about_me || personal.about || data.about || "",
        height: normalizedHeight,
        location: contact.city || data.city || data.location || "",
        education: normalizedEdu,
        rawEducation: rawEdu,
        occupation: normalizedOcc,
        rawOccupation: rawOcc,
        company: rawCompany,
        income: normalizedIncome,
        rawIncome,
        city: contact.city || data.city || data.location || "",
        religion: personal.religion || data.religion || "Hindu",
        caste: personal.caste || data.caste || "",
        gotham: personal.gotra || personal.gotham || data.gotham || "",
        rashi: personal.rashi || data.rashi || "",
        nakshtra: personal.nakshatra || personal.nakshtra || data.nakshtra || "",
        manglik: personal.manglik || data.manglik || "no",
        complexion: personal.complexion || data.complexion || "",
        maritalStatus: personal.marital_status || personal.maritalStatus || data.maritalStatus || "never_married",
        hobbies: Array.isArray(personal.hobbies) ? personal.hobbies : (Array.isArray(data.hobbies) ? data.hobbies : []),
        day,
        month,
        year,
        // Smart partner preference defaults derived from biodata
        minAge: String(minAge),
        maxAge: String(maxAge),
        partnereducation: normalizedEdu,
        partneroccupation: normalizedOcc,
        partnerincome: normalizedIncome,
    }
}

const createDefaultBiodataStructure = () => {
    return normalizeBiodataResult({
        personal_details: {
            name: "",
            gender: "female",
            date_of_birth: "",
            place_of_birth: "",
            time_of_birth: "",
            rashi: "",
            nakshatra: "",
            height: "",
            marital_status: "never_married",
            manglik: "no",
            complexion: "",
            highest_education: "",
            organization_name: "",
            annual_income: "",
            about_me: "",
            mother_tongue: "",
            religion: "Hindu",
            caste: "",
            gotra: "",
            hobbies: [],
        },
        family_details: {
            fathers_name: "",
            fathers_occupation: "",
            mothers_name: "",
            mothers_occupation: "",
        },
        contact_details: {
            contact_number: "",
            email_id: "",
            city: "",
        },
    })
}

class ExtractionService {
    /**
     * Extract structured biodata from an uploaded PDF or image buffer.
     * Uses a resilient multi-tier pipeline:
     * Tier 1: pdf-parse text extraction (for PDF files)
     * Tier 2: Gemini multimodal & GenAI processing (if configured)
     * Tier 3: Groq LLM (llama-3.3-70b-versatile) JSON extraction (if configured)
     * Tier 4: Matrimonial heuristic regex parser (100% reliable offline fallback)
     * @param {Buffer} fileBuffer
     * @param {string} mimeType
     * @returns {Promise<object>} Standardized extracted biodata JSON
     */
    async extractBiodata(fileBuffer, mimeType = "application/pdf") {
        if (!fileBuffer || fileBuffer.length === 0) {
            throw new Error("No file content received for extraction.")
        }

        let pdfText = ""
        const isPdf = mimeType === "application/pdf" || (!mimeType && fileBuffer.slice(0, 5).toString().includes("%PDF"))

        // Tier 1: Extract raw text if PDF
        if (isPdf) {
            try {
                const pdfMod = await import("pdf-parse")
                const PDFParse = pdfMod.PDFParse || pdfMod.default
                if (typeof PDFParse === "function" && PDFParse.prototype?.getText) {
                    const parser = new PDFParse({ data: fileBuffer })
                    const res = await parser.getText()
                    pdfText = (typeof res === "string" ? res : res?.text || "").trim()
                } else if (typeof pdfMod.default === "function") {
                    const res = await pdfMod.default(fileBuffer)
                    pdfText = (res?.text || "").trim()
                }
            } catch (pdfErr) {
                console.warn("[PDF Parse Warning] Could not parse text with pdf-parse:", pdfErr.message)
            }
        }

        const extractionPrompt = `You are an expert matrimonial biodata parser. Extract all details from the provided biodata document or text into strict JSON matching this exact structure:
{
  "personal_details": {
    "name": "Full Name",
    "gender": "male or female",
    "date_of_birth": "YYYY-MM-DD or date string",
    "place_of_birth": "City, State",
    "time_of_birth": "e.g. 10:30 AM",
    "rashi": "e.g. Mesha, Vrishabha",
    "nakshatra": "e.g. Rohini, Ashwini",
    "height": "e.g. 5'8\\\" or 172 cm",
    "marital_status": "never_married, divorced, or widowed",
    "manglik": "yes, no, or anshik",
    "complexion": "Fair, Wheatish, etc.",
    "highest_education": "Degree name",
    "organization_name": "Company or job title",
    "annual_income": "e.g. 12 LPA",
    "about_me": "Brief self introduction",
    "mother_tongue": "e.g. Hindi, Marathi, Gujarati, Telugu",
    "religion": "e.g. Hindu, Muslim, Sikh, Jain",
    "caste": "Caste name",
    "gotra": "Gotra name",
    "hobbies": ["hobby1", "hobby2"]
  },
  "family_details": {
    "fathers_name": "Father's Full Name",
    "fathers_occupation": "Father's occupation",
    "mothers_name": "Mother's Full Name",
    "mothers_occupation": "Mother's occupation"
  },
  "contact_details": {
    "contact_number": "Phone number",
    "email_id": "Email address",
    "city": "Current city/location"
  }
}

Return ONLY valid JSON. No conversational text or markdown codeblocks outside JSON.`

        // Tier 2: Try Gemini if key is available
        if (process.env.GEMINI_API_KEY) {
            try {
                const ai = getAI()
                if (ai) {
                    let contents
                    if (isPdf && pdfText) {
                        contents = [extractionPrompt, `Biodata Text Content:\n${pdfText}`]
                    } else {
                        contents = [
                            {
                                inlineData: {
                                    data: fileBuffer.toString("base64"),
                                    mimeType: mimeType || "application/pdf",
                                },
                            },
                            extractionPrompt,
                        ]
                    }

                    const text = await generateWithGemini(contents, {
                        responseMimeType: "application/json",
                        responseSchema: biodataSchema,
                    })

                    if (text) {
                        const parsed = JSON.parse(text)
                        return normalizeBiodataResult(parsed)
                    }
                }
            } catch (geminiErr) {
                console.warn("[Gemini Extraction Warning] Gemini failed, attempting Groq fallback:", geminiErr.message)
            }
        }

        // Tier 3: Try Groq LLM (120B/20B/Qwen models) with extracted text or text representation
        if (process.env.GROQ_API_KEY && (pdfText || !isPdf)) {
            try {
                const textToProcess = pdfText || fileBuffer.toString("utf-8", 0, Math.min(fileBuffer.length, 10000))
                if (textToProcess && textToProcess.length > 10) {
                    const groqRes = await generateWithGroq([
                        {
                            role: "system",
                            content: "You are an expert AI parser for Indian matrimonial biodatas. Return strictly valid JSON matching the user schema.",
                        },
                        {
                            role: "user",
                            content: `${extractionPrompt}\n\nBiodata Content:\n${textToProcess}`,
                        },
                    ], true, 0.1)

                    if (groqRes && groqRes.content) {
                        let rawJson = groqRes.content.trim()
                        if (rawJson.startsWith("```json")) {
                            rawJson = rawJson.replace(/^```json\s*/, "").replace(/\s*```$/, "")
                        } else if (rawJson.startsWith("```")) {
                            rawJson = rawJson.replace(/^```\s*/, "").replace(/\s*```$/, "")
                        }
                        const parsed = JSON.parse(rawJson)
                        return normalizeBiodataResult(parsed)
                    }
                }
            } catch (groqErr) {
                console.warn("[Groq Extraction Warning] Groq failed, switching to heuristic rule parser:", groqErr.message)
            }
        }

        // Tier 4: 100% Reliable Heuristic / Regex Extraction
        if (pdfText) {
            return extractBiodataFromTextHeuristic(pdfText)
        }

        // Final fallback: Return formatted default structure with whatever string could be retrieved
        const rawString = fileBuffer.toString("utf-8", 0, Math.min(fileBuffer.length, 5000))
        return extractBiodataFromTextHeuristic(rawString)
    }

    /**
     * Extract structured biodata directly from raw text
     * @param {string} text
     * @returns {object} Standardized extracted biodata JSON
     */
    extractFromText(text = "") {
        return extractBiodataFromTextHeuristic(text)
    }

    /**
     * Generate an engaging matrimonial profile bio using Gemini AI (with Groq LLM fallback)
     */
    async generateBio(details = {}) {
        const {
            name = "User",
            gender = "",
            occupation = "",
            education = "",
            city = "",
            location = "",
            hobbies = [],
            religion = "",
            maritalStatus = "",
        } = details

        const userCity = city || location || "India"
        const hobbiesStr = Array.isArray(hobbies) && hobbies.length > 0
            ? hobbies.join(", ")
            : "reading, traveling, fitness, and family time"

        const bioPrompt = `Write a warm, dignified, and attractive first-person matrimonial profile introduction (50 to 200 words) for an Indian matchmaking platform.
Profile Details:
- Name: ${name}
- Gender: ${gender || "Not specified"}
- Profession: ${occupation || "Professional"}
- Education: ${education || "Graduate"}
- Location: ${userCity}
- Hobbies / Interests: ${hobbiesStr}
${religion ? `- Religion / Values: ${religion}` : ""}
${maritalStatus ? `- Marital Status: ${maritalStatus}` : ""}

Instructions:
1. Write in natural, polite first-person ("I am...", "I value...").
2. Mention personality, professional background, lifestyle interests, and what kind of life partner is desired.
3. Keep it between 50 and 200 words.
4. Return ONLY the plain text bio without quotes or markdown headers.`

        // Tier 1: Try Gemini
        if (process.env.GEMINI_API_KEY) {
            try {
                const response = await generateWithGemini([bioPrompt])
                if (response && response.length >= 40) {
                    return response.replace(/^["']|["']$/g, "").trim()
                }
            } catch (err) {
                console.warn("[Gemini Bio Generation Warning] Gemini failed, trying Groq:", err.message)
            }
        }

        // Tier 2: Try Groq (120B / 20B / Qwen LLMs)
        if (process.env.GROQ_API_KEY) {
            try {
                const groqRes = await generateWithGroq([
                    { role: "system", content: "You are an expert matrimonial profile writer." },
                    { role: "user", content: bioPrompt },
                ], false, 0.7)
                if (groqRes && groqRes.content && groqRes.content.length >= 40) {
                    return groqRes.content.replace(/^["']|["']$/g, "").trim()
                }
            } catch (groqErr) {
                console.warn("[Groq Bio Generation Warning] Groq failed, using template:", groqErr.message)
            }
        }

        // Tier 3: High-quality dynamic template fallback
        return `Hello! I am ${name}, a ${occupation || "working professional"} based in ${userCity}${education ? ` with a background in ${education}` : ""}. I consider myself an open-minded, grounded individual with a modern outlook and respect for traditional family values. In my free time, I enjoy ${hobbiesStr}. I am looking for a kind-hearted, progressive, and understanding life partner who values mutual respect, companionship, and growing together through all stages of life.`
    }

    /**
     * Generate AI-powered conversation starters and icebreakers using Gemini & Groq
     */
    async generateChatSuggestions(partnerDetails = {}, lastMessage = "", category = "icebreaker") {
        const { name = "there", occupation = "", city = "", hobbies = [] } = partnerDetails
        const firstName = name.split(" ")[0] || "there"

        const prompt = `Generate 4 friendly, polite, and engaging conversation starters/icebreakers for a matrimonial chat on an Indian matchmaking platform.
Recipient Name: ${firstName}
Recipient Occupation: ${occupation || "Not specified"}
Recipient City: ${city || "Not specified"}
Recipient Hobbies: ${Array.isArray(hobbies) ? hobbies.join(", ") : "Not specified"}
Last Message Context: ${lastMessage || "Starting a fresh conversation"}

Return strictly a JSON object with a "suggestions" array containing 4 strings (e.g. {"suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4"]}).`

        // Tier 1: Try Gemini
        if (process.env.GEMINI_API_KEY) {
            try {
                const response = await generateWithGemini([prompt], {
                    responseMimeType: "application/json",
                })
                if (response) {
                    const parsed = JSON.parse(response)
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 4)
                    if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) return parsed.suggestions.slice(0, 4)
                }
            } catch (err) {
                console.warn("[Gemini Chat Suggestions Warning] Gemini failed, trying Groq:", err.message)
            }
        }

        // Tier 2: Try Groq (120B / 20B / Qwen LLMs)
        if (process.env.GROQ_API_KEY) {
            try {
                const groqRes = await generateWithGroq([
                    { role: "system", content: "You are an expert matchmaking conversation coach. Return a JSON object with a 'suggestions' array containing 4 starter questions." },
                    { role: "user", content: prompt },
                ], true, 0.7)
                if (groqRes && groqRes.content) {
                    let raw = groqRes.content.trim()
                    if (raw.startsWith("```json")) raw = raw.replace(/^```json\s*/, "").replace(/\s*```$/, "")
                    else if (raw.startsWith("```")) raw = raw.replace(/^```\s*/, "").replace(/\s*```$/, "")
                    const parsed = JSON.parse(raw)
                    const list = Array.isArray(parsed) ? parsed : (parsed.suggestions || parsed.starters || Object.values(parsed))
                    if (Array.isArray(list) && list.length > 0) return list.slice(0, 4)
                }
            } catch (groqErr) {
                console.warn("[Groq Chat Suggestions Warning] Groq failed, using heuristics:", groqErr.message)
            }
        }

        // Tier 3: Dynamic rule-based starters
        const suggestions = []
        if (lastMessage) {
            suggestions.push(`Thanks for your message, ${firstName}! That sounds really interesting. How has the rest of your week been?`)
            suggestions.push(`I appreciate you sharing that, ${firstName}. I would love to learn more about your thoughts on this!`)
            suggestions.push(`Hello ${firstName}! That's wonderful. What do you enjoy most in your day-to-day routine?`)
            suggestions.push(`Thank you for reaching out, ${firstName}. Shall we talk a bit about our family backgrounds and interests?`)
        } else {
            if (occupation) suggestions.push(`Hi ${firstName}! I saw your profile and was really impressed by your work in ${occupation}. How is your week going?`)
            else suggestions.push(`Hi ${firstName}! I came across your profile and would love to connect and get to know you better.`)

            if (hobbies.length > 0) suggestions.push(`Hello ${firstName}! I noticed you enjoy ${hobbies[0]}—I find that exciting. What got you into it?`)
            else if (city) suggestions.push(`Hello ${firstName}! It's great to connect with someone from ${city}. How are things in your city?`)
            else suggestions.push(`Hello ${firstName}! I really liked your profile and thought we might share similar values and interests.`)

            if (city) suggestions.push(`Hi ${firstName}! How do you usually like to spend your free time in ${city}?`)
            else suggestions.push(`Hi ${firstName}! What are some hobbies or passions that you are currently enthusiastic about?`)

            suggestions.push(`Namaste ${firstName}! I'd love to know more about your lifestyle preferences and what you look for in a life partner.`)
        }

        return suggestions.slice(0, 4)
    }
}

const extractionService = new ExtractionService()
export { extractionService }
export default extractionService
