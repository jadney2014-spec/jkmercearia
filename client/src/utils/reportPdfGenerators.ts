import PDFGenerator, { PDF_CONFIG } from './pdfGenerator';
import { parseDateOnly } from './dateOnly';

// Interfaces para os dados dos relatórios
interface MonthlyBalance {
  income: { total: number; count: number };
  expense: { total: number; count: number };
  balance: number;
  period: { year: number; month: number };
}

interface YearlyBalance {
  year: number;
  monthlyData: {
    month: string;
    monthName: string;
    income: number;
    expense: number;
    balance: number;
  }[];
  yearlyTotal: {
    income: number;
    expense: number;
    balance: number;
  };
}

interface CategoryData {
  id: string;
  name: string;
  color: string;
  transaction_count: number;
  total_amount: number;
  average_amount: number;
}

interface CashFlowData {
  period: string;
  income: number;
  expense: number;
  balance: number;
}

interface MemberContribution {
  id: string;
  name: string;
  email: string;
  contribution_count: number;
  total_contributed: number;
  average_contribution: number;
  first_contribution: string;
  last_contribution: string;
}

interface ChurchInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// Gerador para Balanço Mensal
export const generateMonthlyBalancePDF = (
  data: MonthlyBalance,
  churchInfo?: ChurchInfo
): void => {
  const monthName = new Date(data.period.year, data.period.month - 1)
    .toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  
  const generator = new PDFGenerator({
    title: 'Balanço Mensal',
    subtitle: `${capitalizedMonth} de ${data.period.year}`,
    churchInfo,
    period: `${capitalizedMonth} de ${data.period.year}`
  });

  // Resumo executivo
  generator.addSection('Resumo Executivo', 14);
  generator.addText(
    `Este relatório apresenta o balanço financeiro do mês de ${capitalizedMonth} de ${data.period.year}, ` +
    `detalhando as receitas e despesas registradas no período.`,
    10
  );
  generator.addSpacing(5);

  // Cards de resumo
  generator.addSummaryCard('Total de Receitas', data.income.total, 'success');
  generator.addSummaryCard('Total de Despesas', data.expense.total, 'danger');
  generator.addSummaryCard('Saldo do Mês', data.balance, data.balance >= 0 ? 'success' : 'danger');
  generator.finishCardRow();
  generator.addSpacing(5);

  // Detalhamento
  generator.addSection('Detalhamento', 12);
  
  const summaryRows: (string | number)[][] = [
    ['Receitas', data.income.count.toString(), data.income.total],
    ['Despesas', data.expense.count.toString(), data.expense.total],
    ['Saldo Final', (data.income.count + data.expense.count).toString(), data.balance]
  ];

  generator.addTable(
    ['Categoria', 'Transações', 'Valor Total'],
    summaryRows,
    [60, 50, 40]
  );

  // Análise percentual
  generator.addSpacing(5);
  generator.addSection('Análise Percentual', 12);
  
  const total = Math.abs(data.income.total) + Math.abs(data.expense.total);
  const incomePercent = total > 0 ? ((data.income.total / total) * 100).toFixed(1) : '0';
  const expensePercent = total > 0 ? ((Math.abs(data.expense.total) / total) * 100).toFixed(1) : '0';
  
  generator.addText(`Receitas representam ${incomePercent}% do total movimentado.`, 10);
  generator.addText(`Despesas representam ${expensePercent}% do total movimentado.`, 10);
  
  if (data.balance >= 0) {
    generator.addText(
      `O saldo positivo de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.balance)} ` +
      `indica uma situação financeira saudável no período.`,
      10,
      false,
      PDF_CONFIG.colors.success
    );
  } else {
    generator.addText(
      `Atenção: O saldo negativo de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(data.balance))} ` +
      `requer atenção na gestão financeira.`,
      10,
      false,
      PDF_CONFIG.colors.danger
    );
  }

  generator.save(`Balanco_Mensal_${capitalizedMonth}_${data.period.year}.pdf`);
};

