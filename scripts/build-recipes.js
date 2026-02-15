const fs = require('fs');
const path = require('path');

const RECIPE_DIR = path.join(__dirname, '..');
const OUTPUT = path.join(__dirname, '..', 'docs', 'recipes.json');

const CATEGORIES = ['chicken', 'beef', 'seafood', 'sides', 'vegetarian', 'breakfast', 'desserts', 'appetizers'];

// Hardcoded nutrition estimates per recipe (per original serving)
// Values: { calories, protein (g), carbs (g), fat (g) }
const NUTRITION = {
  'grilled-herb-chicken': { calories: 320, protein: 42, carbs: 1, fat: 15 },
  'lemony-chicken-meatballs': { calories: 280, protein: 30, carbs: 12, fat: 12 },
  'chicken-kabobs': { calories: 290, protein: 35, carbs: 8, fat: 13 },
  'chicken-shawarma-salad': { calories: 350, protein: 34, carbs: 15, fat: 18 },
  'chicken-udon': { calories: 420, protein: 32, carbs: 48, fat: 10 },
  'chicken-wonton-soup': { calories: 310, protein: 28, carbs: 30, fat: 8 },
  'soba-noodles-chicken': { calories: 390, protein: 30, carbs: 45, fat: 10 },
  'mediterranean-chicken-orzo': { calories: 410, protein: 35, carbs: 38, fat: 14 },
  'chicken-rice-platter': { calories: 450, protein: 38, carbs: 45, fat: 12 },
  'pollo-asado-burrito': { calories: 520, protein: 36, carbs: 52, fat: 18 },
  'lebanese-chicken-rice': { calories: 440, protein: 35, carbs: 42, fat: 14 },
  'smash-burger': { calories: 480, protein: 32, carbs: 30, fat: 26 },
  'assyrian-kebab': { calories: 350, protein: 28, carbs: 18, fat: 20 },
  'double-beef-chili': { calories: 380, protein: 30, carbs: 28, fat: 16 },
  'italian-meatballs': { calories: 340, protein: 26, carbs: 18, fat: 20 },
  'classic-lasagna': { calories: 450, protein: 28, carbs: 36, fat: 22 },
  'lebanese-spinach-beef-rice': { calories: 400, protein: 26, carbs: 40, fat: 16 },
  'pad-thai': { calories: 420, protein: 24, carbs: 50, fat: 14 },
  'shrimp-lemon-orecchiette': { calories: 400, protein: 26, carbs: 44, fat: 14 },
  'shrimp-fried-rice': { calories: 380, protein: 22, carbs: 46, fat: 12 },
  'grilled-corn-veggie-bowl': { calories: 350, protein: 22, carbs: 35, fat: 14 },
  'roasted-potatoes': { calories: 180, protein: 3, carbs: 28, fat: 7 },
  'protein-cornbread': { calories: 200, protein: 10, carbs: 26, fat: 6 },
  'quinoa-tabbouleh': { calories: 190, protein: 6, carbs: 26, fat: 8 },
  'micro-chop-kale-salad': { calories: 160, protein: 5, carbs: 14, fat: 10 },
  'hawaiian-mac-salad': { calories: 280, protein: 5, carbs: 30, fat: 16 },
  'greek-salad': { calories: 170, protein: 4, carbs: 8, fat: 14 },
  'adas-bil-hamod': { calories: 220, protein: 12, carbs: 34, fat: 4 },
  'stuffed-zucchini': { calories: 260, protein: 14, carbs: 22, fat: 14 },
  'pancakes': { calories: 250, protein: 7, carbs: 36, fat: 9 },
  'french-toast': { calories: 280, protein: 10, carbs: 32, fat: 12 },
  'chocolate-chip-cookies': { calories: 180, protein: 2, carbs: 24, fat: 9 },
  'ricotta-cookies': { calories: 160, protein: 3, carbs: 22, fat: 7 },
  'spritz-cookies': { calories: 140, protein: 2, carbs: 16, fat: 8 },
  'banana-bread': { calories: 231, protein: 4, carbs: 35, fat: 9 },
  'buffalo-wings': { calories: 360, protein: 28, carbs: 4, fat: 26 },
  'chicken-taco-bowl': { calories: 480, protein: 36, carbs: 52, fat: 14 },
  'beef-taco-bowl': { calories: 510, protein: 34, carbs: 48, fat: 20 },
  'teriyaki-beef': { calories: 400, protein: 34, carbs: 30, fat: 14 },
  'protein-pizza': { calories: 630, protein: 61, carbs: 80, fat: 5 },
  'braised-beef-noodle-soup': { calories: 420, protein: 32, carbs: 38, fat: 16 },
};

function parseServings(metaLine) {
  const match = metaLine.match(/Serves:\*?\*?\s*(\d+)/i);
  return match ? parseInt(match[1]) : 4;
}

