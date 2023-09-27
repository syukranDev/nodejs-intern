const express = require('express')
const router  = express.Router()

const validatePayload = require('../components/middleware/validatePayload')
const pool = require('../components/db/db')

// ======================================================================
// TASK 1 && TASK 2 - Simple GET and POST API to return data
// ======================================================================
//GET METHOD
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

//POST METHOD
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
router.get('/details/:email', (req, res) => {
    let userEmail = req.params.email
 
    try {
        // throw new Error('failed!')
        if (!userEmail) res.status(404).send('id is not found!')
 
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
 

// POST METHOD - Register user details
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


module.exports = router