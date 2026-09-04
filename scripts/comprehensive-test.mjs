/**
 * Comprehensive End-to-End Test Suite
 * Asad's Collection — E-commerce Upgrade
 *
 * Tests ALL features from both customer and admin perspectives:
 *   Phase 1: Customer-side public endpoints
 *   Phase 2: Admin auth (login, rejection)
 *   Phase 3: Category CRUD (admin)
 *   Phase 4: Variant Product CRUD (admin)
 *   Phase 5: Cart & Order flow with server-side price validation
 *   Phase 6: Variant helper logic (unit-style)
 *   Phase 7: Validation tests (negative cases)
 *   Phase 8: Backward compatibility with legacy products
 *   Cleanup: remove all test data
 */

import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import fs from "fs";
import { spawn, execSync } from "child_process";

const BASE = "http://127.0.0.1:3000";
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "asads_collection";

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set");
  process.exit(1);
}

// Test results tracking
const results = { pass: 0, fail: 0, skipped: 0 };
const failures = [];
function pass(name) {
  results.pass++;
  console.log(`  ✅ ${name}`);
}
function fail(name, reason) {
  results.fail++;
  failures.push({ name, reason });
  console.log(`  ❌ ${name}`);
  console.log(`     ${reason}`);
}
function skip(name, reason) {
  results.skipped++;
  console.log(`  ⏭️  ${name} (skipped: ${reason})`);
}
function section(title) {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(70)}`);
}

// HTTP helper with cookie jar
const cookieJar = {};
async function http(method, path, body, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (body) headers["Content-Type"] = "application/json";
  const cookieStr = Object.entries(cookieJar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  if (cookieStr) headers.Cookie = cookieStr;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      redirect: opts.redirect || "manual",
    });
    // Capture Set-Cookie
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/([^=]+)=([^;]+)/);
      if (match) cookieJar[match[1]] = match[2];
    }
    let json = null;
    const text = await res.text();
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, json, text, headers: res.headers };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

// Direct DB access for verification
let dbClient, db;
async function getDb() {
  if (!dbClient) {
    dbClient = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    await dbClient.connect();
    db = dbClient.db(MONGODB_DB);
  }
  return db;
}

// ============================================================
// PHASE 1: Customer-side public endpoints
// ============================================================
async function phase1_customerPublic() {
  section("PHASE 1: Customer-side public endpoints");

  // 1.1 Home page renders
  let r = await http("GET", "/");
  if (r.status === 200) pass("1.1 Home page returns 200");
  else fail("1.1 Home page returns 200", `got ${r.status}`);

  // 1.2 Home page contains dynamic categories
  if (r.text && r.text.includes("Rain Coats") && r.text.includes("Bike Covers"))
    pass("1.2 Home page renders dynamic categories");
  else fail("1.2 Home page renders dynamic categories", "category names not found in HTML");

  // 1.3 Shop page renders
  r = await http("GET", "/shop");
  if (r.status === 200) pass("1.3 Shop page returns 200");
  else fail("1.3 Shop page returns 200", `got ${r.status}`);

  // 1.4 Shop page contains product data
  if (r.text && r.text.includes("Premium Waterproof"))
    pass("1.4 Shop page renders products");
  else fail("1.4 Shop page renders products", "product names not found");

  // 1.5 GET /api/categories returns active categories
  r = await http("GET", "/api/categories");
  if (r.status === 200 && Array.isArray(r.json?.categories) && r.json.categories.length >= 4)
    pass(`1.5 /api/categories returns ${r.json.categories.length} active categories`);
  else fail("1.5 /api/categories returns active categories", `got status ${r.status}, body: ${JSON.stringify(r.json)?.slice(0, 200)}`);

  // 1.6 Categories have correct shape
  const cat = r.json?.categories?.[0];
  if (cat && cat.id && cat.name?.en && cat.slug && typeof cat.active === "boolean")
    pass("1.6 Category object has correct shape (id, name.en, slug, active)");
  else fail("1.6 Category object has correct shape", `got: ${JSON.stringify(cat)?.slice(0, 200)}`);

  // 1.7 Product detail page renders
  r = await http("GET", "/product/premium-waterproof-rain-suit");
  if (r.status === 200) pass("1.7 Product detail page returns 200");
  else fail("1.7 Product detail page returns 200", `got ${r.status}`);

  // 1.8 Product page has JSON-LD structured data
  if (r.text && r.text.includes('"@type":"Product"') && r.text.includes('"@context":"https://schema.org"'))
    pass("1.8 Product page has schema.org JSON-LD");
  else fail("1.8 Product page has schema.org JSON-LD", "structured data not found");

  // 1.9 Non-existent product → 404
  r = await http("GET", "/product/does-not-exist-12345");
  if (r.status === 404) pass("1.9 Non-existent product returns 404");
  else fail("1.9 Non-existent product returns 404", `got ${r.status}`);

  // 1.10 Order tracking with missing params → 400
  r = await http("GET", "/api/orders");
  if (r.status === 400) pass("1.10 Order tracking without params returns 400");
  else fail("1.10 Order tracking without params returns 400", `got ${r.status}`);

  // 1.11 Order tracking with non-existent order → 404
  r = await http("GET", "/api/orders?orderNumber=FAKE-0000-0000&phone=03000000000");
  if (r.status === 404) pass("1.11 Non-existent order tracking returns 404");
  else fail("1.11 Non-existent order tracking returns 404", `got ${r.status}`);

  // 1.12 Cart page renders
  r = await http("GET", "/cart");
  if (r.status === 200) pass("1.12 Cart page returns 200");
  else fail("1.12 Cart page returns 200", `got ${r.status}`);

  // 1.13 Checkout page renders
  r = await http("GET", "/checkout");
  if (r.status === 200) pass("1.13 Checkout page returns 200");
  else fail("1.13 Checkout page returns 200", `got ${r.status}`);
}

// ============================================================
// PHASE 2: Admin auth
// ============================================================
async function phase2_adminAuth() {
  section("PHASE 2: Admin authentication");

  // 2.1 Admin API without cookie → 401
  Object.keys(cookieJar).forEach(k => delete cookieJar[k]);
  let r = await http("GET", "/api/admin/categories");
  if (r.status === 401) pass("2.1 Admin API without cookie returns 401");
  else fail("2.1 Admin API without cookie returns 401", `got ${r.status}`);

  // 2.2 Admin products API without cookie → 401
  r = await http("GET", "/api/admin/products");
  if (r.status === 401) pass("2.2 Admin products API without cookie returns 401");
  else fail("2.2 Admin products API without cookie returns 401", `got ${r.status}`);

  // 2.3 Login with wrong password → 401
  r = await http("POST", "/api/admin/auth/login", {
    email: "asadafri386@gmail.com",
    password: "definitely-wrong-password-xyz",
  });
  if (r.status === 401) pass("2.3 Login with wrong password returns 401");
  else fail("2.3 Login with wrong password returns 401", `got ${r.status}`);

  // 2.4 Login with correct password → 200 + cookie
  // We'll try the known test password (set during test setup)
  r = await http("POST", "/api/admin/auth/login", {
    email: "asadafri386@gmail.com",
    password: "Test@12345",
  });
  if (r.status === 200 && cookieJar.asad_admin_session)
    pass("2.4 Login with correct password returns 200 + session cookie");
  else {
    fail("2.4 Login with correct password returns 200 + session cookie", `got ${r.status}, cookie: ${!!cookieJar.asad_admin_session}`);
    return false;
  }

  // 2.5 Admin API with cookie → 200
  r = await http("GET", "/api/admin/categories");
  if (r.status === 200) pass("2.5 Admin categories API with cookie returns 200");
  else fail("2.5 Admin categories API with cookie returns 200", `got ${r.status}`);

  return true;
}

// ============================================================
// PHASE 3: Category CRUD
// ============================================================
async function phase3_categoryCrud() {
  section("PHASE 3: Category CRUD (admin)");

  const testSlug = `test-cat-${Date.now()}`;
  let createdId;

  // 3.1 Create category
  let r = await http("POST", "/api/admin/categories", {
    nameEn: "Test Perfumes",
    nameUr: "ٹیسٹ پرفیوم",
    slug: testSlug,
    descEn: "Test category for E2E testing",
    descUr: "ٹیسٹ کیٹیگری",
    active: true,
  });
  if (r.status === 201 && r.json?.category?.id) {
    createdId = r.json.category.id;
    pass(`3.1 Create category → 201 (id: ${createdId.slice(0, 8)}…)`);
  } else {
    fail("3.1 Create category → 201", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);
    return;
  }

  // 3.2 Verify it appears in public /api/categories
  r = await http("GET", "/api/categories");
  const found = r.json?.categories?.find(c => c.slug === testSlug);
  if (found) pass("3.2 New category appears in public /api/categories immediately");
  else fail("3.2 New category appears in public /api/categories", "not found in public list");

  // 3.3 GET single category
  r = await http("GET", `/api/admin/categories/${createdId}`);
  if (r.status === 200 && r.json?.category?.id === createdId)
    pass("3.3 GET /api/admin/categories/[id] returns category");
  else fail("3.3 GET single category", `got ${r.status}`);

  // 3.4 Update category — send explicit slug to keep it unchanged
  r = await http("PUT", `/api/admin/categories/${createdId}`, {
    nameEn: "Test Perfumes Premium",
    slug: testSlug, // keep the same slug so 3.5 can test duplicate rejection
    descEn: "Updated description",
  });
  if (r.status === 200 && r.json?.category?.name?.en === "Test Perfumes Premium")
    pass("3.4 Update category → name changed");
  else fail("3.4 Update category", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);

  // 3.5 Duplicate slug → 400 (or 500 with friendly message)
  r = await http("POST", "/api/admin/categories", {
    nameEn: "Duplicate Test",
    slug: testSlug, // same slug as above — should be rejected
  });
  if (r.status >= 400 && r.json?.error?.toLowerCase().includes("slug"))
    pass("3.5 Duplicate category slug rejected");
  else fail("3.5 Duplicate category slug rejected", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);

  // 3.6 Delete empty category → 200
  r = await http("DELETE", `/api/admin/categories/${createdId}`);
  if (r.status === 200) pass("3.6 Delete empty category → 200");
  else fail("3.6 Delete empty category", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);

  // 3.7 Verify deleted category no longer in public list
  r = await http("GET", "/api/categories");
  const stillThere = r.json?.categories?.find(c => c.slug === testSlug);
  if (!stillThere) pass("3.7 Deleted category no longer in public list");
  else fail("3.7 Deleted category removed from public list", "still present");

  // 3.8 Legacy category rename — products with ONLY legacy `category` slug
  // (no categoryId) must be migrated to the new slug AND backfilled with
  // the categoryId, so they don't point at a slug that no longer exists.
  {
    const db = await getDb();
    const renameCatSlug = `e2e-rename-${Date.now()}`;
    const newSlugAfterRename = `e2e-renamed-${Date.now()}`;
    // Create a category
    const catRes = await http("POST", "/api/admin/categories", {
      nameEn: "E2E Rename Cat",
      slug: renameCatSlug,
      active: true,
    });
    const renameCatId = catRes.json?.category?.id;
    if (!renameCatId) {
      fail("3.8 Legacy rename setup", "could not create category");
      return;
    }
    // Insert a LEGACY product directly into MongoDB with ONLY the `category`
    // slug (no categoryId), simulating an old product from before the
    // categoryId field existed.
    const legacyProductId = `e2e-legacy-${Date.now()}`;
    await db.collection("products").insertOne({
      id: legacyProductId,
      slug: legacyProductId,
      sku: "E2E-LEGACY",
      name: { en: "E2E Legacy Product", ur: "" },
      category: renameCatSlug, // legacy slug only — NO categoryId
      shortDescription: { en: "Legacy", ur: "" },
      description: { en: "Legacy", ur: "" },
      features: [],
      price: 1500,
      images: [],
      variants: [],
      stock: 5,
      rating: 0,
      reviewCount: 0,
      reviews: [],
      isFeatured: false,
      createdAt: new Date().toISOString(),
    });
    // Rename the category (change its slug) via the admin API.
    const renameRes = await http("PUT", `/api/admin/categories/${renameCatId}`, {
      nameEn: "E2E Rename Cat Updated",
      slug: newSlugAfterRename,
    });
    if (renameRes.status !== 200) {
      fail("3.8 Legacy category rename", `rename got ${renameRes.status}`);
      await db.collection("products").deleteOne({ id: legacyProductId });
      await http("DELETE", `/api/admin/categories/${renameCatId}`);
      return;
    }
    // Fetch the legacy product and verify BOTH fields were updated.
    const legacyAfter = await db.collection("products").findOne({ id: legacyProductId });
    if (
      legacyAfter &&
      legacyAfter.category === newSlugAfterRename && // legacy slug updated
      legacyAfter.categoryId === renameCatId           // categoryId backfilled
    ) {
      pass(`3.8 Legacy category rename → product migrated: category="${legacyAfter.category}", categoryId=${legacyAfter.categoryId ? "backfilled" : "MISSING"}`);
    } else {
      fail("3.8 Legacy category rename sync", `category="${legacyAfter?.category}" (expected "${newSlugAfterRename}"), categoryId="${legacyAfter?.categoryId}" (expected "${renameCatId}")`);
    }
    // Cleanup
    await db.collection("products").deleteOne({ id: legacyProductId });
    await http("DELETE", `/api/admin/categories/${renameCatId}`);
  }
}

// ============================================================
// PHASE 4: Variant Product CRUD
// ============================================================
async function phase4_variantProductCrud() {
  section("PHASE 4: Variant Product CRUD (admin)");

  // 4.1 Create a test category for the product
  let r = await http("POST", "/api/admin/categories", {
    nameEn: "E2E Test Category",
    slug: `e2e-test-${Date.now()}`,
    active: true,
  });
  if (r.status !== 201) {
    fail("4.1 Setup: create test category", `got ${r.status}`);
    return;
  }
  const categoryId = r.json.category.id;
  const categorySlug = r.json.category.slug;
  pass(`4.1 Setup: created test category (id: ${categoryId.slice(0, 8)}…)`);

  // 4.2 Create variant product
  const productSlug = `e2e-variant-product-${Date.now()}`;
  r = await http("POST", "/api/admin/products", {
    name: { en: "E2E Test Perfume", ur: "ٹیسٹ پرفیوم" },
    slug: productSlug,
    sku: "E2E-PERF-001",
    categoryId,
    shortDescription: { en: "Test perfume with variants", ur: "ٹیسٹ" },
    description: { en: "Full description for test perfume", ur: "ٹیسٹ" },
    price: 2000, // base price (min of variants)
    compareAtPrice: 2500,
    images: ["/images/rain-suit.jpeg"],
    stock: 0, // variants own their stock
    isFeatured: false,
    variants: [
      {
        id: crypto.randomUUID(),
        label: "30ml",
        options: { Volume: "30ml" },
        price: 2000,
        compareAtPrice: 2500,
        stock: 20,
        sku: "E2E-30ML",
        images: ["/images/rain-suit.jpeg"],
        active: true,
      },
      {
        id: crypto.randomUUID(),
        label: "50ml",
        options: { Volume: "50ml" },
        price: 2800,
        compareAtPrice: 3200,
        stock: 15,
        sku: "E2E-50ML",
        images: ["/images/bike-cover.jpeg"],
        active: true,
      },
      {
        id: crypto.randomUUID(),
        label: "100ml",
        options: { Volume: "100ml" },
        price: 4500,
        compareAtPrice: 5000,
        stock: 5,
        sku: "E2E-100ML",
        images: ["/images/car-cover.jpeg"],
        active: true,
      },
      // Zero-stock variant — must be rejected at checkout.
      {
        id: crypto.randomUUID(),
        label: "200ml",
        options: { Volume: "200ml" },
        price: 8000,
        stock: 0,
        sku: "E2E-200ML",
        images: [],
        active: true,
      },
      // Inactive variant — must be rejected at checkout even if its id is submitted.
      {
        id: crypto.randomUUID(),
        label: "300ml",
        options: { Volume: "300ml" },
        price: 12000,
        stock: 99,
        sku: "E2E-300ML",
        images: [],
        active: false,
      },
    ],
    features: [{ en: "Long-lasting", ur: "لمبا" }],
  });
  if (r.status === 201 && r.json?.product?.id) {
    pass(`4.2 Create variant product → 201 (5 variants: 30ml/50ml/100ml/200ml-zero/300ml-inactive)`);
  } else {
    fail("4.2 Create variant product", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 300)}`);
    // cleanup
    await http("DELETE", `/api/admin/categories/${categoryId}`);
    return null;
  }
  const productId = r.json.product.id;

  // 4.3 GET product by slug → verify variants present
  r = await http("GET", `/api/admin/products/${productId}`);
  if (r.status === 200 && r.json?.product?.variants?.length === 5)
    pass("4.3 GET product → has 5 variants");
  else {
    fail("4.3 GET product → has 5 variants", `got ${r.status}, variants: ${r.json?.product?.variants?.length}`);
  }

  // 4.4 Verify product appears in admin list
  r = await http("GET", "/api/admin/products");
  const found = r.json?.products?.find(p => p.id === productId);
  if (found) pass("4.4 Variant product appears in admin product list");
  else fail("4.4 Variant product in admin list", "not found");

  // 4.5 Verify product appears on public shop page
  r = await http("GET", "/shop");
  if (r.text && r.text.includes("E2E Test Perfume"))
    pass("4.5 Variant product appears on public shop page");
  else fail("4.5 Variant product on shop page", "product name not in HTML");

  // 4.6 Verify product detail page renders with gallery
  r = await http("GET", `/product/${productSlug}`);
  if (r.status === 200)
    pass("4.6 Variant product detail page renders");
  else fail("4.6 Variant product detail page renders", `got ${r.status}`);

  // 4.7 Verify AggregateOffer in JSON-LD
  if (r.text && r.text.includes('"@type":"AggregateOffer"') && r.text.includes('"lowPrice":2000'))
    pass("4.7 Variant product has AggregateOffer schema (lowPrice=2000)");
  else fail("4.7 AggregateOffer schema", "not found in HTML");

  // 4.8 Update product — add a 6th variant
  r = await http("GET", `/api/admin/products/${productId}`);
  const current = r.json?.product;
  if (current) {
    const updatedVariants = [
      ...current.variants,
      {
        id: crypto.randomUUID(),
        label: "150ml",
        options: { Volume: "150ml" },
        price: 6000,
        stock: 3,
        sku: "E2E-150ML",
        images: [],
        active: true,
      },
    ];
    r = await http("PUT", `/api/admin/products/${productId}`, { variants: updatedVariants });
    if (r.status === 200 && r.json?.product?.variants?.length === 6)
      pass("4.8 Update product → added 6th variant (150ml=6000)");
    else fail("4.8 Update product with 6th variant", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);
  }

  // 4.9 Duplicate variant option combination → rejected
  r = await http("GET", `/api/admin/products/${productId}`);
  const curr2 = r.json?.product;
  if (curr2) {
    const dupVariants = [
      ...curr2.variants,
      {
        id: crypto.randomUUID(),
        label: "Dup",
        options: { Volume: "30ml" }, // SAME as variant 1
        price: 999,
        stock: 1,
        active: true,
      },
    ];
    r = await http("PUT", `/api/admin/products/${productId}`, { variants: dupVariants });
    if (r.status >= 400 && r.json?.error?.toLowerCase().includes("duplicate"))
      pass("4.9 Duplicate variant option combination rejected");
    else fail("4.9 Duplicate variant combo rejected", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);
  }

  return { productId, categoryId, categorySlug, productSlug };
}

