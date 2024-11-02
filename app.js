const express = require('express');
const app = express();
const path = require('path');
const userModal = require("./module/userModal")
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const attandanceamodal = require('./module/attandanceamodal');
const leaveAttandanceSchema = require('./module/leaveAttandanceModal');
const multer = require('multer')


const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, "./public/images")
    },
    filename: function (req, file, cb) {
        return cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const upload = multer({ storage });



app.set('view engine', 'ejs');


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render("register");
});
app.get('/login', (req, res) => {
    res.render("login");
});
app.get('/logout', (req, res) => {
    res.cookie("token", "")
    res.send("done")
});
app.get('/userpanel', isLoggedIn, (req, res) => {
    res.render("userpanel", { message: '' })
});     
app.get('/adminpanel/report', isLoggedIn, async (req, res) => {
    const { from, to } = req.query;
  const attendance = await attandanceamodal.find({ date: { $gte: new Date(from), $lte: new Date(to) } }).populate('userId').lean();
  console.log(attendance)
    res.render("report", {attendance})
});     
app.get('/applications', async (req, res) => {
    const leaveAttandance = await leaveAttandanceSchema.find()
    console.log(leaveAttandance) 
    res.render("applications", {leaveAttandance})
});     
app.get('/userpanel/leave', (req, res) => {
    res.render("leaveAttandance", { message: "" })
});
app.get('/adminpanel', isLoggedIn, async (req, res) => {
    const allusers = await userModal.find();
    const allAttandance = await attandanceamodal.find().populate("userId").lean();
    console.log(allAttandance)
    // console.log(allusers)
    res.render("adminpanel", {allAttandance, allusers})
});
app.post('/admin/leave',isLoggedIn, async (req, res) => {
    let {userId, date} = req.body;
    let {email} = req.data;
    const user = userModal.findOne({email})
    const leave = new attandanceamodal({userId, date, status: "leave"})
    await leave.save()
    console.log(leave)
    res.redirect("/applications")
});
app.post('/adminpanel/attandance/edit', async (req, res) => {
    let { id, status, date } = req.body;
    console.log("Received data:", { id, status, date });


    // If `date` is empty or invalid, set a default date or handle accordingly
    if (!date) {
        return res.status(400).send("Date is required.");
    }
    
    // Convert date to a valid Date object
    date = new Date(date);

    try {
        await attandanceamodal.findByIdAndUpdate(id, { status, date });
        res.redirect('/adminpanel');
    } catch (error) {
        console.error("Error updating attendance:", error);
        res.status(500).send("An error occurred while updating attendance.");
    }
});


app.post('/adminpanel/attandance/delete', async (req, res) => {
    let {id} = req.body;
    const daleteAttendance = await attandanceamodal.findByIdAndDelete(id);
    // console.log(daleteAttendance)

       res.redirect('/adminpanel');
});
app.post('/leave', async (req, res) => {
    let { name, email, leaveApplication} = req.body
    const user = await userModal.findOne({ email })
    if (!user) return res.render("leaveAttandance", { message: "Correct Your Fields" })
    const leaveAttandance = await leaveAttandanceSchema.create({
        name,
        email,
        leaveApplication,
        userId: user._id
    })
        res.render("leaveAttandance", { message: "Your Application has been Successfully Submited" })

    // console.log(leaveAttandance)

});
app.get('/userpanel/view', isLoggedIn, async (req, res) => {
    let { userId } = req.data;
    const viewAttandance = await attandanceamodal.findOne({ userId })
    // console.log(viewAttandance)
    if (!viewAttandance) {
        res.send("please attendance first")
    } else {
        const viewAttandance = await attandanceamodal.findOne({ userId })
        const findAttandance = await userModal.findOne(viewAttandance.userId)
        // console.log(findAttandance)
        let attandanceArr = []
        attandanceArr.push(findAttandance)
        if (!Array.isArray(attandanceArr)) {
            return res.status(500).json({ message: 'Error fetching attendance data' });
        }
        res.render("veiwAttandance", { attandanceArr });
    }
});
app.post('/userpanel', isLoggedIn, async (req, res) => {
    let { email } = req.data;
    let { status } = req.body;
    try {
        const user = await userModal.findOne({ email });
        user.userAtandance.push(user._id)
        await user.save()

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingAttendance = await attandanceamodal.findOne({
            userId: user._id,
            date: today,
        });

        // console.log(existingAttendance)

        if (existingAttendance) {
            return res.render('userpanel', { message: `your Attendance already marked for today.`, email });
        }

        // Mark attendance
        const attendance = await attandanceamodal.create({
            userId: user._id,
            date: today,
            name: user.name,
            email: user.email,
            profile: user.imageUrl
        });

        // console.log(attendance);

        return res.render('userpanel', { message: `your Attendance marked successfully.`, email });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
});

app.post('/register', upload.single("imageUrl"), async (req, res) => {
    let { name, password, email, imageUrl } = req.body
    console.log(req.file.path)
    const userfind = await userModal.findOne({ email })
    if (userfind) return res.send("user already registered")
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
            console.log(hash)
            const createUser = await userModal.create({
                name,
                email,
                password: hash,
                imageUrl: req.file.filename,
            })
            var token = jwt.sign({ email: email, userId: createUser._id }, 'test');
            res.cookie("token", token)
            res.redirect("/userpanel")
        });
    });
});

app.post('/login', async (req, res) => {
    if (req.body.email === "admin@gmail.com" && req.body.password === "admin@") {
        res.redirect("/adminpanel");
    } else {

        const userfind = await userModal.findOne({ email: req.body.email })
        if (!userfind) return res.send("something went wrong");
        bcrypt.compare(req.body.password, userfind.password, function (err, result) {
            if (result) {
                var token = jwt.sign({ email: req.body.email, userId: userfind._id }, 'test');
                res.cookie("token", token)
                res.redirect("/userpanel")
            } else {
                res.send("something went wrong")
            }
        });
    }
});

function isLoggedIn(req, res, next) {
    if (req.cookies.token === "") {
        console.log(req.cookies.token)
        res.redirect("/login");
    }
    else {
        var decoded = jwt.verify(req.cookies.token, 'test');
        req.data = decoded
    }
    next()
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
