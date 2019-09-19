const functions = require('firebase-functions');
const app = require('express')();
const cbAuth = require('./util/cbAuth');
const { db } = require('./util/admin');
const {
  getAllPosts,
  createPost,
  getPost,
  commentOnPost,
  likePost,
  unlikePost,
  deletePost
} = require('./handlers/posts');
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
app.post('/post', cbAuth, createPost);
// Get a single post
app.get('/post/:postId', getPost);
// TODO: delete post
app.delete('/post/:postId', cbAuth, deletePost);
// Like post
app.get('/post/:postId/like', cbAuth, likePost);
// TODO: unlike post
app.get('/post/:postId/unlike', cbAuth, unlikePost);
// Comment on post
app.post('/post/:postId/comment', cbAuth, commentOnPost);
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

//Like Notifications
exports.createNotifOnLike = functions.firestore
  .document('/likes/{id}')
  .onCreate(snapshot => {
    db.doc(`/posts/${snapshot.data().postId}`)
      .get()
      .then(doc => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userName,
            sender: snapshot.data().userName,
            type: 'like',
            read: false,
            postId: doc.id
          });
        }
      })
      .then(() => {
        return;
      })
      .catch(err => {
        res.status(500).json({ errmsg: error.code });
        console.error(err);
        return;
      });
  });
//Delete Notification(Unlike)
exports.deleteNotifonUnlike = functions.firestore
  .document('/likes/{id}')
  .onDelete(snapshot => {
    db.doc(`/notifications/${snapshot.id}`)
      .delete()
      .then(() => {
        return;
      })
      .catch(err => {
        res.status(500).json({ errmsg: error.code });
        console.error(err);
        return;
      });
  });

//Comment Notifications
exports.createNotifOnComment = functions.firestore
  .document('/comments/{id}')
  .onCreate(snapshot => {
    db.doc(`/posts/${snapshot.data().postId}`)
      .get()
      .then(doc => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userName,
            sender: snapshot.data().userName,
            type: 'comment',
            read: false,
            postId: doc.id
          });
        }
      })
      .then(() => {
        return;
      })
      .catch(err => {
        res.status(500).json({ errmsg: error.code });
        console.error(err);
        return;
      });
  });