// ============================================================
// PHASE 5: Cart & Order flow with server-side price validation
// ============================================================
async function phase5_orderFlow(testCtx) {
  section("PHASE 5: Cart & Order flow + server-side price validation");

  // Fetch the product to get variant IDs
  let r = await http("GET", `/api/admin/products/${testCtx.productId}`);
  const product = r.json?.product;
  if (!product || !product.variants?.length) {
    fail("5.0 Setup: fetch variant product", "could not load");
    return;
  }
  const variant30 = product.variants.find(v => v.label === "30ml");
  const variant50 = product.variants.find(v => v.label === "50ml");
  const variant100 = product.variants.find(v => v.label === "100ml");
  const variantZeroStock = product.variants.find(v => v.label === "200ml"); // stock=0
  const variantInactive = product.variants.find(v => v.label === "300ml"); // active=false

  const customer = {
    fullName: "E2E Test Customer",
    email: "e2e@test.com",
    phone: "0300-1234567",
    city: "Lahore",
    address: "123 Test Street, Test Town",
    province: "Punjab",
    postalCode: "54000",
    note: "E2E test order",
  };

  // 5.1 Legit order with variant item → 201, price matches DB
  r = await http("POST", "/api/orders", {
    items: [{
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price: 2000, // matches variant 30ml price
      variantId: variant30.id,
      variantLabel: "30ml",
      selectedOptions: { Volume: "30ml" },
      variantSku: variant30.sku,
      quantity: 2,
    }],
    customer,
  });
  if (r.status === 201 && r.json?.order?.id) {
    const stored = r.json.order;
    const storedItem = stored.items[0];
    if (storedItem.price === 2000 && storedItem.variantId === variant30.id)
      pass(`5.1 Legit order → 201 (30ml × 2 = ${stored.subtotal})`);
    else
      fail("5.1 Legit order price matches", `expected 2000, got ${storedItem.price}`);
  } else {
    fail("5.1 Legit order → 201", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 300)}`);
  }
  const orderId1 = r.json?.order?.id;
  const orderNumber1 = r.json?.order?.orderNumber;

  // 5.2 TAMPERED price — server should overwrite with DB price
  r = await http("POST", "/api/orders", {
    items: [{
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price: 1, // TAMPERED — should be 2800
      variantId: variant50.id,
      variantLabel: "50ml",
      selectedOptions: { Volume: "50ml" },
      variantSku: variant50.sku,
      quantity: 1,
    }],
    customer,
  });
  if (r.status === 201) {
    const storedItem = r.json.order.items[0];
    if (storedItem.price === 2800)
      pass(`5.2 Tampered price (1) → server overwrote to DB price (${storedItem.price})`);
    else
      fail("5.2 Server-side price validation", `expected 2800, got ${storedItem.price} — TAMPERING SUCCEEDED!`);
  } else {
    fail("5.2 Tampered price order", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);
  }

  // 5.3 Order with non-existent variantId → 400
  r = await http("POST", "/api/orders", {
    items: [{
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price: 2000,
      variantId: "non-existent-variant-id",
      variantLabel: "Fake",
      quantity: 1,
    }],
    customer,
  });
  if (r.status === 400)
    pass("5.3 Order with non-existent variantId → 400 rejected");
  else
    fail("5.3 Non-existent variantId rejected", `got ${r.status}`);

  // 5.4 Order with quantity > stock → 400
  r = await http("POST", "/api/orders", {
    items: [{
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price: 4500,
      variantId: variant100.id,
      variantLabel: "100ml",
      selectedOptions: { Volume: "100ml" },
      variantSku: variant100.sku,
      quantity: 999, // way more than stock (5)
    }],
    customer,
  });
  if (r.status === 400 && r.json?.error?.toLowerCase().includes("available"))
    pass("5.4 Order with quantity > stock → 400 rejected");
  else
    fail("5.4 Quantity > stock rejected", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);

  // 5.4a Order with ZERO-STOCK variant → 400 (the bug: stock>0 && qty>stock was false when stock=0)
  if (variantZeroStock) {
    r = await http("POST", "/api/orders", {
      items: [{
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        price: 8000,
        variantId: variantZeroStock.id,
        variantLabel: "200ml",
        selectedOptions: { Volume: "200ml" },
        variantSku: variantZeroStock.sku,
        quantity: 1,
      }],
      customer,
    });
    if (r.status === 400 && r.json?.error?.toLowerCase().includes("stock"))
      pass("5.4a Zero-stock variant → 400 rejected (stock<=0 check works)");
    else
      fail("5.4a Zero-stock variant rejected", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);
  } else {
    skip("5.4a Zero-stock variant test", "no zero-stock variant in test product");
  }

  // 5.4b Order with INACTIVE variant → 400 (must be rejected even if id is valid)
  if (variantInactive) {
    r = await http("POST", "/api/orders", {
      items: [{
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        price: 12000,
        variantId: variantInactive.id,
        variantLabel: "300ml",
        selectedOptions: { Volume: "300ml" },
        variantSku: variantInactive.sku,
        quantity: 1,
      }],
      customer,
    });
    if (r.status === 400 && r.json?.error?.toLowerCase().includes("available"))
      pass("5.4b Inactive variant → 400 rejected (inactive check works)");
    else
      fail("5.4b Inactive variant rejected", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);
  } else {
    skip("5.4b Inactive variant test", "no inactive variant in test product");
  }

  // 5.4c Variant product WITHOUT variantId → 400 (must NOT fall back to product.price)
  r = await http("POST", "/api/orders", {
    items: [{
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price: 1, // tampered — and no variantId provided
      quantity: 1,
    }],
    customer,
  });
  if (r.status === 400 && r.json?.error?.toLowerCase().includes("variant"))
    pass("5.4c Variant product without variantId → 400 (no fallback to product.price)");
  else
    fail("5.4c Variant product without variantId rejected", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);

  // 5.4d ALL variants inactive → reject every purchase (no fallback to product.price)
  // Create a product whose variants are ALL active:false, but product.price
  // and product.stock still have legacy values. Order without variantId AND
  // order with an inactive variantId must both be rejected.
  {
    const allInactiveSlug = `e2e-all-inactive-${Date.now()}`;
    const inactiveCat = await http("POST", "/api/admin/categories", {
      nameEn: "E2E All-Inactive Cat",
      slug: `e2e-allinactive-cat-${Date.now()}`,
      active: true,
    });
    const inactiveCatId = inactiveCat.json?.category?.id;
    const variantIdInactive = crypto.randomUUID();
    const createRes = await http("POST", "/api/admin/products", {
      name: { en: "E2E All-Inactive Product", ur: "ٹیسٹ" },
      slug: allInactiveSlug,
      sku: "E2E-ALLINACT",
      categoryId: inactiveCatId,
      shortDescription: { en: "All variants inactive", ur: "" },
      description: { en: "Test", ur: "" },
      price: 999, // legacy base price — must NOT be used
      stock: 999, // legacy base stock — must NOT be used
      images: [],
      variants: [
        {
          id: variantIdInactive,
          label: "Disabled",
          options: { Type: "Disabled" },
          price: 5000,
          stock: 50,
          active: false, // inactive
        },
      ],
    });
    if (createRes.status === 201) {
      const inactiveProductId = createRes.json.product.id;
      // Attempt 1: order WITHOUT variantId — must be rejected.
      const r1 = await http("POST", "/api/orders", {
        items: [{
          productId: inactiveProductId,
          slug: allInactiveSlug,
          name: { en: "E2E All-Inactive Product", ur: "ٹیسٹ" },
          image: "",
          price: 1, // tampered
          quantity: 1,
        }],
        customer,
      });
      // Attempt 2: order WITH the inactive variantId — must be rejected.
      const r2 = await http("POST", "/api/orders", {
        items: [{
          productId: inactiveProductId,
          slug: allInactiveSlug,
          name: { en: "E2E All-Inactive Product", ur: "ٹیسٹ" },
          image: "",
          price: 5000,
          variantId: variantIdInactive,
          variantLabel: "Disabled",
          quantity: 1,
        }],
        customer,
      });
      if (r1.status === 400 && r2.status === 400)
        pass("5.4d All-variants-inactive → both no-variantId and inactive-variantId rejected (no product.price fallback)");
      else
        fail("5.4d All-variants-inactive rejection", `r1=${r1.status}, r2=${r2.status}`);

      // Cleanup
      await http("DELETE", `/api/admin/products/${inactiveProductId}`);
      await http("DELETE", `/api/admin/categories/${inactiveCatId}`);
    } else {
      fail("5.4d All-variants-inactive setup", `create got ${createRes.status}: ${JSON.stringify(createRes.json)?.slice(0, 200)}`);
    }
  }

  // 5.4e ATOMIC variant stock decrement — Variant A (stock=0) must fail
  // even though Variant B (stock=100) has plenty. This catches the bug
  // where separate dotted conditions could be satisfied by different
  // array elements.
  {
    const atomicSlug = `e2e-atomic-stock-${Date.now()}`;
    const atomicCat = await http("POST", "/api/admin/categories", {
      nameEn: "E2E Atomic Cat",
      slug: `e2e-atomic-cat-${Date.now()}`,
      active: true,
    });
    const atomicCatId = atomicCat.json?.category?.id;
    const variantAId = crypto.randomUUID(); // stock = 0
    const variantBId = crypto.randomUUID(); // stock = 100
    const createRes = await http("POST", "/api/admin/products", {
      name: { en: "E2E Atomic Stock Product", ur: "ٹیسٹ" },
      slug: atomicSlug,
      sku: "E2E-ATOMIC",
      categoryId: atomicCatId,
      shortDescription: { en: "Atomic stock test", ur: "" },
      description: { en: "Test", ur: "" },
      price: 1000,
      stock: 0,
      images: [],
      variants: [
        {
          id: variantAId,
          label: "VariantA",
          options: { Type: "A" },
          price: 1000,
          stock: 0, // ZERO
          active: true,
        },
        {
          id: variantBId,
          label: "VariantB",
          options: { Type: "B" },
          price: 2000,
          stock: 100, // plenty
          active: true,
        },
      ],
    });
    if (createRes.status === 201) {
      const atomicProductId = createRes.json.product.id;
      // Attempt to buy Variant A (stock=0) — must be rejected.
      const r1 = await http("POST", "/api/orders", {
        items: [{
          productId: atomicProductId,
          slug: atomicSlug,
          name: { en: "E2E Atomic Stock Product", ur: "ٹیسٹ" },
          image: "",
          price: 1000,
          variantId: variantAId,
          variantLabel: "VariantA",
          quantity: 1,
        }],
        customer,
      });
      // Verify Variant B's stock was NOT decremented (should still be 100).
      const afterRes = await http("GET", `/api/admin/products/${atomicProductId}`);
      const afterProduct = afterRes.json?.product;
      const variantBAfter = afterProduct?.variants?.find(v => v.id === variantBId);
      if (r1.status === 400 && variantBAfter?.stock === 100)
        pass(`5.4e Atomic variant stock — Variant A (stock=0) rejected, Variant B unchanged (stock=${variantBAfter.stock})`);
      else
        fail("5.4e Atomic variant stock decrement", `order=${r1.status}, variantB stock after=${variantBAfter?.stock} (expected 100)`);

      // Cleanup
      await http("DELETE", `/api/admin/products/${atomicProductId}`);
      await http("DELETE", `/api/admin/categories/${atomicCatId}`);
    } else {
      fail("5.4e Atomic stock setup", `create got ${createRes.status}: ${JSON.stringify(createRes.json)?.slice(0, 200)}`);
    }
  }

  // 5.5 Empty cart → 400
  r = await http("POST", "/api/orders", { items: [], customer });
  if (r.status === 400) pass("5.5 Empty cart order → 400");
  else fail("5.5 Empty cart rejected", `got ${r.status}`);

  // 5.6 Missing required customer fields → 400
  r = await http("POST", "/api/orders", {
    items: [{
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price: 2000,
      variantId: variant30.id,
      variantLabel: "30ml",
      quantity: 1,
    }],
    customer: { fullName: "Test", phone: "", city: "", address: "" },
  });
  if (r.status === 400) pass("5.6 Missing customer fields → 400");
  else fail("5.6 Missing fields rejected", `got ${r.status}`);

  // 5.7 Track the legit order → verify variant info preserved
  if (orderNumber1) {
    r = await http("GET", `/api/orders?orderNumber=${orderNumber1}&phone=0300-1234567`);
    if (r.status === 200 && r.json?.order?.items?.[0]?.variantId === variant30.id)
      pass("5.7 Order tracking → variant info preserved");
    else
      fail("5.7 Order tracking preserves variant", `got ${r.status}, variantId: ${r.json?.order?.items?.[0]?.variantId}`);
  }

  // 5.8 Order with two different variants of same product → separate lines
  r = await http("POST", "/api/orders", {
    items: [
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        price: 2000,
        variantId: variant30.id,
        variantLabel: "30ml",
        selectedOptions: { Volume: "30ml" },
        variantSku: variant30.sku,
        quantity: 1,
      },
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        price: 4500,
        variantId: variant100.id,
        variantLabel: "100ml",
        selectedOptions: { Volume: "100ml" },
        variantSku: variant100.sku,
        quantity: 1,
      },
    ],
    customer,
  });
  if (r.status === 201 && r.json?.order?.items?.length === 2) {
    const items = r.json.order.items;
    const has30 = items.find(i => i.variantId === variant30.id);
    const has100 = items.find(i => i.variantId === variant100.id);
    if (has30 && has100 && has30.price === 2000 && has100.price === 4500)
      pass(`5.8 Two variants of same product → 2 separate lines (30ml+100ml = ${r.json.order.subtotal})`);
    else
      fail("5.8 Separate variant lines", "variants not preserved as separate lines");
  } else {
    fail("5.8 Two variant order", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);
  }

  // 5.9 Verify the order is visible in admin orders API
  if (orderId1) {
    r = await http("GET", `/api/admin/orders/${orderId1}`);
    if (r.status === 200 && r.json?.order?.items?.[0]?.variantLabel === "30ml")
      pass("5.9 Admin can view order → variant label visible");
    else
      fail("5.9 Admin order view shows variant", `got ${r.status}`);
  }
}

// ============================================================
// PHASE 6: Variant helper logic (direct DB)
// ============================================================
async function phase6_variantHelpers(testCtx) {
  section("PHASE 6: Variant helper logic");

  const db = await getDb();
  const product = await db.collection("products").findOne({ id: testCtx.productId });
  if (!product) {
    fail("6.0 Setup: load product", "not found");
    return;
  }

  // 6.1 Product has 6 variants (5 created + 1 added in phase 4.8)
  const variantCount = product.variants?.length;
  if (variantCount === 6) pass(`6.1 Product has 6 variants in DB`);
  else fail("6.1 Product has 6 variants", `got ${variantCount}`);

  // 6.2 Minimum variant price = 2000 (30ml, in-stock)
  const prices = product.variants.map(v => v.price).sort((a, b) => a - b);
  if (prices[0] === 2000) pass(`6.2 Minimum variant price = 2000 (sorted: ${prices.join(",")})`);
  else fail("6.2 Minimum variant price", `got ${prices[0]}`);

  // 6.3 Maximum variant price = 12000 (300ml inactive) — but display max should be 6000 (150ml, highest active+in-stock)
  if (prices[prices.length - 1] === 12000) pass(`6.3 Maximum variant price in DB = 12000 (includes inactive)`);
  else fail("6.3 Maximum variant price in DB", `got ${prices[prices.length - 1]}`);

  // 6.4 Find variant by options { Volume: "50ml" } → price 2800
  const variant50 = product.variants.find(v => v.options?.Volume === "50ml");
  if (variant50 && variant50.price === 2800) pass("6.4 findVariantByOptions(Volume=50ml) → price 2800");
  else fail("6.4 findVariantByOptions", `got: ${JSON.stringify(variant50)?.slice(0, 100)}`);

  // 6.5 Find variant by image
  const variantByImg = product.variants.find(v => v.images?.includes("/images/bike-cover.jpeg"));
  if (variantByImg && variantByImg.label === "50ml")
    pass("6.5 findVariantByImage(bike-cover.jpeg) → 50ml variant");
  else fail("6.5 findVariantByImage", "not found or wrong variant");

  // 6.6 isProductInStock → true (at least one variant has stock)
  const anyInStock = product.variants.some(v => v.stock > 0);
  if (anyInStock) pass("6.6 Product is in stock (at least one variant has stock)");
  else fail("6.6 Product in stock check", "no variants have stock");

  // 6.7 Sum of all variant stocks
  const totalStock = product.variants.reduce((s, v) => s + (v.stock || 0), 0);
  if (totalStock > 0) pass(`6.7 Total stock across variants = ${totalStock}`);
  else fail("6.7 Total stock", "is 0");
}

// ============================================================
// PHASE 7: Validation tests (negative cases)
// ============================================================
async function phase7_validation() {
  section("PHASE 7: Validation tests (negative cases)");

  // 7.1 Create product with negative price → 400
  let r = await http("POST", "/api/admin/products", {
    name: { en: "Bad Product" },
    slug: `bad-prod-${Date.now()}`,
    price: -100,
    stock: 10,
  });
  if (r.status === 400) pass("7.1 Negative price rejected");
  else fail("7.1 Negative price rejected", `got ${r.status}`);

  // 7.2 Create product with missing name → 400
  r = await http("POST", "/api/admin/products", {
    slug: `no-name-${Date.now()}`,
    price: 1000,
  });
  if (r.status === 400) pass("7.2 Missing name rejected");
  else fail("7.2 Missing name rejected", `got ${r.status}`);

  // 7.3 Create product with non-existent categoryId → 400
  r = await http("POST", "/api/admin/products", {
    name: { en: "Orphan Product" },
    slug: `orphan-${Date.now()}`,
    price: 1000,
    categoryId: "non-existent-cat-id",
  });
  if (r.status === 400 && r.json?.error?.toLowerCase().includes("category"))
    pass("7.3 Non-existent categoryId rejected");
  else fail("7.3 Non-existent categoryId rejected", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 150)}`);

  // 7.4 Create category without name → 400
  r = await http("POST", "/api/admin/categories", { slug: "no-name-cat" });
  if (r.status === 400) pass("7.4 Category without name rejected");
  else fail("7.4 Category without name rejected", `got ${r.status}`);

  // 7.5 Label-only variants — distinct labels allowed, duplicate labels rejected.
  // Variants with NO options object, only labels like "Standard" / "Premium" /
  // "Gift Edition" must be allowed (different labels → different uniqueness keys).
  const labelSlug = `e2e-label-only-${Date.now()}`;
  const labelCat = await http("POST", "/api/admin/categories", {
    nameEn: "E2E Label Cat",
    slug: `e2e-label-cat-${Date.now()}`,
    active: true,
  });
  const labelCatId = labelCat.json?.category?.id;
  r = await http("POST", "/api/admin/products", {
    name: { en: "E2E Label-Only Product", ur: "" },
    slug: labelSlug,
    sku: "E2E-LABEL",
    categoryId: labelCatId,
    shortDescription: { en: "Label-only", ur: "" },
    description: { en: "Test", ur: "" },
    price: 1000,
    stock: 0,
    images: [],
    variants: [
      { id: crypto.randomUUID(), label: "Standard", options: {}, price: 1000, stock: 5, active: true },
      { id: crypto.randomUUID(), label: "Premium", options: {}, price: 2000, stock: 5, active: true },
      { id: crypto.randomUUID(), label: "Gift Edition", options: {}, price: 3000, stock: 5, active: true },
    ],
  });
  if (r.status === 201)
    pass("7.5a Label-only variants with distinct labels → 201 allowed (Standard/Premium/Gift Edition)");
  else
    fail("7.5a Label-only distinct labels allowed", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);

  // 7.5b Duplicate label-only variants → rejected (same normalized label).
  if (r.status === 201) {
    const labelProductId = r.json.product.id;
    const dupRes = await http("PUT", `/api/admin/products/${labelProductId}`, {
      variants: [
        ...(r.json.product.variants || []),
        { id: crypto.randomUUID(), label: "Standard", options: {}, price: 1500, stock: 1, active: true },
      ],
    });
    if (dupRes.status === 400 && dupRes.json?.error?.toLowerCase().includes("duplicate"))
      pass("7.5b Duplicate label-only variant → 400 rejected (normalized label uniqueness)");
    else
      fail("7.5b Duplicate label-only rejected", `got ${dupRes.status}: ${JSON.stringify(dupRes.json)?.slice(0, 200)}`);
    // Cleanup
    await http("DELETE", `/api/admin/products/${labelProductId}`);
  }
  await http("DELETE", `/api/admin/categories/${labelCatId}`);
}

