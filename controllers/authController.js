import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Register
export const registerUser = async (req, res) => {
  try {
    console.log("Signup body received:", req.body);  
    const { username, email, password, role } = req.body;

    console.log("Parsed fields =>", { username, email, password, role });

     if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const existingUser = await User.findOne({ email });
    console.log("Existing User Check:", existingUser);

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Hashed password created");

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });

     console.log("User object to save:", user);

    await user.save();
    console.log("User saved successfully");

    // ✅ Create JWT token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({ message: "User registered successfully",
    token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });



  } catch (error) {
     console.error("Registration Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Generate token
    const token = jwt.sign(
      { _id: user._id,
         role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );


    res.status(200).json({ message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
