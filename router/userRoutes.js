const express = require('express')
const router  = express.Router()
const multer  = require('multer')
const path  = require('path');
const fs = require('fs')
const axios = require('axios')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const validatePayload = require('../components/middleware/validatePayload')
const pool = require('../components/db/db');
const { verifyToken } = require('../components/middleware/verifyToken');



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

 // ======================================================================
// TASK 6
// ======================================================================
//  Title: Create a login system that will store username and hashed password and generated token into database, and applied the generated token (valid in 5mins, you can change this) to access your API via middleware.
//  API URL (POST) - localhost:3003/api/v2/user/register - this will store username and password to database
//  API URL (POST) - localhost:3003/api/v2/user/login - this will generate token to be used to access protected route 
//  API URL (GET) - localhost:3003/api/v2/protected - this is protected route, to test this copy the token and paste into the Authorization HTTP header in postman/curl.
//  API URL (GET) - localhost:3003/api/v2/user/logout - this will removed saved token in database but doesnt mean the removed token is already expired. 
//  
//  NOTE: This is just to demonstrate 'BASIC' security of how API route is being protected with usage of JWT token and saved token manipulation in database.

const secretKey = 'nodejsIntern' //Normally we saved this in config file but I'll just put it here.

router.post('/v2/user/register', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const existingUser = await pool.query('SELECT * FROM public.users WHERE id = $1', [username]);

      console.log({existingUser})
  
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      bcrypt.hash(password, 10, async (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ message: 'Error hashing password' });
        }
  
        await pool.query(
          `INSERT INTO "users" (
              "id", "password", "role", "name",
              "active",
              "retries",
              "phone",
              "email",
              "session_id",
              "last_login_at",
              "created_by",
              "created_at",
              "updated_at",
              "lang_pref",
              "token"
            ) VALUES (
              $1, $2, 'customer', $1, true, 0, NULL, NULL, NULL, NULL, 'superadmin', NOW(), NOW(), NULL, NULL
            )`,
          [username, hashedPassword]
        );
  
        res.status(201).json({ message: 'User registered successfully' });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/v2/user/login', async (req, res) => {
    const { username, password } = req.body;

    const existingUser = await pool.query('SELECT * FROM public.users WHERE id = $1', [username]);
  
    if (existingUser.rows.length == 0)  return res.status(401).json({ message: 'User not found' });
    
    let getUserDetails = existingUser.rows[0]
  
    bcrypt.compare(password, getUserDetails.password, async (err, result) => {
        if (err || !result)  return res.status(401).json({ message: 'Authentication failed' });
  
        const token = jwt.sign({ username }, secretKey, { expiresIn: '5m' });

        await pool.query(`UPDATE public.users SET token = $1, last_login_at = NOW() WHERE id = $2`, [token, username])

        res.status(200).json({ message: 'Authentication successful', token });
    });
})

router.get('/v2/protected', verifyToken, (req, res) => {
    res.json({
        status: 'success',
        message: 'This is protected route. If you see this means your token is valid.'
    })
})

router.get('/v2/user/logout', verifyToken,  async (req, res) => {
    const decodedToken = req.decodedToken;

    const isTokenExist = await pool.query(`SELECT token FROM public.users WHERE id = $1`, [decodedToken.username])
    if (isTokenExist.rows.length == 0 ) { return res.json({ message: "User already logged out."}) }

    await pool.query(`UPDATE public.users SET token = NULL WHERE id = $1`, [decodedToken.username])

    return res.json({
        message: `User ${decodedToken.username} successfully logout.`
    })

    //Optional: You can always implement on how to blacklist the token from being used again within its token expiration time to stregthen the security
    //          OR simulate a logout by setting a short token expiration time etc
})

module.exports = router