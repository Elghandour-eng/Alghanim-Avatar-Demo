// Car Names Vocabulary and Pronunciation Dictionary
// This file contains car names, models, and their phonetic pronunciations
// to improve Speech-to-Text recognition accuracy

const CAR_VOCABULARY = {
    // Cadillac Models and Variants
    cadillac: {
        brand: "Cadillac",
        phonetic: "كاديلاك",
        models: {
            "escalade": {
                name: "Escalade",
                phonetic: "إسكاليد",
                variants: ["ESV", "Premium Luxury", "Sport", "Platinum"]
            },
            "ct4": {
                name: "CT4",
                phonetic: "سي تي فور",
                variants: ["Premium Luxury", "Sport", "V-Series", "Blackwing"]
            },
            "ct5": {
                name: "CT5",
                phonetic: "سي تي فايف",
                variants: ["Premium Luxury", "Sport", "V-Series", "Blackwing"]
            },
            "xt4": {
                name: "XT4",
                phonetic: "إكس تي فور",
                variants: ["Luxury", "Premium Luxury", "Sport"]
            },
            "xt5": {
                name: "XT5",
                phonetic: "إكس تي فايف",
                variants: ["Luxury", "Premium Luxury", "Sport", "Platinum"]
            },
            "xt6": {
                name: "XT6",
                phonetic: "إكس تي سكس",
                variants: ["Luxury", "Premium Luxury", "Sport", "Platinum"]
            },
            "lyriq": {
                name: "LYRIQ",
                phonetic: "ليريك",
                variants: ["Luxury", "Tech", "Sport"]
            },
            "celestiq": {
                name: "CELESTIQ",
                phonetic: "سيليستيك",
                variants: ["Ultra Luxury"]
            },
            "optic": {
                name: "OPTIC",
                phonetic: "أوبتيك",
                variants: ["Sport Package", "Performance"]
            }
        }
    },
    
    // Other Popular Car Brands (for context)
    toyota: {
        brand: "Toyota",
        phonetic: "تويوتا",
        models: {
            "camry": { name: "Camry", phonetic: "كامري" },
            "corolla": { name: "Corolla", phonetic: "كورولا" },
            "prado": { name: "Prado", phonetic: "برادو" },
            "land_cruiser": { name: "Land Cruiser", phonetic: "لاند كروزر" }
        }
    },
    
    bmw: {
        brand: "BMW",
        phonetic: "بي إم دبليو",
        models: {
            "x5": { name: "X5", phonetic: "إكس فايف" },
            "x3": { name: "X3", phonetic: "إكس ثري" },
            "series_3": { name: "3 Series", phonetic: "سيريز ثري" }
        }
    },
    
    mercedes: {
        brand: "Mercedes-Benz",
        phonetic: "مرسيدس بنز",
        models: {
            "c_class": { name: "C-Class", phonetic: "سي كلاس" },
            "e_class": { name: "E-Class", phonetic: "إي كلاس" },
            "s_class": { name: "S-Class", phonetic: "إس كلاس" }
        }
    }
};

// Common car-related terms and their phonetic equivalents
const CAR_TERMS = {
    "model": "موديل",
    "year": "سنة",
    "color": "لون",
    "engine": "محرك",
    "transmission": "ناقل الحركة",
    "automatic": "أوتوماتيك",
    "manual": "يدوي",
    "hybrid": "هايبرد",
    "electric": "كهربائي",
    "suv": "إس يو في",
    "sedan": "سيدان",
    "coupe": "كوبيه",
    "convertible": "كونفرتيبل",
    "luxury": "لاكشري",
    "premium": "بريميوم",
    "sport": "سبورت",
    "performance": "بيرفورمانس",
    "platinum": "بلاتينيوم",
    "black": "أسود",
    "white": "أبيض",
    "silver": "فضي",
    "red": "أحمر",
    "blue": "أزرق"
};

// Pronunciation corrections for commonly misheard car names
const PRONUNCIATION_CORRECTIONS = {
    // Common misheard words and their corrections
    "object": "OPTIC",
    "optic": "OPTIC",
    "optical": "OPTIC",
    "option": "OPTIC",
    "cadillac": "Cadillac",
    "cadilac": "Cadillac",
    "cadilack": "Cadillac",
    "escalade": "Escalade",
    "escalad": "Escalade",
    "lyriq": "LYRIQ",
    "lyric": "LYRIQ",
    "lyrics": "LYRIQ",
    "celestiq": "CELESTIQ",
    "celestic": "CELESTIQ",
    "ct4": "CT4",
    "ct5": "CT5",
    "xt4": "XT4",
    "xt5": "XT5",
    "xt6": "XT6"
};

// Function to get all car names for vocabulary enhancement
function getAllCarNames() {
    const allNames = [];
    
    Object.values(CAR_VOCABULARY).forEach(brand => {
        allNames.push(brand.brand);
        Object.values(brand.models).forEach(model => {
            allNames.push(model.name);
            if (model.variants) {
                allNames.push(...model.variants);
            }
        });
    });
    
    return allNames;
}

