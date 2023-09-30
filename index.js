const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true, // You can set this to true
}));

const admin = require('firebase-admin');
const serviceAccount = require('./key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('webmodel');
});

app.get('/signin', (req, res) => {
  res.render('signin');
});

app.post('/signinsubmit', (req,res) =>{
  const email = req.body.EmailAddress;
  const password = req.body.Password;

  db.collection('users')
    .where("email", "==", email)
    .where("password", "==", password)
    .get()
    .then((docs) => {
      if(docs.size>0){
         // User logged in successfully; retrieve their username from the database
        const userDoc = docs.docs[0]; // Assuming only one user with the provided credentials
        const loggedInUsername = userDoc.data().name;
        
        // Redirect to the home page after successful login
        res.render('webmodel', { loggedInUsername });
      }
      else{
        res.send("Login failed");
      }
    });

});

app.post('/signupsubmit', (req, res) => {
  const Username = req.body.Username;
  const email = req.body.EmailAddress;
  const password = req.body.Password;
  const repeat_password = req.body.RepeatPassword;

  // Check if the email already exists in the database
  db.collection('users')
    .where('email', '==', email)
    .get()
    .then((docs) => {
      if (!docs.empty) {
        // Email already exists, send an error message
        res.send('Email already registered. Please use a different email.');
      } else if (password === repeat_password) {
        // Passwords match, proceed with signup
        db.collection('users')
          .add({
            name: Username,
            email: email,
            password: password,
          })
          .then(() => {
            req.session.loggedInUsername = Username;
            res.redirect('signin');
          })
          .catch((error) => {
            res.send('Error: ' + error.message);
          });
      } else {
        // Passwords don't match, show an error message or redirect to the signup page
        res.send('Passwords do not match. Please try again.');
      }
    })
    .catch((error) => {
      res.send('Error: ' + error.message);
    });
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});