import XCTest

// Capture driver only. The product tree is pinned and unchanged. All actions use
// ordinary accessibility UI events. No model/state/save/network fixture injection.
final class ProjectP121CaptureTests: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "com.pui-core.truthorlie")

    override func setUpWithError() throws {
        continueAfterFailure = false
        print("PP121_DRIVER_REV coder09-adaptive-rounds")
        app.activate()
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 20))
    }

    func snap(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "PP121-" + name
        attachment.lifetime = .keepAlways
        add(attachment)
        print("PP121_SCREEN \(name)\n\(app.debugDescription)\nPP121_SCREEN_END")
    }

    func button(_ fragment: String) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "label CONTAINS %@", fragment)).firstMatch
    }

    func tap(_ fragment: String) {
        let target = button(fragment)
        XCTAssertTrue(target.waitForExistence(timeout: 10), "Missing actual UI button: \(fragment)")
        reveal(target)
        target.tap()
        Thread.sleep(forTimeInterval: 0.8)
    }

    func test01PilotNavigate() throws {
        snap("fresh-title")
        tap("プレイ")
        snap("play-selection")
        tap("ローカルで遊ぶ")
        tap("ローカル部屋作成")
        snap("local-room-create")
    }

    // The software keyboard (日本語ローマ字) overlaps the lower UI, and any drag
    // gesture performed while it is up lands on the keys and injects stray flick
    // characters into the focused field. So every scroll must happen with the
    // keyboard dismissed. `fill` assumes the keyboard is already down on entry;
    // callers dismiss it between fields with `dismissKeyboard`.
    func fill(_ field: XCUIElement, with text: String) {
        dismissKeyboard()
        XCTAssertTrue(field.exists)
        reveal(field)
        field.tap()
        if let old = field.value as? String, !old.isEmpty, old != field.placeholderValue {
            // A center tap may place the caret at the beginning, so repeating
            // backspace is not a reliable replacement. Use iOS's native edit menu.
            field.press(forDuration: 1.2)
            let predicate = NSPredicate(format: "label == %@ OR label == %@ OR label == %@", "すべてを選択", "Select All", "全選択")
            let menu = app.menuItems.matching(predicate).firstMatch
            let button = app.buttons.matching(predicate).firstMatch
            snap("native-clear-menu")
            if menu.exists && menu.isHittable { menu.tap() }
            else { XCTAssertTrue(button.exists && button.isHittable, "Native Select All unavailable"); button.tap() }
            field.typeText(XCUIKeyboardKey.delete.rawValue)
            let cleared = field.value as? String ?? ""
            XCTAssertTrue(cleared.isEmpty || cleared == field.placeholderValue, "Native selection did not clear field")
        }
        field.typeText(text)
    }

    // Commit IME composition and hide the keyboard via the app's own toolbar,
    // then assert it is gone so a later scroll cannot corrupt the answers.
    func dismissKeyboard() {
        if app.keyboards.count == 0 { return }
        // The keyboard's Done key inserts a newline in TextEditor; use the
        // product's visible 閉じる toolbar button instead.
        let close = app.buttons["閉じる"]
        XCTAssertTrue(close.waitForExistence(timeout: 3) && close.isHittable)
        close.tap()
        let gone = NSPredicate(format: "count == 0")
        expectation(for: gone, evaluatedWith: app.keyboards)
        waitForExpectations(timeout: 4)
        XCTAssertEqual(app.keyboards.count, 0, "Keyboard did not dismiss before scrolling")
    }

    func scrollToward(_ target: XCUIElement) {
        let up = target.frame.midY > app.frame.midY
        let a = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: up ? 0.72 : 0.35))
        let b = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: up ? 0.42 : 0.65))
        a.press(forDuration: 0.1, thenDragTo: b)
        Thread.sleep(forTimeInterval: 0.5)
    }

    func reveal(_ target: XCUIElement) {
        XCTAssertTrue(target.exists)
        for _ in 0..<10 {
            let f = target.frame
            let window = app.frame
            if target.isHittable && f.minY >= window.minY + 35 && f.maxY <= window.maxY - 35 { return }
            scrollToward(target)
        }
        let f = target.frame
        XCTAssertTrue(target.isHittable && f.minY >= app.frame.minY + 35 && f.maxY <= app.frame.maxY - 35, "Target not fully visible within safe touch area")
    }

    func test02SetupForFirstRound() throws {
        snap("ready-play-selection")
        if button("プレイ").exists { tap("プレイ") }
        if button("ローカルで遊ぶ").exists { tap("ローカルで遊ぶ") }
        tap("ローカル部屋作成")
        tap("2人で遊ぶ")
        snap("local-two-players")
        fill(app.textFields.element(boundBy: 0), with: "操作例A")
        fill(app.textFields.element(boundBy: 1), with: "操作例B")
        tap("ルール設定へ")
        snap("actual-rule-overview")
        tap("詳細ルール")
        snap("truth-settings-before")
        let declaration = button("嘘をつかない宣言")
        if declaration.label.contains("ON") { declaration.tap() }
        snap("truth-settings-normal-off")
        tap("戻る")
        tap("この設定で開始")
        snap("actual-round1-questions")
    }

    func test03FirstVoteCoder06() throws {
        let answers = [
            "小さな木の電車",
            "静かな短編映画",
            "赤い自転車",
            "旅行先の海辺",
            "ソファでそのまま寝る"
        ]
        snap("round1-input-start")
        XCTAssertEqual(app.textViews.count, 5)
        for i in 0..<5 {
            fill(app.textViews.element(boundBy: i), with: answers[i])
            dismissKeyboard()
            XCTAssertEqual(app.textViews.element(boundBy: i).value as? String, answers[i], "Actual answer differs after keyboard commit")
            snap("round1-answer-\(i+1)")
            Thread.sleep(forTimeInterval: 2.0)
        }
        let lies = app.buttons.matching(NSPredicate(format: "label == %@ OR label == %@", "嘘に選択", "この回答を嘘にする"))
        XCTAssertEqual(lies.count, 5)
        let selected = lies.element(boundBy: 2)
        reveal(selected)
        selected.tap()
        snap("round1-lie-selected-private-before-reveal")
        let submit = button("推理へ進む")
        reveal(submit)
        submit.tap()
        Thread.sleep(forTimeInterval: 1.0)
        snap("round1-guessing-top-neutral")
        for _ in 0..<3 { app.swipeUp(); Thread.sleep(forTimeInterval: 1.0) }
        snap("round1-guessing-bottom-neutral")
        for _ in 0..<3 { app.swipeDown(); Thread.sleep(forTimeInterval: 1.0) }
        Thread.sleep(forTimeInterval: 8.0)
        let vote = button("赤い自転車")
        reveal(vote)
        vote.tap()
        snap("round1-vote-selection")
        let confirm = button("投票する")
        reveal(confirm)
        confirm.tap()
        Thread.sleep(forTimeInterval: 1.5)
        snap("round1-actual-first-result")
        app.swipeUp()
        snap("round1-actual-score-and-review")
    }

    // The question-specific answer/vote driver follows the actual captured UI.
    func test04SecondRound() throws {
        tap("次のラウンド")
        snap("round2-actual-questions-before-input")
        XCTAssertEqual(app.textViews.count, 5)
        Thread.sleep(forTimeInterval: 3)
    }

    func test10InspectNextRound() throws {
        tap("次のラウンド")
        snap("next-round-actual-questions-before-input")
        XCTAssertEqual(app.textViews.count, 5)
        Thread.sleep(forTimeInterval: 2)
    }

    func playRound(_ name: String, answers: [String], lie: Int, vote: Int) {
        XCTAssertEqual(answers.count, 5)
        XCTAssertEqual(app.textViews.count, 5)
        snap(name + "-input-start")
        for i in 0..<5 {
            fill(app.textViews.element(boundBy: i), with: answers[i])
            dismissKeyboard()
            XCTAssertEqual(app.textViews.element(boundBy: i).value as? String, answers[i])
            snap(name + "-answer-\(i+1)")
            Thread.sleep(forTimeInterval: 1.5)
        }
        let choices = app.buttons.matching(NSPredicate(format: "label == %@ OR label == %@", "嘘に選択", "この回答を嘘にする"))
        XCTAssertEqual(choices.count, 5)
        let choice = choices.element(boundBy: lie)
        reveal(choice); choice.tap()
        snap(name + "-lie-selected-private-before-reveal")
        tap("推理へ進む")
        snap(name + "-guessing-top-neutral")
        for _ in 0..<3 { app.swipeUp(); Thread.sleep(forTimeInterval: 0.8) }
        snap(name + "-guessing-bottom-neutral")
        for _ in 0..<3 { app.swipeDown(); Thread.sleep(forTimeInterval: 0.8) }
        Thread.sleep(forTimeInterval: 7)
        let pick = vote < 0 ? button("真実のみ") : button(answers[vote]); reveal(pick); pick.tap()
        snap(name + "-vote-selected")
        tap("投票する")
        snap(name + "-actual-result")
        app.swipeUp()
        snap(name + "-actual-score-review")
        XCTAssertTrue(button("次のラウンド").exists || button("最終結果へ").exists)
    }

    func test20Round2Vote() throws {
        XCTAssertTrue(app.staticTexts["透明人間になれたらやってみたいこと"].exists)
        playRound("round2", answers: ["美術館をゆっくり歩く", "ワイヤレスイヤホン", "温かい味噌汁", "小説を読むこと", "机の片づけ"], lie: 4, vote: 1)
    }
    func test21Round3Vote() throws {
        XCTAssertTrue(app.staticTexts["ひそかに自慢に思っていること"].exists)
        playRound("round3", answers: ["毎朝の散歩が一年続いた", "朝の寝坊", "海辺の小さな家", "旅を描いた短編集", "文化祭の看板を逆さに付けた"], lie: 2, vote: 4)
    }
    func test22Round4VoteAndFinal() throws {
        XCTAssertTrue(app.staticTexts["魔法が1つ使えるなら欲しい能力"].exists)
        playRound("round4", answers: ["忘れ物をすぐ見つける力", "無糖のヨーグルト", "夜の学校の階段", "小さなノート", "自分の絵本を作ること"], lie: 1, vote: 1)
        for _ in 0..<2 { app.swipeUp(); Thread.sleep(forTimeInterval: 2) }
        snap("round4-actual-answer-review-bottom")
        tap("最終結果へ")
        snap("normal4R-actual-final-result")
        Thread.sleep(forTimeInterval: 4)
        app.swipeUp()
        snap("normal4R-actual-final-detail")
        XCTAssertTrue(button("タイトルへ戻る").exists)
    }

    func test30SetupTruthOnlyMatch() throws {
        tap("タイトルへ戻る")
        snap("after-normal-final-title")
        tap("プレイ"); tap("ローカルで遊ぶ"); tap("ローカル部屋作成"); tap("2人で遊ぶ")
        snap("truth-example-player-names-retained")
        tap("ルール設定へ")
        tap("ラウンド数を開く")
        snap("actual-round-count-options")
        let three = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@ AND label CONTAINS %@", "3", "ROUND")).firstMatch
        XCTAssertTrue(three.exists)
        reveal(three); three.tap()
        if button("ルール設定へ戻る").exists { tap("ルール設定へ戻る") }
        tap("詳細ルールを開く")
        snap("actual-truth-settings-before")
        let declaration = button("嘘をつかない宣言")
        XCTAssertTrue(declaration.exists)
        if declaration.label.contains("OFF") { reveal(declaration); declaration.tap() }
        XCTAssertTrue(declaration.label.contains("ON"), "Manual truth-only setting not confirmed ON")
        snap("actual-truth-settings-on")
        if button("ルール設定へ戻る").exists { tap("ルール設定へ戻る") } else { tap("戻る") }
        snap("truth-example-rules-before-start")
        tap("この設定で開始")
        snap("truth1-actual-questions")
        XCTAssertEqual(app.textViews.count, 5)
    }

    func playDeclaredTruthRound(_ name: String, answers: [String], vote: Int) {
        let declare = app.buttons["嘘をつかない"]
        XCTAssertTrue(declare.exists)
        reveal(declare); declare.tap()
        snap(name + "-declared-private-before-vote")
        XCTAssertTrue(button("真実のみで提出").exists)
        for i in 0..<5 {
            fill(app.textViews.element(boundBy: i), with: answers[i])
            dismissKeyboard()
            XCTAssertEqual(app.textViews.element(boundBy: i).value as? String, answers[i])
            snap(name + "-answer-\(i+1)")
            Thread.sleep(forTimeInterval: 1.5)
        }
        tap("真実のみで提出")
        snap(name + "-guessing-top-neutral-answers")
        for _ in 0..<3 { app.swipeUp(); Thread.sleep(forTimeInterval: 0.8) }
        snap(name + "-guessing-bottom-neutral-answers")
        for _ in 0..<3 { app.swipeDown(); Thread.sleep(forTimeInterval: 0.8) }
        Thread.sleep(forTimeInterval: 7)
        let pick = vote < 0 ? button("真実のみ") : button(answers[vote])
        reveal(pick); pick.tap()
        snap(name + "-vote-selected")
        tap("投票する")
        snap(name + "-actual-result")
        app.swipeUp(); snap(name + "-actual-score-review")
        XCTAssertTrue(button("次のラウンド").exists || button("最終結果へ").exists)
    }

    func test31Truth1Vote() throws {
        XCTAssertTrue(app.staticTexts["デートで行ってみたい場所"].exists)
        playDeclaredTruthRound("truth1", answers: ["海の見える水族館", "各地の美術館を巡る", "北欧の小さな町", "玄関で靴をそろえる", "夜に少し高いチョコ"], vote: -1)
    }
    func test32Truth2Vote() throws {
        XCTAssertTrue(app.staticTexts["人には理解されにくいこだわり"].exists)
        playRound("truth2", answers: ["本棚を背の高さでそろえる", "近所をゆっくり歩く", "世界の駅を紹介する番組", "地図を見ずに近所を案内できる", "家族への買い物メモ"], lie: 2, vote: -1)
    }
    func test33Truth3VoteAndFinal() throws {
        XCTAssertTrue(app.staticTexts["ライブやイベントで忘れられない場面"].exists)
        playDeclaredTruthRound("truth3", answers: ["会場全体で手拍子がそろった時", "地図を開く前に道を探す時", "青いビー玉", "窓のそばの椅子", "大人数の前で自己紹介すること"], vote: 1)
        for _ in 0..<2 { app.swipeUp(); Thread.sleep(forTimeInterval: 1) }
        tap("最終結果へ")
        snap("truth3R-actual-final-result")
        Thread.sleep(forTimeInterval: 3)
        app.swipeUp(); snap("truth3R-actual-final-detail")
        XCTAssertTrue(button("タイトルへ戻る").exists)
    }
    func test40History() throws {
        tap("タイトルへ戻る"); tap("プレイ")
        snap("history-entry-play-selection")
        tap("履歴")
        snap("actual-history-list-top")
        Thread.sleep(forTimeInterval: 3)
        app.swipeUp(); snap("actual-history-list-lower")
        Thread.sleep(forTimeInterval: 3)
    }
}
