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
  getAuthUser,
  getUserDetails,
  markNotifsRead
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
// Get our own User details
app.get('/user', cbAuth, getAuthUser);
// Get User details
app.get('/user/:userName', getUserDetails);

app.post('/notifications', cbAuth, markNotifsRead);

exports.api = functions.https.onRequest(app);

//Like Notifications
exports.createNotifOnLike = functions.firestore
  .document('/likes/{id}')
  .onCreate(snapshot => {
    return db
      .doc(`/posts/${snapshot.data().postId}`)
      .get()
      .then(doc => {
        if (doc.exists && doc.data().userName !== snapshot.data().userName) {
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
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
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
    return db
      .doc(`/posts/${snapshot.data().postId}`)
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
      .catch(err => {
        res.status(500).json({ errmsg: error.code });
        console.error(err);
        return;
      });
  });

// Update User image across all posts in the event they change it

exports.onUserImageChange = functions.firestore
  .document('/users/{userId}')
  .onUpdate(change => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      let batch = db.batch();
      return db
        .collection('posts')
        .where('userName', '==', change.before.data().userName)
        .get()
        .then(data => {
          data.forEach(doc => {
            const post = db.doc(`/posts/${doc.id}`);
            batch.update(post, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

//DELETE all comments, likes, and notifications if a post is deleted
exports.onPostDelete = functions.firestore
  .document('/posts/{postId}')
  .onDelete((snapshot, context) => {
    const postId = context.params.postId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('postId', '==', postId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
          .collection('likes')
          .where('postId', '==', postId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection('notifications')
          .where('postId', '==', postId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });