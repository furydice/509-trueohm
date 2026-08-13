import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const repositoryRoot = resolve(import.meta.dirname, "..");
const moduleUrl = new URL("./native-evidence-preflight.mjs", import.meta.url);

let preflightModule;
try {
  preflightModule = await import(`${moduleUrl.href}?red=${Date.now()}`);
} catch {
  preflightModule = undefined;
}

const fixtureFiles = [
  "codemagic.yaml",
  "package.json",
  "apps/web/package.json",
  "apps/web/src/screens/ToolsScreen.tsx",
  "apps/web/ios/App/App.xcodeproj/project.pbxproj",
  "apps/web/ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme",
  "apps/web/ios/App/TrueOhmEvidenceUITests/TrueOhmEvidenceUITests.swift",
];

function requireExport(name) {
  assert.equal(
    typeof preflightModule?.[name],
    "function",
    `native evidence preflight export ${name} is not implemented`,
  );
  return preflightModule[name];
}

function makeRepositoryFixture(t) {
  const root = mkdtempSync(join(tmpdir(), "trueohm-native-contract-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const relative of fixtureFiles) {
    const source = join(repositoryRoot, relative);
    const target = join(root, relative);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(source));
  }
  return root;
}

function replaceOnce(root, relative, expected, replacement) {
  const file = join(root, relative);
  const source = readFileSync(file, "utf8");
  assert.ok(
    source.includes(expected),
    `${relative} fixture is missing ${JSON.stringify(expected)}`,
  );
  writeFileSync(file, source.replace(expected, replacement), "utf8");
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function flipChunkCrc(png, expectedType) {
  const corrupted = Buffer.from(png);
  let offset = 8;
  while (offset + 12 <= corrupted.length) {
    const length = corrupted.readUInt32BE(offset);
    const type = corrupted.toString("ascii", offset + 4, offset + 8);
    const crcOffset = offset + 8 + length;
    assert.ok(crcOffset + 4 <= corrupted.length, `fixture PNG ${type} chunk is truncated`);
    if (type === expectedType) {
      corrupted[crcOffset] ^= 0x01;
      return corrupted;
    }
    offset = crcOffset + 4;
  }
  assert.fail(`fixture PNG is missing ${expectedType}`);
}

function makePng(
  width,
  height,
  { black = false, colorType = 2, transparency = false, scene = 0, metadata } = {},
) {
  const channelsByType = new Map([
    [0, 1],
    [2, 3],
    [4, 2],
    [6, 4],
  ]);
  const channels = channelsByType.get(colorType);
  assert.ok(channels, `unsupported fixture color type ${colorType}`);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = colorType;
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * channels);
    for (let x = 0; x < width; x += 1) {
      const offset = 1 + x * channels;
      const light = black ? 0 : (x + y + scene) % 2 === 0 ? 32 + scene : 224 - scene;
      row[offset] = light;
      if (colorType === 2 || colorType === 6) {
        row[offset + 1] = black ? 0 : 180 - Math.floor(light / 3);
        row[offset + 2] = black ? 0 : 255 - light;
      }
      if (colorType === 4 || colorType === 6) row[offset + channels - 1] = 255;
    }
    rows.push(row);
  }
  const transparencyChunk = transparency
    ? [pngChunk("tRNS", colorType === 0 ? Buffer.alloc(2) : Buffer.alloc(6))]
    : [];
  const metadataChunk =
    metadata === undefined ? [] : [pngChunk("tEXt", Buffer.from(`scene\0${metadata}`, "latin1"))];
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", header),
    ...transparencyChunk,
    ...metadataChunk,
    pngChunk("IDAT", deflateSync(Buffer.concat(rows))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const frameNames = [
  "01-ohms-law",
  "02-show-work",
  "03-ac-power",
  "04-power-triangle",
  "05-free-offline-no-account",
];

const testDeviceContracts = {
  iphone: { name: "iPhone 17 Pro Max", width: 20, height: 40 },
  ipad: { name: "iPad Pro 13-inch (M5)", width: 30, height: 40 },
};

const pinnedSimulatorRuntime = "com.apple.CoreSimulator.SimRuntime.iOS-26-4";

function simulatorInventory({ duplicatePinnedIphone = false } = {}) {
  const pinnedDevices = [
    {
      name: "iPhone 17 Pro Max",
      udid: "PINNED-PHONE-UDID",
      isAvailable: true,
    },
    {
      name: "iPad Pro 13-inch (M5)",
      udid: "PINNED-IPAD-UDID",
      isAvailable: true,
    },
  ];
  if (duplicatePinnedIphone) {
    pinnedDevices.push({
      name: "iPhone 17 Pro Max",
      udid: "DUPLICATE-PHONE-UDID",
      isAvailable: true,
    });
  }
  return {
    devices: {
      "com.apple.CoreSimulator.SimRuntime.iOS-26-3": [
        {
          name: "iPhone 17 Pro Max",
          udid: "STALE-PHONE-UDID",
          isAvailable: true,
        },
        {
          name: "iPad Pro 13-inch (M5)",
          udid: "STALE-IPAD-UDID",
          isAvailable: true,
        },
      ],
      [pinnedSimulatorRuntime]: pinnedDevices,
    },
  };
}

function makeEvidenceFixture(t, { identicalScenes = false, uniqueMetadata = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "trueohm-native-artifacts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "logs"), { recursive: true });
  mkdirSync(join(root, "trueohm-iphone.xcresult"), { recursive: true });
  mkdirSync(join(root, "trueohm-ipad.xcresult"), { recursive: true });
  writeFileSync(join(root, "logs", "iphone-xcodebuild.log"), "iphone test passed\n");
  writeFileSync(join(root, "logs", "ipad-xcodebuild.log"), "ipad test passed\n");
  writeFileSync(join(root, "source-sha.txt"), `${"a".repeat(40)}\n`);
  writeFileSync(join(root, "xcode-version.txt"), "Xcode 26.4.1\nBuild version 17E202\n");
  writeFileSync(
    join(root, "simulator-contract.json"),
    `${JSON.stringify({
      iphone: {
        ...testDeviceContracts.iphone,
        udid: "PHONE-UDID",
        runtime: pinnedSimulatorRuntime,
      },
      ipad: {
        ...testDeviceContracts.ipad,
        udid: "IPAD-UDID",
        runtime: pinnedSimulatorRuntime,
      },
    })}\n`,
  );

  for (const [device, contract] of Object.entries(testDeviceContracts)) {
    const raw = join(root, `raw-${device}`);
    mkdirSync(raw, { recursive: true });
    const attachments = frameNames.map((name, index) => {
      const exportedFileName = `${device}-${index}.png`;
      writeFileSync(
        join(raw, exportedFileName),
        makePng(contract.width, contract.height, {
          scene: identicalScenes ? 0 : index,
          metadata: uniqueMetadata ? `${device}-${index}` : undefined,
        }),
      );
      return {
        exportedFileName,
        suggestedHumanReadableName: `${name}_0_${index}.png`,
      };
    });
    writeFileSync(
      join(raw, "manifest.json"),
      `${JSON.stringify([{ testIdentifier: "TrueOhmEvidenceUITests", attachments }])}\n`,
    );
  }
  return root;
}

test("simulator resolution ignores duplicate successor names outside the pinned iOS 26.4 runtime", () => {
  const resolveSimulatorContracts = requireExport("resolveSimulatorContracts");
  assert.deepEqual(resolveSimulatorContracts(simulatorInventory()), {
    iphone: {
      name: "iPhone 17 Pro Max",
      width: 1320,
      height: 2868,
      udid: "PINNED-PHONE-UDID",
      runtime: pinnedSimulatorRuntime,
    },
    ipad: {
      name: "iPad Pro 13-inch (M5)",
      width: 2064,
      height: 2752,
      udid: "PINNED-IPAD-UDID",
      runtime: pinnedSimulatorRuntime,
    },
  });
});

test("simulator resolution fails closed on duplicates inside the pinned runtime", () => {
  const resolveSimulatorContracts = requireExport("resolveSimulatorContracts");
  assert.throws(
    () => resolveSimulatorContracts(simulatorInventory({ duplicatePinnedIphone: true })),
    /exactly one.*iPhone 17 Pro Max.*iOS 26\.4|iPhone 17 Pro Max.*found 2/i,
  );
});

test("the resolver CLI writes the pinned contract and emits xcodebuild destinations by UDID", (t) => {
  const evidenceRoot = mkdtempSync(join(tmpdir(), "trueohm-simulator-resolution-"));
  t.after(() => rmSync(evidenceRoot, { recursive: true, force: true }));
  writeFileSync(join(evidenceRoot, "simulators.json"), `${JSON.stringify(simulatorInventory())}\n`);

  const resolveResult = spawnSync(
    process.execPath,
    [fileURLToPath(moduleUrl), "resolve-simulators", evidenceRoot],
    { encoding: "utf8" },
  );
  assert.equal(resolveResult.status, 0, resolveResult.stderr);
  assert.deepEqual(
    JSON.parse(readFileSync(join(evidenceRoot, "simulator-contract.json"), "utf8")),
    resolveSimulatorContractFixture(),
  );

  for (const [device, udid] of [
    ["iphone", "PINNED-PHONE-UDID"],
    ["ipad", "PINNED-IPAD-UDID"],
  ]) {
    const destinationResult = spawnSync(
      process.execPath,
      [fileURLToPath(moduleUrl), "destination", evidenceRoot, device],
      { encoding: "utf8" },
    );
    assert.equal(destinationResult.status, 0, destinationResult.stderr);
    assert.equal(destinationResult.stdout.trim(), `platform=iOS Simulator,id=${udid}`);
  }
});

function resolveSimulatorContractFixture() {
  return {
    iphone: {
      name: "iPhone 17 Pro Max",
      width: 1320,
      height: 2868,
      udid: "PINNED-PHONE-UDID",
      runtime: pinnedSimulatorRuntime,
    },
    ipad: {
      name: "iPad Pro 13-inch (M5)",
      width: 2064,
      height: 2752,
      udid: "PINNED-IPAD-UDID",
      runtime: pinnedSimulatorRuntime,
    },
  };
}

test("the evidence workflow pins Xcode, runtime, UDID destinations, and the remaining minute cap", () => {
  const codemagic = readFileSync(join(repositoryRoot, "codemagic.yaml"), "utf8");
  const evidence = codemagic.match(
    / {2}trueohm-ios-screenshot-evidence:[\s\S]*?(?=\n {2}trueohm-ios-testflight:)/,
  )?.[0];
  assert.ok(evidence, "TrueOhm evidence workflow is missing");
  assert.match(evidence, /\n\s+xcode: 26\.4\s*\n/);
  assert.match(evidence, /max_build_duration: 19/);
  assert.equal(11 + 19 + 45 + 45, 120, "configured maxima must include the 11 minutes used");
  assert.match(evidence, /resolve-simulators/);
  assert.match(evidence, /destination[^\n]*iphone/);
  assert.match(evidence, /destination[^\n]*ipad/);
  assert.doesNotMatch(evidence, /-destination ['"]platform=iOS Simulator,name=/);
});

test("the checked-in repository satisfies the complete native evidence contract", () => {
  const auditRepository = requireExport("auditRepository");
  assert.deepEqual(auditRepository(repositoryRoot), []);
});

test("candidate identity is locked across both manifests and both App build configurations", async (t) => {
  const auditRepository = requireExport("auditRepository");
  const mutations = [
    ["package.json", '"version": "1.0.1"', '"version": "1.0.0"', "root package version"],
    ["apps/web/package.json", '"version": "1.0.1"', '"version": "1.0.0"', "web package version"],
    [
      "apps/web/ios/App/App.xcodeproj/project.pbxproj",
      "MARKETING_VERSION = 1.0.1;",
      "MARKETING_VERSION = 1.0.0;",
      "Xcode marketing version",
    ],
    [
      "apps/web/ios/App/App.xcodeproj/project.pbxproj",
      "CURRENT_PROJECT_VERSION = 6;",
      "CURRENT_PROJECT_VERSION = 5;",
      "Xcode build number",
    ],
  ];

  for (const [file, expected, replacement, label] of mutations) {
    await t.test(label, () => {
      const root = makeRepositoryFixture(t);
      replaceOnce(root, file, expected, replacement);
      assert.notDeepEqual(auditRepository(root), []);
    });
  }
});

test("the UI test target has a unique bundle, host dependency, scheme testable, and five hard frames", async (t) => {
  const auditRepository = requireExport("auditRepository");
  const mutations = [
    [
      "apps/web/ios/App/App.xcodeproj/project.pbxproj",
      "com.apple.product-type.bundle.ui-testing",
      "com.apple.product-type.bundle.unit-test",
    ],
    [
      "apps/web/ios/App/App.xcodeproj/project.pbxproj",
      "PRODUCT_BUNDLE_IDENTIFIER = com.fiveohninelectric.trueohm.evidenceuitests;",
      "PRODUCT_BUNDLE_IDENTIFIER = com.fiveohninelectric.trueohm;",
    ],
    [
      "apps/web/ios/App/App.xcodeproj/project.pbxproj",
      "TEST_TARGET_NAME = App;",
      "TEST_TARGET_NAME = MissingHost;",
    ],
    [
      "apps/web/ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme",
      'BlueprintName = "TrueOhmEvidenceUITests"',
      'BlueprintName = "MissingEvidenceTests"',
    ],
    [
      "apps/web/ios/App/TrueOhmEvidenceUITests/TrueOhmEvidenceUITests.swift",
      'capture("05-free-offline-no-account")',
      'capture("05-skipped")',
    ],
    [
      "apps/web/ios/App/TrueOhmEvidenceUITests/TrueOhmEvidenceUITests.swift",
      "modeSwitcher.swipeLeft()",
      "app.webViews.firstMatch.swipeLeft()",
    ],
    [
      "apps/web/ios/App/TrueOhmEvidenceUITests/TrueOhmEvidenceUITests.swift",
      "modeSwitcher.descendants(matching: .any)",
      "modeSwitcher.buttons",
    ],
    [
      "apps/web/ios/App/TrueOhmEvidenceUITests/TrueOhmEvidenceUITests.swift",
      "mode.tap()",
      "mode.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()",
    ],
    [
      "apps/web/ios/App/TrueOhmEvidenceUITests/TrueOhmEvidenceUITests.swift",
      'NSPredicate(format: "value == %@", "1")',
      'NSPredicate(format: "value == %@", "0")',
    ],
    [
      "apps/web/ios/App/TrueOhmEvidenceUITests/TrueOhmEvidenceUITests.swift",
      'staticText(labeled: "REAL POWER")',
      'element(labeled: "Real Power")',
    ],
  ];

  for (const [file, expected, replacement] of mutations) {
    await t.test(`${file}: ${expected}`, () => {
      const root = makeRepositoryFixture(t);
      replaceOnce(root, file, expected, replacement);
      assert.notDeepEqual(auditRepository(root), []);
    });
  }
});

test("each UI evidence scene forces portrait and explicitly rewrites persistent state to dark", () => {
  const uiTests = readFileSync(
    join(repositoryRoot, "apps/web/ios/App/TrueOhmEvidenceUITests/TrueOhmEvidenceUITests.swift"),
    "utf8",
  );
  for (const [required, label] of [
    ["XCUIDevice.shared.orientation = .portrait", "portrait orientation lock"],
    ['"-ApplePersistenceIgnoreState", "YES"', "state-restoration reset"],
    ["resetPersistentEvidenceState()", "per-scene persistent-state reset"],
    ['button(labeled: "Switch to light mode")', "dark-theme state detection"],
    ['button(labeled: "Switch to dark mode")', "explicit persisted dark-theme action"],
  ]) {
    assert.ok(uiTests.includes(required), `${label} is missing`);
  }
});

test("mode navigation uses an exact type-agnostic scoped query with swipe-requery fallback", () => {
  const uiTests = readFileSync(
    join(repositoryRoot, "apps/web/ios/App/TrueOhmEvidenceUITests/TrueOhmEvidenceUITests.swift"),
    "utf8",
  );
  const tapMode = uiTests.slice(
    uiTests.indexOf("private func tapMode"),
    uiTests.indexOf("private func scrollUntilHittable"),
  );
  assert.match(tapMode, /let modeSwitcher = element\(labeled: "Calculator mode"\)/);
  assert.match(tapMode, /modeSwitcher\.descendants\(matching: \.any\)/);
  assert.doesNotMatch(tapMode, /(?:app|modeSwitcher)\.buttons/);
  assert.match(tapMode, /NSPredicate\(format: "label == %@", label\)/);
  const initialQuery = tapMode.indexOf("var mode = queryMode()");
  const horizontalSwipe = tapMode.indexOf("modeSwitcher.swipeLeft()");
  const fallbackRequery = tapMode.indexOf("\n            mode = queryMode()");
  const targetExistenceAssertion = tapMode.indexOf("mode.waitForExistence");
  assert.ok(initialQuery >= 0, "mode navigation does not run its exact scoped query");
  assert.ok(horizontalSwipe >= 0, "horizontal mode discovery does not swipe its real switcher");
  assert.ok(
    initialQuery < horizontalSwipe &&
      horizontalSwipe < fallbackRequery &&
      fallbackRequery < targetExistenceAssertion,
    "mode navigation must query, swipe, requery, then make its hard existence assertion",
  );
  assert.match(tapMode, /XCTAssertTrue\(mode\.isHittable/);
  assert.match(tapMode, /let initialValue = mode\.value as\? String/);
  assert.match(tapMode, /XCTAssertEqual\(initialValue, "0"/);
  assert.match(tapMode, /mode\.tap\(\)/);
  assert.doesNotMatch(tapMode, /mode\.coordinate/);
  const tap = tapMode.indexOf("mode.tap()");
  const selectedModeRequery = tapMode.indexOf("let selectedMode = queryMode()", tap);
  const selectedValueWait = tapMode.indexOf(
    'NSPredicate(format: "value == %@", "1")',
    selectedModeRequery,
  );
  const selectedValueAssertion = tapMode.indexOf(
    'XCTAssertEqual(selectedMode.value as? String, "1"',
    selectedValueWait,
  );
  assert.ok(
    tap < selectedModeRequery &&
      selectedModeRequery < selectedValueWait &&
      selectedValueWait < selectedValueAssertion,
    "mode navigation must tap, requery, wait for value 1, then assert the selected switch value",
  );
});

test("AC and triangle scenes use the forensic static-text sentinels and real input values", () => {
  const uiTests = readFileSync(
    join(repositoryRoot, "apps/web/ios/App/TrueOhmEvidenceUITests/TrueOhmEvidenceUITests.swift"),
    "utf8",
  );
  assert.match(uiTests, /staticText\(labeled: "REAL POWER"\)\.waitForExistence/);
  assert.match(uiTests, /staticText\(labeled: "APPARENT POWER"\)\.waitForExistence/);
  assert.doesNotMatch(uiTests, /element\(labeled: "(?:Real Power|Apparent Power)"\)/);
  assert.doesNotMatch(uiTests, /element\(labeled: "(?:70\.668|100|kW|kVA)"\)/);
  for (const [label, value] of [
    ["Voltage (L-L for 3Ø)", "480"],
    ["Current", "100"],
    ["Power factor", "0.85"],
    ["Real power", "80"],
    ["Apparent power", "100"],
  ]) {
    assert.match(
      uiTests,
      new RegExp(
        `XCTAssertEqual\\(textField\\(labeled: "${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\)\\.value as\\? String, "${value}"\\)`,
      ),
    );
  }
});

test("the manual workflow is unsigned, artifact-only, exact-device, and runs all gates", async (t) => {
  const auditRepository = requireExport("auditRepository");
  const mutations = [
    [
      "name: TrueOhm iOS Screenshot Evidence",
      "triggering:\n      events:\n        - push\n    name: TrueOhm iOS Screenshot Evidence",
    ],
    [
      "    artifacts:\n      - native-evidence/**/*",
      "    publishing:\n      email:\n        recipients: []\n    artifacts:\n      - native-evidence/**/*",
    ],
    ["xcode: 26.4", "xcode: latest"],
    ["max_build_duration: 19", "max_build_duration: 20"],
    ['resolve-simulators "$EVIDENCE_DIR"', 'resolve-simulators "$CM_BUILD_DIR"'],
    [
      'destination "$CM_BUILD_DIR/native-evidence" iphone',
      'destination "$CM_BUILD_DIR/native-evidence" unknown',
    ],
    [
      'destination "$CM_BUILD_DIR/native-evidence" ipad',
      'destination "$CM_BUILD_DIR/native-evidence" unknown',
    ],
    [
      '-destination "$IPHONE_DESTINATION"',
      "-destination 'platform=iOS Simulator,name=iPhone 17 Pro Max'",
    ],
    [
      '-destination "$IPAD_DESTINATION"',
      "-destination 'platform=iOS Simulator,name=iPad Pro 13-inch (M5)'",
    ],
    ["xcrun xcresulttool export attachments", "echo xcresulttool export attachments"],
    ["git diff --exit-code", "echo git diff --exit-code"],
    ["pnpm storefront:preflight", "echo pnpm storefront:preflight"],
  ];

  for (const [expected, replacement] of mutations) {
    await t.test(expected, () => {
      const root = makeRepositoryFixture(t);
      replaceOnce(root, "codemagic.yaml", expected, replacement);
      assert.notDeepEqual(auditRepository(root), []);
    });
  }
});

test("the audit branch exclusion precedes the catch-all and covers push plus source PR events", async (t) => {
  const auditRepository = requireExport("auditRepository");
  const root = makeRepositoryFixture(t);
  replaceOnce(
    root,
    "codemagic.yaml",
    "        - pattern: codex/app-growth-stage1-trueohm\n          include: false\n          source: true",
    "        - pattern: codex/app-growth-stage1-trueohm\n          include: true\n          source: false",
  );
  const errors = auditRepository(root);
  assert.ok(
    errors.some((error) => error.includes("branch exclusion")),
    errors.join("\n"),
  );
});

test("the normal root test command runs the native contract instead of echoing it", () => {
  const auditRepository = requireExport("auditRepository");
  const root = makeRepositoryFixture({ after: () => {} });
  try {
    replaceOnce(
      root,
      "apps/web/package.json",
      "node --test ../../scripts/native-evidence-preflight.test.mjs && vitest run --pool=forks",
      "echo ../../scripts/native-evidence-preflight.test.mjs && vitest run --pool=forks",
    );
    assert.notDeepEqual(auditRepository(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("workspace test wiring preserves the storefront gate and reaches the native contract", () => {
  const rootPackage = JSON.parse(readFileSync(join(repositoryRoot, "package.json"), "utf8"));
  const webPackage = JSON.parse(
    readFileSync(join(repositoryRoot, "apps/web/package.json"), "utf8"),
  );
  assert.equal(
    rootPackage.scripts.test,
    "node --test scripts/storefront-copy-preflight.test.mjs && pnpm -r test",
  );
  assert.equal(
    webPackage.scripts.test,
    "node --test ../../scripts/native-evidence-preflight.test.mjs && vitest run --pool=forks",
  );
});

test("materialization maps exactly five attachments per device and writes hashes plus manifest", () => {
  const materializeNativeEvidence = requireExport("materializeNativeEvidence");
  const root = makeEvidenceFixture({ after: () => {} });
  try {
    const manifest = materializeNativeEvidence(root, testDeviceContracts);
    assert.equal(manifest.version, "1.0.1");
    assert.equal(manifest.build, "6");
    assert.equal(manifest.sourceSha, "a".repeat(40));
    assert.equal(manifest.screenshots.length, 10);
    assert.deepEqual(
      manifest.screenshots.map(({ device, frame }) => `${device}/${frame}`),
      [
        ...frameNames.map((frame) => `iphone/${frame}.png`),
        ...frameNames.map((frame) => `ipad/${frame}.png`),
      ],
    );
    assert.deepEqual(Object.keys(manifest.screenshots[0]).sort(), [
      "bytes",
      "device",
      "frame",
      "height",
      "sha256",
      "sourceAttachment",
      "width",
    ]);
    for (const device of ["iphone", "ipad"]) {
      assert.equal(
        new Set(
          manifest.screenshots
            .filter((screenshot) => screenshot.device === device)
            .map((screenshot) => screenshot.sha256),
        ).size,
        5,
      );
    }
    for (const device of ["iphone", "ipad"]) {
      for (const frame of frameNames) {
        assert.ok(readFileSync(join(root, "screenshots", device, `${frame}.png`)).length > 0);
      }
    }
    const inventory = readFileSync(join(root, "sha256.txt"), "utf8").trim().split("\n");
    const expectedInventoryPaths = [
      "logs/ipad-xcodebuild.log",
      "logs/iphone-xcodebuild.log",
      "manifest.json",
      "simulator-contract.json",
      "source-sha.txt",
      "xcode-version.txt",
      ...["iphone", "ipad"].flatMap((device) => [
        `raw-${device}/manifest.json`,
        ...frameNames.map((_, index) => `raw-${device}/${device}-${index}.png`),
        ...frameNames.map((frame) => `screenshots/${device}/${frame}.png`),
      ]),
    ].sort();
    assert.deepEqual(inventory.map((line) => line.slice(66)).sort(), expectedInventoryPaths);
    for (const line of inventory) {
      assert.match(line, /^[a-f0-9]{64} {2}.+$/);
      const path = line.slice(66);
      assert.equal(
        line.slice(0, 64),
        createHash("sha256")
          .update(readFileSync(join(root, path)))
          .digest("hex"),
      );
    }
    assert.deepEqual(JSON.parse(readFileSync(join(root, "manifest.json"), "utf8")), manifest);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("materialization rejects a simulator contract from outside the pinned iOS 26.4 runtime", () => {
  const materializeNativeEvidence = requireExport("materializeNativeEvidence");
  const root = makeEvidenceFixture({ after: () => {} });
  try {
    const path = join(root, "simulator-contract.json");
    const contract = JSON.parse(readFileSync(path, "utf8"));
    contract.iphone.runtime = "com.apple.CoreSimulator.SimRuntime.iOS-26-3";
    writeFileSync(path, `${JSON.stringify(contract)}\n`);
    assert.throws(() => materializeNativeEvidence(root, testDeviceContracts), /runtime|reviewed/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("materialization rejects evidence produced by a non-Xcode 26.4 toolchain", () => {
  const materializeNativeEvidence = requireExport("materializeNativeEvidence");
  const root = makeEvidenceFixture({ after: () => {} });
  try {
    writeFileSync(join(root, "xcode-version.txt"), "Xcode 26.3\nBuild version 17C529\n");
    assert.throws(() => materializeNativeEvidence(root, testDeviceContracts), /Xcode 26\.4/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("materialization fails closed on duplicate, unexpected, wrong-size, or black screenshots", async (t) => {
  const materializeNativeEvidence = requireExport("materializeNativeEvidence");

  await t.test("duplicate attachment", () => {
    const root = makeEvidenceFixture(t);
    const file = join(root, "raw-iphone", "manifest.json");
    const manifest = JSON.parse(readFileSync(file, "utf8"));
    manifest[0].attachments.push({ ...manifest[0].attachments[0] });
    writeFileSync(file, JSON.stringify(manifest));
    assert.throws(() => materializeNativeEvidence(root, testDeviceContracts), /duplicate|exactly/i);
  });

  await t.test("unexpected attachment", () => {
    const root = makeEvidenceFixture(t);
    const file = join(root, "raw-ipad", "manifest.json");
    const manifest = JSON.parse(readFileSync(file, "utf8"));
    manifest[0].attachments[0].suggestedHumanReadableName = "06-unreviewed_0_X.png";
    writeFileSync(file, JSON.stringify(manifest));
    assert.throws(
      () => materializeNativeEvidence(root, testDeviceContracts),
      /unexpected|missing/i,
    );
  });

  await t.test("wrong dimensions", () => {
    const root = makeEvidenceFixture(t);
    writeFileSync(join(root, "raw-iphone", "iphone-0.png"), makePng(19, 40));
    assert.throws(() => materializeNativeEvidence(root, testDeviceContracts), /dimensions/i);
  });

  await t.test("black screenshot", () => {
    const root = makeEvidenceFixture(t);
    writeFileSync(join(root, "raw-ipad", "ipad-0.png"), makePng(30, 40, { black: true }));
    assert.throws(() => materializeNativeEvidence(root, testDeviceContracts), /black|variation/i);
  });

  await t.test("all attachment inventories are checked before any pixel validation", () => {
    const root = makeEvidenceFixture(t);
    writeFileSync(join(root, "raw-iphone", "iphone-0.png"), makePng(19, 40));
    const file = join(root, "raw-ipad", "manifest.json");
    const manifest = JSON.parse(readFileSync(file, "utf8"));
    manifest[0].attachments[0].suggestedHumanReadableName = "06-unreviewed_0_X.png";
    writeFileSync(file, JSON.stringify(manifest));
    assert.throws(
      () => materializeNativeEvidence(root, testDeviceContracts),
      /unexpected attachment/i,
    );
  });
});

test("materialization rejects PNG alpha channels and transparency chunks", async (t) => {
  const materializeNativeEvidence = requireExport("materializeNativeEvidence");

  for (const colorType of [4, 6]) {
    await t.test(`color type ${colorType} alpha channel`, () => {
      const root = makeEvidenceFixture(t);
      writeFileSync(join(root, "raw-iphone", "iphone-0.png"), makePng(20, 40, { colorType }));
      assert.throws(
        () => materializeNativeEvidence(root, testDeviceContracts),
        /alpha|transparen/i,
      );
    });
  }

  await t.test("tRNS transparency chunk", () => {
    const root = makeEvidenceFixture(t);
    writeFileSync(join(root, "raw-ipad", "ipad-0.png"), makePng(30, 40, { transparency: true }));
    assert.throws(() => materializeNativeEvidence(root, testDeviceContracts), /alpha|transparen/i);
  });
});

test("materialization rejects a PNG with a flipped IDAT CRC", () => {
  const materializeNativeEvidence = requireExport("materializeNativeEvidence");
  const root = makeEvidenceFixture({ after: () => {} });
  try {
    const screenshot = join(root, "raw-iphone", "iphone-0.png");
    writeFileSync(screenshot, flipChunkCrc(readFileSync(screenshot), "IDAT"));

    assert.throws(
      () => materializeNativeEvidence(root, testDeviceContracts),
      /IDAT.*CRC|CRC.*IDAT/i,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("materialization rejects duplicate source filenames within one device set", () => {
  const materializeNativeEvidence = requireExport("materializeNativeEvidence");
  const root = makeEvidenceFixture({ after: () => {} });
  try {
    const file = join(root, "raw-iphone", "manifest.json");
    const manifest = JSON.parse(readFileSync(file, "utf8"));
    manifest[0].attachments[1].exportedFileName = manifest[0].attachments[0].exportedFileName;
    writeFileSync(file, JSON.stringify(manifest));

    assert.throws(
      () => materializeNativeEvidence(root, testDeviceContracts),
      /duplicate.*(source|filename)|(?:source|filename).*duplicate/i,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("materialization rejects an all-identical five-scene device set", () => {
  const materializeNativeEvidence = requireExport("materializeNativeEvidence");
  const root = makeEvidenceFixture({ after: () => {} }, { identicalScenes: true });
  try {
    assert.throws(
      () => materializeNativeEvidence(root, testDeviceContracts),
      /duplicate.*(pixel|file|hash|content)/i,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("materialization rejects duplicate pixels hidden behind distinct PNG file hashes", () => {
  const materializeNativeEvidence = requireExport("materializeNativeEvidence");
  const root = makeEvidenceFixture(
    { after: () => {} },
    { identicalScenes: true, uniqueMetadata: true },
  );
  try {
    assert.throws(() => materializeNativeEvidence(root, testDeviceContracts), /duplicate.*pixel/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
