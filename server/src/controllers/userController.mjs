import User from '../models/users.mjs';
import generateToken from '../config/generateToken.mjs';

const registerUser = async (req, res) => {
    console.log(req.body); // q: why is this undefined?
    //a : because we are not parsing the body of the request
    //q : how to parse the body of the request?
    //a : by using the body-parser middleware
    //q : give me the code for that
    //a : app.use(express.json()) in app.mjs

    const {name, password, email} = req.body;
    if (!name || !email || !password) {
        res.status(400).json({message: "Please fill all the fields"});
    }

    const userExist = await User.findOne({email : email});

    if (userExist) {
        res.status(400).json({message: "User already exists"});
    }

    const user = new User({
        name,
        email,
        password
    });

    try {
        res.status(201).json({
            _id : user._id,
            name : user.name,
            email : user.email,
            token : generateToken(user._id)
        })
    } catch (error) {
        res.status(500).json({message: "Something went wrong"});
    }
}

export default registerUser;