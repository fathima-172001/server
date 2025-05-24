import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        match: /.+\@.+\..+/,
        unique: true,
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
        default: []
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
    }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

export default User;