function parseIngredients(content) {
  const ingredients = [];
  const ingSection = content.match(/## Ingredients\s*\n([\s\S]*?)(?=\n## )/);
  if (!ingSection) return ingredients;

  const lines = ingSection[1].split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      const text = trimmed.slice(2).trim();
      const parsed = parseIngredientLine(text);
      ingredients.push(parsed);
    }
  }
  return ingredients;
}

function parseIngredientLine(text) {
  // Match patterns like "2 cups flour", "1/2 teaspoon salt", "2 ⅓ cups mashed bananas"
  const fractionMap = { '½': 0.5, '⅓': 1/3, '⅔': 2/3, '¼': 0.25, '¾': 0.75, '⅛': 0.125 };

  let quantity = null;
  let unit = '';
  let name = text;

  // Try to match: optional "whole fraction" (e.g. 1/4) or "whole unicodeFrac" or just whole number, then unit and name
  const units = /(?:cups?|tablespoons?|teaspoons?|tbsp|tsp|ounces?|oz|pounds?|lbs?|cloves?|cans?|inches?|inch|slices?|pieces?|pinch|dash|bunch|head|stalks?|sprigs?|large|medium|small)/i;
  const regex = new RegExp(
    '^' +
    '(?:(\\d+)\\s*([½⅓⅔¼¾⅛])' +           // whole + unicode fraction (e.g. "2 ½")
    '|(\\d+)\\s*\\/\\s*(\\d+)' +              // simple fraction (e.g. "1/4")
    '|(\\d+)\\s+(\\d+)\\s*\\/\\s*(\\d+)' +    // mixed number (e.g. "1 1/2")
    '|(\\d+)' +                                // whole number only
    '|([½⅓⅔¼¾⅛])' +                          // unicode fraction only
    ')?' +
    '\\s*(' + units.source + ')?' +            // optional unit
    '\\s*(.*)$',                               // rest is the name
    'i'
  );
  const m = text.match(regex);

  if (m) {
    let q = 0;
    if (m[1] != null) {
      // whole + unicode fraction
      q = parseInt(m[1]) + (fractionMap[m[2]] || 0);
    } else if (m[3] != null && m[4] != null) {
      // simple fraction like 1/4
      q = parseInt(m[3]) / parseInt(m[4]);
    } else if (m[5] != null) {
      // mixed number like 1 1/2
      q = parseInt(m[5]) + parseInt(m[6]) / parseInt(m[7]);
    } else if (m[8] != null) {
      // whole number only
      q = parseInt(m[8]);
    } else if (m[9] != null) {
      // unicode fraction only
      q = fractionMap[m[9]] || 0;
    }
    if (q > 0) {
      quantity = q;
      unit = (m[10] || '').toLowerCase();
      name = m[11] || text;
      if (!name.trim()) name = unit; // e.g. "2 Brioche buns"
    }
  }

  // Fallback: if no quantity parsed, keep original text
  if (quantity === null) {
    return { quantity: null, unit: '', name: text, original: text };
  }

  return { quantity, unit, name: name.trim(), original: text };
}

function parseTags(content) {
  const tagSection = content.match(/## Tags\s*\n(.*)/);
  if (!tagSection) return [];
  const tags = tagSection[1].match(/#[\w-]+/g) || [];
  return tags.map(t => t.slice(1));
}

function parseRecipe(filePath, category) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const slug = path.basename(filePath, '.md');

  // Title
  const titleMatch = content.match(/^# (.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : slug;

  // Meta line (Serves, Prep Time, Cook Time)
  const metaMatch = content.match(/\*\*Serves:\*\*.+/);
  const metaLine = metaMatch ? metaMatch[0] : '';
  const servings = parseServings(metaLine);

  // Description
  const descMatch = content.match(/## Description\s*\n([\s\S]*?)(?=\n## )/);
  const description = descMatch ? descMatch[1].trim().split('\n')[0] : '';

  // Ingredients
  const ingredients = parseIngredients(content);

  // Instructions
  const instrSection = content.match(/## Instructions\s*\n([\s\S]*?)(?=\n## )/);
  const instructions = [];
  if (instrSection) {
    const lines = instrSection[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\d+\./.test(trimmed)) {
        instructions.push(trimmed.replace(/^\d+\.\s*/, ''));
      }
    }
  }

  // Tags
  const tags = parseTags(content);

  // Nutrition
  const nutrition = NUTRITION[slug] || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return {
    slug,
    title,
    category,
    servings,
    description,
    meta: metaLine.replace(/\*\*/g, ''),
    ingredients,
    instructions,
    tags,
    nutrition,
  };
}

// Main
const recipes = [];
for (const cat of CATEGORIES) {
  const catDir = path.join(RECIPE_DIR, cat);
  if (!fs.existsSync(catDir)) continue;
  const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    recipes.push(parseRecipe(path.join(catDir, file), cat));
  }
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(recipes, null, 2));
console.log(`Generated ${recipes.length} recipes → ${OUTPUT}`);
