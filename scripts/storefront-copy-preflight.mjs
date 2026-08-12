import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { TextDecoder } from "node:util";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const listingFile = "docs/app-store/listing.md";
const storyboardFile = "docs/app-store/screenshots/storyboard.md";
const pageFiles = [
  "sites/trueohm/public/index.html",
  "sites/trueohm/public/support.html",
  "sites/trueohm/public/privacy.html",
  "sites/trueohm/public/terms.html",
];
const requiredFiles = [
  "package.json",
  listingFile,
  storyboardFile,
  ...pageFiles,
  "sites/trueohm/public/style.css",
  "sites/trueohm/wrangler.jsonc",
];

const description = `Solve everyday electrical formulas and see the math behind every answer.

Enter any two values in the Ohm's Law wheel to solve volts, amps, resistance, and watts. Calculate single-phase and three-phase AC power, work with kW, kVA, power factor, and the power triangle, estimate energy cost, and check efficiency.

Every result shows the formula with your values substituted, plus plain-language warnings when an input is outside a practical range.

TrueOhm is completely free, with no ads, in-app purchases, subscription, or account. Calculations run on your device and work offline.

TrueOhm is a calculation aid for qualified professionals. Always verify results before relying on them.`;

const markerFields = [
  ["aso:trueohm.name", listingFile, "TrueOhm"],
  ["aso:trueohm.subtitle", listingFile, "Ohm's Law & 3-Phase Power"],
  [
    "aso:trueohm.promotional",
    listingFile,
    "Free electrical formulas for Ohm's Law, single- and three-phase AC power, power factor, energy cost, and efficiency—with the math shown.",
  ],
  [
    "aso:trueohm.keywords",
    listingFile,
    "electrical,calculator,volts,amps,resistance,watts,kVA,kW,factor,efficiency,energy,triangle",
  ],
  ["aso:trueohm.description", listingFile, description],
  ["copy:trueohm.category.primary", listingFile, "Utilities"],
  ["copy:trueohm.category.secondary", listingFile, "No secondary category"],
  ["copy:trueohm.reserve", listingFile, "impedance,current,voltage,formula,three wire"],
  ["copy:trueohm.url.marketing", listingFile, "https://ohm.509electric.com"],
  ["copy:trueohm.url.support", listingFile, "https://ohm.509electric.com/support"],
  ["copy:trueohm.url.privacy", listingFile, "https://ohm.509electric.com/privacy"],
  ["copy:trueohm.url.terms", listingFile, "https://ohm.509electric.com/terms"],
  ["copy:trueohm.screenshot.1", storyboardFile, "Solve Ohm's Law."],
  ["copy:trueohm.screenshot.2", storyboardFile, "See the formula with your values."],
  ["copy:trueohm.screenshot.3", storyboardFile, "Calculate single- and three-phase AC power."],
  ["copy:trueohm.screenshot.4", storyboardFile, "Work with kW, kVA, and power factor."],
  ["copy:trueohm.screenshot.5", storyboardFile, "Free, offline, and no account."],
];

