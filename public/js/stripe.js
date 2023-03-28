import axios from 'axios';
import { showAlert } from './alerts';
import { Stripe } from 'stripe';

const stripe = Stripe(
  'pk_test_51MqUOoBpm087eTlbZxFBpotLHkyRsgdU9Ms8L2HoNkKHOcfnHxFPpUut258tjYwzRGrU0nHL7Bj0TXEQB6YcjLEG00tii1yXnZ'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) create checkout form + charge credit card}
    // await stripe.redirectToCheckout({
    //   sessionId: session.data.session.id,
    // });
    window.location.replace(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
