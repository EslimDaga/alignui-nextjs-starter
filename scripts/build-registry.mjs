// Generates registry.json (shadcn registry format) from src/components/ui, src/hooks and src/utils.
// Dependencies are inferred from each file's imports, so the starter stays the single source of truth.
// Run `npm run registry:build` to regenerate registry.json and the public/r/*.json payloads.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

const REGISTRY_URL = (
  process.env.REGISTRY_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

const BASE_ITEM = "base";
const IGNORED_PACKAGES = new Set(["react", "react-dom", "next"]);

const DESCRIPTIONS = {
  accordion: "Collapsible content sections built on Radix Accordion.",
  alert: "Inline alert message with status variants, icon and close button.",
  "avatar-empty-icons": "Placeholder SVG icons for empty user and company avatars.",
  "avatar-group-compact": "Compact overlapping avatar stack with overflow counter.",
  "avatar-group": "Overlapping group of avatars with overflow indicator.",
  avatar: "User or company avatar with image, initials, status and notification indicators.",
  badge: "Small label for counts and statuses, with icon and dot variants.",
  banner: "Full-width announcement banner with status variants.",
  "button-group": "Segmented group of connected buttons.",
  button: "Action button with variant (primary, neutral, error), mode (filled, stroke, lighter, ghost) and size.",
  checkbox: "Checkbox with indeterminate state built on Radix Checkbox.",
  "color-picker": "Color picker with area, slider, swatches and hex input (react-aria).",
  "command-menu": "Command palette / spotlight search dialog built on cmdk.",
  "compact-button": "Icon-only compact button, used for close and inline actions.",
  datepicker: "Calendar and date range picker built on react-day-picker.",
  "digit-input": "One-time password / verification code input.",
  divider: "Divider to separate content, with line and labeled variants.",
  "dot-stepper": "Dot-based stepper for carousels and onboarding flows.",
  drawer: "Side panel overlay built on Radix Dialog.",
  dropdown: "Dropdown menu with items, groups, submenus and separators (Radix).",
  "fancy-button": "Elevated button for highlighted calls to action (neutral, primary, destructive, basic).",
  "file-upload": "Drag and drop file upload area with button and helper text.",
  hint: "Helper or error hint text shown below form fields.",
  "horizontal-stepper": "Horizontal multi-step progress indicator.",
  input: "Text input with icons, affixes, inline addons and error state.",
  kbd: "Keyboard shortcut key indicator.",
  label: "Form label with required asterisk and sub-label.",
  "link-button": "Text link styled as a button, with underline and icon options.",
  modal: "Dialog modal with header, body and footer built on Radix Dialog.",
  "notification-provider": "Provider that renders the notifications queue; mount once in the root layout.",
  notification: "Toast-style notification card built on Radix Toast.",
  pagination: "Pagination controls with page numbers and navigation arrows.",
  popover: "Floating popover content anchored to a trigger (Radix Popover).",
  "progress-bar": "Linear progress bar with color variants.",
  "progress-circle": "Circular progress indicator with optional label.",
  radio: "Radio group and items built on Radix Radio Group.",
  "segmented-control": "Segmented tab switcher with animated active indicator.",
  select: "Select dropdown with sizes, variants, icons and groups (Radix Select).",
  slider: "Range slider with one or more thumbs (Radix Slider).",
  "status-badge": "Status indicator badge with dot or icon (completed, pending, failed, disabled).",
  "svg-rating-icons": "Star and heart SVG icons plus a StarRating component.",
  switch: "Toggle switch built on Radix Switch.",
  "tab-menu-horizontal": "Horizontal tab menu with animated underline (Radix Tabs).",
  "tab-menu-vertical": "Vertical tab menu for settings-style navigation (Radix Tabs).",
  table: "Table primitives: Root, Header, Head, Body, Row, RowDivider, Cell and Caption.",
  tag: "Removable tag / chip with icon and dismiss button.",
  textarea: "Multi-line text input with character counter.",
  "toast-alert": "Alert-styled toast content to use with the toast helper.",
  toast: "Sonner-based toast helper and Toaster; mount Toaster once in the root layout.",
  tooltip: "Tooltip with sizes and dark or light variants (Radix Tooltip).",
  "vertical-stepper": "Vertical multi-step progress indicator.",
  "use-notification": "Hook and imperative API to show notifications.",
  "use-tab-observer": "Hook that tracks the active tab element for animated indicators.",
};

const toTitle = (name) =>
  name
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const list = (dir, ext) =>
  fs
    .readdirSync(path.join(ROOT, dir))
    .filter((f) => ext.some((e) => f.endsWith(e)))
    .sort()
    .map((f) => ({ name: path.parse(f).name, file: `${dir}/${f}` }));

const itemUrl = (name) => `${REGISTRY_URL}/r/${name}.json`;

function packageName(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

function versioned(name) {
  const version = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
  if (!version) throw new Error(`"${name}" is imported but missing from package.json`);
  return `${name}@${version}`;
}

function analyze(file) {
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  const specifiers = [
    ...source.matchAll(/\bfrom\s+["']([^"']+)["']|^\s*import\s+["']([^"']+)["']/gm),
  ].map((m) => m[1] ?? m[2]);

  const dependencies = new Set();
  const registryDependencies = new Set();
  for (const spec of specifiers) {
    const local =
      spec.match(/^@\/components\/ui\/(.+)$/)?.[1] ??
      spec.match(/^@\/hooks\/(.+)$/)?.[1] ??
      spec.match(/^\.\/(.+)$/)?.[1];
    if (local) registryDependencies.add(itemUrl(local));
    else if (spec.startsWith("@/utils/")) registryDependencies.add(itemUrl(BASE_ITEM));
    else if (!spec.startsWith(".") && !spec.startsWith("@/")) {
      const name = packageName(spec);
      if (!IGNORED_PACKAGES.has(name)) dependencies.add(versioned(name));
    }
  }

  // Compound components are exported as `export { FooRoot as Root, ... }`.
  const parts = [...source.matchAll(/export\s*\{([^}]*)\}/g)]
    .flatMap((m) => m[1].split(","))
    .map((s) => s.trim().match(/^(?:\w+\s+as\s+)?([A-Z]\w*)$/)?.[1])
    .filter(Boolean);

  return { dependencies, registryDependencies, parts };
}

const utils = list("src/utils", [".ts", ".tsx"]);
const baseDeps = new Set();
for (const u of utils) analyze(u.file).dependencies.forEach((d) => baseDeps.add(d));

const items = [
  {
    name: BASE_ITEM,
    type: "registry:item",
    title: "AlignUI Base",
    description:
      "AlignUI design tokens (colors, typography, shadows, dark mode) and the cn, tv, polymorphic and recursiveCloneChildren utilities. Required by every component.",
    dependencies: [...baseDeps].sort(),
    files: [
      ...utils.map((u) => ({ path: u.file, type: "registry:lib" })),
      {
        path: "src/styles/alignui.css",
        type: "registry:file",
        target: "~/src/styles/alignui.css",
      },
    ],
    css: { '@import "../styles/alignui.css"': {} },
    docs: "AlignUI tokens were added to src/styles/alignui.css and imported from your global CSS (assumes src/app/globals.css). Dark mode is enabled by adding the `dark` class to <html>. AlignUI is designed for the Inter font: set it as --font-sans.",
  },
];

for (const { name, file, type } of [
  ...list("src/hooks", [".ts", ".tsx"]).map((f) => ({ ...f, type: "registry:hook" })),
  ...list("src/components/ui", [".tsx"]).map((f) => ({ ...f, type: "registry:ui" })),
]) {
  const { dependencies, registryDependencies, parts } = analyze(file);
  registryDependencies.add(itemUrl(BASE_ITEM));
  registryDependencies.delete(itemUrl(name));

  const usage =
    type === "registry:ui" && parts.includes("Root")
      ? ` Usage: import * as ${toTitle(name).replace(/ /g, "")} from "@/components/ui/${name}" (parts: ${parts.join(", ")}).`
      : "";

  if (!DESCRIPTIONS[name]) console.warn(`warn: no description for "${name}"`);

  items.push({
    name,
    type,
    title: toTitle(name),
    description: `${DESCRIPTIONS[name] ?? toTitle(name)}${usage}`,
    dependencies: [...dependencies].sort(),
    registryDependencies: [...registryDependencies].sort(),
    files: [{ path: file, type }],
    meta: parts.length ? { parts } : undefined,
  });
}

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "alignui",
  homepage: REGISTRY_URL,
  items,
};

fs.writeFileSync(path.join(ROOT, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`);
console.log(`registry.json: ${items.length} items (${REGISTRY_URL})`);
