let recipes = [];
let currentRecipe = null;
let shoppingList = []; // array of { recipe, servings }

const CATEGORY_LABELS = {
  chicken: 'Chicken', beef: 'Beef', seafood: 'Seafood', sides: 'Sides',
  vegetarian: 'Vegetarian', breakfast: 'Breakfast', desserts: 'Desserts', appetizers: 'Appetizers'
};

// DOM elements
const grid = document.getElementById('recipe-grid');
const detail = document.getElementById('recipe-detail');
const nav = document.getElementById('category-nav');
const shoppingPanel = document.getElementById('shopping-panel');
const shoppingToggle = document.getElementById('shopping-toggle');
const shoppingCount = document.getElementById('shopping-count');

// Escape user-facing strings before injecting into innerHTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Load recipes
fetch('recipes.json')
  .then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then(data => {
    recipes = data;
    buildCategoryNav();
    renderGrid('all');
  })
  .catch(err => {
    grid.innerHTML = '<p class="error-msg">Failed to load recipes. Please refresh the page.</p>';
    console.error('Failed to load recipes:', err);
  });

function buildCategoryNav() {
  const cats = [...new Set(recipes.map(r => r.category))];
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.dataset.cat = cat;
    btn.textContent = CATEGORY_LABELS[cat] || cat;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      renderGrid(cat);
    });
    nav.appendChild(btn);
  });

  // "All" button handler
  const allBtn = nav.querySelector('[data-cat="all"]');
  allBtn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    allBtn.classList.add('active');
    allBtn.setAttribute('aria-pressed', 'true');
    renderGrid('all');
  });
}

function renderGrid(category) {
  showView('grid');
  const filtered = category === 'all' ? recipes : recipes.filter(r => r.category === category);
  grid.innerHTML = '';
  filtered.forEach(recipe => {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', recipe.title);
    const tagsHtml = recipe.tags.slice(0, 4).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    const n = recipe.nutrition;
    const newBadge = recipe.isNew ? '<span class="new-badge">New</span>' : '';
    const catLabel = CATEGORY_LABELS[recipe.category] || escapeHtml(recipe.category);
    card.innerHTML = `
      <span class="cat-label">${catLabel}</span>
      ${newBadge}
      <h3>${escapeHtml(recipe.title)}</h3>
      <div class="meta">${escapeHtml(recipe.meta)}</div>
      <div class="desc">${escapeHtml(recipe.description)}</div>
      <div class="nut-mini">${n.calories} cal | ${n.protein}g protein | ${n.carbs}g carbs | ${n.fat}g fat</div>
      <div class="tags">${tagsHtml}</div>
    `;
    card.addEventListener('click', () => showRecipe(recipe));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showRecipe(recipe);
      }
    });
    grid.appendChild(card);
  });
}

function showRecipe(recipe) {
  currentRecipe = recipe;
  showView('detail');

  document.getElementById('detail-title').textContent = recipe.title;
  document.getElementById('detail-meta').textContent = recipe.meta;
  document.getElementById('detail-desc').textContent = recipe.description;

  const input = document.getElementById('servings-input');
  input.value = recipe.servings;
  document.getElementById('original-servings').textContent = `(original: ${recipe.servings})`;

  renderIngredients(recipe, recipe.servings);
  renderNutrition(recipe);
  renderInstructions(recipe);
}

function renderIngredients(recipe, newServings) {
  const list = document.getElementById('detail-ingredients');
  list.innerHTML = '';
  const ratio = newServings / recipe.servings;

  recipe.ingredients.forEach(ing => {
    const li = document.createElement('li');
    if (ing.quantity !== null) {
      let scaled = ing.quantity * ratio;
      // Eggs should never go below 1
      if (isEgg(ing.name) && scaled < 1) {
        scaled = 1;
      }
      // Convert to higher unit if appropriate
      const converted = convertToHigherUnit(scaled, ing.unit);
      const display = formatQuantity(converted.quantity);
      li.innerHTML = `<span class="qty">${display}</span> ${escapeHtml(converted.unit)} ${escapeHtml(ing.name)}`;
    } else {
      li.textContent = ing.original;
    }
    list.appendChild(li);
  });
}

