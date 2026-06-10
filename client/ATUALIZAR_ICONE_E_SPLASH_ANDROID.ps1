$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

# Gera icones Android (mipmap-*) e splash nativo (@drawable/splash) a partir de public/img/ICONE-RESGATE.png
# Nao altera styles.xml/manifest/etc; apenas imagens.

function Ensure-File {
  param([string]$Path, [string]$Label)
  if (-not (Test-Path $Path)) {
    Write-Host "ERRO: $Label nao encontrado: $Path" -ForegroundColor Red
    exit 1
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$sourceIcon = Join-Path $scriptDir 'public\img\ICONE-RESGATE.png'
Ensure-File -Path $sourceIcon -Label 'Imagem base do icone'

Add-Type -AssemblyName System.Drawing

# Padding (zona segura) para nao cortar no icon round/adaptive
$ICON_PADDING_RATIO = 0.22

# Tamanhos Android (px) tipicos para ic_launcher em mipmap-*
$iconSizes = @{
  'mdpi' = 48
  'hdpi' = 72
  'xhdpi' = 96
  'xxhdpi' = 144
  'xxxhdpi' = 192
}

# Pastas
$baseRes = Join-Path $scriptDir 'android\app\src\main\res'

# Carregar imagem fonte
$src = [System.Drawing.Image]::FromFile($sourceIcon)

try {
  foreach ($density in $iconSizes.Keys) {
    $size = [int]$iconSizes[$density]

    $mipmapDir = Join-Path $baseRes ("mipmap-$density")
    New-Item -ItemType Directory -Force -Path $mipmapDir | Out-Null

    $pad = [Math]::Round($size * $ICON_PADDING_RATIO)
    $inner = $size - (2 * $pad)

    # ic_launcher.png (legado) - fundo branco, recorte circular (remove cantos pretos)
    $launcher = New-Object System.Drawing.Bitmap($size, $size)
    $gLauncher = [System.Drawing.Graphics]::FromImage($launcher)
    $gLauncher.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gLauncher.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gLauncher.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gLauncher.Clear([System.Drawing.Color]::White)

    $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $clipPath.AddEllipse(0, 0, $size, $size) | Out-Null
    $gLauncher.SetClip($clipPath)
    $gLauncher.DrawImage($src, 0, 0, $size, $size)
    $gLauncher.ResetClip()

    # ic_launcher_round.png (mesma arte, round)
    $launcherRound = New-Object System.Drawing.Bitmap($launcher)

    # ic_launcher_foreground.png (adaptive) - transparente e com padding
    $foreground = New-Object System.Drawing.Bitmap($size, $size)
    $gForeground = [System.Drawing.Graphics]::FromImage($foreground)
    $gForeground.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gForeground.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gForeground.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gForeground.Clear([System.Drawing.Color]::Transparent)

    $clipPath2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $clipPath2.AddEllipse($pad, $pad, $inner, $inner) | Out-Null
    $gForeground.SetClip($clipPath2)
    $gForeground.DrawImage($src, $pad, $pad, $inner, $inner)
    $gForeground.ResetClip()

    $launcher.Save((Join-Path $mipmapDir 'ic_launcher.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $launcherRound.Save((Join-Path $mipmapDir 'ic_launcher_round.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $foreground.Save((Join-Path $mipmapDir 'ic_launcher_foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)

    $clipPath.Dispose()
    $clipPath2.Dispose()
    $gLauncher.Dispose()
    $gForeground.Dispose()
    $launcher.Dispose()
    $launcherRound.Dispose()
    $foreground.Dispose()

    Write-Host "OK - icones $density gerados" -ForegroundColor Green
  }

  # Splash nativo (@drawable/splash): manter transparente, menor e centralizado (evitar corte)
  $splashSize = 512
  $splashPadRatio = 0.20
  $splashPad = [Math]::Round($splashSize * $splashPadRatio)
  $splashInner = $splashSize - (2 * $splashPad)

  $splash = New-Object System.Drawing.Bitmap($splashSize, $splashSize)
  $gSplash = [System.Drawing.Graphics]::FromImage($splash)
  $gSplash.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $gSplash.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $gSplash.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $gSplash.Clear([System.Drawing.Color]::Transparent)

  $clipPath3 = New-Object System.Drawing.Drawing2D.GraphicsPath
  $clipPath3.AddEllipse($splashPad, $splashPad, $splashInner, $splashInner) | Out-Null
  $gSplash.SetClip($clipPath3)
  $gSplash.DrawImage($src, $splashPad, $splashPad, $splashInner, $splashInner)
  $gSplash.ResetClip()

  $drawableDirs = @(
    'drawable',
    'drawable-port-hdpi','drawable-port-mdpi','drawable-port-xhdpi','drawable-port-xxhdpi','drawable-port-xxxhdpi',
    'drawable-land-hdpi','drawable-land-mdpi','drawable-land-xhdpi','drawable-land-xxhdpi','drawable-land-xxxhdpi'
  )

  foreach ($d in $drawableDirs) {
    $dir = Join-Path $baseRes $d
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $outPath = Join-Path $dir 'splash.png'
    $splash.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }

  $clipPath3.Dispose()
  $gSplash.Dispose()
  $splash.Dispose()

  Write-Host "OK - splash.png atualizado em drawable*/" -ForegroundColor Green
  Write-Host "" 
  Write-Host "Proximo passo: rode 'npx cap sync android' e gere o APK novamente." -ForegroundColor Cyan

} finally {
  $src.Dispose()
}
