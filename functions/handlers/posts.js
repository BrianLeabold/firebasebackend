const { db } = require('../util/admin');

exports.getAllPosts = (req, res) => {
  db.collection('posts')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let posts = [];
      data.forEach(doc => {
        posts.push({
          postId: doc.id,
          body: doc.data().body,
          userName: doc.data().userName,
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount,
          userImage: doc.data().userImage
        });
      });
      return res.json(posts);
    })
    .catch(err => console.error(err));
};

exports.createPost = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(400).json({ errmsg: 'That method is not allowed' });
  }
  if (req.body.body.trim() === '') {
    return res.status(400).json({ body: 'Can not be empty' });
  }
  const newPost = {
    body: req.body.body,
    userName: req.user.name,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };
  db.collection('posts')
    .add(newPost)
    .then(doc => {
      const resPost = newPost;
      resPost.postId = doc.id;
      res.json(resPost);
    })
    .catch(err => {
      res.status(500).json({ errmsg: 'something went wrong' });
      console.error(err);
    });
};

exports.getPost = (req, res) => {
  let postData = {};
  db.doc(`/posts/${req.params.postId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      postData = doc.data();
      postData.postId = doc.id;
      return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('postId', '==', req.params.postId)
        .get();
    })
    .then(data => {
      postData.comments = [];
      data.forEach(doc => {
        postData.comments.push(doc.data());
      });
      return res.json(postData);
    })
    .catch(err => {
      res.status(500).json({ errmsg: 'something went wrong' });
      console.error(err);
    });
};
//Comment on post
exports.commentOnPost = (req, res) => {
  if (req.body.body.trim() === '')
    return res.status(400).json({ comment: 'Must not be empty' });
  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    postId: req.params.postId,
    userName: req.user.name,
    userImage: req.user.imageUrl
  };

  db.doc(`/posts/${req.params.postId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ comment: 'Post not found' });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection('comments').add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch(err => {
      res.status(500).json({ errmsg: error.code });
      console.error(err);
    });
};

//Like a Post
exports.likePost = (req, res) => {
  const likeDoc = db
    .collection('likes')
    .where('userName', '==', req.user.name)
    .where('postId', '==', req.params.postId)
    .limit(1);
  const postDoc = db.doc(`/posts/${req.params.postId}`);
  let postData;

  postDoc
    .get()
    .then(doc => {
      if (doc.exists) {
        postData = doc.data();
        postData.postId = doc.id;
        return likeDoc.get();
      } else {
        return res.status(404).json({ errmsg: 'Post not found' });
      }
    })
    .then(data => {
      if (data.empty) {
        return db
          .collection('likes')
          .add({
            postId: req.params.postId,
            userName: req.user.name
          })
          .then(() => {
            postData.likeCount++;
            return postDoc.update({ likeCount: postData.likeCount });
          })
          .then(() => {
            return res.json(postData);
          });
      } else {
        return res.status(400).json({ errmsg: 'You already liked this' });
      }
    })
    .catch(err => {
      res.status(500).json({ errmsg: error.code });
      console.error(err);
    });
};

//Unlike a post
exports.unlikePost = (req, res) => {
  const likeDoc = db
    .collection('likes')
    .where('userName', '==', req.user.name)
    .where('postId', '==', req.params.postId)
    .limit(1);
  const postDoc = db.doc(`/posts/${req.params.postId}`);
  let postData;

  postDoc
    .get()
    .then(doc => {
      if (doc.exists) {
        postData = doc.data();
        postData.postId = doc.id;
        return likeDoc.get();
      } else {
        return res.status(404).json({ errmsg: 'Post not found' });
      }
    })
    .then(data => {
      if (data.empty) {
        return res.status(400).json({ errmsg: 'You didn`t like this' });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            postData.likeCount--;
            return postDoc.update({ likeCount: postData.likeCount });
          })
          .then(() => {
            res.json(postData);
          });
      }
    })
    .catch(err => {
      res.status(500).json({ errmsg: error.code });
      console.error(err);
    });
};

// Delete a scream
exports.deletePost = (req, res) => {
  const document = db.doc(`/posts/${req.params.postId}`);
  document
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Post not found' });
      }
      if (doc.data().userName !== req.user.name) {
        return res.status(403).json({ error: 'Unauthorized' });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: 'Post deleted successfully' });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