const websiteFields = [
  {
    id: "copy:trueohm.website.title",
    file: pageFiles[0],
    kind: "title",
    value: "TrueOhm | Ohm's Law and Electrical Calculator",
  },
  {
    id: "copy:trueohm.website.meta",
    file: pageFiles[0],
    kind: "metaDescription",
    value:
      "Solve Ohm's Law, single- and three-phase AC power, power factor, energy cost, and efficiency with the formula shown for every result.",
  },
  {
    id: "copy:trueohm.website.hero",
    file: pageFiles[0],
    kind: "h1",
    value: "Ohm's Law, with the math shown.",
  },
  {
    id: "copy:trueohm.website.support",
    file: pageFiles[0],
    kind: "dataCopy",
    value:
      "Solve everyday electrical formulas, see your values in the equation, and check plain-language warnings before relying on a result.",
  },
  {
    id: "copy:trueohm.website.cta",
    file: pageFiles[0],
    kind: "appStoreCta",
    value: "Download free on the App Store →",
  },
  {
    id: "copy:trueohm.website.features",
    file: pageFiles[0],
    kind: "dataCopy",
    value:
      "Solve volts, amps, resistance, and watts with Ohm's Law. Calculate single- and three-phase AC power. Work with kW, kVA, power factor, energy cost, and efficiency. See the formula with your entered values and practical-range warnings.",
  },
  {
    id: "copy:trueohm.website.commerce",
    file: pageFiles[0],
    kind: "dataCopy",
    value:
      "TrueOhm is completely free, with no ads, in-app purchases, subscription, or account. There is nothing recurring.",
  },
  {
    id: "copy:trueohm.website.local",
    file: pageFiles[0],
    kind: "dataCopy",
    value:
      "Calculations run on your device and work offline. Values or settings in device backups are handled by the backup services you choose.",
  },
  {
    id: "copy:trueohm.website.qualification",
    file: pageFiles[0],
    kind: "dataCopy",
    value:
      "TrueOhm is a calculation aid for qualified professionals. Verify results, equipment information, and application requirements before relying on an answer.",
  },
  {
    id: "copy:trueohm.website.support_correction",
    file: pageFiles[1],
    kind: "dataCopy",
    value:
      "TrueOhm is free to use, requires no account, and works offline. It has no purchases to restore and nothing recurring to manage.",
  },
  {
    id: "copy:trueohm.website.privacy_correction",
    file: pageFiles[2],
    kind: "dataCopy",
    value:
      "TrueOhm performs calculations on your device. Settings or values included in a device backup are handled by the backup services you choose.",
  },
  {
    id: "copy:trueohm.website.terms_correction",
    file: pageFiles[3],
    kind: "dataCopy",
    value:
      "TrueOhm is provided free of charge with no in-app purchases or subscription. Results are calculation aids that you must verify for your application.",
  },
];

const packetFields = [...markerFields, ...websiteFields];
const appStoreUrl = "https://apps.apple.com/app/id6772605137";
const canonicalByPage = new Map([
  [pageFiles[0], "https://ohm.509electric.com"],
  [pageFiles[1], "https://ohm.509electric.com/support"],
  [pageFiles[2], "https://ohm.509electric.com/privacy"],
  [pageFiles[3], "https://ohm.509electric.com/terms"],
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value) {
  return value.replace(/\r\n?/g, "\n").trim();
}

function renderedHtml(value) {
  return value
    .replace(/<!--[\s\S]*?(?:-->|$)/g, " ")
    .replace(/<(script|style|template|noscript)\b[\s\S]*?(?:<\/\1\s*>|$)/gi, " ");
}

function decodeEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, key) => {
    if (key[0] === "#") {
      const hexadecimal = key[1].toLowerCase() === "x";
      const codePoint = Number.parseInt(key.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }
    return named[key.toLowerCase()] ?? entity;
  });
}

