const functions = require('firebase-functions');
const app = require('express')();
const cbAuth = require('./util/cbAuth');
const { getAllPosts, createPost } = require('./handlers/posts');
const { signUp, logIn, uploadImage } = require('./handlers/users');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

//Get all posts
app.get('/posts', getAllPosts);
//Create a single post
app.post('/posts', cbAuth, createPost);
//Sign-up Route
app.post('/signup', signUp);
//Login Route
app.post('/login', logIn);
//User Image Upload
app.post('/user/image', cbAuth, uploadImage);

exports.api = functions.https.onRequest(app);
