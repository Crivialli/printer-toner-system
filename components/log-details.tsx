import React from 'react';

interface LogDetailsProps {
  action: string;
  details: any;
}

export function LogDetails({ action, details }: LogDetailsProps) {
  if (!details) return <span className="text-muted-foreground">—</span>;

  // Função para renderizar os detalhes de forma amigável
  const renderDetails = () => {
    switch (action) {
      case 'criou toner':
        return (
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Nome:</span> {details.nome}</p>
            <p><span className="font-medium">Marca:</span> {details.marca}</p>
            <p><span className="font-medium">Tipo:</span> {details.tipo}</p>
            <p><span className="font-medium">Qtd. inicial:</span> {details.quantidade_inicial}</p>
            <p><span className="font-medium">Estoque mínimo:</span> {details.estoque_minimo}</p>
          </div>
        );
      
      case 'editou toner':
        return (
          <div className="text-sm space-y-2">
            <div>
              <p className="font-medium text-xs text-muted-foreground mb-1">Antes:</p>
              <div className="pl-2 border-l-2 border-muted">
                <p>Nome: {details.dados_antigos?.nome}</p>
                <p>Marca: {details.dados_antigos?.marca}</p>
                <p>Tipo: {details.dados_antigos?.tipo}</p>
                <p>Min: {details.dados_antigos?.estoque_minimo}</p>
              </div>
            </div>
            <div>
              <p className="font-medium text-xs text-muted-foreground mb-1">Depois:</p>
              <div className="pl-2 border-l-2 border-muted">
                <p>Nome: {details.dados_novos?.nome}</p>
                <p>Marca: {details.dados_novos?.marca}</p>
                <p>Tipo: {details.dados_novos?.tipo}</p>
                <p>Min: {details.dados_novos?.estoque_minimo}</p>
              </div>
            </div>
          </div>
        );
      
      case 'excluiu toner':
        return (
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Nome:</span> {details.nome}</p>
            <p><span className="font-medium">Marca:</span> {details.marca}</p>
            <p><span className="font-medium">Tipo:</span> {details.tipo}</p>
          </div>
        );
      
      case 'movimentação':
        return (
          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Tipo:</span>{' '}
              <span className={details.tipo === 'entrada' ? 'text-success' : 'text-destructive'}>
                {details.tipo === 'entrada' ? 'Entrada' : 'Saída'}
              </span>
            </p>
            <p><span className="font-medium">Quantidade:</span> {details.quantidade}</p>
            {details.observacao && <p><span className="font-medium">Obs:</span> {details.observacao}</p>}
            <p><span className="font-medium">Nova quantidade:</span> {details.nova_quantidade}</p>
          </div>
        );
      
      default:
        // Fallback: mostra o JSON formatado
        return (
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-w-xs">
            {JSON.stringify(details, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div className="p-2 bg-muted/30 rounded-md">
      {renderDetails()}
    </div>
  );
}