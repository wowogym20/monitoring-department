Add-Type -AssemblyName System.Drawing
$origPath = "$PSScriptRoot\..\public\logo-tazakka.png"
$backupPath = "$PSScriptRoot\..\public\logo-tazakka.orig.png"

if (-not (Test-Path $backupPath)) {
    Copy-Item $origPath $backupPath
}

$src = [System.Drawing.Image]::FromFile($backupPath)
$targetWidth = 512
$targetHeight = 512
$bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$g.DrawImage($src, 0, 0, $targetWidth, $targetHeight)
$src.Dispose()
$bmp.Save($origPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$g.Dispose()

$newSize = (Get-Item $origPath).Length
Write-Host "New size of public/logo-tazakka.png: $newSize bytes"
