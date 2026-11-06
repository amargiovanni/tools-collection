// Renders PDF pages with PDFKit, the engine macOS Preview uses, so a handout is
// checked the way readers on macOS see it. pdftoppm draws transparency correctly
// and hides what Preview gets wrong.
// Usage: swift render-preview.swift <file.pdf> <out-prefix> [width]
import AppKit
import PDFKit

let args = CommandLine.arguments
guard args.count >= 3, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
	FileHandle.standardError.write("usage: render-preview.swift <file.pdf> <out-prefix> [width]\n".data(using: .utf8)!)
	exit(1)
}
let width = args.count > 3 ? CGFloat(Double(args[3]) ?? 700) : 700
for i in 0..<doc.pageCount {
	guard let page = doc.page(at: i) else { continue }
	let box = page.bounds(for: .mediaBox)
	let size = NSSize(width: width, height: width * box.height / box.width)
	let image = page.thumbnail(of: size, for: .mediaBox)
	guard let tiff = image.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
		let png = rep.representation(using: .png, properties: [:]) else { continue }
	try png.write(to: URL(fileURLWithPath: String(format: "%@-%02d.png", args[2], i + 1)))
}
print("\(doc.pageCount) pages")
