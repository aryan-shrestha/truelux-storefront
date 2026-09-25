import type {
  Brand,
  Category,
  Product,
  ProductSummary,
  ShadeRef,
  SizeRef,
} from "@/lib/api/types";

// Typed with the lib/api types, so a contract change breaks these at compile
// time. The awkward shapes (no image, sold out, sparse variants, shadeless) are
// the states that break a page.

const lumiere = { name: "Lumière", slug: "lumiere" };
const verde = { name: "Verde", slug: "verde" };

export const velvetLipTint: ProductSummary = {
  id: "d7d70320-e419-47ae-bb57-1f0b00004d09",
  name: "Velvet Lip Tint",
  slug: "velvet-lip-tint",
  basePrice: "1800.00",
  brand: lumiere,
  category: { name: "Lips", slug: "lips" },
  primaryImage: {
    url: "http://127.0.0.1:8000/media/products/velvet-lip-tint-0.jpg",
    altText: "Velvet lip tint, uncapped",
  },
  inStock: true,
};

export const roseWaterToner: ProductSummary = {
  id: "5a1c9f22-0c0a-4a4b-8f1d-92b0c1d3e4f5",
  name: "Rose Water Toner",
  slug: "rose-water-toner",
  basePrice: "2200.00",
  brand: verde,
  category: { name: "Skincare", slug: "skincare" },
  primaryImage: null,
  inStock: true,
};

export const soldOutPerfume: ProductSummary = {
  id: "9b2e7d41-6f3a-4c8e-9a12-7d5b3c1a8e04",
  name: "Santal Eau de Parfum",
  slug: "santal-eau-de-parfum",
  basePrice: "8900.00",
  brand: lumiere,
  category: { name: "Fragrance", slug: "fragrance" },
  primaryImage: {
    url: "http://127.0.0.1:8000/media/products/santal-0.jpg",
    altText: "Santal eau de parfum bottle",
  },
  inStock: false,
};

// Sparse: 50 ml exists in Warm Beige only and costs more, and Deep Mocha is sold
// out. Porcelain and Deep Mocha in 50 ml were never made.
export const silkFoundation: Product = {
  id: "3f8a1b64-2d7e-4f90-a1c3-6e5d4b2a9c08",
  name: "Silk Skin Foundation",
  slug: "silk-skin-foundation",
  basePrice: "3200.00",
  brand: lumiere,
  category: { name: "Face", slug: "face" },
  primaryImage: {
    url: "http://127.0.0.1:8000/media/products/silk-foundation-0.jpg",
    altText: "Silk skin foundation bottle",
  },
  inStock: true,
  description: "A weightless, satin-finish foundation with buildable coverage.",
  images: [
    {
      url: "http://127.0.0.1:8000/media/products/silk-foundation-0.jpg",
      altText: "Silk skin foundation bottle",
    },
    {
      url: "http://127.0.0.1:8000/media/products/silk-foundation-1.jpg",
      altText: "Silk skin foundation swatches",
    },
  ],
  variants: [
    {
      id: "v-30-porcelain",
      size: { name: "30 ml", slug: "30-ml" },
      shade: { name: "Porcelain", slug: "porcelain", hexCode: "#F3DCC8" },
      price: "3200.00",
      inStock: true,
    },
    {
      id: "v-30-warm-beige",
      size: { name: "30 ml", slug: "30-ml" },
      shade: { name: "Warm Beige", slug: "warm-beige", hexCode: "#D8A47F" },
      price: "3200.00",
      inStock: true,
    },
    {
      id: "v-50-warm-beige",
      size: { name: "50 ml", slug: "50-ml" },
      shade: { name: "Warm Beige", slug: "warm-beige", hexCode: "#D8A47F" },
      price: "4400.00",
      inStock: true,
    },
    {
      id: "v-30-deep-mocha",
      size: { name: "30 ml", slug: "30-ml" },
      shade: { name: "Deep Mocha", slug: "deep-mocha", hexCode: "#6B432C" },
      price: "3200.00",
      inStock: false,
    },
  ],
};

export const hydratingSerum: Product = {
  id: "7c2d4e11-8a9b-4c3d-9e0f-1a2b3c4d5e6f",
  name: "Hydrating Serum",
  slug: "hydrating-serum",
  basePrice: "2900.00",
  brand: verde,
  category: { name: "Serums", slug: "serums" },
  primaryImage: null,
  inStock: true,
  description: "Hyaluronic acid and niacinamide for plump, even skin.",
  images: [],
  variants: [
    {
      id: "v-15-serum",
      size: { name: "15 ml", slug: "15-ml" },
      shade: null,
      price: "2900.00",
      inStock: true,
    },
    {
      id: "v-30-serum",
      size: { name: "30 ml", slug: "30-ml" },
      shade: null,
      price: "4800.00",
      inStock: false,
    },
  ],
};

export const categoryTree: Category[] = [
  {
    name: "Skincare",
    slug: "skincare",
    children: [
      { name: "Cleansers", slug: "cleansers" },
      { name: "Serums", slug: "serums" },
    ],
  },
  { name: "Fragrance", slug: "fragrance", children: [] },
];

export const brands: Brand[] = [
  {
    ...lumiere,
    description: "French-inspired complexion care.",
    logoUrl: null,
    productCount: 6,
  },
  { ...verde, description: "", logoUrl: null, productCount: 1 },
];

export const shades: ShadeRef[] = [
  { name: "Porcelain", slug: "porcelain", hexCode: "#F3DCC8" },
  { name: "Warm Beige", slug: "warm-beige", hexCode: "#D8A47F" },
];

export const sizes: SizeRef[] = [
  { name: "30 ml", slug: "30-ml" },
  { name: "50 ml", slug: "50-ml" },
];
