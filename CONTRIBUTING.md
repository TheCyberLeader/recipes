# Maintenance Guide — Marie's Recipe Webapp 🌿

This is a personal project maintained solely by Marie. This guide documents the workflow and conventions I follow when making updates — for my own reference and consistency.

---

## Development Workflow

### 1. Issue Tracking

All changes should have a corresponding GitHub Issue created **before** work begins — bug fixes, new recipes, webapp features, refactors, and documentation updates all count.

Reference the issue number in every commit message:
```
fix: correct ingredient amounts in chicken kabobs (#3)
feat: add print-friendly view to webapp (#7)
recipe: add Lebanese garlic sauce (#11)
docs: update contributing guide (#14)
refactor: extract nutrition calculator to module (#18)
chore: update dependencies (#21)
```

**Commit type prefixes:**

| Prefix | Use for |
|---|---|
| `feat` | New webapp feature |
| `fix` | Bug fix |
| `recipe` | Adding or updating a recipe |
| `docs` | Documentation changes |
| `refactor` | Code restructuring without behavior change |
| `style` | CSS / visual changes |
| `chore` | Dependency updates, config, tooling |

---

### 2. Committing to Main

Small, low-risk changes can be committed directly to `main` with a clear, descriptive commit message:

- Recipe additions or corrections
- Typo and formatting fixes
- Minor CSS tweaks
- Documentation updates

---

### 3. Feature Branches and Pull Requests

Large or risky changes **must** use a feature branch and go through a Pull Request before merging to `main`:

- New webapp features (shopping list, nutrition display, servings scaler)
- JavaScript refactors or architecture changes
- Changes to how recipe data is parsed or loaded
- Any change touching multiple files at once

---

### 4. Branch Naming Conventions

| Prefix | Use for |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `recipe/` | Adding or editing recipes |
| `docs/` | Documentation changes |
| `refactor/` | Code restructuring without behavior changes |
| `style/` | Visual / CSS changes |

**Examples:**
- `feature/shopping-list-export`
- `fix/servings-scaler-rounding`
- `recipe/add-hummus`
- `docs/readme-update`
- `refactor/nutrition-calculator`

---

### 5. Adding a New Recipe

All recipes live in category folders (`chicken/`, `beef/`, `seafood/`, etc.) as Markdown files.

**Template to follow for consistency:**
```markdown
# Recipe Name

**Serves:** X | **Prep Time:** X min | **Cook Time:** X min

## Description
Brief description of the dish.

## Ingredients
- Ingredient with measurement
- Ingredient with measurement

## Instructions
1. Step one
2. Step two

## Notes
- Tips, substitutions, or storage instructions

## Tags
`#category` `#cuisine` `#cooking-method` `#dietary`
```

**Before adding a recipe:**
1. Open an Issue: `recipe: add [recipe name]`
2. Place the file in the correct category folder
3. Use kebab-case for filenames: `garlic-roasted-chicken.md`
4. Add the recipe to `README.md` under the right category section
5. Run `node scripts/build-recipes.js` to rebuild `recipes.json`
6. Verify the webapp picks it up correctly before pushing

---

### 6. Webapp Changes (docs/ folder)

The webapp lives in `docs/` and is served via GitHub Pages. Changes here affect what users see at [thecyberleader.github.io/recipes](https://thecyberleader.github.io/recipes/).

**Before changing webapp code:**
- Open an Issue describing the change
- For anything beyond a small fix, use a feature branch
- Test locally by opening `docs/index.html` in a browser before pushing
- Check that existing recipes still load and display correctly

**Known sensitive areas:**
- Any code that reads or parses recipe Markdown should include input validation
- The servings scaler relies on ingredient parsing — test edge cases with fractions and ranges (e.g., `1-2 cups`, `¼ tsp`)
- Nutrition data is estimated — do not display it as medically authoritative

---

### 7. Security Considerations

- **No API keys or credentials** should ever be committed to this repo
- **innerHTML usage**: The webapp uses `escapeHtml()` before injecting recipe data — always maintain this when adding new innerHTML calls
- **Dependencies**: If adding npm or Python packages, document why and pin to a specific version

---

### 8. AI-Assisted Development

When using Claude Code (or any AI tool) on this project, the tool must always:

- Show new files **before** creating them
- Show replacements **before** applying them
- Show the plan **before** executing it
- Convert or refactor **one file at a time**, showing each change before applying
- **Never apply multiple changes in bulk** without review
- Create GitHub Issues for all changes
- Use branches for large changes

**No change should be applied to the codebase without the developer reviewing and explicitly approving it first.** This applies to all operations — creates, edits, deletes, and refactors.

---

### 9. Pre-Publishing Checks

Before pushing any webapp changes:

- [ ] Run `node scripts/build-recipes.js` to rebuild `recipes.json`
- [ ] Open `docs/index.html` locally and verify recipes load
- [ ] Test the servings scaler on at least one recipe
- [ ] Confirm no broken links in the recipe you added or edited
- [ ] Check that `README.md` is updated if you added a recipe

---

**Happy Cooking! 🍳**
