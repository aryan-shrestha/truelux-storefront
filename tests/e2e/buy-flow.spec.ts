import { expect, test, type Page } from "@playwright/test";

import { paidKhaltiOrder } from "../fixtures/orders";

/**
 * Browse to bag to checkout.
 *
 * `page.route` intercepts what the **browser** requests: the checkout POST and
 * anything a client component fetches. It cannot see the catalogue reads, which
 * Server Components make from the Next process, so those reach whatever answers
 * on `API_BASE_URL` — in practice a backend populated by `seed_demo`. The
 * fixtures below mirror those shapes, including the sparse variant grid, which
 * is why the two agree; they are not what the server-rendered pages read.
 *
 * It exists to catch the seams the unit tests cannot see — the cache boundary,
 * the hydration boundary, and the navigation between three routes.
 */

const CATEGORIES = [{ name: "Tops", slug: "tops", children: [{ name: "Tees", slug: "tees" }] }];

const TEE = {
  id: "p2",
  name: "Washed Pocket Tee",
  slug: "washed-pocket-tee",
  base_price: "2650.00",
  category: { name: "Tees", slug: "tees" },
  primary_image: null,
  in_stock: true,
};

const TEE_DETAIL = {
  ...TEE,
  description: "Garment-dyed after cutting.",
  images: [],
  variants: [
    {
      id: "v-m-indigo",
      size: { name: "M", slug: "m" },
      color: { name: "Washed Indigo", slug: "washed-indigo" },
      price: "2650.00",
      in_stock: true,
    },
    {
      id: "v-xxl-indigo",
      size: { name: "XXL", slug: "xxl" },
      color: { name: "Washed Indigo", slug: "washed-indigo" },
      // A price override: the page must charge this, not the base price.
      price: "2950.00",
      in_stock: true,
    },
    {
      id: "v-m-olive",
      size: { name: "M", slug: "m" },
      color: { name: "Olive", slug: "olive" },
      price: "2650.00",
      in_stock: true,
    },
    // XXL in olive was never made. It must read differently from sold out.
  ],
};

