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
          createdAt: doc.data().createdAt
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
  const newPost = {
    body: req.body.body,
    userName: req.user.userName,
    createdAt: new Date().toISOString()
  };
  db.collection('posts')
    .add(newPost)
    .then(doc => {
      res.json({ msg: `document ${doc.id} created` });
    })
    .catch(err => {
      res.status(500).json({ errmsg: 'something went wrong' });
      console.error(err);
    });
};
