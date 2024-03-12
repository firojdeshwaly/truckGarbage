require('custom-env').env('api');
const express = require('express');
const cors = require('cors');

const app = express();
const bodyParser = require('body-parser');
require('express-async-errors');
const { Response } = require('../../lib/http-response');
const mongoose = require('mongoose');
const { Joi, validate } = require('./util/validations');
const { __, languages } = require('./i18n');
const { enums: { Platform } } = require('../../app/models');
const flash = require('connect-flash');
var nodeMailer = require('nodemailer');
var FCM = require('fcm-node');
var serverKey = process.env.SERVER_KEY
var fcm = new FCM(serverKey);
//require('dotenv').config();

console.log(process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false });
mongoose.set('debug', process.env.NODE_ENV === 'development');

global.ObjectId = mongoose.Types.ObjectId;

app.use(cors())
app.use(require('compression')());
const path = require('path');
const engine = require('ejs-locals');
app.use(express.static(path.join(__dirname, 'static')));

app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
if (process.env.NODE_ENV === 'development') {
    const swaggerUi = require('swagger-ui-express');
    //const YAML = require('yamljs');
    //const swaggerDocument = YAML.load('./src/api/docs/swagger.yaml');
    const swaggerDocument = require('./docs/swagger.json');

    const path = require('path');
    app.use(express.static(path.join(__dirname, 'static')));
    app.use(
        '/docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument, {
            customfavIcon: '/fav32.png',
            customSiteTitle: 'Garbage Collector',
            authorizeBtn: false,
            swaggerOptions: {
                filter: true,
                displayRequestDuration: true,
            },
        })
    );
}

app.use((req, res, next) => {
    /*res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, Referer, User-Agent, X-Requested-With, Content-Type, Accept, Authorization, Accept-Language, Pragma, Cache-Control, Expires, If-Modified-Since, X-Delivery-Drop-Platform, X-Delivery-Drop-Version'
    );*/


    //res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
    if (req.method === 'OPTIONS') {
        return res.status(204).send('OK');
    }
    next();
});

app.use((req, res, next) => {
    req.__ = __;
    for (const method in Response) {
        if (Response.hasOwnProperty(method)) res[method] = Response[method];
    }
    next();
});

app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
const headerValidations = Joi.object()
    .keys({

        'x-hrms-version': Joi.string()
            .regex(/^[\d]+\.[\d]+\.[\d]+$/, 'Semantic Version')
            .required(),
        'accept-language': Joi.string()
            .valid(...Object.keys(languages))
            .required(),
    })
    .required();

app.use((req, res, next) => {
    let x = req.url.split("/")
    if (x && x[1] == 'authpage') {
        //req.__ = 'en';
        res.locals.siteUrl = `${req.protocol}://${req.get('host')}`;
        res.locals.siteTitle = process.env.SITE_TITLE;
        res.locals.DM = __;
        res.locals.s3Base = process.env.AWS_S3_BASE;
        return next();
    } else {
        //validate(headerValidations, 'headers', {allowUnknown: true})(req, res, next);
        return next();
    }


});

app.use('/', require('./routes'));
app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    // console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    if (err.message === 'EntityNotFound') {
        return res.notFound('', req.__('NOT_FOUND'));
    }

    return res.status(err.status || 500).send({
        success: false,
        data: {},
        message: req.__('GENERAL_ERROR'),
    });
});

app.use(function (req, res) {
    return res.status(404).send({
        success: false,
        data: [],
        message: req.__('NOT_FOUND_ERR'),
    });
});


/***
    update working today true on 24:00
*/



const port = process.env.PORT || 3000;
let server;
if (process.env.SERVER_MODE === 'https') {
    const https = require('https');
    const fs = require('fs');
    const privateKey = fs.readFileSync("./ssl_keys/privkey.pem", "utf8");
    const certificate = fs.readFileSync("./ssl_keys/cert.pem", "utf8");
    const ca = fs.readFileSync("./ssl_keys/chain.pem", "utf8");
    var credentials = { key: privateKey, cert: certificate, ca: ca };
    server = https.createServer(credentials, app);

} else {
    const http = require('http')
    server = http.createServer(app);
}

server.listen(port, function () {
    // eslint-disable-next-line no-console
    console.info(`Server Started on port ${port}`);
});


const {
    models: {
        User, Chat, Booking, JoinGroup
    },
} = require('../../app/models');

