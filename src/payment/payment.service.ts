import { Injectable } from '@nestjs/common';
const stripe = require('stripe')('sk_test_51Nn5mUSH7JDxRBrAJLLftI7LVnNDVCDFpTB1oT8bgbxaJ6ZPV1Tc2cRQUkG7r0vZNMiSNJEwaKyFHtgLxNT1UhXc00pSUn7gwz');

@Injectable()
export class PaymentService {

  async paymentSheet() {
    try {
      // Use an existing Customer ID if this is a returning customer.
      const customer = await stripe.customers.create();
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: '2023-08-16' }
      );
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000,
        currency: 'inr',
        customer: customer.id,
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter
        // is optional because Stripe enables its functionality by default.
        automatic_payment_methods: {
          enabled: true,
        },
      });

      if (!paymentIntent || !ephemeralKey || !customer) {
        throw new Error('Failed to create payment sheet: Missing required data');
      }

      return {
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
        publishableKey: 'pk_test_51Nn5mUSH7JDxRBrAzO2zTdzZU0Vy2NFKoCUpF9SyOD5Gse0C9wJI1EOHyHy1NBcq8i2vDc2dc4bmxUm5S2EBcObM001y0VfoyR'
      };
    } catch (error) {
      console.error('Error creating payment sheet:', error);
      throw new Error('Failed to create payment sheet');
    }
  };

}
