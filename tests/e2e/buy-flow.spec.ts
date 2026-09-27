import { expect, test, type Page } from "@playwright/test";

import type { RawQuote } from "@/lib/api/orders";
import { districtlessQuote, freeShippingQuote, lalitpurQuote } from "../fixtures/quote";

// page.route intercepts only what the browser requests (checkout, the order
// routes). The catalogue is read by Server Components from the Next process,
// so these specs need a backend seeded with `seed_demo` on API_BASE_URL; the
// products named here are from that seed.

const FOUNDATION = "/products/silk-foundation";
const SERUM = "/products/24k-radiance-serum";
const CORS = { "Access-Control-Allow-Origin": "*", "X-Request-ID": "e2e" };

async function routeQuote(page: Page, answer: (body: QuoteBody) => RawQuote) {
  await page.route("**/api/v1/checkout/quote/", (route) =>
    route.fulfill({ headers: CORS, json: answer(route.request().postDataJSON()) }),
  );
}

type QuoteBody = { items: Array<{ quantity: number }>; district?: string };

test.beforeEach(async ({ page }) => {
  await routeQuote(page, (body) =>
    body.district === undefined ? districtlessQuote : lalitpurQuote,
  );
});

async function addFoundation(page: Page) {
  await page.goto(FOUNDATION);
  await page.getByRole("radio", { name: "Porcelain" }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  await expect(page.getByRole("button", { name: "Added to bag" })).toBeVisible();
}

test("browse to a product, pick a shade, and open the bag", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: "Shop", level: 1 })).toBeVisible();

  await page.getByRole("link", { name: "Silk Foundation" }).first().click();
  await expect(page).toHaveURL(new RegExp(`${FOUNDATION}$`));
  await expect(page.getByRole("link", { name: "Lumière" }).first()).toHaveAttribute(
    "href",
    "/brands/lumiere",
  );

  const addToBag = page.getByRole("button", { name: "Add to bag" });
  await expect(addToBag).toBeDisabled();
  // Mocha is seeded with no stock.
  await expect(page.getByRole("radio", { name: /^Mocha, Sold out/ })).toBeDisabled();

  await page.getByRole("radio", { name: "Porcelain" }).click();
  await addToBag.click();

  await page.getByRole("link", { name: /Bag, 1 item/ }).click();
  const sheet = page.getByRole("dialog", { name: /Your bag/ });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("30 ml · Porcelain")).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${FOUNDATION}$`));
});

test("a shadeless product needs only a size, and follows its price override", async ({ page }) => {
  await page.goto(SERUM);

  await expect(page.getByText("Shade")).toHaveCount(0);
  await page.getByRole("radio", { name: "50 ml" }).click();
  await expect(page.getByText("Rs 7,200")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to bag" })).toBeEnabled();
});

test("filters the catalogue by brand, shade and skin type through links", async ({ page }) => {
  await page.goto("/products");

  await page.getByRole("button", { name: "Filter and sort" }).click();
  const brands = page.getByRole("region", { name: "Brand" });
  await brands.getByRole("link", { name: "Lumière" }).click();
  await expect(page).toHaveURL(/\/products\?brand=lumiere$/);

  await page.getByRole("link", { name: "Porcelain" }).click();
  await expect(page).toHaveURL(/\/products\?brand=lumiere&shade=porcelain$/);

  await page.getByRole("region", { name: "Skin type" }).getByRole("link", { name: "Dry" }).click();
  await expect(page).toHaveURL(/\/products\?brand=lumiere&shade=porcelain&skin_type=dry$/);
});

test("an applied filter keeps its inverted text on hover", async ({ page }) => {
  await page.goto("/products?category=hydrate&skin_type=dry");

  const dry = page.getByRole("region", { name: "Skin type" }).getByRole("link", { name: "Dry" });
  await expect(dry).toHaveAttribute("aria-current", "true");
  await dry.hover();
  const color = await dry.evaluate(async (link) => {
    await Promise.all(link.getAnimations().map((animation) => animation.finished));
    return getComputedStyle(link).color;
  });

  const pageBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(color).toBe(pageBackground);
});

test("the mega-menu opens a skin type and a whole root category", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Shop" }).click();
  await page.getByRole("region", { name: "Skin type" }).getByRole("link", { name: "Dry" }).click();
  await expect(page).toHaveURL(/\/products\?skin_type=dry$/);

  await page.getByRole("button", { name: "Shop" }).click();
  await page
    .getByRole("region", { name: "Skincare" })
    .getByRole("link", { name: "Shop all" })
    .click();
  await expect(page).toHaveURL(/\/products\?category=skincare$/);
  await expect(page.getByRole("heading", { name: "Skincare", level: 1 })).toBeVisible();
});

test("the bag survives a reload, because it lives on the device", async ({ page }) => {
  await addFoundation(page);

  await page.reload();

  await expect(page.getByRole("link", { name: /Bag, 1 item/ })).toBeVisible();
});

test("check out with cash on delivery", async ({ page }) => {
  let checkoutBody: Record<string, unknown> = {};
  await page.route("**/api/v1/checkout/", (route) => {
    checkoutBody = route.request().postDataJSON();
    return route.fulfill({
      status: 201,
      headers: CORS,
      json: {
        order_number: "TL-2026-000142",
        status: "pending",
        subtotal: "3200.00",
        shipping_fee: "150.00",
        total: "3350.00",
      },
    });
  });

  await addFoundation(page);
  await page.goto("/checkout");

  await expect(page.getByRole("main").getByText("Cash on delivery", { exact: true })).toBeVisible();
  await page.getByLabel("Full name").fill("Sita Rai");
  await page.getByLabel("Email").fill("sita@example.com");
  await page.getByLabel("Phone").fill("9800000000");
  await page.getByLabel("Address").fill("Jhamsikhel Road");
  await page.getByLabel("City").fill("Lalitpur");
  await page.getByRole("combobox", { name: "District" }).click();
  await page.getByPlaceholder("Search districts").fill("lalit");
  await page.getByRole("option", { name: "Lalitpur" }).click();
  await expect(page.getByText("Rs 6,550")).toBeVisible();
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/checkout\/confirmation\?order=TL-2026-000142$/);
  await expect(page.getByText("TL-2026-000142")).toBeVisible();
  await expect(page.getByText("Rs 3,350")).toBeVisible();
  expect(checkoutBody.payment_method).toBe("cod");
  expect(JSON.stringify(checkoutBody)).not.toMatch(/price|total/);
  await expect(page.getByRole("link", { name: /Bag, 0 items/ })).toBeVisible();
});

test("a quote that crosses the threshold changes the free-shipping message", async ({ page }) => {
  await routeQuote(page, (body) =>
    body.items[0]!.quantity >= 2
      ? freeShippingQuote
      : { ...districtlessQuote, subtotal: "3200.00", free_shipping_remaining: "4800.00" },
  );

  await addFoundation(page);
  await page.goto("/cart");

  await expect(page.getByText("Add Rs 4,800 more for free shipping")).toBeVisible();
  await page.getByRole("button", { name: /Increase quantity of Silk Foundation/ }).click();
  await expect(page.getByText("Free shipping", { exact: true })).toBeVisible();
  await expect(page.getByText(/more for free shipping/)).toHaveCount(0);
});

test("an order link shows the order and never the token", async ({ page }) => {
  const token = "3f6c1a2e-8b4d-4e7a-9c1f-5d2b7e8a9c30";
  await page.route(`**/api/v1/orders/${token}/`, (route) =>
    route.fulfill({
      headers: CORS,
      json: {
        order_number: "TL-2026-000142",
        status: "confirmed",
        placed_at: "2026-09-20T10:14:00Z",
        email: "sita@example.com",
        phone: "9800000000",
        shipping: {
          full_name: "Sita Rai",
          address_line: "Jhamsikhel Road",
          city: "Lalitpur",
          district: "Lalitpur",
        },
        items: [
          {
            product_name: "Silk Foundation",
            variant_size: "30 ml",
            variant_shade: "Porcelain",
            sku: "LUM-SF-30-POR",
            quantity: 1,
            unit_price: "3200.00",
          },
        ],
        subtotal: "3200.00",
        shipping_fee: "150.00",
        total: "3350.00",
        payment_method: "cod",
      },
    }),
  );

  await page.goto(`/orders/${token}`);

  await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();
  await expect(page.locator("main")).not.toContainText(token);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("an empty bag invites shopping rather than showing a dead end", async ({ page }) => {
  await page.goto("/cart");

  await expect(page.getByText("Your bag is empty")).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Shop everything" })).toBeVisible();
});
