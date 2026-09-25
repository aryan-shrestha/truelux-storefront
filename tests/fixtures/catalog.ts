import type { Category, Product, ProductSummary } from "@/lib/api/types";

/**
 * Typed with the same types as `lib/api`, so a contract change breaks these at
 * compile time rather than at runtime.
 *
 * The awkward shapes are deliberate and mirror what `seed_demo` creates in the
 * backend: they are the states that break a page, and a tidy fixture omits all
 * of them.
 */

export const boxyLogoTee: ProductSummary = {
  id: "d7d70320-e419-47ae-bb57-1f0b00004d09",
  name: "Boxy Logo Tee",
  slug: "boxy-logo-tee",
  basePrice: "2400.00",
  category: { name: "Tees", slug: "tees" },
  primaryImage: {
    url: "http://127.0.0.1:8000/media/products/boxy-logo-tee-0.jpg",
    altText: "Boxy logo tee, front",
  },
  inStock: true,
};

/** No photograph and an empty alt: both are states a merchant can produce. */
export const pleatedWideShort: ProductSummary = {
  id: "5a1c9f22-0c0a-4a4b-8f1d-92b0c1d3e4f5",
  name: "Pleated Wide Short",
  slug: "pleated-wide-short",
  basePrice: "3200.00",
  category: { name: "Shorts", slug: "shorts" },
  primaryImage: null,
  inStock: true,
};

export const soldOutJacket: ProductSummary = {
  id: "9b2e7d41-6f3a-4c8e-9a12-7d5b3c1a8e04",
  name: "Overdyed Work Jacket",
  slug: "overdyed-work-jacket",
  basePrice: "7900.00",
  category: { name: "Tops", slug: "tops" },
  primaryImage: {
    url: "http://127.0.0.1:8000/media/products/overdyed-work-jacket-0.jpg",
    altText: "Overdyed work jacket",
  },
  inStock: false,
};

/**
 * A sparse variant grid: XXL exists in one colour only and costs more, and one
 * pairing is sold out. A picker built from independent size and colour lists
 * would offer XXL in olive, which was never made.
 */
export const washedPocketTee: Product = {
  id: "3f8a1b64-2d7e-4f90-a1c3-6e5d4b2a9c08",
  name: "Washed Pocket Tee",
  slug: "washed-pocket-tee",
  basePrice: "2650.00",
  category: { name: "Tees", slug: "tees" },
  primaryImage: {
    url: "http://127.0.0.1:8000/media/products/washed-pocket-tee-0.jpg",
    altText: "Washed pocket tee on a rail",
  },
  inStock: true,
  description: "Garment-dyed after cutting, so no two are exactly the same shade.",
  images: [
    {
      url: "http://127.0.0.1:8000/media/products/washed-pocket-tee-0.jpg",
      altText: "Washed pocket tee on a rail",
    },
    {
      url: "http://127.0.0.1:8000/media/products/washed-pocket-tee-1.jpg",
      altText: "Washed pocket tee on a rail",
    },
  ],
  variants: [
    {
      id: "v-m-indigo",
      size: { name: "M", slug: "m" },
      color: { name: "Washed Indigo", slug: "washed-indigo" },
      price: "2650.00",
      inStock: true,
    },
    {
      id: "v-l-indigo",
      size: { name: "L", slug: "l" },
      color: { name: "Washed Indigo", slug: "washed-indigo" },
      price: "2650.00",
      inStock: true,
    },
    {
      id: "v-xxl-indigo",
      size: { name: "XXL", slug: "xxl" },
      color: { name: "Washed Indigo", slug: "washed-indigo" },
      price: "2950.00",
      inStock: true,
    },
    {
      id: "v-m-olive",
      size: { name: "M", slug: "m" },
      color: { name: "Olive", slug: "olive" },
      price: "2650.00",
      inStock: true,
    },
    {
      id: "v-l-olive",
      size: { name: "L", slug: "l" },
      color: { name: "Olive", slug: "olive" },
      price: "2650.00",
      inStock: false,
    },
  ],
};

export const categoryTree: Category[] = [
  {
    name: "Tops",
    slug: "tops",
    children: [
      { name: "Tees", slug: "tees" },
      { name: "Hoodies", slug: "hoodies" },
    ],
  },
  { name: "Bottoms", slug: "bottoms", children: [] },
];
