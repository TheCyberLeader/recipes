#!/usr/bin/env python3
import os, re, json

RECIPE_DIR = os.path.join(os.path.dirname(__file__), '..')
OUTPUT = os.path.join(RECIPE_DIR, 'docs', 'recipes.json')
CATEGORIES = ['chicken', 'beef', 'seafood', 'sides', 'vegetarian', 'breakfast', 'desserts', 'appetizers']

NUTRITION = {
    'grilled-herb-chicken': {'calories': 320, 'protein': 42, 'carbs': 1, 'fat': 15},
    'lemony-chicken-meatballs': {'calories': 280, 'protein': 30, 'carbs': 12, 'fat': 12},
    'chicken-kabobs': {'calories': 290, 'protein': 35, 'carbs': 8, 'fat': 13},
    'chicken-shawarma-salad': {'calories': 350, 'protein': 34, 'carbs': 15, 'fat': 18},
    'chicken-udon': {'calories': 420, 'protein': 32, 'carbs': 48, 'fat': 10},
    'chicken-wonton-soup': {'calories': 310, 'protein': 28, 'carbs': 30, 'fat': 8},
    'soba-noodles-chicken': {'calories': 390, 'protein': 30, 'carbs': 45, 'fat': 10},
    'mediterranean-chicken-orzo': {'calories': 410, 'protein': 35, 'carbs': 38, 'fat': 14},
    'chicken-rice-platter': {'calories': 450, 'protein': 38, 'carbs': 45, 'fat': 12},
    'pollo-asado-burrito': {'calories': 520, 'protein': 36, 'carbs': 52, 'fat': 18},
    'lebanese-chicken-rice': {'calories': 440, 'protein': 35, 'carbs': 42, 'fat': 14},
    'smash-burger': {'calories': 480, 'protein': 32, 'carbs': 30, 'fat': 26},
    'assyrian-kebab': {'calories': 350, 'protein': 28, 'carbs': 18, 'fat': 20},
    'double-beef-chili': {'calories': 380, 'protein': 30, 'carbs': 28, 'fat': 16},
    'italian-meatballs': {'calories': 340, 'protein': 26, 'carbs': 18, 'fat': 20},
    'classic-lasagna': {'calories': 450, 'protein': 28, 'carbs': 36, 'fat': 22},
    'lebanese-spinach-beef-rice': {'calories': 400, 'protein': 26, 'carbs': 40, 'fat': 16},
    'pad-thai': {'calories': 420, 'protein': 24, 'carbs': 50, 'fat': 14},
    'shrimp-lemon-orecchiette': {'calories': 400, 'protein': 26, 'carbs': 44, 'fat': 14},
    'shrimp-fried-rice': {'calories': 380, 'protein': 22, 'carbs': 46, 'fat': 12},
    'grilled-corn-veggie-bowl': {'calories': 350, 'protein': 22, 'carbs': 35, 'fat': 14},
    'roasted-potatoes': {'calories': 180, 'protein': 3, 'carbs': 28, 'fat': 7},
    'protein-cornbread': {'calories': 200, 'protein': 10, 'carbs': 26, 'fat': 6},
    'quinoa-tabbouleh': {'calories': 190, 'protein': 6, 'carbs': 26, 'fat': 8},
    'micro-chop-kale-salad': {'calories': 160, 'protein': 5, 'carbs': 14, 'fat': 10},
    'hawaiian-mac-salad': {'calories': 280, 'protein': 5, 'carbs': 30, 'fat': 16},
    'greek-salad': {'calories': 170, 'protein': 4, 'carbs': 8, 'fat': 14},
    'adas-bil-hamod': {'calories': 220, 'protein': 12, 'carbs': 34, 'fat': 4},
    'stuffed-zucchini': {'calories': 260, 'protein': 14, 'carbs': 22, 'fat': 14},
    'pancakes': {'calories': 250, 'protein': 7, 'carbs': 36, 'fat': 9},
    'french-toast': {'calories': 280, 'protein': 10, 'carbs': 32, 'fat': 12},
    'chocolate-chip-cookies': {'calories': 180, 'protein': 2, 'carbs': 24, 'fat': 9},
    'ricotta-cookies': {'calories': 160, 'protein': 3, 'carbs': 22, 'fat': 7},
    'spritz-cookies': {'calories': 140, 'protein': 2, 'carbs': 16, 'fat': 8},
    'banana-bread': {'calories': 231, 'protein': 4, 'carbs': 35, 'fat': 9},
    'buffalo-wings': {'calories': 360, 'protein': 28, 'carbs': 4, 'fat': 26},
}

