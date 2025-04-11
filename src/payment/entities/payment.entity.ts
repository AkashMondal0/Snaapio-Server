export class CreatePayment {
	customerId: string;
	amount: number;
	currency: "inr" | string;
	paymentMethodTypes: string[];
	metadata?: object;
	customerEmail?: string;
}

export class SheetSuccessBody {
	title?: string;
    price?: string;
    mainPrice: number;
    yearlyPrice?: string;
    save?: string;
    features?: string[];
}