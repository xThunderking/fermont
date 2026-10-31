import assert from 'node:assert/strict'
import test from 'node:test'
import { SERVICE_ICONS, createDefaultServiceCategories, getVisibleServiceCategories, moveCatalogEntry, normalizeServiceCategoryIcons, validateServiceCategories } from '../src/constants/websiteServices.js'

test('the initial catalog preserves all 18 services, category order, and independent copies', () => {
  const first = createDefaultServiceCategories()
  const second = createDefaultServiceCategories()
  assert.deepEqual(first.map(({ items }) => items.length), [13, 2, 3])
  assert.equal(validateServiceCategories(first), '')
  first[0].items[0].title = 'Changed'
  assert.equal(second[0].items[0].title, 'Facial Esencial')
})

test('public counts exclude hidden services, hidden categories and empty categories', () => {
  const categories = createDefaultServiceCategories()
  categories[0].items[0].visible = false
  categories[1].visible = false
  categories[2].items = []
  const visible = getVisibleServiceCategories(categories)
  assert.equal(visible.length, 1)
  assert.equal(visible[0].items.length, 12)
  assert.equal(categories[0].items.length, 13)
  assert.deepEqual(getVisibleServiceCategories([]), [])
})

test('categories and services can be reordered without mutating or losing data', () => {
  const categories = createDefaultServiceCategories()
  const moved = moveCatalogEntry(categories, categories[2].id, -1)
  assert.deepEqual(moved.map(({ id }) => id), ['faciales', 'ritual-renovador', 'corporales'])
  assert.equal(categories[1].id, 'corporales')
  assert.strictEqual(moveCatalogEntry(categories, categories[0].id, -1), categories)
  assert.strictEqual(moveCatalogEntry(categories, 'missing', 1), categories)
  const items = categories[0].items
  assert.equal(moveCatalogEntry(items, items[0].id, 1)[1].title, items[0].title)
})

test('empty published catalogs are valid but duplicate ids, blank names and invalid styles are rejected', () => {
  assert.equal(validateServiceCategories([]), '')
  for (const alter of [
    (categories) => categories.push(categories[0]),
    (categories) => { categories[0].kicker = '  ' },
    (categories) => { categories[0].accent = 'url(unsafe)' },
    (categories) => { categories[0].items[0].description = '' },
    (categories) => { categories[0].items[0].icon = 'unsupported' },
    (categories) => categories[0].items.push(categories[0].items[0]),
    (categories) => { categories[0].id = 'invalid/route' },
  ]) {
    const categories = createDefaultServiceCategories()
    alter(categories)
    assert.notEqual(validateServiceCategories(categories), '')
  }
})

test('catalog limits reject oversized content before saving to Firestore', () => {
  const categories = createDefaultServiceCategories()
  const item = categories[0].items[0]
  categories[0].items = Array.from({ length: 201 }, (_, index) => ({ ...item, id: `item-${index}` }))
  assert.match(validateServiceCategories(categories), /200/)
  assert.match(validateServiceCategories(Array(41).fill(categories[0])), /40/)
})

test('retiring salon icons preserves previously saved categories and services', () => {
  const original = createDefaultServiceCategories()
  original[0].icon = 'scissors'
  original[0].items[0].icon = 'foot'
  original[1].icon = 'comb'
  const normalized = normalizeServiceCategoryIcons(original)
  assert.equal(validateServiceCategories(normalized), '')
  assert.equal(normalized[0].icon, 'sparkles')
  assert.equal(normalized[0].items[0].icon, 'body')
  assert.equal(normalized[1].icon, 'hair-straightener')
  assert.equal(normalized[0].items.length, original[0].items.length)
  assert.equal(original[0].icon, 'scissors')
  assert.equal(original[0].items[0].icon, 'foot')
  assert.equal(normalizeServiceCategoryIcons(null), null)
  assert.ok(!SERVICE_ICONS.some(({ value }) => ['scissors', 'foot', 'comb', 'hand'].includes(value)))
  assert.ok(SERVICE_ICONS.some(({ value }) => value === 'hair-straightener'))
})
