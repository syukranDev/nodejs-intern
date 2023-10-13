const express = require('express')
const router  = express.Router()
const multer  = require('multer')
const path  = require('path');
const fs = require('fs')
const axios = require('axios')

const validatePayload = require('../components/middleware/validatePayload')
const pool = require('../components/db/db')



// ======================================================================
// TASK 1 && TASK 2 - Simple GET and POST API to return data
// ======================================================================
//GET METHOD - API URL: localhost:3003/api/user/id
router.get('/user/id', (req, res) => {
    // logger.log('info', `You have access /user/ud/1 route`)
    res.json({
        status: 200,
        data : {
            username: 'syukran',
            email: 'syukran@test.com.my'
        }
    })
})

//POST METHOD - API URL localhost:3003/api/user/register
// Note: Make sure to declare your payload in JSON via POSTMAN
router.post('/user/register', (req, res) => { 
    let username = req.body.username;
    let password = req.body.password;

    if (username || password ) {
        // lo{gger.log('info', `You have access /user/register route`)
        res.json({
            username, password
        })
    }
})


// ======================================================================
// TASK 3 
// ======================================================================
//  GET METHOD - Read user data based on URL params input: email
//  API URL - localhost:3003/api/user/details/<replace with registered email in db>
router.get('/details/:email', (req, res) => {
    let userEmail = req.params.email
 
    try {
        // throw new Error('failed!')
        if (!userEmail) res.status(404).send('Email is not registed in db! Please add user with that email')
 
        const query = 'SELECT * FROM public.user_details WHERE email = $1';
        pool.query(query, [userEmail], (err, result) => {
          if (err) {
            console.error('Error selecting user', err);
          }
          res.status(200).json({
             status: 200,
             data: result.rows[0]
          })
        });
    }
     catch (err) {
        logger.log('error', err.message)
        res.send('Error fetching user data')
    }
})
 

//  POST METHOD - Register user details
//  API URL -  localhost:3003/api/user/add 
//  Note: Make sure to declare your payload in JSON via POSTMAN

//  router.post('/user/add', validatePayload, (req, res) => {
router.post('/user/add', (req, res) => {
    let { email, first_name, last_name, address, age } = req.body
 
    if (!email || !first_name || !last_name || !address || !age) res.status(404).send('Missing payload. Please check!')
 
    const payload = {
       first_name,
       last_name, 
       age,
       address,
       email
     };
 
    pool.query('INSERT INTO public.user_details (first_name, last_name, age, address, email) VALUES ($1, $2, $3, $4, $5)', 
    [payload.first_name, payload.last_name, payload.age, payload.address, payload.email], (error, result) => {
    if (error) {
       console.error('Error inserting data', error);
       res.send({ message: error.detail})
    } else {
       console.log('Data inserted successfully');
       res.status(200).json({
          status: 200,
          message: 'Data inserted succesfully',
          request_body: payload
       })
    }
    pool.end();
    });
})

 // ======================================================================
// TASK 4 
// ======================================================================
//  POST METHOD - Send file .txt to local storage
//  API URL - localhost:3003/api/upload
//  Note: Test this using POSTMAN, in the body tab, click 'form-data', put 'file' in key and upload the .txt file in its value.

// Create the destination directory if it doesn't exist
const uploadDir = path.resolve(__dirname, '../public/upload/');
if (!fs.existsSync(uploadDir)) {
fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: path.resolve(__dirname, '../public/upload/'),
    filename: function (req, file, callback) {
        callback(null, file.originalname); 
    },
});
  
const txtFileFilter = function (req, file, callback) {
    if (file.mimetype === 'text/plain') {
        callback(null, true);
    } else {
        callback(new Error('Only APK files are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 }, // limit to 1MB
    fileFilter: txtFileFilter
});

router.post('/upload', upload.single('file'),  (req, res) => {
    try {
        if (req.fileValidationError) return res.status(400).send({status: 'failed', errMsg: '.txt files only!'});
          
        const pathname = `/upload/${req.file.filename}`;

        pool.query(
            'INSERT INTO file_uploads (file_path, "created_at") VALUES ($1, $2) RETURNING id', 
        [pathname, new Date()], (error, result) => {
        if (error) {
            console.error('Error inserting data into DB', error);
            res.send({ message: error.detail})
        } else {
            return res.status(200).send({status: 'success', msg:'File uploaded successfully to local storage.'})
        }
        pool.end();
        });
    } catch (err) {
        return res.status(500).send({status: 'failed', errMsg: 'Something wrong with /upload API.'});
    }
})


 // ======================================================================
// TASK 5 (a)
// ======================================================================
//  GET METHOD - Fetch latest bitcoin prices from external 3rd party API and saved to database
//  API URL - localhost:3003/api/bitcoin_price

router.get('/bitcoin_price', async (req, res) => {
   try {
        await axios.get("https://api.coindesk.com/v1/bpi/currentprice.json")
        .then(response => {
            let bitcoinJsonData = response.data // this is full response JSON data from external API

            let currentBitcoinInUSD = bitcoinJsonData.bpi.USD.rate_float
            let currentBitcoinInEUR = bitcoinJsonData.bpi.GBP.rate_float
            let currentBitcoinInGBP = bitcoinJsonData.bpi.EUR.rate_float

            let convertJsonDataToString = JSON.stringify(bitcoinJsonData)

            pool.query(
                'INSERT INTO bitcoin_prices (current_price_usd, current_price_gbp, current_price_eur, "created_at", api_response_json) VALUES ($1, $2, $3, $4 ,$5) RETURNING id', 
            [currentBitcoinInUSD, currentBitcoinInEUR, currentBitcoinInGBP, new Date(), convertJsonDataToString], (err, result) => {
            if (err) {
                console.error('Error inserting data into DB', err);
                return res.send({ 
                    status: 'failed',
                    message: 'Failed to saved in database' + err.message
                })
            } else {
                return res.status(200).send({ 
                    status: 'success', 
                    message:'Succesfully fetch external API and saved in database',
                    data: {
                        currentBitcoinInUSD,
                        currentBitcoinInEUR,
                        currentBitcoinInGBP,
                        convertJsonDataToString
                    }
                })
            }
            pool.end();
        });


        })
        .catch( err => {
            return res.json({ 
                status: 'failed to fetch external api',
                detail_error: err.message
            })
        })
   } catch (err) {
    console.log(err.message)
    return res.json({ status: 'failed', message: err.message})
   }
})


module.exports = router