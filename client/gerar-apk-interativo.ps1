# Script Interativo para Gerar APK
# Permite escolher entre modo WEB (atualizacoes automaticas) ou BUNDLE (SDK completo offline)

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     GERADOR DE APK - ESCOLHA O MODO DE FUNCIONAMENTO" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Escolha o tipo de APK que deseja gerar:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1 - MODO WEB (Recomendado)" -ForegroundColor Green
Write-Host "   - Atualizacoes automaticas do servidor" -ForegroundColor Gray
Write-Host "   - Sempre carrega a versao mais recente" -ForegroundColor Gray
Write-Host "   - Nao precisa gerar novo APK para atualizar" -ForegroundColor Gray
Write-Host "   - Requer conexao com internet" -ForegroundColor Gray
Write-Host ""
Write-Host "2 - MODO BUNDLE (SDK Completo)" -ForegroundColor Green
Write-Host "   - Funciona completamente OFFLINE" -ForegroundColor Gray
Write-Host "   - Codigo completo embutido no APK" -ForegroundColor Gray
Write-Host "   - Nao depende do servidor web" -ForegroundColor Gray
Write-Host "   - Para atualizar, precisa gerar novo APK" -ForegroundColor Gray
Write-Host ""

$escolha = Read-Host "Digite sua escolha (1 ou 2)"

Write-Host ""

if ($escolha -eq "1") {
    Write-Host "Modo WEB selecionado!" -ForegroundColor Cyan
    Write-Host ""
    
    $assinado = Read-Host "Deseja gerar APK assinado? (S/N)"
    
    if ($assinado -eq "S" -or $assinado -eq "s") {
        Write-Host ""
        Write-Host "Executando script de APK WEB assinado..." -ForegroundColor Yellow
        .\gerar-apk-assinado.ps1
    } else {
        Write-Host ""
        Write-Host "Executando script de APK WEB nao assinado..." -ForegroundColor Yellow
        .\gerar-apk.ps1
    }
}
elseif ($escolha -eq "2") {
    Write-Host "Modo BUNDLE (SDK Completo) selecionado!" -ForegroundColor Cyan
    Write-Host ""
    
    $assinado = Read-Host "Deseja gerar APK assinado? (S/N)"
    
    if ($assinado -eq "S" -or $assinado -eq "s") {
        Write-Host ""
        Write-Host "Executando script de APK BUNDLE assinado..." -ForegroundColor Yellow
        .\gerar-apk-bundle-assinado.ps1
    } else {
        Write-Host ""
        Write-Host "Executando script de APK BUNDLE nao assinado..." -ForegroundColor Yellow
        .\gerar-apk-bundle.ps1
    }
}
else {
    Write-Host "ERRO: Opcao invalida! Escolha 1 ou 2." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Processo finalizado!" -ForegroundColor Green