function renderNutrition(recipe) {
  const n = recipe.nutrition;
  document.getElementById('nut-cal').textContent = n.calories;
  document.getElementById('nut-pro').textContent = n.protein + 'g';
  document.getElementById('nut-carb').textContent = n.carbs + 'g';
  document.getElementById('nut-fat').textContent = n.fat + 'g';
}

function renderInstructions(recipe) {
  const list = document.getElementById('detail-instructions');
  list.innerHTML = '';
  recipe.instructions.forEach(step => {
    const li = document.createElement('li');
    li.textContent = step;
    list.appendChild(li);
  });
}

function formatQuantity(n) {
  if (n === 0) return '0';
  const whole = Math.floor(n);
  const frac = n - whole;

  const fractions = [
    [0.125, '1/8'], [0.25, '1/4'], [0.333, '1/3'], [0.5, '1/2'],
    [0.667, '2/3'], [0.75, '3/4']
  ];

  let fracStr = '';
  if (frac > 0.05) {
    let closest = '';
    let minDiff = 1;
    for (const [val, str] of fractions) {
      const diff = Math.abs(frac - val);
      if (diff < minDiff) { minDiff = diff; closest = str; }
    }
    fracStr = minDiff < 0.08 ? closest : '';
  }

  if (whole === 0) return fracStr || n.toFixed(1);
  return fracStr ? `${whole} ${fracStr}` : `${whole}`;
}

// Check if an ingredient is an egg
function isEgg(name) {
  return /\beggs?\b/i.test(name);
}

// Unit conversion: promote to higher units when appropriate
// Conversion chain: teaspoon -> tablespoon -> cup
function normalizeUnit(unit) {
  const u = unit.toLowerCase().trim();
  if (['teaspoon', 'teaspoons', 'tsp'].includes(u)) return 'tsp';
  if (['tablespoon', 'tablespoons', 'tbsp'].includes(u)) return 'tbsp';
  if (['cup', 'cups'].includes(u)) return 'cup';
  return u;
}

function convertToHigherUnit(quantity, unit) {
  const norm = normalizeUnit(unit);

  // tsp -> tbsp (3 tsp = 1 tbsp)
  if (norm === 'tsp' && quantity >= 3) {
    const inTbsp = quantity / 3;
    if (Math.abs(inTbsp - Math.round(inTbsp * 4) / 4) < 0.05) {
      return convertToHigherUnit(inTbsp, 'tablespoon');
    }
  }

  // tbsp -> cup (16 tbsp = 1 cup)
  if (norm === 'tbsp' && quantity >= 4) {
    const inCups = quantity / 16;
    if (Math.abs(inCups - Math.round(inCups * 4) / 4) < 0.05) {
      return { quantity: Math.round(inCups * 4) / 4, unit: 'cup' };
    }
  }

  return { quantity, unit };
}

// Servings controls
document.getElementById('serv-minus').addEventListener('click', () => adjustServings(-1));
document.getElementById('serv-plus').addEventListener('click', () => adjustServings(1));
document.getElementById('servings-input').addEventListener('change', (e) => {
  const val = Math.max(1, Math.min(50, parseInt(e.target.value) || 1));
  e.target.value = val;
  if (currentRecipe) {
    renderIngredients(currentRecipe, val);
    renderNutrition(currentRecipe);
  }
});

function adjustServings(delta) {
  const input = document.getElementById('servings-input');
  const val = Math.max(1, Math.min(50, parseInt(input.value) + delta));
  input.value = val;
  if (currentRecipe) {
    renderIngredients(currentRecipe, val);
    renderNutrition(currentRecipe);
  }
}

