import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        match: /.+\@.+\..+/,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['mentor', 'mentee'],
        default: 'mentee',
    },
    location: {
        type: String,
        default: ''
    },
    skills: {
        type: [String],
        default: [],
        trim: true
    },
    experience: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    avatar: {
        type: String,
        default: ''
    },
    socialLinks: {
        github: {
            type: String,
            default: ''
        },
        linkedin: {
            type: String,
            default: ''
        },
        twitter: {
            type: String,
            default: ''
        }
    },
    bio: {
        type: String,
        default: ''
    },
    connections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

const User = mongoose.model('User', userSchema);

export default User;