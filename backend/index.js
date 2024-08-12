const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()
app.use(cors())
app.use(express.json())  // To parse JSON request bodies

const PORT = process.env.PORT || 8080

// Schema definition with validation
const schemaData = mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 2
    },
    age: {
        type: Number,
        required: true,
        min: 0,
        max: 120
    },
    dateOfBirth: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                return value instanceof Date && !isNaN(value);
            },
            message: 'Invalid date format'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 10,
        validate: {
            validator: function(value) {
                // Ensure password has at least one letter and one number
                return /[a-zA-Z]/.test(value) && /\d/.test(value);
            },
            message: 'Password must be alphanumeric and at least 10 characters long'
        }
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Other']
    },
    about: {
        type: String,
        maxlength: 5000
    }
})

// Model creation
const User = mongoose.model('User', schemaData)

app.get("/", async (req, res) => {
    try {
        const data = await User.find({})  // Fetch all user records
        res.json({ success: true, data: data })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

app.post("/create", async (req, res) => {
    try {
        const { name, age, dateOfBirth, gender, password, about } = req.body;

        // Check if the user already exists based on the unique fields (e.g., name, age, and date of birth)
        const existingUser = await User.findOne({ name, age, dateOfBirth });

        if (existingUser) {
            return res.status(409).json({ success: false, message: "User already exists" });
        }

        const user = new User({ name, age, dateOfBirth, gender, password, about });
        await user.save(); // Save the user to the database
        res.status(201).json({ success: true, message: "User saved successfully", data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});



app.put("/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, user_id } = req.body;
        const updatedUser = await User.findByIdAndUpdate(id,{ name, user_id }, {
            new: true,
            runValidators: true
        });

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "User updated successfully", user: updatedUser });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete a user by user_id
app.delete("/delete/:id", async (req, res) => {
    try {
        const userId = req.params.id;  // Get the ID from the request parameters
        console.log(`Attempting to delete user with _id: ${userId}`);  // Debugging line
        
        const result = await User.findByIdAndDelete(userId);  // Delete the user by _id
        
        if (!result) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});




mongoose.connect("mongodb://127.0.0.1:27017/crudoperation")
    .then(() => {
        console.log("Connected to DB")
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
    })
    .catch((err) => console.log(err))
