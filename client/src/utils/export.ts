export const exportToCsv = (filename: string, data: any[]) => {
  if (data.length === 0) {
    console.warn("Nenhum dado para exportar.");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Adiciona o cabeçalho
  csvRows.push(headers.join(','));

  // Adiciona as linhas de dados
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/'/g, '""'); // Escapa aspas duplas
      return `"${escaped}"`; // Envolve o valor em aspas duplas
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

  // Cria um link temporário para download
  const link = document.createElement('a');
  if (link.download !== undefined) { // Verifica se o navegador suporta o atributo download
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Fallback para navegadores que não suportam o atributo download
    window.open(URL.createObjectURL(blob));
  }
};