function visibleText(value) {
  return decodeEntities(
    value
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function readStrictUtf8(root, relativePath, errors) {
  try {
    const bytes = readFileSync(resolve(root, relativePath));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    if (error.code === "ENOENT") {
      errors.push(`${relativePath}: missing required file`);
    } else if (error instanceof TypeError) {
      errors.push(`${relativePath}: file is not valid UTF-8`);
    } else {
      errors.push(`${relativePath}: could not be read (${error.message})`);
    }
    return null;
  }
}

function markerValue(text, id, file, errors) {
  const escapedId = escapeRegExp(id);
  const startCount = [...text.matchAll(new RegExp(`<!--\\s*${escapedId}:start\\s*-->`, "g"))]
    .length;
  const endCount = [...text.matchAll(new RegExp(`<!--\\s*${escapedId}:end\\s*-->`, "g"))].length;
  if (startCount !== 1 || endCount !== 1) {
    errors.push(`${id}: ${file} must contain exactly one marker pair`);
    return null;
  }
  const match = text.match(
    new RegExp(`<!--\\s*${escapedId}:start\\s*-->([\\s\\S]*?)<!--\\s*${escapedId}:end\\s*-->`),
  );
  if (!match) {
    errors.push(`${id}: ${file} marker pair is malformed`);
    return null;
  }
  return normalizeText(match[1]);
}

function tagMatches(text, tagName) {
  return [
    ...text.matchAll(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}\\s*>`, "gi")),
  ];
}

function attribute(tag, name) {
  const matches = [
    ...tag.matchAll(new RegExp(`(?:^|\\s)${escapeRegExp(name)}\\s*=\\s*(["'])(.*?)\\1`, "gi")),
  ];
  return matches.length === 1 ? decodeEntities(matches[0][2]) : null;
}

function startTags(text, tagName = "[a-z][a-z0-9-]*") {
  return [...text.matchAll(new RegExp(`<(${tagName})\\b([^>]*)>`, "gi"))].map((match) => ({
    attributes: match[2],
    name: match[1].toLowerCase(),
    source: match[0],
  }));
}

function isHiddenTag(tag) {
  return (
    /(?:^|\s)hidden(?:\s|=|$)/i.test(tag.attributes) ||
    attribute(tag.source, "aria-hidden")?.toLowerCase() === "true" ||
    /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\.0*)?)\s*(?:;|$)/i.test(
      attribute(tag.source, "style") ?? "",
    )
  );
}

function auditHtmlStructure(file, text, errors) {
  if (/<!--[\s\S]*?(?:-->|$)/.test(text)) {
    errors.push(`${file}: HTML comments are not allowed in audited storefront pages`);
  }
  if (/<\/?(?:script|style|template|noscript)\b/i.test(text)) {
    errors.push(`${file}: non-rendered or executable HTML containers are not allowed`);
  }

  const mainTags = startTags(text, "main");
  if (mainTags.length !== 1 || isHiddenTag(mainTags[0])) {
    errors.push(`${file}: page must contain exactly one visible main element`);
  }

  for (const tag of startTags(text)) {
    if (tag.name !== "svg" && isHiddenTag(tag)) {
      errors.push(`${file}: audited storefront content must not be hidden`);
      break;
    }
  }

  let anchorOpen = false;
  for (const match of text.matchAll(/<\/?a\b[^>]*>/gi)) {
    const closing = /^<\//.test(match[0]);
    if ((!closing && anchorOpen) || (closing && !anchorOpen)) {
      errors.push(`${file}: anchor markup must be well formed and cannot be nested`);
      break;
    }
    anchorOpen = !closing;
  }
  if (anchorOpen) errors.push(`${file}: anchor markup must be well formed and closed`);

  for (const tag of startTags(text, "a")) {
    if (attribute(tag.source, "href") === null) {
      errors.push(`${file}: every anchor href must use a quoted value`);
    }
    if (/(?:^|\s)aria-labelledby\s*=/i.test(tag.attributes)) {
      errors.push(`${file}: storefront anchors must use self-contained accessible names`);
    }
  }
}

function elementByDataCopy(text, id) {
  const escapedId = escapeRegExp(id);
  const matches = [
    ...text.matchAll(
      new RegExp(
        `<([a-z][a-z0-9-]*)\\b[^>]*\\bdata-copy\\s*=\\s*(["'])${escapedId}\\2[^>]*>([\\s\\S]*?)<\\/\\1\\s*>`,
        "gi",
      ),
    ),
  ];
  return matches;
}

function allAnchors(text) {
  return [...text.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)].map((match) => ({
    accessibleLabel: attribute(match[1], "aria-label"),
    href: attribute(match[1], "href"),
    text: visibleText(match[2]),
    title: attribute(match[1], "title"),
  }));
}

function appStoreAnchors(text) {
  return allAnchors(text).filter(({ href }) => {
    if (!href) return false;
    try {
      return new URL(href).hostname.toLowerCase() === "apps.apple.com";
    } catch {
      return false;
    }
  });
}

function appStoreLikeAnchors(text) {
  return allAnchors(text).filter(({ accessibleLabel, href, text: anchorText, title }) => {
    let appleDestination = false;
    if (href) {
      try {
        const hostname = new URL(href).hostname.toLowerCase();
        appleDestination = hostname === "apple.com" || hostname.endsWith(".apple.com");
      } catch {
        appleDestination = false;
      }
    }
    const customerLabel = [accessibleLabel, anchorText, title].filter(Boolean).join(" ");
    return appleDestination || /\b(?:app\s*store|download|install)\b/i.test(customerLabel);
  });
}

function canonicalLinks(text) {
  return [...text.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => ({
      href: attribute(match[0], "href"),
      rel: attribute(match[0], "rel"),
    }))
    .filter(({ rel }) => rel?.toLowerCase() === "canonical");
}

function extractWebsiteField(text, field, errors) {
  if (field.kind === "title" || field.kind === "h1") {
    const matches = tagMatches(text, field.kind === "title" ? "title" : "h1");
    if (matches.length !== 1) {
      errors.push(`${field.id}: ${field.file} must contain exactly one ${field.kind}`);
      return null;
    }
    return visibleText(matches[0][1]);
  }

  if (field.kind === "metaDescription") {
    const matches = [...text.matchAll(/<meta\b[^>]*>/gi)].filter(
      (match) => attribute(match[0], "name")?.toLowerCase() === "description",
    );
    if (matches.length !== 1) {
      errors.push(`${field.id}: ${field.file} must contain exactly one meta description`);
      return null;
    }
    return attribute(matches[0][0], "content");
  }

  if (field.kind === "dataCopy") {
    const matches = elementByDataCopy(text, field.id);
    if (matches.length !== 1) {
      errors.push(`${field.id}: ${field.file} must contain exactly one assigned copy element`);
      return null;
    }
    return visibleText(matches[0][3]);
  }

  if (field.kind === "appStoreCta") {
    const anchors = appStoreAnchors(text);
    if (anchors.length !== 1 || anchors[0].href !== appStoreUrl) {
      errors.push(`${field.id}: ${field.file} must contain the exact direct App Store CTA`);
      return null;
    }
    const accessibleName = anchors[0].accessibleLabel ?? anchors[0].text;
    if (
      accessibleName !== field.value ||
      (anchors[0].title !== null && anchors[0].title !== field.value)
    ) {
      errors.push(`${field.id}: ${field.file} CTA accessible name must match the approved label`);
    }
    return anchors[0].text;
  }

  errors.push(`${field.id}: unsupported audit field kind`);
  return null;
}

function parseJsonc(text) {
  let stripped = "";
  let inString = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (inString) {
      stripped += character;
      if (character === "\\") {
        index += 1;
        stripped += text[index] ?? "";
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') {
      inString = true;
      stripped += character;
      continue;
    }
    if (character === "/" && next === "/") {
      index += 2;
      while (index < text.length && text[index] !== "\n") index += 1;
      stripped += "\n";
      continue;
    }
    if (character === "/" && next === "*") {
      index += 2;
      let closed = false;
      while (index < text.length) {
        if (text[index] === "\n") stripped += "\n";
        if (text[index] === "*" && text[index + 1] === "/") {
          index += 1;
          closed = true;
          break;
        }
        index += 1;
      }
      if (!closed) throw new SyntaxError("unterminated block comment");
      continue;
    }
    stripped += character;
  }
  if (inString) throw new SyntaxError("unterminated string");

  let normalized = "";
  inString = false;
  for (let index = 0; index < stripped.length; index += 1) {
    const character = stripped[index];
    if (inString) {
      normalized += character;
      if (character === "\\") {
        index += 1;
        normalized += stripped[index] ?? "";
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') {
      inString = true;
      normalized += character;
      continue;
    }
    if (character === ",") {
      let lookahead = index + 1;
      while (/\s/.test(stripped[lookahead] ?? "")) lookahead += 1;
      if (stripped[lookahead] === "}" || stripped[lookahead] === "]") continue;
    }
    normalized += character;
  }
  return JSON.parse(normalized);
}

function auditWrangler(text, errors) {
  let config;
  try {
    config = parseJsonc(text);
  } catch (error) {
    errors.push(`wrangler: sites/trueohm/wrangler.jsonc is not parseable (${error.message})`);
    return;
  }

  if (config.name !== "trueohm") {
    errors.push('wrangler: Worker name must be exactly "trueohm"');
  }
  if (config.assets?.html_handling !== "auto-trailing-slash") {
    errors.push('wrangler: assets.html_handling must be exactly "auto-trailing-slash"');
  }
  if (config.assets?.directory !== "./public") {
    errors.push('wrangler: assets.directory must be exactly "./public"');
  }
  if (
    !Array.isArray(config.routes) ||
    config.routes.length !== 1 ||
    config.routes[0]?.pattern !== "ohm.509electric.com" ||
    config.routes[0]?.custom_domain !== true ||
    Object.keys(config.routes[0] ?? {})
      .sort()
      .join(",") !== "custom_domain,pattern"
  ) {
    errors.push('wrangler: routes must contain only the custom domain "ohm.509electric.com"');
  }
}

function auditPackage(text, errors) {
  let packageJson;
  try {
    packageJson = JSON.parse(text);
  } catch (error) {
    errors.push(`package.json: could not parse JSON (${error.message})`);
    return;
  }
  if (
    packageJson.scripts?.["storefront:preflight"] !== "node scripts/storefront-copy-preflight.mjs"
  ) {
    errors.push("package.json: storefront:preflight must run the fail-closed gate");
  }
  const testScript = packageJson.scripts?.test ?? "";
  if (testScript !== "node --test scripts/storefront-copy-preflight.test.mjs && pnpm -r test") {
    errors.push("package.json: root test must run storefront Node tests and workspace tests");
  }
}

function auditHtmlInventory(root, errors) {
  try {
    const actual = readdirSync(resolve(root, "sites/trueohm/public"))
      .filter((name) => name.toLowerCase().endsWith(".html"))
      .sort();
    const expected = ["index.html", "privacy.html", "support.html", "terms.html"];
    if (actual.join("\n") !== expected.join("\n")) {
      errors.push(
        `HTML inventory: expected exactly ${expected.join(", ")}; found ${actual.join(", ")}`,
      );
    }
  } catch (error) {
    errors.push(`HTML inventory: could not read sites/trueohm/public (${error.message})`);
  }
}

function auditMarkerInventory(documents, errors) {
  const expected = markerFields.map(([id]) => id).sort();
  const starts = [];
  const ends = [];
  for (const [, text] of documents) {
    if (text === null) continue;
    for (const match of text.matchAll(
      /<!--\s*((?:aso|copy):trueohm\.[^\s]+?):(start|end)\s*-->/gi,
    )) {
      (match[2].toLowerCase() === "start" ? starts : ends).push(match[1]);
    }
  }
  starts.sort();
  ends.sort();
  if (starts.join("\n") !== expected.join("\n") || ends.join("\n") !== expected.join("\n")) {
    errors.push("packet marker inventory: expected exactly the 17 document-backed packet values");
  }
}

function auditDataCopyInventory(pages, errors) {
  const expected = websiteFields
    .filter(({ kind }) => kind === "dataCopy")
    .map(({ file, id }) => `${file}\0${id}`)
    .sort();
  const actual = [];
  for (const [file, text] of pages) {
    if (text === null) continue;
    for (const tag of startTags(text)) {
      const id = attribute(tag.source, "data-copy");
      if (id !== null) actual.push(`${file}\0${id}`);
      else if (/\bdata-copy\s*=/i.test(tag.source)) {
        errors.push(`${file}: data-copy values must use quoted exact marker ids`);
      }
    }
  }
  actual.sort();
  if (actual.join("\n") !== expected.join("\n")) {
    errors.push("website marker inventory: expected exactly the assigned data-copy values");
  }
}

function auditCanonicalLinks(pages, errors) {
  for (const [file, expected] of canonicalByPage) {
    const text = pages.get(file);
    if (text === null) continue;
    const links = canonicalLinks(text);
    if (links.length !== 1 || links[0].href !== expected) {
      errors.push(`${file}: canonical URL must be exactly ${expected}`);
    }
  }
}

function auditAppStoreAnchors(pages, errors) {
  let total = 0;
  for (const file of pageFiles) {
    const text = pages.get(file);
    if (text === null) continue;
    const anchors = appStoreLikeAnchors(text);
    total += anchors.length;
    if (file === pageFiles[0]) {
      if (anchors.length !== 1 || anchors[0].href !== appStoreUrl) {
        errors.push(`${file}: homepage must contain exactly one direct App Store anchor`);
      }
    } else if (anchors.length !== 0) {
      errors.push(`${file}: App Store anchors are allowed only on the homepage`);
    }
  }
  if (total !== 1) {
    errors.push("App Store anchors: customer-facing pages must contain exactly one");
  }
}

function auditStylesheets(pages, errors) {
  for (const [file, text] of pages) {
    if (text === null) continue;
    const stylesheets = [...text.matchAll(/<link\b[^>]*>/gi)]
      .map((match) => ({
        disabled: /(?:^|\s)disabled(?:\s|=|\/>|>)/i.test(match[0]),
        href: attribute(match[0], "href"),
        media: attribute(match[0], "media"),
        rel: attribute(match[0], "rel"),
      }))
      .filter(({ rel }) => rel?.toLowerCase() === "stylesheet");
    if (
      stylesheets.length !== 1 ||
      stylesheets[0].disabled ||
      stylesheets[0].href !== "/style.css" ||
      stylesheets[0].media !== null
    ) {
      errors.push(`${file}: stylesheet must be exactly /style.css`);
    }
  }
}

function auditLocalNavigation(pages, errors) {
  const localRoutes = new Set(["/", "/privacy", "/support", "/terms"]);
  for (const [file, text] of pages) {
    if (text === null) continue;
    for (const { href } of allAnchors(text)) {
      if (href === null) continue;
      if (href.startsWith("/") && !localRoutes.has(href)) {
        errors.push(`${file}: local link does not map to a static route: ${href}`);
      } else if (!href.startsWith("/") && !/^(?:https?:\/\/|mailto:|tel:)/i.test(href)) {
        errors.push(`${file}: local links must use exact extensionless absolute routes: ${href}`);
      }
    }
  }
}

function auditProhibitedCopy(documents, errors) {
  const patterns = [
    [
      /\b(?:more|other|recommended)\s+apps?\b|\bapp-grid\b|\bTry\s+True(?:Line|Fault|Phase|Motor|Fill)\b/i,
      "multi-app recommendation copy",
    ],
    [
      /<a\b[^>]*href\s*=\s*["']#["'][^>]*>[\s\S]*?(?:App Store|download|install)[\s\S]*?<\/a>/i,
      "placeholder App Store destination",
    ],
    [
      /\b(?:usually\s+)?within\s+(?:one|\d+)\s+(?:business\s+)?(?:hour|day|week)s?\b/i,
      "unsupported response-time promise",
    ],
    [
      /\b(?:data never leaves|every calculation (?:you make )?stays on your device)\b/i,
      "absolute local-data claim",
    ],
    [
      /\b(?:annual(?:ly)?|monthly|yearly|recurring|auto-renew(?:ing|able)?)\s+(?:subscription|plan|billing|charge|access)\b|\bsubscription\s+(?:plan|price|purchase|billing|renews?|includes?|unlocks?)\b|\b(?:subscribe|automatically\s+renewable|free\s+trial|billed\s+(?:monthly|yearly|annually))\b|\$\s*\d+(?:\.\d{1,2})?\s*(?:\/|per\s+)(?:month|year)\b/i,
      "recurring-commerce sales language",
    ],
    [
      /\b(?:renews?\s+(?:(?:every|each)\s+)?(?:month(?:ly)?|year(?:ly)?|annual(?:ly)?)|auto-?renews?|automatically\s+renews?|(?:annual|monthly|yearly)\s+membership|recurring\s+(?:payment|charge|billing|plan|access|membership))\b/i,
      "recurring-commerce sales language",
    ],
    [
      /(?:[$â‚¬€£]\s*\d|\b(?:USD|EUR|GBP|CAD|AUD)\s*\d|\b\d+(?:[.,]\d{1,2})?\s*(?:USD|EUR|GBP|CAD|AUD)\b)/i,
      "numeric purchase price",
    ],
    [/\bcom\.fiveohninelectric\.[a-z0-9_.-]+\.(?:monthly|yearly)\b/i, "retired product identifier"],
  ];

  for (const [file, text] of documents) {
    if (text === null) continue;
    const auditedText = decodeEntities(text);
    for (const [pattern, label] of patterns) {
      if (pattern.test(auditedText)) errors.push(`${file}: prohibited ${label} is present`);
    }
  }
}

function auditStylesheetSource(text, errors) {
  const renderedCss = text.replace(/\/\*[\s\S]*?(?:\*\/|$)/g, " ");
  if (
    /(?:^|[;{])\s*(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\.0*)?)\s*(?:!\s*important)?\s*(?:;|})/im.test(
      renderedCss,
    )
  ) {
    errors.push("sites/trueohm/public/style.css: storefront content must remain render-visible");
  }
}

export function auditRepository(root = repositoryRoot) {
  const errors = [];
  if (packetFields.length !== 29) {
    errors.push(`packet inventory: expected 29 values, configured ${packetFields.length}`);
  }

  const files = new Map(requiredFiles.map((file) => [file, readStrictUtf8(root, file, errors)]));
  auditHtmlInventory(root, errors);

  const listing = files.get(listingFile);
  const storyboard = files.get(storyboardFile);
  const documentSources = [
    [listingFile, listing],
    [storyboardFile, storyboard],
  ];
  auditMarkerInventory(documentSources, errors);

  for (const [id, file, expected] of markerFields) {
    const text = files.get(file);
    if (text === null) continue;
    const actual = markerValue(text, id, file, errors);
    if (actual !== null && actual !== expected) {
      errors.push(`${id}: ${file} does not contain the exact approved value`);
    }
  }

  if (
    listing !== null &&
    !listing.includes(
      "No replacement is proposed because no active source-backed release note exists. Draft it only with the next reviewed binary change.",
    )
  ) {
    errors.push("What's New: listing must retain the explicit no-candidate boundary");
  }

  const rawPages = new Map(pageFiles.map((file) => [file, files.get(file)]));
  for (const [file, text] of rawPages) {
    if (text !== null) auditHtmlStructure(file, text, errors);
  }
  const pages = new Map(
    [...rawPages].map(([file, text]) => [file, text === null ? null : renderedHtml(text)]),
  );
  auditDataCopyInventory(pages, errors);
  for (const field of websiteFields) {
    const text = pages.get(field.file);
    if (text === null) continue;
    const actual = extractWebsiteField(text, field, errors);
    if (actual !== null && actual !== field.value) {
      errors.push(`${field.id}: ${field.file} does not contain the exact approved visible copy`);
    }
  }

  auditCanonicalLinks(pages, errors);
  auditAppStoreAnchors(pages, errors);
  auditStylesheets(pages, errors);
  auditLocalNavigation(pages, errors);
  if (files.get("sites/trueohm/public/style.css") !== null) {
    auditStylesheetSource(files.get("sites/trueohm/public/style.css"), errors);
  }
  if (files.get("sites/trueohm/wrangler.jsonc") !== null) {
    auditWrangler(files.get("sites/trueohm/wrangler.jsonc"), errors);
  }
  if (files.get("package.json") !== null) {
    auditPackage(files.get("package.json"), errors);
  }
  auditProhibitedCopy([...documentSources, ...pages], errors);

  return errors;
}

export function runCli() {
  const errors = auditRepository();
  for (const error of errors) console.error(error);
  if (errors.length === 0) console.log("storefront copy preflight passed (29 values)");
  return errors.length === 0 ? 0 : 1;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  process.exitCode = runCli();
}