// Gerador para Balanço Anual
export const generateYearlyBalancePDF = (
  data: YearlyBalance,
  churchInfo?: ChurchInfo
): void => {
  const generator = new PDFGenerator({
    title: 'Balanço Anual',
    subtitle: `Ano ${data.year}`,
    churchInfo,
    period: `Ano ${data.year}`
  });

  // Resumo executivo
  generator.addSection('Resumo Executivo Anual', 14);
  generator.addText(
    `Este relatório apresenta o balanço financeiro do ano de ${data.year}, ` +
    `com o detalhamento mensal das receitas, despesas e saldos.`,
    10
  );
  generator.addSpacing(5);

  // Cards de resumo anual
  generator.addSummaryCard('Receitas Anuais', data.yearlyTotal.income, 'success');
  generator.addSummaryCard('Despesas Anuais', data.yearlyTotal.expense, 'danger');
  generator.addSummaryCard(
    'Saldo Anual',
    data.yearlyTotal.balance,
    data.yearlyTotal.balance >= 0 ? 'success' : 'danger'
  );
  generator.finishCardRow();
  generator.addSpacing(5);

  // Gráfico de barras mensal
  if (data.monthlyData.length > 0) {
    generator.addSection('Evolução Mensal', 12);
    
    const chartData = data.monthlyData.slice(0, 6).map(month => ({
      label: month.monthName.substring(0, 3),
      value: month.balance,
      color: (month.balance >= 0 ? 'success' : 'danger') as 'success' | 'danger'
    }));
    
    generator.addBarChart(chartData);
    generator.addSpacing(5);
  }

  // Tabela mensal detalhada
  generator.addSection('Detalhamento Mensal', 12);
  
  const monthlyRows: (string | number)[][] = data.monthlyData.map(month => [
    month.monthName,
    month.income,
    month.expense,
    month.balance
  ]);

  generator.addTable(
    ['Mês', 'Receitas', 'Despesas', 'Saldo'],
    monthlyRows,
    [45, 40, 40, 35]
  );

  // Análise anual
  generator.addSpacing(5);
  generator.addSection('Análise Anual', 12);
  
  const avgMonthlyIncome = data.yearlyTotal.income / 12;
  const avgMonthlyExpense = data.yearlyTotal.expense / 12;
  const avgMonthlyBalance = data.yearlyTotal.balance / 12;
  
  generator.addText(`Média mensal de receitas: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgMonthlyIncome)}`, 10);
  generator.addText(`Média mensal de despesas: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgMonthlyExpense)}`, 10);
  generator.addText(`Média mensal de saldo: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgMonthlyBalance)}`, 10);

  const bestMonth = data.monthlyData.reduce((best, current) => 
    current.balance > best.balance ? current : best
  );
  const worstMonth = data.monthlyData.reduce((worst, current) => 
    current.balance < worst.balance ? current : worst
  );

  generator.addSpacing(3);
  generator.addText(`Melhor mês: ${bestMonth.monthName} (Saldo: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bestMonth.balance)})`, 10, true);
  generator.addText(`Mês mais desafiador: ${worstMonth.monthName} (Saldo: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(worstMonth.balance)})`, 10, true);

  generator.save(`Balanco_Anual_${data.year}.pdf`);
};

