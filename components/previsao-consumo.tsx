'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Calendar, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TonerItem, StockMovement } from '@/lib/toner-store';
import { calcularPrevisoes } from '@/lib/previsao';

interface PrevisaoConsumoProps {
  toners: TonerItem[];
  movements: StockMovement[];
  diasAnalise?: number;
  limiteCritico?: number;
}

export function PrevisaoConsumo({
  toners,
  movements,
  diasAnalise = 30,
  limiteCritico = 7,
}: PrevisaoConsumoProps) {
  const [previsoes, setPrevisoes] = useState<any[]>([]);

  useEffect(() => {
    const prev = calcularPrevisoes(toners, movements, diasAnalise, limiteCritico);
    setPrevisoes(prev);
  }, [toners, movements, diasAnalise, limiteCritico]);

  if (previsoes.length === 0) {
    return null; // ou um card informativo
  }

  const criticos = previsoes.filter(p => p.critico);
  const normais = previsoes.filter(p => !p.critico);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Previsão de Consumo (últimos {diasAnalise} dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {criticos.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2 text-destructive font-medium mb-2">
              <AlertCircle className="h-4 w-4" />
              <span>Itens críticos (menos de {limiteCritico} dias)</span>
            </div>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {criticos.map(p => (
                  <div key={p.tonerId} className="flex justify-between items-center text-sm">
                    <span>{p.tonerName}</span>
                    <Badge variant="destructive" className="font-mono">
                      {p.diasRestantes} dia(s) - {p.dataEstimada}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <ScrollArea className="h-48">
          <div className="space-y-3">
            {normais.map(p => (
              <div key={p.tonerId} className="flex justify-between items-center border-b pb-1">
                <div>
                  <p className="font-medium">{p.tonerName}</p>
                  <p className="text-xs text-muted-foreground">
                    Estoque: {p.estoqueAtual} | Consumo médio: {p.consumoDiario}/dia
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {p.diasRestantes === Infinity ? '∞' : `${p.diasRestantes} dias`}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {p.dataEstimada}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}