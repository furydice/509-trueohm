import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { TextDecoder } from "node:util";
import { inflateSync } from "node:zlib";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const utf8 = new TextDecoder("utf-8", { fatal: true });

const frameNames = [
  "01-ohms-law",
  "02-show-work",
  "03-ac-power",
  "04-power-triangle",
  "05-free-offline-no-account",
];

export const deviceContracts = {
  iphone: { name: "iPhone 17 Pro Max", width: 1320, height: 2868 },
  ipad: { name: "iPad Pro 13-inch (M5)", width: 2064, height: 2752 },
};

export const simulatorRuntime = "com.apple.CoreSimulator.SimRuntime.iOS-26-4";

export function resolveSimulatorContracts(
  inventory,
  contracts = deviceContracts,
  runtime = simulatorRuntime,
) {
  const runtimeDevices = inventory?.devices?.[runtime];
  if (!Array.isArray(runtimeDevices)) {
    throw new Error(`Simulator inventory is missing pinned runtime ${runtime}`);
  }
  const resolved = {};
  for (const [key, contract] of Object.entries(contracts)) {
    const matches = runtimeDevices.filter(
      (device) => device.name === contract.name && device.isAvailable !== false,
    );
    if (matches.length !== 1) {
      throw new Error(
        `Expected exactly one available ${contract.name} in iOS 26.4; found ${matches.length}`,
      );
    }
    const udid = matches[0].udid;
    if (typeof udid !== "string" || udid.length === 0) {
      throw new Error(`${contract.name} in iOS 26.4 is missing its UDID`);
    }
    resolved[key] = { ...contract, udid, runtime };
  }
  return resolved;
}

export function writeSimulatorContracts(root) {
  const inventory = JSON.parse(decodeFile(join(root, "simulators.json")));
  const resolved = resolveSimulatorContracts(inventory);
  writeFileSync(join(root, "simulator-contract.json"), `${JSON.stringify(resolved, null, 2)}\n`);
  return resolved;
}

export function simulatorDestination(root, device) {
  if (!(device in deviceContracts)) throw new Error(`unknown simulator contract: ${device}`);
  const resolved = JSON.parse(decodeFile(join(root, "simulator-contract.json")));
  const contract = resolved[device];
  const expected = deviceContracts[device];
  if (
    contract?.name !== expected.name ||
    contract?.width !== expected.width ||
    contract?.height !== expected.height ||
    contract?.runtime !== simulatorRuntime ||
    typeof contract?.udid !== "string" ||
    contract.udid.length === 0
  ) {
    throw new Error(`${device} simulator contract does not match the pinned runtime and device`);
  }
  return `platform=iOS Simulator,id=${contract.udid}`;
}

const requiredRepositoryFiles = [
  "codemagic.yaml",
  "package.json",
  "apps/web/package.json",
  "apps/web/src/screens/ToolsScreen.tsx",
  "apps/web/ios/App/App.xcodeproj/project.pbxproj",
  "apps/web/ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme",
  "apps/web/ios/App/TrueOhmEvidenceUITests/TrueOhmEvidenceUITests.swift",
];

function decodeFile(path) {
  return utf8.decode(readFileSync(path));
}

