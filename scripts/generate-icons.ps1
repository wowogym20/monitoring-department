if (!(Test-Path -Path "public/icons")) {
    New-Item -ItemType Directory -Force -Path "public/icons" | Out-Null
}

Add-Type -AssemblyName System.Drawing

function Generate-PwaIcon {
    param(
        [string]$SourcePath,
        [string]$DestPath,
        [int]$Width,
        [int]$Height
    )
    $orig = [System.Drawing.Image]::FromFile($SourcePath)
    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($orig, 0, 0, $Width, $Height)
    $bmp.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $orig.Dispose()
    Write-Output "Generated $DestPath ($Width x $Height)"
}

$src = (Resolve-Path "public/logo-tazakka.png").Path
Generate-PwaIcon -SourcePath $src -DestPath "public/icons/icon-192x192.png" -Width 192 -Height 192
Generate-PwaIcon -SourcePath $src -DestPath "public/icons/icon-512x512.png" -Width 512 -Height 512
Generate-PwaIcon -SourcePath $src -DestPath "public/icons/apple-touch-icon.png" -Width 180 -Height 180
