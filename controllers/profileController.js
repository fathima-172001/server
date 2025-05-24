import User from '../models/User.js';

// Get user profile
export const getProfile = async (req, res) => {
    try {
        // req.user.id comes from the verifyToken middleware
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const { username, email, location, skills, experience, phone, address } = req.body;

        // Find user and update
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields if they are provided
        if (username) user.username = username;
        if (email) user.email = email;
        if (location) user.location = location;
        if (skills) user.skills = skills;
        if (experience) user.experience = experience;
        if (phone) user.phone = phone;
        if (address) user.address = address;

        await user.save();

        // Return updated user without password
        const updatedUser = await User.findById(req.user.id).select('-password');
        res.json(updatedUser);
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update avatar
export const updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update avatar URL
        const avatarUrl = `/uploads/${req.file.filename}`;
        user.avatar = avatarUrl;
        await user.save();

        res.json({ 
            message: 'Avatar updated successfully',
            avatar: avatarUrl
        });
    } catch (error) {
        console.error('Error in updateAvatar:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 