function count(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function extractWorkflow(source, id) {
  const marker = `  ${id}:`;
  const start = source.indexOf(marker);
  if (start < 0) return undefined;
  const rest = source.slice(start + marker.length);
  const next = rest.search(/\n {2}[a-zA-Z0-9_-]+:\s*(?:\n|$)/);
  return next < 0 ? source.slice(start) : source.slice(start, start + marker.length + next);
}

function requireText(errors, source, expected, label) {
  if (!source.includes(expected)) errors.push(`${label} is missing`);
}

export function auditRepository(root = repositoryRoot) {
  const errors = [];
  const sources = new Map();

  for (const relativePath of requiredRepositoryFiles) {
    const absolutePath = join(root, relativePath);
    if (!existsSync(absolutePath)) {
      errors.push(`required file is missing: ${relativePath}`);
      continue;
    }
    try {
      sources.set(relativePath, decodeFile(absolutePath));
    } catch (error) {
      errors.push(`${relativePath} is not strict UTF-8: ${error.message}`);
    }
  }
  if (errors.length > 0) return errors;

  let rootPackage;
  let webPackage;
  try {
    rootPackage = JSON.parse(sources.get("package.json"));
    webPackage = JSON.parse(sources.get("apps/web/package.json"));
  } catch (error) {
    errors.push(`package manifest JSON is invalid: ${error.message}`);
    return errors;
  }

  if (rootPackage.version !== "1.0.1") errors.push("root package version must be 1.0.1");
  if (webPackage.version !== "1.0.1") errors.push("web package version must be 1.0.1");
  const rootTestCommand = rootPackage.scripts?.test ?? "";
  if (
    rootTestCommand !== "node --test scripts/storefront-copy-preflight.test.mjs && pnpm -r test"
  ) {
    errors.push("root test command must retain storefront and recursive workspace tests");
  }
  const webTestCommand = webPackage.scripts?.test ?? "";
  if (
    webTestCommand !==
    "node --test ../../scripts/native-evidence-preflight.test.mjs && vitest run --pool=forks"
  ) {
    errors.push("web workspace test command must execute native evidence and Vitest contracts");
  }

  const toolsScreen = sources.get("apps/web/src/screens/ToolsScreen.tsx");
  requireText(
    errors,
    toolsScreen,
    "TrueOhm is free, works offline, and requires no account.",
    "customer-visible free/offline/no-account statement",
  );

  const project = sources.get("apps/web/ios/App/App.xcodeproj/project.pbxproj");
  if (count(project, /MARKETING_VERSION = 1\.0\.1;/g) !== 2) {
    errors.push("Xcode marketing version must be 1.0.1 in exactly two App configurations");
  }
  if (count(project, /CURRENT_PROJECT_VERSION = 6;/g) !== 2) {
    errors.push("Xcode build number must be 6 in exactly two App configurations");
  }
  for (const [expected, label] of [
    ["TrueOhmEvidenceUITests.swift in Sources", "UI test source build membership"],
    ['productType = "com.apple.product-type.bundle.ui-testing";', "UI-testing target type"],
    ["remoteInfo = App;", "host-app target proxy"],
    ["PBXTargetDependency", "host-app target dependency"],
    ["TestTargetID = 504EC3031FED79650016851F;", "host-app test target id"],
  ]) {
    requireText(errors, project, expected, label);
  }
  if (
    count(
      project,
      /PRODUCT_BUNDLE_IDENTIFIER = com\.fiveohninelectric\.trueohm\.evidenceuitests;/g,
    ) !== 2
  ) {
    errors.push("unique UI-test bundle identifier must exist in both test configurations");
  }
  if (count(project, /TEST_TARGET_NAME = App;/g) !== 2) {
    errors.push("UI-test host target setting must exist in both test configurations");
  }

  const scheme = sources.get("apps/web/ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme");
  if (count(scheme, /BlueprintName = "TrueOhmEvidenceUITests"/g) !== 2) {
    errors.push("scheme must name the UI-test target in build and test actions");
  }
  requireText(
    errors,
    scheme,
    '<TestableReference\n            skipped = "NO">',
    "enabled scheme testable",
  );
  if (count(scheme, /BlueprintIdentifier = "7E5091000000000000000007"/g) !== 2) {
    errors.push("scheme must reference the UI-test target in build and test actions");
  }

  const uiTests = sources.get(
    "apps/web/ios/App/TrueOhmEvidenceUITests/TrueOhmEvidenceUITests.swift",
  );
  if (count(uiTests, /capture\("0[1-5]-[^"\n]+"\)/g) !== frameNames.length) {
    errors.push("UI tests must capture exactly five named frames");
  }
  for (const frame of frameNames) {
    requireText(errors, uiTests, `capture("${frame}")`, `UI-test frame ${frame}`);
  }
  for (const [expected, label] of [
    ["app.terminate()", "clean app termination"],
    ["app.launch()", "deterministic app launch"],
    ["XCUIDevice.shared.orientation = .portrait", "portrait orientation lock"],
    ['"-ApplePersistenceIgnoreState", "YES"', "state-restoration reset"],
    ["webView.waitForExistence(timeout: 30)", "cold WebView launch bound"],
    ['staticText(labeled: "POWER")', "exact default-scene readiness sentinel"],
    ['staticText(labeled: "1,440")', "default Ohm's Law result accessibility value"],
    ['staticText(labeled: "watts")', "default Ohm's Law result accessibility unit"],
    ['button(labeled: "Switch to light mode")', "dark-theme state detection"],
    ['button(labeled: "Switch to dark mode")', "explicit persisted dark-theme action"],
    ['element(labeled: "Calculator mode")', "real calculator-mode switcher lookup"],
    ["modeSwitcher.descendants(matching: .any)", "type-agnostic scoped mode lookup"],
    ["modeSwitcher.swipeLeft()", "offscreen mode discovery gesture"],
    ["mode = queryMode()", "post-swipe mode requery"],
    ["let initialValue = mode.value as? String", "unselected mode-state capture"],
    ['XCTAssertEqual(initialValue, "0"', "unselected mode-state assertion"],
    ["mode.tap()", "real accessibility mode activation"],
    ["let selectedMode = queryMode()", "post-tap mode requery"],
    ['NSPredicate(format: "value == %@", "1")', "selected mode-state wait"],
    ['XCTAssertEqual(selectedMode.value as? String, "1"', "selected mode-state assertion"],
    ['staticText(labeled: "REAL POWER")', "AC Power accessibility sentinel"],
    ['staticText(labeled: "APPARENT POWER")', "Power Triangle accessibility sentinel"],
    ['staticText(labeled: "70.668")', "AC Power result accessibility value"],
    ['staticText(labeled: "kW")', "AC Power result accessibility unit"],
    ['staticText(labeled: "100")', "Power Triangle result accessibility value"],
    ['staticText(labeled: "kVA")', "Power Triangle result accessibility unit"],
    ["XCTAssertTrue", "hard UI assertions"],
    ["XCUIScreen.main.screenshot()", "native screen capture"],
    ["attachment.lifetime = .keepAlways", "retained screenshot attachments"],
    ["pixels.width == 1320 && pixels.height == 2868", "iPhone pixel assertion"],
    ["pixels.width == 2064 && pixels.height == 2752", "iPad pixel assertion"],
  ]) {
    requireText(errors, uiTests, expected, label);
  }
  if (count(uiTests, /resetPersistentEvidenceState\(\)/g) !== 2) {
    errors.push("UI tests must invoke the persistent-state reset from per-scene setup");
  }
  const tapMode = uiTests.slice(
    uiTests.indexOf("private func tapMode"),
    uiTests.indexOf("private func scrollUntilHittable"),
  );
  const initialQueryIndex = tapMode.indexOf("var mode = queryMode()");
  const horizontalSwipeIndex = tapMode.indexOf("modeSwitcher.swipeLeft()");
  const fallbackQueryIndex = tapMode.indexOf("\n            mode = queryMode()");
  const targetExistenceIndex = tapMode.indexOf("mode.waitForExistence");
  if (
    initialQueryIndex < 0 ||
    horizontalSwipeIndex < 0 ||
    fallbackQueryIndex < 0 ||
    targetExistenceIndex < 0 ||
    initialQueryIndex > horizontalSwipeIndex ||
    horizontalSwipeIndex > fallbackQueryIndex ||
    fallbackQueryIndex > targetExistenceIndex
  ) {
    errors.push("UI tests must query, swipe, requery, then assert mode existence");
  }
  if (/(?:app|modeSwitcher)\.buttons/.test(tapMode)) {
    errors.push("UI tests must not restrict ARIA mode controls to the XCUI button type");
  }
  if (!tapMode.includes('NSPredicate(format: "label == %@", label)')) {
    errors.push("UI tests must retain exact mode labels inside the calculator-mode switcher");
  }
  if (tapMode.includes("mode.coordinate")) {
    errors.push("UI tests must use the proven mode switch activation instead of a coordinate tap");
  }
  const modeTapIndex = tapMode.indexOf("mode.tap()");
  const selectedModeIndex = tapMode.indexOf("let selectedMode = queryMode()", modeTapIndex);
  const selectedWaitIndex = tapMode.indexOf(
    'NSPredicate(format: "value == %@", "1")',
    selectedModeIndex,
  );
  const selectedAssertIndex = tapMode.indexOf(
    'XCTAssertEqual(selectedMode.value as? String, "1"',
    selectedWaitIndex,
  );
  if (
    modeTapIndex < 0 ||
    selectedModeIndex < 0 ||
    selectedWaitIndex < 0 ||
    selectedAssertIndex < 0 ||
    modeTapIndex > selectedModeIndex ||
    selectedModeIndex > selectedWaitIndex ||
    selectedWaitIndex > selectedAssertIndex
  ) {
    errors.push("UI tests must tap, requery, wait for value 1, then assert selected mode state");
  }
  if (/element\(labeled: "(?:Real Power|Apparent Power)"\)/.test(uiTests)) {
    errors.push("UI tests must use the uppercase static-text labels exposed by WebKit");
  }
  if (/element\(labeled: "(?:70\.668|100|kW|kVA)"\)/.test(uiTests)) {
    errors.push("UI tests must query proven hero values and units through app.staticTexts");
  }
  if (/element\(labeled: "(?:Power|1,440|watts)"\)/.test(uiTests)) {
    errors.push("UI tests must query the exact default Ohm's Law scene through app.staticTexts");
  }

  const codemagic = sources.get("codemagic.yaml");
  const auditWorkflow = extractWorkflow(codemagic, "trueohm-readonly-audit");
  const evidenceWorkflow = extractWorkflow(codemagic, "trueohm-ios-screenshot-evidence");
  const signedWorkflow = extractWorkflow(codemagic, "trueohm-ios-testflight");
  if (!auditWorkflow) errors.push("read-only audit workflow is missing");
  if (!evidenceWorkflow) errors.push("manual screenshot evidence workflow is missing");
  if (!signedWorkflow) errors.push("signed TestFlight workflow is missing");

  if (auditWorkflow) {
    requireText(
      errors,
      auditWorkflow,
      "        - push\n        - pull_request",
      "push plus PR audit events",
    );
    const exclusion =
      "        - pattern: codex/app-growth-stage1-trueohm\n" +
      "          include: false\n" +
      "          source: true";
    const exclusionIndex = auditWorkflow.indexOf(exclusion);
    const catchAllMatch = /^\s{8}- pattern: ["']\*["']\s*$/m.exec(auditWorkflow);
    const catchAllIndex = catchAllMatch?.index ?? -1;
    if (exclusionIndex < 0 || catchAllIndex < 0 || exclusionIndex > catchAllIndex) {
      errors.push("read-only audit branch exclusion must be exact and precede the catch-all");
    }
  }

  if (evidenceWorkflow) {
    const forbidden = [
      [/(^|\n)\s+triggering:/, "automatic triggering"],
      [/(^|\n)\s+integrations:/, "external integration"],
      [/ios_signing|provisioning|use-profiles/i, "iOS signing"],
      [/build-ipa|\.ipa\b/i, "IPA creation/artifact"],
      [/APP_STORE|app_store_connect|submit_to_/i, "App Store integration"],
      [/(^|\n)\s+publishing:/, "publishing"],
    ];
    for (const [pattern, label] of forbidden) {
      if (pattern.test(evidenceWorkflow))
        errors.push(`evidence workflow exposes forbidden ${label}`);
    }
    for (const [expected, label] of [
      ["name: TrueOhm iOS Screenshot Evidence", "workflow display name"],
      ["xcode: 26.4", "pinned Xcode 26.4 image"],
      ["max_build_duration: 12", "12-minute workflow cap"],
      ["pnpm install --frozen-lockfile", "frozen install"],
      ["pnpm lint", "lint gate"],
      ["pnpm typecheck", "typecheck gate"],
      ["pnpm test", "test gate"],
      ["pnpm build", "build gate"],
      ["node scripts/native-evidence-preflight.mjs", "native contract gate"],
      ["npx cap sync ios", "Capacitor sync"],
      ['resolve-simulators "$EVIDENCE_DIR"', "runtime-scoped simulator resolution"],
      ['destination "$CM_BUILD_DIR/native-evidence" iphone', "resolved iPhone destination"],
      ['destination "$CM_BUILD_DIR/native-evidence" ipad', "resolved iPad destination"],
      ['-destination "$IPHONE_DESTINATION"', "iPhone UDID destination use"],
      ['-destination "$IPAD_DESTINATION"', "iPad UDID destination use"],
      ["trueohm-iphone.xcresult", "iPhone result bundle"],
      ["trueohm-ipad.xcresult", "iPad result bundle"],
      ["CODE_SIGNING_ALLOWED=NO", "unsigned simulator build"],
      ["native-evidence/manifest.json", "evidence manifest"],
      ["native-evidence/sha256.txt", "SHA-256 inventory"],
      ["native-evidence/logs", "xcodebuild logs"],
      ["    artifacts:\n      - native-evidence/**/*", "artifact-only output"],
    ]) {
      requireText(errors, evidenceWorkflow, expected, label);
    }
    if (!/^\s{10}pnpm storefront:preflight\s*$/m.test(evidenceWorkflow)) {
      errors.push("evidence workflow must execute the storefront preflight gate");
    }
    if (!/^\s{10}git diff --exit-code\s*$/m.test(evidenceWorkflow)) {
      errors.push("evidence workflow must execute the generated native cleanliness gate");
    }
    if (count(evidenceWorkflow, /xcrun xcresulttool export attachments/g) !== 2) {
      errors.push("evidence workflow must export attachments from both result bundles");
    }
    if (
      count(evidenceWorkflow, /xcodebuild test -project apps\/web\/ios\/App\/App\.xcodeproj/g) !== 2
    ) {
      errors.push("evidence workflow must run exactly two native UI-test commands");
    }
    const cap = Number(evidenceWorkflow.match(/max_build_duration:\s*(\d+)/)?.[1]);
    const approvedMinutes = 120;
    const usedMinutes = 18;
    if (!Number.isInteger(cap) || usedMinutes + cap + 45 + 45 > approvedMinutes) {
      errors.push("evidence workflow maxima plus 18 used minutes must fit the 120-minute approval");
    }
    if (/-destination ['"]platform=iOS Simulator,name=/.test(evidenceWorkflow)) {
      errors.push("evidence workflow must not select simulators by ambiguous device name");
    }
  }

  if (signedWorkflow) {
    requireText(errors, signedWorkflow, "        - tag", "signed lane tag-only trigger");
    requireText(
      errors,
      signedWorkflow,
      "submit_to_testflight: true",
      "separate signed upload lane",
    );
  }

  return errors;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

const crc32Table = Uint32Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return crc >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function inspectPng(buffer) {
  if (!buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
    throw new Error("attachment is not a PNG");
  }
  let offset = 8;
  let header;
  const compressed = [];
  let sawTransparency = false;
  let sawEnd = false;
  let chunkIndex = 0;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) throw new Error("PNG chunk is truncated");
    const expectedCrc = buffer.readUInt32BE(dataEnd);
    const actualCrc = crc32(buffer.subarray(offset + 4, dataEnd));
    if (actualCrc !== expectedCrc) throw new Error(`PNG ${type} chunk CRC does not match`);
    const data = buffer.subarray(dataStart, dataEnd);
    if (type === "IHDR") {
      if (chunkIndex !== 0 || header) throw new Error("PNG IHDR must be the first and only header");
      header = Buffer.from(data);
    } else if (!header) {
      throw new Error("PNG IHDR must precede all other chunks");
    }
    if (type === "tRNS") sawTransparency = true;
    if (type === "IDAT") compressed.push(Buffer.from(data));
    offset = dataEnd + 4;
    chunkIndex += 1;
    if (type === "IEND") {
      if (length !== 0) throw new Error("PNG IEND chunk must be empty");
      sawEnd = true;
      break;
    }
  }
  if (!header || header.length !== 13 || compressed.length === 0 || !sawEnd) {
    throw new Error("PNG is missing IHDR, IDAT, or IEND data");
  }
  if (offset !== buffer.length) throw new Error("PNG has trailing data after IEND");

  const width = header.readUInt32BE(0);
  const height = header.readUInt32BE(4);
  const bitDepth = header[8];
  const colorType = header[9];
  const compression = header[10];
  const filterMethod = header[11];
  const interlace = header[12];
  if (colorType === 4 || colorType === 6) {
    throw new Error(`PNG alpha channels are not allowed (color type ${colorType})`);
  }
  if (sawTransparency) throw new Error("PNG transparency chunks are not allowed");
  const channelsByType = new Map([
    [0, 1],
    [2, 3],
  ]);
  const channels = channelsByType.get(colorType);
  if (
    width === 0 ||
    height === 0 ||
    bitDepth !== 8 ||
    !channels ||
    compression !== 0 ||
    filterMethod !== 0 ||
    interlace !== 0
  ) {
    throw new Error(
      `unsupported PNG format: size=${width}x${height}, depth=${bitDepth}, color=${colorType}, compression=${compression}, filter=${filterMethod}, interlace=${interlace}`,
    );
  }

  const encoded = inflateSync(Buffer.concat(compressed));
  const rowBytes = width * channels;
  if (encoded.length !== height * (rowBytes + 1)) throw new Error("PNG scanline length is invalid");
  let previous = Buffer.alloc(rowBytes);
  let minimum = 255;
  let maximum = 0;
  let luminanceTotal = 0;
  let sampleCount = 0;
  const pixelStride = Math.max(1, Math.floor((width * height) / 20_000));
  const pixelHasher = createHash("sha256");

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (rowBytes + 1);
    const filter = encoded[rowOffset];
    const current = Buffer.allocUnsafe(rowBytes);
    for (let x = 0; x < rowBytes; x += 1) {
      const raw = encoded[rowOffset + 1 + x];
      const left = x >= channels ? current[x - channels] : 0;
      const up = previous[x];
      const upperLeft = x >= channels ? previous[x - channels] : 0;
      let value;
      switch (filter) {
        case 0:
          value = raw;
          break;
        case 1:
          value = raw + left;
          break;
        case 2:
          value = raw + up;
          break;
        case 3:
          value = raw + Math.floor((left + up) / 2);
          break;
        case 4:
          value = raw + paeth(left, up, upperLeft);
          break;
        default:
          throw new Error(`unsupported PNG filter ${filter}`);
      }
      current[x] = value & 0xff;
    }
    if (colorType === 0) {
      const rgb = Buffer.allocUnsafe(width * 3);
      for (let x = 0; x < width; x += 1) {
        rgb[x * 3] = current[x];
        rgb[x * 3 + 1] = current[x];
        rgb[x * 3 + 2] = current[x];
      }
      pixelHasher.update(rgb);
    } else {
      pixelHasher.update(current);
    }
    for (let x = 0; x < width; x += pixelStride) {
      const pixel = x * channels;
      const red = current[pixel];
      const green = colorType === 0 ? red : current[pixel + 1];
      const blue = colorType === 0 ? red : current[pixel + 2];
      const luminance = (red + green + blue) / 3;
      minimum = Math.min(minimum, luminance);
      maximum = Math.max(maximum, luminance);
      luminanceTotal += luminance;
      sampleCount += 1;
    }
    previous = current;
  }

  const average = luminanceTotal / sampleCount;
  if (maximum - minimum < 12 || average < 3) {
    throw new Error(
      `PNG appears black or lacks visual variation (range=${(maximum - minimum).toFixed(1)}, average=${average.toFixed(1)})`,
    );
  }
  return {
    width,
    height,
    bytes: buffer.length,
    luminanceRange: maximum - minimum,
    pixelSha256: pixelHasher.digest("hex"),
  };
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function flattenAttachments(manifest) {
  if (!Array.isArray(manifest)) throw new Error("attachment manifest must be an array");
  return manifest.flatMap((entry) => {
    if (!Array.isArray(entry.attachments))
      throw new Error("attachment manifest entry is malformed");
    return entry.attachments;
  });
}

function frameFromSuggestedName(name) {
  if (typeof name !== "string" || !name.endsWith(".png")) return undefined;
  return frameNames.find((frame) => name === `${frame}.png` || name.startsWith(`${frame}_`));
}

function listFiles(root, current = root) {
  const files = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const absolute = join(current, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(root, absolute));
    if (entry.isFile()) files.push(absolute);
  }
  return files;
}

export function materializeNativeEvidence(evidenceRoot, contracts = deviceContracts) {
  const root = resolve(evidenceRoot);
  const sourceSha = decodeFile(join(root, "source-sha.txt")).trim();
  if (!/^[a-f0-9]{40}$/.test(sourceSha)) throw new Error("source SHA is invalid");
  const xcodeVersion = decodeFile(join(root, "xcode-version.txt")).trim();
  if (!/^Xcode 26\.4(?:\.\d+)?\r?\nBuild version [^\r\n]+$/.test(xcodeVersion)) {
    throw new Error("Xcode version record must use Xcode 26.4.x");
  }
  const simulatorRecord = JSON.parse(decodeFile(join(root, "simulator-contract.json")));

  for (const device of Object.keys(contracts)) {
    const expected = contracts[device];
    const actual = simulatorRecord[device];
    if (
      !actual ||
      actual.name !== expected.name ||
      actual.width !== expected.width ||
      actual.height !== expected.height ||
      typeof actual.udid !== "string" ||
      actual.udid.length === 0 ||
      actual.runtime !== simulatorRuntime
    ) {
      throw new Error(`${device} simulator contract does not match the exact reviewed device`);
    }
    for (const required of [
      join(root, `trueohm-${device}.xcresult`),
      join(root, "logs", `${device}-xcodebuild.log`),
    ]) {
      if (!existsSync(required))
        throw new Error(`required native artifact is missing: ${required}`);
    }
  }

  const attachmentInventories = new Map();
  for (const device of Object.keys(contracts)) {
    const rawDirectory = join(root, `raw-${device}`);
    const exportedManifest = JSON.parse(decodeFile(join(rawDirectory, "manifest.json")));
    const attachments = flattenAttachments(exportedManifest);
    if (attachments.length !== frameNames.length) {
      throw new Error(
        `${device} must contain exactly five attachments; found ${attachments.length}`,
      );
    }

    const byFrame = new Map();
    const exportedNames = new Set();
    for (const attachment of attachments) {
      const frame = frameFromSuggestedName(attachment.suggestedHumanReadableName);
      if (!frame) {
        throw new Error(
          `${device} has unexpected attachment ${JSON.stringify(attachment.suggestedHumanReadableName)}`,
        );
      }
      if (byFrame.has(frame)) throw new Error(`${device} has duplicate attachment for ${frame}`);
      const exportedName = attachment.exportedFileName;
      if (
        typeof exportedName !== "string" ||
        exportedName.length === 0 ||
        exportedName.includes("/") ||
        exportedName.includes("\\")
      ) {
        throw new Error(`${device} attachment has an unsafe exported filename`);
      }
      if (exportedNames.has(exportedName)) {
        throw new Error(`${device} has duplicate source filename ${exportedName}`);
      }
      exportedNames.add(exportedName);
      byFrame.set(frame, exportedName);
    }
    attachmentInventories.set(device, { rawDirectory, byFrame });
  }

  const screenshots = [];
  for (const [device, contract] of Object.entries(contracts)) {
    const { rawDirectory, byFrame } = attachmentInventories.get(device);
    const outputDirectory = join(root, "screenshots", device);
    mkdirSync(outputDirectory, { recursive: true });
    const fileHashes = new Set();
    const pixelHashes = new Set();
    for (const frame of frameNames) {
      const exportedName = byFrame.get(frame);
      if (!exportedName) throw new Error(`${device} is missing attachment ${frame}`);
      const source = join(rawDirectory, exportedName);
      if (!existsSync(source) || !statSync(source).isFile()) {
        throw new Error(`${device} exported attachment is missing: ${exportedName}`);
      }
      const png = readFileSync(source);
      const inspection = inspectPng(png);
      if (inspection.width !== contract.width || inspection.height !== contract.height) {
        throw new Error(
          `${device}/${frame} dimensions ${inspection.width} x ${inspection.height} do not match ${contract.width} x ${contract.height}`,
        );
      }
      if (contract.width >= 1000 && inspection.bytes < 50_000) {
        throw new Error(`${device}/${frame} is implausibly small at ${inspection.bytes} bytes`);
      }
      const fileSha256 = sha256(png);
      if (fileHashes.has(fileSha256)) {
        throw new Error(`${device}/${frame} has a duplicate screenshot file hash`);
      }
      if (pixelHashes.has(inspection.pixelSha256)) {
        throw new Error(`${device}/${frame} has a duplicate screenshot pixel hash`);
      }
      fileHashes.add(fileSha256);
      pixelHashes.add(inspection.pixelSha256);
      const output = join(outputDirectory, `${frame}.png`);
      copyFileSync(source, output);
      screenshots.push({
        device,
        frame: `${frame}.png`,
        width: inspection.width,
        height: inspection.height,
        bytes: inspection.bytes,
        sha256: fileSha256,
        sourceAttachment: exportedName,
      });
    }
  }

  const manifest = {
    schemaVersion: 1,
    app: "TrueOhm",
    bundleIdentifier: "com.fiveohninelectric.trueohm",
    version: "1.0.1",
    build: "6",
    sourceSha,
    xcodeVersion,
    simulators: simulatorRecord,
    resultBundles: ["trueohm-iphone.xcresult", "trueohm-ipad.xcresult"],
    logs: ["logs/iphone-xcodebuild.log", "logs/ipad-xcodebuild.log"],
    screenshots,
  };
  writeFileSync(join(root, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  const inventory = listFiles(root)
    .filter((file) => file !== join(root, "sha256.txt"))
    .map((file) => {
      const name = relative(root, file).split(sep).join("/");
      return `${sha256(readFileSync(file))}  ${name}`;
    })
    .sort();
  writeFileSync(join(root, "sha256.txt"), `${inventory.join("\n")}\n`);
  return manifest;
}

function runCli() {
  const [command, argument, device] = process.argv.slice(2);
  if (command === "resolve-simulators") {
    if (!argument)
      throw new Error("usage: native-evidence-preflight.mjs resolve-simulators <evidence-root>");
    const resolved = writeSimulatorContracts(argument);
    console.log(`simulator contract resolved: ${Object.keys(resolved).join(", ")}`);
    return;
  }
  if (command === "destination") {
    if (!argument || !device)
      throw new Error(
        "usage: native-evidence-preflight.mjs destination <evidence-root> <iphone|ipad>",
      );
    console.log(simulatorDestination(argument, device));
    return;
  }
  if (command === "materialize") {
    if (!argument)
      throw new Error("usage: native-evidence-preflight.mjs materialize <evidence-root>");
    const manifest = materializeNativeEvidence(argument);
    console.log(`native evidence materialized: ${manifest.screenshots.length} screenshots`);
    return;
  }
  if (command) throw new Error(`unknown native evidence command: ${command}`);
  const errors = auditRepository(repositoryRoot);
  if (errors.length > 0) {
    console.error("native evidence preflight failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log("native evidence preflight passed");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