const io = require("socket.io")(server, {
    allowEIO3: true,
});
io.on('connection', socket => {

    io.to(socket.id).emit('message', '---------socket is connected-----------');

    socket.on('joinHome', async (data, callback) => {
        let roomId = data.roomId;
        socket.join(roomId);
    });


    socket.on('send_request', async (data, callback) => {
        try {


            const { userId, yardId, userLoc,weight,}=data;

            sendMessage(receiver, sender, msg, type).then((data) => {
                socket.to(receiver).emit('receive_message', { data });
                return callback({data: data})
            })

        } catch (err) {
            console.log(err);
        }
    });
    socket.on('accept_request', async (data, callback) => {
        try {

            let sender = ObjectId(data.sender);
            let receiver = ObjectId(data.receiver);
            let type = data.type;


            if (type === 'SINGLE') {
                await Chat.updateMany({ receiverId: sender, senderId: receiver }, { read: true });
            } else if (type === 'GROUP') {
                await Chat.updateMany({ groupId: receiver }, { $push: { readersArray: sender } });
            }


            let CHATS = await Chat.aggregate([
                {
                    $match: {
                        $or: [{ $or: [{ receiverId: receiver, senderId: sender }, { receiverId: sender, senderId: receiver }] }, { groupId: receiver }]
                    }
                },
                {

                    "$lookup": {
                        "from": "users",
                        "localField": "senderId",
                        "foreignField": "_id",
                        "as": "Sender"
                    }

                },
                {
                    $unwind: {
                        path: "$Sender"
                    }
                },
                {
                    $project: {
                        isSuspended: 1,
                        participants: 1,
                        read: 1,
                        senderId: 1,
                        receiverId: 1,
                        msg: 1,
                        groupId: 1,
                        created: 1,
                        updated: 1,
                        __v: 1,
                        "sendName": "$Sender.name",
                        "sendAvatar": "$Sender.avatar"
                    }
                }

            ])

            let chats = [];
            if (CHATS.length > 0) {
                CHATS.map(function (chat) {

                    if (chat.participants.includes(sender.toString())) {
                        chats.push(chat)
                    } else { }
                })
            }

            return callback({ data: chats })
        } catch (err) {
            console.log(err);
        }
    });
    socket.on('joinNavigation', async (data, callback) => {
        let userId = data.userId;
        let bookingId = data.bookingId;



        let user = await User.findOne({ _id: userId });

        if (user) {

            socket.join(bookingId);

        } else {
            io.to(socket.id).emit('message', 'user not found');
        }
    });
    socket.on('update-location', async (data, callback) => {
        try {
            let bookingId = data.bookingId;
            let book = await Booking.findOne({ _id: bookingId });

            let coordinates = [data.longitude, data.latitude];
            await User.findOneAndUpdate({ _id: book.athleteId }, { $set: { "loc.coordinates": coordinates } });
            io.to(bookingId).emit('get-location', { data });
        } catch (err) {
            console.log(err);
        }
    });
    socket.on('enter_chat', async (data, callback) => {

        try {
            let sender = ObjectId(data.sender);
            let receiver = ObjectId(data.receiver);
            joinChatScreen(sender, receiver);
            return callback({})
        } catch (err) {
            console.log(err);
        }
    });
    socket.on('left_chat', async (data, callback) => {
        try {
            let sender = ObjectId(data.sender);
            let receiver = ObjectId(data.receiver);
            let r = leftChatScreen(sender, receiver);
            return callback({})
        } catch (err) {
            console.log(err);
        }
    });

});


var users = [];
var chat_screen = [];

function userJoin(id, userId, bookingId) {
    const user = { id, userId, bookingId };
    users.push(user);

    return user;
}
function joinChatScreen(senderr, receiverr) {

    let sender = senderr.toString();
    let receiver = receiverr.toString();

    let arr = [];
    if (chat_screen.length > 0) {

        chat_screen.map(x => {

            if (x.receiver === receiver && x.sender === sender) {
                arr.push(x);
            }
        });

    }



    if (arr.length > 0) { } else {

        const user = { sender, receiver };
        chat_screen.push(user);
        return user;
    }


}

function getChatScreenUserGroup(receiver) {

    let CHAT = [];

    chat_screen.map(x => {
        if (x.receiver === receiver.toString()) {
            CHAT.push(x);
        }
    });
    return CHAT;
}