// Gerador para Relatório por Categoria
export const generateCategoryReportPDF = (
  incomeData: CategoryData[],
  expenseData: CategoryData[],
  startDate: string,
  endDate: string,
  churchInfo?: ChurchInfo
): void => {
  const startDateFormatted = parseDateOnly(startDate).toLocaleDateString('pt-BR');
  const endDateFormatted = parseDateOnly(endDate).toLocaleDateString('pt-BR');
  
  const generator = new PDFGenerator({
    title: 'Relatório por Categoria',
    subtitle: `Período: ${startDateFormatted} a ${endDateFormatted}`,
    churchInfo,
    period: `${startDateFormatted} a ${endDateFormatted}`
  });

  const totalIncome = incomeData.reduce((sum, cat) => sum + cat.total_amount, 0);
  const totalExpense = expenseData.reduce((sum, cat) => sum + cat.total_amount, 0);
  const totalBalance = totalIncome - totalExpense;

  // Resumo executivo
  generator.addSection('Resumo Executivo', 14);
  generator.addText(
    `Este relatório apresenta a análise detalhada de receitas e despesas por categoria ` +
    `no período de ${startDateFormatted} a ${endDateFormatted}.`,
    10
  );
  generator.addSpacing(5);

  // Cards de resumo
  generator.addSummaryCard('Total Receitas', totalIncome, 'success');
  generator.addSummaryCard('Total Despesas', totalExpense, 'danger');
  generator.addSummaryCard('Saldo', totalBalance, totalBalance >= 0 ? 'success' : 'danger');
  generator.finishCardRow();
  generator.addSpacing(5);

  // Receitas por categoria
  if (incomeData.length > 0) {
    generator.addSection('Receitas por Categoria', 12);
    
    const incomeRows: (string | number)[][] = incomeData.map(cat => {
      const percentage = totalIncome > 0 ? ((cat.total_amount / totalIncome) * 100).toFixed(1) : '0';
      return [
        cat.name,
        cat.transaction_count.toString(),
        cat.total_amount,
        cat.average_amount,
        `${percentage}%`
      ];
    });

    generator.addTable(
      ['Categoria', 'Transações', 'Total', 'Média', 'Percentual'],
      incomeRows,
      [35, 25, 30, 30, 20]
    );
    generator.addSpacing(5);

    // Gráfico de receitas
    if (incomeData.length > 0 && incomeData.length <= 6) {
      const chartData = incomeData.map(cat => ({
        label: cat.name.substring(0, 10),
        value: cat.total_amount,
        color: 'success' as const
      }));
      generator.addBarChart(chartData);
      generator.addSpacing(5);
    }
  }

  // Despesas por categoria
  if (expenseData.length > 0) {
    generator.addSection('Despesas por Categoria', 12);
    
    const expenseRows: (string | number)[][] = expenseData.map(cat => {
      const percentage = totalExpense > 0 ? ((cat.total_amount / totalExpense) * 100).toFixed(1) : '0';
      return [
        cat.name,
        cat.transaction_count.toString(),
        cat.total_amount,
        cat.average_amount,
        `${percentage}%`
      ];
    });

    generator.addTable(
      ['Categoria', 'Transações', 'Total', 'Média', 'Percentual'],
      expenseRows,
      [35, 25, 30, 30, 20]
    );
    generator.addSpacing(5);

    // Gráfico de despesas
    if (expenseData.length > 0 && expenseData.length <= 6) {
      const chartData = expenseData.map(cat => ({
        label: cat.name.substring(0, 10),
        value: cat.total_amount,
        color: 'danger' as const
      }));
      generator.addBarChart(chartData);
    }
  }

  // Análise
  generator.addSpacing(5);
  generator.addSection('Análise e Observações', 12);
  
  if (incomeData.length > 0) {
    const topIncomeCategory = incomeData.reduce((top, current) => 
      current.total_amount > top.total_amount ? current : top
    );
    generator.addText(
      `A categoria de receita com maior valor foi "${topIncomeCategory.name}" ` +
      `com ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(topIncomeCategory.total_amount)} ` +
      `(${((topIncomeCategory.total_amount / totalIncome) * 100).toFixed(1)}% do total).`,
      10
    );
  }

  if (expenseData.length > 0) {
    const topExpenseCategory = expenseData.reduce((top, current) => 
      current.total_amount > top.total_amount ? current : top
    );
    generator.addText(
      `A categoria de despesa com maior valor foi "${topExpenseCategory.name}" ` +
      `com ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(topExpenseCategory.total_amount)} ` +
      `(${((topExpenseCategory.total_amount / totalExpense) * 100).toFixed(1)}% do total).`,
      10
    );
  }

  generator.save(`Relatorio_Categorias_${startDateFormatted.replace(/\//g, '-')}_${endDateFormatted.replace(/\//g, '-')}.pdf`);
};