// Shopping list
document.getElementById('add-to-list-btn').addEventListener('click', () => {
  if (!currentRecipe) return;
  const servings = parseInt(document.getElementById('servings-input').value);
  const existing = shoppingList.find(s => s.recipe.slug === currentRecipe.slug);
  if (existing) {
    existing.servings = servings;
  } else {
    shoppingList.push({ recipe: currentRecipe, servings });
  }
  updateShoppingCount();
  const btn = document.getElementById('add-to-list-btn');
  btn.textContent = 'Added!';
  setTimeout(() => { btn.textContent = '+ Shopping List'; }, 1000);
});

shoppingToggle.addEventListener('click', () => {
  if (shoppingPanel.classList.contains('hidden')) {
    showView('shopping');
    renderShoppingList();
  } else {
    showView('grid');
    renderGrid(getActiveCategory());
  }
});

document.getElementById('back-btn').addEventListener('click', () => {
  showView('grid');
  renderGrid(getActiveCategory());
});

document.getElementById('clear-list-btn').addEventListener('click', () => {
  shoppingList = [];
  updateShoppingCount();
  renderShoppingList();
});

document.getElementById('copy-list-btn').addEventListener('click', () => {
  const items = aggregateIngredients();
  const text = items.map(i => {
    if (i.quantity) {
      const converted = convertToHigherUnit(i.quantity, i.unit);
      return `${formatQuantity(converted.quantity)} ${converted.unit} ${i.name}`;
    }
    return i.name;
  }).join('\n');

  const header = 'Shopping List\n' + shoppingList.map(s => `- ${s.recipe.title} (${s.servings} servings)`).join('\n') + '\n\n';
  const btn = document.getElementById('copy-list-btn');
  navigator.clipboard.writeText(header + text)
    .then(() => {
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    })
    .catch(() => {
      btn.textContent = 'Failed';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
});

function renderShoppingList() {
  const recipesDiv = document.getElementById('shopping-recipes');
  recipesDiv.innerHTML = '';
  shoppingList.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'shop-recipe';
    div.innerHTML = `<span>${escapeHtml(item.recipe.title)} (${item.servings} servings)</span>
      <button class="remove-btn" data-idx="${idx}">Remove</button>`;
    recipesDiv.appendChild(div);
  });

  recipesDiv.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      shoppingList.splice(parseInt(e.target.dataset.idx), 1);
      updateShoppingCount();
      renderShoppingList();
    });
  });

  const itemsList = document.getElementById('shopping-items');
  itemsList.innerHTML = '';
  const aggregated = aggregateIngredients();
  aggregated.forEach(item => {
    const li = document.createElement('li');
    if (item.quantity) {
      const converted = convertToHigherUnit(item.quantity, item.unit);
      li.innerHTML = `<span class="qty">${formatQuantity(converted.quantity)}</span> ${escapeHtml(converted.unit)} ${escapeHtml(item.name)}`;
    } else {
      li.textContent = item.name;
    }
    itemsList.appendChild(li);
  });
}

function aggregateIngredients() {
  const map = new Map(); // key: normalized name+unit -> { quantity, unit, name }

  shoppingList.forEach(({ recipe, servings }) => {
    const ratio = servings / recipe.servings;
    recipe.ingredients.forEach(ing => {
      if (ing.quantity === null) {
        const key = ing.name.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, { quantity: null, unit: '', name: ing.name });
        }
        return;
      }

      const key = (ing.name.toLowerCase().trim() + '|' + ing.unit.toLowerCase()).trim();
      const scaled = ing.quantity * ratio;
      if (map.has(key)) {
        map.get(key).quantity += scaled;
      } else {
        map.set(key, { quantity: scaled, unit: ing.unit, name: ing.name });
      }
    });
  });

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function updateShoppingCount() {
  shoppingCount.textContent = shoppingList.length;
}

function showView(view) {
  grid.classList.toggle('hidden', view !== 'grid');
  detail.classList.toggle('hidden', view !== 'detail');
  shoppingPanel.classList.toggle('hidden', view !== 'shopping');
  nav.classList.toggle('hidden', view === 'shopping');
}

function getActiveCategory() {
  const active = nav.querySelector('.cat-btn.active');
  return active ? active.dataset.cat : 'all';
}
