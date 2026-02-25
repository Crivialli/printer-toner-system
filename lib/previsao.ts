import { TonerItem, StockMovement } from './toner-store';

interface Previsao {
  tonerId: string;
  tonerName: string;
  estoqueAtual: number;
  consumoDiario: number;
  diasRestantes: number; // pode ser Infinity se não houver consumo
  dataEstimada: string;  // formato dd/MM/yyyy ou '—'
  critico: boolean;       // true se diasRestantes < limite (ex: 7)
}

export function calcularPrevisoes(
  toners: TonerItem[],
  movimentos: StockMovement[],
  diasAnalise: number = 30,
  limiteCritico: number = 7
): Previsao[] {
  const hoje = new Date();
  const dataInicio = new Date(hoje);
  dataInicio.setDate(hoje.getDate() - diasAnalise);

  // Filtrar saídas no período
  const saidas = movimentos.filter(m => {
    const dataMov = new Date(m.date.split(',')[0].split('/').reverse().join('-') + 'T00:00:00');
    return m.type === 'saida' && dataMov >= dataInicio;
  });

  // Agrupar consumo por toner
  const consumoPorToner: Record<string, number> = {};
  saidas.forEach(s => {
    consumoPorToner[s.tonerId] = (consumoPorToner[s.tonerId] || 0) + s.quantity;
  });

  return toners.map(t => {
    const consumoTotal = consumoPorToner[t.id] || 0;
    const consumoDiario = consumoTotal / diasAnalise; // média diária
    let diasRestantes: number;
    if (consumoDiario <= 0) {
      diasRestantes = Infinity;
    } else {
      diasRestantes = Math.floor(t.quantity / consumoDiario);
    }

    let dataEstimada = '—';
    if (diasRestantes !== Infinity && diasRestantes > 0) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + diasRestantes);
      dataEstimada = data.toLocaleDateString('pt-BR');
    }

    return {
      tonerId: t.id,
      tonerName: `${t.name} (${t.brand})`,
      estoqueAtual: t.quantity,
      consumoDiario: Math.round(consumoDiario * 100) / 100,
      diasRestantes,
      dataEstimada,
      critico: diasRestantes < limiteCritico && diasRestantes > 0,
    };
  }).filter(p => p.estoqueAtual > 0); // só mostramos itens com estoque
}