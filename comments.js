// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Store comments
const commentsByPostId = {};

// Handle comment creation
app.post('/posts/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  // Get comments for post
  const comments = commentsByPostId[id] || [];
  // Create comment
  const comment = { id: generateId(), content, status: 'pending' };
  // Add comment to comments
  comments.push(comment);
  // Update comments
  commentsByPostId[id] = comments;
  // Emit event
  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: { ...comment, postId: id },
  });
  // Return comment
  res.status(201).send(comments);
});

// Handle event
app.post('/events', async (req, res) => {
  const { type, data } = req.body;
  if (type === 'CommentModerated') {
    const { postId, id, status, content } = data;
    // Get comments for post
    const comments = commentsByPostId[postId];
    // Find comment
    const comment = comments.find((comment) => comment.id === id);
    // Update status
    comment.status = status;
    // Emit event
    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: { postId, id, status, content },
    });
  }
  res.send({});
});

// Generate comment id
const generateId = () => Math.floor(Math.random() * 1000000000);

// Start web server
app.listen(4001, () => console.log('Listening on 4001'));