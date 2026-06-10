# 🎨 Script de Geração de Ícones e Splash Screen (PowerShell)
# Para o app Resgate Contabilidade baseado no Louve App

[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()

Write-Host "🎨 Gerando ícones e splash screen para Resgate Contabilidade" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Cores do app
$PRIMARY_COLOR = "#1e40af"  # Azul escuro
$SECONDARY_COLOR = "#3b82f6" # Azul claro
$ACCENT_COLOR = "#f59e0b"   # Amarelo/ouro
$BACKGROUND_COLOR = "#ffffff" # Branco

$ICON_PADDING_RATIO = 0.15

# Criar diretórios
$directories = @(
    "android\app\src\main\res\mipmap-hdpi",
    "android\app\src\main\res\mipmap-mdpi", 
    "android\app\src\main\res\mipmap-xhdpi",
    "android\app\src\main\res\mipmap-xxhdpi",
    "android\app\src\main\res\mipmap-xxxhdpi",
    "android\app\src\main\res\drawable"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

Write-Host "📱 Gerando ícones adaptativos..." -ForegroundColor Blue

# Verificar se ImageMagick está disponível
$magickAvailable = Get-Command magick -ErrorAction SilentlyContinue

$SOURCE_ICON = "public\img\ICONE-RESGATE.png"

if ($magickAvailable) {
    Write-Host "✅ ImageMagick encontrado, gerando ícones de alta qualidade..." -ForegroundColor Green
    
    # Criar ícone base (512x512)
    if (Test-Path $SOURCE_ICON) {
        magick convert $SOURCE_ICON -resize 512x512^ -gravity center -extent 512x512 icon-512.png
    } else {
        magick convert -size 512x512 xc:$PRIMARY_COLOR `
                -font Arial -pointsize 72 -fill white -gravity center `
                -annotate +0+0 "R" `
                icon-512.png
    }
    
    # Gerar tamanhos para Android
    $iconSizes = @{
        "hdpi" = 36
        "mdpi" = 48
        "xhdpi" = 72
        "xxhdpi" = 96
        "xxxhdpi" = 144
    }
    
    foreach ($density in $iconSizes.Keys) {
        $size = $iconSizes[$density]
        
        # Ícone normal
        magick convert icon-512.png -resize ${size}x${size} `
                android\app\src\main\res\mipmap-$density\ic_launcher.png

        # Ícone foreground (usado por adaptive icon)
        magick convert icon-512.png -resize ${size}x${size} `
                android\app\src\main\res\mipmap-$density\ic_launcher_foreground.png
        
        # Ícone round
        magick convert icon-512.png -resize ${size}x${size} `
                android\app\src\main\res\mipmap-$density\ic_launcher_round.png
    }
    
    Write-Host "✅ Ícones gerados com sucesso" -ForegroundColor Green
    
    # Gerar splash screen (1080x1920)
    Write-Host "🌊 Gerando splash screen..." -ForegroundColor Blue
    magick convert -size 1080x1920 xc:$PRIMARY_COLOR `
            -font Arial -pointsize 56 -fill white -gravity center `
            -annotate +0+0 "Resgate" `
            splash-1080x1920.png
    
    # Copiar para drawable
    Copy-Item splash-1080x1920.png android\app\src\main\res\drawable\splash.png -Force
    
    Write-Host "✅ Splash screen gerado com sucesso" -ForegroundColor Green
    
    # Limpar arquivos temporários
    Remove-Item icon-512.png, splash-1080x1920.png -ErrorAction SilentlyContinue
} else {
    Write-Host "⚠️ ImageMagick não encontrado. Criando placeholders simples..." -ForegroundColor Yellow
    
    # Criar placeholders básicos usando PowerShell
    $iconSizes = @{
        "hdpi" = 36
        "mdpi" = 48
        "xhdpi" = 72
        "xxhdpi" = 96
        "xxxhdpi" = 144
    }
    
    foreach ($density in $iconSizes.Keys) {
        $size = $iconSizes[$density]
        
        if (Test-Path $SOURCE_ICON) {
            $srcImage = [System.Drawing.Image]::FromFile((Resolve-Path $SOURCE_ICON).Path)
            try {
                $pad = [Math]::Round($size * $ICON_PADDING_RATIO)
                $innerSize = $size - (2 * $pad)

                # ic_launcher.png (legado) - fundo branco, recorte circular para remover cantos pretos
                $launcher = New-Object System.Drawing.Bitmap($size, $size)
                $gLauncher = [System.Drawing.Graphics]::FromImage($launcher)
                $gLauncher.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $gLauncher.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $gLauncher.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $gLauncher.Clear([System.Drawing.Color]::White)

                $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
                $clipPath.AddEllipse(0, 0, $size, $size) | Out-Null
                $gLauncher.SetClip($clipPath)
                $gLauncher.DrawImage($srcImage, 0, 0, $size, $size)
                $gLauncher.ResetClip()

                # ic_launcher_foreground.png (adaptive) - transparente, com padding (zona segura)
                $foreground = New-Object System.Drawing.Bitmap($size, $size)
                $gForeground = [System.Drawing.Graphics]::FromImage($foreground)
                $gForeground.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $gForeground.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $gForeground.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $gForeground.Clear([System.Drawing.Color]::Transparent)

                $clipPath2 = New-Object System.Drawing.Drawing2D.GraphicsPath
                $clipPath2.AddEllipse($pad, $pad, $innerSize, $innerSize) | Out-Null
                $gForeground.SetClip($clipPath2)
                $gForeground.DrawImage($srcImage, $pad, $pad, $innerSize, $innerSize)
                $gForeground.ResetClip()

                $launcher.Save("android\app\src\main\res\mipmap-$density\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
                $launcher.Save("android\app\src\main\res\mipmap-$density\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
                $foreground.Save("android\app\src\main\res\mipmap-$density\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
            } finally {
                if ($clipPath) { $clipPath.Dispose() }
                if ($clipPath2) { $clipPath2.Dispose() }
                if ($gLauncher) { $gLauncher.Dispose() }
                if ($launcher) { $launcher.Dispose() }
                if ($gForeground) { $gForeground.Dispose() }
                if ($foreground) { $foreground.Dispose() }
                $srcImage.Dispose()
            }
        } else {
            # Criar ícone simples (placeholder)
            $bitmap = New-Object System.Drawing.Bitmap($size, $size)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.Clear([System.Drawing.Color]::FromArgb(30, 64, 175)) # Cor primária
            
            # Adicionar texto "RC"
            $font = New-Object System.Drawing.Font("Arial", $size/3, [System.Drawing.FontStyle]::Bold)
            $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
            $stringFormat = New-Object System.Drawing.StringFormat
            $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
            $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
            
            $graphics.DrawString("RC", $font, $brush, $size/2, $size/2, $stringFormat)
            
            $bitmap.Save("android\app\src\main\res\mipmap-$density\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
            $bitmap.Save("android\app\src\main\res\mipmap-$density\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
            $bitmap.Save("android\app\src\main\res\mipmap-$density\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
            
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }
    
    Write-Host "✅ Placeholders criados" -ForegroundColor Green
}

Write-Host "📝 Configurando strings.xml..." -ForegroundColor Blue

# Criar strings.xml para Android
$stringsXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Resgate</string>
    <string name="app_name_full">Resgate</string>
    <string name="app_description">Sistema de gestão e contabilidade</string>
    <string name="launcher_name">Resgate</string>
    <string name="activity_name">Resgate</string>
    <string name="title_activity_main">Resgate</string>
</resources>
"@

$stringsXml | Out-File -FilePath "android\app\src\main\res\values\strings.xml" -Encoding UTF8

Write-Host "🎨 Configurando cores..." -ForegroundColor Blue

# Criar colors.xml
$colorsXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">$PRIMARY_COLOR</color>
    <color name="primary_dark">#172554</color>
    <color name="secondary">$SECONDARY_COLOR</color>
    <color name="accent">$ACCENT_COLOR</color>
    <color name="background">$BACKGROUND_COLOR</color>
    <color name="text_primary">#ffffff</color>
    <color name="text_secondary">#f3f4f6</color>
    <color name="splash_background">$PRIMARY_COLOR</color>
</resources>
"@

$colorsXml | Out-File -FilePath "android\app\src\main\res\values\colors.xml" -Encoding UTF8

Write-Host "🖼️ Configurando styles.xml..." -ForegroundColor Blue

# Criar styles.xml
$stylesXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/primary</item>
        <item name="colorPrimaryDark">@color/primary_dark</item>
        <item name="colorAccent">@color/accent</item>
        <item name="android:windowBackground">@color/background</item>
    </style>

    <style name="AppTheme.NoActionBarLaunch" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="colorPrimary">@color/primary</item>
        <item name="colorPrimaryDark">@color/primary_dark</item>
        <item name="colorAccent">@color/accent</item>
        <item name="android:windowBackground">@color/background</item>
    </style>
    
    <style name="SplashTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:windowBackground">@drawable/splash</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
    </style>
</resources>
"@

$stylesXml | Out-File -FilePath "android\app\src\main\res\values\styles.xml" -Encoding UTF8

Write-Host "📱 Configurando launcher_background.xml..." -ForegroundColor Blue

# Criar launcher_background.xml
$launcherBackgroundXml = @'
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:fillColor="@color/primary"
        android:pathData="M0,0h108v108h-108z" />
    <path
        android:fillColor="@color/text_primary"
        android:pathData="M54,30c13.25,0 24,10.75 24,24s-10.75,24 -24,24s-24,-10.75 -24,-24s10.75,-24 24,-24z" />
</vector>
'@

$launcherBackgroundXml | Out-File -FilePath "android\app\src\main\res\drawable\launcher_background.xml" -Encoding UTF8

Write-Host "🔧 Configurando splash_screen.xml..." -ForegroundColor Blue

# Criar splash_screen.xml
$splashScreenXml = @'
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background" />
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/splash" />
    </item>
</layer-list>
'@

$splashScreenXml | Out-File -FilePath "android\app\src\main\res\drawable\splash_screen.xml" -Encoding UTF8

Write-Host "" 
Write-Host "🎉 Ícones e splash screen configurados com sucesso!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host "✅ Ícones gerados para todas as densidades" -ForegroundColor Green
Write-Host "✅ Splash screen configurado" -ForegroundColor Green
Write-Host "✅ Cores e temas definidos" -ForegroundColor Green
Write-Host "✅ Strings localizadas" -ForegroundColor Green
Write-Host "" 
Write-Host "📱 Execute 'npx cap sync android' para aplicar as mudanças" -ForegroundColor Cyan
Write-Host "🔧 Execute '.\build-apk.ps1' para gerar o APK final" -ForegroundColor Cyan

# Manter janela aberta por 3 segundos
Start-Sleep -Seconds 3
