require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));


app.use(bodyParser.json());
const URI="mongodb://localhost:27017/final" ;

//connect to mongodb
try {
    mongoose.connect(URI, {
        useNewUrlParser: true
    });
    console.log("Connected to MongoDB");
} catch (error) {
    console.log("Error:", error);
}




const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

const ngoSchema = new mongoose.Schema({
  name: String,
  type: String,
  uniqueid: String,
  phno: Number,
  email: String,
  address: String,
  password: String,
  documents: Buffer,
  approved: { type: Boolean, default: false },
});

const foodSchema = new mongoose.Schema({
  available: Number,
  expdate: Date,
});

const restaurantSchema = new mongoose.Schema({
  name: String,
  fssai: String,
  phno: String,
  email: String,
  address: String,
  password: String,
  documents: Buffer,
  approved: { type: Boolean, default: false },
  foodpackets: [foodSchema],
});

restaurantSchema.methods.totalFood = function () {
  const sum = this.foodpackets.reduce(function (sum, foodPacket) {
    return sum + foodPacket.available;
  }, 0);
  return sum;
};

const food = mongoose.model("food", foodSchema);
const rUser = mongoose.model("rUser", restaurantSchema);
const nUser = mongoose.model("nUser", ngoSchema);

app.get("/", function (req, res) {
  rUser.find({ approved: true }, function (err, found) {
    if (!err) {
      res.render("home", { doc: found });
    } else console.log(err);
  });
});



app.post("/", function(req, res) {
    const comm = req.body.message;
    const na = req.body.nameofperson;

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'komalpardasani40@gmail.com', 
            pass: 'xyz' 
        }
    });

    var mailOptions = {
        from: 'komalpardasani40@gmail.com', 
        to: req.body.username, 
        cc: 'komalpardasani40@gmail.com',
        subject: 'Thanks for giving feedback ' + na,
        text: 'Thanks for your message you have sent to us --> ' + comm
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
            res.send('Error: ' + error); 
        } else {
            console.log("Email sent");
            res.redirect("/"); 
        }
    });
});


app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/location", function (req, res) {
  res.render("location");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/ngo/:username", function (req, res) {
  rUser.find({ approved: true }, function (err, found) {
    if (err) {
      console.log(err);
    } else {
      res.render("ngo", { doc: found, ngo: req.params.username });
    }
  });
});

app.get("/order/:x/:y/:z", function (req, res) {
  rUser.find({ fssai: req.params.z }, function (err, found) {
    if (err) {
      console.log(err);
    } else {
      res.render("order", { doc: found, ngo: req.params.y, ord: req.params.x });
    }
  });
});

app.get("/restaurant/:username", function (req, res) {
  const username = req.params.username;
  rUser.findOne({ fssai: username }, function (err, found) {
    if (!err) {
      res.render("restaurant", { restaurant: found.fssai });
    } else {
      console.log(err);
    }
  });
});

app.get("/nprofile/:username", function (req, res) {
  const username = req.params.username;
  nUser.find({ uniqueid: username }, function (err, found) {
    if (!err) {
      res.render("nprofile", { doc: found });
    } else {
      console.log(err);
    }
  });
});

app.get("/rprofile/:username", function (req, res) {
  const username = req.params.username;
  rUser.find({ fssai: username }, function (err, found) {
    if (!err) {
      res.render("rprofile", { doc: found });
    } else {
      console.log(err);
    }
  });
});

app.get("/admin", function (req, res) {
  res.render("admin");
});

app.get("/admin/ngo", function (req, res) {
  nUser.find({ approved: false }, function (err, found) {
    if (!err) res.render("napproval", { doc: found });
    else res.send("No NGOs waiting for approval");
  });
});

app.get("/admin/restaurant", function (req, res) {
  rUser.find({ approved: false }, function (err, found) {
    if (!err) res.render("rapproval", { doc: found });
    else 
    res.send("No restaurants waiting for approval");
  });
});