// Function to get phonetic alternatives
function getPhoneticAlternatives() {
    const alternatives = [];
    
    Object.values(CAR_VOCABULARY).forEach(brand => {
        alternatives.push(brand.phonetic);
        Object.values(brand.models).forEach(model => {
            if (model.phonetic) {
                alternatives.push(model.phonetic);
            }
        });
    });
    
    return alternatives;
}

// Function to correct commonly misheard car names
function correctCarName(recognizedText) {
    let correctedText = recognizedText;
    
    // Apply pronunciation corrections
    Object.entries(PRONUNCIATION_CORRECTIONS).forEach(([misheard, correct]) => {
        const regex = new RegExp(`\\b${misheard}\\b`, 'gi');
        correctedText = correctedText.replace(regex, correct);
    });
    
    return correctedText;
}

// Function to enhance recognized text with car context
function enhanceCarRecognition(recognizedText) {
    let enhancedText = correctCarName(recognizedText);
    
    // Additional context-based corrections for common misrecognitions
    
    // Handle "OPTIC" variations - most common issue
    enhancedText = enhancedText.replace(/\bopt\s*ical\b/gi, 'OPTIC');
    enhancedText = enhancedText.replace(/\bopt\s*ic\b/gi, 'OPTIC');
    enhancedText = enhancedText.replace(/\boption\b/gi, 'OPTIC');
    enhancedText = enhancedText.replace(/\bobject\b/gi, 'OPTIC');
    enhancedText = enhancedText.replace(/\boptics\b/gi, 'OPTIC');
    
    // Handle Cadillac variations
    enhancedText = enhancedText.replace(/\bcadilac\b/gi, 'Cadillac');
    enhancedText = enhancedText.replace(/\bcadilack\b/gi, 'Cadillac');
    enhancedText = enhancedText.replace(/\bkadillac\b/gi, 'Cadillac');
    
    // Handle model name variations
    enhancedText = enhancedText.replace(/\bescalad\b/gi, 'Escalade');
    enhancedText = enhancedText.replace(/\blyric\b/gi, 'LYRIQ');
    enhancedText = enhancedText.replace(/\blyrics\b/gi, 'LYRIQ');
    enhancedText = enhancedText.replace(/\bcelestik\b/gi, 'CELESTIQ');
    enhancedText = enhancedText.replace(/\bcelestiq\b/gi, 'CELESTIQ');
    
    // Handle spaced out model names
    enhancedText = enhancedText.replace(/\bc\s*t\s*4\b/gi, 'CT4');
    enhancedText = enhancedText.replace(/\bc\s*t\s*5\b/gi, 'CT5');
    enhancedText = enhancedText.replace(/\bx\s*t\s*4\b/gi, 'XT4');
    enhancedText = enhancedText.replace(/\bx\s*t\s*5\b/gi, 'XT5');
    enhancedText = enhancedText.replace(/\bx\s*t\s*6\b/gi, 'XT6');
    
    // Handle syllable-broken Cadillac variations
    enhancedText = enhancedText.replace(/\bc\s*ad\s*ill?\s*ac\b/gi, 'Cadillac');
    enhancedText = enhancedText.replace(/\bk\s*ad\s*ill?\s*ac\b/gi, 'Cadillac');
    enhancedText = enhancedText.replace(/\bc\s*a\s*d\s*i\s*l\s*l\s*a\s*c\b/gi, 'Cadillac');
    enhancedText = enhancedText.replace(/\bc\s*a\s*d\s*i\s*l\s*a\s*c\b/gi, 'Cadillac');
    
    // Handle broken Escalade
    enhancedText = enhancedText.replace(/\be\s*s\s*c\s*a\s*l\s*a\s*d\s*e?\b/gi, 'Escalade');
    enhancedText = enhancedText.replace(/\be\s*s\s*k\s*a\s*l\s*a\s*d\s*e?\b/gi, 'Escalade');
    
    // Context-based corrections
    // If "object" or similar appears near car-related terms, likely means "OPTIC"
    if (enhancedText.toLowerCase().includes('object') && 
        (enhancedText.toLowerCase().includes('cadillac') || 
         enhancedText.toLowerCase().includes('car') ||
         enhancedText.toLowerCase().includes('model') ||
         enhancedText.toLowerCase().includes('have'))) {
        enhancedText = enhancedText.replace(/object/gi, 'OPTIC');
    }
    
    return enhancedText;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CAR_VOCABULARY,
        CAR_TERMS,
        PRONUNCIATION_CORRECTIONS,
        getAllCarNames,
        getPhoneticAlternatives,
        correctCarName,
        enhanceCarRecognition
    };
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.CarVocabulary = {
        CAR_VOCABULARY,
        CAR_TERMS,
        PRONUNCIATION_CORRECTIONS,
        getAllCarNames,
        getPhoneticAlternatives,
        correctCarName,
        enhanceCarRecognition
    };
}
