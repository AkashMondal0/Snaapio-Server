import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePayment, SheetSuccessBody } from './entities/payment.entity';
import configuration from 'src/configs/configuration';
import Stripe from 'stripe';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { eq } from 'drizzle-orm';
import { AccountSchema, TransactionDetails } from 'src/db/drizzle/drizzle.schema';
import { Author } from 'src/users/entities/author.entity';
const { STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY } = configuration();

if (!STRIPE_SECRET_KEY || !STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Stripe keys are not defined in the environment variables');
};

const stripe = new Stripe(STRIPE_SECRET_KEY);

@Injectable()
export class PaymentService {
  constructor(
    private readonly drizzleProvider: DrizzleProvider
  ) { }

  async paymentSheet({
    // customerId,
    amount,
    currency = 'inr',
    // paymentMethodTypes = ['card'],
    // metadata,
    // customerEmail
  }: CreatePayment) {
    try {
      const customer = await stripe.customers.create();
      if (!customer.id || !amount) {
        throw new Error('Missing required parameters: customerId, amount, currency');
      };
      // Use an existing Customer ID if this is a returning customer.
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: '2023-08-16' }
      );
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        customer: customer.id,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      if (!paymentIntent || !ephemeralKey || !customer.id) {
        throw new Error('Failed to create payment sheet: Missing required data');
      }

      return {
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
        publishableKey: STRIPE_PUBLISHABLE_KEY,
      };
    } catch (error) {
      console.error('Error creating payment sheet:', error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  async sheetSuccess(user: Author, data: SheetSuccessBody) {
    try {
      await this.drizzleProvider.db.insert(TransactionDetails).values({
        authorId: user.id,
        features: data.features,
        title: data.title,
        price: data.price,
        mainPrice: data.mainPrice,
        yearlyPrice: data.yearlyPrice,
      });

      await this.drizzleProvider.db.update(AccountSchema)
        .set({ isVerified: true })
        .where(eq(AccountSchema.id, user.id));
        return {}
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
