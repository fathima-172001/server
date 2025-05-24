import bcrypt from "bcryptjs";
import Post from "../models/Post.js";

// GET all posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'username avatar')
      .populate('likes', 'username')
      .populate('comments.userId', 'username avatar');
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
};

// ADD a new post
export const addPosts = async (req, res) => {
  try {
    const { title, description, password, role } = req.body;

    if (!title || !description || !password) {
      return res.status(400).json({ message: "Title, description, and password are required" });
    }

    const existingPost = await Post.findOne({ title });
    if (existingPost) {
      return res.status(400).json({ message: "Post with this title already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newPost = new Post({
      title,
      description,
      password: hashedPassword,
      role: role || 'mentee'
    });

    const savedPost = await newPost.save();
    res.status(201).json({ message: "Post created successfully", data: savedPost });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Error creating post", error: error.message });
  }
};

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content, tags } = req.body;
    const userId = req.user.id; // From auth middleware

    let image = null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const post = new Post({
      userId,
      content,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      image
    });

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'username avatar');

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
};

// Get a single post
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'username avatar')
      .populate('likes', 'username')
      .populate('comments.userId', 'username avatar');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching post', error: error.message });
  }
};

// Like/Unlike a post
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling like', error: error.message });
  }
};

// Add comment to a post
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      userId: req.user.id,
      content
    });

    await post.save();
    
    const updatedPost = await Post.findById(req.params.id)
      .populate('userId', 'username avatar')
      .populate('likes', 'username')
      .populate('comments.userId', 'username avatar');

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};