// ============================================================
// PHASE 8: Backward compatibility with legacy products
// ============================================================
async function phase8_backwardCompat() {
  section("PHASE 8: Backward compatibility with legacy products");

  // The seeded "Premium Waterproof Rain Suit" is a legacy product
  // (has sizes/colors but no variants). Verify it still works.

  // 8.1 Legacy product page renders
  let r = await http("GET", "/product/premium-waterproof-rain-suit");
  if (r.status === 200) pass("8.1 Legacy product page renders");
  else fail("8.1 Legacy product page renders", `got ${r.status}`);

  // 8.2 Legacy product has single Offer (not AggregateOffer)
  if (r.text && r.text.includes('"@type":"Offer"') && !r.text.includes('"@type":"AggregateOffer"'))
    pass("8.2 Legacy product uses single Offer schema (not AggregateOffer)");
  else fail("8.2 Legacy product schema", "wrong schema type");

  // 8.3 Legacy product order (no variantId) → server uses DB price
  // First, fetch the actual price from the DB (not hardcoded)
  const db = await getDb();
  const legacyProduct = await db.collection("products").findOne({ slug: "premium-waterproof-rain-suit" });
  const legacyPrice = legacyProduct?.price;
  if (!legacyPrice) {
    skip("8.3 Legacy price validation", "legacy product not found in DB");
    return;
  }

  r = await http("POST", "/api/orders", {
    items: [{
      productId: legacyProduct.id,
      slug: "premium-waterproof-rain-suit",
      name: { en: "Premium Waterproof Rain Suit", ur: "پریمیم واٹر پروف رین سوٹ" },
      image: "/images/rain-suit.jpeg",
      price: 999, // TAMPERED — should be corrected to DB price
      size: "M",
      color: "Black",
      quantity: 1,
    }],
    customer: {
      fullName: "Legacy Test",
      email: "legacy@test.com",
      phone: "0300-9999999",
      city: "Karachi",
      address: "1 Legacy Rd",
    },
  });
  if (r.status === 201) {
    const storedPrice = r.json.order.items[0].price;
    if (storedPrice === legacyPrice)
      pass(`8.3 Legacy product tampered price → server corrected to DB price (${storedPrice})`);
    else
      fail("8.3 Legacy price validation", `expected ${legacyPrice}, got ${storedPrice}`);
  } else {
    fail("8.3 Legacy product order", `got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 200)}`);
  }
}

