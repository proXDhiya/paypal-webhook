// initialize dotenv
require('dotenv').config();

// import dependencies
const paypal = require('paypal-rest-sdk');
const express = require('express');
const cors = require('cors');
const app = express();

// config
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// paypal config
paypal.configure({
    mode: process.env.PAYPAL_MODE,
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

// POST: /api/sendMoneyToUser
app.post('/api/sendMoneyToUser', (req, res) => {
    try {
        const { email, amount, currency } = req.body;

        const paymentObject = {
            intent: 'sale',
            payer: {
                payment_method: 'paypal'
            },
            transactions: [
                {
                    amount: {
                        total: amount,
                        currency: currency
                    }
                }
            ],
            redirect_urls: {
                return_url: 'http://localhost:3000/success?email=' + email,
                cancel_url: 'http://localhost:3000/cancel'
            }
        };
        
        // send money to our business account
        paypal.payment.create(paymentObject, (err, payment) => {
            if (err) {
                console.error('Error in /api/sendMoneyToUser: ', err);
                return res.status(500).json({
                    status: false,
                    message: err.message
                })
            }

            // send money to the user
            const redirectUrl = payment.links.find(link => link.rel === 'approval_url').href;
            return res.status(200).json({
                status: true,
                redirectUrl
            });
        });
    } catch (err) {
        console.error('Error in /api/sendMoneyToUser: ', err);
        return res.status(500).json({
            status: false,
            message: err.message
        })
    }
});

// GET: /success
app.get('/success', (req, res) => {
    try {
        const { email, paymentId, PayerID } = req.query;

        // execute payment
        paypal.payment.execute(paymentId, { payer_id: PayerID }, (err, payment) => {
            if (err) {
                console.error('Error in /success: ', err);
                return res.status(500).json({
                    status: false,
                    message: err.message
                })
            }

            // send money to the user
            const redirectUrl = payment.links.find(link => link.rel === 'approval_url').href;
            return res.status(200).json({
                status: true,
                redirectUrl
            });
        });
    } catch (err) {
        console.error('Error in /success: ', err);
        return res.status(500).json({
            status: false,
            message: err.message
        })
    }
});

// GET: /cancel
app.get('/cancel', (req, res) => {
    try {
        return res.status(200).json({
            status: true,
            message: 'Payment cancelled'
        });
    } catch (err) {
        console.error('Error in /cancel: ', err);
        return res.status(500).json({
            status: false,
            message: err.message
        })
    }
});

// POST: /notifications - webhook api
app.post('/notifications', (req, res) => {
    try {
        const { event_type, resource } = req.body;
        console.log('event_type: ', event_type, ' resource: ', resource);

        return res.status(200).json({
            status: true,
            message: 'Notification received'
        });
    } catch (err) {
        console.error('Error in /notifications: ', err);
        return res.status(500).json({
            status: false,
            message: err.message
        })
    }
});

// start server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});
