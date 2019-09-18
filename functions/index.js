const functions = require('firebase-functions');
const app = require('express')();
const cbAuth = require('./util/cbAuth');
const { getAllPosts, createPost, getPost } = require('./handlers/posts');
const {
  signUp,
  logIn,
  uploadImage,
  addUserDetails,
  getAuthUser
} = require('./handlers/users');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

//Get all posts
app.get('/posts', getAllPosts);
//Create a single post
app.post('/posts', cbAuth, createPost);
// Get a single post
app.get('/posts/:postId', getPost);
// TODO: delete post
// TODO: like post
// TODO: unlike post
// TODO: comment on post
//Sign-up Route
app.post('/signup', signUp);
//Login Route
app.post('/login', logIn);
//User Image Upload
app.post('/user/image', cbAuth, uploadImage);
// Add User Details
app.post('/user', cbAuth, addUserDetails);
// Get User details
app.get('/user', cbAuth, getAuthUser);

exports.api = functions.https.onRequest(app);
