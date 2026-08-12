import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const requiredFiles = [
  "package.json",
  "docs/app-store/listing.md",
  "docs/app-store/screenshots/storyboard.md",
  "sites/trueohm/public/index.html",
  "sites/trueohm/public/support.html",
  "sites/trueohm/public/privacy.html",
  "sites/trueohm/public/terms.html",
  "sites/trueohm/public/style.css",
  "sites/trueohm/wrangler.jsonc",
];

let modulePromise;

async function loadAudit() {
  try {
    modulePromise ??= import("./storefront-copy-preflight.mjs");
    const module = await modulePromise;
    assert.equal(
      typeof module.auditRepository,
      "function",
      "storefront preflight must export auditRepository(root)",
    );
    return module.auditRepository;
  } catch (error) {
    assert.fail(`storefront copy preflight contract is missing: ${error.code ?? error.message}`);
  }
}

function makeFixture(t) {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "trueohm-storefront-"));
  t.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

  for (const file of requiredFiles) {
    const destination = join(fixtureRoot, file);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(root, file), destination);
  }

  return fixtureRoot;
}

function replaceOnce(fixtureRoot, file, expected, replacement) {
  const filePath = join(fixtureRoot, file);
  const source = readFileSync(filePath, "utf8");
  assert.ok(source.includes(expected), `${file} fixture is missing expected text`);
  writeFileSync(filePath, source.replace(expected, replacement), "utf8");
}

