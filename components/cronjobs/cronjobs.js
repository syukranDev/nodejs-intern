const pool = require('../../components/db/db');
const cron = require('node-cron');
const fs = require('fs')
const nodemailer = require('nodemailer')

 // ======================================================================
// TASK 5(b)
// ======================================================================
//  Cronjob - automate sending latest price saved in database to user every 12AM

cron.schedule('0 0 * * *', async function() {  //Send every 12AM
    console.log('Cronjob sending email starts 12AM.......');

    let data = await pool.query(`SELECT api_response_json, created_at from bitcoin_prices ORDER BY created_at DESC LIMIT 1`)
    
    if (data.rows.length == 0) return console.log('No data available, email not sending.')
    
    let dataToSent = JSON.stringify(data.rows[0])

    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
          user: '<USE GMAIL EMAIL HERE>',
          pass: '<USE YOUR GMAIL GENERATED APP PASSWORD HERE>', 
        },
    });
      
    const mailOptions = {
    from: '<USE YOUR GMAIL HERE>',
    to: '<USE RECIPIENT EMAIL HERE>',
    subject: `Bitcoin Price || ${data.rows[0].created_at}`,
    text: dataToSent,
    };
      
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
  });

