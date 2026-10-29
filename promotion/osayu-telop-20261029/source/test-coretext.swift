import Foundation
import CoreText
import CoreGraphics
import ImageIO

// Headless macOS CoreText compatibility test. Registers fonts only in this
// process and does not interact with applications, iPhone, or Simulator.
let arguments = CommandLine.arguments
guard arguments.count >= 3 else {
    fatalError("usage: test-coretext <output-directory> [--words] [--names=font-names.json] <font.ttf>...")
}
let output = URL(fileURLWithPath: arguments[1], isDirectory: true)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
let wholeWords = arguments.contains("--words")
let width = wholeWords ? 1900 : 1100, height = wholeWords ? 1480 : 340
let pointSize: CGFloat = wholeWords ? 180 : 180
let strings = wholeWords ? ["ありがとう", "初見さん歓迎", "おはさゆ", "音桜夢", "感謝 応援 配信中"] : ["あ配A"]
let fontFiles = arguments.dropFirst(2).filter { !$0.hasPrefix("--") }
var familyMap: [String: Any] = [:]
if let nameArgument = arguments.first(where: { $0.hasPrefix("--names=") }) {
    let data = try Data(contentsOf: URL(fileURLWithPath: String(nameArgument.dropFirst(8))))
    familyMap = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
}
let backgrounds: [(String, [CGFloat])] = [
    ("transparent", [0, 0, 0, 0]),
    ("offwhite", [244.0 / 255, 248.0 / 255, 251.0 / 255, 1]),
    ("white", [1, 1, 1, 1]),
]

