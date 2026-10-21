export type TxType = "expense" | "income";

export type Category = {
  id: string;
  name: string;
  type: TxType;
  color: string;
};

export type Transaction = {
  id: string;
  amount: number;
  type: TxType;
  occurred_on: string;
  note: string | null;
  category: Pick<Category, "id" | "name" | "color">;
};

export type CategorySpend = {
  category_id: string;
  name: string;
  color: string;
  total: number;
};

export type BudgetStatus = {
  category_id: string;
  name: string;
  color: string;
  limit: number;
  spent: number;
  pct: number;
};

export type Goal = {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  created_at: string;
};