function leftChatScreen(senderr, receiverr) {
    let sender = senderr.toString();
    let receiver = receiverr.toString();

    const index = chat_screen.findIndex(user => (user.sender === sender) && (user.receiver === receiver));

    if (index !== -1) {
        chat_screen.splice(index, 1)[0];
    }

}
function getChatScreenUser(sender, receiver) {
    return chat_screen.find(user => (user.sender === sender) && (user.receiver === receiver));
}
function getDupUser(userId) {
    return users.find(user => user.userId === userId);
}
function updateUser(userId, id) {
    let user = users.find(user => user.userId === userId);
    user.id = id;
}
function getCurrentUser(id) {
    return users.find(user => user.id === id);
}
function getOtherUser(id) {
    return users.find(user => user.id !== id);
}


let sendMessage = async (receiver, sender, msg, type) => {
    try {

        let chat;
        if (type === 'SINGLE') {
            let read = false;
            if (getChatScreenUser(receiver, sender)) {
                read = true;
            } else {
                let user = await User.findOne({ _id: receiver }).lean();
                let user_ = await User.findOne({ _id: sender }).lean();
                let token = user.deviceToken;
                let MSG = {
                    "to": token,
                    "notification": {
                        "sound": "default",
                        "title": `${user_.name} has sent you a chat`,
                        "body": `${msg}`,
                    }

                }

                if (user?.isNotification) {
                    fcm.send(MSG, function (err, response) {
                        if (err) {
                            console.log('Something has gone wrong!' + err);
                        } else {
                            console.log('Successfully sent with response: ', response);
                        }
                    });

                }
            }

            let participants = [sender, receiver];
            chat = new Chat({
                senderId: sender,
                receiverId: receiver,
                msg,
                participants,
                read
            });
        } else if (type === 'GROUP') {
            let users = await JoinGroup.find({ gpId: ObjectId(receiver) }).lean();
            let participants = users.map(R => {
                return R.userId;
            });
            let user_ = await User.findOne({ _id: sender }).lean();

            let GROUP_USERS = getChatScreenUserGroup(receiver);
            let readersArray = GROUP_USERS.map(r => r.sender);

            let USERS = [];
            participants.map(e => {
                if (readersArray.includes(e.toString())) { } else {
                    USERS.push(e);
                }
            });

            let USERS_TO = await User.find({ _id: { $in: USERS }, isNotification: true }).lean();
            let TOKEN = [];
            if (USERS_TO.length > 0) {
                USERS_TO.map(k => {
                    TOKEN.push(k.deviceToken);
                })
            }


            let MSG = {
                "registration_ids": TOKEN,
                "notification": {
                    "sound": "default",
                    "title": `${user_.name} has sent you a chat`,
                    "body": `${msg}`,
                }

            }

            fcm.send(MSG, function (err, response) {
                if (err) {
                    console.log('Something has gone wrong!' + err);
                } else {
                    console.log('Successfully sent with response: ', response);
                }
            });


            chat = new Chat({
                senderId: sender,
                groupId: receiver,
                msg,
                participants,
                readersArray
            });
        }

        await chat.save();

        let CHATS = await Chat.aggregate([
            {
                $match: {
                    $or: [{ $or: [{ receiverId: ObjectId(receiver), senderId: ObjectId(sender) }, { receiverId: ObjectId(sender), senderId: ObjectId(receiver) }] }, { groupId: ObjectId(receiver) }]
                }
            },
            {

                "$lookup": {
                    "from": "users",
                    "localField": "senderId",
                    "foreignField": "_id",
                    "as": "Sender"
                }

            },
            {
                $unwind: {
                    path: "$Sender"
                }
            },
            {
                $project: {
                    isSuspended: 1,
                    participants: 1,
                    read: 1,
                    senderId: 1,
                    receiverId: 1,
                    msg: 1,
                    groupId: 1,
                    created: 1,
                    updated: 1,
                    __v: 1,
                    "sendName": "$Sender.name",
                    "sendAvatar": "$Sender.avatar"
                }
            }
        ])

        let chats = [];
        if (CHATS.length > 0) {
            CHATS.map(function (chat) {

                if (chat.participants.includes(sender.toString())) {

                    chats.push(chat)
                } else { }
            })
        }
        return chats;

    } catch (err) {
        console.log(err)
    }
}



