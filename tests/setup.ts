import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library registers this itself only when Vitest's globals are on, and
// they are deliberately off here. Without it, rendered trees accumulate across
// tests: duplicate roles, and a Radix dialog's `pointer-events: none` left on
// <body> makes the next test's clicks fail for reasons that look like bugs.
afterEach(cleanup);

// jsdom lays nothing out, so it has no scrollIntoView. The combobox calls it to
// keep the highlighted option visible; here there is nothing to scroll.
Element.prototype.scrollIntoView = function scrollIntoView() {};