async function stubApi(page: Page) {
  await page.route("**/api/v1/categories/", (route) =>
    route.fulfill({ json: CATEGORIES, headers: { "X-Request-ID": "e2e" } }),
  );
  await page.route("**/api/v1/products/*/", (route) => route.fulfill({ json: TEE_DETAIL }));
  await page.route("**/api/v1/products/*", (route) =>
    route.fulfill({ json: { count: 1, next: null, previous: null, results: [TEE] } }),
  );
}

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test("browse the catalogue, choose a size, and fill the bag", async ({ page }) => {
  await page.goto("/products");

  await expect(page.getByRole("heading", { name: "Shop", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: /Washed Pocket Tee/ }).click();

  await expect(page).toHaveURL(/\/products\/washed-pocket-tee$/);
  await expect(page.getByRole("heading", { name: "Washed Pocket Tee", level: 1 })).toBeVisible();

  // Nothing is chosen yet, so nothing can be added.
  const addToBag = page.getByRole("button", { name: "Add to bag" });
  await expect(addToBag).toBeDisabled();

  await page.getByRole("radio", { name: /^XXL/ }).click();
  await page.getByRole("radio", { name: /Washed Indigo/ }).click();

  // The price follows the selection, because price_override is real.
  await expect(page.getByText("Rs 2,950")).toBeVisible();

  await expect(addToBag).toBeEnabled();
  await addToBag.click();

  await expect(page.getByRole("button", { name: "Added to bag" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Cart/ })).toContainText("1");

  await page.getByRole("link", { name: /Cart/ }).click();

  // The bag opens as a sheet over the product page, not as a navigation.
  const sheet = page.getByRole("dialog", { name: /Your bag/ });
  await expect(sheet).toBeVisible();
  await expect(page).toHaveURL(/\/products\/washed-pocket-tee$/);
  await expect(sheet.getByRole("link", { name: "Washed Pocket Tee" })).toBeVisible();
  await expect(sheet.getByText(/confirmed at checkout/)).toBeVisible();

  await sheet.getByRole("link", { name: "View bag" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(sheet).not.toBeVisible();
});

test("tells a pairing that was never made apart from one that sold out", async ({ page }) => {
  await page.goto("/products/washed-pocket-tee");

  await page.getByRole("radio", { name: /Olive/ }).click();

  // XXL exists in indigo only. A picker built from independent size and colour
  // lists would offer it here.
  await expect(page.getByRole("radio", { name: /XXL.*Not made/ })).toBeVisible();
});

test("the bag survives a reload, because it lives on the device", async ({ page }) => {
  await page.goto("/products/washed-pocket-tee");

  await page.getByRole("radio", { name: /^M/ }).click();
  await page.getByRole("radio", { name: /Olive/ }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();

  await page.reload();

  await expect(page.getByRole("link", { name: /Cart/ })).toContainText("1");
});

test("check out a bag with cash on delivery", async ({ page }) => {
  let checkoutBody: Record<string, unknown> = {};
  await page.route("**/api/v1/checkout/", (route) => {
    checkoutBody = route.request().postDataJSON();
    return route.fulfill({
      status: 201,
      headers: { "Access-Control-Allow-Origin": "*", "X-Request-ID": "e2e" },
      // Cash on delivery: the key is absent, not null.
      json: {
        order_number: "TL-2026-000142",
        status: "pending",
        subtotal: "2950.00",
        shipping_fee: "150.00",
        total: "3100.00",
      },
    });
  });

  await page.goto("/products/washed-pocket-tee");
  await page.getByRole("radio", { name: /^M/ }).click();
  await page.getByRole("radio", { name: /Olive/ }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();

  await page.getByRole("link", { name: /Cart/ }).click();
  await page
    .getByRole("dialog", { name: /Your bag/ })
    .getByRole("link", { name: "Checkout" })
    .click();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.getByLabel("Full name").fill("Sita Rai");
  await page.getByLabel("Email").fill("sita@example.com");
  await page.getByLabel("Phone").fill("9800000000");
  await page.getByLabel("Address").fill("Jhamsikhel Road");
  await page.getByLabel("City").fill("Lalitpur");
  await page.getByRole("combobox", { name: "District" }).fill("lalit");
  await page.getByRole("option", { name: "Lalitpur" }).click();
  await page.getByRole("radio", { name: "Cash on delivery" }).click();
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/checkout\/confirmation\?order=TL-2026-000142$/);
  await expect(page.getByText("TL-2026-000142")).toBeVisible();
  // The API's figures, not the storefront's.
  await expect(page.getByText("Rs 3,100")).toBeVisible();
  expect(checkoutBody.payment_method).toBe("cod");
  expect(JSON.stringify(checkoutBody)).not.toMatch(/price|total/);

  // The bag was cleared on the cash-on-delivery path.
  await expect(page.getByRole("link", { name: /Cart/ })).not.toContainText("1");
});

test("pay with Khalti and land on the order, with the bag emptied", async ({ page }) => {
  const token = "3f6c1a2e-8b4d-4e7a-9c1f-5d2b7e8a9c30";
  const cors = { "Access-Control-Allow-Origin": "*", "X-Request-ID": "e2e" };

  // Khalti's page and the backend's verifying 302 cannot run here, so the
  // payment URL stands in for the end of that chain: the redirect target.
  await page.route("**/api/v1/checkout/", (route) =>
    route.fulfill({
      status: 201,
      headers: cors,
      json: {
        order_number: paidKhaltiOrder.order_number,
        status: "pending",
        subtotal: paidKhaltiOrder.subtotal,
        shipping_fee: paidKhaltiOrder.shipping_fee,
        total: paidKhaltiOrder.total,
        payment_url: `/orders/${token}`,
      },
    }),
  );
  await page.route(`**/api/v1/orders/${token}/`, (route) =>
    route.fulfill({ headers: cors, json: paidKhaltiOrder }),
  );

  await page.goto("/products/washed-pocket-tee");
  await page.getByRole("radio", { name: /^M/ }).click();
  await page.getByRole("radio", { name: /Olive/ }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  await expect(page.getByRole("link", { name: /Cart/ })).toContainText("1");

  await page.goto("/checkout");
  await page.getByLabel("Full name").fill("Sita Rai");
  await page.getByLabel("Email").fill("sita@example.com");
  await page.getByLabel("Phone").fill("9800000000");
  await page.getByLabel("Address").fill("Jhamsikhel Road");
  await page.getByLabel("City").fill("Lalitpur");
  await page.getByRole("combobox", { name: "District" }).fill("lalit");
  await page.getByRole("option", { name: "Lalitpur" }).click();
  await page.getByRole("radio", { name: "Khalti" }).click();
  await page.getByRole("button", { name: "Place order and pay with Khalti" }).click();

  await expect(page).toHaveURL(new RegExp(`/orders/${token}$`));
  await expect(page.getByText(paidKhaltiOrder.order_number)).toBeVisible();
  await expect(page.getByText("Paid", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Cart/ })).not.toContainText("1");

  // The one rule on this route that nothing else guards.
  await expect(page.locator("main")).not.toContainText(token);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("an empty bag invites shopping rather than showing a dead end", async ({ page }) => {
  await page.goto("/cart");

  await expect(page.getByText("Your bag is empty")).toBeVisible();
  // Scoped to main: the footer carries the same link on every page.
  await expect(page.getByRole("main").getByRole("link", { name: "Shop everything" })).toBeVisible();
});