function marker(id, value) {
  return `<!-- ${id}:start -->\n${value}\n<!-- ${id}:end -->`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mutatePacketValue(fixtureRoot, id, file) {
  const filePath = join(fixtureRoot, file);
  const source = readFileSync(filePath, "utf8");
  let pattern;

  if (!id.startsWith("copy:trueohm.website.")) {
    pattern = new RegExp(`(<!--\\s*${escapeRegExp(id)}:start\\s*-->)`, "i");
  } else if (id === "copy:trueohm.website.title") {
    pattern = /(<title\b[^>]*>)/i;
  } else if (id === "copy:trueohm.website.meta") {
    pattern = /(<meta\b(?=[^>]*\bname=["']description["'])[^>]*\bcontent=["'])/i;
  } else if (id === "copy:trueohm.website.hero") {
    pattern = /(<h1\b[^>]*>)/i;
  } else if (id === "copy:trueohm.website.cta") {
    pattern = /(<a\b[^>]*href=["']https:\/\/apps\.apple\.com\/app\/id6772605137["'][^>]*>)/i;
  } else {
    pattern = new RegExp(
      `(<[a-z][a-z0-9-]*\\b[^>]*\\bdata-copy=["']${escapeRegExp(id)}["'][^>]*>)`,
      "i",
    );
  }

  assert.match(source, pattern, `${file} fixture is missing ${id}`);
  writeFileSync(filePath, source.replace(pattern, "$1X"), "utf8");
}

const description = `Solve everyday electrical formulas and see the math behind every answer.

Enter any two values in the Ohm's Law wheel to solve volts, amps, resistance, and watts. Calculate single-phase and three-phase AC power, work with kW, kVA, power factor, and the power triangle, estimate energy cost, and check efficiency.

Every result shows the formula with your values substituted, plus plain-language warnings when an input is outside a practical range.

TrueOhm is completely free, with no ads, in-app purchases, subscription, or account. Calculations run on your device and work offline.

TrueOhm is a calculation aid for qualified professionals. Always verify results before relying on them.`;

const packetMutations = [
  ["aso:trueohm.name", "docs/app-store/listing.md", marker("aso:trueohm.name", "TrueOhm")],
  [
    "aso:trueohm.subtitle",
    "docs/app-store/listing.md",
    marker("aso:trueohm.subtitle", "Ohm's Law & 3-Phase Power"),
  ],
  [
    "aso:trueohm.promotional",
    "docs/app-store/listing.md",
    marker(
      "aso:trueohm.promotional",
      "Free electrical formulas for Ohm's Law, single- and three-phase AC power, power factor, energy cost, and efficiency—with the math shown.",
    ),
  ],
  [
    "aso:trueohm.keywords",
    "docs/app-store/listing.md",
    marker(
      "aso:trueohm.keywords",
      "electrical,calculator,volts,amps,resistance,watts,kVA,kW,factor,efficiency,energy,triangle",
    ),
  ],
  [
    "aso:trueohm.description",
    "docs/app-store/listing.md",
    marker("aso:trueohm.description", description),
  ],
  [
    "copy:trueohm.category.primary",
    "docs/app-store/listing.md",
    marker("copy:trueohm.category.primary", "Utilities"),
  ],
  [
    "copy:trueohm.category.secondary",
    "docs/app-store/listing.md",
    marker("copy:trueohm.category.secondary", "No secondary category"),
  ],
  [
    "copy:trueohm.reserve",
    "docs/app-store/listing.md",
    marker("copy:trueohm.reserve", "impedance,current,voltage,formula,three wire"),
  ],
  [
    "copy:trueohm.url.marketing",
    "docs/app-store/listing.md",
    marker("copy:trueohm.url.marketing", "https://ohm.509electric.com"),
  ],
  [
    "copy:trueohm.url.support",
    "docs/app-store/listing.md",
    marker("copy:trueohm.url.support", "https://ohm.509electric.com/support"),
  ],
  [
    "copy:trueohm.url.privacy",
    "docs/app-store/listing.md",
    marker("copy:trueohm.url.privacy", "https://ohm.509electric.com/privacy"),
  ],
  [
    "copy:trueohm.url.terms",
    "docs/app-store/listing.md",
    marker("copy:trueohm.url.terms", "https://ohm.509electric.com/terms"),
  ],
  [
    "copy:trueohm.website.title",
    "sites/trueohm/public/index.html",
    `<title>TrueOhm | Ohm's Law and Electrical Calculator</title>`,
  ],
  [
    "copy:trueohm.website.meta",
    "sites/trueohm/public/index.html",
    `content="Solve Ohm's Law, single- and three-phase AC power, power factor, energy cost, and efficiency with the formula shown for every result."`,
  ],
  [
    "copy:trueohm.website.hero",
    "sites/trueohm/public/index.html",
    `<h1>Ohm's Law, with the math shown.</h1>`,
  ],
  [
    "copy:trueohm.website.support",
    "sites/trueohm/public/index.html",
    "Solve everyday electrical formulas, see your values in the equation, and check plain-language warnings before relying on a result.",
  ],
  [
    "copy:trueohm.website.cta",
    "sites/trueohm/public/index.html",
    '<a class="btn primary" href="https://apps.apple.com/app/id6772605137">Download free on the App Store →</a>',
  ],
  [
    "copy:trueohm.website.features",
    "sites/trueohm/public/index.html",
    "<li>Solve volts, amps, resistance, and watts with Ohm's Law.</li>",
  ],
  [
    "copy:trueohm.website.commerce",
    "sites/trueohm/public/index.html",
    "TrueOhm is completely free, with no ads, in-app purchases, subscription, or account. There is nothing recurring.",
  ],
  [
    "copy:trueohm.website.local",
    "sites/trueohm/public/index.html",
    "Calculations run on your device and work offline. Values or settings in device backups are handled by the backup services you choose.",
  ],
  [
    "copy:trueohm.website.qualification",
    "sites/trueohm/public/index.html",
    "TrueOhm is a calculation aid for qualified professionals. Verify results, equipment information, and application requirements before relying on an answer.",
  ],
  [
    "copy:trueohm.website.support_correction",
    "sites/trueohm/public/support.html",
    "TrueOhm is free to use, requires no account, and works offline. It has no purchases to restore and nothing recurring to manage.",
  ],
  [
    "copy:trueohm.website.privacy_correction",
    "sites/trueohm/public/privacy.html",
    "TrueOhm performs calculations on your device. Settings or values included in a device backup are handled by the backup services you choose.",
  ],
  [
    "copy:trueohm.website.terms_correction",
    "sites/trueohm/public/terms.html",
    "TrueOhm is provided free of charge with no in-app purchases or subscription. Results are calculation aids that you must verify for your application.",
  ],
  [
    "copy:trueohm.screenshot.1",
    "docs/app-store/screenshots/storyboard.md",
    marker("copy:trueohm.screenshot.1", "Solve Ohm's Law."),
  ],
  [
    "copy:trueohm.screenshot.2",
    "docs/app-store/screenshots/storyboard.md",
    marker("copy:trueohm.screenshot.2", "See the formula with your values."),
  ],
  [
    "copy:trueohm.screenshot.3",
    "docs/app-store/screenshots/storyboard.md",
    marker("copy:trueohm.screenshot.3", "Calculate single- and three-phase AC power."),
  ],
  [
    "copy:trueohm.screenshot.4",
    "docs/app-store/screenshots/storyboard.md",
    marker("copy:trueohm.screenshot.4", "Work with kW, kVA, and power factor."),
  ],
  [
    "copy:trueohm.screenshot.5",
    "docs/app-store/screenshots/storyboard.md",
    marker("copy:trueohm.screenshot.5", "Free, offline, and no account."),
  ],
];

test("the checked-in repository satisfies the complete storefront contract", async () => {
  const auditRepository = await loadAudit();
  assert.deepEqual(auditRepository(root), []);
});

test("legal pages retain horizontal gutters under the shared doc styles", () => {
  for (const file of [
    "sites/trueohm/public/support.html",
    "sites/trueohm/public/privacy.html",
    "sites/trueohm/public/terms.html",
  ]) {
    const html = readFileSync(join(root, file), "utf8");
    assert.match(
      html,
      /<main\s+class="doc">\s*<div\s+class="wrap">[\s\S]*<\/div>\s*<\/main>/,
      `${file} must put .wrap inside .doc so .doc does not override the horizontal padding`,
    );
  }
});

test("the gate protects every one of the 29 approved packet values in its assigned file", async (t) => {
  const auditRepository = await loadAudit();
  assert.equal(packetMutations.length, 29);
  assert.equal(new Set(packetMutations.map(([id]) => id)).size, 29);

  for (const [id, file] of packetMutations) {
    await t.test(id, () => {
      const fixtureRoot = makeFixture(t);
      mutatePacketValue(fixtureRoot, id, file);
      const errors = auditRepository(fixtureRoot);
      assert.ok(
        errors.some((error) => error.includes(id)),
        `${id} mutation was accepted:\n${errors.join("\n")}`,
      );
    });
  }
});

test("the required inventory fails closed for a missing page, stylesheet, and invalid UTF-8", async (t) => {
  const auditRepository = await loadAudit();

  await t.test("missing page", () => {
    const fixtureRoot = makeFixture(t);
    unlinkSync(join(fixtureRoot, "sites/trueohm/public/privacy.html"));
    assert.ok(
      auditRepository(fixtureRoot).some((error) =>
        error.includes("sites/trueohm/public/privacy.html"),
      ),
    );
  });

  await t.test("invalid UTF-8", () => {
    const fixtureRoot = makeFixture(t);
    const file = join(fixtureRoot, "sites/trueohm/public/support.html");
    const source = readFileSync(file);
    writeFileSync(file, Buffer.concat([source, Buffer.from([0xc3, 0x28])]));
    assert.ok(
      auditRepository(fixtureRoot).some(
        (error) => error.includes("sites/trueohm/public/support.html") && error.includes("UTF-8"),
      ),
    );
  });

  await t.test("missing shared stylesheet", () => {
    const fixtureRoot = makeFixture(t);
    unlinkSync(join(fixtureRoot, "sites/trueohm/public/style.css"));
    assert.ok(
      auditRepository(fixtureRoot).some(
        (error) => error.includes("sites/trueohm/public/style.css") && error.includes("missing"),
      ),
    );
  });
});

test("App Store links fail closed for a wrong ID, a duplicate, or a non-homepage anchor", async (t) => {
  const auditRepository = await loadAudit();

  await t.test("wrong Apple ID", () => {
    const fixtureRoot = makeFixture(t);
    replaceOnce(fixtureRoot, "sites/trueohm/public/index.html", "id6772605137", "id0000000000");
    assert.ok(auditRepository(fixtureRoot).some((error) => error.includes("App Store")));
  });

  await t.test("duplicate homepage anchor", () => {
    const fixtureRoot = makeFixture(t);
    replaceOnce(
      fixtureRoot,
      "sites/trueohm/public/index.html",
      "</main>",
      '<a href="https://apps.apple.com/app/id6772605137">Install again</a></main>',
    );
    assert.ok(auditRepository(fixtureRoot).some((error) => error.includes("exactly one")));
  });

  await t.test("anchor outside the homepage", () => {
    const fixtureRoot = makeFixture(t);
    replaceOnce(
      fixtureRoot,
      "sites/trueohm/public/support.html",
      "</main>",
      '<a href="https://apps.apple.com/app/id6772605137">Install</a></main>',
    );
    assert.ok(
      auditRepository(fixtureRoot).some(
        (error) =>
          error.includes("sites/trueohm/public/support.html") && error.includes("App Store"),
      ),
    );
  });

  await t.test("generic Apple download destination", () => {
    const fixtureRoot = makeFixture(t);
    replaceOnce(
      fixtureRoot,
      "sites/trueohm/public/index.html",
      "</main>",
      '<a href="https://www.apple.com/app-store/">Download on the App Store</a></main>',
    );
    assert.ok(auditRepository(fixtureRoot).some((error) => error.includes("App Store")));
  });

  await t.test("non-Apple download destination", () => {
    const fixtureRoot = makeFixture(t);
    replaceOnce(
      fixtureRoot,
      "sites/trueohm/public/index.html",
      "</main>",
      '<a href="https://example.com/download">Install TrueOhm</a></main>',
    );
    assert.ok(auditRepository(fixtureRoot).some((error) => error.includes("App Store")));
  });

  await t.test("placeholder destination hidden behind an accessible label", () => {
    const fixtureRoot = makeFixture(t);
    replaceOnce(
      fixtureRoot,
      "sites/trueohm/public/index.html",
      "</main>",
      '<a href="#" aria-label="Download on the App Store"><svg></svg></a></main>',
    );
    assert.ok(auditRepository(fixtureRoot).some((error) => error.includes("App Store")));
  });
});

test("Wrangler validation rejects wrong structure, extra routes, and wrong HTML handling", async (t) => {
  const auditRepository = await loadAudit();

  for (const [name, mutate] of [
    [
      "wrong worker",
      (config) => {
        config.name = "trueohm-preview";
      },
    ],
    [
      "extra route",
      (config) => {
        config.routes.push({ pattern: "www.example.com", custom_domain: true });
      },
    ],
    [
      "wrong HTML handling",
      (config) => {
        config.assets.html_handling = "none";
      },
    ],
    [
      "wrong static asset directory",
      (config) => {
        config.assets.directory = "./wrong";
      },
    ],
  ]) {
    await t.test(name, () => {
      const fixtureRoot = makeFixture(t);
      const file = join(fixtureRoot, "sites/trueohm/wrangler.jsonc");
      const config = JSON.parse(readFileSync(file, "utf8"));
      mutate(config);
      writeFileSync(file, JSON.stringify(config, null, 2), "utf8");
      assert.ok(auditRepository(fixtureRoot).some((error) => error.includes("wrangler")));
    });
  }
});

test("HTML comments cannot satisfy required semantic copy or links", async (t) => {
  const auditRepository = await loadAudit();
  const cases = [
    ["copy:trueohm.website.title", /<title\b[^>]*>[\s\S]*?<\/title>/i],
    ["copy:trueohm.website.meta", /<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i],
    ["copy:trueohm.website.hero", /<h1\b[^>]*>[\s\S]*?<\/h1>/i],
    [
      "copy:trueohm.website.local",
      /<[a-z][a-z0-9-]*\b[^>]*\bdata-copy=["']copy:trueohm\.website\.local["'][^>]*>[\s\S]*?<\/[a-z][a-z0-9-]*\s*>/i,
    ],
    [
      "App Store",
      /<a\b[^>]*href=["']https:\/\/apps\.apple\.com\/app\/id6772605137["'][^>]*>[\s\S]*?<\/a\s*>/i,
    ],
    ["canonical URL", /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i],
  ];

  for (const [expectedError, pattern] of cases) {
    await t.test(expectedError, () => {
      const fixtureRoot = makeFixture(t);
      const file = join(fixtureRoot, "sites/trueohm/public/index.html");
      const source = readFileSync(file, "utf8");
      assert.match(source, pattern);
      writeFileSync(
        file,
        source.replace(pattern, (match) => `<!-- ${match} -->`),
        "utf8",
      );
      assert.ok(
        auditRepository(fixtureRoot).some((error) => error.includes(expectedError)),
        `${expectedError} was satisfied by comment-only HTML`,
      );
    });
  }
});

test("non-rendered script and template content cannot satisfy required copy", async (t) => {
  const auditRepository = await loadAudit();
  const cases = [
    ["copy:trueohm.website.hero", /<h1\b[^>]*>[\s\S]*?<\/h1>/i, "script"],
    [
      "App Store",
      /<a\b[^>]*href=["']https:\/\/apps\.apple\.com\/app\/id6772605137["'][^>]*>[\s\S]*?<\/a\s*>/i,
      "template",
    ],
  ];

  for (const [expectedError, pattern, wrapper] of cases) {
    await t.test(`${wrapper} ${expectedError}`, () => {
      const fixtureRoot = makeFixture(t);
      const file = join(fixtureRoot, "sites/trueohm/public/index.html");
      const source = readFileSync(file, "utf8");
      assert.match(source, pattern);
      writeFileSync(
        file,
        source.replace(pattern, (match) => `<${wrapper}>${match}</${wrapper}>`),
        "utf8",
      );
      assert.ok(
        auditRepository(fixtureRoot).some((error) => error.includes(expectedError)),
        `${expectedError} was satisfied by non-rendered ${wrapper} content`,
      );
    });
  }
});

test("every page requires the shared stylesheet link", async (t) => {
  const auditRepository = await loadAudit();

  for (const page of ["index.html", "support.html", "privacy.html", "terms.html"]) {
    await t.test(page, () => {
      const fixtureRoot = makeFixture(t);
      replaceOnce(
        fixtureRoot,
        `sites/trueohm/public/${page}`,
        'href="/style.css"',
        'href="/missing.css"',
      );
      assert.ok(
        auditRepository(fixtureRoot).some(
          (error) => error.includes(page) && error.includes("stylesheet"),
        ),
      );
    });
  }
});

test("the gate rejects stale customer-facing claims while allowing approved negative commerce copy", async (t) => {
  const auditRepository = await loadAudit();
  const prohibited = [
    '<section class="app-grid">Try TruePhase too.</section>',
    '<a href="#">Download on the App Store</a>',
    "<p>We usually reply within one business day.</p>",
    "<p>Your data never leaves your device.</p>",
    "<p>Choose an annual subscription plan.</p>",
    "<p>This purchase is automatically renewable.</p>",
    "<p>Subscribe now.</p>",
    "<p>Monthly access.</p>",
    "<p>Free trial, then billed annually.</p>",
    "<p>Unlock every feature for $4.99.</p>",
    "<p>com.fiveohninelectric.trueohm.pro.monthly</p>",
  ];

  for (const staleCopy of prohibited) {
    await t.test(staleCopy, () => {
      const fixtureRoot = makeFixture(t);
      replaceOnce(fixtureRoot, "sites/trueohm/public/index.html", "</main>", `${staleCopy}</main>`);
      assert.notDeepEqual(auditRepository(fixtureRoot), []);
    });
  }
});

test("approved negative commerce statements remain valid in their assigned pages", async () => {
  const auditRepository = await loadAudit();
  const fixtureRoot = makeFixture({ after: () => {} });
  try {
    assert.deepEqual(auditRepository(fixtureRoot), []);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("browser-invalid or non-rendered HTML cannot satisfy the storefront contract", async (t) => {
  const auditRepository = await loadAudit();
  const page = "sites/trueohm/public/index.html";
  const mutations = [
    [
      "comment-split App Store href",
      'href="https://apps.apple.com/app/id6772605137"',
      'href<!--x-->="https://apps.apple.com/app/id6772605137"',
    ],
    ["comment-split canonical rel", 'rel="canonical"', 'rel<!--x-->="canonical"'],
    ["comment-split stylesheet rel", 'rel="stylesheet"', 'rel<!--x-->="stylesheet"'],
    ["hero inside noscript", "<h1>", "<noscript><h1>"],
    ["hero inside noscript close", "</h1>", "</h1></noscript>"],
    ["hidden main", '<main class="wrap">', '<main class="wrap" hidden>'],
    [
      "hidden CTA",
      '<a class="btn primary" href="https://apps.apple.com/app/id6772605137"',
      '<a class="btn primary" hidden href="https://apps.apple.com/app/id6772605137"',
    ],
    [
      "wrong CTA accessible label",
      '<a class="btn primary" href="https://apps.apple.com/app/id6772605137"',
      '<a class="btn primary" aria-label="Download on Google Play" href="https://apps.apple.com/app/id6772605137"',
    ],
    [
      "indirect CTA accessible label",
      '<a class="btn primary" href="https://apps.apple.com/app/id6772605137"',
      '<a class="btn primary" aria-labelledby="wrong-label" href="https://apps.apple.com/app/id6772605137"',
    ],
    [
      "data-href App Store decoy",
      'href="https://apps.apple.com/app/id6772605137"',
      'data-href="https://apps.apple.com/app/id6772605137"',
    ],
    [
      "duplicate CTA href",
      'href="https://apps.apple.com/app/id6772605137"',
      'href="https://apps.apple.com/app/id6772605137" href="https://example.com"',
    ],
    [
      "disabled stylesheet media",
      '<link rel="stylesheet" href="/style.css" />',
      '<link rel="stylesheet" href="/style.css" media="not all" />',
    ],
    [
      "disabled stylesheet",
      '<link rel="stylesheet" href="/style.css" />',
      '<link rel="stylesheet" href="/style.css" disabled />',
    ],
    [
      "competing canonical relation",
      "</head>",
      '<link rel="alternate canonical" href="https://example.com" /></head>',
    ],
    [
      "competing stylesheet relation",
      "</head>",
      '<link rel="alternate stylesheet" href="https://example.com/hide.css" /></head>',
    ],
  ];

  for (const [name, expected, replacement] of mutations) {
    await t.test(name, () => {
      const fixtureRoot = makeFixture(t);
      if (name === "hero inside noscript close") {
        replaceOnce(fixtureRoot, page, "<h1>", "<noscript><h1>");
      }
      replaceOnce(fixtureRoot, page, expected, replacement);
      assert.notDeepEqual(auditRepository(fixtureRoot), [], `${name} unexpectedly passed`);
    });
  }

  await t.test("global CSS hides the storefront", () => {
    const fixtureRoot = makeFixture(t);
    const css = "sites/trueohm/public/style.css";
    replaceOnce(fixtureRoot, css, ":root {", "* { display: none !important; }\n\n:root {");
    assert.notDeepEqual(auditRepository(fixtureRoot), [], "hidden storefront unexpectedly passed");
  });

  await t.test("comment-split CSS hides the storefront", () => {
    const fixtureRoot = makeFixture(t);
    const css = "sites/trueohm/public/style.css";
    replaceOnce(fixtureRoot, css, ":root {", "* { display/**/: none; }\n\n:root {");
    assert.notDeepEqual(auditRepository(fixtureRoot), [], "comment-split hidden CSS passed");
  });
});

test("every browser-visible App Store-like anchor is parsed and constrained", async (t) => {
  const auditRepository = await loadAudit();
  const page = "sites/trueohm/public/index.html";
  const mutations = [
    "<a href=https://apps.apple.com/app/id0000000000>Get it</a>",
    '<a href="https://apps.apple.com/app/id0000000000">Wrong app</a>',
  ];

  for (const markup of mutations) {
    await t.test(markup, () => {
      const fixtureRoot = makeFixture(t);
      if (markup.includes("Wrong app")) {
        replaceOnce(
          fixtureRoot,
          page,
          "Download free on the App Store",
          `Download free on the App Store ${markup}`,
        );
      } else {
        replaceOnce(fixtureRoot, page, "</main>", `${markup}</main>`);
      }
      assert.notDeepEqual(auditRepository(fixtureRoot), [], "wrong App Store anchor passed");
    });
  }
});

test("commerce, price, and retired-product variants fail closed", async (t) => {
  const auditRepository = await loadAudit();
  const prohibited = [
    "Renews every month.",
    "Annual membership.",
    "Recurring payment.",
    "Auto-renews each month.",
    "Automatically renews annually.",
    "This purchase renews monthly.",
    "Unlock for 4.99 USD.",
    "Unlock for USD 4.99.",
    "Unlock for â‚¬4.99.",
    "com.fiveohninelectric.truephase.pro.monthly",
    "com&#46;fiveohninelectric&#46;truephase&#46;pro&#46;monthly",
  ];

  for (const copy of prohibited) {
    await t.test(copy, () => {
      const fixtureRoot = makeFixture(t);
      replaceOnce(
        fixtureRoot,
        "sites/trueohm/public/index.html",
        "</main>",
        `<p>${copy}</p></main>`,
      );
      assert.notDeepEqual(auditRepository(fixtureRoot), [], `${copy} unexpectedly passed`);
    });
  }
});

test("marker inventory rejects unknown, hyphenated, duplicate, and wrong-page copy ids", async (t) => {
  const auditRepository = await loadAudit();
  const mutations = [
    [
      "docs/app-store/listing.md",
      "## Publication blockers",
      "<!-- copy:trueohm.unknown-field:start -->X<!-- copy:trueohm.unknown-field:end -->\n\n## Publication blockers",
    ],
    [
      "sites/trueohm/public/index.html",
      "</main>",
      '<p data-copy="copy:trueohm.website.unknown-field">X</p></main>',
    ],
    [
      "sites/trueohm/public/support.html",
      "</main>",
      '<p data-copy="copy:trueohm.website.local">Duplicate on wrong page</p></main>',
    ],
  ];

  for (const [file, expected, replacement] of mutations) {
    await t.test(file + replacement, () => {
      const fixtureRoot = makeFixture(t);
      replaceOnce(fixtureRoot, file, expected, replacement);
      assert.notDeepEqual(auditRepository(fixtureRoot), [], "marker inventory drift passed");
    });
  }
});

test("package wiring must execute both real test commands", async () => {
  const auditRepository = await loadAudit();
  const fixtureRoot = makeFixture({ after: () => {} });
  try {
    replaceOnce(
      fixtureRoot,
      "package.json",
      '"test": "node --test scripts/storefront-copy-preflight.test.mjs && pnpm -r test"',
      '"test": "echo node --test scripts/storefront-copy-preflight.test.mjs && echo pnpm -r test"',
    );
    assert.notDeepEqual(auditRepository(fixtureRoot), [], "echo-only test wiring passed");
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("local links must use exact extensionless absolute routes", async () => {
  const auditRepository = await loadAudit();
  const fixtureRoot = makeFixture({ after: () => {} });
  try {
    replaceOnce(
      fixtureRoot,
      "sites/trueohm/public/index.html",
      'href="/support"',
      'href="support"',
    );
    assert.notDeepEqual(auditRepository(fixtureRoot), [], "relative local route passed");
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("Wrangler JSONC parsing honors comments only outside strings", async (t) => {
  const auditRepository = await loadAudit();
  const file = "sites/trueohm/wrangler.jsonc";

  await t.test("comment text cannot repair a wrong string value", () => {
    const fixtureRoot = makeFixture(t);
    replaceOnce(fixtureRoot, file, '"trueohm"', '"tr/*hidden*/ueohm"');
    assert.notDeepEqual(
      auditRepository(fixtureRoot),
      [],
      "comment-like string repaired wrong value",
    );
  });

  await t.test("valid inline line comments remain parseable", () => {
    const fixtureRoot = makeFixture(t);
    replaceOnce(
      fixtureRoot,
      file,
      '"compatibility_date": "2025-01-01",',
      '"compatibility_date": "2025-01-01", // pinned Worker runtime',
    );
    assert.deepEqual(auditRepository(fixtureRoot), []);
  });
});

test("listing has no invented What’s New candidate and root test runs this contract", async () => {
  const auditRepository = await loadAudit();
  const fixtureRoot = makeFixture({ after: () => {} });
  try {
    replaceOnce(
      fixtureRoot,
      "docs/app-store/listing.md",
      "No replacement is proposed because no active source-backed release note exists. Draft it only with the next reviewed binary change.",
      "Bug fixes and performance improvements.",
    );
    assert.ok(auditRepository(fixtureRoot).some((error) => error.includes("What's New")));
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }

  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(
    packageJson.scripts["storefront:preflight"],
    "node scripts/storefront-copy-preflight.mjs",
  );
  assert.match(
    packageJson.scripts.test,
    /node --test scripts\/storefront-copy-preflight\.test\.mjs/,
  );
  assert.match(packageJson.scripts.test, /pnpm -r test/);
});

test("the command-line preflight exits cleanly for the checked-in repository", async () => {
  await loadAudit();
  const output = execFileSync(process.execPath, ["scripts/storefront-copy-preflight.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.match(output, /storefront copy preflight passed/);
});