// Gerador para Fluxo de Caixa
export const generateCashFlowPDF = (
  data: CashFlowData[],
  startDate: string,
  endDate: string,
  period: 'daily' | 'weekly' | 'monthly',
  churchInfo?: ChurchInfo
): void => {
  const startDateFormatted = new Date(startDate).toLocaleDateString('pt-BR');
  const endDateFormatted = new Date(endDate).toLocaleDateString('pt-BR');
  const periodLabel = period === 'daily' ? 'Diário' : period === 'weekly' ? 'Semanal' : 'Mensal';
  
  const generator = new PDFGenerator({
    title: 'Fluxo de Caixa',
    subtitle: `Período ${periodLabel}: ${startDateFormatted} a ${endDateFormatted}`,
    churchInfo,
    period: `${startDateFormatted} a ${endDateFormatted}`
  });

  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = data.reduce((sum, item) => sum + item.expense, 0);
  const totalBalance = totalIncome - totalExpense;

  // Resumo executivo
  generator.addSection('Resumo Executivo', 14);
  generator.addText(
    `Este relatório apresenta o fluxo de caixa ${periodLabel.toLowerCase()} detalhado ` +
    `no período de ${startDateFormatted} a ${endDateFormatted}.`,
    10
  );
  generator.addSpacing(5);

  // Cards de resumo
  generator.addSummaryCard('Total Receitas', totalIncome, 'success');
  generator.addSummaryCard('Total Despesas', totalExpense, 'danger');
  generator.addSummaryCard('Saldo Total', totalBalance, totalBalance >= 0 ? 'success' : 'danger');
  generator.finishCardRow();
  generator.addSpacing(5);

  // Função para formatar período
  const formatPeriod = (periodStr: string): string => {
    if (period === 'daily') {
      return new Date(periodStr).toLocaleDateString('pt-BR');
    } else if (period === 'weekly') {
      return `Semana ${periodStr}`;
    } else {
      const [year, month] = periodStr.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
  };

  // Tabela de fluxo de caixa
  generator.addSection(`Fluxo de Caixa ${periodLabel}`, 12);
  
  const flowRows: (string | number)[][] = data.map(item => [
    formatPeriod(item.period),
    item.income,
    item.expense,
    item.balance
  ]);

  generator.addTable(
    ['Período', 'Receitas', 'Despesas', 'Saldo'],
    flowRows,
    [50, 35, 35, 30]
  );

  // Gráfico se tiver dados suficientes
  if (data.length > 0 && data.length <= 12) {
    generator.addSpacing(5);
    generator.addSection(`Evolução do Saldo ${periodLabel}`, 12);
    
    const chartData = data.map(item => ({
      label: period === 'daily' ? new Date(item.period).getDate().toString() :
             period === 'weekly' ? item.period.split('-')[1] || item.period :
             formatPeriod(item.period).substring(0, 3),
      value: item.balance,
      color: (item.balance >= 0 ? 'success' : 'danger') as 'success' | 'danger'
    }));
    
    generator.addBarChart(chartData);
  }

  // Análise
  generator.addSpacing(5);
  generator.addSection('Análise do Fluxo de Caixa', 12);
  
  const positivePeriods = data.filter(item => item.balance >= 0).length;
  const negativePeriods = data.filter(item => item.balance < 0).length;
  const positivePercentage = data.length > 0 ? ((positivePeriods / data.length) * 100).toFixed(1) : '0';
  
  generator.addText(`Períodos com saldo positivo: ${positivePeriods} de ${data.length} (${positivePercentage}%)`, 10);
  generator.addText(`Períodos com saldo negativo: ${negativePeriods} de ${data.length}`, 10);
  
  if (data.length > 0) {
    const bestPeriod = data.reduce((best, current) => 
      current.balance > best.balance ? current : best
    );
    const worstPeriod = data.reduce((worst, current) => 
      current.balance < worst.balance ? current : worst
    );
    
    generator.addSpacing(3);
    generator.addText(
      `Melhor período: ${formatPeriod(bestPeriod.period)} (Saldo: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bestPeriod.balance)})`,
      10,
      true
    );
    generator.addText(
      `Período mais desafiador: ${formatPeriod(worstPeriod.period)} (Saldo: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(worstPeriod.balance)})`,
      10,
      true
    );
  }

  generator.save(`Fluxo_Caixa_${periodLabel}_${startDateFormatted.replace(/\//g, '-')}.pdf`);
};

// Gerador para Contribuições por Membro
export const generateMemberContributionsPDF = (
  data: MemberContribution[],
  startDate: string,
  endDate: string,
  churchInfo?: ChurchInfo
): void => {
  const startDateFormatted = new Date(startDate).toLocaleDateString('pt-BR');
  const endDateFormatted = new Date(endDate).toLocaleDateString('pt-BR');
  
  const generator = new PDFGenerator({
    title: 'Relatório de Contribuições por Membro',
    subtitle: `Período: ${startDateFormatted} a ${endDateFormatted}`,
    churchInfo,
    period: `${startDateFormatted} a ${endDateFormatted}`
  });

  const totalContributions = data.reduce((sum, member) => sum + member.total_contributed, 0);
  const totalCount = data.reduce((sum, member) => sum + member.contribution_count, 0);
  const averagePerMember = data.length > 0 ? totalContributions / data.length : 0;
  const averagePerContribution = totalCount > 0 ? totalContributions / totalCount : 0;

  // Resumo executivo
  generator.addSection('Resumo Executivo', 14);
  generator.addText(
    `Este relatório apresenta o detalhamento das contribuições realizadas por cada membro ` +
    `no período de ${startDateFormatted} a ${endDateFormatted}.`,
    10
  );
  generator.addSpacing(5);

  // Cards de resumo
  generator.addSummaryCard('Total Arrecadado', totalContributions, 'success');
  generator.addSummaryCard('Contribuintes', data.length, 'primary', 'membros');
  generator.addSummaryCard('Total Contribuições', totalCount, 'primary', 'transações');
  generator.finishCardRow();
  generator.addSpacing(5);

  generator.addSummaryCard('Média por Membro', averagePerMember, 'primary');
  generator.addSummaryCard('Média por Contribuição', averagePerContribution, 'primary');
  generator.finishCardRow();
  generator.addSpacing(5);

  // Tabela de membros
  generator.addSection('Contribuições Detalhadas por Membro', 12);
  
  const memberRows: (string | number)[][] = data.map(member => [
    member.name,
    member.contribution_count.toString(),
    member.total_contributed,
    member.average_contribution,
    member.first_contribution ? new Date(member.first_contribution).toLocaleDateString('pt-BR') : '-',
    member.last_contribution ? new Date(member.last_contribution).toLocaleDateString('pt-BR') : '-'
  ]);

  generator.addTable(
    ['Membro', 'Qtd', 'Total', 'Média', 'Primeira', 'Ãšltima'],
    memberRows,
    [40, 15, 25, 25, 20, 20]
  );

  // Top contribuidores
  if (data.length > 0) {
    generator.addSpacing(5);
    generator.addSection('Top 5 Contribuidores', 12);
    
    const topContributors = [...data]
      .sort((a, b) => b.total_contributed - a.total_contributed)
      .slice(0, 5);

    if (topContributors.length > 0 && topContributors.length <= 5) {
      const chartData = topContributors.map(member => ({
        label: member.name.substring(0, 10),
        value: member.total_contributed,
        color: 'success' as const
      }));
      generator.addBarChart(chartData);
    }
  }

  // Análise
  generator.addSpacing(5);
  generator.addSection('Análise e Observações', 12);
  
  if (data.length > 0) {
    const topContributor = data.reduce((top, current) => 
      current.total_contributed > top.total_contributed ? current : top
    );
    generator.addText(
      `Maior contribuidor: ${topContributor.name} com ` +
      `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(topContributor.total_contributed)} ` +
      `(${topContributor.contribution_count} contribuições).`,
      10,
      true
    );
  }

  const membersWithMultipleContributions = data.filter(m => m.contribution_count > 1).length;
  generator.addText(
    `Membros com múltiplas contribuições: ${membersWithMultipleContributions} de ${data.length} ` +
    `(${data.length > 0 ? ((membersWithMultipleContributions / data.length) * 100).toFixed(1) : '0'}%).`,
    10
  );

  generator.save(`Relatorio_Contribuicoes_${startDateFormatted.replace(/\//g, '-')}.pdf`);
};

