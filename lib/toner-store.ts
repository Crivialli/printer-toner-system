export type TonerType = "cilindro" | "toner"

export interface TonerItem {
  id: string
  name: string
  type: TonerType
  brand: string
  quantity: number
  minQuantity: number
}

export interface StockMovement {
  id: string
  tonerId: string
  tonerName: string
  type: "entrada" | "saida"
  quantity: number
  date: string
  note: string
  price?: number
  reason?: 'consumo' | 'devolucao' // <-- adicionado
}

export const DEFAULT_TONERS: TonerItem[] = [
  {
    id: "1",
    name: "TEC DR4510",
    type: "cilindro",
    brand: "Ricoh",
    quantity: 0,
    minQuantity: 3,
  },
  {
    id: "2",
    name: "TEC TN4510",
    type: "toner",
    brand: "Ricoh",
    quantity: 0,
    minQuantity: 3,
  },
  {
    id: "3",
    name: "TEC TN280",
    type: "toner",
    brand: "HP",
    quantity: 0,
    minQuantity: 3,
  },
  {
    id: "4",
    name: "TEC TN2340/2370",
    type: "toner",
    brand: "Brother",
    quantity: 0,
    minQuantity: 3,
  },
]