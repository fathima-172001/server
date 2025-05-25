import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Post from '../models/Post.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for post images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Get all posts with populated comments and replies
router.get('/', authenticateToken, async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('userId', 'username avatar')
            .populate({
                path: 'comments',
                populate: [
                    {
                        path: 'userId',
                        select: 'username avatar'
                    },
                    {
                        path: 'replies',
                        populate: {
                            path: 'userId',
                            select: 'username avatar'
                        }
                    }
                ]
            })
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a post
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        let tags = [];
        
        // Parse tags if they exist
        if (req.body.tags) {
            try {
                tags = JSON.parse(req.body.tags);
            } catch (err) {
                console.error('Error parsing tags:', err);
            }
        }

        // Validate content
        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const post = new Post({
            userId: req.user.id,
            content: content.trim(),
            tags,
            image: req.file ? `/uploads/${req.file.filename}` : null
        });

        const savedPost = await post.save();
        const populatedPost = await Post.findById(savedPost._id)
            .populate('userId', 'username avatar');

        res.status(201).json(populatedPost);
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(400).json({ message: err.message });
    }
});

// Like/Unlike a post
router.post('/:id/like', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const likeIndex = post.likes.indexOf(req.user.id);
        if (likeIndex === -1) {
            post.likes.push(req.user.id);
        } else {
            post.likes.splice(likeIndex, 1);
        }

        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a comment
router.post('/:id/comments', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        post.comments.push({
            userId: req.user.id,
            content: req.body.content,
            likes: [],
            replies: []
        });

        const updatedPost = await post.save();
        const populatedPost = await Post.findById(updatedPost._id)
            .populate('userId', 'username avatar')
            .populate({
                path: 'comments',
                populate: [
                    {
                        path: 'userId',
                        select: 'username avatar'
                    },
                    {
                        path: 'replies',
                        populate: {
                            path: 'userId',
                            select: 'username avatar'
                        }
                    }
                ]
            });
            
        res.status(201).json(populatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Add a reply to a comment
router.post('/:postId/comments/:commentId/replies', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        comment.replies.push({
            userId: req.user.id,
            content: req.body.content,
            likes: []
        });

        const updatedPost = await post.save();
        const populatedPost = await Post.findById(updatedPost._id)
            .populate('userId', 'username avatar')
            .populate({
                path: 'comments',
                populate: [
                    {
                        path: 'userId',
                        select: 'username avatar'
                    },
                    {
                        path: 'replies',
                        populate: {
                            path: 'userId',
                            select: 'username avatar'
                        }
                    }
                ]
            });

        res.status(201).json(populatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Like/Unlike a comment
router.post('/:postId/comments/:commentId/like', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const likeIndex = comment.likes.indexOf(req.user.id);
        if (likeIndex === -1) {
            comment.likes.push(req.user.id);
        } else {
            comment.likes.splice(likeIndex, 1);
        }

        const updatedPost = await post.save();
        const populatedPost = await Post.findById(updatedPost._id)
            .populate('userId', 'username avatar')
            .populate({
                path: 'comments',
                populate: [
                    {
                        path: 'userId',
                        select: 'username avatar'
                    },
                    {
                        path: 'replies',
                        populate: {
                            path: 'userId',
                            select: 'username avatar'
                        }
                    }
                ]
            });

        res.json(populatedPost);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Like/Unlike a reply
router.post('/:postId/comments/:commentId/replies/:replyId/like', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ message: "Reply not found" });
        }

        const likeIndex = reply.likes.indexOf(req.user.id);
        if (likeIndex === -1) {
            reply.likes.push(req.user.id);
        } else {
            reply.likes.splice(likeIndex, 1);
        }

        const updatedPost = await post.save();
        const populatedPost = await Post.findById(updatedPost._id)
            .populate('userId', 'username avatar')
            .populate({
                path: 'comments',
                populate: [
                    {
                        path: 'userId',
                        select: 'username avatar'
                    },
                    {
                        path: 'replies',
                        populate: {
                            path: 'userId',
                            select: 'username avatar'
                        }
                    }
                ]
            });

        res.json(populatedPost);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Save/Unsave a post
router.post('/:id/save', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const saveIndex = post.savedBy.indexOf(req.user.id);
        if (saveIndex === -1) {
            post.savedBy.push(req.user.id);
        } else {
            post.savedBy.splice(saveIndex, 1);
        }

        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Share a post
router.post('/:id/share', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (!post.shares.includes(req.user.id)) {
            post.shares.push(req.user.id);
            await post.save();
        }

        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get saved posts for a user
router.get('/saved', authenticateToken, async (req, res) => {
    try {
        const savedPosts = await Post.find({ savedBy: req.user.id })
            .populate('userId', 'username avatar')
            .populate('comments.userId', 'username avatar')
            .sort({ createdAt: -1 });
        res.json(savedPosts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user's shared posts
router.get('/shared', authenticateToken, async (req, res) => {
    try {
        const sharedPosts = await Post.find({
            'shares.userId': req.user.id,
            isDeleted: false
        })
        .populate('userId', 'username avatar')
        .populate({
            path: 'comments',
            match: { isDeleted: false },
            populate: [
                {
                    path: 'userId',
                    select: 'username avatar'
                },
                {
                    path: 'replies',
                    match: { isDeleted: false },
                    populate: {
                        path: 'userId',
                        select: 'username avatar'
                    }
                }
            ]
        })
        .sort({ 'shares.sharedAt': -1 });
        res.json(sharedPosts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Edit post
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to edit this post" });
        }

        // Save current version to edit history
        post.editHistory.push({
            content: post.content,
            tags: post.tags,
            editedAt: new Date()
        });

        // Update post
        post.content = req.body.content;
        post.tags = req.body.tags;

        const updatedPost = await post.save();
        const populatedPost = await Post.findById(updatedPost._id)
            .populate('userId', 'username avatar')
            .populate({
                path: 'comments',
                match: { isDeleted: false },
                populate: [
                    {
                        path: 'userId',
                        select: 'username avatar'
                    },
                    {
                        path: 'replies',
                        match: { isDeleted: false },
                        populate: {
                            path: 'userId',
                            select: 'username avatar'
                        }
                    }
                ]
            });

        res.json(populatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete post (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this post" });
        }

        post.isDeleted = true;
        await post.save();
        res.json({ message: "Post deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Edit comment
router.put('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to edit this comment" });
        }

        // Save current version to edit history
        comment.editHistory.push({
            content: comment.content,
            editedAt: new Date()
        });

        // Update comment
        comment.content = req.body.content;

        const updatedPost = await post.save();
        const populatedPost = await Post.findById(updatedPost._id)
            .populate('userId', 'username avatar')
            .populate({
                path: 'comments',
                match: { isDeleted: false },
                populate: [
                    {
                        path: 'userId',
                        select: 'username avatar'
                    },
                    {
                        path: 'replies',
                        match: { isDeleted: false },
                        populate: {
                            path: 'userId',
                            select: 'username avatar'
                        }
                    }
                ]
            });

        res.json(populatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete comment (soft delete)
router.delete('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this comment" });
        }

        comment.isDeleted = true;
        const updatedPost = await post.save();
        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Edit reply
router.put('/:postId/comments/:commentId/replies/:replyId', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ message: "Reply not found" });
        }

        if (reply.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to edit this reply" });
        }

        // Save current version to edit history
        reply.editHistory.push({
            content: reply.content,
            editedAt: new Date()
        });

        // Update reply
        reply.content = req.body.content;

        const updatedPost = await post.save();
        const populatedPost = await Post.findById(updatedPost._id)
            .populate('userId', 'username avatar')
            .populate({
                path: 'comments',
                match: { isDeleted: false },
                populate: [
                    {
                        path: 'userId',
                        select: 'username avatar'
                    },
                    {
                        path: 'replies',
                        match: { isDeleted: false },
                        populate: {
                            path: 'userId',
                            select: 'username avatar'
                        }
                    }
                ]
            });

        res.json(populatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete reply (soft delete)
router.delete('/:postId/comments/:commentId/replies/:replyId', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ message: "Reply not found" });
        }

        if (reply.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this reply" });
        }

        reply.isDeleted = true;
        const updatedPost = await post.save();
        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user's posts
router.get('/user', authenticateToken, async (req, res) => {
    try {
        const userPosts = await Post.find({
            userId: req.user.id,
            isDeleted: false
        })
        .populate('userId', 'username avatar')
        .populate({
            path: 'comments',
            match: { isDeleted: false },
            populate: [
                {
                    path: 'userId',
                    select: 'username avatar'
                },
                {
                    path: 'replies',
                    match: { isDeleted: false },
                    populate: {
                        path: 'userId',
                        select: 'username avatar'
                    }
                }
            ]
        })
        .sort({ createdAt: -1 });
        res.json(userPosts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router; 