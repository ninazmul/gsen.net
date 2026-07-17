export interface Customer {
  _id: string;
  customerCode: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  packageName: string;
  monthlyFee: number;
  connectionDate: Date;
  router?: string;
  ipAddress?: string;
  status: string;
  notes?: string;
  isDeleted: boolean;
}

export interface Bill {
  _id: string;
  invoiceNumber: string;
  customer: Customer;
  month: number;
  year: number;
  amount: number;
  status: string;
  paymentDate?: Date;
  paymentMethod?: string;
  remarks?: string;
}

export interface Expense {
  _id: string;
  category: string;
  amount: number;
  expenseDate: Date;
  description?: string;
}

export interface Admin {
  _id: string;
  email: string;
  createdAt: Date;
}