// ============================================================
// CLEANUP
// ============================================================
async function cleanup(testCtx) {
  section("CLEANUP: removing test data");

  if (!testCtx) {
    skip("cleanup", "no test context");
    return;
  }

  const db = await getDb();

  // Delete test product
  if (testCtx.productId) {
    try {
      await db.collection("products").deleteOne({ id: testCtx.productId });
      pass(`Deleted test product ${testCtx.productId.slice(0, 8)}…`);
    } catch (e) {
      fail("Delete test product", e.message);
    }
  }

  // Delete test category
  if (testCtx.categoryId) {
    try {
      await db.collection("categories").deleteOne({ id: testCtx.categoryId });
      pass(`Deleted test category ${testCtx.categoryId.slice(0, 8)}…`);
    } catch (e) {
      fail("Delete test category", e.message);
    }
  }

  // Delete test orders (those with phone 0300-1234567 or 0300-9999999)
  try {
    const res = await db.collection("orders").deleteMany({
      "customer.phone": { $in: ["0300-1234567", "0300-9999999"] },
    });
    pass(`Deleted ${res.deletedCount} test orders`);
  } catch (e) {
    fail("Delete test orders", e.message);
  }

  // Delete any other test categories/products created during testing
  try {
    await db.collection("categories").deleteMany({ slug: { $regex: /^test-cat-|^e2e-test-/ } });
    await db.collection("products").deleteMany({ slug: { $regex: /^e2e-variant-|^bad-prod-|^no-name-|^orphan-/ } });
    pass("Cleaned up any remaining test data");
  } catch (e) {
    fail("Cleanup remaining", e.message);
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("🧪 Asad's Collection — Comprehensive E2E Test Suite");
  console.log(`   Base URL: ${BASE}`);
  console.log(`   Started: ${new Date().toISOString()}`);

  // Wait for server to be ready
  console.log("\n⏳ Waiting for server to be ready...");
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(BASE);
      if (r.ok) { ready = true; break; }
    } catch { /* not ready yet */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  if (!ready) {
    console.error("❌ Server not ready at", BASE);
    process.exit(1);
  }
  console.log("   ✅ Server is ready\n");

  let testCtx = null;
  let authOk = false;

  try {
    await phase1_customerPublic();
    authOk = await phase2_adminAuth();
    if (authOk) {
      await phase3_categoryCrud();
      testCtx = await phase4_variantProductCrud();
      if (testCtx) {
        await phase5_orderFlow(testCtx);
        await phase6_variantHelpers(testCtx);
      }
      await phase7_validation();
    } else {
      skip("Phases 3-7", "admin auth failed — cannot test admin endpoints");
    }
    await phase8_backwardCompat();
  } catch (err) {
    console.error("\n💥 Unhandled error during tests:", err);
  } finally {
    try { await cleanup(testCtx); } catch (e) { console.error("Cleanup failed:", e); }
    if (dbClient) await dbClient.close();
  }

  // Final summary
  section("TEST SUMMARY");
  console.log(`  ✅ Passed:    ${results.pass}`);
  console.log(`  ❌ Failed:    ${results.fail}`);
  console.log(`  ⏭️  Skipped:   ${results.skipped}`);
  console.log(`  Total:       ${results.pass + results.fail + results.skipped}`);
  if (failures.length > 0) {
    console.log("\n  Failures:");
    failures.forEach((f, i) => {
      console.log(`    ${i + 1}. ${f.name}`);
      console.log(`       ${f.reason}`);
    });
  }
  console.log(`\n  Result: ${results.fail === 0 ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}\n`);

  process.exit(results.fail === 0 ? 0 : 1);
}

main();