app.get("/approve/:z", function (req, res) {
  rUser.findOneAndUpdate(
    { _id: req.params.z },
    { $set: { approved: true } },
    function (err, user) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/admin/restaurant");
      }
    }
  );
});

app.get("/approve1/:z", function (req, res) {
  nUser.findOneAndUpdate(
    { _id: req.params.z },
    { $set: { approved: true } },
    function (err, user) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/admin/ngo");
      }
    }
  );
});

app.get("/reject1/:z", function (req, res) {
  nUser.findByIdAndRemove(req.params.z, function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/admin/ngo");
    }
  });
});

app.get("/reject/:z", function (req, res) {
  rUser.findByIdAndRemove(req.params.z, function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/admin/restaurant");
    }
  });
});

app.post("/register", function (req, res) {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const newUser = new nUser({
      name: req.body.name,
      type: req.body.type,
      uniqueid: req.body.uniqueid,
      phno: req.body.phno,
      email: req.body.email,
      address: req.body.address,
      documents: req.body.documents,
      approved: false,
      password: hash,
    });
    nUser.create(newUser, function (err) {
      if (!err) res.redirect("/");
      else {
        console.log(err);
        throw err;
      }
    });
  });
});

app.post("/register1", function (req, res) {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const newUser = new rUser({
      name: req.body.name,
      fssai: req.body.fssai,
      phno: req.body.phno,
      email: req.body.email,
      address: req.body.address,
      documents: req.body.documents,
      approved: false,
      password: hash,
    });
    rUser.create(newUser, function (err) {
      if (!err) res.redirect("/");
      else {
        console.log(err);
        throw err;
      }
    });
  });
});

app.post("/login", function (req, res) {
  const username = req.body.uniqueid;
  const password = req.body.password;
  nUser.findOne(
    { uniqueid: username, approved: true },
    function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          bcrypt.compare(password, foundUser.password, function (err, result) {
            if (result === true) {
              res.redirect("/ngo/" + username);
            }
          });
        } else {
          // res.redirect("/login");
          res.send("Please enter the right credentials");
        }
      }
    }
  );
});

app.post("/login1", function (req, res) {
  const username = req.body.fssai;
  const password = req.body.password;
  let flag = 0;
  rUser.findOne({ fssai: username, approved: true }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        bcrypt.compare(password, foundUser.password, function (err, result) {
          if (result === true) {
            flag = 1;
            res.redirect("/restaurant/" + username);
          }
        });
      } else {
        //res.redirect("/login");
        res.send("Please enter the right credentials");
      }
    }
  });
});

app.post("/ngo/:y/:z", function (req, res) {
  let order = req.body.order;
  const ord = req.body.order;
  const username = req.params.y;
  const details = req.params.z;
  rUser.findOne({ fssai: req.params.z }, function (err, found) {
    if (!err) {
      const rest = found;
      rest.foodpackets = rest.foodpackets.filter(function (packet) {
        if (packet.available <= order) {
          order -= packet.available;
          return false;
        } else {
          return true;
        }
      });
      if (rest.foodpackets.length > 0) rest.foodpackets[0].available -= order;
      rUser.findOneAndUpdate(
        { fssai: req.params.z },
        { $set: { foodpackets: rest.foodpackets } },
        function (err, found) {
          if (err) console.log(err);
          else res.redirect("/order/" + ord + "/" + username + "/" + details);
        }
      );
    }
  });
});

app.post("/restaurant", function (req, res) {
  const packets = req.body.packets;
  const expiry = req.body.expdate;

  const foods = new food({
    available: packets,
    expdate: expiry,
  });

  rUser.findOne({ fssai: req.body.rest }, function (err, found) {
    found.foodpackets.push(foods);
    found.save();
    res.redirect("/");
  });
});

app.post("/admin", function (req, res) {
  if (req.body.username === "Komal" && req.body.password === "1234") {
    res.render("check");
  } else {
    res.send("Access not authorized");
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port || 3000, function () {
  console.log("Server started on port 3000");
});
