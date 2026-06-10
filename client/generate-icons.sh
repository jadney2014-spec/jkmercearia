#!/bin/bash

# 🎨 Script de Geração de Ícones e Splash Screen
# Para o app Resgate Contabilidade baseado no Louve App

echo "🎨 Gerando ícones e splash screen para Resgate Contabilidade"
echo "========================================================"

# Cores do app
PRIMARY_COLOR="#1e40af"  # Azul escuro
SECONDARY_COLOR="#3b82f6" # Azul claro
ACCENT_COLOR="#f59e0b"   # Amarelo/ouro
BACKGROUND_COLOR="#ffffff" # Branco

# Criar diretórios
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi
mkdir -p android/app/src/main/res/drawable

echo "📱 Gerando ícones adaptativos..."

SOURCE_ICON="public/img/ICONE-RESGATE.png"

# Criar ícone base (usando ImageMagick se disponível)
if command -v convert &> /dev/null; then
    # Ícone principal (512x512)
    if [ -f "$SOURCE_ICON" ]; then
        convert "$SOURCE_ICON" -resize 512x512^ -gravity center -extent 512x512 icon-512.png
    else
        convert -size 512x512 xc:"$PRIMARY_COLOR" \
                -font Arial -pointsize 72 -fill white -gravity center \
                -annotate +0+0 "R" \
                icon-512.png
    fi
    
    # Gerar tamanhos para Android
    convert icon-512.png -resize 36x36 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
    convert icon-512.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
    convert icon-512.png -resize 72x72 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
    convert icon-512.png -resize 96x96 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
    convert icon-512.png -resize 144x144 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
    
    # Ícones round
    convert icon-512.png -resize 36x36 android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
    convert icon-512.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
    convert icon-512.png -resize 72x72 android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
    convert icon-512.png -resize 96x96 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
    convert icon-512.png -resize 144x144 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
    
    echo "✅ Ícones gerados com sucesso"
else
    echo "⚠️ ImageMagick não encontrado. Criando placeholders..."
    
    # Criar placeholders simples
    for size in 36 48 72 96 144; do
        convert -size ${size}x${size} xc:"$PRIMARY_COLOR" \
                -font Arial -pointsize $((size/3)) -fill white -gravity center \
                -annotate +0+0 "RC" \
                android/app/src/main/res/mipmap-$(get_density $size)/ic_launcher.png
        cp android/app/src/main/res/mipmap-$(get_density $size)/ic_launcher.png \
           android/app/src/main/res/mipmap-$(get_density $size)/ic_launcher_round.png
    done
fi

echo "🌊 Gerando splash screen..."

# Splash screen (1080x1920)
if command -v convert &> /dev/null; then
    convert -size 1080x1920 xc:"$PRIMARY_COLOR" \
            -font Arial -pointsize 56 -fill white -gravity center \
            -annotate +0+0 "Resgate" \
            splash-1080x1920.png
    
    # Copiar para drawable
    cp splash-1080x1920.png android/app/src/main/res/drawable/splash.png
    
    echo "✅ Splash screen gerado com sucesso"
else
    echo "⚠️ Splash screen não gerado (ImageMagick não encontrado)"
fi

# Função para determinar densidade
get_density() {
    case $1 in
        36) echo "hdpi" ;;
        48) echo "mdpi" ;;
        72) echo "xhdpi" ;;
        96) echo "xxhdpi" ;;
        144) echo "xxxhdpi" ;;
        *) echo "mdpi" ;;
    esac
}

echo "📝 Configurando strings.xml..."

# Criar strings.xml para Android
cat > android/app/src/main/res/values/strings.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Resgate</string>
    <string name="app_name_full">Resgate</string>
    <string name="app_description">Sistema de gestão e contabilidade</string>
    <string name="launcher_name">Resgate</string>
    <string name="activity_name">Resgate</string>
</resources>
EOF

echo "🎨 Configurando cores..."

# Criar colors.xml
cat > android/app/src/main/res/values/colors.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">#$PRIMARY_COLOR</color>
    <color name="primary_dark">#172554</color>
    <color name="secondary">#$SECONDARY_COLOR</color>
    <color name="accent">#$ACCENT_COLOR</color>
    <color name="background">#$BACKGROUND_COLOR</color>
    <color name="text_primary">#ffffff</color>
    <color name="text_secondary">#f3f4f6</color>
    <color name="splash_background">#$PRIMARY_COLOR</color>
</resources>
EOF

echo "🖼️ Configurando styles.xml..."

# Criar styles.xml
cat > android/app/src/main/res/values/styles.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
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
EOF

echo "📱 Configurando launcher_background.xml..."

# Criar launcher_background.xml
cat > android/app/src/main/res/drawable/launcher_background.xml << EOF
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
EOF

echo "🔧 Configurando splash_screen.xml..."

# Criar splash_screen.xml
cat > android/app/src/main/res/drawable/splash_screen.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background" />
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/splash" />
    </item>
</layer-list>
EOF

# Limpar arquivos temporários
rm -f icon-512.png splash-1080x1920.png

echo ""
echo "🎉 Ícones e splash screen configurados com sucesso!"
echo "=============================================="
echo "✅ Ícones gerados para todas as densidades"
echo "✅ Splash screen configurado"
echo "✅ Cores e temas definidos"
echo "✅ Strings localizadas"
echo ""
echo "📱 Execute 'npx cap sync android' para aplicar as mudanças"
echo "🔧 Execute './build-apk.sh' para gerar o APK final"