func inspectFont(_ file: String) throws -> [String: Any] {
    let url = URL(fileURLWithPath: file)
    var fontError: Unmanaged<CFError>?
    let registered = CTFontManagerRegisterFontsForURL(url as CFURL, .process, &fontError)
    guard registered else {
        throw NSError(domain: "CoreTextRegistration", code: 1,
                      userInfo: [NSLocalizedDescriptionKey: fontError?.takeRetainedValue().localizedDescription ?? "registration failed"])
    }
    defer { CTFontManagerUnregisterFontsForURL(url as CFURL, .process, nil) }
    guard let descriptors = CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as? [CTFontDescriptor],
          let descriptor = descriptors.first else {
        throw NSError(domain: "CoreTextDescriptor", code: 2)
    }
    let font = CTFontCreateWithFontDescriptor(descriptor, pointSize, nil)
    let attributes: [NSAttributedString.Key: Any] = [
        NSAttributedString.Key(kCTFontAttributeName as String): font,
        NSAttributedString.Key(kCTForegroundColorFromContextAttributeName as String): true,
    ]
    let lines = strings.map { CTLineCreateWithAttributedString(NSAttributedString(string: $0, attributes: attributes)) }
    var lineRecords: [[String: Any]] = []
    for (index, line) in lines.enumerated() {
        let runs = CTLineGetGlyphRuns(line) as! [CTRun]
        var actualRuns: [[String: Any]] = []
        var minimumAdvance = CGFloat.greatestFiniteMagnitude
        for run in runs {
            let attrs = CTRunGetAttributes(run) as NSDictionary
            let runFont = attrs[kCTFontAttributeName] as! CTFont
            let n = CTRunGetGlyphCount(run)
            var glyphs = [CGGlyph](repeating: 0, count: n)
            var positions = [CGPoint](repeating: .zero, count: n)
            var advances = [CGSize](repeating: .zero, count: n)
            CTRunGetGlyphs(run, CFRange(location: 0, length: 0), &glyphs)
            CTRunGetPositions(run, CFRange(location: 0, length: 0), &positions)
            CTRunGetAdvances(run, CFRange(location: 0, length: 0), &advances)
            for advance in advances { minimumAdvance = min(minimumAdvance, advance.width) }
            actualRuns.append(["postScriptName": CTFontCopyPostScriptName(runFont) as String,
                               "glyphCount": n, "glyphs": glyphs.map { Int($0) },
                               "positions": positions.map { [$0.x, $0.y] },
                               "advances": advances.map { [$0.width, $0.height] }])
        }
        let lineWidth = CTLineGetTypographicBounds(line, nil, nil, nil)
        lineRecords.append(["text": strings[index], "typographicWidth": lineWidth,
                            "minimumGlyphAdvance": minimumAdvance,
                            "fitsHorizontalCanvas": lineWidth + 96 < Double(width),
                            "resolvedRuns": actualRuns])
    }
    let nameEntry = familyMap[url.lastPathComponent] as? [String: Any] ?? [:]
    let aliases = nameEntry["aliases"] as? [[String: Any]] ?? []
    let expectedPostScript = CTFontCopyPostScriptName(font) as String
    let aliasResults: [[String: Any]] = aliases.map { item in
        let name = item["name"] as? String ?? ""
        let aliasFont = CTFontCreateWithName(name as CFString, pointSize, nil)
        let actual = CTFontCopyPostScriptName(aliasFont) as String
        return ["name": name, "language": item["language"] as? String ?? "",
                "nameId": item["nameId"] as? Int ?? -1,
                "resolvedPostScript": actual, "matches": actual == expectedPostScript]
    }
    var images: [[String: Any]] = []
    for (name, background) in backgrounds {
        let count = width * height * 4
        let pixels = UnsafeMutablePointer<UInt8>.allocate(capacity: count)
        pixels.initialize(repeating: 0, count: count)
        defer { pixels.deallocate() }
        guard let space = CGColorSpace(name: CGColorSpace.sRGB),
              let context = CGContext(data: UnsafeMutableRawPointer(pixels),
                                      width: width, height: height,
                                      bitsPerComponent: 8, bytesPerRow: width * 4,
                                      space: space,
                                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue |
                                        CGBitmapInfo.byteOrder32Big.rawValue) else {
            throw NSError(domain: "BitmapContext", code: 3)
        }
        context.clear(CGRect(x: 0, y: 0, width: width, height: height))
        if background[3] > 0 {
            context.setFillColor(CGColor(red: background[0], green: background[1],
                                         blue: background[2], alpha: background[3]))
            context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        }
        // A monochrome fallback must visibly become red. Embedded palette
        // colors should remain cyan and white under the same text-fill state.
        context.setFillColor(CGColor(red: 1, green: 0, blue: 0, alpha: 1))
        context.textMatrix = .identity
        for (index, line) in lines.enumerated() {
            context.textPosition = CGPoint(x: 48, y: CGFloat(wholeWords ? height - 190 - index * 260 : 90))
            CTLineDraw(line, context)
        }
        guard let image = context.makeImage() else {
            throw NSError(domain: "BitmapImage", code: 4)
        }
        let imageName = url.deletingPathExtension().lastPathComponent + "-" + name + ".png"
        let imageURL = output.appendingPathComponent(imageName)
        guard let destination = CGImageDestinationCreateWithURL(imageURL as CFURL,
                                                                "public.png" as CFString, 1, nil) else {
            throw NSError(domain: "PNGDestination", code: 5)
        }
        CGImageDestinationAddImage(destination, image, nil)
        guard CGImageDestinationFinalize(destination) else {
            throw NSError(domain: "PNGWrite", code: 6)
        }
        var cyan = 0, red = 0, white = 0, transparent = 0, changed = 0
        var minX = width, minY = height, maxX = -1, maxY = -1, edgePixels = 0
        var rowCyan = [Int](repeating: 0, count: strings.count)
        var rowRed = [Int](repeating: 0, count: strings.count)
        let br = Int((background[0] * 255).rounded())
        let bg = Int((background[1] * 255).rounded())
        let bb = Int((background[2] * 255).rounded())
        for index in stride(from: 0, to: count, by: 4) {
            let r = Int(pixels[index]), g = Int(pixels[index + 1])
            let b = Int(pixels[index + 2]), a = Int(pixels[index + 3])
            let row = wholeWords ? (index / 4 / width) / 260 : 0
            if a == 0 { transparent += 1 }
            if a > 128 && g - r > 20 && b - r > 20 {
                cyan += 1
                if row < strings.count { rowCyan[row] += 1 }
            }
            if a > 128 && r > 100 && r - g > 45 && r - b > 45 {
                red += 1
                if row < strings.count { rowRed[row] += 1 }
            }
            if a > 200 && r > 225 && g > 225 && b > 225 { white += 1 }
            if background[3] == 0 ? a > 0 :
                abs(r - br) + abs(g - bg) + abs(b - bb) > 10 { changed += 1 }
            let changedHere = background[3] == 0 ? a > 0 :
                abs(r - br) + abs(g - bg) + abs(b - bb) > 10
            if changedHere {
                let pixel = index / 4, x = pixel % width, y = pixel / width
                minX = min(minX, x); minY = min(minY, y)
                maxX = max(maxX, x); maxY = max(maxY, y)
                if x < 8 || y < 8 || x >= width - 8 || y >= height - 8 { edgePixels += 1 }
            }
        }
        images.append(["file": imageName, "width": width, "height": height,
                       "cyanPixels": cyan, "redFallbackPixels": red,
                       "whitePixels": white, "transparentPixels": transparent,
                       "changedPixels": changed, "embeddedColorObserved": cyan > 100,
                       "monochromeRedObserved": red > 100,
                       "paintBounds": [minX, minY, maxX, maxY],
                       "edgePaintPixels": edgePixels, "canvasClippingObserved": edgePixels > 0,
                       "rows": strings.enumerated().map { index, text in
                           ["text": text, "cyanPixels": rowCyan[index], "redPixels": rowRed[index]] as [String: Any]
                       }])
    }
    return ["input": file, "registrationScope": "process", "registered": registered,
            "family": CTFontCopyFamilyName(font) as String,
            "postScriptName": CTFontCopyPostScriptName(font) as String,
            "symbolicTraitsRaw": CTFontGetSymbolicTraits(font).rawValue,
            "texts": strings, "pointSize": pointSize, "requestedFill": "red",
            "lines": lineRecords, "familyAliasChecks": aliasResults, "images": images]
}

var reports: [[String: Any]] = []
for file in fontFiles {
    do { reports.append(try inspectFont(file)) }
    catch { reports.append(["input": file, "error": error.localizedDescription]) }
}
let report: [String: Any] = [
    "platform": "macOS CoreText headless", "os": ProcessInfo.processInfo.operatingSystemVersionString,
    "testedApplication": "custom headless CoreText bitmap renderer",
    "iphoneTest": false, "ibisPaintTest": false, "fonts": reports,
]
let data = try JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys])
try data.write(to: output.appendingPathComponent("coretext-report.json"))
print(String(data: data, encoding: .utf8)!)
