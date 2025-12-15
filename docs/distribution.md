# Distributing Zipline

This guide covers creating installable artifacts and a Homebrew formula.

## Build release binaries (macOS/Linux)
Compile the CLI into a single executable with Bun:
```bash
# From repo root
rm -rf dist
bun build --compile src/cli.ts --outfile dist/zipline-macos-arm64   # macOS Apple Silicon
bun build --compile src/cli.ts --outfile dist/zipline-macos-x64    # macOS Intel
bun build --compile src/cli.ts --outfile dist/zipline-linux-x64    # Linux x64
```

Generate checksums:
```bash
cd dist
shasum -a 256 zipline-* > checksums.txt
```

Create a GitHub release with the three binaries and `checksums.txt` attached.

## Homebrew tap formula
Create your tap repo (e.g., `JudeTejada/homebrew-tap`) and add a formula file `zipline.rb`:
```ruby
class Zipline < Formula
  desc "Download GitHub folders as a zip without cloning"
  homepage "https://github.com/JudeTejada/zipline"
  version "0.1.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/JudeTejada/zipline/releases/download/v0.1.0/zipline-macos-arm64"
      sha256 "<ARM64_SHA256>"
    else
      url "https://github.com/JudeTejada/zipline/releases/download/v0.1.0/zipline-macos-x64"
      sha256 "<X64_SHA256>"
    end
  end

  on_linux do
    url "https://github.com/JudeTejada/zipline/releases/download/v0.1.0/zipline-linux-x64"
    sha256 "<LINUX_X64_SHA256>"
  end

  def install
    bin.install Dir["zipline*"].first => "zipline"
  end
end
```

Replace `JudeTejada/zipline` with this repo’s owner/name and the `<SHA256>` placeholders with values from `checksums.txt`.

Publish the tap:
```bash
git add zipline.rb
git commit -m "Add zipline 0.1.0"
git push origin main
```

Users install via:
```bash
brew tap JudeTejada/tap
brew install zipline
```

## Alternative: Run directly with bunx (no install needed)
For environments with Bun available, users can run the CLI directly from GitHub without any installation:
```bash
# Run directly from GitHub (downloads and caches automatically)
bunx github:JudeTejada/zipline --interactive

# Or with a specific branch/tag
bunx github:JudeTejada/zipline#main --interactive
bunx github:JudeTejada/zipline#v0.1.0 --interactive
```

This approach:
- ✅ No cloning or manual install required
- ✅ Automatically downloads and caches the package
- ✅ Always runs the latest version (or specified tag)
- ✅ Works anywhere Bun is installed

## Local development install
For contributors who want to develop locally:
```bash
git clone https://github.com/JudeTejada/zipline.git
cd zipline
bun install
bun link  # Makes 'zipline' available globally
```

## Troubleshooting distribution
- **Binary won’t run:** Ensure you built with `bun build --compile` on the target architecture. Cross-compile by running the build on the matching OS/arch or using a CI matrix.
- **SHA mismatch in brew:** Update the formula SHA to match the uploaded asset’s checksum.
- **Homebrew “No available formula”:** Confirm the tap is tapped (`brew tap JudeTejada/tap`) and the formula file is named `zipline.rb`.
