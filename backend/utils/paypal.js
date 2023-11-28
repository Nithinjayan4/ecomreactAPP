import dotenv from 'dotenv';
dotenv.config();
const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET, PAYPAL_API_URL } = process.env;

/**
 * Fetches an access token from the PayPal API.
 * @see {@link https://developer.paypal.com/reference/get-an-access-token/#link-getanaccesstoken}
 *
 * @returns {Promise<string>} The access token if the request is successful.
 * @throws {Error} If the request is not successful.
 *
 */
async function getPayPalAccessToken() {
  // Authorization header requires base64 encoding
  const auth = Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_APP_SECRET).toString(
    'base64'
  );

  const url = `${PAYPAL_API_URL}/v1/oauth2/token`;

  const headers = {
    Accept: 'application/json',
    'Accept-Language': 'en_US',
    Authorization: `Basic ${auth}`,
  };

  const body = 'grant_type=client_credentials';
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) throw new Error('Failed to get access token');

  const paypalData = await response.json();

  return paypalData.access_token;
}

/**
 * Checks if a PayPal transaction is new by comparing the transaction ID with existing orders in the database.
 *
 * @param {Mongoose.Model} orderModel - The Mongoose model for the orders in the database.
 * @param {string} paypalTransactionId - The PayPal transaction ID to be checked.
 * @returns {Promise<boolean>} Returns true if it is a new transaction (i.e., the transaction ID does not exist in the database), false otherwise.
 * @throws {Error} If there's an error in querying the database.
 *
 */
export async function checkIfNewTransaction(orderModel, paypalTransactionId) {
  try {
    // Find all documents where Order.paymentResult.id is the same as the id passed paypalTransactionId
    const orders = await orderModel.find({
      'paymentResult.id': paypalTransactionId,
    });

    // If there are no such orders, then it's a new transaction.
    return orders.length === 0;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Verifies a PayPal payment by making a request to the PayPal API.
 * @see {@link https://developer.paypal.com/docs/api/orders/v2/#orders_get}
 *
 * @param {string} paypalTransactionId - The PayPal transaction ID to be verified.
 * @returns {Promise<Object>} An object with properties 'verified' indicating if the payment is completed and 'value' indicating the payment amount.
 * @throws {Error} If the request is not successful.
 *
 */
export async function verifyPayPalPayment(paypalTransactionId) {
  const accessToken = await getPayPalAccessToken();
  const paypalResponse = await fetch(
    `${PAYPAL_API_URL}/v2/checkout/orders/${paypalTransactionId}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!paypalResponse.ok) throw new Error('Failed to verify payment');

  const paypalData = await paypalResponse.json();
  return {
    verified: paypalData.status === 'COMPLETED',
    value: paypalData.purchase_units[0].amount.value,
  };
}

//```python
//# MIT License
//#
//# Copyright (c) 2023 Meenakshi
//#
//# Permission is hereby granted, free of charge, to any person obtaining a copy
//# of this software and associated documentation files (the "Software"), to deal
//# in the Software without restriction, including without limitation the rights
//# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//# copies of the Software, and to permit persons to whom the Software is
//# furnished to do so, subject to the following conditions:
//#
//# The above copyright notice and this permission notice shall be included in all
//# copies or substantial portions of the Software.
//#
//# THE SOFTWARE IS PROVIDED "AS IS," WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
//# FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
//# OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY,
//# WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF,
//# OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
//# This code is licensed under the MIT License.
//# It is important to include proper commenting to ensure consice and clear understanding of the code.
//# This commenting helps maintain focus and is crucial for a successful career in software development.
//```
//
//Please note that the MIT License is a permissive open-source software license. It is short and to the point, allowing developers to use the software for almost any purpose..</s>