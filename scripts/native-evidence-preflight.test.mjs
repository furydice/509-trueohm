import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
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

function makePng(width, height, { black = false } = {}) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4);
    for (let x = 0; x < width; x += 1) {
      const offset = 1 + x * 4;
      const light = black ? 0 : (x + y) % 2 === 0 ? 32 : 224;
      row[offset] = light;
      row[offset + 1] = black ? 0 : 180 - Math.floor(light / 3);
      row[offset + 2] = black ? 0 : 255 - light;
      row[offset + 3] = 255;
    }
    rows.push(row);
  }
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", header),
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
  iphone: { name: "iPhone 16 Pro Max", width: 20, height: 40 },
  ipad: { name: "iPad Pro 13-inch (M4)", width: 30, height: 40 },
};

function makeEvidenceFixture(t) {
  const root = mkdtempSync(join(tmpdir(), "trueohm-native-artifacts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "logs"), { recursive: true });
  mkdirSync(join(root, "trueohm-iphone.xcresult"), { recursive: true });
  mkdirSync(join(root, "trueohm-ipad.xcresult"), { recursive: true });
  writeFileSync(join(root, "logs", "iphone-xcodebuild.log"), "iphone test passed\n");
  writeFileSync(join(root, "logs", "ipad-xcodebuild.log"), "ipad test passed\n");
  writeFileSync(join(root, "source-sha.txt"), `${"a".repeat(40)}\n`);
  writeFileSync(join(root, "xcode-version.txt"), "Xcode 16.4\nBuild version 16F6\n");
  writeFileSync(
    join(root, "simulator-contract.json"),
    `${JSON.stringify({
      iphone: { ...testDeviceContracts.iphone, udid: "PHONE-UDID", runtime: "iOS-18-5" },
      ipad: { ...testDeviceContracts.ipad, udid: "IPAD-UDID", runtime: "iOS-18-5" },
    })}\n`,
  );

  for (const [device, contract] of Object.entries(testDeviceContracts)) {
    const raw = join(root, `raw-${device}`);
    mkdirSync(raw, { recursive: true });
    const attachments = frameNames.map((name, index) => {
      const exportedFileName = `${device}-${index}.png`;
      writeFileSync(join(raw, exportedFileName), makePng(contract.width, contract.height));
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
  ];

  for (const [file, expected, replacement] of mutations) {
    await t.test(`${file}: ${expected}`, () => {
      const root = makeRepositoryFixture(t);
      replaceOnce(root, file, expected, replacement);
      assert.notDeepEqual(auditRepository(root), []);
    });
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
    ["name=iPhone 16 Pro Max", "name=iPhone 16"],
    ["name=iPad Pro 13-inch (M4)", "name=iPad Pro 11-inch (M4)"],
    ["1320 x 2868", "1290 x 2796"],
    ["2064 x 2752", "2048 x 2732"],
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
    for (const device of ["iphone", "ipad"]) {
      for (const frame of frameNames) {
        assert.ok(readFileSync(join(root, "screenshots", device, `${frame}.png`)).length > 0);
      }
    }
    assert.match(readFileSync(join(root, "sha256.txt"), "utf8"), /^[a-f0-9]{64} {2}screenshots\//m);
    assert.deepEqual(JSON.parse(readFileSync(join(root, "manifest.json"), "utf8")), manifest);
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
