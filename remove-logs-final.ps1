# Script final para remover todos os logs de debugging
$path = "c:\Users\Jadney Ranes\contabilidade\client\src"

Write-Host "Removendo todos os logs de debugging..."

Get-ChildItem -Path $path -Recurse -Include "*.tsx","*.ts" | ForEach-Object {
    $file = $_.FullName
    Write-Host "Processando: $($_.Name)"

    # Ler todo o conteúdo
    $lines = Get-Content $file

    # Filtrar linhas que não contenham os logs de debugging
    $filteredLines = $lines | Where-Object {
        $_ -notmatch "127\.0\.0\.1:7242" -and
        $_ -notmatch "// #region agent log" -and
        $_ -notmatch "// #endregion"
    }

    # Salvar o arquivo filtrado
    $filteredLines | Set-Content -Path $file -Encoding UTF8
}

Write-Host "Verificando se restaram logs..."
$remaining = Get-ChildItem -Path $path -Recurse -Include "*.tsx","*.ts" | Select-String -Pattern "127\.0\.0\.1:7242" | Measure-Object
Write-Host "Logs restantes: $($remaining.Count)"