FRACTION_MAP = {'½': 0.5, '⅓': 1/3, '⅔': 2/3, '¼': 0.25, '¾': 0.75, '⅛': 0.125}

def parse_ingredient_line(text):
    quantity = 0
    unit = ''
    name = text

    pattern = r'^(\d+)?\s*([½⅓⅔¼¾⅛])?\s*(?:(\d+)/(\d+))?\s*(cups?|tablespoons?|teaspoons?|ounces?|oz|pounds?|lbs?|cloves?|cans?|inches?|inch|slices?|pieces?|pinch|dash|bunch|head|stalks?|sprigs?|large|medium|small)?\s*(.*)$'
    m = re.match(pattern, text, re.IGNORECASE)
    if m:
        q = 0
        if m.group(1): q += int(m.group(1))
        if m.group(2): q += FRACTION_MAP.get(m.group(2), 0)
        if m.group(3) and m.group(4): q += int(m.group(3)) / int(m.group(4))
        if q > 0:
            quantity = q
            unit = (m.group(5) or '').lower()
            name = (m.group(6) or text).strip()
            if not name:
                name = unit
            return {'quantity': quantity, 'unit': unit, 'name': name, 'original': text}

    return {'quantity': None, 'unit': '', 'name': text, 'original': text}

def parse_recipe(filepath, category):
    with open(filepath, 'r') as f:
        content = f.read()

    slug = os.path.splitext(os.path.basename(filepath))[0]

    # Title
    title_m = re.search(r'^# (.+)', content, re.MULTILINE)
    title = title_m.group(1).strip() if title_m else slug

    # Meta
    meta_m = re.search(r'\*\*Serves:\*\*.+', content)
    meta_line = meta_m.group(0) if meta_m else ''
    servings_m = re.search(r'Serves:\*?\*?\s*(\d+)', meta_line)
    servings = int(servings_m.group(1)) if servings_m else 4

    # Description
    desc_m = re.search(r'## Description\s*\n([\s\S]*?)(?=\n## )', content)
    description = desc_m.group(1).strip().split('\n')[0] if desc_m else ''

    # Ingredients
    ingredients = []
    ing_m = re.search(r'## Ingredients\s*\n([\s\S]*?)(?=\n## )', content)
    if ing_m:
        for line in ing_m.group(1).split('\n'):
            line = line.strip()
            if line.startswith('- '):
                ingredients.append(parse_ingredient_line(line[2:].strip()))

    # Instructions
    instructions = []
    instr_m = re.search(r'## Instructions\s*\n([\s\S]*?)(?=\n## )', content)
    if instr_m:
        for line in instr_m.group(1).split('\n'):
            line = line.strip()
            if re.match(r'^\d+\.', line):
                instructions.append(re.sub(r'^\d+\.\s*', '', line))

    # Tags
    tags = []
    tag_m = re.search(r'## Tags\s*\n(.*)', content)
    if tag_m:
        tags = [t[1:] for t in re.findall(r'#[\w-]+', tag_m.group(1))]

    nutrition = NUTRITION.get(slug, {'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0})

    return {
        'slug': slug,
        'title': title,
        'category': category,
        'servings': servings,
        'description': description,
        'meta': meta_line.replace('**', ''),
        'ingredients': ingredients,
        'instructions': instructions,
        'tags': tags,
        'nutrition': nutrition,
    }

recipes = []
for cat in CATEGORIES:
    cat_dir = os.path.join(RECIPE_DIR, cat)
    if not os.path.isdir(cat_dir):
        continue
    for fname in sorted(os.listdir(cat_dir)):
        if fname.endswith('.md'):
            recipes.append(parse_recipe(os.path.join(cat_dir, fname), cat))

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, 'w') as f:
    json.dump(recipes, f, indent=2)

print(f'Generated {len(recipes)} recipes → {OUTPUT}')
