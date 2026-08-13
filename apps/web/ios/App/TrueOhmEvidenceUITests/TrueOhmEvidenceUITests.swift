import UIKit
import XCTest

final class TrueOhmEvidenceUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app = XCUIApplication()
        app.terminate()
        app.launchArguments = [
            "-AppleLanguages", "(en)",
            "-AppleLocale", "en_US",
            "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryL",
            "-ApplePersistenceIgnoreState", "YES",
        ]
        app.launch()

        XCTAssertEqual(
            XCUIDevice.shared.orientation,
            .portrait,
            "Evidence capture must remain in portrait orientation"
        )
        let webView = app.webViews.firstMatch
        XCTAssertTrue(webView.waitForExistence(timeout: 30), "TrueOhm web view did not launch")
        XCTAssertTrue(
            staticText(labeled: "POWER").waitForExistence(timeout: 15),
            "Default Ohm's Law result did not render"
        )
        resetPersistentEvidenceState()
    }

    override func tearDownWithError() throws {
        app?.terminate()
        app = nil
    }

    func test01OhmsLaw() {
        assertDefaultOhmsLaw()
        capture("01-ohms-law")
    }

    func test02ShowWork() {
        assertDefaultOhmsLaw()
        let showWork = button(labeled: "How this was calculated")
        XCTAssertTrue(showWork.waitForExistence(timeout: 10), "Show-work control is missing")
        XCTAssertTrue(showWork.isHittable, "Show-work control is not hittable")
        showWork.tap()
        XCTAssertTrue(
            element(containing: "P = V² / R").waitForExistence(timeout: 10),
            "The expanded Ohm's Law formula did not appear"
        )
        capture("02-show-work")
    }

    func test03ACPower() {
        tapMode("AC Power")
        XCTAssertTrue(
            staticText(labeled: "REAL POWER").waitForExistence(timeout: 10),
            "AC Power result did not render"
        )
        XCTAssertTrue(staticText(labeled: "70.668").exists, "Default AC result is not 70.668 kW")
        XCTAssertTrue(staticText(labeled: "kW").exists, "Default AC result unit is missing")
        XCTAssertEqual(textField(labeled: "Voltage (L-L for 3Ø)").value as? String, "480")
        XCTAssertEqual(textField(labeled: "Current").value as? String, "100")
        XCTAssertEqual(textField(labeled: "Power factor").value as? String, "0.85")
        capture("03-ac-power")
    }

    func test04PowerTriangle() {
        tapMode("Power Triangle")
        XCTAssertTrue(
            staticText(labeled: "APPARENT POWER").waitForExistence(timeout: 10),
            "Power Triangle result did not render"
        )
        XCTAssertTrue(staticText(labeled: "100").exists, "Default triangle result is not 100 kVA")
        XCTAssertTrue(staticText(labeled: "kVA").exists, "Default triangle result unit is missing")
        XCTAssertEqual(textField(labeled: "Real power").value as? String, "80")
        XCTAssertEqual(textField(labeled: "Apparent power").value as? String, "100")
        capture("04-power-triangle")
    }

    func test05FreeOfflineNoAccount() {
        let moreTools = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] %@", "More 509 Tools")
        ).firstMatch
        scrollUntilHittable(moreTools, description: "More 509 Tools")
        moreTools.tap()

        let promise = element(labeled: "TrueOhm is free, works offline, and requires no account.")
        XCTAssertTrue(promise.waitForExistence(timeout: 10), "Free/offline/no-account promise is missing")
        capture("05-free-offline-no-account")
    }

    private func assertDefaultOhmsLaw() {
        XCTAssertTrue(staticText(labeled: "1,440").exists, "Default Ohm's Law result is not 1,440 W")
        XCTAssertTrue(staticText(labeled: "watts").exists, "Default Ohm's Law result unit is missing")
        XCTAssertEqual(textField(labeled: "Voltage").value as? String, "120")
        XCTAssertEqual(textField(labeled: "Resistance").value as? String, "10")
    }

    /// Runs only in the evidence UI-test target. Toggling through the real control
    /// rewrites WebKit localStorage on every scene and always leaves the app dark.
    private func resetPersistentEvidenceState() {
        let switchToLight = button(labeled: "Switch to light mode")
        if switchToLight.exists {
            XCTAssertTrue(switchToLight.isHittable, "Dark-theme control is not hittable")
            switchToLight.tap()
        }

        let switchToDark = button(labeled: "Switch to dark mode")
        XCTAssertTrue(
            switchToDark.waitForExistence(timeout: 5),
            "The persisted theme could not be moved to light before reset"
        )
        XCTAssertTrue(switchToDark.isHittable, "Light-theme control is not hittable")
        switchToDark.tap()
        XCTAssertTrue(
            switchToLight.waitForExistence(timeout: 5),
            "The persisted evidence theme did not reset to dark"
        )
    }

    private func tapMode(_ label: String) {
        let modeSwitcher = element(labeled: "Calculator mode")
        XCTAssertTrue(
            modeSwitcher.waitForExistence(timeout: 10),
            "Calculator mode switcher is missing"
        )
        let queryMode = {
            modeSwitcher.descendants(matching: .any).matching(
                NSPredicate(format: "label == %@", label)
            ).firstMatch
        }
        var mode = queryMode()
        for _ in 0..<8 where !mode.isHittable {
            modeSwitcher.swipeLeft()
            mode = queryMode()
        }
        XCTAssertTrue(mode.waitForExistence(timeout: 10), "\(label) is missing")
        XCTAssertTrue(mode.isHittable, "\(label) remained non-hittable after scrolling")
        let initialValue = mode.value as? String
        XCTAssertEqual(initialValue, "0", "\(label) was unexpectedly selected before tapping")
        mode.tap()

        let selectedMode = queryMode()
        let selectedExpectation = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "value == %@", "1"),
            object: selectedMode
        )
        XCTAssertEqual(
            XCTWaiter.wait(for: [selectedExpectation], timeout: 10),
            .completed,
            "\(label) did not become selected after tapping"
        )
        XCTAssertEqual(selectedMode.value as? String, "1", "\(label) selected value is invalid")
    }

    private func scrollUntilHittable(
        _ target: XCUIElement,
        description: String
    ) {
        let webView = app.webViews.firstMatch
        XCTAssertTrue(target.waitForExistence(timeout: 10), "\(description) is missing")
        for _ in 0..<8 where !target.isHittable {
            webView.swipeUp()
        }
        XCTAssertTrue(target.isHittable, "\(description) remained non-hittable after scrolling")
    }

    private func button(labeled label: String) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "label == %@", label)).firstMatch
    }

    private func textField(labeled label: String) -> XCUIElement {
        app.textFields.matching(NSPredicate(format: "label == %@", label)).firstMatch
    }

    private func staticText(labeled label: String) -> XCUIElement {
        app.staticTexts.matching(NSPredicate(format: "label == %@", label)).firstMatch
    }

    private func element(labeled label: String) -> XCUIElement {
        app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
    }

    private func element(containing label: String) -> XCUIElement {
        app.descendants(matching: .any).matching(
            NSPredicate(format: "label CONTAINS %@", label)
        ).firstMatch
    }

    private func capture(_ name: String) {
        RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.5))
        let screenshot = XCUIScreen.main.screenshot()
        let png = screenshot.pngRepresentation
        XCTAssertGreaterThan(png.count, 50_000, "\(name) is implausibly small")

        guard let image = UIImage(data: png), let pixels = image.cgImage else {
            XCTFail("\(name) is not a decodable PNG screenshot")
            return
        }
        let supportedSize =
            (pixels.width == 1320 && pixels.height == 2868) ||
            (pixels.width == 2064 && pixels.height == 2752)
        XCTAssertTrue(
            supportedSize,
            "\(name) has unexpected dimensions \(pixels.width) x \(pixels.height)"
        )

        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
