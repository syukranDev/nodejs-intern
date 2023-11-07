# nodejs-intern

Nodejs training material I've created for interns, this covers routing, middleware, file-handling, token security implementation. <br>Feel free to reuse it.

Task 1: <br>Create a simple GET API server which return 'Hello World' when hit from a browser. <br>

Task 2: <br>Run a GET API nodejs server using pm2 in DEV env and log the API output using winston when hit from a browser/cURL/Postman <br>

Task 3: <br>Write an API that will view (GET) and store (POST) user details (firstName, lastName, age, address, email or more) and store into database and implement the payload validation. <br>

Task 4; <br>Create nodejs code to read and store a file into local storage and save the saved file path into database

Task 5: <br>Create a NodeJS code that will fetch external API and store the result accordingly to database, also set a cronjob to send an email containing all the saved external API result in .txt to your email for every 4 hours. <br>

Task 6: <br>Create a login system that will store username and hashed password and generated token into database, and applied the generated token to access your API via middleware. <br>

Pending: <br>
Optional Task 5b - Cronjob to saved external API to user email every 24 hours. <br>
Optional Task 6b - Create a reset password system: i.e send reset password link to user via nodemailer.
